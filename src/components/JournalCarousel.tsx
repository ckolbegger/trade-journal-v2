import { useState, useEffect, useRef } from 'react'
import type { JournalEntry } from '@/types/journal'

interface JournalCarouselProps {
  journalEntries: JournalEntry[]
  loading?: boolean
  error?: string | null
}

export function JournalCarousel({ journalEntries, loading = false, error = null }: JournalCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const carouselWrapperRef = useRef<HTMLDivElement>(null)
  const touchStartXRef = useRef(0)
  const touchEndXRef = useRef(0)
  
  // Show the last (most recent) entry initially while maintaining chronological order
  useEffect(() => {
    if (journalEntries.length > 0) {
      setCurrentSlide(journalEntries.length - 1)
    }
  }, [journalEntries.length])

  // Handle slide transition with smooth animation
  useEffect(() => {
    if (carouselWrapperRef.current) {
      carouselWrapperRef.current.style.transform = `translateX(-${currentSlide * 100}%)`
    }
  }, [currentSlide])

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        Loading journal entries...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500 text-sm">
        {error}
      </div>
    )
  }

  if (journalEntries.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        No journal entries yet
      </div>
    )
  }

  const formatEntryType = (entryType: string) => {
    switch (entryType) {
      case 'position_plan':
        return 'Position Plan'
      case 'trade_execution':
        return 'Trade Execution'
      case 'daily_review':
        return 'Daily Review'
      case 'position_update':
        return 'Position Update'
      default:
        return entryType
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.changedTouches[0].screenX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndXRef.current = e.changedTouches[0].screenX
    handleSwipe()
  }

  const handleSwipe = () => {
    const swipeThreshold = 50
    const diff = touchStartXRef.current - touchEndXRef.current

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swipe left - next slide (newer entry)
        setCurrentSlide(prev => Math.min(journalEntries.length - 1, prev + 1))
      } else {
        // Swipe right - previous slide (older entry)
        setCurrentSlide(prev => Math.max(0, prev - 1))
      }
    }
  }

  return (
    <div className="w-full">
      {/* Navigation Controls */}
      <div className="flex justify-between items-center px-5 py-3 bg-white border-b border-gray-200">
        <button
          className={`w-8 h-8 rounded-md border border-gray-300 flex items-center justify-center text-gray-700 text-base font-bold ${
            currentSlide === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100'
          }`}
          onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
          disabled={currentSlide === 0}
          aria-label="Previous slide"
        >
          ←
        </button>
        
        <div className="flex justify-center items-center gap-2 flex-1 mx-4">
          {journalEntries.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentSlide ? 'bg-blue-600 w-3 h-3' : 'bg-gray-300'
              }`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
        
        <button
          className={`w-8 h-8 rounded-md border border-gray-300 flex items-center justify-center text-gray-700 text-base font-bold ${
            currentSlide === journalEntries.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100'
          }`}
          onClick={() => setCurrentSlide(prev => Math.min(journalEntries.length - 1, prev + 1))}
          disabled={currentSlide === journalEntries.length - 1}
          aria-label="Next slide"
        >
          →
        </button>
      </div>
      
      {/* Carousel Content */}
      <div className="relative overflow-hidden bg-gray-100 border border-gray-300 rounded-xl">
        <div
          ref={carouselWrapperRef}
          className="flex transition-transform duration-280 ease-out"
          style={{ touchAction: 'pan-y' }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {journalEntries.map((entry, index) => (
            <div key={entry.id} className="min-w-full max-w-full flex-shrink-0 p-4">
              <div className="journal-entry">
                <div className="bg-white rounded-lg p-4 border border-gray-300 shadow-sm">
                  <div className="flex justify-between items-start mb-3 pb-2 border-b border-gray-100">
                    <div className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                      {formatEntryType(entry.entry_type)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(entry.created_at)}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {entry.fields.map((field, fieldIndex) => (
                      <div key={fieldIndex} className="journal-field">
                        <div className="text-xs text-gray-600 mb-1 font-medium field-prompt">
                          {field.prompt}
                        </div>
                        <div className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded border border-gray-200 field-response">
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
    </div>
  )
}