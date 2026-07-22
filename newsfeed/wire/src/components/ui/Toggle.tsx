interface ToggleProps {
  checked: boolean
  onChange(checked: boolean): void
  label?: string
  disabled?: boolean
}

export function Toggle({ checked, onChange, label, disabled = false }: ToggleProps) {
  return (
    <label className={`flex items-center gap-2 cursor-pointer ${disabled ? 'opacity-40' : ''}`}>
      <button
        role="switch" aria-checked={checked} disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative w-8 h-[18px] rounded-[9999px] transition-colors duration-[150ms] ease-linear focus-visible:outline-none ${checked ? 'bg-[#0070F3]' : 'bg-[#1F1F1F]'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform duration-[150ms] ease-linear ${checked ? 'translate-x-3.5' : 'translate-x-0'}`} />
      </button>
      {label && <span className="text-[0.8125rem] text-[#888888]">{label}</span>}
    </label>
  )
}
