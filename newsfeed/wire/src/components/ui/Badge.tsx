interface BadgeProps {
  children: React.ReactNode
  variant?: 'ticker' | 'category' | 'error'
  className?: string
}

const variants = {
  ticker: 'font-mono text-[#EDEDED] bg-[#1A1A1A] border border-[#1F1F1F]',
  category: 'text-[#888888] bg-[#111111] border border-[#1F1F1F]',
  error: 'text-[#FF4444] bg-[#1A1A1A] border border-[#FF4444]/20',
}

export function Badge({ children, variant = 'ticker', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-[6px] text-[0.75rem] leading-4 ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
