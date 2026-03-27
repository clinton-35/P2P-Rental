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

    const withdrawals = await db.collection("Withdrawals")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ withdrawals });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";