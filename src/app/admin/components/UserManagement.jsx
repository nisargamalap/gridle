// admin/components/UserManagement.jsx
"use client"

import { useState, useEffect } from "react"

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [userPage, setUserPage] = useState(1)
  const [userTotalPages, setUserTotalPages] = useState(1)
  const [sortField, setSortField] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState("desc")
  const [statusFilter, setStatusFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")
  const [selectedUser, setSelectedUser] = useState(null)
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [perPage, setPerPage] = useState(10)

  useEffect(() => {
    fetchUsers()

    const interval = setInterval(() => {
      fetchUsers(userPage, userSearchQuery)
    }, 30000)

    return () => clearInterval(interval)
  }, [sortField, sortOrder, statusFilter, roleFilter, userPage, userSearchQuery])

  const fetchUsers = async (page = 1, search = "") => {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: String(perPage),
        sortBy: sortField,
        sortOrder: sortOrder,
        ...(search && { search }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(roleFilter !== "all" && { role: roleFilter }),
      })

      const res = await fetch(`/api/admin/users?${queryParams}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
        setUserTotalPages(data.totalPages)
        setUserPage(data.currentPage)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  // Optimistic edit
  const handleEditUser = async (userId, updates) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (res.ok) {
        // Update UI immediately
        setUsers((prev) => prev.map((user) => (user._id === userId ? { ...user, ...updates } : user)))
      }
    } catch (error) {
      console.error("Error updating user:", error)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return

    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" })
      if (res.ok) {
        setUsers((prev) => prev.filter((user) => user._id !== userId))
      }
    } catch (error) {
      console.error("Error deleting user:", error)
    }
  }

  const handleResetPassword = async (userId) => {
    if (!window.confirm("Are you sure you want to reset this user's password?")) return

    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, { method: "POST" })
      if (res.ok) {
        alert("Password reset email sent to user")
      }
    } catch (error) {
      console.error("Error resetting password:", error)
    }
  }

  const handleViewActivity = async (userId) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/activity`)
      if (res.ok) {
        const activityData = await res.json()
        setSelectedUser({ id: userId, activity: activityData })
        setShowActivityModal(true)
      }
    } catch (error) {
      console.error("Error fetching user activity:", error)
    }
  }

  const handleSearchUsers = (e) => {
    e.preventDefault()
    fetchUsers(1, userSearchQuery)
  }

  const handleSort = (field) => {
    if (sortField === field) setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    else {
      setSortField(field)
      setSortOrder("desc")
    }
  }

  const getStatusValue = (user) => (user.isBanned ? "banned" : user.isActive ? "active" : "inactive")

  const handleStatusChange = async (userId, newStatus) => {
    let updates = {}
    if (newStatus === "banned") updates = { isBanned: true, isActive: false }
    else if (newStatus === "active") updates = { isBanned: false, isActive: true }
    else if (newStatus === "inactive") updates = { isBanned: false, isActive: false }
    await handleEditUser(userId, updates)
  }

  return (
    <div className="bg-card text-card-foreground p-8 md:p-10 rounded-2xl shadow-lg border border-border/70 max-w-7xl mx-auto">
      {/* Header Toolbar */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h3 className="text-2xl md:text-3xl font-semibold text-foreground text-pretty tracking-tight">
          User Management
        </h3>
        <div className="flex items-center gap-2">
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value))
              // refetch with new page size
              fetchUsers(1, userSearchQuery)
            }}
            className="px-3 py-2 text-sm border border-border rounded-lg bg-input"
            aria-label="Rows per page"
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
          </select>
          <button
            onClick={() => fetchUsers(userPage, userSearchQuery)}
            className="px-3 py-2 rounded-lg bg-secondary text-secondary-foreground"
          >
            Refresh
          </button>
          <button
            onClick={() => {
              const header = ["Name", "Email", "Role", "Created", "Last Activity", "Status"]
              const rows = users.map((u) => [
                u.name,
                u.email,
                u.role,
                u.createdAt ? new Date(u.createdAt).toISOString() : "",
                u.lastActivity ? new Date(u.lastActivity).toISOString() : "",
                u.isBanned ? "banned" : u.isActive ? "active" : "inactive",
              ])
              const csv = [
                header.join(","),
                ...rows.map((r) => r.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(",")),
              ].join("\n")
              const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
              const url = URL.createObjectURL(blob)
              const a = document.createElement("a")
              a.href = url
              a.download = "users.csv"
              a.click()
              URL.revokeObjectURL(url)
            }}
            className="px-3 py-2 rounded-lg bg-primary text-primary-foreground"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
        <form onSubmit={handleSearchUsers} className="md:col-span-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search users..."
              className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg font-semibold bg-primary text-primary-foreground hover:bg-accent transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-lg bg-input text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="banned">Banned</option>
        </select>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-lg bg-input text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <option value="all">All Roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-muted/60">
              <th
                className="px-4 py-2 text-left font-medium text-muted-foreground cursor-pointer"
                onClick={() => handleSort("name")}
              >
                Name {sortField === "name" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="px-4 py-2 text-left font-medium text-muted-foreground cursor-pointer"
                onClick={() => handleSort("email")}
              >
                Email {sortField === "email" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="px-4 py-2 text-left font-medium text-muted-foreground cursor-pointer"
                onClick={() => handleSort("role")}
              >
                Role {sortField === "role" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="px-4 py-2 text-left font-medium text-muted-foreground cursor-pointer"
                onClick={() => handleSort("createdAt")}
              >
                Registered {sortField === "createdAt" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="px-4 py-2 text-left font-medium text-muted-foreground cursor-pointer"
                onClick={() => handleSort("lastActivity")}
              >
                Last Activity {sortField === "lastActivity" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-6 text-muted-foreground">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user._id} className="odd:bg-muted/30 hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-foreground">{user.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) => handleEditUser(user._id, { role: e.target.value })}
                      className="bg-input border border-border rounded px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {user.lastActivity ? new Date(user.lastActivity).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <select
                      value={getStatusValue(user)}
                      onChange={(e) => handleStatusChange(user._id, e.target.value)}
                      className="bg-input border border-border rounded px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="banned">Banned</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex flex-col space-y-1.5">
                      <button
                        onClick={() => handleViewActivity(user._id)}
                        className="text-primary hover:text-foreground underline-offset-4 hover:underline text-xs text-left"
                      >
                        View Activity
                      </button>
                      <button
                        onClick={() => handleResetPassword(user._id)}
                        className="text-primary hover:text-foreground underline-offset-4 hover:underline text-xs text-left"
                      >
                        Reset Password
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        className="text-destructive hover:opacity-80 underline-offset-4 hover:underline text-xs text-left"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-5">
        <button
          onClick={() => fetchUsers(userPage - 1, userSearchQuery)}
          disabled={userPage === 1}
          className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Previous
        </button>
        <span className="text-sm text-muted-foreground">
          Page {userPage} of {userTotalPages}
        </span>
        <button
          onClick={() => fetchUsers(userPage + 1, userSearchQuery)}
          disabled={userPage === userTotalPages}
          className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Next
        </button>
      </div>

      {/* Activity Modal */}
      {showActivityModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="activityTitle"
            className="bg-card rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-border shadow-lg"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 id="activityTitle" className="text-lg font-semibold">
                User Activity
              </h3>
              <button
                onClick={() => setShowActivityModal(false)}
                className="text-muted-foreground hover:text-foreground px-2 py-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                &times;
              </button>
            </div>
            {selectedUser.activity && selectedUser.activity.length > 0 ? (
              <div className="space-y-4">
                {selectedUser.activity.map((activity, index) => (
                  <div key={index} className="border-b border-border pb-3">
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{new Date(activity.timestamp).toLocaleString()}</p>
                    {activity.details && <p className="text-sm mt-1">{activity.details}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No activity recorded for this user.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement
