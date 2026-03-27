import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/modules/auth";
import ConnectToDatabase from "@/modules/mongodb";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount } = await req.json();

    if (!amount || amount < 100) {
      return NextResponse.json(
        { error: "Minimum deposit is KES 100" },
        { status: 400 }
      );
    }

    const { db } = await ConnectToDatabase();
    const user = await db.collection("Users").findOne(
      { email: session.user.email },
      { projection: { _id: 1, name: 1, email: 1 } }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create Stripe Checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: "kes",
            product_data: {
              name: "Wallet Deposit",
              description: `Deposit to your P2P Rental wallet`,
            },
            unit_amount: Math.round(amount * 100), // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: user._id.toString(),
        type: "wallet_deposit",
      },
      success_url: `${process.env.NEXT_PUBLIC_URL}/wallet?deposit=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/wallet?deposit=cancelled`,
    });

    return NextResponse.json({ url: checkoutSession.url });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}