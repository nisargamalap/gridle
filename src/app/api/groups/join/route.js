export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Group from "@/models/Group";
import { auth } from "@/auth";

export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { joinCode } = await request.json();

    if (!joinCode) {
      return NextResponse.json(
        { message: "Join code is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const group = await Group.findOne({ joinCode: joinCode.toUpperCase() });

    if (!group) {
      return NextResponse.json(
        { message: "Invalid join code" },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const isAlreadyMember = group.members.some(
      (member) => member.user.toString() === session.user.id
    );

    if (isAlreadyMember) {
      return NextResponse.json(
        { message: "You are already a member of this group" },
        { status: 400 }
      );
    }

    // Add user to group
    group.members.push({
      user: session.user.id,
      role: "member",
    });

    await group.save();

    const populatedGroup = await Group.findById(group._id)
      .populate("user", "name email") // Changed from createdBy to user
      .populate("members.user", "name email");

    return NextResponse.json(populatedGroup);
  } catch (error) {
    console.error("Join group error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}