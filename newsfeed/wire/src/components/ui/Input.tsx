interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
}

export function Input({ icon, className = '', ...props }: InputProps) {
  return (
    <div className="relative flex items-center w-full">
      {icon && <span className="absolute left-2.5 text-[#555555] pointer-events-none">{icon}</span>}
      <input
        className={`w-full bg-[#111111] border border-[#1F1F1F] rounded-[8px] text-[0.875rem] text-[#EDEDED] placeholder-[#555555] transition-[border-color] duration-[150ms] ease-linear hover:border-[#333333] focus:border-[#0070F3] focus:outline-none ${icon ? 'pl-8' : 'pl-3'} pr-3 py-2 ${className}`}
        {...props}
      />
    </div>
  )
}
