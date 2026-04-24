import { NextResponse } from "next/server";
import ConnectToDatabase from "@/modules/mongodb";
import { hash } from "bcryptjs";

export async function POST(req) {
  try {
    const { email, token, password } = await req.json();

    if (!email || !token || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const { db } = await ConnectToDatabase();
    const user = await db.collection("Users").findOne({ email });

    if (!user) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Validate token
    if (user.resetToken !== token) {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
    }

    // Check token expiry
    if (new Date() > new Date(user.resetTokenExpiry)) {
      return NextResponse.json({ error: "Reset link has expired. Please request a new one." }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await hash(password, 10);

    // Update password and clear reset token
    await db.collection("Users").updateOne(
      { email },
      {
        $set: { password: hashedPassword },
        $unset: { resetToken: "", resetTokenExpiry: "" }
      }
    );

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}