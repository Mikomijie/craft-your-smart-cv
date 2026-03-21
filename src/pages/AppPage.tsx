import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppSidebar from "@/components/app/AppSidebar";
import AppTopBar from "@/components/app/AppTopBar";
import MobileTabBar from "@/components/app/MobileTabBar";
import MyCVsSection from "@/components/app/sections/MyCVsSection";
import BuildCVSection from "@/components/app/sections/BuildCVSection";
import TailorSection from "@/components/app/sections/TailorSection";

const slideVariants = {
  initial: { opacity: 0, x: 20, filter: "blur(4px)" },
  animate: { opacity: 1, x: 0, filter: "blur(0px)", transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const } },
  exit: { opacity: 0, x: -20, filter: "blur(4px)", transition: { duration: 0.2 } },
};

const AppPage = () => {
  const [activeSection, setActiveSection] = useState("my-cvs");

  const renderSection = () => {
    switch (activeSection) {
      case "my-cvs": return <MyCVsSection onNavigate={setActiveSection} />;
      case "build": return <BuildCVSection />;
      case "tailor": return <TailorSection />;
      default: return <MyCVsSection onNavigate={setActiveSection} />;
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <AppSidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      {/* Main content */}
      <main className="md:ml-[280px] min-h-screen pb-20 md:pb-0">
        <div className="px-5 md:px-8 py-6 md:py-8 max-w-6xl">
          <AppTopBar activeSection={activeSection} />
          <AnimatePresence mode="wait">
            <motion.div key={activeSection} variants={slideVariants} initial="initial" animate="animate" exit="exit">
              {renderSection()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <MobileTabBar activeSection={activeSection} onSectionChange={setActiveSection} />
    </div>
  );
};

export default AppPage;
