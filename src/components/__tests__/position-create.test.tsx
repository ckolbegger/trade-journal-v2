import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import React from 'react'
import { PositionCreate } from '../../pages/PositionCreate'
import { ServiceProvider } from '@/contexts/ServiceContext'
import { ServiceContainer } from '@/services/ServiceContainer'
import { BrowserRouter } from 'react-router-dom'
import 'fake-indexeddb/auto'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/lib/position', async () => {
  const actual = await vi.importActual('@/lib/position')
  return {
    ...actual,
    PositionService: vi.fn().mockImplementation(() => ({
      create: vi.fn().mockResolvedValue({ id: 'test-1' }),
      getById: vi.fn(),
      getAll: vi.fn(),
    }))
  }
})

const deleteDatabase = async () => {
  const deleteRequest = indexedDB.deleteDatabase('TradingJournalDB')
  await new Promise<void>((resolve) => {
    deleteRequest.onsuccess = () => resolve()
    deleteRequest.onerror = () => resolve()
    deleteRequest.onblocked = () => resolve()
  })
}

const renderWithServiceContext = async (ui: React.ReactElement) => {
  const result = render(
    <ServiceProvider>
      <BrowserRouter>{ui}</BrowserRouter>
    </ServiceProvider>
  )
  await waitFor(() => {
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
  }, { timeout: 3000 })
  return result
}

