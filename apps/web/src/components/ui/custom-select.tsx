import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  label?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  label,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative" ref={containerRef}>
      <button
        className="flex w-full cursor-pointer appearance-none items-center justify-between rounded border border-white/20 bg-white/5 px-3 py-2 pr-8 text-left font-mono text-sm text-white transition-colors hover:bg-white/10 focus:border-white/40 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span>{selectedOption?.label || "Select..."}</span>
        <ChevronDown
          className={`h-4 w-4 text-white/60 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 left-0 z-50 mt-1 rounded border border-white/20 bg-black shadow-lg">
          {options.map((option) => (
            <button
              className={`w-full px-3 py-2 text-left font-mono text-sm transition-colors hover:bg-white/10 ${
                value === option.value
                  ? "bg-white/20 text-white"
                  : "text-white/80"
              }`}
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              type="button"
            >
              {value === option.value && <span className="mr-2">✓</span>}
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
