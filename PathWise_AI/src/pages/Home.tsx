import HeroSection from "../home/HeroSection.tsx";
import FetureSection from "../home/FeatureSection.tsx";
import HowItWorksSection from "../home/WorkSection.tsx";
import WhyPathWiseSection from "../home/WhyPathWiseSection.tsx";
import InteractivePlayground from "../home/InteractivePlayground.tsx";
import TestimonialSection from "../home/TestimonialSection.tsx";
import FinalCTABanner from "../home/FinalCTABanner.tsx";
import FooterSection from "../home/FooterSection.tsx";

export default function Home() {
  return (
    <div className="flex flex-col items-center min-h-screen gap-4 bg-gray-800 pt-2">
      <HeroSection />
      <FetureSection />
      <HowItWorksSection />
      <WhyPathWiseSection />
      <InteractivePlayground />
      <TestimonialSection />
      <FinalCTABanner />
      <FooterSection />
    </div>
  );
}