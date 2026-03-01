import { Navbar } from "../components/Navbar";
import { Hero } from "../components/Hero";
import { Features } from "../components/Features";
import { Testimonials } from "../components/Testimonials";
import { FAQ } from "../components/FAQ";
import { CTA } from "../components/CTA";
import { Footer } from "../components/Footer";
import { SEO } from "../components/SEO";

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
