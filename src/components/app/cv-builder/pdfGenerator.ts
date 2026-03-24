import jsPDF from "jspdf";
import type { CVData } from "./types";
import type { TemplateId } from "./CVPreview";

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 14;
const CONTENT_W = PAGE_W - MARGIN * 2;
const USABLE_H = PAGE_H - MARGIN * 2;

function cleanName(name: string): string {
  return name.replace(/\s+\b(and|i|the|a|an|is|am|was|im|or|but|to|for|my|me|at|in)\s*$/i, "").trim();
}

function getFileName(data: CVData): string {
  const name = cleanName(data.personal.name?.trim() || "");
  return name ? `${name} - CraftCV.pdf` : "CraftCV.pdf";
}

function wrap(doc: jsPDF, text: string, maxW: number): string[] {
  return doc.splitTextToSize(text, maxW) as string[];
}

const C = {
  modern:  { pr: [37,99,235] as const, tx: [30,30,30] as const, mu: [100,100,100] as const, ln: [210,215,225] as const, ac: [235,243,255] as const, at: [37,99,235] as const },
  classic: { pr: [100,50,20] as const, tx: [30,30,30] as const, mu: [90,90,90] as const, ln: [100,50,20] as const, ac: [250,245,238] as const, at: [100,50,20] as const },
  minimal: { pr: [70,70,70] as const, tx: [30,30,30] as const, mu: [120,120,120] as const, ln: [200,200,200] as const, ac: [242,242,242] as const, at: [70,70,70] as const },
};

// ─── Sizing config that scales ───────────────────────────────
interface SizeConfig {
  nameSize: number;
  titleSize: number;
  sectionHeaderSize: number;
  roleSize: number;
  bodySize: number;
  smallSize: number;
  contactSize: number;
  lineH: number;       // body line height
  sectionGap: number;  // gap between sections
  itemGap: number;     // gap between items in a section
  headerGap: number;   // gap after section header line
}

function getBaseConfig(): SizeConfig {
  return {
    nameSize: 20, titleSize: 10.5, sectionHeaderSize: 9.5,
    roleSize: 9.5, bodySize: 8.5, smallSize: 7.5, contactSize: 8,
    lineH: 3.5, sectionGap: 5, itemGap: 2.5, headerGap: 4,
  };
}

function scaleConfig(base: SizeConfig, factor: number): SizeConfig {
  return {
    nameSize: base.nameSize * factor,
    titleSize: base.titleSize * factor,
    sectionHeaderSize: base.sectionHeaderSize * factor,
    roleSize: base.roleSize * factor,
    bodySize: base.bodySize * factor,
    smallSize: base.smallSize * factor,
    contactSize: base.contactSize * factor,
    lineH: base.lineH * factor,
    sectionGap: base.sectionGap * factor,
    itemGap: base.itemGap * factor,
    headerGap: base.headerGap * factor,
  };
}

