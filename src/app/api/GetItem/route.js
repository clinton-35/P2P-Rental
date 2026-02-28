import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import ConnectToDatabase from "@/modules/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/modules/auth";

export async function GET(request) {
  const id = request.nextUrl.searchParams.get("id");

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
  }

  const { db } = await ConnectToDatabase();
  const items = db.collection("Items");
  const users = db.collection("Users");
  const user = await getServerSession(authOptions);
  const now = new Date();

  const response = {};

  const item = await items.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $inc: { views: 1 } }
  );

  if (!item) {
    return NextResponse.json({}, { status: 404 });
  }
  if (item.visibility === "private") {
    return NextResponse.json({});
  }

  // Seller name + ownership
  const sellerRes = await users.findOne({ _id: new ObjectId(item.seller) });
  item.seller_name = sellerRes.name;

  if (user) {
    const userSearch = await users.findOne({ email: user.user.email });
    item.selfOwned = item.seller.toString() === userSearch._id.toString();
  } else {
    item.selfOwned = false;
  }

  // System-determined availability
  const activeBooking = await db.collection("Bookings").findOne({
    itemId: new ObjectId(id),
    status: { $in: ["confirmed", "active"] },
    startDate: { $lte: now },
    endDate: { $gte: now },
  });
  item.isAvailable = !activeBooking;

  // Related items using Collaborative Filtering
  // Removed status: "available" — availability is now system-determined
  const allItems = await items.find({
    visibility: "public",
  }).toArray();

  // Compute isAvailable for all items in one batch lookup
  const allItemIds = allItems.map((i) => i._id);
  const activeBookings = await db.collection("Bookings").find({
    itemId: { $in: allItemIds },
    status: { $in: ["confirmed", "active"] },
    startDate: { $lte: now },
    endDate: { $gte: now },
  }).toArray();

  const bookedItemIds = new Set(activeBookings.map((b) => b.itemId.toString()));

  const related = [];
  for (const relatedItem of allItems) {
    if (relatedItem._id.toString() === id) continue;

    let score = 0;
    if (relatedItem.category === item.category) score += 3;
    for (const word of relatedItem.keywords) {
      if (item.keywords.includes(word)) score += 1;
    }
    for (const word of item.keywords) {
      if (relatedItem.keywords.includes(word)) score += 1;
    }
    for (const word of relatedItem.name.split(" ")) {
      if (item.name.split(" ").includes(word)) score += 1;
    }
    if (relatedItem.seller.toString() === item.seller.toString()) score += 1;

    if (score > 0) {
      related.push({
        ...relatedItem,
        score,
        isAvailable: !bookedItemIds.has(relatedItem._id.toString()),
      });
    }
  }

  related.sort((a, b) => b.score - a.score);
  related.splice(12);

  response.item = item;
  response.related = related;

  return NextResponse.json(response);
}