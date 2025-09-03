export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Group from '@/models/Group';
import Task from '@/models/Task';
import Note from '@/models/Note';

export async function GET(request) {
  try {
    await connectDB();

    // Get userId from query parameter (or from session if auth is set up)
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ message: 'userId is required' }, { status: 400 });
    }

    // Fetch user data with nested population
    const userData = await User.findById(userId)
      .select('-password -resetPasswordToken -resetPasswordExpires -verificationToken -verificationTokenExpires')
      .populate({
        path: 'groups',
        populate: {
          path: 'tasks',
          populate: { path: 'notes' }
        }
      });

    if (!userData) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'User dashboard data fetched successfully',
      data: userData,
    });

  } catch (error) {
    console.error('Dashboard fetch error:', error);
    return NextResponse.json({ message: 'Internal server error', error }, { status: 500 });
  }
}
