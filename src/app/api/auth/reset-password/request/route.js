import { connectDB, findUserByEmail, saveTokenToDatabase } from "@/lib/mongodb";
import { generateToken } from "@/lib/utils";
import { sendResetEmail } from "@/lib/email";

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) return new Response(JSON.stringify({ message: "Email is required" }), { status: 400 });

    await connectDB();

    const user = await findUserByEmail(email);
    if (!user) {
      // Don't reveal if user exists
      return new Response(JSON.stringify({ message: "If an account exists, we sent a reset email." }), { status: 200 });
    }

    const token = generateToken();
    await saveTokenToDatabase(user._id, token);

    await sendResetEmail(user.email, token);

    return new Response(JSON.stringify({ message: "Reset email sent" }), { status: 200 });
  } catch (err) {
    console.error("Reset password request error:", err);
    return new Response(JSON.stringify({ message: "Server error" }), { status: 500 });
  }
}
