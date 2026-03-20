import { useMemo } from 'react'
import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid,
  LabelList,
} from 'recharts'
import { cn } from '@/shared/lib/index'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/shared/ui/chart'

interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'area'
  title?: string
  data: Record<string, unknown>[]
  xKey?: string
  yKeys?: string[]
  colors?: string[]
}

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

interface ChartBlockProps {
  code: string
  className?: string
}

export function ChartBlock({ code, className }: ChartBlockProps) {
  const chartData = useMemo<ChartData | null>(() => {
    try {
      const parsed = JSON.parse(code) as ChartData
      if (!parsed.type || !parsed.data) return null
      return parsed
    } catch {
      return null
    }
  }, [code])

  if (!chartData) {
    return (
      <div className={cn('rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive', className)}>
        <p className="font-medium">차트 데이터 파싱 오류</p>
        <pre className="mt-1 text-xs opacity-70">올바른 JSON 형식이 아닙니다.</pre>
      </div>
    )
  }

  const { type, title, data, xKey, yKeys, colors = CHART_COLORS } = chartData
  const detectedXKey = xKey ?? Object.keys(data[0] ?? {}).find((k) => typeof data[0]![k] === 'string') ?? 'name'
  const detectedYKeys = yKeys ?? Object.keys(data[0] ?? {}).filter((k) => typeof data[0]![k] === 'number')

  // Build shadcn chartConfig from detected keys
  const config = useMemo<ChartConfig>(() => {
    const cfg: ChartConfig = {}

    if (type === 'pie') {
      // For pie charts, each data item is a "series"
      data.forEach((item, i) => {
        const name = String(item[detectedXKey] ?? `item-${i}`)
        cfg[name] = {
          label: name,
          color: colors[i % colors.length],
        }
      })
    } else {
      // For bar/line/area, each yKey is a "series"
      detectedYKeys.forEach((key, i) => {
        cfg[key] = {
          label: key,
          color: colors[i % colors.length],
        }
      })
    }

    return cfg
  }, [type, data, detectedXKey, detectedYKeys, colors])

  // For pie chart, add fill to data
  const pieData = useMemo(() => {
    if (type !== 'pie') return data
    return data.map((item, i) => ({
      ...item,
      fill: `var(--color-${String(item[detectedXKey] ?? `item-${i}`)})`,
    }))
  }, [type, data, detectedXKey])

  return (
    <div className={cn('not-prose rounded-lg border bg-card p-4', className)}>
      {title && <p className="mb-3 text-center text-sm font-medium">{title}</p>}

      {type === 'bar' && (
        <ChartContainer config={config} className="min-h-[250px] w-full">
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={detectedXKey}
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            {detectedYKeys.map((key) => (
              <Bar
                key={key}
                dataKey={key}
                fill={`var(--color-${key})`}
                radius={4}
              />
            ))}
          </BarChart>
        </ChartContainer>
      )}

      {type === 'line' && (
        <ChartContainer config={config} className="min-h-[250px] w-full">
          <LineChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={detectedXKey}
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            {detectedYKeys.map((key) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={`var(--color-${key})`}
                strokeWidth={2}
                dot={{ r: 4, fill: `var(--color-${key})` }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ChartContainer>
      )}

      {type === 'area' && (
        <ChartContainer config={config} className="min-h-[250px] w-full">
          <AreaChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={detectedXKey}
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
            <ChartLegend content={<ChartLegendContent />} />
            {detectedYKeys.map((key) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={`var(--color-${key})`}
                fill={`var(--color-${key})`}
                fillOpacity={0.2}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        </ChartContainer>
      )}

      {type === 'pie' && (
        <ChartContainer config={config} className="min-h-[250px] w-full">
          <PieChart accessibilityLayer>
            <ChartTooltip content={<ChartTooltipContent nameKey={detectedXKey} hideLabel />} />
            <Pie
              data={pieData}
              dataKey={detectedYKeys[0] ?? 'value'}
              nameKey={detectedXKey}
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={40}
              strokeWidth={2}
            >
              <LabelList
                dataKey={detectedXKey}
                className="fill-foreground"
                stroke="none"
                fontSize={12}
              />
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey={detectedXKey} />} />
          </PieChart>
        </ChartContainer>
      )}
    </div>
  )
}
