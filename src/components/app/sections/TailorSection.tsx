import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, Check, FileText, Plus, Copy,
  RefreshCw, ChevronDown, ChevronUp
} from "lucide-react";
import CVPreview from "@/components/app/cv-builder/CVPreview";
import type { CVData } from "@/components/app/cv-builder/types";
import { toast } from "sonner";

interface SavedCV {
  id: string;
  name: string;
  data: CVData;
  createdAt: string;
}

type TailorStep = "select" | "paste" | "loading" | "results";
type Tone = "Professional" | "Warm" | "Bold" | "Concise";

const TONES: Tone[] = ["Professional", "Warm", "Bold", "Concise"];

const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
});

const TailorSection = () => {
  const [step, setStep] = useState<TailorStep>("select");
  const [savedCVs, setSavedCVs] = useState<SavedCV[]>([]);
  const [selectedCV, setSelectedCV] = useState<SavedCV | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [loadingProgress, setLoadingProgress] = useState([0, 0, 0]);
  const [loadingDone, setLoadingDone] = useState([false, false, false]);
  const [matchScore, setMatchScore] = useState(0);
  const [tailoredCV, setTailoredCV] = useState<CVData | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [tone, setTone] = useState<Tone>("Professional");
  const [showChanges, setShowChanges] = useState(false);
  const [matchingSkills, setMatchingSkills] = useState<string[]>([]);
  const [highlightSkills, setHighlightSkills] = useState<string[]>([]);
  const [gapSkills, setGapSkills] = useState<string[]>([]);
  const animatedScore = useRef(0);
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const list = JSON.parse(localStorage.getItem("craftcv-list") || "[]");
    setSavedCVs(list);
  }, []);

  const handleSelectCV = (cv: SavedCV) => {
    setSelectedCV(cv);
    setStep("paste");
  };

  const handleTailor = () => {
    if (!selectedCV || jobDescription.trim().length < 50) return;
    setStep("loading");

    // Simulate 3 progress bars completing sequentially
    const timers: NodeJS.Timeout[] = [];
    const durations = [2000, 3000, 3500];
    const startTimes = [0, 1500, 2800];

    startTimes.forEach((start, idx) => {
      const t = setTimeout(() => {
        const interval = setInterval(() => {
          setLoadingProgress((prev) => {
            const next = [...prev];
            next[idx] = Math.min(next[idx] + 2, 100);
            if (next[idx] >= 100) {
              clearInterval(interval);
              setLoadingDone((prev) => {
                const d = [...prev];
                d[idx] = true;
                return d;
              });
            }
            return next;
          });
        }, durations[idx] / 50);
        timers.push(interval as unknown as NodeJS.Timeout);
      }, start);
      timers.push(t);
    });

    // After all complete, generate results
    setTimeout(() => {
      generateResults();
    }, 5500);
  };

  const generateResults = () => {
    if (!selectedCV) return;
    const cv = selectedCV.data;
    const jd = jobDescription.toLowerCase();

    // Match skills from JD
    const allSkills = cv.skills;
    const matching = allSkills.filter((s) => jd.includes(s.toLowerCase()));
    const highlight = allSkills.filter((s) => !matching.includes(s)).slice(0, 4);

    // Extract gap skills from JD
    const commonSkills = ["Python", "JavaScript", "React", "TypeScript", "SQL", "AWS", "Docker", "Kubernetes", "Git", "Node.js", "Java", "C++", "Machine Learning", "Data Analysis", "Project Management", "Communication", "Leadership", "Agile", "Scrum"];
    const gaps = commonSkills.filter((s) => jd.includes(s.toLowerCase()) && !allSkills.some((a) => a.toLowerCase() === s.toLowerCase())).slice(0, 5);

    const score = Math.min(95, Math.max(55, Math.round((matching.length / Math.max(allSkills.length, 1)) * 100 + 40)));

    setMatchingSkills(matching);
    setHighlightSkills(highlight);
    setGapSkills(gaps);
    setMatchScore(score);

    // Tailored CV is the same with enhanced summary
    const tailored: CVData = JSON.parse(JSON.stringify(cv));
    if (tailored.personal.summary) {
      tailored.personal.summary = `Results-driven ${tailored.personal.title || "professional"} with proven expertise in ${matching.slice(0, 3).join(", ") || "relevant technologies"}. ${tailored.personal.summary}`;
    } else {
      tailored.personal.summary = `Results-driven ${tailored.personal.title || "professional"} with strong experience in ${matching.slice(0, 3).join(", ") || "the field"}, seeking to deliver impact in this role.`;
    }
    setTailoredCV(tailored);

    // Cover letter
    setCoverLetter(generateCoverLetter(tailored, tone));

    setStep("results");

    // Animate score count-up
    let current = 0;
    const scoreInterval = setInterval(() => {
      current += 1;
      setDisplayScore(current);
      if (current >= score) clearInterval(scoreInterval);
    }, 20);
  };

  const generateCoverLetter = (cv: CVData, t: Tone) => {
    const name = cv.personal.name || "Applicant";
    const title = cv.personal.title || "professional";
    const company = "your company";
    const recentCompany = cv.experience[0]?.company || "";
    
    // Use skills if available, otherwise fall back to title and company
    const skillsList = cv.skills.filter(s => s.trim().length > 0);
    const expertiseText = skillsList.length > 0
      ? skillsList.slice(0, 5).join(", ")
      : [title, recentCompany].filter(Boolean).join(" at ");

    const intros: Record<Tone, string> = {
      Professional: `Dear Hiring Manager,\n\nI am writing to express my strong interest in the position at ${company}. As a ${title} with demonstrated expertise in ${expertiseText}, I am confident in my ability to contribute meaningfully to your team.`,
      Warm: `Dear Hiring Manager,\n\nI was thrilled to come across this opportunity at ${company}. As a passionate ${title} who loves working with ${expertiseText}, I believe this role is a perfect match for my experience and enthusiasm.`,
      Bold: `Dear Hiring Manager,\n\nLet me be direct — I'm exactly the ${title} you're looking for. With deep expertise in ${expertiseText} and a track record of delivering results, I'm ready to make an immediate impact at ${company}.`,
      Concise: `Dear Hiring Manager,\n\nI'm applying for the ${title} role. My background: ${expertiseText}. I deliver results and I'd like to do that for ${company}.`,
    };

    const expSentence = cv.experience[0]
      ? `At ${cv.experience[0].company || "my previous role"}, I ${cv.experience[0].description ? "excelled in " + cv.experience[0].description.slice(0, 80) : "drove significant results"}.`
      : "";

    return `${intros[t]}\n\nThroughout my career, I have consistently demonstrated the ability to deliver high-quality results. ${expSentence}\n\nI would welcome the opportunity to discuss how my skills and experience align with your needs.\n\nBest regards,\n${name}`;
  };

  const handleToneChange = (t: Tone) => {
    setTone(t);
    if (tailoredCV) setCoverLetter(generateCoverLetter(tailoredCV, t));
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  // Render steps
  if (step === "select") return <SelectStep cvs={savedCVs} onSelect={handleSelectCV} />;
  if (step === "paste") return <PasteStep jd={jobDescription} setJd={setJobDescription} onTailor={handleTailor} onBack={() => setStep("select")} selectedName={selectedCV?.name || ""} />;
  if (step === "loading") return <LoadingStep progress={loadingProgress} done={loadingDone} />;

  return (
    <ResultsStep
      score={displayScore}
      matchingSkills={matchingSkills}
      highlightSkills={highlightSkills}
      gapSkills={gapSkills}
      tailoredCV={tailoredCV!}
      coverLetter={coverLetter}
      tone={tone}
      onToneChange={handleToneChange}
      showChanges={showChanges}
      onToggleChanges={() => setShowChanges(!showChanges)}
      onCopy={handleCopy}
      onRestart={() => {
        setStep("select");
        setLoadingProgress([0, 0, 0]);
        setLoadingDone([false, false, false]);
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
        <a href="/app" onClick={(e) => { e.preventDefault(); }} className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium hover:brightness-110 transition-all">
          <Plus className="w-4 h-4" /> Build New CV
        </a>
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
                <p className="text-xs text-muted-foreground mt-0.5">
                  Created {new Date(cv.createdAt).toLocaleDateString()}
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
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Job Description
      </label>
      <div className="relative">
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="Paste the full job description here..."
          rows={10}
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-300 resize-none"
        />
        <span className="absolute bottom-3 right-3 text-xs text-muted-foreground">
          {jd.length} characters
        </span>
      </div>
      {jd.length > 0 && jd.length < 50 && (
        <p className="text-xs text-amber-500">Minimum 50 characters required</p>
      )}
    </div>

    <motion.button
      onClick={onTailor}
      disabled={jd.trim().length < 50}
      className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 hover:brightness-110 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none"
      animate={jd.trim().length >= 50 ? { boxShadow: ["0 0 0 0 hsl(221 83% 53% / 0)", "0 0 20px 4px hsl(221 83% 53% / 0.3)", "0 0 0 0 hsl(221 83% 53% / 0)"] } : {}}
      transition={jd.trim().length >= 50 ? { duration: 2, repeat: Infinity } : {}}
    >
      <Target className="w-4 h-4" />
      Tailor My CV
    </motion.button>
  </motion.div>
);

/* ── Step 3: Loading ── */
const LOADING_LABELS = [
  "Analysing job requirements...",
  "Tailoring your CV...",
  "Writing your cover letter...",
];

const LoadingStep = ({ progress, done }: { progress: number[]; done: boolean[] }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 max-w-md mx-auto space-y-8">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center"
    >
      <Target className="w-6 h-6 text-primary" />
    </motion.div>

    <div className="w-full space-y-5">
      {LOADING_LABELS.map((label, i) => (
        <div key={i} className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">{label}</span>
            {done[i] && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400 }}>
                <Check className="w-4 h-4 text-green-500" />
              </motion.div>
            )}
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              style={{ width: `${progress[i]}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>
      ))}
    </div>
  </motion.div>
);

/* ── Step 4: Results ── */
const ResultsStep = ({
  score, matchingSkills, highlightSkills, gapSkills, tailoredCV, coverLetter,
  tone, onToneChange, showChanges, onToggleChanges, onCopy, onRestart,
}: {
  score: number; matchingSkills: string[]; highlightSkills: string[]; gapSkills: string[];
  tailoredCV: CVData; coverLetter: string; tone: Tone; onToneChange: (t: Tone) => void;
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
            {matchingSkills.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Matching Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {matchingSkills.map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded-md bg-green-500/10 text-green-600 text-xs font-medium">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {highlightSkills.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Highlight These</p>
                <div className="flex flex-wrap gap-1.5">
                  {highlightSkills.map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {gapSkills.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Skill Gaps</p>
                <div className="flex flex-wrap gap-1.5">
                  {gapSkills.map((s) => (
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
            <CVPreview data={tailoredCV} highlightedSections={showChanges ? ["personal", "experience"] : undefined} />
          </div>
          <div className="mt-4">
            <CVPreview data={tailoredCV} showDownload previewId="tailored-cv-pdf" />
          </div>
        </motion.div>

        {/* Column 3: Cover Letter */}
        <motion.div variants={fadeUp(0.3)} initial="hidden" animate="visible" className="bg-card rounded-2xl border border-border p-6 flex flex-col">
          <h3 className="text-sm font-semibold mb-3">Cover Letter</h3>

          {/* Tone pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {TONES.map((t) => (
              <button
                key={t}
                onClick={() => onToneChange(t)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-300 ${
                  tone === t
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-0 max-h-[400px] overflow-y-auto bg-background rounded-xl p-4 border border-border text-sm leading-relaxed whitespace-pre-wrap text-foreground/80">
            {coverLetter}
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => onToneChange(tone)}
              className="flex-1 flex items-center justify-center gap-2 bg-muted text-foreground py-2.5 rounded-xl text-sm font-medium hover:bg-muted/80 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Regenerate
            </button>
            <button
              onClick={() => onCopy(coverLetter)}
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
