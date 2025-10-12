import React, { useState } from 'react';
import './JournalCarousel.css';
import type { JournalEntry } from '../types/journal';

interface JournalCarouselProps {
  entries: JournalEntry[];
}

const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

const formatEntryType = (entryType: string) => {
  return entryType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const JournalCarousel: React.FC<JournalCarouselProps> = ({ entries }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : 0));
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex < entries.length - 1 ? prevIndex + 1 : prevIndex));
  };

  if (!entries || entries.length === 0) {
    return null;
  }

  return (
    <div className="carousel-container">
      <div
        className="carousel-wrapper"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {entries.map((entry, index) => (
          <div key={entry.id} className="carousel-slide" aria-hidden={index !== currentIndex}>
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
        ))}
      </div>

      {/* Temporary buttons for testing */}
      <div style={{ marginTop: '10px', textAlign: 'center' }}>
        <button data-testid="previous-button" onClick={handlePrevious} disabled={currentIndex === 0}>
          Previous
        </button>
        <button data-testid="next-button" onClick={handleNext} disabled={currentIndex === entries.length - 1}>
          Next
        </button>
      </div>
    </div>
  );
};
