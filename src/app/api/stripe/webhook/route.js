import { NextResponse } from "next/server";
import ConnectToDatabase from "@/modules/mongodb";
import Stripe from "stripe";
import { ObjectId } from "mongodb";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
      const checkoutSession = event.data.object;

      if (checkoutSession.metadata?.type !== "wallet_deposit") {
        return NextResponse.json({ received: true });
      }

      const userId = new ObjectId(checkoutSession.metadata.userId);
      const amount = checkoutSession.amount_total / 100; // Convert from cents

      const { db } = await ConnectToDatabase();

      // Credit user balance
      const updatedUser = await db.collection("Users").findOneAndUpdate(
        { _id: userId },
        { $inc: { balance: amount } },
        { returnDocument: "after" }
      );

      // Create immutable transaction record
      await db.collection("Transactions").insertOne({
        userId,
        type: "deposit",
        amount,
        balanceAfter: updatedUser.balance,
        description: `Wallet deposit via card`,
        status: "completed",
        paymentStatus: "paid",
        stripeSessionId: checkoutSession.id,
        createdAt: new Date(),
      });
    }

    return NextResponse.json({ received: true });

  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Required — disable body parsing so Stripe signature verification works
export const config = {
  api: {
    bodyParser: false,
  },
};