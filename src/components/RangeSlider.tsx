"use client";

export default function RangeSlider({
  id,
  min,
  max,
  step,
  value,
  onChange,
  ariaLabel,
}: {
  id: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  ariaLabel?: string;
}) {
  const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;
  return (
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label={ariaLabel}
      aria-valuetext={String(value)}
      className="range-input"
      style={{
        background: `linear-gradient(to right, rgb(var(--accent)) 0%, rgb(var(--accent)) ${pct}%, var(--hairline) ${pct}%, var(--hairline) 100%)`,
      }}
    />
  );
}