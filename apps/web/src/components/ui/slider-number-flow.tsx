import NumberFlow from "@number-flow/react";
import * as RadixSlider from "@radix-ui/react-slider";
import clsx from "clsx";

interface SliderProps extends RadixSlider.SliderProps {
  displayValue?: (value: number) => number;
  suffix?: string;
}

export default function Slider({
  value,
  className,
  displayValue,
  suffix,
  ...props
}: SliderProps) {
  const numValue = value?.[0] ?? 0;
  const displayNum = displayValue ? displayValue(numValue) : numValue;

  return (
    <RadixSlider.Root
      {...props}
      className={clsx(
        className,
        "relative flex h-5 w-full touch-none select-none items-center"
      )}
      value={value}
    >
      <RadixSlider.Track className="relative h-[3px] grow rounded-full bg-white/10">
        <RadixSlider.Range className="absolute h-full rounded-full bg-white" />
      </RadixSlider.Track>
      <RadixSlider.Thumb
        aria-label="Slider control"
        className="relative block h-5 w-5 rounded-full bg-white shadow-md ring ring-white/20"
      >
        {value?.[0] != null && (
          <div className="absolute top-8 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap font-mono font-semibold text-sm text-white">
            <NumberFlow
              format={{ notation: "standard" }}
              opacityTiming={{
                duration: 250,
                easing: "ease-out",
              }}
              transformTiming={{
                easing:
                  "linear(0, 0.0033 0.8%, 0.0263 2.39%, 0.0896 4.77%, 0.4676 15.12%, 0.5688, 0.6553, 0.7274, 0.7862, 0.8336 31.04%, 0.8793, 0.9132 38.99%, 0.9421 43.77%, 0.9642 49.34%, 0.9796 55.71%, 0.9893 62.87%, 0.9952 71.62%, 0.9983 82.76%, 0.9996 99.47%)",
                duration: 500,
              }}
              value={displayNum}
              willChange
            />
            {suffix && <span>{suffix}</span>}
          </div>
        )}
      </RadixSlider.Thumb>
    </RadixSlider.Root>
  );
}

export { Slider };
