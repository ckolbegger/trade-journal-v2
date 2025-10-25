import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PriceUpdateCard } from '@/components/PriceUpdateCard'
import { PriceService } from '@/services/PriceService'
import type { PriceHistory } from '@/types/priceHistory'
import 'fake-indexeddb/auto'

/**
 * Tests for PriceUpdateCard Component
 *
 * Manual price entry form with validation and confirmation dialogs
 */

// Mock PriceService
vi.mock('@/services/PriceService', () => ({
  PriceService: vi.fn().mockImplementation(() => ({
    getLatestPrice: vi.fn(),
    createOrUpdateSimple: vi.fn(),
    validatePriceChange: vi.fn(),
  })),
}))

describe('PriceUpdateCard Component', () => {
  let mockPriceService: any

  beforeEach(() => {
    mockPriceService = new PriceService()
    vi.clearAllMocks()
  })

  describe('Rendering and Initial State', () => {
    it('[Unit] should render price input and date picker', () => {
      // Arrange & Act
      render(
        <PriceUpdateCard
          underlying="AAPL"
          priceService={mockPriceService}
          onPriceUpdated={vi.fn()}
        />
      )

      // Assert
      expect(screen.getByLabelText(/current price/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/date/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /update price/i })).toBeInTheDocument()
    })

    it('[Unit] should default date to today', () => {
      // Arrange
      const today = new Date().toISOString().split('T')[0]

      // Act
      render(
        <PriceUpdateCard
          underlying="AAPL"
          priceService={mockPriceService}
          onPriceUpdated={vi.fn()}
        />
      )

      // Assert
      const dateInput = screen.getByLabelText(/date/i) as HTMLInputElement
      expect(dateInput.value).toBe(today)
    })

    it('[Unit] should display last known price when available', async () => {
      // Arrange
      const lastPrice: PriceHistory = {
        id: 'price-1',
        underlying: 'AAPL',
        date: '2024-01-15',
        open: 150.00,
        high: 150.00,
        low: 150.00,
        close: 150.00,
        updated_at: new Date('2024-01-15T16:00:00.000Z')
      }
      mockPriceService.getLatestPrice.mockResolvedValue(lastPrice)

      // Act
      render(
        <PriceUpdateCard
          underlying="AAPL"
          priceService={mockPriceService}
          onPriceUpdated={vi.fn()}
        />
      )

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/last known price/i)).toBeInTheDocument()
        expect(screen.getByText(/\$150\.00/)).toBeInTheDocument()
        expect(screen.getByText(/2024-01-15/)).toBeInTheDocument()
      })
    })

    it('[Unit] should show "No price data" when no previous price exists', async () => {
      // Arrange
      mockPriceService.getLatestPrice.mockResolvedValue(null)

      // Act
      render(
        <PriceUpdateCard
          underlying="AAPL"
          priceService={mockPriceService}
          onPriceUpdated={vi.fn()}
        />
      )

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/no price data/i)).toBeInTheDocument()
      })
    })
  })

  describe('Validation', () => {
    it('[Unit] should reject zero price', async () => {
      // Arrange
      render(
        <PriceUpdateCard
          underlying="AAPL"
          priceService={mockPriceService}
          onPriceUpdated={vi.fn()}
        />
      )

      const priceInput = screen.getByLabelText(/current price/i)
      const submitButton = screen.getByRole('button', { name: /update price/i })

      // Act
      fireEvent.change(priceInput, { target: { value: '0' } })
      fireEvent.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/price must be greater than zero/i)).toBeInTheDocument()
      })
      expect(mockPriceService.createOrUpdateSimple).not.toHaveBeenCalled()
    })

    it('[Unit] should reject negative price', async () => {
      // Arrange
      render(
        <PriceUpdateCard
          underlying="AAPL"
          priceService={mockPriceService}
          onPriceUpdated={vi.fn()}
        />
      )

      const priceInput = screen.getByLabelText(/current price/i)
      const submitButton = screen.getByRole('button', { name: /update price/i })

      // Act
      fireEvent.change(priceInput, { target: { value: '-50' } })
      fireEvent.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/price cannot be negative/i)).toBeInTheDocument()
      })
      expect(mockPriceService.createOrUpdateSimple).not.toHaveBeenCalled()
    })

    it('[Unit] should reject empty price', async () => {
      // Arrange
      render(
        <PriceUpdateCard
          underlying="AAPL"
          priceService={mockPriceService}
          onPriceUpdated={vi.fn()}
        />
      )

      const submitButton = screen.getByRole('button', { name: /update price/i })

      // Act
      fireEvent.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/price is required/i)).toBeInTheDocument()
      })
      expect(mockPriceService.createOrUpdateSimple).not.toHaveBeenCalled()
    })
  })

  describe('Price Change Confirmation', () => {
    it('[Unit] should show confirmation dialog for >20% increase', async () => {
      // Arrange
      mockPriceService.validatePriceChange.mockResolvedValue({
        requiresConfirmation: true,
        percentChange: 25.0,
        oldPrice: 100.00,
        newPrice: 125.00
      })

      render(
        <PriceUpdateCard
          underlying="AAPL"
          priceService={mockPriceService}
          onPriceUpdated={vi.fn()}
        />
      )

      const priceInput = screen.getByLabelText(/current price/i)
      const submitButton = screen.getByRole('button', { name: /update price/i })

      // Act
      fireEvent.change(priceInput, { target: { value: '125' } })
      fireEvent.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/confirm price change/i)).toBeInTheDocument()
        expect(screen.getByText(/25\.0%/)).toBeInTheDocument()
      })
      expect(mockPriceService.createOrUpdateSimple).not.toHaveBeenCalled()
    })

    it('[Unit] should show confirmation dialog for >20% decrease', async () => {
      // Arrange
      mockPriceService.validatePriceChange.mockResolvedValue({
        requiresConfirmation: true,
        percentChange: -25.0,
        oldPrice: 100.00,
        newPrice: 75.00
      })

      render(
        <PriceUpdateCard
          underlying="AAPL"
          priceService={mockPriceService}
          onPriceUpdated={vi.fn()}
        />
      )

      const priceInput = screen.getByLabelText(/current price/i)
      const submitButton = screen.getByRole('button', { name: /update price/i })

      // Act
      fireEvent.change(priceInput, { target: { value: '75' } })
      fireEvent.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/confirm price change/i)).toBeInTheDocument()
        expect(screen.getByText(/-25\.0%/)).toBeInTheDocument()
      })
    })

    it('[Unit] should not show confirmation for <20% change', async () => {
      // Arrange
      mockPriceService.validatePriceChange.mockResolvedValue({
        requiresConfirmation: false,
        percentChange: 10.0,
        oldPrice: 100.00,
        newPrice: 110.00
      })
      mockPriceService.createOrUpdateSimple.mockResolvedValue({
        id: 'price-1',
        underlying: 'AAPL',
        date: '2024-01-20',
        open: 110.00,
        high: 110.00,
        low: 110.00,
        close: 110.00,
        updated_at: new Date()
      })

      render(
        <PriceUpdateCard
          underlying="AAPL"
          priceService={mockPriceService}
          onPriceUpdated={vi.fn()}
        />
      )

      const priceInput = screen.getByLabelText(/current price/i)
      const submitButton = screen.getByRole('button', { name: /update price/i })

      // Act
      fireEvent.change(priceInput, { target: { value: '110' } })
      fireEvent.click(submitButton)

      // Assert - Should update directly without confirmation
      await waitFor(() => {
        expect(mockPriceService.createOrUpdateSimple).toHaveBeenCalled()
      })
      expect(screen.queryByText(/confirm price change/i)).not.toBeInTheDocument()
    })
  })

  describe('Price Update Submission', () => {
    it('[Unit] should update price on submit', async () => {
      // Arrange
      mockPriceService.validatePriceChange.mockResolvedValue({
        requiresConfirmation: false,
        percentChange: 5.0,
        oldPrice: 150.00,
        newPrice: 157.50
      })
      mockPriceService.createOrUpdateSimple.mockResolvedValue({
        id: 'price-1',
        underlying: 'AAPL',
        date: '2024-01-20',
        open: 157.50,
        high: 157.50,
        low: 157.50,
        close: 157.50,
        updated_at: new Date()
      })

      render(
        <PriceUpdateCard
          underlying="AAPL"
          priceService={mockPriceService}
          onPriceUpdated={vi.fn()}
        />
      )

      const priceInput = screen.getByLabelText(/current price/i)
      const submitButton = screen.getByRole('button', { name: /update price/i })

      // Act
      fireEvent.change(priceInput, { target: { value: '157.50' } })
      fireEvent.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(mockPriceService.createOrUpdateSimple).toHaveBeenCalledWith({
          underlying: 'AAPL',
          date: expect.any(String),
          close: 157.50
        })
      })
    })

    it('[Unit] should call onPriceUpdated callback after successful update', async () => {
      // Arrange
      const onPriceUpdated = vi.fn()
      const updatedPrice = {
        id: 'price-1',
        underlying: 'AAPL',
        date: '2024-01-20',
        open: 160.00,
        high: 160.00,
        low: 160.00,
        close: 160.00,
        updated_at: new Date()
      }

      mockPriceService.validatePriceChange.mockResolvedValue({
        requiresConfirmation: false,
        percentChange: 5.0,
        oldPrice: 150.00,
        newPrice: 160.00
      })
      mockPriceService.createOrUpdateSimple.mockResolvedValue(updatedPrice)

      render(
        <PriceUpdateCard
          underlying="AAPL"
          priceService={mockPriceService}
          onPriceUpdated={onPriceUpdated}
        />
      )

      const priceInput = screen.getByLabelText(/current price/i)
      const submitButton = screen.getByRole('button', { name: /update price/i })

      // Act
      fireEvent.change(priceInput, { target: { value: '160' } })
      fireEvent.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(onPriceUpdated).toHaveBeenCalledWith(updatedPrice)
      })
    })

    it('[Unit] should show success message after update', async () => {
      // Arrange
      mockPriceService.validatePriceChange.mockResolvedValue({
        requiresConfirmation: false,
        percentChange: 5.0,
        oldPrice: 150.00,
        newPrice: 157.50
      })
      mockPriceService.createOrUpdateSimple.mockResolvedValue({
        id: 'price-1',
        underlying: 'AAPL',
        date: '2024-01-20',
        open: 157.50,
        high: 157.50,
        low: 157.50,
        close: 157.50,
        updated_at: new Date()
      })

      render(
        <PriceUpdateCard
          underlying="AAPL"
          priceService={mockPriceService}
          onPriceUpdated={vi.fn()}
        />
      )

      const priceInput = screen.getByLabelText(/current price/i)
      const submitButton = screen.getByRole('button', { name: /update price/i })

      // Act
      fireEvent.change(priceInput, { target: { value: '157.50' } })
      fireEvent.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/price updated successfully/i)).toBeInTheDocument()
      })
    })

    it('[Unit] should handle errors gracefully', async () => {
      // Arrange
      mockPriceService.validatePriceChange.mockResolvedValue({
        requiresConfirmation: false,
        percentChange: 5.0,
        oldPrice: 150.00,
        newPrice: 157.50
      })
      mockPriceService.createOrUpdateSimple.mockRejectedValue(new Error('Database error'))

      render(
        <PriceUpdateCard
          underlying="AAPL"
          priceService={mockPriceService}
          onPriceUpdated={vi.fn()}
        />
      )

      const priceInput = screen.getByLabelText(/current price/i)
      const submitButton = screen.getByRole('button', { name: /update price/i })

      // Act
      fireEvent.change(priceInput, { target: { value: '157.50' } })
      fireEvent.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/failed to update price/i)).toBeInTheDocument()
      })
    })
  })

  describe('Backdating Support', () => {
    it('[Unit] should allow backdating prices', async () => {
      // Arrange
      mockPriceService.validatePriceChange.mockResolvedValue({
        requiresConfirmation: false,
        percentChange: 5.0,
        oldPrice: 150.00,
        newPrice: 155.00
      })
      mockPriceService.createOrUpdateSimple.mockResolvedValue({
        id: 'price-1',
        underlying: 'AAPL',
        date: '2024-01-10',
        open: 155.00,
        high: 155.00,
        low: 155.00,
        close: 155.00,
        updated_at: new Date()
      })

      render(
        <PriceUpdateCard
          underlying="AAPL"
          priceService={mockPriceService}
          onPriceUpdated={vi.fn()}
        />
      )

      const priceInput = screen.getByLabelText(/current price/i)
      const dateInput = screen.getByLabelText(/date/i)
      const submitButton = screen.getByRole('button', { name: /update price/i })

      // Act
      fireEvent.change(dateInput, { target: { value: '2024-01-10' } })
      fireEvent.change(priceInput, { target: { value: '155' } })
      fireEvent.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(mockPriceService.createOrUpdateSimple).toHaveBeenCalledWith({
          underlying: 'AAPL',
          date: '2024-01-10',
          close: 155.00
        })
      })
    })
  })
})
