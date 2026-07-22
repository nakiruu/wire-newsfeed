interface SparklineProps {
  data: number[]
  currentHourIndex?: number
  height?: number
}

export function Sparkline({ data, currentHourIndex, height = 24 }: SparklineProps) {
  if (data.length === 0) return null
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-px" style={{ height }}>
      {data.map((val, i) => (
        <div
          key={i}
          className={`flex-1 rounded-sm transition-all duration-[150ms] ${i === currentHourIndex ? 'bg-[#0070F3]' : 'bg-[#555555]'}`}
          style={{ height: `${Math.max(2, (val / max) * height)}px` }}
        />
      ))}
    </div>
  )
}
