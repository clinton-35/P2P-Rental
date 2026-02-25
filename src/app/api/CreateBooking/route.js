import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import ConnectToDatabase from "@/modules/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req) {
  console.log("CreateBooking API HIT");
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { itemId, startDate, endDate, totalPrice, message } = body;

    if (!itemId || !startDate || !endDate || !totalPrice) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { db } = await ConnectToDatabase();

    // Get renter (logged in user)
    const renter = await db.collection("Users").findOne({ email: session.user.email });
    if (!renter) {
      return NextResponse.json({ error: "Renter not found" }, { status: 404 });
    }

    // Get item to extract ownerId
    const item = await db.collection("Items").findOne({ _id: new ObjectId(itemId) });
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Prevent owner from booking their own item
    if (item.seller.toString() === renter._id.toString()) {
      return NextResponse.json({ error: "You cannot book your own item" }, { status: 403 });
    }

    const booking = {
      itemId: new ObjectId(itemId),
      renterId: renter._id,
      ownerId: item.seller,
      status: "pending",
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      totalPrice,
      message: message || "",
      createdAt: new Date(),
    };

    const result = await db.collection("Bookings").insertOne(booking);

    return NextResponse.json({ success: true, bookingId: result.insertedId });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}