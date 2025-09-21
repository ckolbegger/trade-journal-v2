import React, { useState, useEffect } from 'react';
import type { JournalField } from '@/types/journal';
import { JOURNAL_PROMPTS } from '@/types/journal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export interface JournalEntryFormProps {
  entryType: 'position_plan' | 'trade_execution';
  initialFields?: JournalField[];
  onSave: (fields: JournalField[]) => void;
  onCancel: () => void;
}

export const JournalEntryForm: React.FC<JournalEntryFormProps> = ({
  entryType,
  initialFields = [],
  onSave,
  onCancel
}) => {
  const prompts = JOURNAL_PROMPTS[entryType];
  const [responses, setResponses] = useState<Record<string, string>>({});

  // Initialize responses with pre-filled values or empty strings
  useEffect(() => {
    const initialResponses: Record<string, string> = {};

    prompts.forEach(prompt => {
      const existingField = initialFields.find(field => field.name === prompt.name);
      initialResponses[prompt.name] = existingField?.response || '';
    });

    setResponses(initialResponses);
  }, [prompts, initialFields]);

  const handleResponseChange = (fieldName: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSave = () => {
    const fields: JournalField[] = prompts.map(prompt => ({
      name: prompt.name,
      prompt: prompt.prompt,
      response: responses[prompt.name] || ''
    }));

    onSave(fields);
  };

  const getFieldLabel = (prompt: typeof prompts[0]) => {
    switch (prompt.name) {
      case 'thesis':
        return 'Position Thesis';
      case 'market_conditions':
        return 'Market Conditions';
      case 'execution_strategy':
        return 'Execution Strategy';
      case 'execution_notes':
        return 'Execution Notes';
      case 'emotional_state':
        return 'Emotional State';
      case 'plan_deviations':
        return 'Plan Deviations';
      default:
        return prompt.name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  return (
    <form className="journal-entry-form space-y-6" role="form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
      {prompts.map((prompt) => (
        <div key={prompt.name} className="space-y-2">
          <Label className={prompt.required ? 'text-slate-900' : 'text-slate-700'}>
            {getFieldLabel(prompt)}
            {prompt.required && <span className="text-red-600 ml-1">*</span>}
          </Label>
          <p className="text-sm text-slate-600 leading-relaxed">{prompt.prompt}</p>
          <Textarea
            value={responses[prompt.name] || ''}
            onChange={(e) => handleResponseChange(prompt.name, e.target.value)}
            placeholder="Enter your response..."
            rows={4}
            aria-label={getFieldLabel(prompt)}
            className="min-h-[80px]"
          />
        </div>
      ))}

      <div className="flex gap-3 justify-end pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit">
          Save Journal Entry
        </Button>
      </div>
    </form>
  );
};