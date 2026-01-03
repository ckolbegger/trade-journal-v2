import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft } from 'lucide-react'
import { useServices } from '@/contexts/ServiceContext'
import { PositionJournalTransaction } from '@/services/PositionJournalTransaction'
import { EnhancedJournalEntryForm } from '@/components/EnhancedJournalEntryForm'
import { StrikePriceInput } from '@/components/StrikePriceInput'
import { ExpirationDatePicker } from '@/components/ExpirationDatePicker'
import { PositionRiskCalculator } from '@/domain/calculators/PositionRiskCalculator'
import type { JournalField } from '@/types/journal'

interface PositionFormData {
  symbol: string
  strategy_type: 'Long Stock' | 'Short Put'
  target_entry_price: string
  target_quantity: string
  profit_target: string
  profit_target_basis: 'stock_price' | 'option_price'
  stop_loss: string
  stop_loss_basis: 'stock_price' | 'option_price'
  position_thesis: string
  strike_price: string
  expiration_date: string
  premium_per_contract: string
}

interface ValidationErrors {
  symbol?: string
  target_entry_price?: string
  target_quantity?: string
  profit_target?: string
  profit_target_basis?: string
  stop_loss?: string
  stop_loss_basis?: string
  position_thesis?: string
  strike_price?: string
  expiration_date?: string
  premium_per_contract?: string
}

const formatBasisLabel = (basis: PositionFormData['profit_target_basis']): string => {
  return basis === 'option_price' ? 'Option Premium' : 'Stock Price'
}

