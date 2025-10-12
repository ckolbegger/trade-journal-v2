import type { ReactNode } from 'react'
import type { JournalEntry } from '@/types/journal'

interface JournalEntriesCarouselProps {
  entries: JournalEntry[]
  loading: boolean
  error: string | null
  formatDate: (date: Date) => string
  formatEntryType: (entryType: string) => string
}

export function JournalEntriesCarousel({
  entries,
  loading,
  error,
  formatDate,
  formatEntryType
}: JournalEntriesCarouselProps) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <div className="bg-slate-50/75 border border-slate-200/80 rounded-2xl p-4">
      {children}
    </div>
  )

  if (loading) {
    return <Wrapper>
      <div className="px-4 py-6 text-center text-gray-500 text-sm">
        Loading journal entries...
      </div>
    </Wrapper>
  }

  if (error) {
    return <Wrapper>
      <div className="px-4 py-6 text-center text-red-500 text-sm">
        {error}
      </div>
    </Wrapper>
  }

  if (entries.length === 0) {
    return <Wrapper>
      <div className="px-4 py-6 text-center text-gray-500 text-sm">
        No journal entries yet
      </div>
    </Wrapper>
  }

  return (
    <Wrapper>
      <div className="space-y-4">
        {entries.map((entry) => (
          <article key={entry.id} data-testid="journal-entry">
            <div
              data-testid="journal-entry-card"
              className="bg-white border border-slate-200/80 rounded-xl shadow-[0_12px_24px_-18px_rgba(15,23,42,0.8)] px-5 py-6"
            >
              <div className="flex justify-between items-start mb-4 pb-2 border-b border-slate-100">
                <div
                  className="text-xs text-slate-500 uppercase tracking-[0.08em] font-semibold"
                  data-testid="journal-entry-type"
                >
                  {formatEntryType(entry.entry_type)}
                </div>
                <div className="text-xs text-slate-400">
                  {formatDate(new Date(entry.executed_at || entry.created_at))}
                </div>
              </div>

              <div className="flex flex-col gap-5">
                {entry.fields.map((field, fieldIndex) => (
                  <div key={`${entry.id}-${fieldIndex}`}>
                    <div className="text-xs font-semibold text-slate-500 mb-2">
                      {field.prompt}
                    </div>
                    <div className="text-sm text-slate-700 leading-relaxed bg-slate-50/80 border border-slate-200 rounded-lg px-3 py-2">
                      {field.response}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </Wrapper>
  )
}
