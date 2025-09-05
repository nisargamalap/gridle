// src/app/dashboard/page.jsx
"use client"

import { useState, useEffect } from "react"
import Calendar from "react-calendar"
import { PlusIcon } from "../../components/ui/ClientLayout"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import VoiceWidget from "../assistant/voice-widget"

const DashboardPage = () => {
  const [date, setDate] = useState(new Date())
  const [tasks, setTasks] = useState([])
  const [notes, setNotes] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [viewItem, setViewItem] = useState(null)
  const [newItem, setNewItem] = useState({
    title: "",
    description: "",
    dueDate: new Date(),
    type: "task",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("tasks") // 'tasks' or 'notes'
  const router = useRouter()
  const { data: session } = useSession()
  const [userName, setUserName] = useState(session?.user?.name || "User")
  const [voiceText, setVoiceText] = useState("")
  // 🔹 Whenever session changes, sync userName
  useEffect(() => {
    if (session?.user?.name) {
      setUserName(session.user.name)
    }
  }, [session])

  // 🔹 Listen for updates from settings page
  useEffect(() => {
    const handleUserDataChange = (event) => {
      if (event.detail && event.detail.name) {
        setUserName(event.detail.name)
        // save to localStorage so it stays on refresh
        localStorage.setItem("userData", JSON.stringify({ name: event.detail.name }))
      }
    }

    window.addEventListener("userDataChanged", handleUserDataChange)
    return () => {
      window.removeEventListener("userDataChanged", handleUserDataChange)
    }
  }, [])

  // 🔹 On mount, check localStorage if user has updated name before
  useEffect(() => {
    try {
      const userData = localStorage.getItem("userData")
      if (userData) {
        const parsedData = JSON.parse(userData)
        if (parsedData.name) {
          setUserName(parsedData.name)
        }
      }
    } catch (error) {
      console.error("Error reading from localStorage:", error)
    }
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      if (!session) return

      try {
        setIsLoading(true)
        const [tasksRes, notesRes] = await Promise.all([fetch("/api/tasks"), fetch("/api/notes")])

        if (!tasksRes.ok) throw new Error("Failed to fetch tasks")
        if (!notesRes.ok) throw new Error("Failed to fetch notes")

        const tasksData = await tasksRes.json()
        const notesData = await notesRes.json()

        setTasks(tasksData)
        setNotes(notesData)
      } catch (err) {
        console.error("Fetch error:", err)
        alert("Failed to load data")
      } finally {
        setIsLoading(false)
      }
    }

    if (session) {
      fetchData()
    }
  }, [session])

  const selectedDateTasks = tasks.filter((task) => {
    const d = new Date(task.dueDate)
    return d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear()
  })

  const selectedDateNotes = notes.filter((note) => {
    const d = new Date(note.createdAt || new Date())
    return d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear()
  })

  const tasksDueToday = tasks.filter((task) => {
    const d = new Date(task.dueDate)
    return (
      d.getDate() === new Date().getDate() &&
      d.getMonth() === new Date().getMonth() &&
      d.getFullYear() === new Date().getFullYear() &&
      task.status !== "completed"
    )
  })

  const startOfWeek = new Date()
  startOfWeek.setDate(new Date().getDate() - new Date().getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)

  const tasksCompletedThisWeek = tasks.filter((task) => {
    const updatedAt = new Date(task.updatedAt || task.dueDate)
    return task.status === "completed" && updatedAt >= startOfWeek && updatedAt <= endOfWeek
  })

  const topPriorityTask = tasks
    .filter((task) => task.status !== "completed")
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0]

  const tileContent = ({ date: tileDate, view }) => {
    if (view === "month") {
      const dayTasks = tasks.filter((task) => {
        const d = new Date(task.dueDate)
        return (
          d.getDate() === tileDate.getDate() &&
          d.getMonth() === tileDate.getMonth() &&
          d.getFullYear() === tileDate.getFullYear()
        )
      })
      const dayNotes = notes.filter((note) => {
        const d = new Date(note.createdAt || new Date())
        return (
          d.getDate() === tileDate.getDate() &&
          d.getMonth() === tileDate.getMonth() &&
          d.getFullYear() === tileDate.getFullYear()
        )
      })
      if (dayTasks.length || dayNotes.length) return <div className="event-dot"></div>
    }
    return null
  }

  const handleGoToTasksPage = () => router.push("/tasks")

  const handleAddItem = async () => {
    if (!newItem.title) return alert("Title is required")
    if (!session) return alert("Please sign in first")

    try {
      setIsLoading(true)

      if (newItem.type === "task") {
        // Create task
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: newItem.title,
            description: newItem.description,
            dueDate: newItem.dueDate,
            status: "todo",
          }),
        })

        if (!res.ok) throw new Error("Failed to create task")
        const createdTask = await res.json()
        setTasks((prev) => [...prev, createdTask])
      } else {
        // Create note without requiring a task
        const res = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: newItem.title,
            content: newItem.description,
            tags: [],
            // task field is optional now, so we don't need to provide it
          }),
        })

        if (!res.ok) throw new Error("Failed to create note")
        const createdNote = await res.json()
        setNotes((prev) => [...prev, createdNote])
      }

      setNewItem({ title: "", description: "", dueDate: new Date(), type: "task" })
      setShowModal(false)
    } catch (err) {
      console.error("Add item error:", err)
      alert(`Failed to add ${newItem.type}: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTaskCompletion = async (taskId) => {
    try {
      const task = tasks.find((t) => t._id === taskId)
      if (!task) {
        alert("Task not found")
        return
      }

      // Your API uses "todo" and "completed" status values
      const newStatus = task.status === "completed" ? "todo" : "completed"

      // Update backend using PUT
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || `Server returned ${res.status}`)
      }

      const updatedTask = await res.json()

      // Then update frontend state
      setTasks((prev) => prev.map((task) => (task._id === taskId ? updatedTask : task)))

      // If we're viewing this task, update the viewItem as well
      if (viewItem && viewItem._id === taskId) {
        setViewItem(updatedTask)
      }
    } catch (err) {
      console.error("Task completion error:", err)
      alert(`Failed to update task status: ${err.message}`)
    }
  }

  const handleViewItem = (item, type) => setViewItem({ ...item, type })
  const closeViewModal = () => setViewItem(null)

  if (isLoading && tasks.length === 0 && notes.length === 0) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  return (
    <div className="relative h-full flex flex-col space-y-6">
      <h2 className="text-3xl font-bold text-foreground mb-4">Good Morning, {userName}!</h2>

      {/* Top Priority & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card text-card-foreground p-8 rounded-2xl shadow-lg border border-border flex flex-col justify-between">
          <div className="relative flex items-center justify-between mb-3">
            <h3 className="text-xl font-semibold">
              Your Top Priority{" "}
              <span className="inline-flex items-center ml-2 px-3 py-1 text-xs font-medium rounded-full bg-accent text-accent-foreground">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l3 3a1 1 0 001.414-1.414L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                AI Suggestion
              </span>
            </h3>
            <div className="relative flex items-center gap-2">
              {/* Voice widget anchored here */}
              <VoiceWidget position="inline" onResult={setVoiceText} />
            </div>
          </div>
          {/* 🔹 Show transcription result */}
      {voiceText && (
        <p className="text-sm text-muted-foreground mb-4">
          AI heard: {voiceText}
        </p>
      )}
          {topPriorityTask ? (
            <>
              <p className="text-2xl md:text-3xl font-bold text-foreground mb-3 leading-tight">
                {topPriorityTask.title}
              </p>
              <p className="text-base text-muted-foreground mb-4">
                Due:{" "}
                {new Date(topPriorityTask.dueDate).toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <p className="text-sm text-muted-foreground mb-6">{topPriorityTask.description}</p>
            </>
          ) : (
            <p className="text-muted-foreground">No pending tasks to suggest.</p>
          )}
          <button
            onClick={handleGoToTasksPage}
            className="self-start bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-accent transition-colors duration-200 shadow-md"
          >
            Go to Tasks Page
          </button>
        </div>

        <div className="lg:col-span-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          <div className="bg-card text-card-foreground p-6 rounded-2xl shadow-md border border-border flex flex-col justify-center items-center text-center">
            <span className="text-accent mb-2">
              <svg className="w-9 h-9" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l3 3a1 1 0 001.414-1.414L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <p className="text-sm text-muted-foreground mb-1">Tasks Due Today</p>
            <p className="text-4xl font-extrabold text-foreground">{tasksDueToday.length}</p>
          </div>
          <div className="bg-card text-card-foreground p-6 rounded-2xl shadow-md border border-border flex flex-col justify-center items-center text-center">
            <span className="text-green-500 mb-2">
              <svg className="w-9 h-9" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <p className="text-sm text-muted-foreground mb-1">Completed This Week</p>
            <p className="text-4xl font-extrabold text-foreground">{tasksCompletedThisWeek.length}</p>
          </div>
        </div>
      </div>

      {/* Calendar & Daily Tasks/Notes */}
      <div className="bg-card text-card-foreground p-8 rounded-2xl shadow-lg border border-border">
        <h3 className="text-xl font-semibold text-foreground mb-5">Upcoming Deadlines & Items</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col items-center">
            <Calendar onChange={setDate} value={date} tileContent={tileContent} className="w-full max-w-sm" />
          </div>
          <div className="pt-0 md:pt-2">
            {/* Tabs for Tasks and Notes */}
            <div className="flex border-b border-border mb-4">
              <button
                className={`py-2 px-4 font-medium ${activeTab === "tasks" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
                onClick={() => setActiveTab("tasks")}
              >
                Tasks
              </button>
              <button
                className={`py-2 px-4 font-medium ${activeTab === "notes" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
                onClick={() => setActiveTab("notes")}
              >
                Notes
              </button>
            </div>

            {activeTab === "tasks" ? (
              <>
                <h4 className="text-lg font-semibold text-foreground mb-4">
                  Tasks for{" "}
                  {date.toLocaleDateString("en-IN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </h4>
                {selectedDateTasks.length === 0 ? (
                  <p className="text-muted-foreground">No tasks scheduled for this date.</p>
                ) : (
                  <ul className="space-y-3">
                    {selectedDateTasks.map((task) => (
                      <li
                        key={task._id}
                        className="bg-muted/30 p-4 rounded-lg flex items-center justify-between border border-border"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={task.status === "completed"}
                            onChange={() => handleTaskCompletion(task._id)}
                            className="w-4 h-4 accent-primary cursor-pointer"
                          />
                          <div>
                            <p
                              className={`font-medium text-foreground ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}
                            >
                              {task.title}
                            </p>
                            <p className="text-sm text-muted-foreground">{task.description}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleViewItem(task, "task")}
                          className="text-primary hover:underline text-sm ml-4 flex-shrink-0"
                        >
                          View
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <>
                <h4 className="text-lg font-semibold text-foreground mb-4">
                  Notes for{" "}
                  {date.toLocaleDateString("en-IN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </h4>
                {selectedDateNotes.length === 0 ? (
                  <p className="text-muted-foreground">No notes for this date.</p>
                ) : (
                  <ul className="space-y-3">
                    {selectedDateNotes.map((note) => (
                      <li
                        key={note._id}
                        className="bg-muted/30 p-4 rounded-lg flex items-center justify-between border border-border"
                      >
                        <div>
                          <p className="font-medium text-foreground">{note.title}</p>
                          <p className="text-sm text-muted-foreground">{note.content}</p>
                        </div>
                        <button
                          onClick={() => handleViewItem(note, "note")}
                          className="text-primary hover:underline text-sm ml-4 flex-shrink-0"
                        >
                          View
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Productivity Placeholder */}
      <div className="bg-card text-card-foreground p-8 rounded-2xl shadow-lg border border-border">
        <h3 className="text-xl font-semibold text-foreground mb-5">Productivity Trends</h3>
        <div className="h-52 bg-muted/50 flex items-center justify-center rounded-lg text-muted-foreground">
          [Advanced Productivity Graph Placeholder]
        </div>
      </div>

      {/* Floating + Button */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-primary text-primary-foreground shadow-xl hover:bg-accent transition-colors duration-200 z-20"
      >
        <PlusIcon />
      </button>

      {/* Add Task/Note Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-2xl w-full max-w-md shadow-lg border border-border">
            <h3 className="text-xl font-semibold text-foreground mb-4">Add New</h3>

            <div className="mb-4 flex gap-4">
              <button
                onClick={() => setNewItem({ ...newItem, type: "task" })}
                className={`px-3 py-1 rounded ${newItem.type === "task" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}
              >
                Task
              </button>
              <button
                onClick={() => setNewItem({ ...newItem, type: "note" })}
                className={`px-3 py-1 rounded ${newItem.type === "note" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}
              >
                Note
              </button>
            </div>

            <input
              type="text"
              placeholder="Title"
              value={newItem.title}
              onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
              className="w-full p-2 mb-3 border rounded"
            />
            <textarea
              placeholder={newItem.type === "task" ? "Description" : "Content"}
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              className="w-full p-2 mb-3 border rounded"
            />
            {newItem.type === "task" && (
              <input
                type="date"
                value={new Date(newItem.dueDate).toISOString().split("T")[0]}
                onChange={(e) => setNewItem({ ...newItem, dueDate: new Date(e.target.value) })}
                className="w-full p-2 mb-3 border rounded"
              />
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-muted text-foreground rounded hover:bg-muted/70"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-accent"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Task/Note Modal */}
      {viewItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-2xl w-full max-w-md shadow-lg border border-border">
            <h3 className="text-xl font-semibold text-foreground mb-2">{viewItem.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {viewItem.type === "task" ? viewItem.description : viewItem.content}
            </p>

            {viewItem.type === "task" && (
              <>
                <p className="text-xs text-muted-foreground mb-2">
                  Due:{" "}
                  {new Date(viewItem.dueDate).toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    checked={viewItem.status === "completed"}
                    onChange={() => handleTaskCompletion(viewItem._id)}
                    className="w-4 h-4 accent-primary cursor-pointer"
                  />
                  <span className="text-sm">{viewItem.status === "completed" ? "Completed" : "To Do"}</span>
                </div>
              </>
            )}

            {viewItem.type === "note" && (
              <p className="text-xs text-muted-foreground mb-4">
                Created:{" "}
                {new Date(viewItem.createdAt || new Date()).toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button onClick={closeViewModal} className="px-4 py-2 bg-muted text-foreground rounded hover:bg-muted/70">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardPage

