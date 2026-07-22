import { useState, useEffect } from 'react'
import { formatDistanceToNow, parseISO } from 'date-fns'

function format(dateStr: string): string {
  try { return formatDistanceToNow(parseISO(dateStr), { addSuffix: true }) }
  catch { return '' }
}

export function useRelativeTime(dateStr: string): string {
  const [relative, setRelative] = useState(() => format(dateStr))
  useEffect(() => {
    const id = setInterval(() => setRelative(format(dateStr)), 30_000)
    return () => clearInterval(id)
  }, [dateStr])
  return relative
}
