"use client";

import Image from "next/image";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export function ArtistInquiries() {
  const [formData, setFormData] = useState({
    artistName: '',
    contactName: '',
    email: '',
    phone: '',
    projectType: '',
    budget: '',
    timeline: '',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      // Call the Supabase edge function
      const { data, error } = await supabase.functions.invoke('send-contact-email', {
        body: {
          artistName: formData.artistName,
          contactName: formData.contactName,
          email: formData.email,
          phone: formData.phone || undefined,
          projectType: formData.projectType,
          budget: formData.budget || undefined,
          timeline: formData.timeline || undefined,
          message: formData.message,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        setSubmitStatus('error');
        setErrorMessage(error.message || 'Failed to send your inquiry. Please try again.');
        return;
      }

      if (data?.success) {
        setSubmitStatus('success');
        // Reset form after successful submission
        setFormData({
          artistName: '',
          contactName: '',
          email: '',
          phone: '',
          projectType: '',
          budget: '',
          timeline: '',
          message: ''
        });
      } else {
        setSubmitStatus('error');
        setErrorMessage(data?.message || 'Something went wrong. Please try again.');
      }

    } catch (error) {
      console.error('Submission error:', error);
      setSubmitStatus('error');
      setErrorMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="artist-inquiries" className="py-20 px-4 bg-washed-black relative">
      <div className="absolute inset-0 opacity-20 bg-texture-stone"></div>
      
      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="mb-8">
            <Image
              src="/LLS_Logo_Full_Tar.png"
              alt="Lula Lake Sound Symbol"
              width={64}
              height={64}
              className="mx-auto filter invert"
            />
          </div>
          
          <h2 className="headline-primary text-3xl md:text-4xl text-sand mb-8">
            Artist Inquiries
          </h2>
          
          <p className="body-text text-lg text-ivory/80 max-w-2xl mx-auto">
            Ready to create something meaningful? Share your project details below and we&apos;ll get back to you to discuss how Lula Lake Sound can serve your artistic vision.
          </p>
        </div>

        {/* Contact Form */}
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Artist/Band Name & Contact Name Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="artistName" className="block headline-secondary text-sm text-sand mb-3">
                  Artist/Band Name *
                </label>
                <input
                  type="text"
                  id="artistName"
                  name="artistName"
                  required
                  value={formData.artistName}
                  onChange={handleInputChange}
                  className="body-text w-full px-0 py-3 bg-transparent border-0 border-b-2 border-sage/40 text-ivory placeholder-ivory/50 focus:border-sand focus:outline-none transition-colors"
                  placeholder="Your artist or band name"
                />
              </div>

              <div>
                <label htmlFor="contactName" className="block headline-secondary text-sm text-sand mb-3">
                  Contact Name *
                </label>
                <input
                  type="text"
                  id="contactName"
                  name="contactName"
                  required
                  value={formData.contactName}
                  onChange={handleInputChange}
                  className="body-text w-full px-0 py-3 bg-transparent border-0 border-b-2 border-sage/40 text-ivory placeholder-ivory/50 focus:border-sand focus:outline-none transition-colors"
                  placeholder="Your full name"
                />
              </div>
            </div>

            {/* Email and Phone Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="email" className="block headline-secondary text-sm text-sand mb-3">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="body-text w-full px-0 py-3 bg-transparent border-0 border-b-2 border-sage/40 text-ivory placeholder-ivory/50 focus:border-sand focus:outline-none transition-colors"
                  placeholder="your@email.com"
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block headline-secondary text-sm text-sand mb-3">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="body-text w-full px-0 py-3 bg-transparent border-0 border-b-2 border-sage/40 text-ivory placeholder-ivory/50 focus:border-sand focus:outline-none transition-colors"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            {/* Project Type */}
            <div>
              <label htmlFor="projectType" className="block headline-secondary text-sm text-sand mb-3">
                Project Type *
              </label>
              <select
                id="projectType"
                name="projectType"
                required
                value={formData.projectType}
                onChange={handleInputChange}
                className="body-text w-full px-0 py-3 bg-transparent border-0 border-b-2 border-sage/40 text-ivory focus:border-sand focus:outline-none transition-colors"
              >
                <option value="" className="bg-washed-black text-ivory">Select project type</option>
                <option value="album" className="bg-washed-black text-ivory">Full Album</option>
                <option value="ep" className="bg-washed-black text-ivory">EP</option>
                <option value="single" className="bg-washed-black text-ivory">Single</option>
                <option value="demo" className="bg-washed-black text-ivory">Demo</option>
                <option value="mixing" className="bg-washed-black text-ivory">Mixing Only</option>
                <option value="mastering" className="bg-washed-black text-ivory">Mastering Only</option>
                <option value="production" className="bg-washed-black text-ivory">Production</option>
                <option value="other" className="bg-washed-black text-ivory">Other</option>
              </select>
            </div>

            {/* Budget and Timeline Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="budget" className="block headline-secondary text-sm text-sand mb-3">
                  Budget Range
                </label>
                <select
                  id="budget"
                  name="budget"
                  value={formData.budget}
                  onChange={handleInputChange}
                  className="body-text w-full px-0 py-3 bg-transparent border-0 border-b-2 border-sage/40 text-ivory focus:border-sand focus:outline-none transition-colors"
                >
                  <option value="" className="bg-washed-black text-ivory">Prefer to discuss</option>
                  <option value="under-1k" className="bg-washed-black text-ivory">Under $1,000</option>
                  <option value="1k-3k" className="bg-washed-black text-ivory">$1,000 - $3,000</option>
                  <option value="3k-5k" className="bg-washed-black text-ivory">$3,000 - $5,000</option>
                  <option value="5k-10k" className="bg-washed-black text-ivory">$5,000 - $10,000</option>
                  <option value="over-10k" className="bg-washed-black text-ivory">$10,000+</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="timeline" className="block headline-secondary text-sm text-sand mb-3">
                  Desired Timeline
                </label>
                <select
                  id="timeline"
                  name="timeline"
                  value={formData.timeline}
                  onChange={handleInputChange}
                  className="body-text w-full px-0 py-3 bg-transparent border-0 border-b-2 border-sage/40 text-ivory focus:border-sand focus:outline-none transition-colors"
                >
                  <option value="" className="bg-washed-black text-ivory">Flexible</option>
                  <option value="asap" className="bg-washed-black text-ivory">ASAP</option>
                  <option value="1-month" className="bg-washed-black text-ivory">Within 1 month</option>
                  <option value="2-3-months" className="bg-washed-black text-ivory">2-3 months</option>
                  <option value="3-6-months" className="bg-washed-black text-ivory">3-6 months</option>
                  <option value="6-months-plus" className="bg-washed-black text-ivory">6+ months</option>
                </select>
              </div>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block headline-secondary text-sm text-sand mb-3">
                Tell Us About Your Project *
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={6}
                value={formData.message}
                onChange={handleInputChange}
                className="body-text w-full px-0 py-3 bg-transparent border-0 border-b-2 border-sage/40 text-ivory placeholder-ivory/50 focus:border-sand focus:outline-none transition-colors resize-none"
                placeholder="Describe your musical style, project goals, what you're looking for from the studio experience, any specific requirements, or questions you have..."
              />
            </div>

            {/* Submit Status Messages */}
            {submitStatus === 'success' && (
              <div className="p-6 bg-forest/60 border border-sand/30 rounded-sm">
                <p className="body-text text-sand text-center">
                  Thank you! Your inquiry has been sent successfully. We&apos;ll get back to you soon via email.
                </p>
              </div>
            )}
            
            {submitStatus === 'error' && (
              <div className="p-6 bg-rust/40 border border-fire/30 rounded-sm">
                <p className="body-text text-ivory text-center mb-2">
                  {errorMessage}
                </p>
                <p className="body-text-small text-ivory/70 text-center">
                  If the problem persists, please email us directly at{' '}
                  <a href="mailto:info@lulalakesound.com" className="text-sand hover:underline">
                    info@lulalakesound.com
                  </a>
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="text-center pt-8">
              <button
                type="submit"
                disabled={isSubmitting}
                className="body-text px-12 py-4 bg-transparent border-2 border-sand text-sand hover:bg-sand hover:text-washed-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending...' : 'Send Inquiry'}
              </button>
            </div>
          </form>

          {/* Alternative Contact Info */}
          <div className="mt-16 pt-8 border-t border-sage/30 text-center">
            <p className="body-text-small text-ivory/60 mb-4">
              Prefer to reach out directly?
            </p>
            <p className="headline-secondary text-sand mb-2">
              <a href="mailto:info@lulalakesound.com" className="hover:text-ivory transition-colors">
                info@lulalakesound.com
              </a>
            </p>
            <p className="body-text-small text-ivory/60">
              Chattanooga, Tennessee
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
