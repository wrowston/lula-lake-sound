"use client";

import Image from "next/image";

import { MotionReveal, MotionRevealGroup } from "@/components/motion-reveal";
import { PublicSectionNotice } from "@/components/public-section-notice";
import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PUBLIC_CONVEX_QUERY_FAILED } from "@/lib/use-public-convex-query";

export type FaqQuestionProps = {
  stableId: string;
  question: string;
  answer: string;
};

export type FaqCategoryProps = {
  stableId: string;
  title: string;
  questions: FaqQuestionProps[];
};

export type FaqProps = {
  categories?:
    | readonly FaqCategoryProps[]
    | null
    | undefined
    | typeof PUBLIC_CONVEX_QUERY_FAILED;
};

export function FAQ({ categories }: FaqProps) {
  const isLoading = categories === undefined;
  const isUnavailable = categories === PUBLIC_CONVEX_QUERY_FAILED;
  const categoriesResolved =
    categories === undefined ||
    categories === PUBLIC_CONVEX_QUERY_FAILED ||
    categories === null
      ? []
      : categories;
  const isEmptyPublished =
    !isLoading && !isUnavailable && categoriesResolved.length === 0;

  return (
    <section
      id="faq"
      className="relative overflow-hidden bg-washed-black px-6 py-28 md:py-40"
    >
      <div className="absolute inset-0 bg-texture-stone opacity-12" />
      {/* Chladni 3 uses screen blend; keep it very low so type stays crisp.
       * Drifts via `.parallax-soft` for a slow editorial breath. */}
      <div
        aria-hidden
        className="parallax-soft absolute inset-0 bg-chladni-3 !opacity-[0.07]"
      />

      <div className="relative z-10 mx-auto max-w-3xl">
        <div className="mb-20 flex w-full flex-col items-center text-center">
          <MotionReveal variant="fade" duration={0.7}>
            <Image
              src="/Logos/Graphic/LLS_Logo_Graphic_Sand.png"
              alt=""
              width={200}
              height={200}
              aria-hidden
              className="mb-10 h-12 w-auto opacity-80 md:h-14"
            />
          </MotionReveal>
          <MotionReveal variant="rise" delay={0.05}>
            <p className="eyebrow mb-6 text-sand/82">Support</p>
          </MotionReveal>
          <MotionReveal variant="rise-blur" duration={1.1} delay={0.12}>
            <h2 className="headline-primary mb-8 text-[2.25rem] text-warm-white md:text-[3rem] lg:text-[3.5rem]">
              Frequently Asked
            </h2>
          </MotionReveal>
          <MotionReveal variant="rule" duration={1} delay={0.32}>
            <span className="section-rule mx-auto mb-10 block max-w-[9rem]" />
          </MotionReveal>
          <MotionReveal variant="rise" duration={0.95} delay={0.42}>
            <p className="editorial-lede mx-auto max-w-2xl font-normal text-ivory/92">
              Everything you need to know about recording at Lula Lake Sound.
              Don&apos;t see your question? Just ask.
            </p>
          </MotionReveal>
        </div>

        {isLoading ? (
          <div className="space-y-10">
            <div className="h-12 animate-pulse rounded-md bg-warm-white/5" />
            <div className="h-12 animate-pulse rounded-md bg-warm-white/5" />
            <div className="h-12 animate-pulse rounded-md bg-warm-white/5" />
          </div>
        ) : isUnavailable ? (
          <MotionReveal variant="rise">
            <PublicSectionNotice title="Unable to load FAQs">
              We couldn&rsquo;t load questions and answers right now. Try again
              in a moment, or reach out using the links below.
            </PublicSectionNotice>
          </MotionReveal>
        ) : isEmptyPublished ? (
          <MotionReveal variant="rise">
            <PublicSectionNotice title="Questions coming soon">
              Answers for booking, sessions, and the studio will appear here
              when they are published.
            </PublicSectionNotice>
          </MotionReveal>
        ) : (
          <MotionRevealGroup stagger={0.12} className="space-y-16">
            {categoriesResolved.map((category) => (
              <MotionReveal
                key={category.stableId}
                variant="rise-blur"
                duration={0.95}
              >
                <h3 className="eyebrow mb-8 border-b border-sand/22 pb-4 text-sand">
                  {category.title}
                </h3>

                <Accordion multiple>
                  {category.questions.map((faq) => (
                    <AccordionItem key={faq.stableId} value={faq.stableId}>
                      <AccordionTrigger>
                        <span className="body-text text-base text-warm-white">
                          {faq.question}
                        </span>
                      </AccordionTrigger>
                      <AccordionPanel>
                        <p className="body-text text-ivory/84">{faq.answer}</p>
                      </AccordionPanel>
                    </AccordionItem>
                  ))}
                </Accordion>
              </MotionReveal>
            ))}
          </MotionRevealGroup>
        )}

        <MotionReveal
          variant="rise-blur"
          duration={1}
          className="mt-24 border-t border-sand/15 pt-16 text-center"
        >
          <p className="eyebrow mb-5 text-sand/78">Contact</p>
          <h3 className="headline-secondary mb-6 text-2xl text-warm-white md:text-[1.75rem]">
            Still Have Questions?
          </h3>
          <p className="body-text mx-auto mb-10 max-w-xl text-ivory/84">
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
        </MotionReveal>
      </div>
      {/* Cinematic seam into the charcoal-grounded contact section. */}
      <div aria-hidden className="section-fade-bottom section-fade-bottom--charcoal" />
    </section>
  );
}
