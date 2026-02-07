import { Quote } from "lucide-react";
import { HyperText } from "@/components/ui/hyper-text";

export function Testimonials() {
  const testimonials = [
    {
      quote:
        "I shipped my MVP in 3 days. THREE DAYS. The predictable pricing means I don't have to stress about costs as I scale. No vendor lock-in, no surprise bills. Seriously, how are you not charging more for this?",
      role: "Solo Founder",
      avatar: "SF",
    },
    {
      quote:
        "The documentation is chef's kiss. Everything is so well organized that I can actually find what I need in seconds. The project documentation feature is a game changer. I was able to document all my business decisions and core user flows INSIDE the codebase and now LLMs rarely hallucinate. I'm lost for words...",
      role: "Technical Co-founder",
      avatar: "TC",
    },
    {
      quote:
        "My non-technical co-founder actually understands what we're building now. I can deploy the built-in documentation with them and they get it. Even better, I can show them exact cost projections as we scale. No guessing, no surprises. They finally stopped asking if we're going to get a massive bill next month LOL",
      role: "Technical Founder",
      avatar: "TF",
    },
    {
      quote:
        "Obaid responds to questions so fast I thought he was a bot at first lol. Had a weird edge case with authentication at 2am and he walked me through it step by step. The support alone is worth more than what I paid.",
      role: "Agency Owner",
      avatar: "AO",
    },
  ];

  return (
    <section className="bg-black py-12 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <HyperText
            as="h2"
            className="px-4 font-bold font-mono text-2xl text-white sm:px-0 sm:text-3xl md:text-4xl"
            duration={1000}
            startOnView
          >
            What Builders Are Saying
          </HyperText>
          <p className="px-4 font-mono text-sm text-white/60 sm:px-0 sm:text-base">
            Join founders shipping faster than ever before
          </p>
        </div>
        <div className="mx-auto mt-8 grid max-w-5xl grid-cols-1 gap-4 sm:mt-16 sm:gap-6 lg:grid-cols-2">
          {testimonials.map((testimonial, idx) => (
            <div
              className="flex flex-col border border-white/10 bg-white/5 p-6 transition-all hover:bg-white/10 sm:p-8"
              key={idx}
            >
              <Quote
                aria-hidden="true"
                className="mb-4 h-8 w-8 text-white/20"
              />
              <blockquote className="flex-grow">
                <p className="mb-6 font-mono text-sm text-white/80 leading-relaxed sm:text-base">
                  "{testimonial.quote}"
                </p>
              </blockquote>
              <div className="mt-auto flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 font-mono font-semibold text-sm text-white">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-mono font-semibold text-sm text-white">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
