export const dynamic = "force-dynamic";
// PUT, DELETE, POST reset-password
import { NextResponse } from 'next/server';
import { connectDB, saveTokenToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { auth } from '@/auth';
import crypto from 'crypto';
import { sendResetEmail } from '@/lib/email';

// Update user
export async function PUT(request, context) {
  const { params } = context;
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const updates = await request.json();
    await connectDB();

    const user = await User.findByIdAndUpdate(params.id, updates, { new: true, runValidators: true }).select('-password');
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Delete user
export async function DELETE(request, context) {
  const { params } = context;
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findByIdAndDelete(params.id);
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Reset password
export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(params.id);
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    const resetToken = crypto.randomBytes(32).toString('hex');
    await saveTokenToDatabase(user._id, resetToken);
    await sendResetEmail(user.email, resetToken);

    return NextResponse.json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
