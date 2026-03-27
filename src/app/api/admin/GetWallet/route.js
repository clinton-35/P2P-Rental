import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/modules/auth";
import ConnectToDatabase from "@/modules/mongodb";

const ADMIN_EMAILS = [process.env.ADMIN_EMAIL];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { db } = await ConnectToDatabase();

    // Admin wallet — stored separately
    const adminWallet = await db.collection("AdminWallet").findOne({}) ?? { balance: 0 };

    // All platform fee transactions
    const transactions = await db.collection("Transactions")
      .find({ type: "platform_fee" })
      .sort({ createdAt: -1 })
      .toArray();

    // Total platform fees collected
    const feeSummary = await db.collection("Transactions").aggregate([
      {
        $match: {
          type: "platform_fee",
          status: "completed",
        }
      },
      {
        $group: {
          _id: null,
          totalFees: { $sum: "$amount" },
        }
      }
    ]).toArray();

    return NextResponse.json({
      balance: adminWallet.balance ?? 0,
      totalFees: feeSummary[0]?.totalFees ?? 0,
      transactions,
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";