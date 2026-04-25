import React from 'react';
import LandingNavbar from '@/components/landing/LandingNavbar';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import LearningModesSection from '@/components/landing/LearningModesSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import CTASection from '@/components/landing/CTASection';
import Footer from '@/components/landing/Footer';
import AIRobotDisplay from '@/components/landing/AIRobotDisplay';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0f2c] text-white scroll-smooth selection:bg-blue-500/30">
      {/* Modern Navigation */}
      <LandingNavbar />

      <main>
        {/* Modern SaaS Hero Section */}
        <HeroSection />

        {/* Professional Features Section */}
        <FeaturesSection />

        {/* AI Video Lectures Section */}
        <LearningModesSection />

        {/* How It Works Section */}
        <HowItWorksSection />

        {/* Call-to-Action Section */}
        <CTASection />
      </main>

      {/* Professional Footer */}
      <Footer />

      {/* Animated Robot Tutor Display */}
      <AIRobotDisplay />
    </div>
  );
}





