// Phase 1A Trade Interface - Individual trade execution records
export interface Trade {
  id: string
  trade_type: 'buy' | 'sell'
  quantity: number
  price: number
  timestamp: Date
  notes?: string
}
