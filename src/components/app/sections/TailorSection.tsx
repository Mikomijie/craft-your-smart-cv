import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, Check, FileText, Plus, Copy,
  RefreshCw, ChevronDown, ChevronUp, Loader2, Sparkles
} from "lucide-react";
import CVPreview from "@/components/app/cv-builder/CVPreview";
import type { CVData } from "@/components/app/cv-builder/types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface SavedCV {
  id: string;
  name: string;
  data: CVData;
  createdAt: string;
}

type TailorStep = "select" | "paste" | "loading" | "results";
type Tone = "professional" | "warm" | "bold" | "concise";

const TONES: { id: Tone; label: string }[] = [
  { id: "professional", label: "Professional" },
  { id: "warm", label: "Warm" },
  { id: "bold", label: "Bold" },
  { id: "concise", label: "Concise" },
];

const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
});

interface TailorResult {
  matchScore: number;
  matchingSkills: string[];
  highlightSkills: string[];
  gapSkills: string[];
  tailoredCV: CVData;
  coverLetter: Record<Tone, string>;
  changes: string[];
}

const TailorSection = () => {
  const [step, setStep] = useState<TailorStep>("select");
  const [savedCVs, setSavedCVs] = useState<SavedCV[]>([]);
  const [selectedCV, setSelectedCV] = useState<SavedCV | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<TailorResult | null>(null);
  const [tone, setTone] = useState<Tone>("professional");
  const [showChanges, setShowChanges] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    const list = JSON.parse(localStorage.getItem("craftcv-list") || "[]");
    setSavedCVs(list);
  }, []);

  const handleSelectCV = (cv: SavedCV) => {
    setSelectedCV(cv);
    setStep("paste");
  };

  const handleTailor = async () => {
    if (!selectedCV || jobDescription.trim().length < 50) return;
    setStep("loading");
    setIsLoading(true);
    setLoadingStep(0);

    // Animate loading steps
    const stepTimer1 = setTimeout(() => setLoadingStep(1), 2000);
    const stepTimer2 = setTimeout(() => setLoadingStep(2), 4000);

    try {
      const { data, error } = await supabase.functions.invoke("tailor-cv", {
        body: { cvData: selectedCV.data, jobDescription },
      });

      if (error) throw new Error(error.message || "Failed to tailor CV");
      if (data?.error) throw new Error(data.error);

      // Normalize the tailored CV structure
      const tailored = data.tailoredCV || selectedCV.data;
      const normalizedCV: CVData = {
        personal: { ...selectedCV.data.personal, ...tailored.personal },
        experience: (tailored.experience || []).map((e: any, i: number) => ({
          id: `exp-${i}`,
          company: e.company || "",
          role: e.role || "",
          startDate: e.startDate || "",
          endDate: e.endDate || "Present",
          description: e.description || "",
        })),
        education: (tailored.education || []).map((e: any, i: number) => ({
          id: `edu-${i}`,
          school: e.school || "",
          degree: e.degree || "",
          startDate: e.startDate || "",
          endDate: e.endDate || "",
        })),
        skills: tailored.skills || selectedCV.data.skills,
        projects: (tailored.projects || selectedCV.data.projects || []).map((p: any, i: number) => ({
          id: `proj-${i}`,
          name: p.name || "",
          description: p.description || "",
          techStack: p.techStack || [],
          link: p.link || "",
        })),
        certifications: (tailored.certifications || selectedCV.data.certifications || []).map((c: any, i: number) => ({
          id: `cert-${i}`,
          name: c.name || "",
          issuer: c.issuer || "",
          date: c.date || "",
        })),
        extracurriculars: tailored.extracurriculars || selectedCV.data.extracurriculars || [],
      };

      const coverLetter = typeof data.coverLetter === "string"
        ? { professional: data.coverLetter, warm: data.coverLetter, bold: data.coverLetter, concise: data.coverLetter }
        : data.coverLetter || { professional: "", warm: "", bold: "", concise: "" };

      setResult({
        matchScore: data.matchScore || 65,
        matchingSkills: data.matchingSkills || [],
        highlightSkills: data.highlightSkills || [],
        gapSkills: data.gapSkills || [],
        tailoredCV: normalizedCV,
        coverLetter,
        changes: data.changes || [],
      });

      setStep("results");

      // Animate score
      let current = 0;
      const target = data.matchScore || 65;
      const interval = setInterval(() => {
        current += 1;
        setDisplayScore(current);
        if (current >= target) clearInterval(interval);
      }, 20);
    } catch (err: any) {
      console.error("Tailor error:", err);
      toast.error(err.message || "Failed to tailor CV. Please try again.");
      setStep("paste");
    } finally {
      setIsLoading(false);
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  if (step === "select") return <SelectStep cvs={savedCVs} onSelect={handleSelectCV} />;
  if (step === "paste") return <PasteStep jd={jobDescription} setJd={setJobDescription} onTailor={handleTailor} onBack={() => setStep("select")} selectedName={selectedCV?.name || ""} />;
  if (step === "loading") return <LoadingStep currentStep={loadingStep} />;

  if (!result) return null;

  return (
    <ResultsStep
      result={result}
      score={displayScore}
      tone={tone}
      onToneChange={setTone}
      showChanges={showChanges}
      onToggleChanges={() => setShowChanges(!showChanges)}
      onCopy={handleCopy}
      onRestart={() => {
        setStep("select");
        setResult(null);
        setDisplayScore(0);
      }}
    />
  );
};

/* ── Step 1: Select CV ── */
const SelectStep = ({ cvs, onSelect }: { cvs: SavedCV[]; onSelect: (cv: SavedCV) => void }) => (
  <motion.div variants={fadeUp()} initial="hidden" animate="visible" className="space-y-6 max-w-3xl">
    <div className="flex flex-col items-center text-center py-6">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
        <Target className="w-7 h-7 text-primary" />
      </div>
      <h2 className="text-lg font-semibold mb-2">Select a CV to tailor</h2>
      <p className="text-sm text-muted-foreground max-w-md">Choose which CV you'd like to optimize for a specific job.</p>
    </div>

    {cvs.length === 0 ? (
      <div className="flex flex-col items-center py-12 text-center">
        <FileText className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <p className="text-sm text-muted-foreground mb-4">No CVs saved yet. Build one first!</p>
      </div>
    ) : (
      <div className="grid sm:grid-cols-2 gap-4">
        {cvs.map((cv) => (
          <motion.button
            key={cv.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(cv)}
            className="text-left bg-card rounded-2xl border border-border p-5 hover:border-primary/40 hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{cv.name || "Untitled CV"}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {cv.data.personal.title || "No title"} · {cv.data.skills.length} skills
                </p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    )}
  </motion.div>
);

/* ── Step 2: Paste JD ── */
const PasteStep = ({ jd, setJd, onTailor, onBack, selectedName }: {
  jd: string; setJd: (v: string) => void; onTailor: () => void; onBack: () => void; selectedName: string;
}) => (
  <motion.div variants={fadeUp()} initial="hidden" animate="visible" className="space-y-6 max-w-2xl">
    <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
      ← Back to CV selection
    </button>

    <div className="bg-card rounded-2xl border border-primary/20 p-4 flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
        <Check className="w-4 h-4 text-primary" />
      </div>
      <div>
        <p className="text-sm font-medium">Selected: {selectedName}</p>
        <p className="text-xs text-muted-foreground">This CV will be tailored to the job</p>
      </div>
    </div>

    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Job Description</label>
      <textarea
        value={jd}
        onChange={(e) => setJd(e.target.value)}
        placeholder="Paste the full job description here..."
        rows={10}
        className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-300 resize-none"
      />
      {jd.length > 0 && jd.length < 50 && (
        <p className="text-xs text-amber-500">Minimum 50 characters required</p>
      )}
    </div>

    <motion.button
      onClick={onTailor}
      disabled={jd.trim().length < 50}
      className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 hover:brightness-110 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none"
    >
      <Sparkles className="w-4 h-4" />
      Tailor with AI
    </motion.button>
  </motion.div>
);

/* ── Step 3: Loading ── */
const LOADING_LABELS = [
  "Analysing job requirements with AI...",
  "Rewriting your CV bullets to match...",
  "Generating your cover letter...",
];

const LoadingStep = ({ currentStep }: { currentStep: number }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 max-w-md mx-auto space-y-8">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center"
    >
      <Sparkles className="w-6 h-6 text-primary" />
    </motion.div>

    <div className="w-full space-y-5">
      {LOADING_LABELS.map((label, i) => (
        <div key={i} className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">{label}</span>
            {i <= currentStep && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                {i < currentStep ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                )}
              </motion.div>
            )}
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: "0%" }}
              animate={{
                width: i < currentStep ? "100%" : i === currentStep ? "60%" : "0%",
              }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </div>
        </div>
      ))}
    </div>

    <p className="text-xs text-muted-foreground text-center">AI is analyzing your CV against the job description...</p>
  </motion.div>
);

/* ── Step 4: Results ── */
const ResultsStep = ({
  result, score, tone, onToneChange, showChanges, onToggleChanges, onCopy, onRestart,
}: {
  result: TailorResult; score: number; tone: Tone; onToneChange: (t: Tone) => void;
  showChanges: boolean; onToggleChanges: () => void; onCopy: (t: string) => void; onRestart: () => void;
}) => {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tailoring Results</h2>
        <button onClick={onRestart} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          <RefreshCw className="w-3.5 h-3.5" /> Start Over
        </button>
      </div>

      {/* AI Changes Summary */}
      {result.changes.length > 0 && (
        <motion.div variants={fadeUp(0)} initial="hidden" animate="visible" className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">AI Changes Made</span>
          </div>
          <ul className="space-y-1">
            {result.changes.map((c, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                <Check className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Column 1: Match Score */}
        <motion.div variants={fadeUp(0)} initial="hidden" animate="visible" className="bg-card rounded-2xl border border-border p-6">
          <h3 className="text-sm font-semibold mb-6 text-center">Match Score</h3>
          <div className="flex justify-center mb-6">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                <motion.circle
                  cx="60" cy="60" r="54" fill="none"
                  stroke="hsl(var(--primary))" strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: offset }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold">{score}%</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {result.matchingSkills.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Matching Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.matchingSkills.map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded-md bg-green-500/10 text-green-600 text-xs font-medium">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {result.highlightSkills.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Highlight These</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.highlightSkills.map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {result.gapSkills.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Skill Gaps</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.gapSkills.map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 text-xs font-medium">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Column 2: Tailored CV */}
        <motion.div variants={fadeUp(0.15)} initial="hidden" animate="visible" className="bg-card rounded-2xl border border-border p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Tailored CV</h3>
            <button onClick={onToggleChanges} className="text-xs text-primary flex items-center gap-1 hover:underline">
              {showChanges ? "Hide" : "Show"} changes {showChanges ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
          <div className="flex-1 min-h-0 max-h-[500px] overflow-y-auto">
            <CVPreview data={result.tailoredCV} showDownload highlightedSections={showChanges ? ["personal", "experience"] : undefined} />
          </div>
        </motion.div>

        {/* Column 3: Cover Letter */}
        <motion.div variants={fadeUp(0.3)} initial="hidden" animate="visible" className="bg-card rounded-2xl border border-border p-6 flex flex-col">
          <h3 className="text-sm font-semibold mb-3">Cover Letter</h3>

          <div className="flex flex-wrap gap-2 mb-4">
            {TONES.map((t) => (
              <button
                key={t.id}
                onClick={() => onToneChange(t.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-300 ${
                  tone === t.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-0 max-h-[400px] overflow-y-auto bg-background rounded-xl p-4 border border-border text-sm leading-relaxed whitespace-pre-wrap text-foreground/80">
            {result.coverLetter[tone] || result.coverLetter.professional || ""}
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => onCopy(result.coverLetter[tone] || result.coverLetter.professional || "")}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-medium hover:brightness-110 transition-all"
            >
              <Copy className="w-3.5 h-3.5" /> Copy
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TailorSection;
