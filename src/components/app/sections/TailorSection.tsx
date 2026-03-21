import { Target, Clipboard } from "lucide-react";
import { useState } from "react";

const TailorSection = () => {
  const [jobDescription, setJobDescription] = useState("");

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex flex-col items-center text-center py-8">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
          <Target className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-lg font-semibold mb-2">Tailor Your CV</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Paste a job description below and we'll optimize your CV to match the role perfectly.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Job Description
        </label>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the full job description here..."
          rows={8}
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-300 resize-none"
        />
      </div>

      <button
        disabled={!jobDescription.trim()}
        className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 hover:brightness-110 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none"
      >
        <Clipboard className="w-4 h-4" />
        Tailor My CV
      </button>
    </div>
  );
};

export default TailorSection;
