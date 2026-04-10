import Hero from "@/components/Hero";
import StatsSection from "@/components/StatsSection";
import FeatureSection from "@/components/FeatureSection";
import FeaturesGrid from "@/components/FeaturesGrid";
import FindYourFriends from "@/components/FindYourFriends";
import MakeGroupChatsFun from "@/components/MakeGroupChatsFun";
import StreamLikeSameRoom from "@/components/StreamLikeSameRoom";
import TalkPlayChatHangout from "@/components/TalkPlayChatHangout";
import HopInWhenFree from "@/components/HopInWhenFree";
import SeeWhosAround from "@/components/SeeWhosAround";
import AlwaysHaveSomething from "@/components/AlwaysHaveSomething";
import WhereverYouGame from "@/components/WhereverYouGame";
import NitroSection from "@/components/NitroSection";
import DiscoverSection from "@/components/DiscoverSection";
import SafetySection from "@/components/SafetySection";
import CTABanner from "@/components/CTABanner";
import DownloadSection from "@/components/DownloadSection";
import Footer from "@/components/Footer";

export default function Index() {
  return (
    <div style={{ backgroundColor: '#1a1b1e', minHeight: '100vh' }}>
      <Hero />
      <StatsSection />
      <FeatureSection />
      <FeaturesGrid />
      <FindYourFriends />
      <MakeGroupChatsFun />
      <StreamLikeSameRoom />
      <TalkPlayChatHangout />
      <HopInWhenFree />
      <SeeWhosAround />
      <AlwaysHaveSomething />
      <WhereverYouGame />
      <NitroSection />
      <DiscoverSection />
      <SafetySection />
      <CTABanner />
      <DownloadSection />
      <Footer />
    </div>
  );
}
