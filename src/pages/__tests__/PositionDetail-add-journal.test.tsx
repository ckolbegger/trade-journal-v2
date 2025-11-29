import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PositionDetail } from '@/pages/PositionDetail'
import { PositionService } from '@/lib/position'
import type { Position, Trade } from '@/lib/position'
import { JournalService } from '@/services/JournalService'
import type { JournalEntry } from '@/types/journal'
import { TradeService } from '@/services/TradeService'
import { ServiceProvider } from '@/contexts/ServiceContext'
import { ServiceContainer } from '@/services/ServiceContainer'

describe('PositionDetail - Add Journal Entry', () => {
  let positionService: PositionService
  let journalService: JournalService
  let tradeService: TradeService

  const mockPosition: Position = {
    id: 'pos-123',
    symbol: 'AAPL',
    strategy_type: 'Long Stock',
    target_entry_price: 150.0,
    target_quantity: 100,
    profit_target: 165.0,
    stop_loss: 145.0,
    position_thesis: 'Strong technical setup',
    created_date: new Date('2025-10-01'),
    status: 'open',
    journal_entry_ids: ['journal-1'],
    trades: [
      {
        id: 'trade-1',
        position_id: 'pos-123',
        trade_type: 'buy',
        quantity: 100,
        price: 150.0,
        timestamp: new Date('2025-10-05T10:00:00Z'),
        notes: 'Opening trade'
      }
    ]
  }

  beforeEach(async () => {
    // Delete database for clean state
    const deleteRequest = indexedDB.deleteDatabase('TradingJournalDB')
    await new Promise<void>((resolve) => {
      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onerror = () => resolve()
      deleteRequest.onblocked = () => resolve()
    })

    // Reset ServiceContainer
    ServiceContainer.resetInstance()

    // Initialize ServiceContainer with database
    const services = ServiceContainer.getInstance()
    await services.initialize()

    positionService = services.getPositionService()
    journalService = await services.getJournalService()
    tradeService = services.getTradeService()
  })

  afterEach(async () => {
    // Clear all positions before closing
    if (positionService) {
      await positionService.clearAll()
    }

    ServiceContainer.resetInstance()

    // Clean up database
    const deleteRequest = indexedDB.deleteDatabase('TradingJournalDB')
    await new Promise<void>((resolve) => {
      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onerror = () => resolve()
      deleteRequest.onblocked = () => resolve()
    })
  })

  // Helper function to render PositionDetail with proper routing
  const renderPositionDetail = () => {
    return render(
      <ServiceProvider>
        <MemoryRouter initialEntries={[`/position/${mockPosition.id}`]}>
          <Routes>
            <Route
              path="/position/:id"
              element={<PositionDetail />}
            />
          </Routes>
        </MemoryRouter>
      </ServiceProvider>
    )
  }

  describe('Add Journal Entry Button Visibility', () => {
    it('should show "Add Journal Entry" button when position exists', async () => {
      await positionService.create(mockPosition)

      renderPositionDetail()

      await waitFor(() => {
        expect(screen.getByText('AAPL')).toBeInTheDocument()
      })

      const addJournalButton = screen.getByRole('button', { name: /add journal entry/i })
      expect(addJournalButton).toBeVisible()
      expect(addJournalButton).toBeEnabled()
    })

    it('should open journal entry modal when button clicked', async () => {
      await positionService.create(mockPosition)

      renderPositionDetail()

      await waitFor(() => {
        expect(screen.getByText('AAPL')).toBeInTheDocument()
      })

      const addJournalButton = screen.getByRole('button', { name: /add journal entry/i })
      fireEvent.click(addJournalButton)

      await waitFor(() => {
        const modal = screen.getByTestId('add-journal-modal')
        expect(modal).toBeVisible()
      })

      // Verify modal contains EnhancedJournalEntryForm
      expect(screen.getByText(/trading journal|position journal/i)).toBeInTheDocument()
    })

    it('should close modal when cancelled', async () => {
      await positionService.create(mockPosition)

      renderPositionDetail()

      await waitFor(() => {
        expect(screen.getByText('AAPL')).toBeInTheDocument()
      })

      // Open modal
      const addJournalButton = screen.getByRole('button', { name: /add journal entry/i })
      fireEvent.click(addJournalButton)

      await waitFor(() => {
        expect(screen.getByTestId('add-journal-modal')).toBeVisible()
      })

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      fireEvent.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByTestId('add-journal-modal')).not.toBeInTheDocument()
      })

      // PositionDetail should still be visible
      expect(screen.getByText('AAPL')).toBeInTheDocument()
    })
  })

  describe('Trade Selection Dropdown', () => {
    it('should show "Position Journal (no trade)" as first option', async () => {
      await positionService.create(mockPosition)

      renderPositionDetail()

      await waitFor(() => {
        expect(screen.getByText('AAPL')).toBeInTheDocument()
      })

      // Open modal
      fireEvent.click(screen.getByRole('button', { name: /add journal entry/i }))

      await waitFor(() => {
        expect(screen.getByTestId('add-journal-modal')).toBeVisible()
      })

      // Find trade selection dropdown
      const dropdown = screen.getByLabelText(/select trade/i)
      expect(dropdown).toBeInTheDocument()

      // Check first option
      const firstOption = dropdown.querySelector('option:first-child') as HTMLOptionElement
      expect(firstOption.textContent).toMatch(/position journal.*no trade/i)
      expect(firstOption.value).toBe('')
    })

    it('should show trade options when trades exist', async () => {
      const positionWithTrades: Position = {
        ...mockPosition,
        trades: [
          {
            id: 'trade-1',
            position_id: 'pos-123',
            trade_type: 'buy',
            quantity: 100,
            price: 150.0,
            timestamp: new Date('2025-10-05T10:00:00Z')
          },
          {
            id: 'trade-2',
            position_id: 'pos-123',
            trade_type: 'buy',
            quantity: 50,
            price: 148.5,
            timestamp: new Date('2025-10-06T10:00:00Z')
          }
        ]
      }

      await positionService.create(positionWithTrades)

      renderPositionDetail()

      await waitFor(() => {
        expect(screen.getByText('AAPL')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /add journal entry/i }))

      await waitFor(() => {
        expect(screen.getByTestId('add-journal-modal')).toBeVisible()
      })

      const dropdown = screen.getByLabelText(/select trade/i)
      const options = Array.from(dropdown.querySelectorAll('option'))

      expect(options).toHaveLength(3) // Position journal + 2 trades

      // Verify trade formatting: "Buy 100 @ $150.00 on Oct 5, 2025"
      expect(options[1].textContent).toMatch(/buy 100.*150\.00.*oct 5/i)
      expect(options[2].textContent).toMatch(/buy 50.*148\.50.*oct 6/i)
    })

    it('should show no trade options when position has no trades', async () => {
      const positionNoTrades: Position = {
        ...mockPosition,
        status: 'planned',
        trades: []
      }

      await positionService.create(positionNoTrades)

      renderPositionDetail()

      await waitFor(() => {
        expect(screen.getByText('AAPL')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /add journal entry/i }))

      await waitFor(() => {
        expect(screen.getByTestId('add-journal-modal')).toBeVisible()
      })

      const dropdown = screen.getByLabelText(/select trade/i)
      const options = Array.from(dropdown.querySelectorAll('option'))

      expect(options).toHaveLength(1) // Only "Position Journal (no trade)"
      expect(options[0].textContent).toMatch(/position journal.*no trade/i)
    })

    it('should default to "no trade" selection', async () => {
      await positionService.create(mockPosition)

      renderPositionDetail()

      await waitFor(() => {
        expect(screen.getByText('AAPL')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /add journal entry/i }))

      await waitFor(() => {
        expect(screen.getByTestId('add-journal-modal')).toBeVisible()
      })

      const dropdown = screen.getByLabelText(/select trade/i) as HTMLSelectElement
      expect(dropdown.value).toBe('') // Default to empty (no trade)

      // Should show position_plan prompts by default
      expect(screen.getByText(/why this trade.*why now/i)).toBeInTheDocument()
    })

    it('should change entry_type when trade selected', async () => {
      await positionService.create(mockPosition)

      renderPositionDetail()

      await waitFor(() => {
        expect(screen.getByText('AAPL')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /add journal entry/i }))

      await waitFor(() => {
        expect(screen.getByTestId('add-journal-modal')).toBeVisible()
      })

      const dropdown = screen.getByLabelText(/select trade/i) as HTMLSelectElement

      // Initially shows position_plan prompts
      expect(screen.getByText(/why this trade.*why now/i)).toBeInTheDocument()

      // Select a trade
      fireEvent.change(dropdown, { target: { value: 'trade-1' } })

      await waitFor(() => {
        // Should now show trade_execution prompts
        expect(screen.getByText(/describe the execution/i)).toBeInTheDocument()
      })
    })

    it('should change entry_type back when "no trade" selected', async () => {
      await positionService.create(mockPosition)

      renderPositionDetail()

      await waitFor(() => {
        expect(screen.getByText('AAPL')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /add journal entry/i }))

      await waitFor(() => {
        expect(screen.getByTestId('add-journal-modal')).toBeVisible()
      })

      const dropdown = screen.getByLabelText(/select trade/i) as HTMLSelectElement

      // Select a trade
      fireEvent.change(dropdown, { target: { value: 'trade-1' } })

      await waitFor(() => {
        expect(screen.getByText(/describe the execution/i)).toBeInTheDocument()
      })

      // Select "no trade" again
      fireEvent.change(dropdown, { target: { value: '' } })

      await waitFor(() => {
        expect(screen.getByText(/why this trade.*why now/i)).toBeInTheDocument()
      })
    })
  })

  describe('Journal Entry Creation', () => {
    it('should create journal with position_id only when no trade selected', async () => {
      await positionService.create(mockPosition)

      const createSpy = vi.spyOn(journalService, 'create')

      renderPositionDetail()

      await waitFor(() => {
        expect(screen.getByText('AAPL')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /add journal entry/i }))

      await waitFor(() => {
        expect(screen.getByTestId('add-journal-modal')).toBeVisible()
      })

      // Keep "Position Journal (no trade)" selected
      const dropdown = screen.getByLabelText(/select trade/i) as HTMLSelectElement
      expect(dropdown.value).toBe('')

      // Fill in journal form
      const rationaleField = screen.getByLabelText(/rationale/i)
      fireEvent.change(rationaleField, { target: { value: 'Test journal entry for position' } })

      // Submit
      const saveButton = screen.getByRole('button', { name: /save journal entry/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(createSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            position_id: 'pos-123',
            trade_id: undefined,
            entry_type: 'position_plan'
          })
        )
      })
    })

    it('should create journal with position_id AND trade_id when trade selected', async () => {
      await positionService.create(mockPosition)

      const createSpy = vi.spyOn(journalService, 'create')

      renderPositionDetail()

      await waitFor(() => {
        expect(screen.getByText('AAPL')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /add journal entry/i }))

      await waitFor(() => {
        expect(screen.getByTestId('add-journal-modal')).toBeVisible()
      })

      // Select a trade
      const dropdown = screen.getByLabelText(/select trade/i) as HTMLSelectElement
      fireEvent.change(dropdown, { target: { value: 'trade-1' } })

      await waitFor(() => {
        expect(screen.getByText(/describe the execution/i)).toBeInTheDocument()
      })

      // Fill in journal form
      const executionNotesField = screen.getByLabelText(/execution notes/i)
      fireEvent.change(executionNotesField, { target: { value: 'Executed at market open' } })

      // Submit
      const saveButton = screen.getByRole('button', { name: /save journal entry/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(createSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            position_id: 'pos-123',
            trade_id: 'trade-1',
            entry_type: 'trade_execution'
          })
        )
      })
    })

    it('should refresh journal list after successful creation', async () => {
      await positionService.create(mockPosition)

      renderPositionDetail()

      await waitFor(() => {
        expect(screen.getByText('AAPL')).toBeInTheDocument()
      })

      // Get initial count by finding the accordion button and parsing its text
      const getJournalCount = () => {
        const journalText = screen.getByText(/journal entries/i)
        const accordionButton = journalText.closest('button')
        const countMatch = accordionButton?.textContent?.match(/\((\d+)\)/)
        return countMatch ? parseInt(countMatch[1]) : 0
      }

      await waitFor(() => {
        expect(screen.getByText(/journal entries/i)).toBeInTheDocument()
      })

      const initialCount = getJournalCount()

      // Add new journal
      fireEvent.click(screen.getByRole('button', { name: /add journal entry/i }))

      await waitFor(() => {
        expect(screen.getByTestId('add-journal-modal')).toBeVisible()
      })

      const rationaleField = screen.getByLabelText(/rationale/i)
      fireEvent.change(rationaleField, { target: { value: 'New journal entry' } })

      const saveButton = screen.getByRole('button', { name: /save journal entry/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(screen.queryByTestId('add-journal-modal')).not.toBeInTheDocument()
      })

      // Verify journal count increased by 1
      await waitFor(() => {
        const updatedCount = getJournalCount()
        expect(updatedCount).toBe(initialCount + 1)
      })
    })

    it('should close modal after successful save', async () => {
      await positionService.create(mockPosition)

      renderPositionDetail()

      await waitFor(() => {
        expect(screen.getByText('AAPL')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /add journal entry/i }))

      await waitFor(() => {
        expect(screen.getByTestId('add-journal-modal')).toBeVisible()
      })

      const rationaleField = screen.getByLabelText(/rationale/i)
      fireEvent.change(rationaleField, { target: { value: 'Test journal entry' } })

      const saveButton = screen.getByRole('button', { name: /save journal entry/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(screen.queryByTestId('add-journal-modal')).not.toBeInTheDocument()
      })
    })

    it('should handle journal creation error gracefully', async () => {
      await positionService.create(mockPosition)

      // Mock journal service to throw error
      const errorSpy = vi.spyOn(journalService, 'create').mockRejectedValue(
        new Error('Database error')
      )

      renderPositionDetail()

      await waitFor(() => {
        expect(screen.getByText('AAPL')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /add journal entry/i }))

      await waitFor(() => {
        expect(screen.getByTestId('add-journal-modal')).toBeVisible()
      })

      const rationaleField = screen.getByLabelText(/rationale/i)
      fireEvent.change(rationaleField, { target: { value: 'Test journal entry' } })

      const saveButton = screen.getByRole('button', { name: /save journal entry/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument()
      })

      // Modal should remain open for retry
      expect(screen.getByTestId('add-journal-modal')).toBeVisible()

      errorSpy.mockRestore()
    })
  })

  describe('EnhancedJournalEntryForm Integration', () => {
    it('should use trade_execution entry_type when trade selected', async () => {
      await positionService.create(mockPosition)

      renderPositionDetail()

      await waitFor(() => {
        expect(screen.getByText('AAPL')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /add journal entry/i }))

      await waitFor(() => {
        expect(screen.getByTestId('add-journal-modal')).toBeVisible()
      })

      const dropdown = screen.getByLabelText(/select trade/i) as HTMLSelectElement
      fireEvent.change(dropdown, { target: { value: 'trade-1' } })

      await waitFor(() => {
        // Verify trade_execution prompts are shown
        expect(screen.getByText(/describe the execution/i)).toBeInTheDocument()
        expect(screen.getByText(/⚡.*trade execution/i)).toBeInTheDocument()
      })
    })

    it('should use position_plan entry_type when no trade selected', async () => {
      await positionService.create(mockPosition)

      renderPositionDetail()

      await waitFor(() => {
        expect(screen.getByText('AAPL')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /add journal entry/i }))

      await waitFor(() => {
        expect(screen.getByTestId('add-journal-modal')).toBeVisible()
      })

      // Verify position_plan prompts are shown (default)
      expect(screen.getByText(/why this trade.*why now/i)).toBeInTheDocument()
      expect(screen.getByText(/📝.*position plan/i)).toBeInTheDocument()
    })

    it('should honor ADR-002 field structure with stored prompts', async () => {
      await positionService.create(mockPosition)

      const createSpy = vi.spyOn(journalService, 'create')

      renderPositionDetail()

      await waitFor(() => {
        expect(screen.getByText('AAPL')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /add journal entry/i }))

      await waitFor(() => {
        expect(screen.getByTestId('add-journal-modal')).toBeVisible()
      })

      const rationaleField = screen.getByLabelText(/rationale/i)
      fireEvent.change(rationaleField, { target: { value: 'Test ADR-002 compliance' } })

      const saveButton = screen.getByRole('button', { name: /save journal entry/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(createSpy).toHaveBeenCalled()
      })

      const createdEntry = createSpy.mock.calls[0][0]

      // Verify fields array structure
      expect(createdEntry.fields).toBeInstanceOf(Array)
      expect(createdEntry.fields.length).toBeGreaterThan(0)

      // Verify each field has: name, prompt, response, required
      createdEntry.fields.forEach((field: any) => {
        expect(field).toHaveProperty('name')
        expect(field).toHaveProperty('prompt')
        expect(field).toHaveProperty('response')
        expect(field).toHaveProperty('required')
      })
    })

    it('should honor ADR-003 schema evolution (store field metadata)', async () => {
      await positionService.create(mockPosition)

      const createSpy = vi.spyOn(journalService, 'create')

      renderPositionDetail()

      await waitFor(() => {
        expect(screen.getByText('AAPL')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /add journal entry/i }))

      await waitFor(() => {
        expect(screen.getByTestId('add-journal-modal')).toBeVisible()
      })

      const rationaleField = screen.getByLabelText(/rationale/i)
      fireEvent.change(rationaleField, { target: { value: 'Test schema evolution' } })

      const saveButton = screen.getByRole('button', { name: /save journal entry/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(createSpy).toHaveBeenCalled()
      })

      const createdEntry = createSpy.mock.calls[0][0]

      // Verify field definitions are stored with each entry (ADR-003)
      const savedRationaleField = createdEntry.fields.find((f: any) => f.name === 'rationale')
      expect(savedRationaleField).toBeDefined()
      expect(savedRationaleField.prompt).toBe('Why this trade? Why now?') // Current prompt stored
      expect(savedRationaleField.required).toBe(true) // Validation metadata stored
    })
  })
})
