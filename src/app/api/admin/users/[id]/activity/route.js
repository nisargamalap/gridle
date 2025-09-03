// app/api/admin/users/[id]/activity/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { auth } from "@/auth";
import Task from "@/models/Task";
import Note from "@/models/Note";

export const dynamic = "force-dynamic"; // ⬅️ prevents build-time pre-render errors

export async function GET(request, context) {
  try {
    const { params } = context; // ✅ correct way to access [id]

    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const userId = params.id;

    // Fetch user's tasks and notes
    const tasks = await Task.find({ user: userId }).select(
      "title status createdAt updatedAt"
    );
    const notes = await Note.find({ user: userId }).select(
      "title content createdAt updatedAt"
    );

    // Combine activities
    const activity = [
      ...tasks.map((t) => ({
        type: "task",
        action: t.status || "Task",
        details: t.title,
        timestamp: t.updatedAt || t.createdAt,
      })),
      ...notes.map((n) => ({
        type: "note",
        action: "Note",
        details: n.title,
        timestamp: n.updatedAt || n.createdAt,
      })),
    ];

    // Sort by timestamp descending
    activity.sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json(activity);
  } catch (error) {
    console.error("User activity error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
