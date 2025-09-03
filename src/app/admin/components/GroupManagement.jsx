// admin/components/GroupManagement.jsx
"use client"

import { useState, useEffect } from "react"

const GroupManagement = () => {
  const [groups, setGroups] = useState([])
  const [filteredGroups, setFilteredGroups] = useState([])
  const [groupSearchQuery, setGroupSearchQuery] = useState("")
  const [groupPage, setGroupPage] = useState(1)
  const [groupTotalPages, setGroupTotalPages] = useState(1)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [showJoinCodeModal, setShowJoinCodeModal] = useState(false)
  const [showReassignModal, setShowReassignModal] = useState(false)
  const [availableUsers, setAvailableUsers] = useState([])
  const [newOwnerId, setNewOwnerId] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const [filters, setFilters] = useState({
    name: "",
    owner: "",
    privacy: "",
  })

  // Initial load
  useEffect(() => {
    fetchGroups()
    fetchAvailableUsers()
  }, [])

  // Filter groups when groups or filters change
  useEffect(() => {
    filterGroups()

    // Polling to auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchGroups(groupPage)
    }, 30000)

    return () => clearInterval(interval)
  }, [groups, filters])

  // Fetch groups from server (initial & pagination)
  const fetchGroups = async (page = 1) => {
    setIsLoading(true)
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(groupSearchQuery && { search: groupSearchQuery }),
        ...(filters.name && { name: filters.name }),
        ...(filters.owner && { owner: filters.owner }),
        ...(filters.privacy && { privacy: filters.privacy }),
      })
      const res = await fetch(`/api/admin/groups?${queryParams}`)
      if (res.ok) {
        const data = await res.json()
        setGroups(data.groups)
        setGroupTotalPages(data.totalPages)
        setGroupPage(data.currentPage)
      }
    } catch (error) {
      console.error("Error fetching groups:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch all users for member management
  const fetchAvailableUsers = async () => {
    try {
      const res = await fetch("/api/admin/users?limit=1000")
      if (res.ok) {
        const data = await res.json()
        setAvailableUsers(data.users)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  // Apply filters locally
  const filterGroups = () => {
    let filtered = groups
    if (filters.name) {
      filtered = filtered.filter((g) => g.name.toLowerCase().includes(filters.name.toLowerCase()))
    }
    if (filters.owner) {
      filtered = filtered.filter(
        (g) =>
          g.creator?.name?.toLowerCase().includes(filters.owner.toLowerCase()) ||
          g.creator?.email?.toLowerCase().includes(filters.owner.toLowerCase()),
      )
    }
    if (filters.privacy) {
      filtered = filtered.filter((g) => (filters.privacy === "public" ? g.isPublic : !g.isPublic))
    }
    setFilteredGroups(filtered)
  }

  // Handle updates instantly
  const handleEditGroup = async (groupId, updates) => {
    try {
      const res = await fetch(`/api/admin/groups/${groupId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      if (res.ok) {
        setGroups((prev) => prev.map((g) => (g._id === groupId ? { ...g, ...updates } : g)))
      }
    } catch (error) {
      console.error("Error updating group:", error)
    }
  }

  const handleDeleteGroup = async (groupId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this group? This action will also delete all associated tasks and notes.",
      )
    )
      return
    try {
      const res = await fetch(`/api/admin/groups/${groupId}`, { method: "DELETE" })
      if (res.ok) {
        setGroups((prev) => prev.filter((g) => g._id !== groupId))
      }
    } catch (error) {
      console.error("Error deleting group:", error)
    }
  }

  const handleAddMember = async (groupId, userId) => {
    try {
      const res = await fetch(`/api/admin/groups/${groupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
      if (res.ok) {
        const newMember = availableUsers.find((u) => u._id === userId)
        setGroups((prev) =>
          prev.map((g) =>
            g._id === groupId
              ? { ...g, members: [...(g.members || []), { user: newMember, role: "member", joinedAt: new Date() }] }
              : g,
          ),
        )
        setShowMembersModal(false)
      }
    } catch (error) {
      console.error("Error adding member:", error)
    }
  }

  const handleRemoveMember = async (groupId, userId) => {
    try {
      const res = await fetch(`/api/admin/groups/${groupId}/members/${userId}`, { method: "DELETE" })
      if (res.ok) {
        setGroups((prev) =>
          prev.map((g) => (g._id === groupId ? { ...g, members: g.members.filter((m) => m.user._id !== userId) } : g)),
        )
      }
    } catch (error) {
      console.error("Error removing member:", error)
    }
  }

  const handleReassignOwnership = async (groupId, newOwnerId) => {
    try {
      const res = await fetch(`/api/admin/groups/${groupId}/owner`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newOwnerId }),
      })
      if (res.ok) {
        const newOwner = availableUsers.find((u) => u._id === newOwnerId)
        setGroups((prev) => prev.map((g) => (g._id === groupId ? { ...g, creator: newOwner } : g)))
        setShowReassignModal(false)
        setNewOwnerId("")
      }
    } catch (error) {
      console.error("Error reassigning ownership:", error)
    }
  }

  const handleSearchGroups = (e) => {
    e.preventDefault()
    fetchGroups(1)
  }

  const handleFilterChange = (filter, value) => {
    setFilters((prev) => ({ ...prev, [filter]: value }))
    fetchGroups(1)
  }

  const viewGroupDetails = (group) => {
    setSelectedGroup(group)
    setShowDetailsModal(true)
  }

  return (
    <div className="bg-card text-card-foreground p-8 md:p-10 rounded-2xl shadow-lg border border-border/70 max-w-7xl mx-auto">
      <h3 className="text-2xl md:text-3xl font-semibold text-foreground mb-8 text-pretty tracking-tight">
        Group Management
      </h3>

      {/* Search & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <input
          type="text"
          placeholder="Search groups..."
          value={groupSearchQuery}
          onChange={(e) => setGroupSearchQuery(e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
        <input
          type="text"
          placeholder="Filter by owner..."
          value={filters.owner}
          onChange={(e) => handleFilterChange("owner", e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
        <select
          value={filters.privacy}
          onChange={(e) => handleFilterChange("privacy", e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-lg bg-input text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <option value="">All Privacy</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
        <button
          onClick={handleSearchGroups}
          className="px-4 py-2 rounded-lg font-semibold bg-primary text-primary-foreground hover:bg-accent transition-colors"
        >
          Search
        </button>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-muted/60">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Group Name</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Creator</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Members</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Privacy</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredGroups.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-6 text-muted-foreground">
                      No groups found.
                    </td>
                  </tr>
                ) : (
                  filteredGroups.map((group) => (
                    <tr key={group._id} className="odd:bg-muted/30 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => viewGroupDetails(group)}
                          className="text-primary hover:text-foreground underline-offset-4 hover:underline font-medium"
                        >
                          {group.name}
                        </button>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {group.creator?.name || "Unknown"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-foreground">{group.members?.length || 0}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <select
                          value={group.isPublic ? "public" : "private"}
                          onChange={(e) => handleEditGroup(group._id, { isPublic: e.target.value === "public" })}
                          className="bg-input border border-border rounded px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                          <option value="public">Public</option>
                          <option value="private">Private</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => viewGroupDetails(group)}
                            className="text-primary hover:text-foreground underline-offset-4 hover:underline text-sm"
                          >
                            View
                          </button>
                          <button
                            onClick={() => {
                              setSelectedGroup(group)
                              setShowMembersModal(true)
                            }}
                            className="text-primary hover:text-foreground underline-offset-4 hover:underline text-sm"
                          >
                            Members
                          </button>
                          <button
                            onClick={() => {
                              setSelectedGroup(group)
                              setShowJoinCodeModal(true)
                            }}
                            className="text-primary hover:text-foreground underline-offset-4 hover:underline text-sm"
                          >
                            Join Code
                          </button>
                          <button
                            onClick={() => {
                              setSelectedGroup(group)
                              setShowReassignModal(true)
                            }}
                            className="text-primary hover:text-foreground underline-offset-4 hover:underline text-sm"
                          >
                            Reassign
                          </button>
                          <button
                            onClick={() => handleDeleteGroup(group._id)}
                            className="text-destructive hover:opacity-80 underline-offset-4 hover:underline text-sm"
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
              onClick={() => fetchGroups(groupPage - 1)}
              disabled={groupPage === 1}
              className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {groupPage} of {groupTotalPages}
            </span>
            <button
              onClick={() => fetchGroups(groupPage + 1)}
              disabled={groupPage === groupTotalPages}
              className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Group Details Modal */}
      {showDetailsModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="groupDetailsTitle"
            className="bg-card p-6 rounded-xl w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto border border-border shadow-lg"
          >
            <h3 id="groupDetailsTitle" className="text-xl font-semibold mb-4">
              Group Details: {selectedGroup.name}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h4 className="font-semibold">Description</h4>
                <p className="text-muted-foreground">{selectedGroup.description || "No description"}</p>
              </div>
              <div>
                <h4 className="font-semibold">Privacy</h4>
                <p className="text-muted-foreground">{selectedGroup.isPublic ? "Public" : "Private"}</p>
              </div>
              <div>
                <h4 className="font-semibold">Created At</h4>
                <p className="text-muted-foreground">{new Date(selectedGroup.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <h4 className="font-semibold">Total Members</h4>
                <p className="text-muted-foreground">{selectedGroup.members?.length || 0}</p>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-semibold mb-2">Recent Tasks</h4>
              {/* Tasks list would go here */}
              <p className="text-muted-foreground">Task list functionality would be implemented here</p>
            </div>

            <div className="mt-6">
              <h4 className="font-semibold mb-2">Recent Notes</h4>
              {/* Notes list would go here */}
              <p className="text-muted-foreground">Note list functionality would be implemented here</p>
            </div>

            <button
              onClick={() => setShowDetailsModal(false)}
              className="mt-6 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Members Management Modal */}
      {showMembersModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="membersTitle"
            className="bg-card p-6 rounded-xl w-11/12 max-w-2xl border border-border shadow-lg"
          >
            <h3 id="membersTitle" className="text-xl font-semibold mb-4">
              Manage Members: {selectedGroup.name}
            </h3>

            <div className="mb-4">
              <h4 className="font-semibold mb-2">Add New Member</h4>
              <select
                className="w-full p-2 border border-border rounded-lg mb-2"
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddMember(selectedGroup._id, e.target.value)
                  }
                }}
              >
                <option value="">Select user to add</option>
                {availableUsers
                  .filter((user) => !selectedGroup.members?.some((member) => member.user._id === user._id))
                  .map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Current Members</h4>
              <ul className="space-y-2">
                {selectedGroup.members?.map((member) => (
                  <li key={member.user._id} className="flex justify-between items-center">
                    <span>
                      {member.user.name} ({member.user.email}) - {member.role}
                    </span>
                    <button
                      onClick={() => handleRemoveMember(selectedGroup._id, member.user._id)}
                      className="text-destructive hover:underline text-sm"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => setShowMembersModal(false)}
              className="mt-6 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Join Code Modal */}
      {showJoinCodeModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="joinCodeTitle"
            className="bg-card p-6 rounded-xl w-11/12 max-w-md border border-border shadow-lg"
          >
            <h3 id="joinCodeTitle" className="text-xl font-semibold mb-4">
              Join Code: {selectedGroup.name}
            </h3>
            <div className="text-center mb-4">
              <p className="text-2xl font-bold text-primary">{selectedGroup.joinCode}</p>
              <p className="text-muted-foreground mt-2">Share this code with users to let them join this group</p>
            </div>
            <button
              onClick={() => setShowJoinCodeModal(false)}
              className="w-full bg-destructive text-destructive-foreground px-4 py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Reassign Ownership Modal */}
      {showReassignModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reassignTitle"
            className="bg-card p-6 rounded-xl w-11/12 max-w-md border border-border shadow-lg"
          >
            <h3 id="reassignTitle" className="text-xl font-semibold mb-4">
              Reassign Ownership: {selectedGroup.name}
            </h3>

            <div className="mb-4">
              <label className="block font-semibold mb-2">Select New Owner</label>
              <select
                className="w-full p-2 border border-border rounded-lg"
                value={newOwnerId}
                onChange={(e) => setNewOwnerId(e.target.value)}
              >
                <option value="">Select new owner</option>
                {selectedGroup.members?.map((member) => (
                  <option key={member.user._id} value={member.user._id}>
                    {member.user.name} ({member.user.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => handleReassignOwnership(selectedGroup._id, newOwnerId)}
                disabled={!newOwnerId}
                className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg disabled:opacity-50"
              >
                Reassign
              </button>
              <button
                onClick={() => setShowReassignModal(false)}
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

export default GroupManagement
