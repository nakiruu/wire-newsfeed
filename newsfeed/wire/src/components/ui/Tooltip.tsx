import { useState } from 'react'

export function Tooltip({ content, children }: { content: string; children: React.ReactNode }) {
  const [visible, setVisible] = useState(false)
  return (
    <span className="relative inline-flex" onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
      {children}
      {visible && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-[#1A1A1A] border border-[#1F1F1F] rounded-[6px] text-[0.75rem] font-mono text-[#888888] whitespace-nowrap z-50 pointer-events-none">
          {content}
        </span>
      )}
    </span>
  )
}
