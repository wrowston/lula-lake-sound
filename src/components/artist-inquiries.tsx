"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ArtistInquiries() {
  const [formData, setFormData] = useState({
    artistName: "",
    contactName: "",
    email: "",
    phone: "",
    message: "",
    website: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistName: formData.artistName,
          contactName: formData.contactName,
          email: formData.email,
          phone: formData.phone || undefined,
          message: formData.message,
          website: formData.website,
        }),
      });

      let data: { success?: boolean; message?: string } = {};
      try {
        data = (await response.json()) as { success?: boolean; message?: string };
      } catch {
        setSubmitStatus("error");
        setErrorMessage("Something went wrong. Please try again.");
        return;
      }

      if (!response.ok) {
        setSubmitStatus("error");
        setErrorMessage(data?.message || "Failed to send your inquiry. Please try again.");
        return;
      }

      if (data?.success) {
        setSubmitStatus("success");
        setFormData({
          artistName: "",
          contactName: "",
          email: "",
          phone: "",
          message: "",
          website: "",
        });
      } else {
        setSubmitStatus("error");
        setErrorMessage(data?.message || "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Submission error:", error);
      setSubmitStatus("error");
      setErrorMessage("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses =
    "body-text w-full px-0 py-3 bg-transparent border-0 border-b border-sand/20 text-warm-white placeholder-ivory/25 focus:border-sand focus:outline-none transition-colors duration-300";

  return (
    <section id="artist-inquiries" className="py-24 md:py-32 px-6 bg-charcoal relative">
      <div className="absolute inset-0 opacity-20 bg-texture-ink-wash" />

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 reveal">
          <div className="mb-6">
            <Image
              src="/LLS_Logo_Full_Tar.png"
              alt="Lula Lake Sound Symbol"
              width={48}
              height={48}
              className="mx-auto filter invert opacity-40"
            />
          </div>

          <p className="label-text text-sand/60 mb-4">Contact</p>
          <h2 className="headline-primary text-3xl md:text-4xl lg:text-5xl text-warm-white mb-6">
            Artist Inquiries
          </h2>
          <div className="section-rule max-w-xs mx-auto mb-8" />
          <p className="body-text text-lg text-ivory/50 max-w-xl mx-auto">
            Ready to create something meaningful? Share your project details below
            and we&apos;ll get back to you to discuss how we can serve your artistic vision.
          </p>
        </div>

        {/* Contact Form */}
        <div className="max-w-xl mx-auto reveal reveal-delay-2">
          <form onSubmit={handleSubmit} className="relative space-y-8">
            {/* Artist/Band Name & Contact Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label htmlFor="artistName" className="block label-text text-sand/60 mb-3">
                  Artist / Band Name *
                </label>
                <input
                  type="text"
                  id="artistName"
                  name="artistName"
                  required
                  value={formData.artistName}
                  onChange={handleInputChange}
                  className={inputClasses}
                  placeholder="Your artist or band name"
                />
              </div>
              <div>
                <label htmlFor="contactName" className="block label-text text-sand/60 mb-3">
                  Contact Name *
                </label>
                <input
                  type="text"
                  id="contactName"
                  name="contactName"
                  required
                  value={formData.contactName}
                  onChange={handleInputChange}
                  className={inputClasses}
                  placeholder="Your full name"
                />
              </div>
            </div>

            {/* Email and Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label htmlFor="email" className="block label-text text-sand/60 mb-3">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className={inputClasses}
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block label-text text-sand/60 mb-3">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={inputClasses}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            {/* Honeypot — leave empty (bots often fill hidden fields) */}
            <div className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
              <label htmlFor="website">Do not fill this out</label>
              <input
                type="text"
                id="website"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={formData.website}
                onChange={handleInputChange}
              />
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block label-text text-sand/60 mb-3">
                Tell Us About Your Project *
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={5}
                value={formData.message}
                onChange={handleInputChange}
                className={`${inputClasses} resize-none`}
                placeholder="Describe your musical style, project goals, what you're looking for from the studio experience..."
              />
            </div>

            {/* Submit Status */}
            {submitStatus === "success" && (
              <div className="p-6 border border-sand/20 bg-sand/5">
                <p className="body-text text-sand text-center">
                  Thank you! Your inquiry has been sent. We&apos;ll get back to you soon.
                </p>
              </div>
            )}

            {submitStatus === "error" && (
              <div className="p-6 border border-fire/20 bg-fire/5">
                <p className="body-text text-ivory text-center mb-2">{errorMessage}</p>
                <p className="body-text-small text-ivory/50 text-center">
                  If the problem persists, please email us directly at{" "}
                  <a href="mailto:info@lulalakesound.com" className="text-sand hover:underline">
                    info@lulalakesound.com
                  </a>
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="text-center pt-4">
              <Button
                type="submit"
                variant="default"
                size="lg"
                className="h-10 px-8"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending…" : "Send Inquiry"}
              </Button>
            </div>
          </form>

          {/* Alternative Contact */}
          <div className="mt-16 pt-8 border-t border-sand/10 text-center">
            <p className="body-text-small text-ivory/30 mb-3">Prefer to reach out directly?</p>
            <a
              href="mailto:info@lulalakesound.com"
              className="headline-secondary text-sand hover:text-warm-white transition-colors duration-300"
            >
              info@lulalakesound.com
            </a>
            <p className="body-text-small text-ivory/30 mt-3">Chattanooga, Tennessee</p>
          </div>
        </div>
      </div>
    </section>
  );
}
