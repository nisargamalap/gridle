import mongoose from "mongoose";
import User from "@/models/User";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error("Please set MONGODB_URI in .env.local");

let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      autoIndex: true,
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// ✅ Add helpers
export async function findUserByEmail(email) {
  await connectDB();
  return User.findOne({ email });
}

export async function saveTokenToDatabase(userId, token) {
  await connectDB();
  return User.findByIdAndUpdate(userId, {
    resetPasswordToken: token,
    resetPasswordExpires: Date.now() + 3600000, // 1 hour
  });
}

// Find user by reset token
export async function findUserByToken(token) {
  await connectDB();
  return User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }, // only if still valid
  });
}

// Update password + clear reset fields
export async function updatePassword(userId, hashedPassword) {
  await connectDB();
  return User.findByIdAndUpdate(userId, {
    password: hashedPassword,
    resetPasswordToken: null,
    resetPasswordExpires: null,
  });
}
