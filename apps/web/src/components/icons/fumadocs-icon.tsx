"use client";

import type { SVGProps } from "react";
import { useId } from "react";

export function FumadocsIcon(props: SVGProps<SVGSVGElement>) {
  const id = useId();
  return (
    <svg height="80" viewBox="0 0 180 180" width="80" {...props}>
      <circle
        cx="90"
        cy="90"
        fill={`url(#${id}-iconGradient)`}
        r="89"
        stroke="white"
        strokeWidth="1"
      />
      <defs>
        <linearGradient
          gradientTransform="rotate(45)"
          id={`${id}-iconGradient`}
        >
          <stop offset="45%" stopColor="rgba(255, 255, 255, 0.1)" />
          <stop offset="100%" stopColor="white" />
        </linearGradient>
      </defs>
    </svg>
  );
}
