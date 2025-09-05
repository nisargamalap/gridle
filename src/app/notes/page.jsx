// src/app/notes/page.jsx
"use client"

import { useState, useEffect } from "react"
import { PlusIcon } from "../../components/ui/ClientLayout"
import { HiMicrophone } from "react-icons/hi"

const NotesPage = () => {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [isEditingNote, setIsEditingNote] = useState(false)
  const [currentNoteToEdit, setCurrentNoteToEdit] = useState(null)
  const [noteFormTitle, setNoteFormTitle] = useState("")
  const [noteFormContent, setNoteFormContent] = useState("")
  const [isSavingNote, setIsSavingNote] = useState(false)

  // Fetch notes from API
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/notes")

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Failed to fetch notes")
        }

        const data = await response.json()

        // Transform API data if needed
        const transformedNotes = data.map((note) => ({
          _id: note._id,
          title: note.title,
          content: note.content,
          task: note.task || null,
          updatedAt: note.updatedAt,
        }))

        setNotes(transformedNotes)
      } catch (error) {
        console.error("Error fetching notes:", error)
        alert(error.message || "Failed to load notes")
      } finally {
        setLoading(false)
      }
    }

    fetchNotes()
  }, [])

  const openNoteModal = (note = null) => {
    if (note) {
      setIsEditingNote(true)
      setCurrentNoteToEdit(note)
      setNoteFormTitle(note.title)
      setNoteFormContent(note.content)
    } else {
      setIsEditingNote(false)
      setCurrentNoteToEdit(null)
      setNoteFormTitle("")
      setNoteFormContent("")
    }
    setShowNoteModal(true)
  }

  const handleSaveNote = async (e) => {
    e.preventDefault()

    // Validate form
    if (!noteFormTitle.trim() || !noteFormContent.trim()) {
      alert("Note title and content are required.")
      return
    }

    setIsSavingNote(true)

    try {
      if (isEditingNote && currentNoteToEdit) {
        // Update existing note
        const response = await fetch(`/api/notes/${currentNoteToEdit._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: noteFormTitle,
            content: noteFormContent,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Failed to update note")
        }

        const updatedNote = await response.json()
        setNotes((prevNotes) => prevNotes.map((n) => (n._id === updatedNote._id ? updatedNote : n)))
        alert("Note updated successfully!")
      } else {
        // Create new note
        // For demo purposes, using a placeholder task ID
        // In a real app, you would implement task selection
        const response = await fetch("/api/notes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: noteFormTitle,
            content: noteFormContent,
            task: "67a1b2c3d4e5f67890123456", // Placeholder task ID
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Failed to create note")
        }

        const newNote = await response.json()
        setNotes((prevNotes) => [...prevNotes, newNote])
        alert("Note added successfully!")
      }
      setShowNoteModal(false)
    } catch (error) {
      console.error("Error saving note:", error)
      alert(error.message || "Failed to save note")
    } finally {
      setIsSavingNote(false)
    }
  }

  const handleDeleteNote = async (noteId) => {
    const noteToDelete = notes.find((n) => n._id === noteId)

    if (!noteToDelete) {
      alert("Note not found")
      return
    }

    if (window.confirm(`Are you sure you want to delete note "${noteToDelete.title}"?`)) {
      try {
        const response = await fetch(`/api/notes/${noteId}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Failed to delete note")
        }

        // Check if the response has content before trying to parse it
        const responseText = await response.text()
        const result = responseText ? JSON.parse(responseText) : {}

        setNotes((prevNotes) => prevNotes.filter((note) => note._id !== noteId))
        alert(`Note "${noteToDelete.title}" deleted successfully.`)
      } catch (error) {
        console.error("Error deleting note:", error)
        alert(error.message || "Failed to delete note")
      }
    }
  }

  const handleSummarizeNote = async (noteId) => {
    alert(`Summarizing note using AI... (Feature coming soon!)`)
    // In a real app, you would call an AI API endpoint here
  }

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.content && note.content.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="relative h-full flex flex-col gap-6">
      <input
        type="text"
        placeholder="Search notes..."
        className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <div className="flex-1 overflow-y-auto bg-card text-card-foreground p-6 rounded-xl shadow-md border border-border">
        {filteredNotes.length === 0 ? (
          <p className="text-center text-muted-foreground">
            {searchQuery ? "No notes found matching your search." : "No notes found. Create your first note!"}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((note) => (
              <div
                key={note._id}
                className="p-4 border border-border rounded-lg shadow-sm bg-card hover:bg-muted/40 transition-colors"
              >
                <h3 className="text-base font-semibold text-foreground mb-1.5 text-pretty">{note.title}</h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{note.content}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Last Modified: {new Date(note.updatedAt).toLocaleDateString("en-IN")}</span>
                  <div className="flex items-center gap-3">
                    {note.task && <span className="text-primary">Task: {note.task.title}</span>}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openNoteModal(note)}
                        className="text-primary hover:text-foreground underline-offset-4 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note._id)}
                        className="text-destructive hover:opacity-80 underline-offset-4 hover:underline"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => handleSummarizeNote(note._id)}
                        className="text-primary hover:text-foreground underline-offset-4 hover:underline"
                      >
                        Summarize (AI)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        aria-label="Create note"
        onClick={() => openNoteModal()}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-primary text-primary-foreground shadow-xl hover:bg-accent transition-colors duration-200 z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <PlusIcon />
      </button>

      {showNoteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="noteModalTitle"
            className="bg-card p-6 md:p-8 rounded-xl shadow-lg w-full max-w-lg border border-border"
          >
            <h3 id="noteModalTitle" className="text-xl md:text-2xl font-semibold text-foreground mb-6">
              {isEditingNote ? "Edit Note" : "Create New Note"}
            </h3>
            <form onSubmit={handleSaveNote} className="space-y-4">
              <input
                type="text"
                placeholder="Note Title"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                value={noteFormTitle}
                onChange={(e) => setNoteFormTitle(e.target.value)}
                required
              />
              <textarea 
                spellCheck={true}
              autoComplete="on"
              autoCapitalize="on"
              autoCorrect="on"
                placeholder="Start writing your note here..."
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent h-36"
                value={noteFormContent}
                onChange={(e) => setNoteFormContent(e.target.value)}
                required
              ></textarea>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  className="flex items-center text-primary hover:text-foreground text-sm underline-offset-4 hover:underline"
                >
                  {/* Voice input placeholder button, logic unchanged */}
                  <HiMicrophone className="mr-1" /> Voice Input (AI)
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNoteModal(false)}
                    className="px-4 py-2 rounded-lg font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    disabled={isSavingNote}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg font-semibold bg-primary text-primary-foreground hover:bg-accent transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent flex items-center justify-center"
                    disabled={isSavingNote}
                  >
                    {isSavingNote ? (
                      <svg
                        className="animate-spin h-5 w-5 mr-2 text-primary-foreground"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    ) : isEditingNote ? (
                      "Save Changes"
                    ) : (
                      "Save Note"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotesPage
