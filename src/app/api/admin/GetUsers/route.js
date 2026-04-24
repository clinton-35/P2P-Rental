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

    const users = await db.collection("Users").find(
      {},
      {
        projection: {
          _id: 1,
          name: 1,
          email: 1,
          image: 1,
          verified: 1,
          verificationDocument: 1,
          documentType: 1,
          createdAt: 1,
          verificationSubmittedAt: 1,
          verificationReviewedAt: 1,
        },
      }
    ).sort({ verificationSubmittedAt: -1 }).toArray();

    return NextResponse.json({ users });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}