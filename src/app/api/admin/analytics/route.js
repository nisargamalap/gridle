// src/app/api/admin/analytics/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Task from "@/models/Task";
import Group from "@/models/Group";

export async function GET() {
  try {
    await connectDB();

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const groupsCreated = await Group.countDocuments();
    const tasksCreated = await Task.countDocuments();

    // Completion Rate
    const completedTasks = await Task.countDocuments({ status: "completed" });
    const completionRate = tasksCreated > 0 ? Math.round((completedTasks / tasksCreated) * 100) : 0;

    // Avg Tasks per User
    const avgTasksPerUser = totalUsers > 0 ? (tasksCreated / totalUsers).toFixed(2) : 0;

    // Tasks by status
    const tasksByStatus = await Task.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // Tasks by group
    const tasksByGroup = await Task.aggregate([
      { $group: { _id: "$group", count: { $sum: 1 } } },
      { $lookup: { from: "groups", localField: "_id", foreignField: "_id", as: "group" } },
      { $unwind: { path: "$group", preserveNullAndEmptyArrays: true } },
      { $project: { _id: 1, count: 1, groupName: "$group.name" } }
    ]);

    // 📅 Users signup trend (last 6 weeks)
    const userTrend = await User.aggregate([
      {
        $group: {
          _id: { $isoWeek: "$createdAt" },
          year: { $first: { $isoWeekYear: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { year: 1, "_id": 1 } },
      { $limit: 6 }
    ]);

    // 📅 Groups creation trend (last 6 weeks)
    const groupTrend = await Group.aggregate([
      {
        $group: {
          _id: { $isoWeek: "$createdAt" },
          year: { $first: { $isoWeekYear: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { year: 1, "_id": 1 } },
      { $limit: 6 }
    ]);

    return NextResponse.json({
      totalUsers,
      activeUsers,
      groupsCreated,
      tasksCreated,
      completionRate,
      avgTasksPerUser,
      tasksByStatus,
      tasksByGroup,
      userTrend,
      groupTrend
    });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
