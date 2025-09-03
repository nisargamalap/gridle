// app/api/admin/groups/[id]/members/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Group from "@/models/Group";
import User from "@/models/User";
import { auth } from "@/auth";

export const dynamic = "force-dynamic"; // ⬅️ prevent build errors on Vercel

export async function POST(request, context) {
  try {
    const { params } = context;

    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await request.json();
    await connectDB();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const group = await Group.findById(params.id);
    if (!group) {
      return NextResponse.json({ message: "Group not found" }, { status: 404 });
    }

    if (group.members.some((member) => member.user.toString() === userId)) {
      return NextResponse.json(
        { message: "User is already a member" },
        { status: 400 }
      );
    }

    group.members.push({
      user: userId,
      role: "member",
      joinedAt: new Date(),
    });

    await group.save();
    await group.populate("members.user", "name email");

    return NextResponse.json({
      message: "Member added successfully",
      group,
    });
  } catch (error) {
    console.error("Add member error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
