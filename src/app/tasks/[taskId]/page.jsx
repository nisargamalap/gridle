// src/app/tasks/[taskId]/page.jsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const TaskDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const taskId = params.taskId;

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    category: "",
    dueDate: "",
  });

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const res = await fetch(`/api/tasks/${taskId}`);
        if (!res.ok) throw new Error("Task not found or unauthorized");
        const data = await res.json();
        setTask(data);
        setFormData({
          title: data.title,
          description: data.description || "",
          priority: data.priority || "medium",
          category: data.category || "Uncategorized",
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString().slice(0, 16) : "",
        });
      } catch (err) {
        console.error("Error fetching task:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, [taskId]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete task");
      router.push("/tasks");
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          category: formData.category,
          dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
        }),
      });
      if (!res.ok) throw new Error("Failed to update task");
      const updatedTask = await res.json();
      setTask(updatedTask);
      setShowEdit(false);
      alert("Task updated successfully!");
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-center p-8">Loading task...</p>;

  if (error || !task)
    return (
      <div className="text-center text-muted-foreground p-8 bg-card rounded-xl shadow-md border border-border">
        <h2 className="text-2xl font-bold text-foreground mb-4">Task Not Found</h2>
        <p>{error || `The task with ID "${taskId}" does not exist.`}</p>
        <button onClick={() => router.back()} className="mt-4 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/80 transition-colors">Go Back</button>
      </div>
    );

  return (
    <div className="bg-card text-card-foreground p-8 rounded-2xl shadow-lg border border-border space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-3xl font-bold text-foreground">{task.title}</h2>
        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
          task.priority?.toLowerCase() === "high"
            ? "bg-destructive/10 text-destructive"
            : task.priority?.toLowerCase() === "medium"
            ? "bg-yellow-100 text-yellow-800"
            : "bg-green-100 text-green-800"
        }`}>
          {task.priority} Priority
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Due Date</p>
          <p className="text-lg font-medium text-foreground">{task.dueDate ? new Date(task.dueDate).toLocaleString() : "Not set"}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">Category</p>
          <p className="text-lg font-medium text-foreground">{task.category || "Uncategorized"}</p>
        </div>
      </div>

      <div>
        <p className="text-sm text-muted-foreground mb-1">Description</p>
        <p className="text-foreground leading-relaxed">{task.description || "No description provided."}</p>
      </div>

      {task.aiInsight && (
        <div className="bg-muted p-4 rounded-lg border border-border">
          <p className="text-sm font-semibold text-foreground mb-1">AI Insight:</p>
          <p className="text-muted-foreground text-sm">{task.aiInsight}</p>
        </div>
      )}

      <div className="pt-6 border-t border-border flex justify-end space-x-3">
        <button onClick={() => router.back()} className="bg-secondary text-secondary-foreground px-5 py-2 rounded-lg font-semibold hover:bg-secondary/80 transition-colors">Go Back</button>
        <button onClick={() => setShowEdit(true)} disabled={saving} className="bg-primary text-primary-foreground px-5 py-2 rounded-lg font-semibold hover:bg-accent transition-colors">
          Edit Task
        </button>
        <button onClick={handleDelete} disabled={saving} className="bg-destructive text-destructive-foreground px-5 py-2 rounded-lg font-semibold hover:bg-destructive/80 transition-colors">
          {saving ? "Deleting..." : "Delete Task"}
        </button>
      </div>

      {showEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form onSubmit={handleEditSubmit} className="bg-card p-6 rounded-xl shadow-xl w-full max-w-lg space-y-4">
            <h3 className="text-2xl font-bold text-foreground">Edit Task</h3>

            <div>
              <label className="block text-sm font-medium text-muted-foreground">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1 w-full border border-border rounded-lg px-3 py-2 text-foreground bg-input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 w-full border border-border rounded-lg px-3 py-2 text-foreground bg-input"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="mt-1 w-full border border-border rounded-lg px-3 py-2 text-foreground bg-input"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="mt-1 w-full border border-border rounded-lg px-3 py-2 text-foreground bg-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground">Due Date</label>
              <input
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="mt-1 w-full border border-border rounded-lg px-3 py-2 text-foreground bg-input"
              />
            </div>

            <div className="flex justify-end space-x-3 mt-4">
              <button type="button" onClick={() => setShowEdit(false)} className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/80 transition-colors">Cancel</button>
              <button type="submit" disabled={saving} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-accent transition-colors">
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TaskDetailPage;
