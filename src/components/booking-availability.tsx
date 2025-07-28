"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

// Mock availability data - in real implementation, this would come from a booking system
const AVAILABILITY_MONTHS = [
  {
    month: "January 2024",
    dates: [
      { date: 15, available: true, type: "full" },
      { date: 16, available: true, type: "partial" },
      { date: 22, available: true, type: "full" },
      { date: 23, available: true, type: "full" },
      { date: 29, available: true, type: "partial" }
    ]
  }
] as const;

const BOOKING_STEPS = [
  {
    step: 1,
    title: "Choose Your Dates",
    description: "Select available dates that work for your project timeline"
  },
  {
    step: 2,
    title: "Select Services",
    description: "Pick the recording package that fits your needs"
  },
  {
    step: 3,
    title: "Confirm Details",
    description: "Review your booking and provide project information"
  }
] as const;

export function BookingAvailability() {
  const [selectedDate, setSelectedDate] = useState<number | null>(null);

  return (
    <section id="booking-availability" className="py-20 px-4 bg-forest relative">
      <div className="absolute inset-0 opacity-20 bg-texture-stone"></div>
      
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-sand mb-6 tracking-wide font-acumin">
            BOOK YOUR SESSION
          </h2>
          <p className="text-lg text-ivory/80 font-titillium max-w-3xl mx-auto leading-relaxed">
            Ready to bring your musical vision to life? Check our availability and book your recording session at Lula Lake Sound.
          </p>
        </div>

        {/* Booking Process Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {BOOKING_STEPS.map((step) => (
            <div key={step.step} className="text-center">
              <div className={`w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center font-acumin font-bold ${
                1 >= step.step ? 'bg-sand text-washed-black' : 'bg-sage/20 text-sage'
              }`}>
                {step.step}
              </div>
              <h3 className="text-sand font-acumin font-bold text-lg mb-2">{step.title}</h3>
              <p className="text-ivory/70 font-titillium text-sm">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Calendar/Availability */}
          <div className="bg-washed-black/60 border border-sage/30 rounded-sm p-8">
            <h3 className="text-2xl font-bold text-sand mb-6 font-acumin">AVAILABLE DATES</h3>
            
            {/* Month View */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-ivory font-acumin font-bold">January 2024</h4>
                <div className="flex space-x-2">
                  <button className="p-2 text-sand hover:bg-sand/10 rounded">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button className="p-2 text-sand hover:bg-sand/10 rounded">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-ivory/50 font-titillium text-xs py-2">
                    {day}
                  </div>
                ))}
                
                {/* Calendar dates - simplified for demo */}
                {Array.from({ length: 31 }, (_, i) => {
                  const date = i + 1;
                  const availableDate = AVAILABILITY_MONTHS[0].dates.find(d => d.date === date);
                  const isSelected = selectedDate === date;
                  
                  return (
                    <button
                      key={date}
                      onClick={() => availableDate && setSelectedDate(date)}
                      className={`p-2 text-sm rounded transition-colors ${
                        availableDate
                          ? isSelected
                            ? 'bg-sand text-washed-black font-bold'
                            : availableDate.type === 'full'
                              ? 'bg-sage/30 text-sand hover:bg-sage/50'
                              : 'bg-rust/30 text-ivory hover:bg-rust/50'
                          : 'text-ivory/30 cursor-not-allowed'
                      }`}
                      disabled={!availableDate}
                    >
                      {date}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-sage/30 rounded"></div>
                <span className="text-ivory/70 font-titillium text-sm">Full day available</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-rust/30 rounded"></div>
                <span className="text-ivory/70 font-titillium text-sm">Partial availability</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-sand rounded"></div>
                <span className="text-ivory/70 font-titillium text-sm">Selected</span>
              </div>
            </div>
          </div>

          {/* Booking Information */}
          <div className="space-y-8">
            {/* Quick Booking Options */}
            <div className="bg-sage/10 border border-sage/30 rounded-sm p-6">
              <h3 className="text-xl font-bold text-sand mb-4 font-acumin">QUICK BOOKING</h3>
              <p className="text-ivory/70 font-titillium text-sm mb-6">
                Need to book immediately? Choose from our most popular packages:
              </p>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-between"
                  onClick={() => document.getElementById('artist-inquiries')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <span>Single Day Recording</span>
                  <span>$400</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-between"
                  onClick={() => document.getElementById('artist-inquiries')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <span>3-Day Album Package</span>
                  <span>$1,200</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-between"
                  onClick={() => document.getElementById('artist-inquiries')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <span>Mixing & Mastering</span>
                  <span>$150/song</span>
                </Button>
              </div>
            </div>

            {/* Contact for Booking */}
            <div className="bg-washed-black/40 border border-sage/30 rounded-sm p-6">
              <h3 className="text-xl font-bold text-sand mb-4 font-acumin">READY TO BOOK?</h3>
              <p className="text-ivory/70 font-titillium text-sm mb-6">
                Get started with your project by reaching out to discuss your needs and confirm availability.
              </p>
              <div className="space-y-4">
                <Button 
                  variant="primary" 
                  className="w-full"
                  onClick={() => document.getElementById('artist-inquiries')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  START PROJECT INQUIRY
                </Button>
                <div className="text-center">
                  <p className="text-ivory/60 font-titillium text-sm mb-2">Or contact us directly:</p>
                  <a 
                    href="mailto:lulalakesound@gmail.com" 
                    className="text-sand hover:text-ivory transition-colors font-acumin font-medium"
                  >
                    lulalakesound@gmail.com
                  </a>
                </div>
              </div>
            </div>

            {/* Booking Requirements */}
            <div className="bg-forest/20 border border-sage/30 rounded-sm p-6">
              <h3 className="text-lg font-bold text-sand mb-4 font-acumin">BOOKING REQUIREMENTS</h3>
              <ul className="space-y-2 text-ivory/70 font-titillium text-sm">
                <li className="flex items-start space-x-2">
                  <span className="text-sand mt-1">•</span>
                  <span>50% deposit required to secure booking</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-sand mt-1">•</span>
                  <span>24-hour cancellation policy</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-sand mt-1">•</span>
                  <span>Pre-production consultation included</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-sand mt-1">•</span>
                  <span>Flexible payment options available</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 