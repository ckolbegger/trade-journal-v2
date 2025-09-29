import { useState } from 'react'

interface AccordionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  indicator?: string
  icon?: string
}

export function Accordion({ title, children, defaultOpen = false, indicator, icon }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-t border-gray-200">
      <button
        type="button"
        className={`flex items-center justify-between w-full px-5 py-4 bg-white border-none text-left hover:bg-gray-50 transition-colors ${
          isOpen ? 'active bg-gray-50 border-b border-gray-200' : ''
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          {icon && (
            <span className="text-sm">{icon}</span>
          )}
          <span className="text-base font-semibold text-gray-900">{title}</span>
          {indicator && (
            <span className="text-xs text-gray-500 font-normal">{indicator}</span>
          )}
        </div>
        <span className={`text-xs text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {isOpen && (
        <div className="bg-gray-50 px-5 pb-4">
          {children}
        </div>
      )}
    </div>
  )
}