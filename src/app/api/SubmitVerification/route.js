import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/modules/auth";
import ConnectToDatabase from "@/modules/mongodb";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.verified === "verified") {
      return NextResponse.json({ error: "Already verified" }, { status: 400 });
    }

    if (session.user.verified === "pending") {
      return NextResponse.json({ error: "Verification already submitted and under review" }, { status: 400 });
    }

    const { documentUrl, documentType } = await req.json();

    if (!documentUrl || !documentType) {
      return NextResponse.json({ error: "Missing document" }, { status: 400 });
    }

    const { db } = await ConnectToDatabase();

    await db.collection("Users").updateOne(
      { email: session.user.email },
      {
        $set: {
          verified: "pending",
          verificationDocument: documentUrl,
          documentType,
          verificationSubmittedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}