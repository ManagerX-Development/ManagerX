import { Navbar } from "../components/layout/Navbar";
import { Hero } from "../components/landing/Hero";
import { Features } from "../components/landing/Features";
import { Testimonials } from "../components/landing/Testimonials";
import { FAQ } from "../components/landing/FAQ";
import { CTA } from "../components/landing/CTA";
import { Footer } from "../components/layout/Footer";
import { SEO } from "../components/layout/SEO";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="ManagerX - Discord Bot"
        description="ManagerX - Moderation, Levelsystem, Globalchat und mehr für deinen Discord Server. Entdecke die Power der nächsten Generation."
      />
      <Navbar />
      <Hero />
      <Features />
      <Testimonials />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
};

export default Index;
