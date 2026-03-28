import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Navigation } from './components/Navigation';
import { CustomCursor } from './components/CustomCursor';
import { ParticleField } from './components/ParticleField';
import { Hero } from './sections/Hero';
import { About } from './sections/About';
import { Works } from './sections/Works';
import { Services } from './sections/Services';
import { FAQ } from './sections/FAQ';
import { Testimonials } from './sections/Testimonials';
import { Pricing } from './sections/Pricing';
import { Blog } from './sections/Blog';
import { Contact } from './sections/Contact';
import { Footer } from './sections/Footer';
import { siteConfig } from './config';

gsap.registerPlugin(ScrollTrigger);

function App() {
  useEffect(() => {
    if (siteConfig.title) {
      document.title = siteConfig.title;
    }
    if (siteConfig.language) {
      document.documentElement.lang = siteConfig.language;
    }

    // Refresh ScrollTrigger after initial render
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-black text-white overflow-x-hidden">
      {/* Noise texture overlay */}
      <div className="noise-overlay" />

      {/* Custom cursor */}
      <CustomCursor />

      {/* Particle field */}
      <ParticleField />

      {/* Navigation */}
      <Navigation />

      {/* Main content */}
      <main>
        <Hero />
        <About />
        <Works />
        <Services />
        <FAQ />
        <Testimonials />
        <Pricing />
        <Blog />
        <Contact />
        <Footer />
      </main>
    </div>
  );
}

export default App;
