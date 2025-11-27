import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PositionDetail } from '@/pages/PositionDetail'
import { PositionService } from '@/lib/position'
import type { Position } from '@/lib/position'
import { PriceService } from '@/services/PriceService'
import type { PriceHistory } from '@/types/priceHistory'
import { ServiceProvider } from '@/contexts/ServiceContext'
import { ServiceContainer } from '@/services/ServiceContainer'
import 'fake-indexeddb/auto'

/**
 * Tests for PositionDetail P&L Integration
 *
 * Verifies P&L display, price updates, and progress indicators
 */

describe('PositionDetail - P&L Integration', () => {
  let mockPositionService: any
  let mockPriceService: any

  const basePosition: Position = {
    id: 'test-pos-1',
    symbol: 'AAPL',
    strategy_type: 'Long Stock',
    target_entry_price: 150.00,
    target_quantity: 100,
    profit_target: 160.00,
    stop_loss: 145.00,
    position_thesis: 'Test thesis',
    created_date: new Date('2024-01-15'),
    status: 'open',
    journal_entry_ids: [],
    trades: [
      {
        id: 'trade-1',
        position_id: 'test-pos-1',
        trade_type: 'buy',
        quantity: 100,
        price: 150.00,
        timestamp: new Date('2024-01-15T10:00:00'),
        underlying: 'AAPL'
      }
    ]
  }

  const basePriceHistory: PriceHistory = {
    id: 'price-1',
    underlying: 'AAPL',
    date: '2024-01-20',
    open: 155.00,
    high: 155.00,
    low: 155.00,
    close: 155.00,
    updated_at: new Date()
  }

  beforeEach(() => {
    ServiceContainer.resetInstance()

    mockPositionService = {
      getById: vi.fn(),
      getAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      close: vi.fn()
    }

    mockPriceService = {
      getLatestPrice: vi.fn(),
      createOrUpdateSimple: vi.fn(),
      validatePriceChange: vi.fn()
    }

    // Inject mock services into ServiceContainer
    const services = ServiceContainer.getInstance()
    services.setPositionService(mockPositionService as any)
    services.setPriceService(mockPriceService as any)

    vi.clearAllMocks()
  })

  afterEach(() => {
    ServiceContainer.resetInstance()
  })

  const renderPositionDetail = (position: Position, priceHistory: PriceHistory | null = null) => {
    mockPositionService.getById.mockResolvedValue(position)
    if (priceHistory) {
      mockPriceService.getLatestPrice.mockResolvedValue(priceHistory)
    } else {
      mockPriceService.getLatestPrice.mockResolvedValue(null)
    }

    return render(
      <ServiceProvider>
        <MemoryRouter initialEntries={[`/position/${position.id}`]}>
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

  describe('P&L Display', () => {
    it('[Integration] should display current P&L', async () => {
      // Arrange
      // Cost: $150, Current: $155, P&L: +$500
      const position = { ...basePosition }
      const priceHistory = { ...basePriceHistory, close: 155.00 }

      // Act
      renderPositionDetail(position, priceHistory)

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/\$500\.00/)).toBeInTheDocument()
      })
    })

    it('[Integration] should update P&L after price update', async () => {
      // Arrange
      const position = { ...basePosition }
      const initialPrice = { ...basePriceHistory, close: 155.00 }

      mockPriceService.getLatestPrice.mockResolvedValueOnce(initialPrice)
      mockPriceService.validatePriceChange.mockResolvedValue({
        requiresConfirmation: false,
        percentChange: 5.0,
        oldPrice: 155.00,
        newPrice: 160.00
      })
      mockPriceService.createOrUpdateSimple.mockResolvedValue({
        ...basePriceHistory,
        close: 160.00
      })

      // Act
      renderPositionDetail(position, initialPrice)

      // Wait for initial P&L
      await waitFor(() => {
        expect(screen.getByText(/\$500\.00/)).toBeInTheDocument()
      })

      // Click "Edit Price" button to show price update panel
      const editPriceButton = screen.getByRole('button', { name: /edit price/i })
      fireEvent.click(editPriceButton)

      // Wait for price input to appear
      await waitFor(() => {
        expect(screen.getByLabelText(/current price/i)).toBeInTheDocument()
      })

      // Update price to $160
      const priceInput = screen.getByLabelText(/current price/i)
      fireEvent.change(priceInput, { target: { value: '160' } })

      const updateButton = screen.getByRole('button', { name: /update price/i })
      fireEvent.click(updateButton)

      // Assert - P&L should update to $1000
      await waitFor(() => {
        expect(screen.getByText(/\$1000\.00/)).toBeInTheDocument()
      })
    })

    it('[Integration] should show "—" when no price data exists', async () => {
      // Arrange
      const position = { ...basePosition }

      // Act
      renderPositionDetail(position, null)

      // Assert
      await waitFor(() => {
        expect(screen.getByText('—')).toBeInTheDocument()
      })
    })
  })

  describe('Progress Indicator', () => {
    it('[Integration] should show progress indicator', async () => {
      // Arrange
      // Stop: $145, Current: $155, Target: $160
      // Progress: ($155 - $145) / ($160 - $145) * 100 = 66.7%
      const position = { ...basePosition }
      const priceHistory = { ...basePriceHistory, close: 155.00 }

      // Act
      renderPositionDetail(position, priceHistory)

      // Assert - Check for ProgressIndicator elements
      await waitFor(() => {
        expect(screen.getByText('Captured Profit')).toBeInTheDocument()
        expect(screen.getByText('66.7%')).toBeInTheDocument()
        // Note: "Stop" and "Target" text appears in multiple places (Trade Plan + ProgressIndicator)
        // so we verify the component by checking for "Captured Profit" and percentage instead
      })
    })

    it('[Integration] should update progress indicator when price changes', async () => {
      // Arrange
      // Initial: Stop $145, Current $155, Target $160 → 66.7%
      // Updated: Stop $145, Current $160, Target $160 → 100.0%
      const position = { ...basePosition }
      const initialPrice = { ...basePriceHistory, close: 155.00 }

      mockPriceService.getLatestPrice.mockResolvedValueOnce(initialPrice)
      mockPriceService.validatePriceChange.mockResolvedValue({
        requiresConfirmation: false,
        percentChange: 3.2,
        oldPrice: 155.00,
        newPrice: 160.00
      })
      mockPriceService.createOrUpdateSimple.mockResolvedValue({
        ...basePriceHistory,
        close: 160.00
      })

      // Act
      renderPositionDetail(position, initialPrice)

      // Wait for initial progress indicator
      await waitFor(() => {
        expect(screen.getByText('66.7%')).toBeInTheDocument()
      })

      // Click "Edit Price" button to show price update panel
      const editPriceButton = screen.getByRole('button', { name: /edit price/i })
      fireEvent.click(editPriceButton)

      // Wait for price input to appear
      await waitFor(() => {
        expect(screen.getByLabelText(/current price/i)).toBeInTheDocument()
      })

      // Update price to $160 (profit target)
      const priceInput = screen.getByLabelText(/current price/i)
      fireEvent.change(priceInput, { target: { value: '160' } })

      const updateButton = screen.getByRole('button', { name: /update price/i })
      fireEvent.click(updateButton)

      // Assert - Progress should update to 100.0%
      await waitFor(() => {
        expect(screen.getByText('100.0%')).toBeInTheDocument()
      })
    })
  })

  describe('Price Update Card', () => {
    it('[Integration] should toggle price update card when Edit Price button clicked', async () => {
      // Arrange
      const position = { ...basePosition }
      const priceHistory = { ...basePriceHistory, close: 155.00 }

      // Act
      renderPositionDetail(position, priceHistory)

      // Assert - Price update card should not be visible initially
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit price/i })).toBeInTheDocument()
      })
      expect(screen.queryByLabelText(/current price/i)).not.toBeInTheDocument()

      // Click "Edit Price" button to show price update panel
      const editPriceButton = screen.getByRole('button', { name: /edit price/i })
      fireEvent.click(editPriceButton)

      // Assert - Price update card should now be visible
      await waitFor(() => {
        expect(screen.getByLabelText(/current price/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /update price/i })).toBeInTheDocument()
      })

      // Click "Edit Price" button again to hide panel
      fireEvent.click(editPriceButton)

      // Assert - Price update card should be hidden again
      await waitFor(() => {
        expect(screen.queryByLabelText(/current price/i)).not.toBeInTheDocument()
      })
    })

    it('[Integration] should trigger confirmation for >20% price change', async () => {
      // Arrange
      const position = { ...basePosition }
      const priceHistory = { ...basePriceHistory, close: 155.00 }

      mockPriceService.validatePriceChange.mockResolvedValue({
        requiresConfirmation: true,
        percentChange: 25.0,
        oldPrice: 155.00,
        newPrice: 193.75
      })

      // Act
      renderPositionDetail(position, priceHistory)

      // Click "Edit Price" button to show price update panel
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit price/i })).toBeInTheDocument()
      })
      const editPriceButton = screen.getByRole('button', { name: /edit price/i })
      fireEvent.click(editPriceButton)

      // Wait for price input to appear
      await waitFor(() => {
        expect(screen.getByLabelText(/current price/i)).toBeInTheDocument()
      })

      // Try to update with >20% change
      const priceInput = screen.getByLabelText(/current price/i)
      fireEvent.change(priceInput, { target: { value: '193.75' } })

      const updateButton = screen.getByRole('button', { name: /update price/i })
      fireEvent.click(updateButton)

      // Assert - Confirmation dialog should appear
      await waitFor(() => {
        expect(screen.getByText(/confirm price change/i)).toBeInTheDocument()
        expect(screen.getByText(/25\.0%/)).toBeInTheDocument()
      })
    })
  })
})
