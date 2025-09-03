"use client"

import React from "react"
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const ChartContext = React.createContext(null)

function Chart({ data, children }) {
  return <ChartContext.Provider value={{ data }}>{children}</ChartContext.Provider>
}

function ChartContainer({ children }) {
  const { data } = React.useContext(ChartContext)

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data}>{children}</ComposedChart>
    </ResponsiveContainer>
  )
}

function ChartGrid() {
  return <CartesianGrid strokeDasharray="3 3" />
}

function ChartTooltip({ children }) {
  return <Tooltip content={children} />
}

function ChartTooltipContent({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  
  return (
    <div className="rounded-lg border bg-white/95 p-2 shadow-sm">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col">
          <span className="text-[0.70rem] uppercase text-[#1E3A8A]">Day</span>
          <span className="font-bold text-[#3B82F6]">{label}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[0.70rem] uppercase text-[#1E3A8A]">Tasks</span>
          <span className="font-bold text-[#3B82F6]">{payload[0].value}</span>
        </div>
      </div>
    </div>
  )
}

function ChartXAxis() {
  return <XAxis dataKey="day" />
}

function ChartYAxis() {
  return <YAxis />
}

function ChartLegend() {
  return <Legend />
}

function ChartLine({ x, y, style }) {
  return <Line type="monotone" dataKey={y} stroke={style?.stroke || "#1E3A8A"} />
}

function ChartBar({ x, y, style }) {
  return <Bar dataKey={y} fill={style?.fill || "#3B82F6"} />
}

function ChartArea({ x, y, style }) {
  return <Area type="monotone" dataKey={y} fill={style?.fill || "#3B82F6"} stroke={style?.stroke || "#1E3A8A"} />
}

export {
  Chart,
  ChartContainer,
  ChartGrid,
  ChartTooltip,
  ChartTooltipContent,
  ChartXAxis,
  ChartYAxis,
  ChartLegend,
  ChartLine,
  ChartBar,
  ChartArea,
}