// ─── Measure pass (dry run) ─────────────────────────────────
function measureContent(doc: jsPDF, data: CVData, template: TemplateId, sz: SizeConfig): number {
  const { personal: p, experience, education, skills, projects, certifications, extracurriculars } = data;
  const isCl = template === "classic";
  const bf = isCl ? "times" : "helvetica";
  let y = 0;

  // Header
  y += sz.nameSize * 0.4; // name height approx
  if (p.title) y += sz.titleSize * 0.4 + 1;

  // Contact
  const cp = [p.email, p.phone, p.location, p.linkedin, p.github].filter(Boolean);
  if (cp.length) {
    doc.setFont(bf, "normal").setFontSize(sz.contactSize);
    const sep = template === "minimal" ? "  ·  " : "  |  ";
    y += wrap(doc, cp.join(sep), CONTENT_W).length * (sz.lineH + 0.3) + 1;
  }

  // Divider
  y += 4;

  // Summary
  if (p.summary) {
    doc.setFont(bf, "normal").setFontSize(sz.bodySize);
    y += wrap(doc, p.summary, CONTENT_W).length * sz.lineH + sz.sectionGap;
  }

  // Experience
  if (experience.length) {
    y += sz.sectionGap + sz.headerGap + 2; // section header
    for (const e of experience) {
      y += sz.roleSize * 0.4 + 1; // role line
      if (e.company && template !== "minimal") y += sz.lineH + 0.5;
      if (e.description) {
        doc.setFont(bf, "normal").setFontSize(sz.bodySize);
        for (const b of e.description.split("\n").filter(l => l.trim())) {
          const clean = b.replace(/^[•\-]\s*/, "");
          y += wrap(doc, `• ${clean}`, CONTENT_W - 4).length * sz.lineH;
        }
      }
      y += sz.itemGap;
    }
  }

  // Education
  if (education.length) {
    y += sz.sectionGap + sz.headerGap + 2;
    for (const e of education) {
      y += sz.roleSize * 0.4 + 1;
      if (e.school) y += sz.lineH + 0.5;
      y += sz.itemGap;
    }
  }

  // Skills
  if (skills.length) {
    y += sz.sectionGap + sz.headerGap + 2;
    if (template === "modern") {
      doc.setFontSize(sz.smallSize);
      let cx = 0; const ch = sz.smallSize * 0.6 + 2, cpd = 2.5, cg = 1.5;
      let rows = 1;
      for (const s of skills) {
        const tw = doc.getTextWidth(s);
        const cw = tw + cpd * 2;
        if (cx + cw > CONTENT_W) { cx = 0; rows++; }
        cx += cw + cg;
      }
      y += rows * (ch + cg) + 2;
    } else {
      doc.setFont(bf, "normal").setFontSize(sz.bodySize);
      const sep = template === "minimal" ? "  ·  " : "  •  ";
      y += wrap(doc, skills.join(sep), CONTENT_W).length * sz.lineH + 2;
    }
  }

  // Projects
  if (projects.length) {
    y += sz.sectionGap + sz.headerGap + 2;
    for (const pr of projects) {
      y += sz.roleSize * 0.4 + 1;
      if (pr.description) { doc.setFont(bf, "normal").setFontSize(sz.bodySize); y += wrap(doc, pr.description, CONTENT_W).length * sz.lineH; }
      if (pr.techStack.length) y += sz.lineH;
      if (pr.link) y += sz.lineH;
      y += sz.itemGap;
    }
  }

  // Certifications
  if (certifications.length) {
    y += sz.sectionGap + sz.headerGap + 2;
    for (const cert of certifications) {
      y += sz.smallSize * 0.4 + 1;
      if (cert.issuer || cert.date) y += sz.lineH;
      y += sz.itemGap * 0.5;
    }
  }

  // Extracurriculars
  if (extracurriculars.length) {
    y += sz.sectionGap + sz.headerGap + 2;
    doc.setFont(bf, "normal").setFontSize(sz.bodySize);
    for (const item of extracurriculars) {
      y += wrap(doc, `• ${item}`, CONTENT_W).length * sz.lineH;
    }
  }

  return y;
}

function sectionHead(doc: jsPDF, title: string, y: number, t: TemplateId, sz: SizeConfig): number {
  const c = C[t];
  if (t === "classic") {
    doc.setFont("times", "bold").setFontSize(sz.sectionHeaderSize);
    doc.setTextColor(c.pr[0], c.pr[1], c.pr[2]);
    doc.text(title.toUpperCase(), MARGIN, y);
    y += 1; doc.setDrawColor(c.ln[0], c.ln[1], c.ln[2]); doc.setLineWidth(0.4); doc.line(MARGIN, y, PAGE_W - MARGIN, y); y += sz.headerGap;
  } else if (t === "minimal") {
    doc.setFont("helvetica", "normal").setFontSize(sz.smallSize);
    doc.setTextColor(c.mu[0], c.mu[1], c.mu[2]);
    doc.text(title.toUpperCase(), MARGIN, y); y += sz.headerGap;
  } else {
    doc.setFont("helvetica", "bold").setFontSize(sz.sectionHeaderSize);
    doc.setTextColor(c.pr[0], c.pr[1], c.pr[2]);
    doc.text(title.toUpperCase(), MARGIN, y);
    y += 1; doc.setDrawColor(c.ln[0], c.ln[1], c.ln[2]); doc.setLineWidth(0.2); doc.line(MARGIN, y, PAGE_W - MARGIN, y); y += sz.headerGap;
  }
  return y;
}

