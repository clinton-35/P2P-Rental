import { NextResponse } from "next/server";
import ConnectToDatabase from "@/modules/mongodb";
import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const { db } = await ConnectToDatabase();
    const user = await db.collection("Users").findOne({ email });

    // Always return success even if email not found
    // This prevents email enumeration attacks
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Block Google OAuth users from resetting password
    if (user.provider === "google" || !user.password) {
      return NextResponse.json({
        error: "This account uses Google Sign-in. Please login with Google."
      }, { status: 400 });
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token in DB
    await db.collection("Users").updateOne(
      { email },
      {
        $set: {
          resetToken,
          resetTokenExpiry,
        }
      }
    );

    // Send reset email
    const resetUrl = `${process.env.NEXT_PUBLIC_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    await resend.emails.send({
      from: "Packhub <onboarding@resend.dev>",
      to: email,
      subject: "Reset Your Packhub Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9f9f9; border-radius: 12px;">
          <h2 style="color: #e53e3e; margin-bottom: 8px;">Password Reset Request</h2>
          <p style="color: #555; margin-bottom: 24px;">
            We received a request to reset your Packhub password. 
            Click the button below to set a new password.
          </p>
          <a href="${resetUrl}"
            style="display: inline-block; background: linear-gradient(to right, #e53e3e, #c53030);
            color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none;
            font-weight: bold; font-size: 15px;">
            Reset Password
          </a>
          <p style="color: #999; font-size: 13px; margin-top: 24px;">
            This link expires in <strong>1 hour</strong>. 
            If you did not request a password reset, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #bbb; font-size: 12px;">
            Packhub — Digital P2P Asset Leasing Platform
          </p>
        </div>
      `
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}