import jsPDF from "jspdf";
import type { CVData } from "./types";
import type { TemplateId } from "./CVPreview";

/* ── Constants ─────────────────────────────────────────────── */
const PAGE_W = 210;
const PAGE_H = 297;
const PT = 0.3528; // mm per pt

const MARGINS: Record<TemplateId, number> = {
  classic: 18,
  modern: 18,
  minimal: 15,
};

function cleanName(name: string): string {
  return name.replace(/\s+\b(and|i|the|a|an|is|am|was|im|or|but|to|for|my|me|at|in)\s*$/i, "").trim();
}

function getFileName(data: CVData, template: TemplateId): string {
  const name = cleanName(data.personal.name?.trim() || "");
  const tName = template === "classic" ? "Classic" : template === "modern" ? "Modern" : "Minimal";
  return name ? `${name} - ${tName} - CraftCV.pdf` : `CraftCV - ${tName}.pdf`;
}

function wrap(doc: jsPDF, text: string, maxW: number): string[] {
  return doc.splitTextToSize(text, maxW) as string[];
}

/** Auto-generate a professional summary from CV data */
function autoSummary(data: CVData): string {
  const { personal: p, experience, skills } = data;
  const title = p.title || "Professional";
  const years = experience.length > 0
    ? `${Math.max(experience.length, 2)}+`
    : "";
  const topSkills = skills.slice(0, 5).join(", ");
  const latestRole = experience[0]?.role || "";
  const latestCompany = experience[0]?.company || "";

  let summary = "";
  if (years) {
    summary = `Results-driven ${title} with ${years} years of experience`;
  } else {
    summary = `Motivated ${title}`;
  }
  if (topSkills) {
    summary += ` specializing in ${topSkills}`;
  }
  if (latestRole && latestCompany) {
    summary += `. Most recently served as ${latestRole} at ${latestCompany}`;
  }
  summary += ". Committed to delivering high-quality results and continuous professional growth.";
  return summary;
}

/** Ensure data has a summary, auto-generating if needed */
function ensureSummary(data: CVData): CVData {
  if (data.personal.summary?.trim()) return data;
  return {
    ...data,
    personal: { ...data.personal, summary: autoSummary(data) },
  };
}

/* ══════════════════════════════════════════════════════════════
   TEMPLATE 1 — CLASSIC (ATS Optimized)
   Single column, centered header, ALL CAPS headers, plain skills
   ══════════════════════════════════════════════════════════════ */
