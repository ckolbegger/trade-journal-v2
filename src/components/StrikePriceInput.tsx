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
      <label htmlFor="strike-price" className="block text-sm font-medium mb-1.5 text-gray-700">
        Strike Price *
      </label>
      <input
        id="strike-price"
        type="number"
        min="0.01"
        step="0.01"
        value={value}
        onChange={handleChange}
        className="w-full p-3 border border-gray-300 rounded-md text-base"
      />
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
}
