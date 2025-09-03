// admin/components/AnalyticsDashboard.jsx
"use client"

import { useState, useEffect } from "react"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts"

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null)
  const [error, setError] = useState("")
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [range, setRange] = useState("30d")

  const fetchAnalytics = async () => {
    try {
      setError("")
      const url = `/api/admin/analytics${range ? `?range=${encodeURIComponent(range)}` : ""}`
      const res = await fetch(url, { cache: "no-store" })
      const contentType = res.headers.get("content-type") || ""
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
      if (!contentType.includes("application/json")) throw new Error(`Unexpected content-type: ${contentType}`)
      const data = await res.json()
      setAnalytics(data)
    } catch (error) {
      console.error("Error fetching analytics:", error)
      setError(error.message || "Failed to fetch analytics")
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [range])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchAnalytics, 30000)
    return () => clearInterval(interval)
  }, [autoRefresh])

  if (!analytics) {
    return <div className="p-8 text-center">Loading analytics...</div>
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

  return (
    <div className="bg-card text-card-foreground p-8 md:p-10 rounded-2xl shadow-lg border border-border/70 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h3 className="text-2xl md:text-3xl font-semibold text-foreground text-pretty tracking-tight">
          System Analytics
        </h3>
        <div className="flex items-center gap-2">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="px-3 py-2 text-sm border border-border rounded-lg bg-input"
            aria-label="Time range"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button onClick={fetchAnalytics} className="px-3 py-2 rounded-lg bg-secondary text-secondary-foreground">
            Refresh
          </button>
          <label className="inline-flex items-center gap-2 text-sm text-muted-foreground px-2 py-1">
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
            Auto-refresh
          </label>
          <button
            onClick={() => {
              const rows = [
                ["totalUsers", analytics?.totalUsers ?? ""],
                ["activeUsers", analytics?.activeUsers ?? ""],
                ["groupsCreated", analytics?.groupsCreated ?? ""],
                ["tasksCreated", analytics?.tasksCreated ?? ""],
                ["completionRate", analytics?.completionRate ?? ""],
                ["avgTasksPerUser", analytics?.avgTasksPerUser ?? ""],
              ]
              const csv = [
                "Metric,Value",
                ...rows.map((r) => r.map((x) => `"${String(x).replaceAll('"', '""')}"`).join(",")),
              ].join("\n")
              const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
              const url = URL.createObjectURL(blob)
              const a = document.createElement("a")
              a.href = url
              a.download = `analytics-${range}.csv`
              a.click()
              URL.revokeObjectURL(url)
            }}
            className="px-3 py-2 rounded-lg bg-primary text-primary-foreground"
          >
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-sm rounded-lg border border-destructive/30 bg-destructive/10 text-destructive px-3 py-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 mb-10">
        <div className="bg-muted/40 border border-border rounded-xl p-5 text-center shadow-sm hover:shadow transition-shadow">
          <h4 className="text-sm font-medium text-muted-foreground mb-1.5">Total Users</h4>
          <p className="text-3xl font-bold text-primary">{analytics.totalUsers}</p>
        </div>
        <div className="bg-muted/40 border border-border rounded-xl p-5 text-center shadow-sm hover:shadow transition-shadow">
          <h4 className="text-sm font-medium text-muted-foreground mb-1.5">Active Users</h4>
          <p className="text-3xl font-bold text-primary">{analytics.activeUsers}</p>
        </div>
        <div className="bg-muted/40 border border-border rounded-xl p-5 text-center shadow-sm hover:shadow transition-shadow">
          <h4 className="text-sm font-medium text-muted-foreground mb-1.5">Groups Created</h4>
          <p className="text-3xl font-bold text-primary">{analytics.groupsCreated}</p>
        </div>
        <div className="bg-muted/40 border border-border rounded-xl p-5 text-center shadow-sm hover:shadow transition-shadow">
          <h4 className="text-sm font-medium text-muted-foreground mb-1.5">Tasks Created</h4>
          <p className="text-3xl font-bold text-primary">{analytics.tasksCreated}</p>
        </div>
        <div className="bg-muted/40 border border-border rounded-xl p-5 text-center shadow-sm hover:shadow transition-shadow">
          <h4 className="text-sm font-medium text-muted-foreground mb-1.5">Completion Rate</h4>
          <p className="text-3xl font-bold text-primary">{analytics.completionRate}%</p>
        </div>
        <div className="bg-muted/40 border border-border rounded-xl p-5 text-center shadow-sm hover:shadow transition-shadow">
          <h4 className="text-sm font-medium text-muted-foreground mb-1.5">Avg Tasks/User</h4>
          <p className="text-3xl font-bold text-primary">{analytics.avgTasksPerUser}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <div className="bg-muted/30 border border-border rounded-xl p-6">
          <h4 className="text-base md:text-lg font-semibold text-foreground mb-4">Tasks by Status</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.tasksByStatus}
                dataKey="count"
                nameKey="_id"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {analytics.tasksByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-muted/30 border border-border rounded-xl p-6">
          <h4 className="text-base md:text-lg font-semibold text-foreground mb-4">Tasks by Group</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.tasksByGroup}>
              <XAxis dataKey="groupName" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mt-8">
        <div className="bg-muted/30 border border-border rounded-xl p-6">
          <h4 className="text-base md:text-lg font-semibold text-foreground mb-4">User Signups (Weekly)</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.userTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#00C49F" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-muted/30 border border-border rounded-xl p-6">
          <h4 className="text-base md:text-lg font-semibold text-foreground mb-4">Group Creation (Weekly)</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.groupTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#0088FE" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsDashboard
