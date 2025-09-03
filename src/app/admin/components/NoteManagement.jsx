// admin/components/NoteManagement.jsx
"use client"

import { useState, useEffect } from "react"

const NoteManagement = () => {
  const [notes, setNotes] = useState([])
  const [filteredNotes, setFilteredNotes] = useState([])
  const [noteFilters, setNoteFilters] = useState({
    search: "",
    user: "",
    task: "",
    archived: "",
  })
  const [notePage, setNotePage] = useState(1)
  const [noteTotalPages, setNoteTotalPages] = useState(1)
  const [availableUsers, setAvailableUsers] = useState([])
  const [availableTasks, setAvailableTasks] = useState([])
  const [selectedNote, setSelectedNote] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [csvBusy, setCsvBusy] = useState(false)

  useEffect(() => {
    fetchNotes()
    fetchUsers()
    fetchTasks()
  }, [])

  useEffect(() => {
    filterNotes()
  }, [notes, noteFilters])

  const fetchNotes = async (filters = {}, page = 1) => {
    setIsLoading(true)
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        ...(filters.search && { search: filters.search }),
        ...(filters.user && { user: filters.user }),
        ...(filters.task && { task: filters.task }),
        ...(filters.archived && { archived: filters.archived }),
      })

      const res = await fetch(`/api/admin/notes?${queryParams}`)
      if (res.ok) {
        const data = await res.json()
        setNotes(data.notes)
        setNoteTotalPages(data.totalPages)
        setNotePage(data.currentPage)
      }
    } catch (error) {
      console.error("Error fetching notes:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUsers = async () => {
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

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/admin/tasks?limit=1000")
      if (res.ok) {
        const data = await res.json()
        setAvailableTasks(data.tasks)
      }
    } catch (error) {
      console.error("Error fetching tasks:", error)
    }
  }

  const filterNotes = () => {
    let filtered = notes

    if (noteFilters.search) {
      filtered = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(noteFilters.search.toLowerCase()) ||
          note.content.toLowerCase().includes(noteFilters.search.toLowerCase()) ||
          note.tags?.some((tag) => tag.toLowerCase().includes(noteFilters.search.toLowerCase())),
      )
    }

    setFilteredNotes(filtered)
  }

  const handleEditNote = async (noteId, updates) => {
    try {
      const res = await fetch(`/api/admin/notes/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (res.ok) {
        fetchNotes(noteFilters, notePage)
        setShowEditModal(false)
        setSelectedNote(null)
      }
    } catch (error) {
      console.error("Error updating note:", error)
    }
  }

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("Are you sure you want to delete this note? This action cannot be undone.")) return

    try {
      const res = await fetch(`/api/admin/notes/${noteId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        fetchNotes(noteFilters, notePage)
      }
    } catch (error) {
      console.error("Error deleting note:", error)
    }
  }

  const handleArchiveNote = async (noteId, archive = true) => {
    try {
      const res = await fetch(`/api/admin/notes/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: archive }),
      })

      if (res.ok) {
        fetchNotes(noteFilters, notePage)
      }
    } catch (error) {
      console.error("Error archiving note:", error)
    }
  }

  const handleFilterChange = (filter, value) => {
    const newFilters = { ...noteFilters, [filter]: value }
    setNoteFilters(newFilters)
    fetchNotes(newFilters, 1)
  }

  const openEditModal = (note) => {
    setSelectedNote(note)
    setShowEditModal(true)
  }

  const openDetailsModal = (note) => {
    setSelectedNote(note)
    setShowDetailsModal(true)
  }

  const truncateContent = (content, maxLength = 100) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + "..."
  }

  return (
    <div className="bg-card text-card-foreground p-8 md:p-10 rounded-2xl shadow-lg border border-border/70 max-w-7xl mx-auto">
      {/* Header toolbar with quick filters and CSV export */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h3 className="text-2xl md:text-3xl font-semibold text-foreground text-pretty tracking-tight">
          Note Management
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleFilterChange("archived", "")}
            className={`px-3 py-2 rounded-lg text-sm ${noteFilters.archived === "" ? "bg-muted" : "bg-input"}`}
            aria-pressed={noteFilters.archived === ""}
          >
            All
          </button>
          <button
            onClick={() => handleFilterChange("archived", "false")}
            className={`px-3 py-2 rounded-lg text-sm ${noteFilters.archived === "false" ? "bg-muted" : "bg-input"}`}
            aria-pressed={noteFilters.archived === "false"}
          >
            Active
          </button>
          <button
            onClick={() => handleFilterChange("archived", "true")}
            className={`px-3 py-2 rounded-lg text-sm ${noteFilters.archived === "true" ? "bg-muted" : "bg-input"}`}
            aria-pressed={noteFilters.archived === "true"}
          >
            Archived
          </button>
          <button
            onClick={() => {
              setCsvBusy(true)
              const header = ["Title", "Author", "Task", "Tags", "Created", "Status"]
              const rows = filteredNotes.map((n) => [
                n.title,
                n.user?.name || "",
                n.task?.title || "",
                (n.tags || []).join("|"),
                n.createdAt ? new Date(n.createdAt).toISOString() : "",
                n.isArchived ? "Archived" : "Active",
              ])
              const csv = [
                header.join(","),
                ...rows.map((r) => r.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(",")),
              ].join("\n")
              const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
              const url = URL.createObjectURL(blob)
              const a = document.createElement("a")
              a.href = url
              a.download = "notes.csv"
              a.click()
              URL.revokeObjectURL(url)
              setCsvBusy(false)
            }}
            disabled={csvBusy}
            className="px-3 py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-60"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <input
          type="text"
          placeholder="Search notes..."
          className="px-3 py-2 text-sm border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          value={noteFilters.search}
          onChange={(e) => handleFilterChange("search", e.target.value)}
        />
        <select
          value={noteFilters.user}
          onChange={(e) => handleFilterChange("user", e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-lg bg-input text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <option value="">All Users</option>
          {availableUsers.map((user) => (
            <option key={user._id} value={user._id}>
              {user.name}
            </option>
          ))}
        </select>
        <select
          value={noteFilters.task}
          onChange={(e) => handleFilterChange("task", e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-lg bg-input text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <option value="">All Tasks</option>
          {availableTasks.map((task) => (
            <option key={task._id} value={task._id}>
              {task.title}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-muted/60">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Title</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Author</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Task</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Tags</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Created</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredNotes.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-6 text-muted-foreground">
                      No notes found.
                    </td>
                  </tr>
                ) : (
                  filteredNotes.map((note) => (
                    <tr
                      key={note._id}
                      className={`${note.isArchived ? "opacity-60" : ""} odd:bg-muted/30 hover:bg-muted/50 transition-colors`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => openDetailsModal(note)}
                          className="text-primary hover:text-foreground underline-offset-4 hover:underline font-medium"
                        >
                          {note.title}
                        </button>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {note.user?.name || "Unknown"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {note.task?.title || "No Task"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {note.tags?.slice(0, 3).map((tag) => (
                            <span key={tag} className="bg-muted px-2 py-1 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                          {note.tags?.length > 3 && (
                            <span className="bg-muted px-2 py-1 rounded text-xs">+{note.tags.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            note.isArchived ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary"
                          }`}
                        >
                          {note.isArchived ? "Archived" : "Active"}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => openDetailsModal(note)}
                            className="text-primary hover:text-foreground underline-offset-4 hover:underline text-sm"
                          >
                            View
                          </button>
                          <button
                            onClick={() => openEditModal(note)}
                            className="text-primary hover:text-foreground underline-offset-4 hover:underline text-sm"
                          >
                            Edit
                          </button>
                          {note.isArchived ? (
                            <button
                              onClick={() => handleArchiveNote(note._id, false)}
                              className="text-primary hover:text-foreground underline-offset-4 hover:underline text-sm"
                            >
                              Unarchive
                            </button>
                          ) : (
                            <button
                              onClick={() => handleArchiveNote(note._id, true)}
                              className="text-primary hover:text-foreground underline-offset-4 hover:underline text-sm"
                            >
                              Archive
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteNote(note._id)}
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
              onClick={() => fetchNotes(noteFilters, notePage - 1)}
              disabled={notePage === 1}
              className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {notePage} of {noteTotalPages}
            </span>
            <button
              onClick={() => fetchNotes(noteFilters, notePage + 1)}
              disabled={notePage === noteTotalPages}
              className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedNote && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="noteDetailsTitle"
            className="bg-card p-6 rounded-xl w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto border border-border shadow-lg"
          >
            <h3 id="noteDetailsTitle" className="text-xl font-semibold mb-4">
              Note Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h4 className="font-semibold">Title</h4>
                <p className="text-muted-foreground">{selectedNote.title}</p>
              </div>
              <div>
                <h4 className="font-semibold">Author</h4>
                <p className="text-muted-foreground">{selectedNote.user?.name || "Unknown"}</p>
              </div>
              <div>
                <h4 className="font-semibold">Task</h4>
                <p className="text-muted-foreground">{selectedNote.task?.title || "No Task"}</p>
              </div>
              <div>
                <h4 className="font-semibold">Status</h4>
                <p className="text-muted-foreground">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      selectedNote.isArchived ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"
                    }`}
                  >
                    {selectedNote.isArchived ? "Archived" : "Active"}
                  </span>
                </p>
              </div>
              <div>
                <h4 className="font-semibold">Created</h4>
                <p className="text-muted-foreground">{new Date(selectedNote.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <h4 className="font-semibold">Last Updated</h4>
                <p className="text-muted-foreground">{new Date(selectedNote.updatedAt).toLocaleString()}</p>
              </div>
            </div>

            {selectedNote.tags && selectedNote.tags.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedNote.tags.map((tag) => (
                    <span key={tag} className="bg-muted px-3 py-1 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <h4 className="font-semibold mb-2">Content</h4>
              <div className="bg-muted/30 p-4 rounded-lg whitespace-pre-wrap">{selectedNote.content}</div>
            </div>

            {selectedNote.summary && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2">AI Summary</h4>
                <div className="bg-primary/10 p-4 rounded-lg italic">{selectedNote.summary}</div>
              </div>
            )}

            <button
              onClick={() => setShowDetailsModal(false)}
              className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedNote && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="editNoteTitle"
            className="bg-card p-6 rounded-xl w-11/12 max-w-2xl border border-border shadow-lg"
          >
            <h3 id="editNoteTitle" className="text-xl font-semibold mb-4">
              Edit Note
            </h3>

            <div className="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label className="block font-semibold mb-2">Title</label>
                <input
                  type="text"
                  value={selectedNote.title}
                  onChange={(e) => setSelectedNote({ ...selectedNote, title: e.target.value })}
                  className="w-full p-2 border border-border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Content</label>
                <textarea
                  value={selectedNote.content}
                  onChange={(e) => setSelectedNote({ ...selectedNote, content: e.target.value })}
                  className="w-full p-2 border border-border rounded-lg"
                  rows={8}
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={selectedNote.tags?.join(", ") || ""}
                  onChange={(e) =>
                    setSelectedNote({
                      ...selectedNote,
                      tags: e.target.value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter((tag) => tag),
                    })
                  }
                  className="w-full p-2 border border-border rounded-lg"
                  placeholder="tag1, tag2, tag3"
                />
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() =>
                  handleEditNote(selectedNote._id, {
                    title: selectedNote.title,
                    content: selectedNote.content,
                    tags: selectedNote.tags,
                  })
                }
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

export default NoteManagement
