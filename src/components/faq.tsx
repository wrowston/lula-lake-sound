"use client";

import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FAQ_CATEGORIES = [
  {
    category: "Sessions & recording",
    questions: [
      {
        id: 1,
        question: "What should I bring to my session?",
        answer:
          "Your instruments, any pedals or gear you particularly want to use, backup cables, and whatever charts, lyrics or demos you want to work from. We cover cables, microphones and the rest of the signal chain — but if you play a specific snare or favourite guitar, bring it.",
      },
      {
        id: 2,
        question: "Do you provide instruments and amps?",
        answer:
          "Yes. The gear list has the full picture, but there are several amps, a DW and a vintage Rogers kit, acoustics, electrics and a bass already at the studio.",
      },
      {
        id: 3,
        question: "Can I bring my own engineer or producer?",
        answer:
          "Absolutely — we’re happy to assist with setup and patching or to hand the room over entirely. However you like to work is fine.",
      },
      {
        id: 4,
        question: "How far in advance should I book?",
        answer:
          "Spring and fall fill up earliest, so two to four weeks out is a safe window. That said, last-minute availability does come up — it’s worth reaching out even on short notice.",
      },
    ],
  },
  {
    category: "Stay & logistics",
    questions: [
      {
        id: 9,
        question: "Is there accommodation nearby?",
        answer:
          "Yes. We keep a short list of places we’ve vetted for out-of-town artists and can help you arrange lodging within a few minutes of the studio.",
      },
    ],
  },
] as const;

export function FAQ() {
  const [openQuestions, setOpenQuestions] = useState<number[]>([]);

  const toggleQuestion = (questionId: number) => {
    setOpenQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId],
    );
  };

  return (
    <section
      id="faq"
      className="relative bg-deep-forest px-6 py-28 md:py-40 lg:py-48"
    >
      <div className="absolute inset-0 bg-texture-stone opacity-30" />

      <div className="relative z-10 mx-auto max-w-3xl">
        {/* Section header */}
        <header className="reveal mx-auto mb-20 flex w-full flex-col items-center text-center md:mb-28">
          <p className="label-text mb-6 text-sand/65">04 &middot; Notes</p>
          <h2 className="headline-primary mb-8 text-[2.25rem] text-warm-white md:text-[3rem] lg:text-[3.5rem]">
            Answered honestly
          </h2>
          <div className="section-rule mb-10 w-24" />
          <p className="body-text max-w-2xl text-lg text-ivory/70">
            A few things we get asked often. If yours isn&rsquo;t here, a short
            email works — we answer them personally.
          </p>
        </header>

        <div className="reveal reveal-delay-2 space-y-16">
          {FAQ_CATEGORIES.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <h3 className="label-text mb-8 text-sand/70">
                {category.category}
              </h3>

              <div className="border-t border-sand/10">
                {category.questions.map((faq) => {
                  const isOpen = openQuestions.includes(faq.id);
                  return (
                    <div
                      key={faq.id}
                      className="border-b border-sand/10"
                    >
                      <button
                        onClick={() => toggleQuestion(faq.id)}
                        className="group flex w-full items-start justify-between gap-6 py-6 text-left transition-colors duration-300 hover:text-sand md:py-7"
                      >
                        <span className="body-text text-[1.05rem] text-ivory/85 group-hover:text-warm-white">
                          {faq.question}
                        </span>
                        <svg
                          className={`mt-1.5 h-3 w-3 shrink-0 text-sand/60 transition-transform duration-500 ${
                            isOpen ? "rotate-45" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.25}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      </button>

                      <div
                        className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                          isOpen
                            ? "grid-rows-[1fr] opacity-100"
                            : "grid-rows-[0fr] opacity-0"
                        }`}
                      >
                        <div className="min-h-0">
                          <p className="body-text max-w-xl pb-8 text-ivory/60">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="reveal reveal-delay-3 mt-24 border-t border-sand/10 pt-16 text-center">
          <h3 className="headline-secondary mb-4 text-2xl text-warm-white md:text-3xl">
            Still thinking it over?
          </h3>
          <p className="body-text mx-auto mb-10 max-w-xl text-ivory/60">
            Send us what you&rsquo;re working on — a rough demo, a sketch, or
            just a paragraph about the record you want to make. We&rsquo;ll
            write back.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="mailto:info@lulalakesound.com"
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "h-11 px-7",
              )}
            >
              Email us
            </a>
            <Button
              variant="outline"
              size="lg"
              className="h-11 px-7"
              onClick={() =>
                document
                  .getElementById("artist-inquiries")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Send an inquiry
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
