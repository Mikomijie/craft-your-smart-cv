import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Mail, Phone, MapPin, Globe, Download, Linkedin, Github, Award, FolderOpen, Trophy, Layout } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { CVData } from "./types";
import { toast } from "sonner";

export type TemplateId = "modern" | "classic" | "minimal";

const TEMPLATES: { id: TemplateId; label: string }[] = [
  { id: "modern", label: "Modern" },
  { id: "classic", label: "Classic" },
  { id: "minimal", label: "Minimal" },
];

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

// ═══ PDF HTML Builders per template ═══

function buildModernPdfHtml(data: CVData): string {
  const { personal, experience, education, skills, projects, certifications, extracurriculars } = data;
  const name = cleanNameForOutput(personal.name || "");
  const sH = (t: string) => `<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#2563eb;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #e5e7eb;">${t}</div>`;

  const contactParts: string[] = [];
  if (personal.email) contactParts.push(`<span style="font-size:11px;color:#555;">${personal.email}</span>`);
  if (personal.phone) contactParts.push(`<span style="font-size:11px;color:#555;">${personal.phone}</span>`);
  if (personal.location) contactParts.push(`<span style="font-size:11px;color:#555;">${personal.location}</span>`);
  if (personal.linkedin) contactParts.push(`<span style="font-size:11px;color:#555;">${personal.linkedin}</span>`);
  if (personal.github) contactParts.push(`<span style="font-size:11px;color:#555;">${personal.github}</span>`);

  let expH = "";
  if (experience.length > 0) {
    expH = sH("Experience");
    for (const e of experience) {
      expH += `<div style="margin-bottom:12px;">`;
      expH += `<div style="display:flex;justify-content:space-between;align-items:baseline;">`;
      expH += `<div>`;
      if (e.role) expH += `<div style="font-size:13px;font-weight:700;color:#111;">${e.role}</div>`;
      if (e.company) expH += `<div style="font-size:12px;color:#666;">${e.company}</div>`;
      expH += `</div>`;
      if (e.startDate || e.endDate) expH += `<div style="font-size:10px;color:#888;white-space:nowrap;">${e.startDate ? e.startDate + " — " : ""}${e.endDate || "Present"}</div>`;
      expH += `</div>`;
      if (e.description) {
        for (const b of e.description.split("\n").filter(l => l.trim())) {
          expH += `<div style="font-size:11px;color:#444;margin-top:3px;padding-left:8px;">${b.startsWith("•") ? b : "• " + b}</div>`;
        }
      }
      expH += `</div>`;
    }
  }

  let eduH = "";
  if (education.length > 0) {
    eduH = sH("Education");
    for (const e of education) {
      eduH += `<div style="margin-bottom:8px;">`;
      if (e.degree) eduH += `<div style="font-size:12px;font-weight:700;color:#111;">${e.degree}</div>`;
      if (e.school) eduH += `<div style="font-size:11px;color:#666;">${e.school}</div>`;
      if (e.endDate) eduH += `<div style="font-size:10px;color:#888;">${e.endDate}</div>`;
      eduH += `</div>`;
    }
  }

  let projH = "";
  if (projects.length > 0) {
    projH = sH("Projects");
    for (const p of projects) {
      projH += `<div style="margin-bottom:10px;">`;
      projH += `<div style="font-size:12px;font-weight:700;color:#111;">${p.name}</div>`;
      if (p.description) projH += `<div style="font-size:11px;color:#444;margin-top:2px;">${p.description}</div>`;
      if (p.techStack.length > 0) {
        projH += `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;">`;
        for (const t of p.techStack) projH += `<span style="display:inline-block;padding:2px 8px;background:#f0fdf4;color:#16a34a;font-size:9px;font-weight:600;border-radius:4px;">${t}</span>`;
        projH += `</div>`;
      }
      if (p.link) projH += `<div style="font-size:10px;color:#2563eb;margin-top:2px;">${p.link}</div>`;
      projH += `</div>`;
    }
  }

  let skillsH = "";
  if (skills.length > 0) {
    skillsH = sH("Skills");
    skillsH += `<div style="display:flex;flex-wrap:wrap;gap:5px;">`;
    for (const s of skills) skillsH += `<span style="display:inline-block;padding:3px 10px;background:#eff6ff;color:#2563eb;font-size:10px;font-weight:600;border-radius:6px;">${s}</span>`;
    skillsH += `</div>`;
  }

  let certH = "";
  if (certifications.length > 0) {
    certH = sH("Certifications");
    for (const c of certifications) {
      certH += `<div style="margin-bottom:6px;"><div style="font-size:11px;font-weight:600;color:#111;">${c.name}</div>`;
      if (c.issuer) certH += `<div style="font-size:10px;color:#666;">${c.issuer}${c.date ? " • " + c.date : ""}</div>`;
      certH += `</div>`;
    }
  }

  let contactSidebar = "";
  if (contactParts.length > 0) {
    contactSidebar = sH("Contact");
    if (personal.email) contactSidebar += `<div style="font-size:11px;color:#444;margin-bottom:4px;">📧 ${personal.email}</div>`;
    if (personal.phone) contactSidebar += `<div style="font-size:11px;color:#444;margin-bottom:4px;">📱 ${personal.phone}</div>`;
    if (personal.location) contactSidebar += `<div style="font-size:11px;color:#444;margin-bottom:4px;">📍 ${personal.location}</div>`;
    if (personal.linkedin) contactSidebar += `<div style="font-size:11px;color:#444;margin-bottom:4px;">🔗 ${personal.linkedin}</div>`;
    if (personal.github) contactSidebar += `<div style="font-size:11px;color:#444;margin-bottom:4px;">💻 ${personal.github}</div>`;
  }

  let extraH = "";
  if (extracurriculars.length > 0) {
    extraH = sH("Extracurriculars");
    for (const e of extracurriculars) extraH += `<div style="font-size:11px;color:#444;margin-bottom:3px;">• ${e}</div>`;
  }

  return `<div style="font-family:Arial,Helvetica,sans-serif;color:#111;background:#fff;padding:0;margin:0;width:100%;box-sizing:border-box;">
  <div style="margin-bottom:16px;">
    <div style="font-size:24px;font-weight:800;color:#111;margin-bottom:2px;">${name || "Your Name"}</div>
    ${personal.title ? `<div style="font-size:14px;color:#2563eb;font-weight:600;margin-bottom:8px;">${personal.title}</div>` : ""}
    ${contactParts.length > 0 ? `<div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:8px;">${contactParts.join("")}</div>` : ""}
    <div style="height:2px;background:linear-gradient(90deg,#2563eb,#818cf8);border-radius:2px;"></div>
  </div>
  ${personal.summary ? `<div style="font-size:11px;color:#444;line-height:1.6;margin-bottom:16px;">${personal.summary}</div>` : ""}
  <div style="display:flex;gap:24px;">
    <div style="flex:0 0 65%;max-width:65%;">${expH}${eduH}${projH}</div>
    <div style="flex:0 0 33%;max-width:33%;">${skillsH}${certH}${contactSidebar ? `<div style="margin-top:16px;">${contactSidebar}</div>` : ""}${extraH ? `<div style="margin-top:16px;">${extraH}</div>` : ""}</div>
  </div></div>`;
}

function buildClassicPdfHtml(data: CVData): string {
  const { personal, experience, education, skills, projects, certifications, extracurriculars } = data;
  const name = cleanNameForOutput(personal.name || "");
  const sH = (t: string) => `<div style="font-size:13px;font-weight:700;font-family:Georgia,serif;text-transform:uppercase;letter-spacing:1px;color:#333;margin-bottom:6px;padding-bottom:4px;border-bottom:2px solid #333;">${t}</div>`;

  let contactLine = [personal.email, personal.phone, personal.location, personal.linkedin, personal.github].filter(Boolean).join("  |  ");

  let expH = "";
  if (experience.length > 0) {
    expH = sH("Professional Experience");
    for (const e of experience) {
      expH += `<div style="margin-bottom:14px;">`;
      expH += `<div style="display:flex;justify-content:space-between;"><div style="font-size:13px;font-weight:700;font-family:Georgia,serif;color:#111;">${e.role || ""}</div>`;
      if (e.startDate || e.endDate) expH += `<div style="font-size:11px;color:#666;font-style:italic;">${e.startDate ? e.startDate + " – " : ""}${e.endDate || "Present"}</div>`;
      expH += `</div>`;
      if (e.company) expH += `<div style="font-size:12px;color:#555;font-style:italic;">${e.company}</div>`;
      if (e.description) {
        for (const b of e.description.split("\n").filter(l => l.trim())) {
          expH += `<div style="font-size:11px;color:#444;margin-top:3px;padding-left:16px;text-indent:-8px;">${b.startsWith("•") ? b : "• " + b}</div>`;
        }
      }
      expH += `</div>`;
    }
  }

  let eduH = "";
  if (education.length > 0) {
    eduH = sH("Education");
    for (const e of education) {
      eduH += `<div style="margin-bottom:8px;display:flex;justify-content:space-between;">`;
      eduH += `<div><div style="font-size:12px;font-weight:700;font-family:Georgia,serif;color:#111;">${e.degree || ""}</div>`;
      if (e.school) eduH += `<div style="font-size:11px;color:#555;font-style:italic;">${e.school}</div>`;
      eduH += `</div>`;
      if (e.endDate) eduH += `<div style="font-size:11px;color:#666;font-style:italic;">${e.endDate}</div>`;
      eduH += `</div>`;
    }
  }

  let skillsH = "";
  if (skills.length > 0) {
    skillsH = sH("Skills");
    skillsH += `<div style="font-size:11px;color:#444;line-height:1.8;">${skills.join("  •  ")}</div>`;
  }

  let projH = "";
  if (projects.length > 0) {
    projH = sH("Projects");
    for (const p of projects) {
      projH += `<div style="margin-bottom:8px;"><div style="font-size:12px;font-weight:700;font-family:Georgia,serif;color:#111;">${p.name}</div>`;
      if (p.description) projH += `<div style="font-size:11px;color:#444;margin-top:2px;">${p.description}</div>`;
      projH += `</div>`;
    }
  }

  let certH = "";
  if (certifications.length > 0) {
    certH = sH("Certifications");
    for (const c of certifications) {
      certH += `<div style="font-size:11px;color:#444;margin-bottom:4px;">${c.name}${c.issuer ? " — " + c.issuer : ""}${c.date ? " (" + c.date + ")" : ""}</div>`;
    }
  }

  let extraH = "";
  if (extracurriculars.length > 0) {
    extraH = sH("Activities");
    for (const e of extracurriculars) extraH += `<div style="font-size:11px;color:#444;margin-bottom:3px;">• ${e}</div>`;
  }

  return `<div style="font-family:Georgia,'Times New Roman',serif;color:#111;background:#fff;padding:0;margin:0;width:100%;">
  <div style="text-align:center;margin-bottom:16px;padding-bottom:12px;border-bottom:3px double #333;">
    <div style="font-size:26px;font-weight:700;letter-spacing:2px;color:#111;">${name || "Your Name"}</div>
    ${personal.title ? `<div style="font-size:14px;color:#555;font-style:italic;margin-top:4px;">${personal.title}</div>` : ""}
    ${contactLine ? `<div style="font-size:10px;color:#777;margin-top:8px;">${contactLine}</div>` : ""}
  </div>
  ${personal.summary ? `<div style="font-size:11px;color:#444;line-height:1.7;margin-bottom:16px;font-style:italic;">${personal.summary}</div>` : ""}
  ${expH}${eduH}${skillsH}${projH}${certH}${extraH}</div>`;
}

function buildMinimalPdfHtml(data: CVData): string {
  const { personal, experience, education, skills, projects, certifications, extracurriculars } = data;
  const name = cleanNameForOutput(personal.name || "");
  const sH = (t: string) => `<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:3px;color:#999;margin-bottom:8px;margin-top:20px;">${t}</div>`;

  let contactLine = [personal.email, personal.phone, personal.location].filter(Boolean).join("  ·  ");
  let linksLine = [personal.linkedin, personal.github, personal.website].filter(Boolean).join("  ·  ");

  let expH = "";
  if (experience.length > 0) {
    expH = sH("Experience");
    for (const e of experience) {
      expH += `<div style="margin-bottom:14px;">`;
      expH += `<div style="font-size:12px;font-weight:600;color:#111;">${e.role || ""}${e.company ? " — " + e.company : ""}</div>`;
      if (e.startDate || e.endDate) expH += `<div style="font-size:10px;color:#999;margin-top:2px;">${e.startDate ? e.startDate + " – " : ""}${e.endDate || "Present"}</div>`;
      if (e.description) {
        for (const b of e.description.split("\n").filter(l => l.trim())) {
          expH += `<div style="font-size:11px;color:#555;margin-top:3px;">${b.startsWith("•") ? b : "• " + b}</div>`;
        }
      }
      expH += `</div>`;
    }
  }

  let eduH = "";
  if (education.length > 0) {
    eduH = sH("Education");
    for (const e of education) {
      eduH += `<div style="margin-bottom:6px;font-size:11px;color:#444;">${e.degree || ""}${e.school ? " — " + e.school : ""}${e.endDate ? " (" + e.endDate + ")" : ""}</div>`;
    }
  }

  let skillsH = "";
  if (skills.length > 0) {
    skillsH = sH("Skills");
    skillsH += `<div style="font-size:11px;color:#555;">${skills.join("  ·  ")}</div>`;
  }

  let projH = "";
  if (projects.length > 0) {
    projH = sH("Projects");
    for (const p of projects) {
      projH += `<div style="margin-bottom:6px;"><div style="font-size:11px;color:#111;font-weight:600;">${p.name}</div>`;
      if (p.description) projH += `<div style="font-size:11px;color:#555;">${p.description}</div>`;
      projH += `</div>`;
    }
  }

  let certH = "";
  if (certifications.length > 0) {
    certH = sH("Certifications");
    for (const c of certifications) certH += `<div style="font-size:11px;color:#555;margin-bottom:3px;">${c.name}${c.issuer ? " — " + c.issuer : ""}</div>`;
  }

  let extraH = "";
  if (extracurriculars.length > 0) {
    extraH = sH("Activities");
    for (const e of extracurriculars) extraH += `<div style="font-size:11px;color:#555;margin-bottom:3px;">${e}</div>`;
  }

  return `<div style="font-family:Helvetica,Arial,sans-serif;color:#111;background:#fff;padding:0;margin:0;width:100%;max-width:600px;">
  <div style="margin-bottom:20px;">
    <div style="font-size:28px;font-weight:300;letter-spacing:1px;color:#111;">${name || "Your Name"}</div>
    ${personal.title ? `<div style="font-size:13px;color:#999;font-weight:400;margin-top:4px;">${personal.title}</div>` : ""}
    ${contactLine ? `<div style="font-size:10px;color:#999;margin-top:8px;">${contactLine}</div>` : ""}
    ${linksLine ? `<div style="font-size:10px;color:#999;margin-top:2px;">${linksLine}</div>` : ""}
  </div>
  ${personal.summary ? `<div style="font-size:11px;color:#555;line-height:1.7;margin-bottom:12px;">${personal.summary}</div>` : ""}
  <div style="height:1px;background:#eee;margin-bottom:8px;"></div>
  ${expH}${eduH}${skillsH}${projH}${certH}${extraH}</div>`;
}

