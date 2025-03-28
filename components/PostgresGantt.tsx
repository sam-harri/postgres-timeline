"use client"

import { useRef, useState } from "react"
import { motion } from "framer-motion"
import { PostgresLifespan } from "@/types/postgres"

interface PostgresGanttProps {
  lifespans: PostgresLifespan[]
}

export default function PostgresGantt({ lifespans }: PostgresGanttProps) {
  const [hoveredVersion, setHoveredVersion] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Sort versions by first commit date (newest first)
  const sortedLifespans = [...lifespans].sort((a, b) => {
    return new Date(b.first_release_date).getTime() - new Date(a.first_release_date).getTime()
  })

  // Find the earliest and latest dates to set the timeline range
  const earliestDate = new Date(Math.min(...sortedLifespans.map((span) => new Date(span.first_release_date).getTime())))

  const latestDate = new Date()

  // Calculate the total time range in milliseconds
  const timeRange = latestDate.getTime() - earliestDate.getTime()

  // Function to calculate position percentage based on date
  const getPositionPercentage = (dateStr: string) => {
    const date = new Date(dateStr)
    const timeDiff = date.getTime() - earliestDate.getTime()
    // Format to a fixed number of decimal places to ensure consistency
    return Number((timeDiff / timeRange * 100).toFixed(4))
  }

  // Generate year markers for the timeline
  const generateYearMarkers = () => {
    const years: number[] = []
    const startYear = earliestDate.getFullYear()
    const endYear = latestDate.getFullYear()

    for (let year = startYear; year <= endYear; year++) {
      years.push(year)
    }

    return years
  }

  const yearMarkers = generateYearMarkers()

  // Format date for display
  const formatDate = (dateStr: string) => {
    if (dateStr === "present") return "Present"
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="w-full bg-[#0d0e10] rounded-lg p-6 shadow-lg overflow-hidden text-white">
      <h2 className="text-2xl font-bold mb-6 text-center">
        <span className="bg-gradient-to-r from-[#32c2e8] to-[#63f655] bg-clip-text text-transparent relative after:absolute after:inset-0 after:bg-black after:opacity-20">
          PostgreSQL Version Lifespans
        </span>
      </h2>

      {/* Year markers */}
      <div className="relative h-8 mb-4 border-b border-gray-700">
        {yearMarkers.map((year) => {
          const yearPosition = getPositionPercentage(`${year}-01-01`)
          return (
            <div
              key={year}
              className="absolute transform -translate-x-1/2 text-xs text-gray-400"
              style={{ left: `${yearPosition.toFixed(4)}%` }}
            >
              <div className="h-2 w-px bg-gray-700 mx-auto mb-1"></div>
              {year}
            </div>
          )
        })}
      </div>

      {/* Gantt bars */}
      <div ref={containerRef} className="relative space-y-1">
        {sortedLifespans.map((span, index) => {
          const startPosition = getPositionPercentage(span.first_release_date)
          const endPosition = span.last_release_date === "present" ? 100 : getPositionPercentage(span.last_release_date)
          const width = endPosition - startPosition
          const showLeftLabel = index < sortedLifespans.length - 6

          return (
            <div
              key={span.major_version}
              className="relative h-6"
              onMouseEnter={() => setHoveredVersion(span.major_version)}
              onMouseLeave={() => setHoveredVersion(null)}
            >
              {/* Version label - left side for most rows */}
              {showLeftLabel ? (
                <div 
                  className="absolute top-1/2 whitespace-nowrap text-right pr-2"
                  style={{ 
                    left: `${startPosition.toFixed(4)}%`,
                    transform: 'translate(-100%, -50%)'
                  }}
                >
                  <span className="text-sm text-white/90">{span.major_version}</span>
                </div>
              ) : (
                <div 
                  className="absolute top-1/2 whitespace-nowrap text-left pl-2"
                  style={{ 
                    left: `${(startPosition + width).toFixed(4)}%`,
                    transform: 'translateY(-50%)'
                  }}
                >
                  <span className="text-sm text-white/90">{span.major_version}</span>
                </div>
              )}

              {/* Timeline bar */}
              <motion.div
                className="absolute h-4 top-1/2 -translate-y-1/2 rounded-full overflow-hidden flex items-center"
                style={{
                  left: `${startPosition.toFixed(4)}%`,
                  width: `${width.toFixed(4)}%`,
                }}
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {/* Gradient background */}
                <div className="h-full w-full bg-gradient-to-r from-[#32c2e8] to-[#63f655] relative">
                  <div className="absolute inset-0 bg-black opacity-20"></div>
                </div>
              </motion.div>

              {/* Tooltip */}
              {hoveredVersion === span.major_version && (
                <div className="absolute left-1/2 -translate-x-1/2 -top-12 bg-gray-800 text-white text-xs rounded py-1 px-2 z-10">
                  <div className="font-bold mb-1">{span.major_version}</div>
                  <div>First Release: {formatDate(span.first_release_date)}</div>
                  <div>Last Release: {formatDate(span.last_release_date)}</div>
                  <div className="absolute left-1/2 -bottom-1 w-2 h-2 bg-gray-800 transform -translate-x-1/2 rotate-45"></div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

