import React from 'react'
import type { PlanVsExecution } from '@/lib/utils/planVsExecution'
import { formatPlanVsExecution } from '@/lib/utils/planVsExecution'

export interface PlanVsExecutionCardProps {
  comparison: PlanVsExecution
}

/**
 * PlanVsExecutionCard component displays plan vs execution comparison
 * for closed positions, enabling behavioral learning and execution analysis.
 *
 * Design: Educational format with clear visual indicators of execution quality
 */
export const PlanVsExecutionCard: React.FC<PlanVsExecutionCardProps> = ({ comparison }) => {
  const display = formatPlanVsExecution(comparison)

  const getQualityColorClasses = (color: 'green' | 'red' | 'gray') => {
    switch (color) {
      case 'green':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'red':
        return 'bg-red-50 border-red-200 text-red-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getQualityBadgeClasses = (color: 'green' | 'red' | 'gray') => {
    switch (color) {
      case 'green':
        return 'bg-green-100 text-green-800'
      case 'red':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div
      data-testid="plan-vs-execution-card"
      className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-6"
    >
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Plan vs Execution Analysis
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Compare your planned strategy against actual execution
        </p>
      </div>

      {/* Entry Comparison */}
      <div className={`rounded-lg border p-4 ${getQualityColorClasses(display.entry.qualityColor)}`}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-sm">Entry Execution</h4>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${getQualityBadgeClasses(display.entry.qualityColor)}`}>
            {display.entry.quality}
          </span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Target Entry:</span>
            <span className="font-medium">{display.entry.target}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Actual Avg Cost:</span>
            <span className="font-medium">{display.entry.actual}</span>
          </div>
          <div className="flex justify-between border-t border-current border-opacity-20 pt-2">
            <span className="text-gray-600">Difference:</span>
            <span className="font-semibold">{display.entry.delta}</span>
          </div>
        </div>
      </div>

      {/* Exit Comparison */}
      <div className={`rounded-lg border p-4 ${getQualityColorClasses(display.exit.qualityColor)}`}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-sm">Exit Execution</h4>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${getQualityBadgeClasses(display.exit.qualityColor)}`}>
            {display.exit.quality}
          </span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Target Exit:</span>
            <span className="font-medium">{display.exit.target}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Actual Avg Exit:</span>
            <span className="font-medium">{display.exit.actual}</span>
          </div>
          <div className="flex justify-between border-t border-current border-opacity-20 pt-2">
            <span className="text-gray-600">Difference:</span>
            <span className="font-semibold">{display.exit.delta}</span>
          </div>
        </div>
      </div>

      {/* Overall Performance */}
      <div className={`rounded-lg border p-4 ${getQualityColorClasses(display.overall.qualityColor)}`}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-sm">Overall Performance</h4>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${getQualityBadgeClasses(display.overall.qualityColor)}`}>
            {display.overall.quality}
          </span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Target Profit:</span>
            <span className="font-medium">{display.overall.targetProfit}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Actual Profit:</span>
            <span className="font-medium">{display.overall.actualProfit}</span>
          </div>
          <div className="flex justify-between border-t border-current border-opacity-20 pt-2">
            <span className="text-gray-600">Difference:</span>
            <span className="font-semibold">{display.overall.delta}</span>
          </div>
        </div>
      </div>

      {/* Learning Prompt */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>💡 Reflection:</strong> What contributed to this execution outcome?
          Consider market conditions, entry timing, and exit discipline.
        </p>
      </div>
    </div>
  )
}