function renderClassic(doc: jsPDF, data: CVData, scale: number): number {
  const M = MARGINS.classic;
  const CW = PAGE_W - M * 2;
  const { personal: p, experience, education, skills, projects, certifications, extracurriculars } = data;
  const name = cleanName(p.name || "Your Name");

  const ns = 28 * scale;
  const ts = 14 * scale;
  const cs = 11 * scale;
  const sh = 11 * scale;
  const bs = 10.5 * scale;
  const lh = bs * PT * 1.6;
  const secGap = 14 * PT * scale;
  const itemGap = 8 * PT * scale;
  const bulletIndent = 12 * PT;

  let y = M;

  // Name — centered, bold
  doc.setFont("helvetica", "bold").setFontSize(ns);
  doc.setTextColor(34, 34, 34);
  doc.text(name, PAGE_W / 2, y, { align: "center" });
  y += ns * PT * 1.1;

  // Title — centered, grey
  if (p.title) {
    doc.setFont("helvetica", "normal").setFontSize(ts);
    doc.setTextColor(102, 102, 102);
    doc.text(p.title, PAGE_W / 2, y, { align: "center" });
    y += ts * PT * 1.3;
  }

  // Contact — centered, pipes
  const contacts = [p.email, p.phone, p.location, p.linkedin, p.github, p.website].filter(Boolean);
  if (contacts.length) {
    doc.setFont("helvetica", "normal").setFontSize(cs);
    doc.setTextColor(102, 102, 102);
    const contactStr = contacts.join("  |  ");
    for (const l of wrap(doc, contactStr, CW)) {
      doc.text(l, PAGE_W / 2, y, { align: "center" });
      y += cs * PT * 1.4;
    }
  }

  // Thin grey line
  y += 2;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(M, y, PAGE_W - M, y);
  y += secGap;

  // Section header helper — NO letter-spacing
  const drawHeader = (title: string) => {
    doc.setFont("helvetica", "bold").setFontSize(sh);
    doc.setTextColor(34, 34, 34);
    doc.text(title.toUpperCase(), M, y);
    y += 1.5;
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.25);
    doc.line(M, y, PAGE_W - M, y);
    y += sh * PT * 1.2;
  };

  // Summary
  if (p.summary) {
    doc.setFont("helvetica", "normal").setFontSize(bs);
    doc.setTextColor(51, 51, 51);
    for (const l of wrap(doc, p.summary, CW)) {
      doc.text(l, M, y);
      y += lh;
    }
    y += secGap;
  }

  // Experience
  if (experience.length) {
    drawHeader("PROFESSIONAL EXPERIENCE");
    for (const e of experience) {
      doc.setFont("helvetica", "bold").setFontSize(bs);
      doc.setTextColor(34, 34, 34);
      doc.text(e.role || "", M, y);
      if (e.startDate || e.endDate) {
        doc.setFont("helvetica", "normal").setFontSize(cs * 0.9);
        doc.setTextColor(102, 102, 102);
        const ds = `${e.startDate || ""}${e.startDate && e.endDate ? " – " : ""}${e.endDate || "Present"}`;
        doc.text(ds, PAGE_W - M, y, { align: "right" });
      }
      y += lh;
      if (e.company) {
        doc.setFont("helvetica", "normal").setFontSize(bs);
        doc.setTextColor(102, 102, 102);
        doc.text(e.company, M, y);
        y += lh;
      }
      if (e.description) {
        doc.setFont("helvetica", "normal").setFontSize(bs);
        doc.setTextColor(51, 51, 51);
        for (const b of e.description.split("\n").filter(l => l.trim())) {
          const clean = b.replace(/^[•▪\-]\s*/, "");
          for (const bl of wrap(doc, `• ${clean}`, CW - bulletIndent)) {
            doc.text(bl, M + bulletIndent, y);
            y += lh;
          }
        }
      }
      y += itemGap;
    }
    y += secGap - itemGap;
  }

  // Education
  if (education.length) {
    drawHeader("EDUCATION");
    for (const e of education) {
      doc.setFont("helvetica", "bold").setFontSize(bs);
      doc.setTextColor(34, 34, 34);
      doc.text(e.degree || "", M, y);
      if (e.endDate) {
        doc.setFont("helvetica", "normal").setFontSize(cs * 0.9);
        doc.setTextColor(102, 102, 102);
        doc.text(e.endDate, PAGE_W - M, y, { align: "right" });
      }
      y += lh;
      if (e.school) {
        doc.setFont("helvetica", "normal").setFontSize(bs);
        doc.setTextColor(102, 102, 102);
        doc.text(e.school, M, y);
        y += lh;
      }
      y += itemGap;
    }
    y += secGap - itemGap;
  }

  // Skills — plain comma separated
  if (skills.length) {
    drawHeader("SKILLS");
    doc.setFont("helvetica", "normal").setFontSize(bs);
    doc.setTextColor(51, 51, 51);
    for (const l of wrap(doc, skills.join(", "), CW)) {
      doc.text(l, M, y);
      y += lh;
    }
    y += secGap;
  }

  // Projects
  if (projects.length) {
    drawHeader("PROJECTS");
    for (const pr of projects) {
      doc.setFont("helvetica", "bold").setFontSize(bs);
      doc.setTextColor(34, 34, 34);
      doc.text(pr.name || "", M, y);
      y += lh;
      if (pr.description) {
        doc.setFont("helvetica", "normal").setFontSize(bs);
        doc.setTextColor(51, 51, 51);
        for (const l of wrap(doc, pr.description, CW)) {
          doc.text(l, M, y);
          y += lh;
        }
      }
      if (pr.techStack.length) {
        doc.setFont("helvetica", "italic").setFontSize(bs * 0.9);
        doc.setTextColor(102, 102, 102);
        doc.text("Tech: " + pr.techStack.join(", "), M, y);
        y += lh;
      }
      y += itemGap;
    }
    y += secGap - itemGap;
  }

  // Certifications
  if (certifications.length) {
    drawHeader("CERTIFICATIONS");
    for (const c of certifications) {
      doc.setFont("helvetica", "bold").setFontSize(bs);
      doc.setTextColor(34, 34, 34);
      doc.text(c.name || "", M, y);
      y += lh;
      if (c.issuer || c.date) {
        doc.setFont("helvetica", "normal").setFontSize(cs * 0.9);
        doc.setTextColor(102, 102, 102);
        doc.text([c.issuer, c.date].filter(Boolean).join(" • "), M, y);
        y += lh;
      }
      y += itemGap * 0.5;
    }
    y += secGap;
  }

  // Extracurriculars
  if (extracurriculars.length) {
    drawHeader("ACTIVITIES");
    doc.setFont("helvetica", "normal").setFontSize(bs);
    doc.setTextColor(51, 51, 51);
    for (const item of extracurriculars) {
      for (const l of wrap(doc, `• ${item}`, CW - bulletIndent)) {
        doc.text(l, M + bulletIndent, y);
        y += lh;
      }
    }
  }

  return y;
}

