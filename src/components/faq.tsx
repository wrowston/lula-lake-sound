"use client";

import Image from "next/image";

import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FAQ_CATEGORIES = [
  {
    category: "Studio Sessions & Recording",
    questions: [
      {
        id: 1,
        question: "What should I bring to my recording session?",
        answer:
          "Bring your instruments, any specific pedals or equipment you want to use, backup cables, and your music (charts, lyrics, demo recordings). We provide all basic cables, microphones, and recording equipment. If you have specific instruments you prefer (like your own snare drum or guitar), feel free to bring them!",
      },
      {
        id: 2,
        question: "Do you provide instruments and amplifiers?",
        answer:
          "Yes! Please see our gear list for a list of our available instruments and amplifiers.",
      },
      {
        id: 3,
        question: "Can I bring my own engineer or producer?",
        answer:
          "Absolutely! We welcome outside engineers and producers. Our studio engineer will assist with setup and technical support. If you prefer to work solo or with your team, that's perfectly fine too. We're here to support your creative process however works best for you.",
      },
      {
        id: 4,
        question: "How far in advance should I book?",
        answer:
          "We recommend booking 2-4 weeks in advance, especially during busy seasons (spring and fall). However, we often have last-minute availability. Contact us to check our current schedule - sometimes we can accommodate short-notice bookings.",
      },
    ],
  },
  {
    category: "Studio Logistics",
    questions: [
      {
        id: 9,
        question: "Is there accommodation nearby?",
        answer:
          "Yes! We can help arrange lodging for out-of-town artists. Many artists love staying nearby to maintain the creative flow between sessions.",
      },
    ],
  },
] as const;

export function FAQ() {
  return (
    <section
      id="faq"
      className="relative overflow-hidden bg-charcoal px-6 py-28 md:py-40"
    >
      {/* Seafoam ink-wash gives the FAQ its "quieter room" temperature. */}
      <div className="absolute inset-0 bg-texture-seafoam opacity-[0.04]" />
      <div className="absolute inset-0 bg-texture-stone opacity-20" />
      {/* Chladni 3 soft-pulse at the right edge — used as rhythm per
       * brand guide §5.2. */}
      <div aria-hidden className="absolute inset-0 bg-chladni-3" />

      <div className="relative z-10 mx-auto max-w-3xl">
        <div className="reveal mb-20 flex w-full flex-col items-center text-center">
          <Image
            src="/Logos/Graphic/LLS_Logo_Graphic_Sand.png"
            alt=""
            width={200}
            height={200}
            aria-hidden
            className="mb-10 h-12 w-auto opacity-80 md:h-14"
          />
          <p className="eyebrow mb-6 text-sand/60">Support</p>
          <h2 className="headline-primary mb-8 text-[2.25rem] text-warm-white md:text-[3rem] lg:text-[3.5rem]">
            Frequently Asked
          </h2>
          <div className="section-rule mx-auto mb-10 max-w-[9rem]" />
          <p className="editorial-lede mx-auto max-w-2xl">
            Everything you need to know about recording at Lula Lake Sound.
            Don&apos;t see your question? Just ask.
          </p>
        </div>

        <div className="reveal reveal-delay-2 space-y-16">
          {FAQ_CATEGORIES.map((category) => (
            <div key={category.category}>
              <h3 className="eyebrow mb-8 border-b border-sand/15 pb-4 text-sand">
                {category.category}
              </h3>

              <Accordion multiple>
                {category.questions.map((faq) => (
                  <AccordionItem key={faq.id} value={String(faq.id)}>
                    <AccordionTrigger>
                      <span className="body-text text-base text-ivory/85">
                        {faq.question}
                      </span>
                    </AccordionTrigger>
                    <AccordionPanel>
                      <p className="body-text text-ivory/55">{faq.answer}</p>
                    </AccordionPanel>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        <div className="reveal reveal-delay-3 mt-24 border-t border-sand/10 pt-16 text-center">
          <p className="eyebrow mb-5 text-sand/55">Contact</p>
          <h3 className="headline-secondary mb-6 text-2xl text-sand md:text-[1.75rem]">
            Still Have Questions?
          </h3>
          <p className="body-text mx-auto mb-10 max-w-xl text-ivory/55">
            We&apos;re here to help make your recording experience perfect.
            Reach out with any questions about our studio, services, or your
            project needs.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="mailto:info@lulalakesound.com"
              className={cn(buttonVariants({ variant: "default", size: "lg" }))}
            >
              Email Us
            </a>
            <Button
              variant="ghost"
              size="lg"
              onClick={() =>
                document
                  .getElementById("artist-inquiries")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Send Inquiry
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
