interface ThresholdSliderProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  unit: string;
  onChange: (v: number) => void;
}

function decimals(step: number): number {
  const s = step.toString();
  const dot = s.indexOf('.');
  return dot === -1 ? 0 : s.length - dot - 1;
}

export function ThresholdSlider({
  label,
  min,
  max,
  step,
  value,
  unit,
  onChange,
}: ThresholdSliderProps) {
  const d = decimals(step);
  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-mono text-blue-600 font-semibold">
          {value.toFixed(d)}{' '}
          <span className="text-gray-400 font-normal">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-600"
      />
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-gray-400">
          {min.toFixed(d)} {unit}
        </span>
        <span className="text-[10px] text-gray-400">
          {max.toFixed(d)} {unit}
        </span>
      </div>
    </div>
  );
}
