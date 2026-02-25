import { NextResponse } from "next/server";
import ConnectToDatabase from "@/modules/mongodb";

export async function GET() {
  const { db } = await ConnectToDatabase();

  const now = new Date();

  const allItems = await db.collection("Items").aggregate([
    {
      $match: {
        visibility: "public",
      }
    },
    // Join bookings to check if item is currently on loan
    {
      $lookup: {
        from: "Bookings",
        let: { itemId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$itemId", "$$itemId"] },
                  { $in: ["$status", ["confirmed", "active"]] },
                  { $lte: ["$startDate", now] },
                  { $gte: ["$endDate", now] },
                ]
              }
            }
          },
          { $limit: 1 }
        ],
        as: "activeBookings"
      }
    },
    {
      $addFields: {
        isAvailable: { $eq: [{ $size: "$activeBookings" }, 0] }
      }
    },
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        images: 1,
        condition: 1,
        category: 1,
        price: 1,
        delivery: 1,
        my_location: 1,
        seller: 1,
        views: 1,
        keywords: 1,
        created_at: 1,
        isAvailable: 1,
      }
    }
  ]).toArray();

  return NextResponse.json(allItems);
}

export const dynamic = "force-dynamic";