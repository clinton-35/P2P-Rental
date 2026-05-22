import { hash } from "bcryptjs";
import ConnectToDatabase from "@/modules/mongodb";

export async function POST(req) {
  try {
    const { name, email, password } = await req.json();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    // Validate password — must be at least 8 characters and contain both letters and numbers
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return Response.json(
        { error: "Password must be at least 8 characters and contain both letters and numbers." },
        { status: 400 }
      );
    }

    const { db } = await ConnectToDatabase();
    const users = db.collection("Users");

    const exists = await users.findOne({ email });
    if (exists) {
      return Response.json({ error: "User already exists" }, { status: 400 });
    }

    const hashed = await hash(password, 10);

    await users.insertOne({
      name,
      email,
      password: hashed,
      createdAt: new Date().toISOString().split("T")[0],
      verified: "unverified",
      verificationDocument: null,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: "Registration failed" }, { status: 500 });
  }
}