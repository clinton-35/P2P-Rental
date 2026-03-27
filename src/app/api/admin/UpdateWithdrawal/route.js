import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/modules/auth";
import ConnectToDatabase from "@/modules/mongodb";
import { ObjectId } from "mongodb";

const ADMIN_EMAILS = [process.env.ADMIN_EMAIL];

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { withdrawalId, action } = await req.json();

    if (!["completed", "rejected"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const { client, db } = await ConnectToDatabase();
    const mongoSession = client.startSession();

    try {
      await mongoSession.withTransaction(async () => {
        const withdrawal = await db.collection("Withdrawals").findOne(
          { _id: new ObjectId(withdrawalId) },
          { session: mongoSession }
        );

        if (!withdrawal) throw new Error("Withdrawal not found");
        if (withdrawal.status !== "pending") throw new Error("Withdrawal already processed");

        // Update withdrawal status
        await db.collection("Withdrawals").updateOne(
          { _id: new ObjectId(withdrawalId) },
          {
            $set: {
              status: action,
              reviewedAt: new Date(),
            },
          },
          { session: mongoSession }
        );

        // Update transaction record
        await db.collection("Transactions").updateOne(
          {
            userId: withdrawal.userId,
            type: "withdrawal",
            status: "pending",
          },
          {
            $set: {
              status: action,
              paymentStatus: action === "completed" ? "paid" : "failed",
            },
          },
          { session: mongoSession }
        );

        // If rejected — refund balance to user
        if (action === "rejected") {
          const refundedUser = await db.collection("Users").findOneAndUpdate(
            { _id: withdrawal.userId },
            { $inc: { balance: withdrawal.amount } },
            { returnDocument: "after", session: mongoSession }
          );

          // Create refund transaction record
          await db.collection("Transactions").insertOne(
            {
              userId: withdrawal.userId,
              type: "refund",
              amount: withdrawal.amount,
              balanceAfter: refundedUser.balance,
              description: `Withdrawal refund — request rejected`,
              status: "completed",
              paymentStatus: "paid",
              createdAt: new Date(),
            },
            { session: mongoSession }
          );
        }
      });

      return NextResponse.json({ success: true });

    } finally {
      await mongoSession.endSession();
    }

  } catch (err) {
    console.error(err);
    const knownErrors = ["Withdrawal not found", "Withdrawal already processed"];
    if (knownErrors.includes(err.message)) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}