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

    const { userId, action } = await req.json();

    if (!["verified", "rejected"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const { db } = await ConnectToDatabase();

    await db.collection("Users").updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          verified: action,
          verificationReviewedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
