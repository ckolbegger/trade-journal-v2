interface StrikePriceInputProps {
  value: number;
  onChange: (value: number) => void;
  error?: string;
}

export function StrikePriceInput({ value, onChange, error }: StrikePriceInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsedValue = parseFloat(e.target.value);
    if (!isNaN(parsedValue)) {
      onChange(parsedValue);
    }
  };

  return (
    <div>
      <label htmlFor="strike-price">Strike Price</label>
      <input
        id="strike-price"
        type="number"
        min="0.01"
        step="0.01"
        value={value}
        onChange={handleChange}
      />
      {error && <div>{error}</div>}
    </div>
  );
}
