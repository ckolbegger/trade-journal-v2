import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Position } from '@/lib/position';
import type { PriceHistory } from '@/types/priceHistory';

// Closing reason options
const CLOSING_REASONS = [
  {
    id: 'target_reached',
    title: '🎯 Target Reached',
    description: 'Position hit or exceeded profit target',
  },
  {
    id: 'stop_loss',
    title: '🛑 Stop Loss Hit',
    description: 'Position hit predetermined stop loss level',
  },
  {
    id: 'time_based',
    title: '⏰ Time-Based Exit',
    description: 'Closing based on time frame or schedule',
  },
  {
    id: 'technical',
    title: '📊 Technical Signal',
    description: 'New technical analysis suggests exit',
  },
  {
    id: 'fundamental',
    title: '📰 Fundamental Change',
    description: 'Company or market fundamentals changed',
  },
  {
    id: 'rebalance',
    title: '🔄 Portfolio Rebalance',
    description: 'Closing for portfolio management reasons',
  },
];

const PositionClosing = () => {
  const { positionId } = useParams<{ positionId: string }>();
  const navigate = useNavigate();

  // Component state
  const [currentStep, setCurrentStep] = useState(1);
  const [position, setPosition] = useState<Position | null>(null);
  const [currentPrice, setCurrentPrice] = useState<PriceHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [exitPrice, setExitPrice] = useState('165.05');
  const [exitQuantity, setExitQuantity] = useState('100');
  const [exitDate, setExitDate] = useState('');
  const [selectedReason, setSelectedReason] = useState('target_reached');
  const [closingJournal, setClosingJournal] = useState('');
  const [finalConfirmed, setFinalConfirmed] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form with position data
  useEffect(() => {
    const loadPosition = async () => {
      // TODO: Load position and current price from services
      // For now, set up defaults
      const today = new Date().toISOString().split('T')[0];
      setExitDate(today);
      setExitPrice('165.05'); // Current price
      setExitQuantity('100'); // Position quantity
      setLoading(false);
    };

    loadPosition();
  }, [positionId]);

  // Validate step before advancing
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!exitPrice || parseFloat(exitPrice) <= 0) {
        newErrors.exitPrice = 'Exit price is required';
      }
      if (!exitQuantity || parseFloat(exitQuantity) <= 0) {
        newErrors.exitQuantity = 'Quantity is required';
      }
    }

    if (step === 3) {
      if (!closingJournal.trim()) {
        newErrors.closingJournal = 'Journal entry is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation handlers
  const handleNext = () => {
    if (!validateStep(currentStep)) {
      return;
    }

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      setErrors({});
    } else if (currentStep === 4 && finalConfirmed) {
      // TODO: Submit closing trade
      console.log('Closing position...');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  // Get step title for header
  const getStepTitle = () => {
    const titles = {
      1: 'Close Position',
      2: 'Closing Reason',
      3: 'Plan vs Execution',
      4: 'Confirm Close',
    };
    return titles[currentStep as keyof typeof titles];
  };

  // Calculate P&L (mock data for now)
  const calculatePnL = () => {
    // TODO: Real P&L calculation
    return {
      amount: 1550,
      percentage: 10.4,
      avgCost: 149.50,
      currentPrice: 165.05,
      daysHeld: 12,
    };
  };

  const pnl = calculatePnL();

  if (loading) {
    return <div className="p-4">Loading position...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-white max-w-[414px] mx-auto relative">
      {/* Header */}
      <header className="bg-gray-800 text-white px-5 py-4 flex items-center sticky top-0 z-50">
        <button
          onClick={() => navigate(-1)}
          className="text-white text-lg mr-4 p-1"
          aria-label="Go back"
        >
          ←
        </button>
        <h1 className="text-lg font-semibold flex-1">{getStepTitle()}</h1>
      </header>

      {/* Step Indicator */}
      <div className="bg-gray-100 px-5 py-3 border-b border-gray-200">
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              data-testid={`step-dot-${step}`}
              className={`w-2 h-2 rounded-full ${
                step === currentStep
                  ? 'bg-blue-500 active'
                  : step < currentStep
                  ? 'bg-green-600 completed'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step Content */}
      <main className="px-5 py-5 pb-32">
        {/* Step 1: Closing Details */}
        {currentStep === 1 && (
          <div>
            <h2 className="text-2xl font-semibold mb-2">Closing Details</h2>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Enter the details of how you're closing this position.
            </p>

            {/* Position Summary */}
            <div className="bg-gradient-to-br from-green-600 to-green-700 text-white rounded-xl p-5 mb-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold">AAPL</h3>
                  <p className="text-xs opacity-90">Long Stock • 100 shares</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-semibold">+${pnl.amount}</div>
                  <div className="text-sm opacity-90">+{pnl.percentage}%</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-xs opacity-80 uppercase tracking-wide mb-0.5">Avg Cost</div>
                  <div className="text-base font-semibold">${pnl.avgCost}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs opacity-80 uppercase tracking-wide mb-0.5">Current Price</div>
                  <div className="text-base font-semibold">${pnl.currentPrice}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs opacity-80 uppercase tracking-wide mb-0.5">Days Held</div>
                  <div className="text-base font-semibold">{pnl.daysHeld}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs opacity-80 uppercase tracking-wide mb-0.5">Target</div>
                  <div className="text-base font-semibold">$165.00</div>
                </div>
              </div>
            </div>

            {/* Closing Form */}
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="exitPrice" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Exit Price <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    id="exitPrice"
                    value={exitPrice}
                    onChange={(e) => setExitPrice(e.target.value)}
                    placeholder="165.00"
                    step="0.01"
                    className="w-full px-4 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.exitPrice && (
                    <p className="text-xs text-red-600 mt-1">{errors.exitPrice}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="exitQuantity" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Quantity <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    id="exitQuantity"
                    value={exitQuantity}
                    onChange={(e) => setExitQuantity(e.target.value)}
                    placeholder="100"
                    className="w-full px-4 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.exitQuantity && (
                    <p className="text-xs text-red-600 mt-1">{errors.exitQuantity}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="exitDate" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Exit Date
                </label>
                <input
                  type="date"
                  id="exitDate"
                  value={exitDate}
                  onChange={(e) => setExitDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Closing Reason */}
        {currentStep === 2 && (
          <div>
            <h2 className="text-2xl font-semibold mb-2">Why Are You Closing?</h2>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Select the primary reason for closing this position. This helps with future analysis.
            </p>

            <div className="space-y-3">
              {CLOSING_REASONS.map((reason) => (
                <div
                  key={reason.id}
                  onClick={() => setSelectedReason(reason.id)}
                  className={`closing-reason bg-white border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedReason === reason.id
                      ? 'border-blue-500 bg-blue-50 selected'
                      : 'border-gray-200 hover:border-blue-500 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-sm font-medium mb-1 text-gray-900">{reason.title}</div>
                  <div className="text-xs text-gray-600">{reason.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Plan vs Execution */}
        {currentStep === 3 && (
          <div>
            <h2 className="text-2xl font-semibold mb-2">Plan vs Execution</h2>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Review how your actual performance compared to your original plan.
            </p>

            {/* Comparison Section */}
            <div className="bg-gray-50 rounded-xl p-5 mb-6">
              <div className="text-base font-semibold mb-4 text-gray-900">Performance Analysis</div>
              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-3 text-sm font-semibold text-gray-900">
                  <div>Metric</div>
                  <div>Planned</div>
                  <div>Actual</div>
                  <div>Variance</div>
                </div>
                <div className="grid grid-cols-4 gap-3 text-sm py-3 border-b border-gray-200">
                  <div className="text-gray-600">Exit Price</div>
                  <div className="text-gray-900 font-medium">$165.00</div>
                  <div className="text-gray-900 font-semibold">$165.00</div>
                  <div className="font-semibold">$0.00</div>
                </div>
                <div className="grid grid-cols-4 gap-3 text-sm py-3 border-b border-gray-200">
                  <div className="text-gray-600">Profit</div>
                  <div className="text-gray-900 font-medium">$1,550</div>
                  <div className="text-gray-900 font-semibold">$1,550</div>
                  <div className="font-semibold">$0</div>
                </div>
                <div className="grid grid-cols-4 gap-3 text-sm py-3 border-b border-gray-200">
                  <div className="text-gray-600">Return %</div>
                  <div className="text-gray-900 font-medium">10.4%</div>
                  <div className="text-gray-900 font-semibold">10.4%</div>
                  <div className="font-semibold">+0%</div>
                </div>
                <div className="grid grid-cols-4 gap-3 text-sm py-3">
                  <div className="text-gray-600">Time Held</div>
                  <div className="text-gray-900 font-medium">~14 days</div>
                  <div className="text-gray-900 font-semibold">12 days</div>
                  <div className="font-semibold text-green-600">-2 days</div>
                </div>
              </div>
            </div>

            {/* Key Lessons */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5 mb-6">
              <div className="text-base font-semibold text-yellow-800 mb-3 flex items-center">
                <span className="mr-2">💡</span>
                Key Lessons from This Trade
              </div>
              <div className="space-y-3">
                <div className="flex items-start text-sm text-yellow-900">
                  <span className="mr-2 mt-0.5 flex-shrink-0">✓</span>
                  <span>Plan executed perfectly - target hit exactly as anticipated</span>
                </div>
                <div className="flex items-start text-sm text-yellow-900">
                  <span className="mr-2 mt-0.5 flex-shrink-0">✓</span>
                  <span>Position closed 2 days earlier than expected due to momentum</span>
                </div>
                <div className="flex items-start text-sm text-yellow-900">
                  <span className="mr-2 mt-0.5 flex-shrink-0">✓</span>
                  <span>Risk management worked well with tight stop loss protection</span>
                </div>
              </div>
            </div>

            {/* Journal Entry */}
            <div>
              <label htmlFor="closingJournal" className="block text-sm font-medium text-gray-700 mb-1.5">
                Closing Journal Entry <span className="text-red-600">*</span>
              </label>
              <textarea
                id="closingJournal"
                value={closingJournal}
                onChange={(e) => setClosingJournal(e.target.value)}
                placeholder="Reflect on this trade: What worked well? What could be improved? What did you learn?"
                className="w-full px-4 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 min-h-[100px] resize-y font-sans"
              />
              {errors.closingJournal && (
                <p className="text-xs text-red-600 mt-1">{errors.closingJournal}</p>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {currentStep === 4 && (
          <div>
            <h2 className="text-2xl font-semibold mb-2">Confirm Position Close</h2>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Review all details before finalizing the position closure.
            </p>

            {/* Confirmation Summary */}
            <div className="bg-gray-50 rounded-lg p-5 mb-5">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Position:</span>
                  <span className="font-medium text-right">AAPL Long Stock</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-medium text-right">100 shares</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Exit Price:</span>
                  <span className="font-medium text-right">${exitPrice || '165.00'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Exit Date:</span>
                  <span className="font-medium text-right">
                    {new Date(exitDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Closing Reason:</span>
                  <span className="font-medium text-right">
                    {CLOSING_REASONS.find((r) => r.id === selectedReason)?.title.substring(2) || 'Target Reached'}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-3 border-t border-gray-200 font-semibold">
                  <span className="text-gray-600">Total Profit:</span>
                  <span className="text-right text-green-600">+${pnl.amount} (+{pnl.percentage}%)</span>
                </div>
              </div>
            </div>

            {/* Final Confirmation */}
            <div className="flex items-start bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <input
                type="checkbox"
                id="finalConfirm"
                checked={finalConfirmed}
                onChange={(e) => setFinalConfirmed(e.target.checked)}
                className="mr-3 mt-0.5"
              />
              <label htmlFor="finalConfirm" className="text-sm leading-relaxed text-red-900">
                I confirm that I want to <strong>permanently close</strong> this position. This action cannot be
                undone, and the position will be moved to closed positions history.
              </label>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-[414px] bg-white border-t border-gray-200 px-5 py-4 flex gap-3">
        {currentStep > 1 && (
          <button
            onClick={handleBack}
            className="btn btn-secondary bg-gray-100 text-gray-700 px-6 py-4 rounded-lg text-base font-semibold hover:bg-gray-200 transition-colors min-w-[100px]"
          >
            Back
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={currentStep === 4 && !finalConfirmed}
          className={`flex-1 px-6 py-4 rounded-lg text-base font-semibold transition-colors ${
            currentStep === 4
              ? 'bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed btn-danger'
              : 'bg-blue-500 text-white hover:bg-blue-600 btn-primary'
          }`}
        >
          {currentStep === 4 ? 'Close Position' : 'Continue'}
        </button>
      </div>
    </div>
  );
};

export default PositionClosing;
