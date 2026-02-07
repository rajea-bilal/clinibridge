import { useEffect } from "react";

/**
 * Hook that observes `.animate-on-scroll` elements and adds the `.animate`
 * class once they enter the viewport, triggering their CSS animation.
 *
 * Call once in the top-level landing page component.
 */
export function useScrollAnimation() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -5% 0px" },
    );

    const elements = document.querySelectorAll(".animate-on-scroll");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);
}
