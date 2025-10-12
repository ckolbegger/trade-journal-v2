import { useState, useEffect } from 'react'
import type { JournalEntry } from '@/types/journal'

interface JournalCarouselProps {
  entries: JournalEntry[]
  transitionDuration?: number // seconds, default 0.28
  currentIndex?: number // externally controlled index
  onSlideChange?: (index: number) => void // optional callback
}

export function JournalCarousel({
  entries,
  transitionDuration = 0.28,
  currentIndex: externalIndex,
  onSlideChange
}: JournalCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0)

  // Sync with external index if provided
  useEffect(() => {
    if (externalIndex !== undefined && externalIndex !== currentSlide) {
      setCurrentSlide(externalIndex)
    }
  }, [externalIndex])

  // Notify parent of slide changes
  useEffect(() => {
    if (onSlideChange) {
      onSlideChange(currentSlide)
    }
  }, [currentSlide, onSlideChange])

  // Navigation handlers
  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  const handleNext = () => {
    if (currentSlide < entries.length - 1) {
      setCurrentSlide(currentSlide + 1)
    }
  }

  const handleDotClick = (index: number) => {
    setCurrentSlide(index)
  }

  // Determine if we should show navigation (only if more than 1 entry)
  const showNavigation = entries.length > 1

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  const formatEntryType = (entryType: string) => {
    switch (entryType) {
      case 'position_plan':
        return 'POSITION PLAN'
      case 'trade_execution':
        return 'TRADE EXECUTION'
      case 'daily_review':
        return 'DAILY REVIEW'
      case 'position_update':
        return 'POSITION UPDATE'
      default:
        return entryType.toUpperCase().replace(/_/g, ' ')
    }
  }

  return (
    <div
      data-testid="carousel-container"
      className="relative overflow-hidden bg-white"
    >
      {/* Navigation Controls */}
      {showNavigation && (
        <div
          data-testid="carousel-nav"
          className="flex justify-between items-center bg-white"
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid #e5e7eb'
          }}
        >
          {/* Previous Arrow */}
          <button
            data-testid="prev-arrow"
            onClick={handlePrevious}
            disabled={currentSlide === 0}
            className="flex items-center justify-center transition-all"
            style={{
              background: currentSlide === 0 ? '#f3f4f6' : '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              width: '32px',
              height: '32px',
              cursor: currentSlide === 0 ? 'not-allowed' : 'pointer',
              opacity: currentSlide === 0 ? 0.3 : 1,
              color: '#374151',
              fontSize: '16px',
              fontWeight: 600
            }}
          >
            ←
          </button>

          {/* Dots */}
          <div
            data-testid="carousel-dots"
            className="flex justify-center items-center"
            style={{ gap: '8px', flex: 1 }}
          >
            {entries.map((_, index) => (
              <button
                key={index}
                data-testid={`carousel-dot-${index}`}
                onClick={() => handleDotClick(index)}
                className={`transition-all ${index === currentSlide ? 'active' : ''}`}
                style={{
                  width: index === currentSlide ? '10px' : '8px',
                  height: index === currentSlide ? '10px' : '8px',
                  borderRadius: '50%',
                  background: index === currentSlide ? '#3b82f6' : '#d1d5db',
                  cursor: 'pointer',
                  border: 'none',
                  padding: 0
                }}
              />
            ))}
          </div>

          {/* Next Arrow */}
          <button
            data-testid="next-arrow"
            onClick={handleNext}
            disabled={currentSlide === entries.length - 1}
            className="flex items-center justify-center transition-all"
            style={{
              background: currentSlide === entries.length - 1 ? '#f3f4f6' : '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              width: '32px',
              height: '32px',
              cursor: currentSlide === entries.length - 1 ? 'not-allowed' : 'pointer',
              opacity: currentSlide === entries.length - 1 ? 0.3 : 1,
              color: '#374151',
              fontSize: '16px',
              fontWeight: 600
            }}
          >
            →
          </button>
        </div>
      )}

      <div
        data-testid="carousel-wrapper"
        className="flex"
        style={{
          transform: `translateX(-${currentSlide * 100}%)`,
          transition: `transform ${transitionDuration}s ease-out`,
          touchAction: 'pan-y',
          background: 'rgba(248, 250, 252, 0.75)',
          border: '1px solid rgba(203, 213, 225, 0.8)',
          borderRadius: '12px'
        }}
      >
        {entries.map((entry) => (
          <div
            key={entry.id}
            data-testid="carousel-slide"
            className="min-w-full max-w-full flex-shrink-0 box-border"
            style={{ padding: '18px' }}
          >
            <div
              className="w-full max-w-full"
              style={{
                overflowWrap: 'break-word',
                wordWrap: 'break-word'
              }}
            >
              <div
                data-testid="entry-card"
                className="bg-white p-4"
                style={{
                  borderRadius: '10px',
                  border: '1px solid rgba(203, 213, 225, 0.7)',
                  boxShadow: '0 12px 24px -18px rgba(15, 23, 42, 0.8)'
                }}
              >
                {/* Header: Entry Type and Date */}
                <div
                  className="flex justify-between items-start mb-3 pb-2"
                  style={{ borderBottom: '1px solid #e5e7eb' }}
                >
                  <div
                    className="text-xs uppercase font-medium"
                    style={{
                      color: '#6b7280',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {formatEntryType(entry.entry_type)}
                  </div>
                  <div className="text-xs" style={{ color: '#9ca3af' }}>
                    {formatDate(entry.executed_at || entry.created_at)}
                  </div>
                </div>

                {/* Fields: Prompts and Responses */}
                <div className="flex flex-col" style={{ gap: '12px' }}>
                  {entry.fields.map((field, fieldIndex) => (
                    <div key={fieldIndex} className="flex flex-col" style={{ gap: '6px' }}>
                      <div
                        className="text-[13px] font-medium"
                        style={{ color: '#4b5563' }}
                      >
                        {field.prompt}
                      </div>
                      <div
                        className="text-sm break-words whitespace-normal"
                        style={{
                          fontSize: '14px',
                          color: '#374151',
                          lineHeight: '1.6',
                          background: '#f9fafb',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb',
                          overflowWrap: 'break-word',
                          wordWrap: 'break-word'
                        }}
                      >
                        {field.response}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