const buildPdfHtml = (data: CVData, template: TemplateId): string => {
  switch (template) {
    case "classic": return buildClassicPdfHtml(data);
    case "minimal": return buildMinimalPdfHtml(data);
    default: return buildModernPdfHtml(data);
  }
};

const handleDownloadPDF = async (previewElement: HTMLElement | null, data: CVData, template: TemplateId) => {
  try {
    if (!data.personal.name && data.experience.length === 0 && data.skills.length === 0) {
      toast.error("CV is empty — add some content first");
      return;
    }

    if (!previewElement) {
      toast.error("Preview not ready yet — please try again");
      return;
    }

    toast.loading("Generating PDF...", { id: "pdf-gen" });
    await loadHtml2Pdf();

    const exportNode = previewElement.cloneNode(true) as HTMLElement;
    exportNode.querySelectorAll("[data-export-hide='true']").forEach((node) => node.remove());
    exportNode.querySelectorAll("[style*='transform'], [style*='opacity']").forEach((node) => {
      const el = node as HTMLElement;
      el.style.transform = "none";
      el.style.opacity = "1";
      el.style.filter = "none";
    });

    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "0";
    container.style.top = "0";
    container.style.width = "794px";
    container.style.padding = "32px";
    container.style.background = "#ffffff";
    container.style.zIndex = "-9999";
    container.style.pointerEvents = "none";
    container.style.boxSizing = "border-box";
    exportNode.style.height = "auto";
    exportNode.style.maxHeight = "none";
    exportNode.style.overflow = "visible";
    container.appendChild(exportNode);
    document.body.appendChild(container);

    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));

    const opt = {
      margin: [0, 0, 0, 0],
      filename: getFileName(data),
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true, backgroundColor: "#ffffff" },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
      pagebreak: { mode: ["css", "legacy"] },
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
  const [template, setTemplate] = useState<TemplateId>("modern");
  const previewRef = useRef<HTMLDivElement>(null);
  const { personal, experience, education, skills, projects, certifications, extracurriculars } = data;
  const completeness = calcCompleteness(data);
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

      <div ref={previewRef} className={`flex-1 rounded-2xl border border-border p-6 md:p-8 overflow-y-auto min-h-0 ${
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
        <div className="flex gap-2 mt-4">
          {showDownload && (
            <button
              onClick={() => handleDownloadPDF(previewRef.current, data, template)}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl text-sm font-semibold transition-all duration-300 hover:brightness-110 active:scale-[0.97]"
            >
              <Download className="w-4 h-4" /> Download PDF
            </button>
          )}
          {showSave && completeness >= 40 && onSave && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={onSave}
              className={`${showDownload ? "flex-1" : "w-full"} flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl text-sm font-semibold transition-all duration-300 hover:brightness-110 active:scale-[0.97]`}
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
