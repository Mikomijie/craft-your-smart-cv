import jsPDF from "jspdf";
import type { CVData } from "./types";
import type { TemplateId } from "./CVPreview";

/* ── Constants ─────────────────────────────────────────────── */
const PAGE_W = 210;
const PAGE_H = 297;

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

/* mm per pt: jsPDF uses mm, font sizes in pt. 1pt ≈ 0.3528mm */
const PT = 0.3528;

/* ══════════════════════════════════════════════════════════════
   TEMPLATE 1 — CLASSIC (ATS Optimized)
   ══════════════════════════════════════════════════════════════ */
function generateClassic(doc: jsPDF, data: CVData, scale: number): void {
  const M = MARGINS.classic;
  const CW = PAGE_W - M * 2;
  const { personal: p, experience, education, skills, projects, certifications, extracurriculars } = data;
  const name = cleanName(p.name || "Your Name");

  // Scaled sizes (base sizes in pt, converted via scale)
  const ns = 28 * scale;   // name
  const ts = 14 * scale;   // title
  const cs = 11 * scale;   // contact
  const sh = 11 * scale;   // section header
  const bs = 10.5 * scale; // body
  const lh = bs * PT * 1.6; // line height
  const secGap = 14 * PT * scale; // 14px between sections
  const itemGap = 8 * PT * scale; // 8px between items
  const bulletIndent = 12 * PT; // 12px indent

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
    const lines = wrap(doc, contactStr, CW);
    for (const l of lines) {
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

  // Helper: section header
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
      // Role bold + dates right
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
      // Company
      if (e.company) {
        doc.setFont("helvetica", "normal").setFontSize(bs);
        doc.setTextColor(102, 102, 102);
        doc.text(e.company, M, y);
        y += lh;
      }
      // Bullets
      if (e.description) {
        doc.setFont("helvetica", "normal").setFontSize(bs);
        doc.setTextColor(51, 51, 51);
        for (const b of e.description.split("\n").filter(l => l.trim())) {
          const clean = b.replace(/^[•▪\-]\s*/, "");
          const bLines = wrap(doc, `• ${clean}`, CW - bulletIndent);
          for (const bl of bLines) {
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

  // Skills — plain text, comma separated
  if (skills.length) {
    drawHeader("SKILLS");
    doc.setFont("helvetica", "normal").setFontSize(bs);
    doc.setTextColor(51, 51, 51);
    const skillText = skills.join(", ");
    for (const l of wrap(doc, skillText, CW)) {
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
}

/* ══════════════════════════════════════════════════════════════
   TEMPLATE 2 — MODERN (Blue Accent)
   ══════════════════════════════════════════════════════════════ */
function generateModern(doc: jsPDF, data: CVData, scale: number): void {
  const M = MARGINS.modern;
  const STRIPE_W = 8; // blue left stripe
  const TEXT_L = M; // text starts at margin (stripe is decorative at edge)
  const CW = PAGE_W - M * 2;
  const { personal: p, experience, education, skills, projects, certifications, extracurriculars } = data;
  const name = cleanName(p.name || "Your Name");

  const BLUE = [37, 99, 235] as const;     // #2563eb
  const PILL_BG = [219, 234, 254] as const; // #dbeafe
  const PILL_TX = [30, 64, 175] as const;   // #1e40af

  const ns = 26 * scale;
  const ts = 13 * scale;
  const cs = 11 * scale;
  const sh = 11 * scale;
  const bs = 10.5 * scale;
  const lh = bs * PT * 1.6;
  const secGap = 16 * PT * scale;
  const itemGap = 8 * PT * scale;
  const bulletIndent = 12 * PT;

  // Draw blue left stripe
  doc.setFillColor(BLUE[0], BLUE[1], BLUE[2]);
  doc.rect(0, 0, STRIPE_W, PAGE_H, "F");

  let y = M;

  // Name — left, bold, dark
  doc.setFont("helvetica", "bold").setFontSize(ns);
  doc.setTextColor(17, 17, 17);
  doc.text(name, TEXT_L, y);
  y += ns * PT * 1.1;

  // Title — left, blue
  if (p.title) {
    doc.setFont("helvetica", "normal").setFontSize(ts);
    doc.setTextColor(BLUE[0], BLUE[1], BLUE[2]);
    doc.text(p.title, TEXT_L, y);
    y += ts * PT * 1.3;
  }

  // Contact — left, grey, small
  const contacts = [p.email, p.phone, p.location, p.linkedin, p.github, p.website].filter(Boolean);
  if (contacts.length) {
    doc.setFont("helvetica", "normal").setFontSize(cs);
    doc.setTextColor(120, 120, 120);
    const contactStr = contacts.join("  |  ");
    const lines = wrap(doc, contactStr, CW);
    for (const l of lines) {
      doc.text(l, TEXT_L, y);
      y += cs * PT * 1.4;
    }
  }
  y += 2;

  // Section header helper
  const drawHeader = (title: string) => {
    doc.setFont("helvetica", "bold").setFontSize(sh);
    doc.setTextColor(BLUE[0], BLUE[1], BLUE[2]);
    // letter spacing approximation: add spaces
    const spaced = title.toUpperCase().split("").join(String.fromCharCode(8202)); // hair space
    doc.text(spaced, TEXT_L, y);
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

  // Experience
  if (experience.length) {
    drawHeader("EXPERIENCE");
    for (const e of experience) {
      // Company bold + dates right
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
      // Role in medium grey
      if (e.role) {
        doc.setFont("helvetica", "normal").setFontSize(bs);
        doc.setTextColor(100, 100, 100);
        doc.text(e.role, TEXT_L, y);
        y += lh;
      }
      // Bullets with blue square ▪
      if (e.description) {
        doc.setFont("helvetica", "normal").setFontSize(bs);
        doc.setTextColor(51, 51, 51);
        for (const b of e.description.split("\n").filter(l => l.trim())) {
          const clean = b.replace(/^[•▪\-]\s*/, "");
          // Draw blue square
          const sqSize = bs * PT * 0.5;
          doc.setFillColor(BLUE[0], BLUE[1], BLUE[2]);
          doc.rect(TEXT_L + bulletIndent * 0.3, y - sqSize * 0.7, sqSize, sqSize, "F");
          const bLines = wrap(doc, clean, CW - bulletIndent);
          for (let i = 0; i < bLines.length; i++) {
            doc.setTextColor(51, 51, 51);
            doc.text(bLines[i], TEXT_L + bulletIndent, y);
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
      // Pill background
      doc.setFillColor(PILL_BG[0], PILL_BG[1], PILL_BG[2]);
      doc.roundedRect(cx, y - pillH * 0.6, pw, pillH, 1.5, 1.5, "F");
      // Pill text
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
      const sqSize = bs * PT * 0.5;
      doc.setFillColor(BLUE[0], BLUE[1], BLUE[2]);
      doc.rect(TEXT_L + bulletIndent * 0.3, y - sqSize * 0.7, sqSize, sqSize, "F");
      for (const l of wrap(doc, item, CW - bulletIndent)) {
        doc.setTextColor(51, 51, 51);
        doc.text(l, TEXT_L + bulletIndent, y);
        y += lh;
      }
    }
  }
}

/* ══════════════════════════════════════════════════════════════
   TEMPLATE 3 — MINIMAL (Two Column)
   ══════════════════════════════════════════════════════════════ */
function generateMinimal(doc: jsPDF, data: CVData, scale: number): void {
  const M = MARGINS.minimal;
  const { personal: p, experience, education, skills, projects, certifications, extracurriculars } = data;
  const name = cleanName(p.name || "Your Name");

  const BLUE = [37, 99, 235] as const;
  const SIDEBAR_BG = [248, 249, 250] as const; // #f8f9fa
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

  // ── HEADER (main column) ──
  doc.setFont("helvetica", "bold").setFontSize(ns);
  doc.setTextColor(34, 34, 34);
  doc.text(name, M, yMain);
  yMain += ns * PT * 1.1;

  if (p.title) {
    doc.setFont("helvetica", "normal").setFontSize(ts);
    doc.setTextColor(BLUE[0], BLUE[1], BLUE[2]);
    doc.text(p.title, M, yMain);
    yMain += ts * PT * 1.5;
  }
  yMain += secGap * 0.5;

  // Section header helpers
  const drawMainHeader = (title: string) => {
    doc.setFont("helvetica", "normal").setFontSize(sh);
    doc.setTextColor(136, 136, 136);
    // Small caps approximation with letter spacing
    const spaced = title.toUpperCase().split("").join(String.fromCharCode(8202) + String.fromCharCode(8202));
    doc.text(spaced, M, yMain);
    yMain += sh * PT * 1.5;
  };

  const drawSideHeader = (title: string) => {
    doc.setFont("helvetica", "normal").setFontSize(sh);
    doc.setTextColor(136, 136, 136);
    const spaced = title.toUpperCase().split("").join(String.fromCharCode(8202) + String.fromCharCode(8202));
    doc.text(spaced, sideX, ySide);
    ySide += sh * PT * 1.5;
  };

  // ── SIDEBAR ──

  // Contact info
  drawSideHeader("CONTACT");
  const contacts = [
    p.email && `${p.email}`,
    p.phone && `${p.phone}`,
    p.location && `${p.location}`,
    p.linkedin && `${p.linkedin}`,
    p.github && `${p.github}`,
    p.website && `${p.website}`,
  ].filter(Boolean) as string[];

  doc.setFont("helvetica", "normal").setFontSize(cs);
  doc.setTextColor(68, 68, 68);
  for (const c of contacts) {
    const lines = wrap(doc, c, sideW);
    for (const l of lines) {
      doc.text(l, sideX, ySide);
      ySide += cs * PT * 1.5;
    }
    ySide += 1;
  }
  ySide += secGap;

  // Skills — plain text list with blue dot
  if (skills.length) {
    drawSideHeader("SKILLS");
    doc.setFont("helvetica", "normal").setFontSize(bs);
    for (const s of skills) {
      // Blue dot
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
      const certLines = wrap(doc, c.name || "", sideW);
      for (const l of certLines) {
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
      const lines = wrap(doc, item, sideW - 6);
      for (const l of lines) {
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
          const bLines = wrap(doc, `• ${clean}`, mainW - bulletIndent);
          for (const bl of bLines) {
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
}

/* ══════════════════════════════════════════════════════════════
   MAIN EXPORT — measures, scales, renders
   ══════════════════════════════════════════════════════════════ */
export function generateCV(data: CVData, template: TemplateId): void {
  // Guard: check content exists
  const { personal: p, experience, education, skills } = data;
  if (!p.name && experience.length === 0 && education.length === 0 && skills.length === 0) {
    return;
  }

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  // Two-pass: first render to measure, then scale and re-render
  // For simplicity with the template refactor, we do a single pass with scale=1
  // and rely on the generous spacing to fit. For extreme content, we scale down.
  const testDoc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  
  // Quick height estimation by rendering to a test doc
  const renderer = template === "classic" ? generateClassic : template === "modern" ? generateModern : generateMinimal;
  renderer(testDoc, data, 1);

  // Check if last text position exceeds page — crude but effective
  // jsPDF doesn't expose cursor, so we trust the generous spacing.
  // For safety, scale down if there's a lot of content
  const sectionCount = [
    p.summary ? 1 : 0,
    experience.length,
    education.length,
    skills.length > 0 ? 1 : 0,
    data.projects.length,
    data.certifications.length,
    data.extracurriculars.length > 0 ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  let scale = 1;
  if (sectionCount > 12) scale = 0.85;
  else if (sectionCount > 9) scale = 0.9;
  else if (sectionCount > 6) scale = 0.95;
  // If very sparse, stretch slightly
  if (sectionCount <= 3) scale = 1.1;

  renderer(doc, data, scale);
  doc.save(getFileName(data, template));
}
