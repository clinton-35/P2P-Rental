import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import ConnectToDatabase from "@/modules/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req) {
  console.log("CreateBooking API HIT");

  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.verified !== "verified") {
  return NextResponse.json(
    { error: "You must be verified to book items." },
    { status: 403 }
  );
}

  const body = await req.json();
  const { itemId, startDate, endDate, totalPrice, message } = body;

  if (!itemId || !startDate || !endDate || !totalPrice) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end <= start) {
    return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });
  }

  const { client, db } = await ConnectToDatabase();

  // Start a MongoDB client session for the transaction
  const mongoSession = client.startSession();

  try {
    let bookingId;

    await mongoSession.withTransaction(async () => {
      // Step 1: Get renter
      const renter = await db.collection("Users").findOne(
        { email: session.user.email },
        { session: mongoSession }
      );
      if (!renter) throw new Error("Renter not found");

      // Step 2: Get item
      const item = await db.collection("Items").findOne(
        { _id: new ObjectId(itemId) },
        { session: mongoSession }
      );
      if (!item) throw new Error("Item not found");

      // Step 3: Prevent self-booking
      if (item.seller.toString() === renter._id.toString()) {
        throw new Error("You cannot book your own item");
      }

      // Step 4: Atomic overlap check
      // Finds any booking for this item that overlaps the requested dates
      // and is not already cancelled
      const conflict = await db.collection("Bookings").findOne(
        {
          itemId: new ObjectId(itemId),
          status: { $in: ["pending", "confirmed", "active"] },
          startDate: { $lt: end },
          endDate: { $gt: start },
        },
        { session: mongoSession }
      );

      if (conflict) {
        throw new Error("These dates are already booked. Please choose different dates.");
      }

      // Step 5: Insert booking atomically
      const result = await db.collection("Bookings").insertOne(
        {
          itemId: new ObjectId(itemId),
          renterId: renter._id,
          ownerId: item.seller,
          status: "pending",
          startDate: start,
          endDate: end,
          totalPrice,
          message: message || "",
          createdAt: new Date(),
        },
        { session: mongoSession }
      );

      bookingId = result.insertedId;
    });

    return NextResponse.json({ success: true, bookingId });

  } catch (err) {
    console.error(err);

    // Surface known business logic errors cleanly to the frontend
    const knownErrors = [
      "Renter not found",
      "Item not found",
      "You cannot book your own item",
      "These dates are already booked. Please choose different dates.",
    ];

    if (knownErrors.includes(err.message)) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } finally {
    await mongoSession.endSession();
  }
}