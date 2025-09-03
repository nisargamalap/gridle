export const dynamic = "force-dynamic";
import bcrypt from "bcryptjs";
import { sendResetEmail } from "@/lib/email";
import { generateToken } from "@/lib/utils";
import { findUserByEmail, saveTokenToDatabase, findUserByToken, updatePassword } from "@/lib/mongodb";

// ✅ Send reset email
export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) return new Response(JSON.stringify({ message: "Email is required" }), { status: 400 });

    const user = await findUserByEmail(email);
    if (!user) return new Response(JSON.stringify({ message: "Email not found" }), { status: 404 });

    const token = generateToken();
    await saveTokenToDatabase(user._id, token);

    await sendResetEmail(user.email, token);

    return new Response(JSON.stringify({ message: "Reset email sent" }), { status: 200 });
  } catch (err) {
    console.error("POST /reset-password error:", err);
    return new Response(JSON.stringify({ message: "Internal server error" }), { status: 500 });
  }
}

// ✅ Update password
export async function PUT(req) {
  try {
    const { token, password } = await req.json();
    if (!token || !password)
      return new Response(JSON.stringify({ message: "Token and password required" }), { status: 400 });

    const user = await findUserByToken(token);
    if (!user)
      return new Response(JSON.stringify({ message: "Invalid or expired token" }), { status: 400 });

    const hashedPassword = await bcrypt.hash(password, 10);
    await updatePassword(user._id, hashedPassword);

    return new Response(JSON.stringify({ message: "Password updated successfully" }), { status: 200 });
  } catch (err) {
    console.error("PUT /reset-password error:", err);
    return new Response(JSON.stringify({ message: "Internal server error" }), { status: 500 });
  }
}
