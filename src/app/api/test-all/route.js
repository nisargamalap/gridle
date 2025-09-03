export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    // 1️⃣ Connect to DB
    await connectDB();

    // 2️⃣ Count existing users
    const usersCount = await User.countDocuments();

    // 3️⃣ Create a test user if none exists
    let testUser = await User.findOne({ email: 'test@example.com' });

    if (!testUser) {
      const hashedPassword = await bcrypt.hash('password123', 12);
      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        role: 'user'
      });
    }

    // 4️⃣ Return response
    return NextResponse.json({
      status: 'success',
      message: 'Backend is working!',
      usersCount,
      testUser: {
        id: testUser._id,
        name: testUser.name,
        email: testUser.email
      }
    });
  } catch (error) {
    console.error('Test route error:', error);
    return NextResponse.json({
      status: 'error',
      message: error.message
    }, { status: 500 });
  }
}
