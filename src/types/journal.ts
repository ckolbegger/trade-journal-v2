export interface JournalField {
  name: string;
  prompt: string;
  response: string;
}

export interface JournalEntry {
  id: string;
  position_id?: string;
  trade_id?: string;
  entry_type: 'position_plan' | 'trade_execution';
  fields: JournalField[];
  created_at: string;
  executed_at?: string;
}

export const JOURNAL_PROMPTS = {
  position_plan: [
    {
      name: 'thesis',
      prompt: 'Why are you planning this position? What\'s your market outlook and strategy?',
      required: true
    },
    {
      name: 'emotional_state',
      prompt: 'How are you feeling about this trade?',
      required: false
    },
    {
      name: 'market_conditions',
      prompt: 'Describe current market environment and how it affects this trade',
      required: false
    },
    {
      name: 'execution_strategy',
      prompt: 'How will you enter and exit this position?',
      required: false
    }
  ],
  trade_execution: [
    {
      name: 'execution_notes',
      prompt: 'Describe the execution',
      required: false
    },
    {
      name: 'emotional_state',
      prompt: 'How do you feel about this execution?',
      required: false
    },
    {
      name: 'market_conditions',
      prompt: 'Describe current market environment and how it affects this trade',
      required: false
    },
    {
      name: 'execution_strategy',
      prompt: 'How will you enter and exit this position?',
      required: false
    }
  ]
} as const;