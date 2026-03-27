import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/modules/auth";
import ConnectToDatabase from "@/modules/mongodb";

const MIN_WITHDRAWAL = 1000;

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount, mpesaNumber, mpesaName } = await req.json();

    if (!amount || amount < MIN_WITHDRAWAL) {
      return NextResponse.json(
        { error: `Minimum withdrawal is KES ${MIN_WITHDRAWAL}` },
        { status: 400 }
      );
    }

    if (!mpesaNumber || !mpesaName) {
      return NextResponse.json(
        { error: "M-Pesa number and name are required" },
        { status: 400 }
      );
    }

    // Validate Kenyan phone number format
    const phoneRegex = /^(07|01|2547|2541)\d{8,9}$/;
    if (!phoneRegex.test(mpesaNumber.replace(/\s/g, ""))) {
      return NextResponse.json(
        { error: "Invalid M-Pesa number. Use format 07XXXXXXXX" },
        { status: 400 }
      );
    }

    const { client, db } = await ConnectToDatabase();
    const mongoSession = client.startSession();

    try {
      await mongoSession.withTransaction(async () => {
        const user = await db.collection("Users").findOne(
          { email: session.user.email },
          { session: mongoSession }
        );

        if (!user) throw new Error("User not found");

        if ((user.balance ?? 0) < amount) {
          throw new Error("Insufficient balance");
        }

        // Check for existing pending withdrawal
        const existingPending = await db.collection("Withdrawals").findOne(
          { userId: user._id, status: "pending" },
          { session: mongoSession }
        );
        if (existingPending) {
          throw new Error("You already have a pending withdrawal request");
        }

        // Deduct balance immediately (held pending admin approval)
        const updatedUser = await db.collection("Users").findOneAndUpdate(
          { _id: user._id },
          { $inc: { balance: -amount } },
          { returnDocument: "after", session: mongoSession }
        );

        // Create withdrawal request
        await db.collection("Withdrawals").insertOne(
          {
            userId: user._id,
            userName: user.name,
            userEmail: user.email,
            amount,
            mpesaNumber: mpesaNumber.replace(/\s/g, ""),
            mpesaName,
            status: "pending",
            createdAt: new Date(),
          },
          { session: mongoSession }
        );

        // Create immutable transaction record
        await db.collection("Transactions").insertOne(
          {
            userId: user._id,
            type: "withdrawal",
            amount,
            balanceAfter: updatedUser.balance,
            description: `Withdrawal request to M-Pesa ${mpesaNumber}`,
            status: "pending",
            paymentStatus: "pending",
            createdAt: new Date(),
          },
          { session: mongoSession }
        );
      });

      return NextResponse.json({ success: true });

    } finally {
      await mongoSession.endSession();
    }

  } catch (err) {
    console.error(err);
    const knownErrors = [
      "User not found",
      "Insufficient balance",
      "You already have a pending withdrawal request",
    ];
    if (knownErrors.includes(err.message)) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}