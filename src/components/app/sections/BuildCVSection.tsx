import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Upload } from "lucide-react";
import ChatToBuild from "@/components/app/cv-builder/ChatToBuild";
import UploadCV from "@/components/app/cv-builder/UploadCV";

const tabs = [
  { id: "chat", label: "Chat to Build", icon: MessageSquare },
  { id: "upload", label: "Upload Existing CV", icon: Upload },
] as const;

type TabId = (typeof tabs)[number]["id"];

const BuildCVSection = () => {
  const [activeTab, setActiveTab] = useState<TabId>("chat");

  return (
    <div>
      {/* Tab bar */}
      <div className="relative flex gap-1 bg-secondary rounded-xl p-1 mb-6 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors duration-300 ${
              activeTab === tab.id ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute inset-0 bg-primary rounded-lg -z-10"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "chat" ? <ChatToBuild /> : <UploadCV />}
    </div>
  );
};

export default BuildCVSection;
