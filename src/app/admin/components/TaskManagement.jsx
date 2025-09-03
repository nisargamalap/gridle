// admin/components/TaskManagement.jsx
"use client"

import { useState, useEffect } from "react"

const TaskManagement = () => {
  const [tasks, setTasks] = useState([])
  const [filteredTasks, setFilteredTasks] = useState([])
  const [taskFilters, setTaskFilters] = useState({
    status: "",
    priority: "",
    group: "",
    user: "",
    search: "",
  })
  const [taskPage, setTaskPage] = useState(1)
  const [taskTotalPages, setTaskTotalPages] = useState(1)
  const [availableGroups, setAvailableGroups] = useState([])
  const [users, setUsers] = useState([])
  const [selectedTasks, setSelectedTasks] = useState(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [bulkAction, setBulkAction] = useState("")
  const [editingTask, setEditingTask] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    fetchTasks(taskFilters, taskPage, false)
    fetchGroups()
    fetchUsers()

    const interval = setInterval(() => {
      fetchTasks(taskFilters, taskPage, false)
    }, 300000)

    // Cleanup interval on component unmount
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    filterTasks()
  }, [tasks, taskFilters])

  const fetchTasks = async (filters = {}, page = 1) => {
    setIsLoading(true)
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.group && { group: filters.group }),
        ...(filters.user && { user: filters.user }),
        ...(filters.search && { search: filters.search }),
      })

      const res = await fetch(`/api/admin/tasks?${queryParams}`)
      if (res.ok) {
        const data = await res.json()
        setTasks(data.tasks)
        setTaskTotalPages(data.totalPages)
        setTaskPage(data.currentPage)
      }
    } catch (error) {
      console.error("Error fetching tasks:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/admin/groups?limit=1000")
      if (res.ok) {
        const data = await res.json()
        setAvailableGroups(data.groups)
      }
    } catch (error) {
      console.error("Error fetching groups:", error)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users?limit=1000")
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const filterTasks = () => {
    let filtered = tasks

    if (taskFilters.search) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(taskFilters.search.toLowerCase()) ||
          task.description?.toLowerCase().includes(taskFilters.search.toLowerCase()),
      )
    }

    setFilteredTasks(filtered)
  }

  const handleEditTask = async (taskId, updates) => {
    try {
      const res = await fetch(`/api/admin/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (res.ok) {
        fetchTasks(taskFilters, taskPage)
        setShowEditModal(false)
        setEditingTask(null)
      }
    } catch (error) {
      console.error("Error updating task:", error)
    }
  }

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return

    try {
      const res = await fetch(`/api/admin/tasks/${taskId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        fetchTasks(taskFilters, taskPage)
      }
    } catch (error) {
      console.error("Error deleting task:", error)
    }
  }

  const handleArchiveTask = async (taskId, archive = true) => {
    try {
      const res = await fetch(`/api/admin/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: archive }),
      })

      if (res.ok) {
        fetchTasks(taskFilters, taskPage)
      }
    } catch (error) {
      console.error("Error archiving task:", error)
    }
  }

  const handleBulkAction = async () => {
    if (!bulkAction || selectedTasks.size === 0) return

    try {
      const res = await fetch("/api/admin/tasks/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskIds: Array.from(selectedTasks),
          action: bulkAction,
          ...(bulkAction === "status" && { status: "completed" }),
          ...(bulkAction === "priority" && { priority: "medium" }),
          ...(bulkAction === "assign" && { userId: users[0]?._id }),
        }),
      })

      if (res.ok) {
        fetchTasks(taskFilters, taskPage)
        setSelectedTasks(new Set())
        setShowBulkActions(false)
        setBulkAction("")
      }
    } catch (error) {
      console.error("Error performing bulk action:", error)
    }
  }

  const handleTaskFilterChange = (filter, value) => {
    const newFilters = { ...taskFilters, [filter]: value }
    setTaskFilters(newFilters)
    fetchTasks(newFilters, 1)
  }

  const toggleTaskSelection = (taskId) => {
    const newSelected = new Set(selectedTasks)
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId)
    } else {
      newSelected.add(taskId)
    }
    setSelectedTasks(newSelected)
    setShowBulkActions(newSelected.size > 0)
  }

  const selectAllTasks = () => {
    if (selectedTasks.size === filteredTasks.length) {
      setSelectedTasks(new Set())
      setShowBulkActions(false)
    } else {
      setSelectedTasks(new Set(filteredTasks.map((task) => task._id)))
      setShowBulkActions(true)
    }
  }

  const openEditModal = (task) => {
    setEditingTask(task)
    setShowEditModal(true)
  }

  const handleQuickFilterChange = (filter, value) => {
    const newFilters = { ...taskFilters, [filter]: value }
    setTaskFilters(newFilters)
    fetchTasks(newFilters, 1)
  }

  const csvData = filteredTasks.map((task) => ({
    Title: task.title,
    Description: task.description || "",
    AssignedTo: task.assignedTo?.name || "Unassigned",
    Group: task.group?.name || "No Group",
    Status: task.status,
    Priority: task.priority,
    DueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date",
  }))

  const toCsv = (rows) => {
    if (!rows || rows.length === 0) return ""
    const headers = Object.keys(rows[0])
    const escape = (val) => {
      if (val === null || val === undefined) return ""
      const str = String(val).replace(/"/g, '""')
      return /[",\n]/.test(str) ? `"${str}"` : str
    }
    const lines = [headers.join(","), ...rows.map((row) => headers.map((h) => escape(row[h])).join(","))]
    return lines.join("\n")
  }

  const handleExportCsv = () => {
    try {
      const csv = toCsv(csvData)
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "tasks.csv"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error("[v0] CSV export failed:", e)
    }
  }

  return (
    <div className="bg-card text-card-foreground p-8 rounded-2xl shadow-lg border border-border">
      <h3 className="text-xl font-semibold text-foreground mb-6">Task Management</h3>

      {/* Quick Filters and CSV Export */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => handleQuickFilterChange("status", "todo")}
            className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg"
          >
            To Do
          </button>
          <button
            onClick={() => handleQuickFilterChange("status", "in-progress")}
            className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg"
          >
            In Progress
          </button>
          <button
            onClick={() => handleQuickFilterChange("status", "completed")}
            className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg"
          >
            Completed
          </button>
          <button
            onClick={() => handleQuickFilterChange("status", "archived")}
            className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg"
          >
            Archived
          </button>
        </div>
        <button onClick={handleExportCsv} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg">
          Export to CSV
        </button>
      </div>

      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <input
          type="text"
          placeholder="Search tasks..."
          className="p-2 border border-border rounded-lg bg-input"
          value={taskFilters.search}
          onChange={(e) => handleTaskFilterChange("search", e.target.value)}
        />
        <select
          value={taskFilters.status}
          onChange={(e) => handleTaskFilterChange("status", e.target.value)}
          className="p-2 border border-border rounded-lg bg-input"
        >
          <option value="">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
        <select
          value={taskFilters.priority}
          onChange={(e) => handleTaskFilterChange("priority", e.target.value)}
          className="p-2 border border-border rounded-lg bg-input"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <select
          value={taskFilters.group}
          onChange={(e) => handleTaskFilterChange("group", e.target.value)}
          className="p-2 border border-border rounded-lg bg-input"
        >
          <option value="">All Groups</option>
          {availableGroups.map((group) => (
            <option key={group._id} value={group._id}>
              {group.name}
            </option>
          ))}
        </select>
        <select
          value={taskFilters.user}
          onChange={(e) => handleTaskFilterChange("user", e.target.value)}
          className="p-2 border border-border rounded-lg bg-input"
        >
          <option value="">All Users</option>
          {users.map((user) => (
            <option key={user._id} value={user._id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>

      {/* Bulk Actions */}
      {showBulkActions && (
        <div className="mb-4 p-4 bg-muted rounded-lg flex items-center space-x-4">
          <span className="font-semibold">{selectedTasks.size} tasks selected</span>
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="p-2 border border-border rounded-lg bg-input"
          >
            <option value="">Choose action...</option>
            <option value="delete">Delete</option>
            <option value="archive">Archive</option>
            <option value="unarchive">Unarchive</option>
            <option value="status">Mark as Completed</option>
            <option value="priority">Change Priority</option>
          </select>
          <button
            onClick={handleBulkAction}
            disabled={!bulkAction}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg disabled:opacity-50"
          >
            Apply
          </button>
          <button
            onClick={() => {
              setSelectedTasks(new Set())
              setShowBulkActions(false)
            }}
            className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg"
          >
            Cancel
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr className="bg-muted">
                  <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={selectedTasks.size === filteredTasks.length && filteredTasks.length > 0}
                      onChange={selectAllTasks}
                      className="rounded border-border"
                    />
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Title</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Assigned To</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Group</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Priority</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Due Date</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4 text-muted-foreground">
                      No tasks found.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => (
                    <tr key={task._id} className={task.isArchived ? "opacity-60" : ""}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedTasks.has(task._id)}
                          onChange={() => toggleTaskSelection(task._id)}
                          className="rounded border-border"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-foreground">
                        <div className="font-medium">{task.title}</div>
                        {task.description && (
                          <div className="text-sm text-muted-foreground truncate max-w-xs">{task.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {task.assignedTo?.name || "Unassigned"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {task.group?.name || "No Group"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <select
                          value={task.status}
                          onChange={(e) => handleEditTask(task._id, { status: e.target.value })}
                          className="bg-input border border-border rounded px-2 py-1 text-sm"
                        >
                          <option value="todo">To Do</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <select
                          value={task.priority}
                          onChange={(e) => handleEditTask(task._id, { priority: e.target.value })}
                          className="bg-input border border-border rounded px-2 py-1 text-sm"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap space-x-2">
                        <button onClick={() => openEditModal(task)} className="text-primary hover:underline text-sm">
                          Edit
                        </button>
                        {task.isArchived ? (
                          <button
                            onClick={() => handleArchiveTask(task._id, false)}
                            className="text-primary hover:underline text-sm"
                          >
                            Unarchive
                          </button>
                        ) : (
                          <button
                            onClick={() => handleArchiveTask(task._id, true)}
                            className="text-primary hover:underline text-sm"
                          >
                            Archive
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteTask(task._id)}
                          className="text-destructive hover:underline text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => fetchTasks(taskFilters, taskPage - 1)}
              disabled={taskPage === 1}
              className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-muted-foreground">
              Page {taskPage} of {taskTotalPages}
            </span>
            <button
              onClick={() => fetchTasks(taskFilters, taskPage + 1)}
              disabled={taskPage === taskTotalPages}
              className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Edit Task Modal */}
      {showEditModal && editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg w-11/12 max-w-2xl">
            <h3 className="text-xl font-semibold mb-4">Edit Task</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block font-semibold mb-2">Title</label>
                <input
                  type="text"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="w-full p-2 border border-border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-2">Description</label>
                <textarea
                  value={editingTask.description || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  className="w-full p-2 border border-border rounded-lg"
                  rows={3}
                />
              </div>
              <div>
                <label className="block font-semibold mb-2">Assigned To</label>
                <select
                  value={editingTask.assignedTo?._id || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, assignedTo: { _id: e.target.value } })}
                  className="w-full p-2 border border-border rounded-lg"
                >
                  <option value="">Unassigned</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-2">Group</label>
                <select
                  value={editingTask.group?._id || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, group: { _id: e.target.value } })}
                  className="w-full p-2 border border-border rounded-lg"
                >
                  <option value="">No Group</option>
                  {availableGroups.map((group) => (
                    <option key={group._id} value={group._id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-2">Due Date</label>
                <input
                  type="date"
                  value={editingTask.dueDate ? new Date(editingTask.dueDate).toISOString().split("T")[0] : ""}
                  onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                  className="w-full p-2 border border-border rounded-lg"
                />
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => handleEditTask(editingTask._id, editingTask)}
                className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg"
              >
                Save Changes
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TaskManagement