const parseDateInput = (value: string): Date | null => {
  if (!value) return null
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

const isDateInPast = (value: string): boolean => {
  const parsed = parseDateInput(value)
  if (!parsed) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return parsed < today
}

const parseCurrency = (value: string): number => {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const parseQuantity = (value: string): number => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : 0
}

export function PositionCreate() {
  const navigate = useNavigate()
  const services = useServices()
  const [currentStep, setCurrentStep] = useState(1)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [immutableConfirmed, setImmutableConfirmed] = useState(false)
  const [journalFields, setJournalFields] = useState<JournalField[]>([])
  const [isCreating, setIsCreating] = useState(false)

  // Initialize journal fields with current prompts when component mounts
  useEffect(() => {
    const initializeJournalFields = async () => {
      const journalService = services.getJournalService()
      const emptyEntry = await journalService.createEmptyJournalEntry('position_plan')
      setJournalFields(emptyEntry.fields)
    }

    initializeJournalFields()
  }, [services])

  const [formData, setFormData] = useState<PositionFormData>({
    symbol: '',
    strategy_type: 'Long Stock',
    target_entry_price: '',
    target_quantity: '',
    profit_target: '',
    profit_target_basis: 'stock_price',
    stop_loss: '',
    stop_loss_basis: 'stock_price',
    position_thesis: '',
    strike_price: '',
    expiration_date: '',
    premium_per_contract: ''
  })

  const validateStep1 = (): boolean => {
    const isShortPut = formData.strategy_type === 'Short Put'
    const newErrors: ValidationErrors = {}

    if (!formData.symbol.trim()) {
      newErrors.symbol = 'Symbol is required'
    }

    if (!formData.target_entry_price) {
      newErrors.target_entry_price = 'Target entry price is required'
    } else if (parseFloat(formData.target_entry_price) <= 0) {
      newErrors.target_entry_price = 'Target entry price must be positive'
    }

    if (!formData.target_quantity) {
      newErrors.target_quantity = 'Target quantity is required'
    } else if (parseInt(formData.target_quantity) <= 0) {
      newErrors.target_quantity = 'Target quantity must be positive'
    }

    if (!formData.profit_target) {
      newErrors.profit_target = 'Profit target is required'
    } else if (parseFloat(formData.profit_target) <= 0) {
      newErrors.profit_target = 'Profit target must be positive'
    }

    if (!formData.profit_target_basis) {
      newErrors.profit_target_basis = 'Profit target basis is required'
    }

    if (!formData.stop_loss) {
      newErrors.stop_loss = 'Stop loss is required'
    } else if (parseFloat(formData.stop_loss) <= 0) {
      newErrors.stop_loss = 'Stop loss must be positive'
    }

    if (!formData.stop_loss_basis) {
      newErrors.stop_loss_basis = 'Stop loss basis is required'
    }

    if (isShortPut) {
      if (!formData.strike_price) {
        newErrors.strike_price = 'Strike price is required'
      } else if (parseFloat(formData.strike_price) <= 0) {
        newErrors.strike_price = 'Strike price must be positive'
      }

      if (!formData.expiration_date) {
        newErrors.expiration_date = 'Expiration date is required'
      } else if (isDateInPast(formData.expiration_date)) {
        newErrors.expiration_date = 'Expiration date must be in the future'
      }

      if (!formData.premium_per_contract) {
        newErrors.premium_per_contract = 'Target premium is required'
      } else if (parseFloat(formData.premium_per_contract) <= 0) {
        newErrors.premium_per_contract = 'Target premium must be positive'
      }
    }

    if (!formData.position_thesis.trim()) {
      newErrors.position_thesis = 'Position thesis is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const formatCurrency = (amount: number): string => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const handleInputChange = (field: keyof PositionFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (field in errors && errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [field as keyof ValidationErrors]: undefined }))
    }
  }

  const handleStrategyChange = (value: PositionFormData['strategy_type']) => {
    setFormData(prev => {
      if (value === 'Short Put') {
        return {
          ...prev,
          strategy_type: value,
          profit_target_basis: 'option_price',
          stop_loss_basis: 'option_price'
        }
      }

      return {
        ...prev,
        strategy_type: value,
        profit_target_basis: 'stock_price',
        stop_loss_basis: 'stock_price',
        strike_price: '',
        expiration_date: '',
        premium_per_contract: ''
      }
    })

    setErrors(prev => ({
      ...prev,
      strike_price: undefined,
      expiration_date: undefined,
      premium_per_contract: undefined,
      profit_target_basis: undefined,
      stop_loss_basis: undefined
    }))
  }

  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2)
    } else if (currentStep === 2 && journalFields.length > 0) {
      setCurrentStep(3)
    } else if (currentStep === 3) {
      setCurrentStep(4)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleJournalSave = (fields: JournalField[]) => {
    setJournalFields(fields)
    setCurrentStep(3)
  }

  const handleJournalCancel = () => {
    setCurrentStep(1)
  }

  const handleCreatePosition = async () => {
    if (!immutableConfirmed || journalFields.length === 0) return

    setIsCreating(true)

    try {
      // Get services from container
      const positionService = services.getPositionService()
      const journalService = services.getJournalService()

      // Create transaction service
      const transactionService = new PositionJournalTransaction(positionService, journalService)

      // Execute UUID-based transaction
      const result = await transactionService.createPositionWithJournal({
        symbol: formData.symbol,
        strategy_type: formData.strategy_type,
        trade_kind: formData.strategy_type === 'Short Put' ? 'option' : 'stock',
        target_entry_price: parseCurrency(formData.target_entry_price),
        target_quantity: parseQuantity(formData.target_quantity),
        profit_target: parseCurrency(formData.profit_target),
        profit_target_basis: formData.profit_target_basis,
        stop_loss: parseCurrency(formData.stop_loss),
        stop_loss_basis: formData.stop_loss_basis,
        position_thesis: formData.position_thesis,
        option_type: formData.strategy_type === 'Short Put' ? 'put' : undefined,
        strike_price: formData.strategy_type === 'Short Put' ? parseCurrency(formData.strike_price) : undefined,
        expiration_date: formData.strategy_type === 'Short Put'
          ? parseDateInput(formData.expiration_date) ?? undefined
          : undefined,
        premium_per_contract: formData.strategy_type === 'Short Put'
          ? parseCurrency(formData.premium_per_contract)
          : undefined,
        journalFields: journalFields
      })

      // Navigate to position detail on success
      navigate(`/position/${result.position.id}`)
    } catch (error) {
      console.error('Failed to create position and journal entry:', error)
      alert('Failed to create position. Please check the console for details.')
    } finally {
      setIsCreating(false)
    }
  }

  const renderStepIndicator = () => (
    <div data-testid="step-indicator" className="bg-gray-50 p-3 border-b border-gray-200">
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4].map(step => (
          <div
            key={step}
            data-testid="step-dot"
            className={`w-2 h-2 rounded-full ${
              step < currentStep ? 'bg-green-500 completed' :
              step === currentStep ? 'bg-blue-500 active' :
              'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  )

  const renderStep1 = () => (
    <div className="p-5 pb-32">
      <h2 className="text-2xl font-semibold mb-2">Position Plan</h2>
      <p className="text-sm text-gray-500 mb-6 leading-relaxed">
        Define your trading strategy and risk parameters. This plan will be immutable once confirmed.
      </p>

      <div className="space-y-5">
        <div>
          <Label htmlFor="symbol" className="block text-sm font-medium mb-1.5 text-gray-700">
            Symbol *
          </Label>
          <Input
            id="symbol"
            value={formData.symbol}
            onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
            placeholder="e.g. AAPL"
            className="w-full p-3 border border-gray-300 rounded-md text-base"
          />
          {errors.symbol && <p className="text-red-600 text-xs mt-1">{errors.symbol}</p>}
        </div>

        <div>
          <Label htmlFor="strategy_type" className="block text-sm font-medium mb-1.5 text-gray-700">
            Strategy Type *
          </Label>
          <select
            id="strategy_type"
            value={formData.strategy_type}
            onChange={(e) => handleStrategyChange(e.target.value as PositionFormData['strategy_type'])}
            className="w-full p-3 border border-gray-300 rounded-md text-base bg-white"
          >
            <option value="Long Stock">Long Stock</option>
            <option value="Short Put">Short Put</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">Select a strategy to tailor plan fields.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="target_entry_price" className="block text-sm font-medium mb-1.5 text-gray-700">
              Target Entry Price *
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                id="target_entry_price"
                type="number"
                step="0.01"
                value={formData.target_entry_price}
                onChange={(e) => handleInputChange('target_entry_price', e.target.value)}
                placeholder="0.00"
                className="w-full p-3 pl-7 border border-gray-300 rounded-md text-base"
              />
            </div>
            {errors.target_entry_price && <p className="text-red-600 text-xs mt-1">{errors.target_entry_price}</p>}
          </div>

          <div>
            <Label htmlFor="target_quantity" className="block text-sm font-medium mb-1.5 text-gray-700">
              {formData.strategy_type === 'Short Put' ? 'Contract Quantity *' : 'Target Quantity *'}
            </Label>
            <Input
              id="target_quantity"
              type="number"
              value={formData.target_quantity}
              onChange={(e) => handleInputChange('target_quantity', e.target.value)}
              placeholder="0"
              className="w-full p-3 border border-gray-300 rounded-md text-base"
            />
            {errors.target_quantity && <p className="text-red-600 text-xs mt-1">{errors.target_quantity}</p>}
          </div>
        </div>

        {formData.strategy_type === 'Short Put' && (
          <div className="grid grid-cols-2 gap-3">
            <StrikePriceInput
              value={formData.strike_price}
              onChange={(value) => handleInputChange('strike_price', value)}
              error={errors.strike_price}
            />
            <ExpirationDatePicker
              value={formData.expiration_date}
              onChange={(value) => handleInputChange('expiration_date', value)}
              error={errors.expiration_date}
            />
          </div>
        )}

        {formData.strategy_type === 'Short Put' && (
          <div>
            <Label htmlFor="premium_per_contract" className="block text-sm font-medium mb-1.5 text-gray-700">
              Target Premium (per contract) *
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                id="premium_per_contract"
                type="number"
                step="0.01"
                value={formData.premium_per_contract}
                onChange={(e) => handleInputChange('premium_per_contract', e.target.value)}
                placeholder="0.00"
                className="w-full p-3 pl-7 border border-gray-300 rounded-md text-base"
              />
            </div>
            {errors.premium_per_contract && <p className="text-red-600 text-xs mt-1">{errors.premium_per_contract}</p>}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="profit_target" className="block text-sm font-medium mb-1.5 text-gray-700">
              Profit Target *
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                id="profit_target"
                type="number"
                step="0.01"
                value={formData.profit_target}
                onChange={(e) => handleInputChange('profit_target', e.target.value)}
                placeholder="0.00"
                className="w-full p-3 pl-7 border border-gray-300 rounded-md text-base"
              />
            </div>
            {errors.profit_target && <p className="text-red-600 text-xs mt-1">{errors.profit_target}</p>}
            {formData.strategy_type === 'Short Put' ? (
              <>
                <Label htmlFor="profit_target_basis" className="block text-xs font-medium mt-2 text-gray-700">
                  Profit Target Basis *
                </Label>
                <select
                  id="profit_target_basis"
                  value={formData.profit_target_basis}
                  onChange={(e) => handleInputChange('profit_target_basis', e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="option_price">Option Premium</option>
                  <option value="stock_price">Stock Price</option>
                </select>
                {errors.profit_target_basis && (
                  <p className="text-red-600 text-xs mt-1">{errors.profit_target_basis}</p>
                )}
              </>
            ) : (
              <p className="text-xs text-gray-500 mt-1">Based on stock price</p>
            )}
          </div>

          <div>
            <Label htmlFor="stop_loss" className="block text-sm font-medium mb-1.5 text-gray-700">
              Stop Loss *
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                id="stop_loss"
                type="number"
                step="0.01"
                value={formData.stop_loss}
                onChange={(e) => handleInputChange('stop_loss', e.target.value)}
                placeholder="0.00"
                className="w-full p-3 pl-7 border border-gray-300 rounded-md text-base"
              />
            </div>
            {errors.stop_loss && <p className="text-red-600 text-xs mt-1">{errors.stop_loss}</p>}
            {formData.strategy_type === 'Short Put' ? (
              <>
                <Label htmlFor="stop_loss_basis" className="block text-xs font-medium mt-2 text-gray-700">
                  Stop Loss Basis *
                </Label>
                <select
                  id="stop_loss_basis"
                  value={formData.stop_loss_basis}
                  onChange={(e) => handleInputChange('stop_loss_basis', e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="option_price">Option Premium</option>
                  <option value="stock_price">Stock Price</option>
                </select>
                {errors.stop_loss_basis && (
                  <p className="text-red-600 text-xs mt-1">{errors.stop_loss_basis}</p>
                )}
              </>
            ) : (
              <p className="text-xs text-gray-500 mt-1">Based on stock price</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="position_thesis" className="block text-sm font-medium mb-1.5 text-gray-700">
            Position Thesis *
          </Label>
          <Textarea
            id="position_thesis"
            value={formData.position_thesis}
            onChange={(e) => handleInputChange('position_thesis', e.target.value)}
            placeholder="Why are you entering this position? What's your analysis?"
            className="w-full p-3 border border-gray-300 rounded-md text-base min-h-20 resize-y"
            rows={3}
          />
          {errors.position_thesis && <p className="text-red-600 text-xs mt-1">{errors.position_thesis}</p>}
          <p className="text-xs text-gray-500 mt-1">Required for every position plan</p>
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => {
    const metrics = PositionRiskCalculator.calculate({
      strategy_type: formData.strategy_type,
      target_entry_price: parseCurrency(formData.target_entry_price),
      target_quantity: parseQuantity(formData.target_quantity),
      profit_target: parseCurrency(formData.profit_target),
      stop_loss: parseCurrency(formData.stop_loss),
      strike_price: parseCurrency(formData.strike_price),
      premium_per_contract: parseCurrency(formData.premium_per_contract)
    })

    return (
      <div className="p-5 pb-32">
        <h2 className="text-2xl font-semibold mb-2">Risk Assessment</h2>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Review the risk and reward profile of your position plan.
        </p>

        <div className="bg-gray-50 p-4 rounded-lg mb-5">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Investment:</span>
              <span className="font-medium">{formatCurrency(metrics.totalInvestment)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Maximum Profit:</span>
              <span className="font-medium text-green-600">{formatCurrency(metrics.maxProfit)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Maximum Loss:</span>
              <span className="font-medium text-red-600">{formatCurrency(metrics.maxLoss)}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
              <span className="text-gray-600 font-medium">Risk/Reward Ratio:</span>
              <span className="font-semibold">{metrics.riskRewardRatio}</span>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <div className="flex items-start">
            <span className="text-yellow-600 mr-2">⚠️</span>
            <div className="text-sm text-yellow-800">
              Review these calculations carefully. Once confirmed, your position plan cannot be modified.
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderStep3 = () => (
    <div className="p-5 pb-32">
      <EnhancedJournalEntryForm
        entryType="position_plan"
        onSave={handleJournalSave}
        onCancel={handleJournalCancel}
        submitButtonText="Next: Risk Assessment"
        initialFields={journalFields}
      />
    </div>
  )

  const renderStep4 = () => (
    <div className="p-5 pb-32">
      <h2 className="text-2xl font-semibold mb-2">Confirmation</h2>
      <p className="text-sm text-gray-500 mb-6 leading-relaxed">
        Final review before creating your immutable position plan.
      </p>

      <div className="bg-gray-50 rounded-lg p-5 mb-5">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Symbol:</span>
            <span className="font-medium">{formData.symbol}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Strategy:</span>
            <span className="font-medium">{formData.strategy_type}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Target Entry:</span>
            <span className="font-medium">${parseCurrency(formData.target_entry_price).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Quantity:</span>
            <span className="font-medium">
              {formData.target_quantity} {formData.strategy_type === 'Short Put' ? 'contracts' : 'shares'}
            </span>
          </div>
          {formData.strategy_type === 'Short Put' && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Strike Price:</span>
                <span className="font-medium">${parseCurrency(formData.strike_price).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Expiration Date:</span>
                <span className="font-medium">{formData.expiration_date}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Target Premium:</span>
                <span className="font-medium">${parseCurrency(formData.premium_per_contract).toFixed(2)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Profit Target:</span>
            <span className="font-medium">
              ${parseCurrency(formData.profit_target).toFixed(2)}
              {formData.strategy_type === 'Short Put' ? ` (${formatBasisLabel(formData.profit_target_basis)})` : ''}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Stop Loss:</span>
            <span className="font-medium">
              ${parseCurrency(formData.stop_loss).toFixed(2)}
              {formData.strategy_type === 'Short Put' ? ` (${formatBasisLabel(formData.stop_loss_basis)})` : ''}
            </span>
          </div>
          <div className="flex justify-start text-sm">
            <span className="text-gray-600 mr-2">Thesis:</span>
            <span className="font-medium text-left max-w-60">{formData.position_thesis}</span>
          </div>
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-5">
        <div className="flex items-start">
          <input
            type="checkbox"
            id="immutable-confirm"
            checked={immutableConfirmed}
            onChange={(e) => setImmutableConfirmed(e.target.checked)}
            className="mr-3 mt-0.5"
          />
          <label htmlFor="immutable-confirm" className="text-sm text-red-800 leading-relaxed">
            I understand this position plan will be immutable after creation and cannot be modified. 🔒
          </label>
        </div>
      </div>
    </div>
  )

  const renderBottomActions = () => {
    // Step 2 (journal form) handles its own actions, so don't render bottom actions
    if (currentStep === 2) {
      return null
    }

    return (
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-white border-t border-gray-200 p-4">
        <div className="flex gap-3">
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={handlePrevStep}
              className="flex-1"
              disabled={isCreating}
            >
              {currentStep === 2 ? 'Back to Position Plan' :
               currentStep === 3 ? 'Back to Trading Journal' : 'Back to Risk Assessment'}
            </Button>
          )}

          {currentStep < 4 ? (
            <Button
              onClick={handleNextStep}
              className="flex-1 bg-blue-600 hover:bg-blue-500"
            >
              {currentStep === 1 ? 'Next: Trading Journal' :
               currentStep === 2 ? 'Next: Risk Assessment' : 'Next: Confirmation'}
            </Button>
          ) : (
            <Button
              onClick={handleCreatePosition}
              disabled={!immutableConfirmed || isCreating}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-300"
            >
              {isCreating ? 'Creating...' : 'Create Position Plan'}
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gray-800 text-white p-4 flex items-center sticky top-0 z-50">
        <button
          onClick={() => navigate('/')}
          className="text-white text-lg mr-4 p-1"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold flex-1">Create Position</h1>
      </header>

      {renderStepIndicator()}

      {/* Step Content */}
      <main>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep3()}
        {currentStep === 3 && renderStep2()}
        {currentStep === 4 && renderStep4()}
      </main>

      {renderBottomActions()}
    </div>
  )
}
