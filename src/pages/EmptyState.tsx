import { BarChart3, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function EmptyState() {
  const features = [
    "Immutable trade plans with forced journaling",
    "Real-time P&L tracking with FIFO cost basis",
    "Plan vs execution analysis for learning",
    "Privacy-first with local data storage"
  ]

  return (
    <div className="text-center px-5 py-15 flex flex-col items-center justify-center min-h-[calc(100vh-120px)]">
      {/* Empty Icon */}
      <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-6 text-gray-400">
        <BarChart3 className="w-8 h-8" />
      </div>

      {/* Title */}
      <h2 className="text-2xl font-semibold mb-3 text-gray-800">
        Start Your Trading Journey
      </h2>

      {/* Description */}
      <p className="text-base text-gray-500 mb-8 leading-6 max-w-[280px]">
        Track your trades, learn from your decisions, and build consistent profitability with disciplined execution.
      </p>

      {/* CTA Button */}
      <Button
        className="w-full max-w-[280px] h-12 text-base font-semibold bg-blue-600 hover:bg-blue-500"
        onClick={() => alert('Navigate to Position Creation Flow')}
      >
        Create Your First Position
      </Button>

      {/* Features List */}
      <div className="mt-10 text-left max-w-[280px] w-full">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start mb-4 text-sm text-gray-500">
            <div className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
              <Check className="w-3 h-3" />
            </div>
            <div>{feature}</div>
          </div>
        ))}
      </div>
    </div>
  )
}