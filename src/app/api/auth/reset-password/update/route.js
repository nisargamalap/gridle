import { connectDB, findUserByToken, updatePassword } from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export async function PUT(req) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) {
      return new Response(JSON.stringify({ message: "Token and password required" }), { status: 400 });
    }

    await connectDB();

    const user = await findUserByToken(token);
    if (!user) {
      return new Response(JSON.stringify({ message: "Invalid or expired token" }), { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await updatePassword(user._id, hashedPassword);

    return new Response(JSON.stringify({ message: "Password updated successfully" }), { status: 200 });
  } catch (err) {
    console.error("Reset password update error:", err);
    return new Response(JSON.stringify({ message: "Server error" }), { status: 500 });
  }
}
