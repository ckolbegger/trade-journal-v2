import { type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, List, BookOpen, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation()

  const navItems = [
    {
      path: '/',
      label: 'Positions',
      icon: List,
    },
    {
      path: '/journal',
      label: 'Journal',
      icon: BookOpen,
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: Settings,
    },
  ]

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-mobile mx-auto min-h-screen bg-white shadow-mobile relative">
        {/* Header */}
        <header className="bg-gray-800 text-white px-5 py-4 flex justify-between items-center sticky top-0 z-100">
          <h1 className="text-lg font-semibold">Trading Journal</h1>
          <Menu className="w-6 h-6 cursor-pointer" />
        </header>

        {/* Main Content */}
        <main className="pb-20">
          {children}
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-mobile bg-white border-t border-gray-200 py-3">
          <div className="flex justify-center">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex-1 flex flex-col items-center py-2 px-2 text-xs cursor-pointer",
                    isActive ? "text-blue-600" : "text-gray-400"
                  )}
                >
                  <Icon className="w-5 h-5 mb-1" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}