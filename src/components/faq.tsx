"use client";

import { useState } from "react";

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
  const [openQuestions, setOpenQuestions] = useState<number[]>([]);

  const toggleQuestion = (questionId: number) => {
    setOpenQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  return (
    <section id="faq" className="py-24 md:py-32 px-6 bg-washed-black relative">
      <div className="absolute inset-0 opacity-20 bg-texture-stone" />

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16 reveal">
          <p className="label-text text-sand/60 mb-4">Support</p>
          <h2 className="headline-primary text-3xl md:text-4xl lg:text-5xl text-warm-white mb-6">
            Frequently Asked Questions
          </h2>
          <div className="section-rule max-w-xs mx-auto mb-8" />
          <p className="body-text text-lg text-ivory/60 max-w-2xl mx-auto">
            Everything you need to know about recording at Lula Lake Sound.
            Don&apos;t see your question? Just ask.
          </p>
        </div>

        {/* FAQ sections */}
        <div className="space-y-12 reveal reveal-delay-2">
          {FAQ_CATEGORIES.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <h3 className="label-text text-sand mb-6 pb-3 border-b border-sand/10">
                {category.category}
              </h3>

              <div className="space-y-px">
                {category.questions.map((faq) => {
                  const isOpen = openQuestions.includes(faq.id);
                  return (
                    <div key={faq.id} className="border-b border-sand/8">
                      <button
                        onClick={() => toggleQuestion(faq.id)}
                        className="w-full py-5 text-left flex items-start justify-between gap-4 group"
                      >
                        <span className="body-text text-ivory/80 group-hover:text-warm-white transition-colors">
                          {faq.question}
                        </span>
                        <svg
                          className={`w-4 h-4 text-sand/40 shrink-0 mt-1 transition-transform duration-300 ${
                            isOpen ? "rotate-45" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      </button>

                      <div
                        className={`overflow-hidden transition-all duration-500 ease-out ${
                          isOpen ? "max-h-96 opacity-100 pb-6" : "max-h-0 opacity-0"
                        }`}
                      >
                        <p className="body-text text-ivory/50 pl-0 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-16 text-center reveal reveal-delay-3 pt-12 border-t border-sand/10">
          <h3 className="headline-secondary text-2xl text-sand mb-4">
            Still Have Questions?
          </h3>
          <p className="body-text text-ivory/50 mb-8 max-w-xl mx-auto">
            We&apos;re here to help make your recording experience perfect.
            Reach out with any questions about our studio, services, or your project needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:info@lulalakesound.com"
              className="label-text inline-flex items-center justify-center px-7 py-3 bg-sand text-washed-black hover:bg-warm-white transition-colors duration-300"
            >
              Email Us
            </a>
            <button
              onClick={() =>
                document.getElementById("artist-inquiries")?.scrollIntoView({ behavior: "smooth" })
              }
              className="label-text inline-flex items-center justify-center px-7 py-3 border border-sand/40 text-sand hover:bg-sand/10 hover:border-sand/60 transition-all duration-300"
            >
              Send Inquiry
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
