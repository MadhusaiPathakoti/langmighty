import AboutSection from "./AboutSection.jsx";
import CulturalBackground from "../CulturalBackground.jsx";
import FaqSection from "./FaqSection.jsx";
import FeatureDetailSection from "./FeatureDetailSection.jsx";
import FeaturesOverviewSection from "./FeaturesOverviewSection.jsx";
import FloatingSocial from "./FloatingSocial.jsx";
import HeroSection from "./HeroSection.jsx";
import HowItWorksSection from "./HowItWorksSection.jsx";
import LandingFooter from "./LandingFooter.jsx";
import LandingNav from "./LandingNav.jsx";
import SupportedLanguagesSection from "./SupportedLanguagesSection.jsx";
import { FEATURES } from "./landingContent.js";

export default function LandingPage({ onGetStarted, theme, onToggleTheme }) {
  return (
    <div className="h-screen overflow-y-auto bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <CulturalBackground />
      <FloatingSocial />
      <div className="relative z-10">
        <LandingNav onGetStarted={onGetStarted} theme={theme} onToggleTheme={onToggleTheme} />
        <HeroSection onGetStarted={onGetStarted} />
        <FeaturesOverviewSection />

        {FEATURES.map((feature, i) => (
          <FeatureDetailSection key={feature.id} feature={feature} reversed={i % 2 === 1} tinted={i % 2 === 1} />
        ))}

        <HowItWorksSection />
        <SupportedLanguagesSection />
        <FaqSection />
        <AboutSection />
        <LandingFooter />
      </div>
    </div>
  );
}
