import React from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/sections/Hero';
import Mission from '@/components/sections/Mission';
import Problem from '@/components/sections/Problem';
import HowItWorks from '@/components/sections/HowItWorks';
import UseCases from '@/components/sections/UseCases';
import CallToAction from '@/components/sections/CallToAction';
import Footer from '@/components/sections/Footer';

export default function Home() {
  return (
    <div className="overflow-x-hidden">
      <Navbar />
      <Hero />
      <Mission />
      <Problem />
      <HowItWorks />
      <UseCases />
      <CallToAction />
      <Footer />
    </div>
  );
}