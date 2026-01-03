import type { PriceBasis } from '@/lib/position';

interface PriceBasisSelectorProps {
  name: string;
  value: PriceBasis | undefined;
  onChange: (value: PriceBasis) => void;
}

export function PriceBasisSelector({ name, value, onChange }: PriceBasisSelectorProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value as PriceBasis);
  };

  return (
    <div>
      <label>
        <input
          type="radio"
          name={name}
          value="stock"
          checked={value === 'stock'}
          onChange={handleChange}
        />
        Stock
      </label>
      <label>
        <input
          type="radio"
          name={name}
          value="option"
          checked={value === 'option'}
          onChange={handleChange}
        />
        Option
      </label>
    </div>
  );
}
