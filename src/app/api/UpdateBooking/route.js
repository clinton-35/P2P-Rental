import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/modules/auth";
import ConnectToDatabase from "@/modules/mongodb";
import { ObjectId } from "mongodb";

const PLATFORM_FEE_PERCENT = 0.02;

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId, status } = await req.json();

    if (!["confirmed", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const { client, db } = await ConnectToDatabase();
    const mongoSession = client.startSession();

    try {
      await mongoSession.withTransaction(async () => {
        const user = await db.collection("Users").findOne(
          { email: session.user.email },
          { session: mongoSession }
        );

        const booking = await db.collection("Bookings").findOne(
          { _id: new ObjectId(bookingId) },
          { session: mongoSession }
        );
        if (!booking) throw new Error("Booking not found");

        if (booking.ownerId.toString() !== user._id.toString()) {
          throw new Error("Forbidden");
        }

        // Update booking status
        await db.collection("Bookings").updateOne(
          { _id: new ObjectId(bookingId) },
          { $set: { status } },
          { session: mongoSession }
        );

        // Update the renter's transaction record
        await db.collection("Transactions").updateOne(
          { bookingId: new ObjectId(bookingId), type: "booking_payment" },
          { $set: { status: status === "confirmed" ? "completed" : "cancelled" } },
          { session: mongoSession }
        );

        if (status === "confirmed") {
          const item = await db.collection("Items").findOne(
            { _id: booking.itemId },
            { session: mongoSession }
          );

          const platformFee = booking.platformFee ??
            parseFloat((booking.totalPrice * PLATFORM_FEE_PERCENT).toFixed(2));
          const ownerEarning = booking.ownerEarning ??
            parseFloat((booking.totalPrice - platformFee).toFixed(2));

          // Create earning transaction for owner
          await db.collection("Transactions").insertOne(
            {
              userId: booking.ownerId,
              bookingId: new ObjectId(bookingId),
              itemId: booking.itemId,
              renterId: booking.renterId,
              type: "booking_earning",
              amount: ownerEarning,
              platformFee,
              description: `Earning from "${item?.name ?? "item"}" rental`,
              status: "completed",
              paymentStatus: "paid",
              createdAt: new Date(),
            },
            { session: mongoSession }
          );

          // Create platform fee transaction for admin
          await db.collection("Transactions").insertOne(
            {
              bookingId: new ObjectId(bookingId),
              itemId: booking.itemId,
              type: "platform_fee",
              amount: platformFee,
              description: `Platform fee from "${item?.name ?? "item"}" rental`,
              status: "completed",
              createdAt: new Date(),
            },
            { session: mongoSession }
          );

          // Credit owner balance
          await db.collection("Users").updateOne(
            { _id: booking.ownerId },
            { $inc: { balance: ownerEarning } },
            { session: mongoSession }
          );

          // Credit admin wallet
          await db.collection("AdminWallet").updateOne(
            {},
            {
              $inc: { balance: platformFee },
              $setOnInsert: { createdAt: new Date() },
            },
            { upsert: true, session: mongoSession }
          );
        }
      });

      return NextResponse.json({ success: true });

    } finally {
      await mongoSession.endSession();
    }

  } catch (err) {
    console.error(err);
    const knownErrors = ["Booking not found", "Forbidden"];
    if (knownErrors.includes(err.message)) {
      return NextResponse.json({ error: err.message }, { status: err.message === "Forbidden" ? 403 : 404 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}