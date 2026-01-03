interface ExpirationDatePickerProps {
  value: Date;
  onChange: (value: Date) => void;
  error?: string;
}

export function ExpirationDatePicker({ value, onChange, error }: ExpirationDatePickerProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    if (dateValue) {
      const parsedDate = new Date(dateValue);
      if (!isNaN(parsedDate.getTime())) {
        onChange(parsedDate);
      }
    }
  };

  // Convert Date to YYYY-MM-DD format for the input
  const dateString = value.toISOString().split('T')[0];

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <label htmlFor="expiration-date">Expiration Date</label>
      <input
        id="expiration-date"
        type="date"
        min={today}
        value={dateString}
        onChange={handleChange}
      />
      {error && <div>{error}</div>}
    </div>
  );
}
