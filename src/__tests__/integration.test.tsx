import { describe, it, expect } from 'vitest';

describe('Real Integration Tests - Import Resolution', () => {
  it('should import JOURNAL_PROMPTS (runtime value) from @/types/journal', async () => {
    // This tests runtime values that should be importable
    const { JOURNAL_PROMPTS } = await import('@/types/journal');
    expect(JOURNAL_PROMPTS).toBeDefined();
    expect(JOURNAL_PROMPTS.position_plan).toBeDefined();
  });

  it('should import EnhancedJournalEntryForm from @/components/EnhancedJournalEntryForm', async () => {
    // This should match exactly what PositionDetail.tsx does (journal creation happens here now)
    const { EnhancedJournalEntryForm } = await import('@/components/EnhancedJournalEntryForm');
    expect(EnhancedJournalEntryForm).toBeDefined();
  });

  it('should import PositionService from @/lib/position', async () => {
    // This should match exactly what PositionCreate.tsx does
    const { PositionService } = await import('@/lib/position');
    expect(PositionService).toBeDefined();
  });

  it('should NOT import TypeScript interfaces as runtime values', async () => {
    // This test documents that interfaces are compile-time only
    const module = await import('@/types/journal');
    expect(module.JournalField).toBeUndefined(); // Interfaces don't exist at runtime
    expect(module.JournalEntry).toBeUndefined(); // Interfaces don't exist at runtime
  });
});