import { motion } from "framer-motion";
import { FileText, Mail, Phone, MapPin, Globe, Download, Linkedin, Github, Award, FolderOpen, Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { CVData } from "./types";
import { toast } from "sonner";

function calcCompleteness(data: CVData): number {
  let score = 0;
  const p = data.personal;
  if (p.name) score += 12;
  if (p.title) score += 8;
  if (p.email) score += 8;
  if (p.phone) score += 4;
  if (p.summary) score += 12;
  if (data.experience.length > 0) score += 20;
  if (data.education.length > 0) score += 10;
  if (data.skills.length > 0) score += 10;
  if (data.projects.length > 0) score += 8;
  if (data.certifications.length > 0) score += 4;
  if (p.linkedin || p.github) score += 4;
  return Math.min(score, 100);
}

declare global {
  interface Window { html2pdf: any; }
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

function cleanNameForOutput(name: string): string {
  return name.replace(/\s+\b(and|i|the|a|an|is|am|was|im|or|but|to|for|my|me|at|in)\s*$/i, "").trim();
}

function getFileName(data: CVData): string {
  const name = cleanNameForOutput(data.personal.name?.trim() || "");
  return name ? `${name} - CraftCV.pdf` : "CraftCV.pdf";
}

function buildPdfHtml(data: CVData): string {
  const { personal, experience, education, skills, projects, certifications, extracurriculars } = data;
  const name = cleanNameForOutput(personal.name || "");

  const sectionHeader = (title: string) =>
    `<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#2563eb;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #e5e7eb;">${title}</div>`;

  const contactParts: string[] = [];
  if (personal.email) contactParts.push(`<span style="font-size:11px;color:#555;">${personal.email}</span>`);
  if (personal.phone) contactParts.push(`<span style="font-size:11px;color:#555;">${personal.phone}</span>`);
  if (personal.location) contactParts.push(`<span style="font-size:11px;color:#555;">${personal.location}</span>`);
  if (personal.linkedin) contactParts.push(`<span style="font-size:11px;color:#555;">${personal.linkedin}</span>`);
  if (personal.github) contactParts.push(`<span style="font-size:11px;color:#555;">${personal.github}</span>`);

  let expHtml = "";
  if (experience.length > 0) {
    expHtml = sectionHeader("Experience");
    for (const e of experience) {
      expHtml += `<div style="margin-bottom:12px;">`;
      expHtml += `<div style="display:flex;justify-content:space-between;align-items:baseline;">`;
      expHtml += `<div>`;
      if (e.role) expHtml += `<div style="font-size:13px;font-weight:700;color:#111;">${e.role}</div>`;
      if (e.company) expHtml += `<div style="font-size:12px;color:#666;">${e.company}</div>`;
      expHtml += `</div>`;
      if (e.startDate || e.endDate) {
        expHtml += `<div style="font-size:10px;color:#888;white-space:nowrap;">${e.startDate ? e.startDate + " — " : ""}${e.endDate || "Present"}</div>`;
      }
      expHtml += `</div>`;
      if (e.description) {
        const bullets = e.description.split("\n").filter(l => l.trim());
        for (const b of bullets) {
          const bulletText = b.startsWith("•") ? b : `• ${b}`;
          expHtml += `<div style="font-size:11px;color:#444;margin-top:3px;padding-left:8px;">${bulletText}</div>`;
        }
      }
      expHtml += `</div>`;
    }
  }

  let eduHtml = "";
  if (education.length > 0) {
    eduHtml = sectionHeader("Education");
    for (const e of education) {
      eduHtml += `<div style="margin-bottom:8px;">`;
      if (e.degree) eduHtml += `<div style="font-size:12px;font-weight:700;color:#111;">${e.degree}</div>`;
      if (e.school) eduHtml += `<div style="font-size:11px;color:#666;">${e.school}</div>`;
      if (e.endDate) eduHtml += `<div style="font-size:10px;color:#888;">${e.endDate}</div>`;
      eduHtml += `</div>`;
    }
  }

  let projHtml = "";
  if (projects.length > 0) {
    projHtml = sectionHeader("Projects");
    for (const p of projects) {
      projHtml += `<div style="margin-bottom:10px;">`;
      projHtml += `<div style="font-size:12px;font-weight:700;color:#111;">${p.name}</div>`;
      if (p.description) projHtml += `<div style="font-size:11px;color:#444;margin-top:2px;">${p.description}</div>`;
      if (p.techStack.length > 0) {
        projHtml += `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;">`;
        for (const t of p.techStack) {
          projHtml += `<span style="display:inline-block;padding:2px 8px;background:#f0fdf4;color:#16a34a;font-size:9px;font-weight:600;border-radius:4px;">${t}</span>`;
        }
        projHtml += `</div>`;
      }
      if (p.link) projHtml += `<div style="font-size:10px;color:#2563eb;margin-top:2px;">${p.link}</div>`;
      projHtml += `</div>`;
    }
  }

  let skillsHtml = "";
  if (skills.length > 0) {
    skillsHtml = sectionHeader("Skills");
    skillsHtml += `<div style="display:flex;flex-wrap:wrap;gap:5px;">`;
    for (const s of skills) {
      skillsHtml += `<span style="display:inline-block;padding:3px 10px;background:#eff6ff;color:#2563eb;font-size:10px;font-weight:600;border-radius:6px;">${s}</span>`;
    }
    skillsHtml += `</div>`;
  }

  let certHtml = "";
  if (certifications.length > 0) {
    certHtml = sectionHeader("Certifications");
    for (const c of certifications) {
      certHtml += `<div style="margin-bottom:6px;">`;
      certHtml += `<div style="font-size:11px;font-weight:600;color:#111;">${c.name}</div>`;
      if (c.issuer) certHtml += `<div style="font-size:10px;color:#666;">${c.issuer}${c.date ? ` • ${c.date}` : ""}</div>`;
      certHtml += `</div>`;
    }
  }

  let contactSidebar = "";
  if (contactParts.length > 0) {
    contactSidebar = sectionHeader("Contact");
    if (personal.email) contactSidebar += `<div style="font-size:11px;color:#444;margin-bottom:4px;">📧 ${personal.email}</div>`;
    if (personal.phone) contactSidebar += `<div style="font-size:11px;color:#444;margin-bottom:4px;">📱 ${personal.phone}</div>`;
    if (personal.location) contactSidebar += `<div style="font-size:11px;color:#444;margin-bottom:4px;">📍 ${personal.location}</div>`;
    if (personal.linkedin) contactSidebar += `<div style="font-size:11px;color:#444;margin-bottom:4px;">🔗 ${personal.linkedin}</div>`;
    if (personal.github) contactSidebar += `<div style="font-size:11px;color:#444;margin-bottom:4px;">💻 ${personal.github}</div>`;
  }

  let extraHtml = "";
  if (extracurriculars.length > 0) {
    extraHtml = sectionHeader("Extracurriculars");
    for (const e of extracurriculars) {
      extraHtml += `<div style="font-size:11px;color:#444;margin-bottom:3px;">• ${e}</div>`;
    }
  }

  return `
<div style="font-family:Arial,Helvetica,sans-serif;color:#111;background:#fff;padding:0;margin:0;width:100%;box-sizing:border-box;">
  <div style="margin-bottom:16px;">
    <div style="font-size:24px;font-weight:800;color:#111;margin-bottom:2px;">${name || "Your Name"}</div>
    ${personal.title ? `<div style="font-size:14px;color:#2563eb;font-weight:600;margin-bottom:8px;">${personal.title}</div>` : ""}
    ${contactParts.length > 0 ? `<div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:8px;">${contactParts.join("")}</div>` : ""}
    <div style="height:2px;background:linear-gradient(90deg,#2563eb,#818cf8);border-radius:2px;"></div>
  </div>
  ${personal.summary ? `<div style="font-size:11px;color:#444;line-height:1.6;margin-bottom:16px;">${personal.summary}</div>` : ""}
  <div style="display:flex;gap:24px;">
    <div style="flex:0 0 65%;max-width:65%;">
      ${expHtml}
      ${eduHtml}
      ${projHtml}
    </div>
    <div style="flex:0 0 33%;max-width:33%;">
      ${skillsHtml}
      ${certHtml}
      ${contactSidebar ? `<div style="margin-top:16px;">${contactSidebar}</div>` : ""}
      ${extraHtml ? `<div style="margin-top:16px;">${extraHtml}</div>` : ""}
    </div>
  </div>
</div>`;
}

const handleDownloadPDF = async (data: CVData) => {
  try {
    const htmlContent = buildPdfHtml(data);
    if (!data.personal.name && data.experience.length === 0 && data.skills.length === 0) {
      toast.error("CV is empty — add some content first");
      return;
    }
    toast.loading("Generating PDF...", { id: "pdf-gen" });
    await loadHtml2Pdf();
    const container = document.createElement("div");
    container.innerHTML = htmlContent;
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "0";
    container.style.width = "210mm";
    document.body.appendChild(container);
    const opt = {
      margin: [18, 18, 18, 18],
      filename: getFileName(data),
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true, width: container.scrollWidth },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
    };
    await window.html2pdf().set(opt).from(container).save();
    document.body.removeChild(container);
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
  const { personal, experience, education, skills, projects, certifications, extracurriculars } = data;
  const completeness = calcCompleteness(data);
  const hasContent = personal.name || experience.length > 0 || education.length > 0 || skills.length > 0;
  const isHighlighted = (section: string) => highlightedSections?.includes(section);

  return (
    <div className="flex flex-col h-full">
      {showSave && (
        <div className="mb-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>CV Completeness</span>
            <span className="font-semibold text-primary">{completeness}%</span>
          </div>
          <Progress value={completeness} className="h-2" />
        </div>
      )}

      <div className="flex-1 bg-card rounded-2xl border border-border p-6 md:p-8 overflow-y-auto min-h-0">
        {!hasContent ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-20">
            <FileText className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-sm">Start chatting to see your CV here.</p>
          </div>
        ) : (
          <div className="space-y-5 text-sm">
            {personal.name && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                className={`border-b border-border pb-4 ${isHighlighted("personal") ? "bg-primary/5 -mx-4 px-4 rounded-xl" : ""}`}
              >
                <h2 className="text-2xl font-bold tracking-tight">{cleanNameForOutput(personal.name)}</h2>
                {personal.title && <p className="text-primary font-medium mt-1">{personal.title}</p>}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-muted-foreground text-xs">
                  {personal.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{personal.email}</span>}
                  {personal.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{personal.phone}</span>}
                  {personal.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{personal.location}</span>}
                  {personal.linkedin && <span className="flex items-center gap-1"><Linkedin className="w-3 h-3" />{personal.linkedin}</span>}
                  {personal.github && <span className="flex items-center gap-1"><Github className="w-3 h-3" />{personal.github}</span>}
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
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}
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

            {projects.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5" /> Projects
                </h3>
                <div className="space-y-3">
                  {projects.map((p) => (
                    <div key={p.id}>
                      <p className="font-semibold">{p.name}</p>
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
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s, i) => <span key={i} className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium">{s}</span>)}
                </div>
              </motion.div>
            )}

            {extracurriculars.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35 }}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5" /> Extracurriculars
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

      {showDownload && hasContent && (
        <button
          onClick={() => handleDownloadPDF(data)}
          className="mt-4 w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl text-sm font-semibold transition-all duration-300 hover:brightness-110 active:scale-[0.97]"
        >
          <Download className="w-4 h-4" /> Download PDF
        </button>
      )}

      {showSave && completeness >= 40 && onSave && (
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
