import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/modules/auth";
import ConnectToDatabase from "@/modules/mongodb";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await ConnectToDatabase();

    const user = await db.collection("Users").findOne(
      { email: session.user.email },
      { projection: { balance: 1, name: 1 } }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch transaction history for this user
    const transactions = await db.collection("Transactions")
      .find({ userId: user._id })
      .sort({ createdAt: -1 })
      .toArray();

    // Earnings summary (as owner)
    const earningsSummary = await db.collection("Transactions").aggregate([
      {
        $match: {
          userId: user._id,
          type: "booking_earning",
          status: "completed",
        }
      },
      {
        $group: {
          _id: null,
          totalEarned: { $sum: "$amount" },
        }
      }
    ]).toArray();

    // Spending summary (as renter)
    const spendingSummary = await db.collection("Transactions").aggregate([
      {
        $match: {
          userId: user._id,
          type: "booking_payment",
          status: "completed",
        }
      },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: "$amount" },
        }
      }
    ]).toArray();

    return NextResponse.json({
      balance: user.balance ?? 0,
      totalEarned: earningsSummary[0]?.totalEarned ?? 0,
      totalSpent: spendingSummary[0]?.totalSpent ?? 0,
      transactions,
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";