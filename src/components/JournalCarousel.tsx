import { useState, useEffect } from 'react'
import type { JournalEntry } from '@/types/journal'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface JournalCarouselProps {
  entries: JournalEntry[]
  transitionDuration?: number // in milliseconds
}

export function JournalCarousel({ entries, transitionDuration = 280 }: JournalCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0) // Start with newest entry

  const goToSlide = (index: number) => {
    if (index >= 0 && index < entries.length) {
      setCurrentSlide(index)
    }
  }

  const nextSlide = () => {
    if (currentSlide < entries.length - 1) {
      setCurrentSlide(currentSlide + 1)
    }
  }

  const previousSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        previousSlide()
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        nextSlide()
      }
    }

    // Add event listener when component mounts
    document.addEventListener('keydown', handleKeyDown)
    
    // Cleanup event listener when component unmounts
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [currentSlide, entries.length]) // Re-install on dependencies change

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date))
  }

  const formatEntryType = (entryType: string) => {
    switch (entryType) {
      case 'position_plan':
        return 'Position Plan'
      case 'trade_execution':
        return 'Trade Execution'
      default:
        return entryType
    }
  }

  if (entries.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm" data-testid="journal-carousel">
        No journal entries yet
      </div>
    )
  }

  // We're using entries in reverse order (newest first), so slide 0 shows newest
  // Transform needs to move left to show content on the right
  const slideOffset = -currentSlide * 100

  return (
    <div className="relative overflow-hidden bg-gray-50" data-testid="journal-carousel">
      {/* Navigation Controls (arrows + dots) */}
      <div className="flex justify-between items-center px-5 py-3 bg-white border-b border-gray-200">
        <button
          className={`bg-gray-100 border border-gray-300 rounded-md w-8 h-8 flex items-center justify-center cursor-pointer transition-all text-gray-700 text-base font-semibold hover:bg-gray-200 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-gray-100 ${currentSlide === 0 ? 'disabled' : ''}`}
          onClick={previousSlide}
          disabled={currentSlide === 0}
          data-testid="carousel-prev-arrow"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <div className="flex justify-center items-center gap-2 flex-1" data-testid="carousel-dots">
          {entries.map((_, reverseIndex) => {
            // Convert reverse index to logical index for dots UI
            const logicalIndex = reverseIndex
            return (
              <button
                key={reverseIndex}
                className={`w-2 h-2 rounded-full bg-gray-300 cursor-pointer transition-all border-0 p-0 hover:bg-gray-400 ${logicalIndex === currentSlide ? 'bg-blue-500 w-2.5 h-2.5' : ''}`}
                onClick={() => goToSlide(logicalIndex)}
                data-testid={`carousel-dot-${logicalIndex}`}
              />
            )
          })}
        </div>
        
        <button
          className={`bg-gray-100 border border-gray-300 rounded-md w-8 h-8 flex items-center justify-center cursor-pointer transition-all text-gray-700 text-base font-semibold hover:bg-gray-200 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-gray-100 ${currentSlide === entries.length - 1 ? 'disabled' : ''}`}
          onClick={nextSlide}
          disabled={currentSlide === entries.length - 1}
          data-testid="carousel-next-arrow"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Carousel Slides */}
      <div 
        className="flex touch-pan-y bg-slate-50/75 border border-gray-200/80 rounded-xl px-2 py-2" 
        data-testid="carousel-wrapper" 
        style={{ 
          transform: `translateX(${slideOffset}%)`,
          transition: `transform ${transitionDuration}ms ease-out`
        }}
      >
        {/* Map entries in reverse order (newest first) to meet chronological requirement */}
        {[...entries].reverse().map((entry, reverseIndex) => (
          <div key={entry.id} className="min-w-full max-w-full flex-shrink-0 py-4.5 box-border">
            <div className="w-full max-w-full break-words">
              <div 
                className="bg-white rounded-[10px] p-4 border border-gray-200/70"
                style={{
                  boxShadow: "0 12px 24px -18px rgba(15, 23, 42, 0.8)"
                }}
              >
                <div className="flex justify-between items-start mb-3 pb-2 border-b border-gray-200">
                  <div className="text-[12px] text-gray-600 uppercase tracking-[0.05em] font-medium">{formatEntryType(entry.entry_type)}</div>
                  <div className="text-[12px] text-gray-400">{formatDate(entry.executed_at || entry.created_at)}</div>
                </div>
                <div className="flex flex-col gap-3">
                  {entry.fields.map((field, fieldIndex) => (
                    <div key={fieldIndex} className="flex flex-col gap-1.5">
                      <div className="text-[13px] font-medium text-gray-600 leading-normal">{field.prompt}</div>
                      <div className="text-[14px] text-gray-700 leading-[1.6] bg-gray-50 px-3 py-2.5 rounded-md border border-gray-200 whitespace-normal break-words">{field.response}</div>
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
