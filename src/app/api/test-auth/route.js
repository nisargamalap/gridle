export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");
    const email = searchParams.get("email");
    const password = searchParams.get("password");
    const googleId = searchParams.get("googleId"); // Mock Google login

    if (!email) {
      return NextResponse.json(
        { status: "error", message: "Email is required" },
        { status: 400 }
      );
    }

    let user;

    if (googleId) {
      // Simulate Google OAuth login
      user = await User.findOne({ googleId });
      if (!user) {
        if (!name) {
          return NextResponse.json(
            { status: "error", message: "Name is required for Google signup" },
            { status: 400 }
          );
        }

        user = await User.create({
          name,
          email,
          googleId,
          oauthProvider: "google",
        });

        const { password: _, ...userWithoutPassword } = user.toObject();

        return NextResponse.json({
          status: "success",
          message: "Google user created and signed in successfully",
          user: userWithoutPassword,
        });
      }

      const { password: _, ...userWithoutPassword } = user.toObject();
      return NextResponse.json({
        status: "success",
        message: "Google sign-in successful",
        user: userWithoutPassword,
      });
    }

    // Normal credentials login/signup
    if (!password) {
      return NextResponse.json(
        { status: "error", message: "Password is required for credentials login" },
        { status: 400 }
      );
    }

    user = await User.findOne({ email }).select("+password");

    if (!user) {
      // Sign up new user
      if (!name) {
        return NextResponse.json(
          { status: "error", message: "Name is required for signup" },
          { status: 400 }
        );
      }

      user = await User.create({ name, email, password });
      const { password: _, ...userWithoutPassword } = user.toObject();

      return NextResponse.json({
        status: "success",
        message: "User created and signed in successfully",
        user: userWithoutPassword,
      });
    }

    // User exists, check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { status: "error", message: "Invalid password" },
        { status: 401 }
      );
    }

    const { password: _, ...userWithoutPassword } = user.toObject();
    return NextResponse.json({
      status: "success",
      message: "Sign-in successful",
      user: userWithoutPassword,
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
