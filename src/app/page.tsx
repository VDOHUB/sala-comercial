import { Navbar }         from "@/components/landing/Navbar";
import { Hero }           from "@/components/landing/Hero";
import { Features }       from "@/components/landing/Features";
import { Plans }          from "@/components/landing/Plans";
import { Gallery }        from "@/components/landing/Gallery";
import { HowItWorks }     from "@/components/landing/HowItWorks";
import { Faq }            from "@/components/landing/Faq";
import { BookingSection } from "@/components/landing/BookingSection";
import { Footer }         from "@/components/landing/Footer";
import { WhatsAppButton } from "@/components/landing/WhatsAppButton";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Plans />
        <Gallery />
        <HowItWorks />
        <Faq />
        <BookingSection />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
