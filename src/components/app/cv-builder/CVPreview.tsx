import { motion } from "framer-motion";
import { FileText, Mail, Phone, MapPin, Globe, Download } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { CVData } from "./types";
import { toast } from "sonner";

function calcCompleteness(data: CVData): number {
  let score = 0;
  const p = data.personal;
  if (p.name) score += 15;
  if (p.title) score += 10;
  if (p.email) score += 10;
  if (p.phone) score += 5;
  if (p.summary) score += 15;
  if (data.experience.length > 0) score += 25;
  if (data.education.length > 0) score += 10;
  if (data.skills.length > 0) score += 10;
  return Math.min(score, 100);
}

declare global {
  interface Window {
    html2pdf: any;
  }
}

let html2pdfLoaded = false;
function loadHtml2Pdf(): Promise<void> {
  if (html2pdfLoaded && window.html2pdf) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.2/html2pdf.bundle.min.js";
    script.onload = () => { html2pdfLoaded = true; resolve(); };
    script.onerror = () => reject(new Error("Failed to load html2pdf"));
    document.head.appendChild(script);
  });
}

function getFileName(data: CVData): string {
  const name = data.personal.name?.trim();
  if (name) {
    return `${name} - CraftCV.pdf`;
  }
  return "CraftCV.pdf";
}

const handleDownloadPDF = async (data: CVData, elementId: string) => {
  try {
    toast.loading("Generating PDF...", { id: "pdf-gen" });
    await loadHtml2Pdf();
    const element = document.getElementById(elementId);
    if (!element) throw new Error("CV element not found");

    const opt = {
      margin: [10, 10, 10, 10],
      filename: getFileName(data),
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
    };

    await window.html2pdf().set(opt).from(element).save();
    toast.success("PDF downloaded!", { id: "pdf-gen" });
  } catch (err) {
    console.error(err);
    toast.error("Failed to generate PDF", { id: "pdf-gen" });
  }
};

const CVPreview = ({ data, onSave, showSave = false, showDownload = false, highlightedSections, previewId }: {
  data: CVData;
  onSave?: () => void;
  showSave?: boolean;
  showDownload?: boolean;
  highlightedSections?: string[];
  previewId?: string;
}) => {
  const { personal, experience, education, skills } = data;
  const completeness = calcCompleteness(data);
  const hasContent = personal.name || experience.length > 0 || education.length > 0 || skills.length > 0;
  const isHighlighted = (section: string) => highlightedSections?.includes(section);
  const elId = previewId || "cv-preview-content";

  return (
    <div className="flex flex-col h-full">
      {/* Progress bar */}
      {showSave && (
        <div className="mb-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>CV Completeness</span>
            <span className="font-semibold text-primary">{completeness}%</span>
          </div>
          <Progress value={completeness} className="h-2" />
        </div>
      )}

      {/* Preview content */}
      <div className="flex-1 bg-card rounded-2xl border border-border p-6 md:p-8 overflow-y-auto min-h-0">
        {!hasContent ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-20">
            <FileText className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-sm">Start chatting or uploading to see your CV here.</p>
          </div>
        ) : (
          <div id={elId} className="space-y-5 text-sm">
            {personal.name && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                className={`border-b border-border pb-4 ${isHighlighted("personal") ? "bg-primary/5 -mx-4 px-4 rounded-xl" : ""}`}
              >
                <h2 className="text-2xl font-bold tracking-tight">{personal.name}</h2>
                {personal.title && <p className="text-primary font-medium mt-1">{personal.title}</p>}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-muted-foreground text-xs">
                  {personal.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{personal.email}</span>}
                  {personal.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{personal.phone}</span>}
                  {personal.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{personal.location}</span>}
                  {personal.website && <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{personal.website}</span>}
                </div>
                {personal.summary && <p className="mt-4 text-foreground/80 leading-relaxed text-pretty">{personal.summary}</p>}
              </motion.div>
            )}
            {experience.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
                className={isHighlighted("experience") ? "bg-primary/5 -mx-4 px-4 py-2 rounded-xl" : ""}
              >
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Experience</h3>
                <div className="space-y-4">
                  {experience.map((e) => (
                    <div key={e.id}>
                      <div className="flex items-start justify-between">
                        <div>
                          {e.role && <p className="font-semibold">{e.role}</p>}
                          {e.company && <p className="text-muted-foreground">{e.company}</p>}
                        </div>
                        {(e.startDate || e.endDate) && (
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
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
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
                className={isHighlighted("education") ? "bg-primary/5 -mx-4 px-4 py-2 rounded-xl" : ""}
              >
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Education</h3>
                <div className="space-y-3">
                  {education.map((e) => (
                    <div key={e.id} className="flex items-start justify-between">
                      <div>
                        {e.degree && <p className="font-semibold">{e.degree}</p>}
                        {e.school && <p className="text-muted-foreground">{e.school}</p>}
                      </div>
                      {e.endDate && <span className="text-xs text-muted-foreground whitespace-nowrap">{e.endDate}</span>}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
            {skills.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}
                className={isHighlighted("skills") ? "bg-primary/5 -mx-4 px-4 py-2 rounded-xl" : ""}
              >
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s, i) => <span key={i} className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium">{s}</span>)}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Download PDF button */}
      {showDownload && hasContent && (
        <button
          onClick={() => handleDownloadPDF(data, elId)}
          className="mt-4 w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl text-sm font-semibold transition-all duration-300 hover:brightness-110 active:scale-[0.97]"
        >
          <Download className="w-4 h-4" /> Download PDF
        </button>
      )}

      {/* Save button */}
      {showSave && completeness >= 60 && onSave && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={onSave}
          className="mt-4 w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl text-sm font-semibold transition-all duration-300 hover:brightness-110 active:scale-[0.97]"
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
  );
};

export default CVPreview;
