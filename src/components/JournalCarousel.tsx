import React from 'react';
import './JournalCarousel.css';
import type { JournalEntry } from '../types/journal';

interface JournalCarouselProps {
  entry: JournalEntry;
}

// A simple date formatting utility (can be replaced with a more robust one if needed)
const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

// A utility to format the entry type
const formatEntryType = (entryType: string) => {
  return entryType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const JournalCarousel: React.FC<JournalCarouselProps> = ({ entry }) => {
  return (
    <div className="carousel-slide">
      <div className="journal-entry">
        <div className="entry-card">
          <div className="journal-header">
            <div className="journal-type">{formatEntryType(entry.entry_type)}</div>
            <div className="journal-date">{formatDate(entry.created_at)}</div>
          </div>
          <div className="journal-fields">
            {entry.fields.map((field) => (
              <div key={field.name} className="journal-field">
                <div className="field-prompt">{field.prompt}</div>
                <div className="field-response">{field.response}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
