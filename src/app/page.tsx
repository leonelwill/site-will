import { Hero } from "@/components/sections/Hero";
import { AboutMe } from "@/components/sections/AboutMe";
import { AuthoritySection } from "@/components/sections/AuthoritySection";
import { Services } from "@/components/sections/Services";
import { ContactCTA } from "@/components/sections/ContactCTA";

export default function Home() {
  return (
    <>
      <Hero />
      <AuthoritySection />
      <AboutMe />
      <Services />
      <ContactCTA />
    </>
  );
}