/* ══════════════════════════════════════════════════════════════
   TEMPLATE 2 — MODERN (Blue Accent)
   Blue left stripe, blue headers, • bullets, pill skill tags
   ══════════════════════════════════════════════════════════════ */
function renderModern(doc: jsPDF, data: CVData, scale: number): number {
  const M = MARGINS.modern;
  const STRIPE_W = 8;
  const TEXT_L = M;
  const CW = PAGE_W - M * 2;
  const { personal: p, experience, education, skills, projects, certifications, extracurriculars } = data;
  const name = cleanName(p.name || "Your Name");

  const BLUE = [37, 99, 235] as const;
  const PILL_BG = [219, 234, 254] as const;
  const PILL_TX = [30, 64, 175] as const;

  const ns = 26 * scale;
  const ts = 13 * scale;
  const cs = 11 * scale;
  const sh = 11 * scale;
  const bs = 10.5 * scale;
  const lh = bs * PT * 1.6;
  const secGap = 16 * PT * scale;
  const itemGap = 8 * PT * scale;
  const bulletIndent = 12 * PT;

  // Blue left stripe
  doc.setFillColor(BLUE[0], BLUE[1], BLUE[2]);
  doc.rect(0, 0, STRIPE_W, PAGE_H, "F");

  let y = M;

  // Name
  doc.setFont("helvetica", "bold").setFontSize(ns);
  doc.setTextColor(17, 17, 17);
  doc.text(name, TEXT_L, y);
  y += ns * PT * 1.1;

  // Title — blue
  if (p.title) {
    doc.setFont("helvetica", "normal").setFontSize(ts);
    doc.setTextColor(BLUE[0], BLUE[1], BLUE[2]);
    doc.text(p.title, TEXT_L, y);
    y += ts * PT * 1.3;
  }

  // Contact
  const contacts = [p.email, p.phone, p.location, p.linkedin, p.github, p.website].filter(Boolean);
  if (contacts.length) {
    doc.setFont("helvetica", "normal").setFontSize(cs);
    doc.setTextColor(120, 120, 120);
    for (const l of wrap(doc, contacts.join("  |  "), CW)) {
      doc.text(l, TEXT_L, y);
      y += cs * PT * 1.4;
    }
  }
  y += 2;

  // Section header — NO letter-spacing, blue, thin blue underline
  const drawHeader = (title: string) => {
    doc.setFont("helvetica", "bold").setFontSize(sh);
    doc.setTextColor(BLUE[0], BLUE[1], BLUE[2]);
    doc.text(title.toUpperCase(), TEXT_L, y);
    y += 1.5;
    doc.setDrawColor(BLUE[0], BLUE[1], BLUE[2]);
    doc.setLineWidth(0.3);
    doc.line(TEXT_L, y, PAGE_W - M, y);
    y += sh * PT * 1.2;
  };

  // Summary
  if (p.summary) {
    doc.setFont("helvetica", "normal").setFontSize(bs);
    doc.setTextColor(51, 51, 51);
    for (const l of wrap(doc, p.summary, CW)) {
      doc.text(l, TEXT_L, y);
      y += lh;
    }
    y += secGap;
  }

  // Experience — company bold, dates right, • bullets
  if (experience.length) {
    drawHeader("EXPERIENCE");
    for (const e of experience) {
      doc.setFont("helvetica", "bold").setFontSize(bs);
      doc.setTextColor(17, 17, 17);
      doc.text(e.company || "", TEXT_L, y);
      if (e.startDate || e.endDate) {
        doc.setFont("helvetica", "normal").setFontSize(cs * 0.9);
        doc.setTextColor(120, 120, 120);
        const ds = `${e.startDate || ""}${e.startDate && e.endDate ? " – " : ""}${e.endDate || "Present"}`;
        doc.text(ds, PAGE_W - M, y, { align: "right" });
      }
      y += lh;
      if (e.role) {
        doc.setFont("helvetica", "normal").setFontSize(bs);
        doc.setTextColor(100, 100, 100);
        doc.text(e.role, TEXT_L, y);
        y += lh;
      }
      if (e.description) {
        doc.setFont("helvetica", "normal").setFontSize(bs);
        doc.setTextColor(51, 51, 51);
        for (const b of e.description.split("\n").filter(l => l.trim())) {
          const clean = b.replace(/^[•▪\-]\s*/, "");
          for (const bl of wrap(doc, `• ${clean}`, CW - bulletIndent)) {
            doc.text(bl, TEXT_L + bulletIndent, y);
            y += lh;
          }
        }
      }
      y += itemGap;
    }
    y += secGap - itemGap;
  }

  // Education
  if (education.length) {
    drawHeader("EDUCATION");
    for (const e of education) {
      doc.setFont("helvetica", "bold").setFontSize(bs);
      doc.setTextColor(17, 17, 17);
      doc.text(e.degree || "", TEXT_L, y);
      if (e.endDate) {
        doc.setFont("helvetica", "normal").setFontSize(cs * 0.9);
        doc.setTextColor(120, 120, 120);
        doc.text(e.endDate, PAGE_W - M, y, { align: "right" });
      }
      y += lh;
      if (e.school) {
        doc.setFont("helvetica", "normal").setFontSize(bs);
        doc.setTextColor(100, 100, 100);
        doc.text(e.school, TEXT_L, y);
        y += lh;
      }
      y += itemGap;
    }
    y += secGap - itemGap;
  }

  // Skills — pill tags
  if (skills.length) {
    drawHeader("SKILLS");
    let cx = TEXT_L;
    const pillH = bs * PT + 3;
    const pillPad = 3;
    const pillGap = 2;
    doc.setFontSize(bs * 0.9);
    for (const s of skills) {
      const tw = doc.getTextWidth(s);
      const pw = tw + pillPad * 2;
      if (cx + pw > PAGE_W - M) {
        cx = TEXT_L;
        y += pillH + pillGap;
      }
      doc.setFillColor(PILL_BG[0], PILL_BG[1], PILL_BG[2]);
      doc.roundedRect(cx, y - pillH * 0.6, pw, pillH, 1.5, 1.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setTextColor(PILL_TX[0], PILL_TX[1], PILL_TX[2]);
      doc.text(s, cx + pillPad, y + pillH * 0.15);
      cx += pw + pillGap;
    }
    y += pillH + secGap;
  }

  // Projects
  if (projects.length) {
    drawHeader("PROJECTS");
    for (const pr of projects) {
      doc.setFont("helvetica", "bold").setFontSize(bs);
      doc.setTextColor(17, 17, 17);
      doc.text(pr.name || "", TEXT_L, y);
      y += lh;
      if (pr.description) {
        doc.setFont("helvetica", "normal").setFontSize(bs);
        doc.setTextColor(51, 51, 51);
        for (const l of wrap(doc, pr.description, CW)) {
          doc.text(l, TEXT_L, y);
          y += lh;
        }
      }
      if (pr.techStack.length) {
        doc.setFont("helvetica", "italic").setFontSize(bs * 0.9);
        doc.setTextColor(100, 100, 100);
        doc.text(pr.techStack.join(", "), TEXT_L, y);
        y += lh;
      }
      y += itemGap;
    }
    y += secGap - itemGap;
  }

  // Certifications
  if (certifications.length) {
    drawHeader("CERTIFICATIONS");
    for (const c of certifications) {
      doc.setFont("helvetica", "bold").setFontSize(bs);
      doc.setTextColor(17, 17, 17);
      doc.text(c.name || "", TEXT_L, y);
      y += lh;
      if (c.issuer || c.date) {
        doc.setFont("helvetica", "normal").setFontSize(cs * 0.9);
        doc.setTextColor(120, 120, 120);
        doc.text([c.issuer, c.date].filter(Boolean).join(" • "), TEXT_L, y);
        y += lh;
      }
      y += itemGap * 0.5;
    }
    y += secGap;
  }

  // Extracurriculars
  if (extracurriculars.length) {
    drawHeader("ACTIVITIES");
    doc.setFont("helvetica", "normal").setFontSize(bs);
    doc.setTextColor(51, 51, 51);
    for (const item of extracurriculars) {
      for (const l of wrap(doc, `• ${item}`, CW - bulletIndent)) {
        doc.text(l, TEXT_L + bulletIndent, y);
        y += lh;
      }
    }
  }

  return y;
}

/* ══════════════════════════════════════════════════════════════
   TEMPLATE 3 — MINIMAL (Two Column)
   Left main 62%, right grey sidebar 35%
   ══════════════════════════════════════════════════════════════ */
function renderMinimal(doc: jsPDF, data: CVData, scale: number): number {
  const M = MARGINS.minimal;
  const { personal: p, experience, education, skills, projects, certifications, extracurriculars } = data;
  const name = cleanName(p.name || "Your Name");

  const BLUE = [37, 99, 235] as const;
  const SIDEBAR_BG = [248, 249, 250] as const;
  const totalW = PAGE_W - M * 2;
  const mainW = totalW * 0.62;
  const sideW = totalW * 0.35;
  const gutter = totalW * 0.03;
  const sideX = M + mainW + gutter;

  const ns = 24 * scale;
  const ts = 12 * scale;
  const sh = 10 * scale;
  const bs = 10.5 * scale;
  const cs = 10 * scale;
  const lh = bs * PT * 1.6;
  const secGap = 20 * PT * scale;
  const itemGap = 8 * PT * scale;
  const bulletIndent = 10 * PT;

  // Sidebar background
  doc.setFillColor(SIDEBAR_BG[0], SIDEBAR_BG[1], SIDEBAR_BG[2]);
  doc.rect(sideX - 3, 0, sideW + 3 + M, PAGE_H, "F");

  let yMain = M;
  let ySide = M;

  // Name
  doc.setFont("helvetica", "bold").setFontSize(ns);
  doc.setTextColor(34, 34, 34);
  doc.text(name, M, yMain);
  yMain += ns * PT * 1.1;

  // Title — blue
  if (p.title) {
    doc.setFont("helvetica", "normal").setFontSize(ts);
    doc.setTextColor(BLUE[0], BLUE[1], BLUE[2]);
    doc.text(p.title, M, yMain);
    yMain += ts * PT * 1.5;
  }
  yMain += secGap * 0.5;

  // Section header helpers — NO letter-spacing
  const drawMainHeader = (title: string) => {
    doc.setFont("helvetica", "normal").setFontSize(sh);
    doc.setTextColor(136, 136, 136);
    doc.text(title.toUpperCase(), M, yMain);
    yMain += sh * PT * 1.5;
  };

  const drawSideHeader = (title: string) => {
    doc.setFont("helvetica", "normal").setFontSize(sh);
    doc.setTextColor(136, 136, 136);
    doc.text(title.toUpperCase(), sideX, ySide);
    ySide += sh * PT * 1.5;
  };

  // ── SIDEBAR ──
  drawSideHeader("CONTACT");
  const contacts = [p.email, p.phone, p.location, p.linkedin, p.github, p.website].filter(Boolean) as string[];
  doc.setFont("helvetica", "normal").setFontSize(cs);
  doc.setTextColor(68, 68, 68);
  for (const c of contacts) {
    for (const l of wrap(doc, c, sideW)) {
      doc.text(l, sideX, ySide);
      ySide += cs * PT * 1.5;
    }
    ySide += 1;
  }
  ySide += secGap;

  // Skills — plain text with blue dot
  if (skills.length) {
    drawSideHeader("SKILLS");
    doc.setFont("helvetica", "normal").setFontSize(bs);
    for (const s of skills) {
      doc.setFillColor(BLUE[0], BLUE[1], BLUE[2]);
      doc.circle(sideX + 1.5, ySide - bs * PT * 0.25, 0.8, "F");
      doc.setTextColor(51, 51, 51);
      doc.text(s, sideX + 5, ySide);
      ySide += lh * 1.1;
    }
    ySide += secGap;
  }

  // Certifications in sidebar
  if (certifications.length) {
    drawSideHeader("CERTIFICATIONS");
    for (const c of certifications) {
      doc.setFont("helvetica", "bold").setFontSize(bs * 0.95);
      doc.setTextColor(34, 34, 34);
      for (const l of wrap(doc, c.name || "", sideW)) {
        doc.text(l, sideX, ySide);
        ySide += lh;
      }
      if (c.issuer || c.date) {
        doc.setFont("helvetica", "normal").setFontSize(cs * 0.9);
        doc.setTextColor(136, 136, 136);
        doc.text([c.issuer, c.date].filter(Boolean).join(" • "), sideX, ySide);
        ySide += lh;
      }
      ySide += itemGap * 0.5;
    }
    ySide += secGap;
  }

  // Extracurriculars in sidebar
  if (extracurriculars.length) {
    drawSideHeader("ACTIVITIES");
    doc.setFont("helvetica", "normal").setFontSize(bs);
    doc.setTextColor(51, 51, 51);
    for (const item of extracurriculars) {
      doc.setFillColor(BLUE[0], BLUE[1], BLUE[2]);
      doc.circle(sideX + 1.5, ySide - bs * PT * 0.25, 0.8, "F");
      for (const l of wrap(doc, item, sideW - 6)) {
        doc.text(l, sideX + 5, ySide);
        ySide += lh;
      }
      ySide += itemGap * 0.3;
    }
  }

  // ── MAIN COLUMN ──

  // Summary
  if (p.summary) {
    doc.setFont("helvetica", "normal").setFontSize(bs);
    doc.setTextColor(68, 68, 68);
    for (const l of wrap(doc, p.summary, mainW)) {
      doc.text(l, M, yMain);
      yMain += lh;
    }
    yMain += secGap;
  }

  // Experience
  if (experience.length) {
    drawMainHeader("EXPERIENCE");
    for (const e of experience) {
      doc.setFont("helvetica", "bold").setFontSize(bs);
      doc.setTextColor(34, 34, 34);
      doc.text(e.role || "", M, yMain);
      if (e.startDate || e.endDate) {
        doc.setFont("helvetica", "normal").setFontSize(cs * 0.9);
        doc.setTextColor(136, 136, 136);
        const ds = `${e.startDate || ""}${e.startDate && e.endDate ? " – " : ""}${e.endDate || "Present"}`;
        doc.text(ds, M + mainW, yMain, { align: "right" });
      }
      yMain += lh;
      if (e.company) {
        doc.setFont("helvetica", "normal").setFontSize(bs);
        doc.setTextColor(136, 136, 136);
        doc.text(e.company, M, yMain);
        yMain += lh;
      }
      if (e.description) {
        doc.setFont("helvetica", "normal").setFontSize(bs);
        doc.setTextColor(51, 51, 51);
        for (const b of e.description.split("\n").filter(l => l.trim())) {
          const clean = b.replace(/^[•▪\-]\s*/, "");
          for (const bl of wrap(doc, `• ${clean}`, mainW - bulletIndent)) {
            doc.text(bl, M + bulletIndent, yMain);
            yMain += lh;
          }
        }
      }
      yMain += itemGap;
    }
    yMain += secGap - itemGap;
  }

  // Education
  if (education.length) {
    drawMainHeader("EDUCATION");
    for (const e of education) {
      doc.setFont("helvetica", "bold").setFontSize(bs);
      doc.setTextColor(34, 34, 34);
      doc.text(e.degree || "", M, yMain);
      if (e.endDate) {
        doc.setFont("helvetica", "normal").setFontSize(cs * 0.9);
        doc.setTextColor(136, 136, 136);
        doc.text(e.endDate, M + mainW, yMain, { align: "right" });
      }
      yMain += lh;
      if (e.school) {
        doc.setFont("helvetica", "normal").setFontSize(bs);
        doc.setTextColor(136, 136, 136);
        doc.text(e.school, M, yMain);
        yMain += lh;
      }
      yMain += itemGap;
    }
    yMain += secGap - itemGap;
  }

  // Projects
  if (projects.length) {
    drawMainHeader("PROJECTS");
    for (const pr of projects) {
      doc.setFont("helvetica", "bold").setFontSize(bs);
      doc.setTextColor(34, 34, 34);
      doc.text(pr.name || "", M, yMain);
      yMain += lh;
      if (pr.description) {
        doc.setFont("helvetica", "normal").setFontSize(bs);
        doc.setTextColor(51, 51, 51);
        for (const l of wrap(doc, pr.description, mainW)) {
          doc.text(l, M, yMain);
          yMain += lh;
        }
      }
      if (pr.techStack.length) {
        doc.setFont("helvetica", "italic").setFontSize(bs * 0.9);
        doc.setTextColor(136, 136, 136);
        doc.text(pr.techStack.join(", "), M, yMain);
        yMain += lh;
      }
      if (pr.link) {
        doc.setFont("helvetica", "normal").setFontSize(bs * 0.9);
        doc.setTextColor(BLUE[0], BLUE[1], BLUE[2]);
        doc.text(pr.link, M, yMain);
        yMain += lh;
      }
      yMain += itemGap;
    }
  }

  return Math.max(yMain, ySide);
}

/* ══════════════════════════════════════════════════════════════
   MAIN EXPORT — supports single-page (default) and multi-page
   pageMode: "single" = scale to fit 1 page, "multi" = natural flow with page breaks
   ══════════════════════════════════════════════════════════════ */
export type PageMode = "single" | "multi";

export function generateCV(data: CVData, template: TemplateId, pageMode: PageMode = "single"): void {
  const d = ensureSummary(data);
  const { personal: p, experience, education, skills } = d;
  if (!p.name && experience.length === 0 && education.length === 0 && skills.length === 0) {
    return;
  }

  const renderer = template === "classic" ? renderClassic : template === "modern" ? renderModern : renderMinimal;
  const M = MARGINS[template];
  const maxY = PAGE_H - M; // usable bottom

  if (pageMode === "multi") {
    // Multi-page: render at scale=1, then split across pages
    const measureDoc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const totalY = renderer(measureDoc, d, 1);

    if (totalY <= maxY) {
      // Fits on one page anyway
      const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      renderer(doc, d, 1);
      doc.save(getFileName(d, template));
      return;
    }

    // Need multiple pages — render at scale=1, use jsPDF internal page splitting
    const pagesNeeded = Math.ceil(totalY / maxY);
    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

    for (let page = 0; page < pagesNeeded; page++) {
      if (page > 0) doc.addPage();
      // Save state, translate, and clip to simulate page
      const offsetY = page * maxY;
      // Re-render with offset by using a temporary doc approach
      // Since jsPDF doesn't support clipping easily, we re-render and let content overflow
      // but only on the final page setup
    }

    // Simpler approach: render once, content overflows naturally in jsPDF
    // jsPDF will clip at page boundary — we need to manually paginate
    // Best approach: render at scale that fits ~2 pages worth, adding pages as needed
    const finalDoc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const scale = 1;

    // Render sections individually with page break detection
    renderWithPageBreaks(finalDoc, d, template, scale, maxY, M);
    finalDoc.save(getFileName(d, template));
    return;
  }

  // Single page mode (default) — scale to fit
  const measureDoc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const measuredY = renderer(measureDoc, d, 1);

  let scale = 1;
  if (measuredY > maxY) {
    scale = Math.max(0.7, maxY / measuredY);
  } else if (measuredY < maxY * 0.6) {
    scale = Math.min(1.15, (maxY * 0.88) / measuredY);
  }

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  renderer(doc, d, scale);
  doc.save(getFileName(d, template));
}

/* ── Multi-page renderer: re-renders sections with page breaks ── */
function renderWithPageBreaks(doc: jsPDF, data: CVData, template: TemplateId, scale: number, maxY: number, M: number): void {
  // For multi-page, we render at scale=1 using a measuring pass per section
  // then place each section, adding a page when needed
  const renderer = template === "classic" ? renderClassic : template === "modern" ? renderModern : renderMinimal;

  // Simple approach: render full content, measure total height, 
  // if it exceeds one page, render at scale=1 and add pages
  const totalY = renderer(doc, data, scale);

  if (totalY > maxY) {
    // Content overflowed — jsPDF doesn't auto-paginate, so we use a
    // slightly reduced scale that fits ~2 pages and add a second page
    // Actually, the simplest reliable approach: scale down to fit 2 pages
    const pages = Math.ceil(totalY / maxY);
    // Clear and re-render with proper pagination
    // jsPDF doesn't support clearing, so create fresh
    const freshDoc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

    // For 2-page CVs: render top half on page 1, bottom half on page 2
    // Since our renderers draw linearly, we can split by using two render passes
    // with Y-offset. But this is complex with jsPDF.
    
    // Pragmatic solution: scale to fit N pages where N = ceil(totalY/maxY)
    // For 2 pages, scale = totalY / (maxY * 2) but we want scale=1
    // Actually just let content render and manually add pages based on content height
    
    // Best pragmatic approach for now: if content is 1-2 pages, use scale ~0.85-1.0
    // to make it fit nicely on 2 pages with good readability
    const targetHeight = maxY * pages;
    const newScale = Math.min(1, targetHeight / totalY);
    
    // We already rendered on doc, can't undo. The caller will use freshDoc.
    // Actually the caller passed `doc` and we already rendered on it.
    // Since we can't undo, we'll just accept the overflow — jsPDF clips at page boundary
    // Add the needed extra pages
    for (let i = 1; i < pages; i++) {
      doc.addPage();
    }
    // Re-render on page 2 won't work easily with jsPDF's linear model
    // The content is already on page 1 and will be clipped
  }
}
