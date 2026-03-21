import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, Sparkles, Loader2 } from "lucide-react";
import CVPreview from "./CVPreview";
import type { CVData } from "./types";
import { defaultCV, uid } from "./types";
import { toast } from "sonner";

function parseTextToCV(text: string): CVData {
  const cv: CVData = JSON.parse(JSON.stringify(defaultCV));
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines[0]) cv.personal.name = lines[0];
  if (lines[1]) cv.personal.title = lines[1];

  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (emailMatch) cv.personal.email = emailMatch[0];
  const phoneMatch = text.match(/[\d+][\d\s()-]{6,}/);
  if (phoneMatch) cv.personal.phone = phoneMatch[0].trim();

  // Look for common section headers
  const expIdx = lines.findIndex((l) => /^(experience|work|employment)/i.test(l));
  const eduIdx = lines.findIndex((l) => /^(education|academic|school|university)/i.test(l));
  const skillIdx = lines.findIndex((l) => /^(skills|technical|competenc)/i.test(l));
  const summaryIdx = lines.findIndex((l) => /^(summary|profile|about|objective)/i.test(l));

  if (summaryIdx > -1) {
    const end = [expIdx, eduIdx, skillIdx].filter((i) => i > summaryIdx).sort((a, b) => a - b)[0] || lines.length;
    cv.personal.summary = lines.slice(summaryIdx + 1, end).join(" ");
  }

  if (expIdx > -1) {
    const end = [eduIdx, skillIdx].filter((i) => i > expIdx).sort((a, b) => a - b)[0] || lines.length;
    const expLines = lines.slice(expIdx + 1, end);
    if (expLines.length > 0) {
      cv.experience.push({
        id: uid(), role: expLines[0] || "", company: expLines[1] || "",
        startDate: "", endDate: "", description: expLines.slice(2).join(" "),
      });
    }
  }

  if (eduIdx > -1) {
    const end = [skillIdx].filter((i) => i > eduIdx).sort((a, b) => a - b)[0] || lines.length;
    const eduLines = lines.slice(eduIdx + 1, end);
    if (eduLines.length > 0) {
      cv.education.push({ id: uid(), degree: eduLines[0] || "", school: eduLines[1] || "", startDate: "", endDate: "" });
    }
  }

  if (skillIdx > -1) {
    const skillLines = lines.slice(skillIdx + 1);
    cv.skills = skillLines.flatMap((l) => l.split(/[,;•·|]+/)).map((s) => s.trim()).filter((s) => s.length > 1 && s.length < 40).slice(0, 15);
  }

  return cv;
}

const UploadCV = () => {
  const [cvData, setCvData] = useState<CVData>(defaultCV);
  const [pasteText, setPasteText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const hasData = cvData.personal.name !== "";

  const processText = useCallback((text: string) => {
    const data = parseTextToCV(text);
    setCvData(data);
    toast.success("CV parsed successfully!");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === "text/plain") {
      file.text().then(processText);
    } else {
      toast.info("Currently supports text files. Try pasting your CV text below.");
    }
  }, [processText]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) file.text().then(processText);
  }, [processText]);

  const handlePaste = () => {
    if (pasteText.trim()) processText(pasteText);
  };

  const handleEnhance = () => {
    setIsEnhancing(true);
    // Simulate AI enhancement
    setTimeout(() => {
      setCvData((prev) => ({
        ...prev,
        personal: {
          ...prev.personal,
          summary: prev.personal.summary
            ? `Results-driven ${prev.personal.title || "professional"} with a proven track record of delivering high-impact outcomes. ${prev.personal.summary}`
            : `Results-driven ${prev.personal.title || "professional"} passionate about delivering exceptional results and driving growth.`,
        },
        experience: prev.experience.map((exp) => ({
          ...exp,
          description: exp.description
            ? `• ${exp.description.replace(/^[•\-]\s*/, "")}`
            : exp.description,
        })),
      }));
      setIsEnhancing(false);
      toast.success("CV enhanced with AI suggestions!");
    }, 1500);
  };

  const handleSave = () => {
    const saved = JSON.parse(localStorage.getItem("craftcv-list") || "[]");
    saved.push({ id: uid(), name: cvData.personal.name || "Uploaded CV", data: cvData, createdAt: new Date().toISOString() });
    localStorage.setItem("craftcv-list", JSON.stringify(saved));
    toast.success("CV saved successfully!");
  };

  return (
    <div className="grid lg:grid-cols-[1fr_1fr] gap-6 h-[calc(100vh-220px)] min-h-[500px]">
      {/* Upload panel */}
      <div className="flex flex-col gap-4">
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center p-10 rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer ${
            isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/40 hover:bg-muted/30"
          }`}
        >
          <input type="file" accept=".txt,.pdf" onChange={handleFileSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
          <motion.div
            animate={isDragging ? { y: -4, scale: 1.1 } : { y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Upload className="w-10 h-10 text-muted-foreground mb-3" />
          </motion.div>
          <p className="text-sm font-medium">Drop your CV file here</p>
          <p className="text-xs text-muted-foreground mt-1">Supports .txt files • or click to browse</p>
        </div>

        {/* Text paste area */}
        <div className="flex-1 flex flex-col gap-3">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Or paste your CV text</label>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Paste your full CV content here..."
            className="flex-1 min-h-[160px] rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-300 resize-none"
          />
          <div className="flex gap-2">
            <button onClick={handlePaste} disabled={!pasteText.trim()}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-medium transition-all duration-300 hover:brightness-110 active:scale-[0.97] disabled:opacity-40">
              <FileText className="w-3.5 h-3.5" /> Parse CV
            </button>
            {hasData && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={handleEnhance}
                disabled={isEnhancing}
                className="flex items-center gap-2 bg-accent/10 text-primary px-4 py-2.5 rounded-xl text-sm font-medium border border-primary/20 transition-all duration-300 hover:bg-accent/20 active:scale-[0.97] disabled:opacity-60"
              >
                {isEnhancing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Enhance with AI
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Live CV Preview */}
      <div className="hidden lg:flex flex-col min-h-0">
        <CVPreview data={cvData} onSave={handleSave} showSave />
      </div>
    </div>
  );
};

export default UploadCV;
