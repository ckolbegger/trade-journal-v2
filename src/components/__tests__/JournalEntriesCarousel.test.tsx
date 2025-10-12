import { render, screen } from '@testing-library/react'
import type { JournalEntry } from '@/types/journal'
import { JournalEntriesCarousel } from '../JournalEntriesCarousel'

const baseEntry = {
  position_id: 'position-1',
  fields: [
    {
      name: 'prompt-1',
      prompt: 'What happened?',
      response: 'Something important'
    }
  ],
  created_at: '2024-01-01T00:00:00.000Z'
} satisfies Partial<JournalEntry>

const renderComponent = (entries: JournalEntry[] = [], loading = false, error: string | null = null) => {
  const formatDate = (date: Date) => date.toISOString()
  const formatEntryType = (entryType: string) => `formatted-${entryType}`

  return render(
    <JournalEntriesCarousel
      entries={entries}
      loading={loading}
      error={error}
      formatDate={formatDate}
      formatEntryType={formatEntryType}
    />
  )
}

describe('JournalEntriesCarousel', () => {
  it('renders entries in the order provided', () => {
    const entries: JournalEntry[] = [
      {
        ...(baseEntry as JournalEntry),
        id: 'entry-1',
        entry_type: 'position_plan',
        created_at: '2024-01-02T00:00:00.000Z',
        fields: [
          {
            name: 'field-1',
            prompt: 'Prompt 1',
            response: 'Response 1'
          }
        ]
      },
      {
        ...(baseEntry as JournalEntry),
        id: 'entry-2',
        entry_type: 'trade_execution',
        created_at: '2024-01-03T00:00:00.000Z',
        fields: [
          {
            name: 'field-2',
            prompt: 'Prompt 2',
            response: 'Response 2'
          }
        ]
      }
    ]

    renderComponent(entries)

    const entryTypes = screen.getAllByTestId('journal-entry-type')
    expect(entryTypes[0]).toHaveTextContent('formatted-position_plan')
    expect(entryTypes[1]).toHaveTextContent('formatted-trade_execution')
  })

  it('shows the empty state when no entries exist', () => {
    renderComponent([])

    expect(screen.getByText('No journal entries yet')).toBeInTheDocument()
  })

  it('wraps entries in a styled card container', () => {
    const entries: JournalEntry[] = [
      {
        ...(baseEntry as JournalEntry),
        id: 'entry-card',
        entry_type: 'position_plan',
        created_at: '2024-01-02T00:00:00.000Z'
      }
    ]

    renderComponent(entries)

    const [card] = screen.getAllByTestId('journal-entry-card')
    expect(card).toHaveClass('rounded-xl')
    expect(card).toHaveClass('border')
    expect(card).toHaveClass('shadow-[0_12px_24px_-18px_rgba(15,23,42,0.8)]')
  })

  it('surfaces loading and error messages', () => {
    renderComponent([], true, null)
    expect(screen.getByText('Loading journal entries...')).toBeInTheDocument()

    renderComponent([], false, 'Failed to load')
    expect(screen.getByText('Failed to load')).toBeInTheDocument()
  })
})
