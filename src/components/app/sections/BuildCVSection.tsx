import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Upload, Sparkles } from "lucide-react";
import ChatToBuild from "@/components/app/cv-builder/ChatToBuild";
import UploadCV from "@/components/app/cv-builder/UploadCV";
import { sampleCV } from "@/components/app/cv-builder/sampleCV";
import CVPreview from "@/components/app/cv-builder/CVPreview";
import type { CVData } from "@/components/app/cv-builder/types";
import { uid } from "@/components/app/cv-builder/types";
import { toast } from "sonner";

const tabs = [
  { id: "chat", label: "Chat to Build", icon: MessageSquare },
  { id: "upload", label: "Upload Existing CV", icon: Upload },
] as const;

type TabId = (typeof tabs)[number]["id"];

const BuildCVSection = () => {
  const [activeTab, setActiveTab] = useState<TabId>("chat");
  const [demoMode, setDemoMode] = useState(false);
  const [demoData, setDemoData] = useState<CVData | null>(null);

  const handleTryDemo = () => {
    setDemoData(sampleCV);
    setDemoMode(true);
  };

  const handleSaveDemo = () => {
    const saved = JSON.parse(localStorage.getItem("craftcv-list") || "[]");
    saved.push({
      id: uid(),
      name: sampleCV.personal.name,
      data: sampleCV,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem("craftcv-list", JSON.stringify(saved));
    toast.success("Sample CV saved!");
  };

  if (demoMode && demoData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Demo CV Preview</span>
          </div>
          <button
            onClick={() => setDemoMode(false)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Builder
          </button>
        </div>
        <div className="max-w-3xl">
          <CVPreview data={demoData} onSave={handleSaveDemo} showSave showDownload />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Tab bar + Demo button */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="relative flex gap-1 bg-secondary rounded-xl p-1 w-fit">
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

        <button
          onClick={handleTryDemo}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-primary/30 bg-primary/5 text-primary text-sm font-medium hover:bg-primary/10 transition-all duration-300"
        >
          <Sparkles className="w-4 h-4" />
          Try Demo
        </button>
      </div>

      {/* Tab content */}
      {activeTab === "chat" ? <ChatToBuild /> : <UploadCV />}
    </div>
  );
};

export default BuildCVSection;
