import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Group from "@/models/Group";
import Task from "@/models/Task";
import Note from "@/models/Note";
import { auth } from "@/auth";

export const dynamic = "force-dynamic"; // ⬅️ prevents build-time pre-render

export async function PUT(request, context) {
  try {
    const { params } = context;

    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    await connectDB();

    const group = await Group.findByIdAndUpdate(
      params.id,
      { $set: data },
      { new: true, runValidators: true }
    )
      .populate("user", "name email")
      .populate("members.user", "name email role");

    if (!group) {
      return NextResponse.json({ message: "Group not found" }, { status: 404 });
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error("Update group error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, context) {
  try {
    const { params } = context;

    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    await Task.deleteMany({ group: params.id });
    await Note.deleteMany({ group: params.id });

    const group = await Group.findByIdAndDelete(params.id);

    if (!group) {
      return NextResponse.json({ message: "Group not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Group deleted successfully" });
  } catch (error) {
    console.error("Delete group error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
