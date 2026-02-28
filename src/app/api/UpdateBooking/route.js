import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import ConnectToDatabase from "@/modules/mongodb";
import { ObjectId } from "mongodb";
import { authOptions } from "@/modules/auth";

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

    const { db } = await ConnectToDatabase();

    const user = await db.collection("Users").findOne({ email: session.user.email });

    // Only the owner of the booking can confirm/cancel
    const booking = await db.collection("Bookings").findOne({ _id: new ObjectId(bookingId) });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.ownerId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.collection("Bookings").updateOne(
      { _id: new ObjectId(bookingId) },
      { $set: { status } }
    );

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}