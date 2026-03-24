import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Mail, Phone, MapPin, Globe, Download, Linkedin, Github, Award, FolderOpen, Trophy, Layout, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { CVData } from "./types";
import { toast } from "sonner";
import { generateCV, type PageMode } from "./pdfGenerator";

export type TemplateId = "modern" | "classic" | "minimal";

const TEMPLATES: { id: TemplateId; label: string }[] = [
  { id: "modern", label: "Modern" },
  { id: "classic", label: "Classic" },
  { id: "minimal", label: "Minimal" },
];

function calcCompleteness(d: CVData): number {
  let s = 0; const p = d.personal;
  if (p.name) s += 12; if (p.title) s += 8; if (p.email) s += 8; if (p.phone) s += 4;
  if (p.summary) s += 12; if (d.experience.length) s += 20; if (d.education.length) s += 10;
  if (d.skills.length) s += 10; if (d.projects.length) s += 8; if (d.certifications.length) s += 4;
  if (p.linkedin || p.github) s += 4; return Math.min(s, 100);
}

function cleanNameForOutput(name: string): string {
  return name.replace(/\s+\b(and|i|the|a|an|is|am|was|im|or|but|to|for|my|me|at|in)\s*$/i, "").trim();
}

const CVPreview = ({ data, onSave, showSave = false, showDownload = false, highlightedSections, previewId }: {
  data: CVData;
  onSave?: () => void;
  showSave?: boolean;
  showDownload?: boolean;
  highlightedSections?: string[];
  previewId?: string;
}) => {
  const [template, setTemplate] = useState<TemplateId>("modern");
  const { personal, experience, education, skills, projects, certifications, extracurriculars } = data;
  const completeness = calcCompleteness(data);
  const [downloading, setDownloading] = useState(false);
  const hasContent = personal.name || experience.length > 0 || education.length > 0 || skills.length > 0;
  const isHighlighted = (section: string) => highlightedSections?.includes(section);

  return (
    <div className="flex flex-col h-full">
      {/* Template switcher */}
      <div className="flex items-center gap-2 mb-3">
        <Layout className="w-3.5 h-3.5 text-muted-foreground" />
        <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTemplate(t.id)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                template === t.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {showSave && (
        <div className="mb-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>CV Completeness</span>
            <span className="font-semibold text-primary">{completeness}%</span>
          </div>
          <Progress value={completeness} className="h-2" />
        </div>
      )}

      <div className={`flex-1 rounded-2xl border border-border p-6 md:p-8 overflow-y-auto min-h-0 ${
        template === "classic" ? "bg-amber-50/50 font-serif" : template === "minimal" ? "bg-card" : "bg-card"
      }`}>
        {!hasContent ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-20">
            <FileText className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-sm">Start chatting to see your CV here.</p>
          </div>
        ) : (
          <div className="space-y-5 text-sm">
            {/* Personal header - varies by template */}
            {personal.name && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                className={`border-b border-border pb-4 ${isHighlighted("personal") ? "bg-primary/5 -mx-4 px-4 rounded-xl" : ""} ${
                  template === "classic" ? "text-center" : template === "minimal" ? "" : ""
                }`}
              >
                <h2 className={`tracking-tight ${
                  template === "classic" ? "text-2xl font-bold font-serif uppercase tracking-widest" :
                  template === "minimal" ? "text-2xl font-light tracking-wide" : "text-2xl font-bold"
                }`}>{cleanNameForOutput(personal.name)}</h2>
                {personal.title && (
                  <p className={`mt-1 ${
                    template === "classic" ? "text-muted-foreground italic" :
                    template === "minimal" ? "text-muted-foreground font-light" : "text-primary font-medium"
                  }`}>{personal.title}</p>
                )}
                <div className={`flex flex-wrap gap-x-4 gap-y-1 mt-3 text-muted-foreground text-xs ${template === "classic" ? "justify-center" : ""}`}>
                  {personal.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{personal.email}</span>}
                  {personal.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{personal.phone}</span>}
                  {personal.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{personal.location}</span>}
                  {personal.linkedin && <span className="flex items-center gap-1"><Linkedin className="w-3 h-3" />{personal.linkedin}</span>}
                  {personal.github && <span className="flex items-center gap-1"><Github className="w-3 h-3" />{personal.github}</span>}
                  {personal.website && <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{personal.website}</span>}
                </div>
                {personal.summary && <p className={`mt-4 text-foreground/80 leading-relaxed text-pretty ${template === "classic" ? "italic" : ""}`}>{personal.summary}</p>}
              </motion.div>
            )}

            {experience.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
                className={isHighlighted("experience") ? "bg-primary/5 -mx-4 px-4 py-2 rounded-xl" : ""}
              >
                <h3 className={`text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 ${template === "classic" ? "border-b-2 border-foreground/20 pb-1" : ""}`}>
                  {template === "classic" ? "Professional Experience" : "Experience"}
                </h3>
                <div className="space-y-4">
                  {experience.map((e) => (
                    <div key={e.id}>
                      <div className="flex items-start justify-between">
                        <div>
                          {e.role && <p className={`font-semibold ${template === "classic" ? "font-serif" : ""}`}>{e.role}</p>}
                          {e.company && <p className={`text-muted-foreground ${template === "classic" ? "italic" : ""}`}>{e.company}</p>}
                        </div>
                        {(e.startDate || e.endDate) && (
                          <span className={`text-xs text-muted-foreground whitespace-nowrap ${template === "classic" ? "italic" : ""}`}>
                            {e.startDate ? `${e.startDate} — ` : ""}{e.endDate || "Present"}
                          </span>
                        )}
                      </div>
                      {e.description && (
                        <div className="mt-1.5 text-foreground/70 leading-relaxed text-pretty">
                          {e.description.split("\n").map((line, i) => (
                            <p key={i}>{line.startsWith("•") ? line : `• ${line}`}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {education.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}
                className={isHighlighted("education") ? "bg-primary/5 -mx-4 px-4 py-2 rounded-xl" : ""}
              >
                <h3 className={`text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 ${template === "classic" ? "border-b-2 border-foreground/20 pb-1" : ""}`}>Education</h3>
                <div className="space-y-3">
                  {education.map((e) => (
                    <div key={e.id} className="flex items-start justify-between">
                      <div>
                        {e.degree && <p className={`font-semibold ${template === "classic" ? "font-serif" : ""}`}>{e.degree}</p>}
                        {e.school && <p className={`text-muted-foreground ${template === "classic" ? "italic" : ""}`}>{e.school}</p>}
                      </div>
                      {e.endDate && <span className="text-xs text-muted-foreground whitespace-nowrap">{e.endDate}</span>}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {projects.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5" /> Projects
                </h3>
                <div className="space-y-3">
                  {projects.map((p) => (
                    <div key={p.id}>
                      <p className={`font-semibold ${template === "classic" ? "font-serif" : ""}`}>{p.name}</p>
                      {p.description && <p className="text-foreground/70 mt-0.5">{p.description}</p>}
                      {p.techStack.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {p.techStack.map((t, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium">{t}</span>
                          ))}
                        </div>
                      )}
                      {p.link && <p className="text-xs text-primary mt-1">{p.link}</p>}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {certifications.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" /> Certifications
                </h3>
                <div className="space-y-2">
                  {certifications.map((c) => (
                    <div key={c.id}>
                      <p className="font-semibold">{c.name}</p>
                      {c.issuer && <p className="text-muted-foreground text-xs">{c.issuer}{c.date ? ` • ${c.date}` : ""}</p>}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {skills.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}
                className={isHighlighted("skills") ? "bg-primary/5 -mx-4 px-4 py-2 rounded-xl" : ""}
              >
                <h3 className={`text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 ${template === "classic" ? "border-b-2 border-foreground/20 pb-1" : ""}`}>Skills</h3>
                {template === "minimal" ? (
                  <p className="text-foreground/70 text-sm">{skills.join("  ·  ")}</p>
                ) : template === "classic" ? (
                  <p className="text-foreground/70 text-sm">{skills.join("  •  ")}</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {skills.map((s, i) => <span key={i} className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium">{s}</span>)}
                  </div>
                )}
              </motion.div>
            )}

            {extracurriculars.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35 }}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5" /> {template === "classic" ? "Activities" : "Extracurriculars"}
                </h3>
                <div className="space-y-1">
                  {extracurriculars.map((e, i) => (
                    <p key={i} className="text-foreground/70">• {e}</p>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {(showDownload || showSave) && hasContent && (
        <div className="flex gap-2 mt-4 sticky bottom-0 bg-background/80 backdrop-blur-sm pt-2 pb-1 -mx-1 px-1">
          {showDownload && (
            <button
              onClick={() => {
                if (!data.personal.name && data.experience.length === 0 && data.skills.length === 0) {
                  toast.error("CV is empty — add some content first");
                  return;
                }
                setDownloading(true);
                try {
                  generateCV(data, template);
                  toast.success("PDF downloaded!");
                } catch (err) {
                  console.error(err);
                  toast.error("Failed to generate PDF");
                } finally {
                  setDownloading(false);
                }
              }}
              disabled={downloading}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl text-sm font-semibold transition-all duration-300 hover:brightness-110 active:scale-[0.97] disabled:opacity-60"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Download PDF
            </button>
          )}
          {showSave && completeness >= 40 && onSave && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => {
                onSave();
                toast.success("CV saved! Find it anytime in My CVs.", { duration: 4000 });
              }}
              className={`${showDownload ? "flex-1" : "w-full"} flex items-center justify-center gap-2 bg-secondary text-secondary-foreground border border-border py-3 rounded-xl text-sm font-semibold transition-all duration-300 hover:brightness-110 active:scale-[0.97]`}
            >
              <motion.svg
                xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.2 }}
              >
                <path d="M20 6 9 17l-5-5" />
              </motion.svg>
              Save CV
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
};

export default CVPreview;