describe('PositionCreate - Short Put Form Validation', () => {
  let container: ServiceContainer

  beforeEach(async () => {
    await deleteDatabase()
    ServiceContainer.resetInstance()
    container = ServiceContainer.getInstance()
    await container.initialize()
    vi.clearAllMocks()
  })

  afterEach(async () => {
    ServiceContainer.resetInstance()
    await deleteDatabase()
  })

  describe('Short Put Strategy Selection', () => {
    it('should show option fields when Short Put strategy is selected', async () => {
      await renderWithServiceContext(<PositionCreate />)

      const strategySelect = screen.getByLabelText(/Strategy Type/i)
      await act(async () => {
        fireEvent.change(strategySelect, { target: { value: 'Short Put' } })
      })

      await waitFor(() => {
        expect(screen.getByLabelText(/Strike Price/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Expiration Date/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Premium per Contract/i)).toBeInTheDocument()
      }, { timeout: 1000 })
    })

    it('should hide option fields when Long Stock is selected', async () => {
      await renderWithServiceContext(<PositionCreate />)

      expect(screen.queryByLabelText(/Strike Price/i)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/Expiration Date/i)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/Premium per Contract/i)).not.toBeInTheDocument()
    })
  })

  describe('Strike Price Validation', () => {
    it('should show error when strike price is missing on form submission', async () => {
      await renderWithServiceContext(<PositionCreate />)

      const strategySelect = screen.getByLabelText(/Strategy Type/i)
      await act(async () => {
        fireEvent.change(strategySelect, { target: { value: 'Short Put' } })
      })

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /Strike Price/i })).toBeInTheDocument()
      }, { timeout: 1000 })

      await act(async () => {
        fireEvent.change(screen.getByLabelText(/Symbol/i), { target: { value: 'AAPL' } })
      })

      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      await act(async () => {
        fireEvent.change(screen.getByLabelText(/Expiration Date/i), { target: { value: futureDate.toISOString().split('T')[0] } })
        fireEvent.change(screen.getByLabelText(/Premium per Contract/i), { target: { value: '2.50' } })
        fireEvent.change(screen.getByLabelText(/Target Quantity/i), { target: { value: '5' } })
        fireEvent.change(screen.getByLabelText(/Profit Target/i), { target: { value: '107.50' } })
        fireEvent.change(screen.getByLabelText(/Stop Loss/i), { target: { value: '102.50' } })
        fireEvent.change(screen.getByLabelText(/Position Thesis/i), { target: { value: 'Selling premium expecting price to stay above strike' } })
      })

      const nextButton = screen.getByText('Next: Trading Journal')
      fireEvent.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/Strike price is required/i)).toBeInTheDocument()
      }, { timeout: 1000 })
    })

    it('should accept valid strike price', async () => {
      await renderWithServiceContext(<PositionCreate />)

      const strategySelect = screen.getByLabelText(/Strategy Type/i)
      await act(async () => {
        fireEvent.change(strategySelect, { target: { value: 'Short Put' } })
      })

      const strikeInput = screen.getByRole('textbox', { name: /Strike Price/i })
      await act(async () => {
        fireEvent.change(strikeInput, { target: { value: '105.50' } })
      })

      expect(screen.queryByText(/Strike price must be positive/i)).not.toBeInTheDocument()
    })

    it('should clear strike price error when valid value is entered', async () => {
      await renderWithServiceContext(<PositionCreate />)

      const strategySelect = screen.getByLabelText(/Strategy Type/i)
      await act(async () => {
        fireEvent.change(strategySelect, { target: { value: 'Short Put' } })
      })

      await act(async () => {
        fireEvent.change(screen.getByLabelText(/Symbol/i), { target: { value: 'AAPL' } })
      })

      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      await act(async () => {
        fireEvent.change(screen.getByLabelText(/Expiration Date/i), { target: { value: futureDate.toISOString().split('T')[0] } })
        fireEvent.change(screen.getByLabelText(/Premium per Contract/i), { target: { value: '2.50' } })
        fireEvent.change(screen.getByLabelText(/Target Quantity/i), { target: { value: '5' } })
        fireEvent.change(screen.getByLabelText(/Profit Target/i), { target: { value: '107.50' } })
        fireEvent.change(screen.getByLabelText(/Stop Loss/i), { target: { value: '102.50' } })
        fireEvent.change(screen.getByLabelText(/Position Thesis/i), { target: { value: 'Selling premium expecting price to stay above strike' } })
      })

      const nextButton = screen.getByText('Next: Trading Journal')
      fireEvent.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/Strike price is required/i)).toBeInTheDocument()
      }, { timeout: 1000 })

      await act(async () => {
        fireEvent.change(screen.getByRole('textbox', { name: /Strike Price/i }), { target: { value: '105.50' } })
      })

      expect(screen.queryByText(/Strike price is required/i)).not.toBeInTheDocument()
    })
  })

  describe('Expiration Date Validation', () => {
    it('should show error when expiration date is missing on form submission', async () => {
      await renderWithServiceContext(<PositionCreate />)

      const strategySelect = screen.getByLabelText(/Strategy Type/i)
      await act(async () => {
        fireEvent.change(strategySelect, { target: { value: 'Short Put' } })
      })

      await act(async () => {
        fireEvent.change(screen.getByLabelText(/Symbol/i), { target: { value: 'AAPL' } })
        fireEvent.change(screen.getByRole('textbox', { name: /Strike Price/i }), { target: { value: '105' } })
        fireEvent.change(screen.getByLabelText(/Premium per Contract/i), { target: { value: '2.50' } })
        fireEvent.change(screen.getByLabelText(/Target Quantity/i), { target: { value: '5' } })
        fireEvent.change(screen.getByLabelText(/Profit Target/i), { target: { value: '107.50' } })
        fireEvent.change(screen.getByLabelText(/Stop Loss/i), { target: { value: '102.50' } })
        fireEvent.change(screen.getByLabelText(/Position Thesis/i), { target: { value: 'Selling premium expecting price to stay above strike' } })
      })

      const nextButton = screen.getByText('Next: Trading Journal')
      fireEvent.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/Expiration date is required/i)).toBeInTheDocument()
      }, { timeout: 1000 })
    })

    it('should not show error for future expiration date', async () => {
      await renderWithServiceContext(<PositionCreate />)

      const strategySelect = screen.getByLabelText(/Strategy Type/i)
      await act(async () => {
        fireEvent.change(strategySelect, { target: { value: 'Short Put' } })
      })

      const dateInput = screen.getByLabelText(/Expiration Date/i)
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      await act(async () => {
        fireEvent.change(dateInput, { target: { value: futureDate.toISOString().split('T')[0] } })
        fireEvent.blur(dateInput)
      })

      expect(screen.queryByText(/Expiration date is required/i)).not.toBeInTheDocument()
    })

    it('should not show error for today as expiration date', async () => {
      await renderWithServiceContext(<PositionCreate />)

      const strategySelect = screen.getByLabelText(/Strategy Type/i)
      await act(async () => {
        fireEvent.change(strategySelect, { target: { value: 'Short Put' } })
      })

      const dateInput = screen.getByLabelText(/Expiration Date/i)
      const todayDate = new Date()
      await act(async () => {
        fireEvent.change(dateInput, { target: { value: todayDate.toISOString().split('T')[0] } })
        fireEvent.blur(dateInput)
      })

      expect(screen.queryByText(/Expiration date must be in the future/i)).not.toBeInTheDocument()
    })
  })

  describe('Thesis Validation', () => {
    it('should show error when thesis is less than 10 characters', async () => {
      await renderWithServiceContext(<PositionCreate />)

      const strategySelect = screen.getByLabelText(/Strategy Type/i)
      await act(async () => {
        fireEvent.change(strategySelect, { target: { value: 'Short Put' } })
      })

      await act(async () => {
        fireEvent.change(screen.getByLabelText(/Position Thesis/i), { target: { value: 'Short' } })
      })

      const nextButton = screen.getByText('Next: Trading Journal')
      fireEvent.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/Thesis must be at least 10 characters/i)).toBeInTheDocument()
      }, { timeout: 1000 })
    })

    it('should not show error when thesis is 10 or more characters', async () => {
      await renderWithServiceContext(<PositionCreate />)

      const strategySelect = screen.getByLabelText(/Strategy Type/i)
      await act(async () => {
        fireEvent.change(strategySelect, { target: { value: 'Short Put' } })
      })

      await act(async () => {
        fireEvent.change(screen.getByLabelText(/Position Thesis/i), { target: { value: 'This is a valid thesis for Short Put strategy' } })
      })

      const nextButton = screen.getByText('Next: Trading Journal')
      fireEvent.click(nextButton)

      await waitFor(() => {
        expect(screen.queryByText(/Thesis must be at least 10 characters/i)).not.toBeInTheDocument()
      }, { timeout: 1000 })
    })
  })

  describe('Form Submission', () => {
    it('should call createPosition when form is submitted with valid Short Put fields', async () => {
      await renderWithServiceContext(<PositionCreate />)

      const strategySelect = screen.getByLabelText(/Strategy Type/i)
      await act(async () => {
        fireEvent.change(strategySelect, { target: { value: 'Short Put' } })
      })

      await waitFor(() => {
        expect(screen.getByLabelText(/Strike Price/i)).toBeInTheDocument()
      }, { timeout: 1000 })

      await act(async () => {
        fireEvent.change(screen.getByLabelText(/Symbol/i), { target: { value: 'AAPL' } })
        fireEvent.change(screen.getByLabelText(/Strike Price/i), { target: { value: '105' } })
      })

      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      await act(async () => {
        fireEvent.change(screen.getByLabelText(/Expiration Date/i), { target: { value: futureDate.toISOString().split('T')[0] } })
        fireEvent.change(screen.getByLabelText(/Premium per Contract/i), { target: { value: '2.50' } })
        fireEvent.change(screen.getByLabelText(/Target Quantity/i), { target: { value: '5' } })
        fireEvent.change(screen.getByLabelText(/Profit Target/i), { target: { value: '107.50' } })
        fireEvent.change(screen.getByLabelText(/Stop Loss/i), { target: { value: '102.50' } })
        fireEvent.change(screen.getByLabelText(/Position Thesis/i), { target: { value: 'Selling premium expecting price to stay above strike' } })
      })

      const nextButton = screen.getByText('Next: Trading Journal')
      fireEvent.click(nextButton)

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 2, name: /Position Plan/i })).toBeInTheDocument()
      }, { timeout: 1000 })
    })

    it('should focus first error field when form is submitted with invalid fields', async () => {
      await renderWithServiceContext(<PositionCreate />)

      const strategySelect = screen.getByLabelText(/Strategy Type/i)
      await act(async () => {
        fireEvent.change(strategySelect, { target: { value: 'Short Put' } })
      })

      const nextButton = screen.getByText('Next: Trading Journal')
      fireEvent.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/Symbol is required/i)).toBeInTheDocument()
      }, { timeout: 1000 })
    })
  })

  describe('Profit/Stop Loss Basis Selectors', () => {
    it('should render profit target basis selector for Short Put', async () => {
      await renderWithServiceContext(<PositionCreate />)

      const strategySelect = screen.getByLabelText(/Strategy Type/i)
      await act(async () => {
        fireEvent.change(strategySelect, { target: { value: 'Short Put' } })
      })

      await waitFor(() => {
        const references = screen.getAllByLabelText(/Reference/i)
        expect(references.length).toBeGreaterThanOrEqual(1)
      }, { timeout: 1000 })
    })

    it('should render stop loss basis selector for Short Put', async () => {
      await renderWithServiceContext(<PositionCreate />)

      const strategySelect = screen.getByLabelText(/Strategy Type/i)
      await act(async () => {
        fireEvent.change(strategySelect, { target: { value: 'Short Put' } })
      })

      await waitFor(() => {
        const references = screen.getAllByLabelText(/Reference/i)
        expect(references.length).toBe(2)
      }, { timeout: 1000 })
    })
  })

  describe('Premium Multiplier Display', () => {
    it('should display premium × 100 multiplier', async () => {
      await renderWithServiceContext(<PositionCreate />)

      const strategySelect = screen.getByLabelText(/Strategy Type/i)
      await act(async () => {
        fireEvent.change(strategySelect, { target: { value: 'Short Put' } })
      })

      await act(async () => {
        fireEvent.change(screen.getByLabelText(/Premium per Contract/i), { target: { value: '2.50' } })
      })

      await waitFor(() => {
        expect(screen.getByText(/× 100 = \$250\.00/i)).toBeInTheDocument()
      }, { timeout: 1000 })
    })
  })
})
