import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import ConnectToDatabase from "@/modules/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await ConnectToDatabase();

    const user = await db.collection("Users").findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Bookings where I am the renter
    const myBookings = await db.collection("Bookings").aggregate([
      { $match: { renterId: user._id } },
      {
        $lookup: {
          from: "Items",
          localField: "itemId",
          foreignField: "_id",
          as: "item",
        },
      },
      {
        $lookup: {
          from: "Users",
          localField: "ownerId",
          foreignField: "_id",
          as: "owner",
        },
      },
      { $unwind: "$item" },
      { $unwind: "$owner" },
      {
        $project: {
          _id: 1,
          status: 1,
          startDate: 1,
          endDate: 1,
          totalPrice: 1,
          message: 1,
          createdAt: 1,
          "item._id": 1,
          "item.name": 1,
          "item.images": 1,
          "owner.name": 1,
        },
      },
      { $sort: { createdAt: -1 } },
    ]).toArray();

    // Bookings where I am the owner
    const incomingBookings = await db.collection("Bookings").aggregate([
      { $match: { ownerId: user._id } },
      {
        $lookup: {
          from: "Items",
          localField: "itemId",
          foreignField: "_id",
          as: "item",
        },
      },
      {
        $lookup: {
          from: "Users",
          localField: "renterId",
          foreignField: "_id",
          as: "renter",
        },
      },
      { $unwind: "$item" },
      { $unwind: "$renter" },
      {
        $project: {
          _id: 1,
          status: 1,
          startDate: 1,
          endDate: 1,
          totalPrice: 1,
          message: 1,
          createdAt: 1,
          "item._id": 1,
          "item.name": 1,
          "item.images": 1,
          "renter.name": 1,
          "renter.image": 1,
        },
      },
      { $sort: { createdAt: -1 } },
    ]).toArray();

    return NextResponse.json({ myBookings, incomingBookings });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}