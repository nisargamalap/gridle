export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Group from "@/models/Group";
import { auth } from "@/auth";
import mongoose from "mongoose";

// Get group by ID
export async function GET(request, context) {
  const { params } = context;
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!mongoose.isValidObjectId(params.id)) {
      return NextResponse.json({ message: "Invalid group ID" }, { status: 400 });
    }

    await connectDB();

    const group = await Group.findOne({
      _id: params.id,
      $or: [
        { user: session.user.id }, // Changed from createdBy to user
        { "members.user": session.user.id }
      ],
    })
      .populate("user", "name email") // Changed from createdBy to user
      .populate("members.user", "name email");

    if (!group) {
      return NextResponse.json({ message: "Group not found" }, { status: 404 });
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error("Get group error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// Update group by ID
export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!mongoose.isValidObjectId(params.id)) {
      return NextResponse.json({ message: "Invalid group ID" }, { status: 400 });
    }

    const data = await request.json();

    await connectDB();

    // Only admin (creator or admin member) can update group
    const group = await Group.findById(params.id);

    if (!group) {
      return NextResponse.json({ message: "Group not found" }, { status: 404 });
    }

    const isAdmin =
      group.user.toString() === session.user.id || // Changed from createdBy to user
      group.members.some(
        (m) => m.user.toString() === session.user.id && m.role === "admin"
      );

    if (!isAdmin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    group.name = data.name ?? group.name;
    group.description = data.description ?? group.description;
    group.isPrivate = data.isPrivate ?? group.isPrivate;

    await group.save();

    const populatedGroup = await Group.findById(group._id)
      .populate("user", "name email") // Changed from createdBy to user
      .populate("members.user", "name email");

    return NextResponse.json(populatedGroup);
  } catch (error) {
    console.error("Update group error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// Delete group by ID
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!mongoose.isValidObjectId(params.id)) {
      return NextResponse.json({ message: "Invalid group ID" }, { status: 400 });
    }

    await connectDB();

    const group = await Group.findById(params.id);

    if (!group) {
      return NextResponse.json({ message: "Group not found" }, { status: 404 });
    }

    // Only creator can delete
    if (group.user.toString() !== session.user.id) { // Changed from createdBy to user
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await group.deleteOne();

    return NextResponse.json({ message: "Group deleted successfully" });
  } catch (error) {
    console.error("Delete group error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}