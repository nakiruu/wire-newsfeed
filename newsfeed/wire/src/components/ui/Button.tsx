interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'pill'
  active?: boolean
}

export function Button({ variant = 'ghost', active = false, className = '', ...props }: ButtonProps) {
  const base = 'inline-flex items-center gap-1.5 transition-all duration-[150ms] ease-linear focus-visible:outline-none rounded-[8px] text-[0.8125rem] font-medium cursor-pointer disabled:opacity-40'
  const variants = {
    primary: 'px-3 py-1.5 bg-[#0070F3] text-white hover:bg-[#0070F3]/90',
    ghost: 'px-2 py-1.5 text-[#888888] hover:text-[#EDEDED] hover:bg-[#1A1A1A]',
    pill: `px-3 py-1 rounded-[9999px] ${active ? 'text-[#0070F3] bg-[rgba(0,112,243,0.1)]' : 'text-[#888888] hover:text-[#EDEDED] hover:bg-[#1A1A1A]'}`,
  }
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />
}
