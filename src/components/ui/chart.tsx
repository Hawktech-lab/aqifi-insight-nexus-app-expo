import * as React from "react"
import { View, Dimensions } from "react-native"
import Svg, { Path, Circle, Rect, Text as SvgText, Line, G } from "react-native-svg"

import { cn } from "../../lib/utils"

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

interface ChartContainerProps {
  config: ChartConfig
  children: React.ReactNode
  className?: string
  width?: number
  height?: number
}

const ChartContainer: React.FC<ChartContainerProps> = ({ 
  className, 
  children, 
  config, 
  width = 400,
  height = 300,
  ...props 
}) => {
  const uniqueId = React.useId()
  const chartId = `chart-${uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <View
        className={cn(
          "flex justify-center text-xs",
          className
        )}
        {...props}
      >
        <Svg width={width} height={height}>
          {children}
        </Svg>
      </View>
    </ChartContext.Provider>
  )
}

// Simple Line Chart Component
interface LineChartProps {
  data: Array<{ x: number; y: number }>
  width?: number
  height?: number
  color?: string
  strokeWidth?: number
}

const LineChart: React.FC<LineChartProps> = ({ 
  data, 
  width = 400, 
  height = 300, 
  color = "#3b82f6",
  strokeWidth = 2 
}) => {
  if (!data || data.length < 2) return null

  const padding = 40
  const chartWidth = width - 2 * padding
  const chartHeight = height - 2 * padding

  const xValues = data.map(d => d.x)
  const yValues = data.map(d => d.y)
  
  const minX = Math.min(...xValues)
  const maxX = Math.max(...xValues)
  const minY = Math.min(...yValues)
  const maxY = Math.max(...yValues)

  const scaleX = (x: number) => padding + ((x - minX) / (maxX - minX)) * chartWidth
  const scaleY = (y: number) => height - padding - ((y - minY) / (maxY - minY)) * chartHeight

  const pathData = data
    .map((point, index) => {
      const x = scaleX(point.x)
      const y = scaleY(point.y)
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')

  return (
    <Svg width={width} height={height}>
      {/* Grid lines */}
      <G stroke="#e5e7eb" strokeWidth={0.5}>
        {Array.from({ length: 5 }, (_, i) => {
          const y = padding + (i * chartHeight) / 4
          return <Line key={i} x1={padding} y1={y} x2={width - padding} y2={y} />
        })}
        {Array.from({ length: 5 }, (_, i) => {
          const x = padding + (i * chartWidth) / 4
          return <Line key={i} x1={x} y1={padding} x2={x} y2={height - padding} />
        })}
      </G>
      
      {/* Line chart */}
      <Path
        d={pathData}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
      />
      
      {/* Data points */}
      {data.map((point, index) => (
        <Circle
          key={index}
          cx={scaleX(point.x)}
          cy={scaleY(point.y)}
          r={3}
          fill={color}
        />
      ))}
    </Svg>
  )
}

// Simple Bar Chart Component
interface BarChartProps {
  data: Array<{ label: string; value: number }>
  width?: number
  height?: number
  color?: string
}

const BarChart: React.FC<BarChartProps> = ({ 
  data, 
  width = 400, 
  height = 300, 
  color = "#3b82f6" 
}) => {
  if (!data || data.length === 0) return null

  const padding = 60
  const chartWidth = width - 2 * padding
  const chartHeight = height - 2 * padding
  const barWidth = chartWidth / data.length * 0.8
  const barSpacing = chartWidth / data.length * 0.2

  const maxValue = Math.max(...data.map(d => d.value))

  return (
    <Svg width={width} height={height}>
      {/* Bars */}
      {data.map((item, index) => {
        const barHeight = (item.value / maxValue) * chartHeight
        const x = padding + index * (barWidth + barSpacing) + barSpacing / 2
        const y = height - padding - barHeight

        return (
          <G key={index}>
            <Rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={color}
            />
            <SvgText
              x={x + barWidth / 2}
              y={height - padding + 15}
              textAnchor="middle"
              fontSize={12}
              fill="#6b7280"
            >
              {item.label}
            </SvgText>
          </G>
        )
      })}
    </Svg>
  )
}

// Simple Pie Chart Component
interface PieChartProps {
  data: Array<{ label: string; value: number; color?: string }>
  width?: number
  height?: number
}

const PieChart: React.FC<PieChartProps> = ({ 
  data, 
  width = 300, 
  height = 300 
}) => {
  if (!data || data.length === 0) return null

  const centerX = width / 2
  const centerY = height / 2
  const radius = Math.min(width, height) / 2 - 20

  const total = data.reduce((sum, item) => sum + item.value, 0)
  let currentAngle = 0

  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4']

  return (
    <Svg width={width} height={height}>
      {data.map((item, index) => {
        const angle = (item.value / total) * 2 * Math.PI
        const startAngle = currentAngle
        const endAngle = currentAngle + angle

        const x1 = centerX + radius * Math.cos(startAngle)
        const y1 = centerY + radius * Math.sin(startAngle)
        const x2 = centerX + radius * Math.cos(endAngle)
        const y2 = centerY + radius * Math.sin(endAngle)

        const largeArcFlag = angle > Math.PI ? 1 : 0

        const pathData = [
          `M ${centerX} ${centerY}`,
          `L ${x1} ${y1}`,
          `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
          'Z'
        ].join(' ')

        currentAngle = endAngle

        return (
          <Path
            key={index}
            d={pathData}
            fill={item.color || colors[index % colors.length]}
          />
        )
      })}
    </Svg>
  )
}

export {
  ChartContainer,
  LineChart,
  BarChart,
  PieChart,
}
