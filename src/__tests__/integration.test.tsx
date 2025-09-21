import { describe, it, expect } from 'vitest';

describe('Real Integration Tests - Import Resolution', () => {
  it('should import JOURNAL_PROMPTS (runtime value) from @/types/journal', async () => {
    // This tests runtime values that should be importable
    const { JOURNAL_PROMPTS } = await import('@/types/journal');
    expect(JOURNAL_PROMPTS).toBeDefined();
    expect(JOURNAL_PROMPTS.position_plan).toBeDefined();
  });

  it('should import JournalEntryForm from @/components/JournalEntryForm', async () => {
    // This should match exactly what PositionCreate.tsx does
    const { JournalEntryForm } = await import('@/components/JournalEntryForm');
    expect(JournalEntryForm).toBeDefined();
  });

  it('should import JournalService from @/services/JournalService', async () => {
    // This should match exactly what PositionCreate.tsx does
    const { JournalService } = await import('@/services/JournalService');
    expect(JournalService).toBeDefined();
  });

  it('should NOT import TypeScript interfaces as runtime values', async () => {
    // This test documents that interfaces are compile-time only
    const module = await import('@/types/journal');
    expect(module.JournalField).toBeUndefined(); // Interfaces don't exist at runtime
    expect(module.JournalEntry).toBeUndefined(); // Interfaces don't exist at runtime
  });
});