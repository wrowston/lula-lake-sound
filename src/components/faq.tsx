"use client";

import { useState } from "react";

// FAQ data specifically for musicians and recording studios
const FAQ_CATEGORIES = [
  {
    category: "Studio Sessions & Recording",
    questions: [
      {
        id: 1,
        question: "What should I bring to my recording session?",
        answer: "Bring your instruments, any specific pedals or equipment you want to use, backup cables, and your music (charts, lyrics, demo recordings). We provide all basic cables, microphones, and recording equipment. If you have specific instruments you prefer (like your own snare drum or guitar), feel free to bring them!"
      },
      {
        id: 2,
        question: "Do you provide instruments and amplifiers?",
        answer: "Yes! Please see our gear list for a list of our available instruments and amplifiers."
      },
      {
        id: 3,
        question: "Can I bring my own engineer or producer?",
        answer: "Absolutely! We welcome outside engineers and producers. Our studio engineer will assist with setup and technical support. If you prefer to work solo or with your team, that's perfectly fine too. We're here to support your creative process however works best for you."
      },
      {
        id: 4,
        question: "How far in advance should I book?",
        answer: "We recommend booking 2-4 weeks in advance, especially during busy seasons (spring and fall). However, we often have last-minute availability. Contact us to check our current schedule - sometimes we can accommodate short-notice bookings."
      }
    ]
  },
  {
    category: "Studio Logistics",
    questions: [
      {
        id: 9,
        question: "Is there accommodation nearby?",
        answer: "Yes! We can help arrange lodging for out-of-town artists. Many artists love staying nearby to maintain the creative flow between sessions."
      }
    ]
  }
] as const;

export function FAQ() {
  const [openQuestions, setOpenQuestions] = useState<number[]>([]);

  const toggleQuestion = (questionId: number) => {
    setOpenQuestions(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  return (
    <section id="faq" className="py-20 px-4 bg-washed-black relative">
      <div className="absolute inset-0 opacity-20 bg-texture-stone"></div>
      
      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="headline-primary text-3xl md:text-4xl text-sand mb-6">
            Frequently Asked Questions
          </h2>
          <p className="body-text text-lg text-ivory/80 max-w-3xl mx-auto">
            Everything you need to know about recording at Lula Lake Sound. Don&apos;t see your question? Just ask!
          </p>
        </div>

        <div className="space-y-12">
          {FAQ_CATEGORIES.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <h3 className="headline-secondary text-2xl text-sand mb-8 border-b border-sage/30 pb-4">
                {category.category}
              </h3>
              
              <div className="space-y-4">
                {category.questions.map((faq) => (
                  <div key={faq.id} className="border border-sage/30 rounded-sm overflow-hidden">
                    <button
                      onClick={() => toggleQuestion(faq.id)}
                      className="w-full px-6 py-4 text-left bg-forest/20 hover:bg-forest/30 transition-colors flex items-center justify-between"
                    >
                      <span className="body-text text-ivory text-lg">
                        {faq.question}
                      </span>
                      <svg 
                        className={`w-5 h-5 text-sand transition-transform ${
                          openQuestions.includes(faq.id) ? 'rotate-180' : ''
                        }`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {openQuestions.includes(faq.id) && (
                      <div className="px-6 py-6 bg-sage/5">
                        <p className="body-text text-ivory/80">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-16 text-center bg-sage/10 border border-sage/30 rounded-sm p-8">
          <h3 className="headline-secondary text-2xl text-sand mb-4">
            Still Have Questions?
          </h3>
          <p className="body-text text-ivory/70 mb-6 max-w-2xl mx-auto">
            We&apos;re here to help make your recording experience perfect. Reach out with any questions about our studio, services, or your specific project needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:info@lulalakesound.com"
              className="body-text px-6 py-3 bg-sand text-washed-black hover:bg-sand/90 transition-colors"
            >
              Email Us Directly
            </a>
            <button
              onClick={() => document.getElementById('artist-inquiries')?.scrollIntoView({ behavior: 'smooth' })}
              className="body-text px-6 py-3 border-2 border-sand text-sand hover:bg-sand hover:text-washed-black transition-colors"
            >
              Send Project Inquiry
            </button>
          </div>
        </div>
      </div>
    </section>
  );
} 