export function generateCV(data: CVData, template: TemplateId): void {
  const c = C[template];
  const isCl = template === "classic";
  const bf = isCl ? "times" : "helvetica";
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const { personal: p, experience, education, skills, projects, certifications, extracurriculars } = data;
  const name = cleanName(p.name || "Your Name");

  // ── Two-pass: measure then scale to fit one page ──
  const baseSz = getBaseConfig();
  let contentH = measureContent(doc, data, template, baseSz);
  let scaleFactor = 1;
  if (contentH > USABLE_H) {
    scaleFactor = Math.max(0.7, USABLE_H / contentH);
  } else if (contentH < USABLE_H * 0.65) {
    // Content is too sparse — stretch spacing slightly (up to 1.3x)
    scaleFactor = Math.min(1.3, USABLE_H * 0.92 / contentH);
  }
  const sz = scaleConfig(baseSz, scaleFactor);

  let y = MARGIN;

  // ── Header ──
  if (isCl) {
    doc.setFont("times", "bold").setFontSize(sz.nameSize); doc.setTextColor(c.tx[0], c.tx[1], c.tx[2]);
    doc.text(name, PAGE_W / 2, y, { align: "center" }); y += 7;
    if (p.title) { doc.setFont("times", "italic").setFontSize(sz.titleSize); doc.setTextColor(c.mu[0], c.mu[1], c.mu[2]); doc.text(p.title, PAGE_W / 2, y, { align: "center" }); y += 5; }
  } else if (template === "minimal") {
    doc.setFont("helvetica", "normal").setFontSize(sz.nameSize); doc.setTextColor(c.tx[0], c.tx[1], c.tx[2]);
    doc.text(name, MARGIN, y); y += 7;
    if (p.title) { doc.setFontSize(sz.titleSize); doc.setTextColor(c.mu[0], c.mu[1], c.mu[2]); doc.text(p.title, MARGIN, y); y += 5; }
  } else {
    doc.setFont("helvetica", "bold").setFontSize(sz.nameSize); doc.setTextColor(c.tx[0], c.tx[1], c.tx[2]);
    doc.text(name, MARGIN, y); y += 7;
    if (p.title) { doc.setFont("helvetica", "bold").setFontSize(sz.titleSize); doc.setTextColor(c.pr[0], c.pr[1], c.pr[2]); doc.text(p.title, MARGIN, y); y += 5; }
  }

  // ── Contact ──
  const cp = [p.email, p.phone, p.location, p.linkedin, p.github].filter(Boolean);
  if (cp.length) {
    doc.setFont(bf, "normal").setFontSize(sz.contactSize); doc.setTextColor(c.mu[0], c.mu[1], c.mu[2]);
    const sep = template === "minimal" ? "  ·  " : "  |  ";
    const lines = wrap(doc, cp.join(sep), CONTENT_W);
    for (const l of lines) {
      if (isCl) doc.text(l, PAGE_W / 2, y, { align: "center" }); else doc.text(l, MARGIN, y);
      y += sz.lineH + 0.3;
    }
  }

  // ── Divider ──
  y += 1;
  if (template === "modern") { doc.setDrawColor(c.pr[0], c.pr[1], c.pr[2]); doc.setLineWidth(0.8); }
  else if (isCl) { doc.setDrawColor(c.ln[0], c.ln[1], c.ln[2]); doc.setLineWidth(0.5); }
  else { doc.setDrawColor(c.ln[0], c.ln[1], c.ln[2]); doc.setLineWidth(0.3); }
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  if (isCl) { y += 0.3; doc.line(MARGIN, y, PAGE_W - MARGIN, y); }
  y += sz.sectionGap;

  // ── Summary ──
  if (p.summary) {
    doc.setFont(bf, isCl ? "italic" : "normal").setFontSize(sz.bodySize); doc.setTextColor(c.mu[0], c.mu[1], c.mu[2]);
    for (const l of wrap(doc, p.summary, CONTENT_W)) { doc.text(l, MARGIN, y); y += sz.lineH; }
    y += sz.sectionGap;
  }

  // ── Experience ──
  if (experience.length) {
    y = sectionHead(doc, isCl ? "Professional Experience" : "Experience", y, template, sz);
    for (const e of experience) {
      doc.setFont(bf, "bold").setFontSize(sz.roleSize); doc.setTextColor(c.tx[0], c.tx[1], c.tx[2]);
      const rt = template === "minimal" && e.company ? `${e.role} — ${e.company}` : (e.role || "");
      doc.text(rt, MARGIN, y);
      if (e.startDate || e.endDate) {
        doc.setFont(bf, isCl ? "italic" : "normal").setFontSize(sz.smallSize); doc.setTextColor(c.mu[0], c.mu[1], c.mu[2]);
        const ds = `${e.startDate || ""}${e.startDate ? " – " : ""}${e.endDate || "Present"}`;
        doc.text(ds, PAGE_W - MARGIN, y, { align: "right" });
      }
      y += sz.lineH + 1;
      if (e.company && template !== "minimal") {
        doc.setFont(bf, isCl ? "italic" : "normal").setFontSize(sz.bodySize); doc.setTextColor(c.mu[0], c.mu[1], c.mu[2]);
        doc.text(e.company, MARGIN, y); y += sz.lineH + 0.5;
      }
      if (e.description) {
        doc.setFont(bf, "normal").setFontSize(sz.bodySize); doc.setTextColor(68, 68, 68);
        for (const b of e.description.split("\n").filter(l => l.trim())) {
          const clean = b.replace(/^[•\-]\s*/, "");
          for (const bl of wrap(doc, `• ${clean}`, CONTENT_W - 4)) { doc.text(bl, MARGIN + 2, y); y += sz.lineH; }
        }
      }
      y += sz.itemGap;
    }
    y += sz.sectionGap - sz.itemGap;
  }

  // ── Education ──
  if (education.length) {
    y = sectionHead(doc, "Education", y, template, sz);
    for (const e of education) {
      doc.setFont(bf, "bold").setFontSize(sz.roleSize); doc.setTextColor(c.tx[0], c.tx[1], c.tx[2]);
      doc.text(e.degree || "", MARGIN, y);
      if (e.endDate) { doc.setFont(bf, isCl ? "italic" : "normal").setFontSize(sz.smallSize); doc.setTextColor(c.mu[0], c.mu[1], c.mu[2]); doc.text(e.endDate, PAGE_W - MARGIN, y, { align: "right" }); }
      y += sz.lineH + 1;
      if (e.school) { doc.setFont(bf, isCl ? "italic" : "normal").setFontSize(sz.bodySize); doc.setTextColor(c.mu[0], c.mu[1], c.mu[2]); doc.text(e.school, MARGIN, y); y += sz.lineH + 0.5; }
      y += sz.itemGap;
    }
    y += sz.sectionGap - sz.itemGap;
  }

  // ── Skills ──
  if (skills.length) {
    y = sectionHead(doc, "Skills", y, template, sz);
    if (template === "modern") {
      let cx = MARGIN;
      const ch = sz.smallSize * 0.55 + 2, cpd = 2.5, cg = 1.5;
      doc.setFontSize(sz.smallSize);
      for (const s of skills) {
        const tw = doc.getTextWidth(s);
        const cw = tw + cpd * 2;
        if (cx + cw > PAGE_W - MARGIN) { cx = MARGIN; y += ch + cg; }
        doc.setFillColor(c.ac[0], c.ac[1], c.ac[2]);
        doc.roundedRect(cx, y - ch * 0.65, cw, ch, 1.2, 1.2, "F");
        doc.setFont("helvetica", "bold"); doc.setTextColor(c.at[0], c.at[1], c.at[2]);
        doc.text(s, cx + cpd, y);
        cx += cw + cg;
      }
      y += ch + sz.sectionGap;
    } else {
      doc.setFont(bf, "normal").setFontSize(sz.bodySize); doc.setTextColor(68, 68, 68);
      const sep = template === "minimal" ? "  ·  " : "  •  ";
      for (const l of wrap(doc, skills.join(sep), CONTENT_W)) { doc.text(l, MARGIN, y); y += sz.lineH; }
      y += sz.sectionGap;
    }
  }

  // ── Projects ──
  if (projects.length) {
    y = sectionHead(doc, "Projects", y, template, sz);
    for (const pr of projects) {
      doc.setFont(bf, "bold").setFontSize(sz.roleSize); doc.setTextColor(c.tx[0], c.tx[1], c.tx[2]);
      doc.text(pr.name || "", MARGIN, y); y += sz.lineH + 1;
      if (pr.description) { doc.setFont(bf, "normal").setFontSize(sz.bodySize); doc.setTextColor(68, 68, 68); for (const l of wrap(doc, pr.description, CONTENT_W)) { doc.text(l, MARGIN, y); y += sz.lineH; } }
      if (pr.techStack.length) { doc.setFont(bf, "italic").setFontSize(sz.smallSize); doc.setTextColor(c.mu[0], c.mu[1], c.mu[2]); doc.text(pr.techStack.join(", "), MARGIN, y); y += sz.lineH; }
      if (pr.link) { doc.setFont(bf, "normal").setFontSize(sz.smallSize); doc.setTextColor(c.pr[0], c.pr[1], c.pr[2]); doc.text(pr.link, MARGIN, y); y += sz.lineH; }
      y += sz.itemGap;
    }
    y += sz.sectionGap - sz.itemGap;
  }

  // ── Certifications ──
  if (certifications.length) {
    y = sectionHead(doc, "Certifications", y, template, sz);
    for (const cert of certifications) {
      doc.setFont(bf, "bold").setFontSize(sz.bodySize); doc.setTextColor(c.tx[0], c.tx[1], c.tx[2]);
      doc.text(cert.name || "", MARGIN, y); y += sz.lineH;
      if (cert.issuer || cert.date) { doc.setFont(bf, "normal").setFontSize(sz.smallSize); doc.setTextColor(c.mu[0], c.mu[1], c.mu[2]); doc.text([cert.issuer, cert.date].filter(Boolean).join(" • "), MARGIN, y); y += sz.lineH; }
      y += sz.itemGap * 0.5;
    }
    y += sz.sectionGap - sz.itemGap;
  }

  // ── Extracurriculars ──
  if (extracurriculars.length) {
    y = sectionHead(doc, isCl ? "Activities" : "Extracurriculars", y, template, sz);
    doc.setFont(bf, "normal").setFontSize(sz.bodySize); doc.setTextColor(68, 68, 68);
    for (const item of extracurriculars) {
      for (const l of wrap(doc, `• ${item}`, CONTENT_W)) { doc.text(l, MARGIN, y); y += sz.lineH; }
    }
  }

  doc.save(getFileName(data));
}