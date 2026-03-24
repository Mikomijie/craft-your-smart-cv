import jsPDF from "jspdf";
import type { CVData } from "./types";
import type { TemplateId } from "./CVPreview";

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 18;
const CONTENT_W = PAGE_W - MARGIN * 2;

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

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > PAGE_H - MARGIN) { doc.addPage(); return MARGIN; }
  return y;
}

const C = {
  modern:  { pr: [37,99,235] as const, tx: [17,17,17] as const, mu: [100,100,100] as const, ln: [200,200,200] as const, ac: [239,246,255] as const, at: [37,99,235] as const },
  classic: { pr: [51,51,51] as const,  tx: [17,17,17] as const, mu: [100,100,100] as const, ln: [51,51,51] as const,    ac: [245,245,240] as const, at: [51,51,51] as const },
  minimal: { pr: [153,153,153] as const, tx: [17,17,17] as const, mu: [153,153,153] as const, ln: [230,230,230] as const, ac: [245,245,245] as const, at: [80,80,80] as const },
};

function sectionHead(doc: jsPDF, title: string, y: number, t: TemplateId): number {
  const c = C[t];
  y = ensureSpace(doc, y, 12);
  if (t === "classic") {
    doc.setFont("times", "bold").setFontSize(12);
    doc.setTextColor(c.pr[0], c.pr[1], c.pr[2]);
    doc.text(title.toUpperCase(), MARGIN, y);
    y += 1; doc.setDrawColor(c.ln[0], c.ln[1], c.ln[2]); doc.setLineWidth(0.5); doc.line(MARGIN, y, PAGE_W - MARGIN, y); y += 5;
  } else if (t === "minimal") {
    doc.setFont("helvetica", "normal").setFontSize(8);
    doc.setTextColor(c.mu[0], c.mu[1], c.mu[2]);
    doc.text(title.toUpperCase(), MARGIN, y); y += 5;
  } else {
    doc.setFont("helvetica", "bold").setFontSize(10);
    doc.setTextColor(c.pr[0], c.pr[1], c.pr[2]);
    doc.text(title.toUpperCase(), MARGIN, y);
    y += 1; doc.setDrawColor(c.ln[0], c.ln[1], c.ln[2]); doc.setLineWidth(0.3); doc.line(MARGIN, y, PAGE_W - MARGIN, y); y += 5;
  }
  return y;
}

export function generateCV(data: CVData, template: TemplateId): void {
  const c = C[template];
  const isCl = template === "classic";
  const bf = isCl ? "times" : "helvetica";
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  let y = MARGIN;
  const { personal: p, experience, education, skills, projects, certifications, extracurriculars } = data;
  const name = cleanName(p.name || "Your Name");

  // Header
  if (isCl) {
    doc.setFont("times", "bold").setFontSize(22); doc.setTextColor(c.tx[0], c.tx[1], c.tx[2]);
    doc.text(name, PAGE_W / 2, y, { align: "center" }); y += 7;
    if (p.title) { doc.setFont("times", "italic").setFontSize(11); doc.setTextColor(c.mu[0], c.mu[1], c.mu[2]); doc.text(p.title, PAGE_W / 2, y, { align: "center" }); y += 5; }
  } else if (template === "minimal") {
    doc.setFont("helvetica", "normal").setFontSize(22); doc.setTextColor(c.tx[0], c.tx[1], c.tx[2]);
    doc.text(name, MARGIN, y); y += 7;
    if (p.title) { doc.setFontSize(10); doc.setTextColor(c.mu[0], c.mu[1], c.mu[2]); doc.text(p.title, MARGIN, y); y += 5; }
  } else {
    doc.setFont("helvetica", "bold").setFontSize(22); doc.setTextColor(c.tx[0], c.tx[1], c.tx[2]);
    doc.text(name, MARGIN, y); y += 7;
    if (p.title) { doc.setFont("helvetica", "bold").setFontSize(11); doc.setTextColor(c.pr[0], c.pr[1], c.pr[2]); doc.text(p.title, MARGIN, y); y += 5; }
  }

  // Contact
  const cp = [p.email, p.phone, p.location, p.linkedin, p.github].filter(Boolean);
  if (cp.length) {
    doc.setFont(bf, "normal").setFontSize(8.5); doc.setTextColor(c.mu[0], c.mu[1], c.mu[2]);
    const sep = template === "minimal" ? "  ·  " : "  |  ";
    const lines = wrap(doc, cp.join(sep), CONTENT_W);
    for (const l of lines) {
      if (isCl) doc.text(l, PAGE_W / 2, y, { align: "center" }); else doc.text(l, MARGIN, y);
      y += 4;
    }
  }

  // Divider
  if (template === "modern") { doc.setDrawColor(c.pr[0], c.pr[1], c.pr[2]); doc.setLineWidth(0.8); }
  else if (isCl) { doc.setDrawColor(c.ln[0], c.ln[1], c.ln[2]); doc.setLineWidth(0.5); }
  else { doc.setDrawColor(c.ln[0], c.ln[1], c.ln[2]); doc.setLineWidth(0.3); }
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  if (isCl) { y += 0.3; doc.line(MARGIN, y, PAGE_W - MARGIN, y); }
  y += 6;

  // Summary
  if (p.summary) {
    y = ensureSpace(doc, y, 10);
    doc.setFont(bf, isCl ? "italic" : "normal").setFontSize(9); doc.setTextColor(c.mu[0], c.mu[1], c.mu[2]);
    for (const l of wrap(doc, p.summary, CONTENT_W)) { y = ensureSpace(doc, y, 5); doc.text(l, MARGIN, y); y += 4; }
    y += 4;
  }

  // Experience
  if (experience.length) {
    y = sectionHead(doc, isCl ? "Professional Experience" : "Experience", y, template);
    for (const e of experience) {
      y = ensureSpace(doc, y, 16);
      doc.setFont(bf, "bold").setFontSize(10); doc.setTextColor(c.tx[0], c.tx[1], c.tx[2]);
      const rt = template === "minimal" && e.company ? `${e.role} — ${e.company}` : (e.role || "");
      doc.text(rt, MARGIN, y);
      if (e.startDate || e.endDate) {
        doc.setFont(bf, isCl ? "italic" : "normal").setFontSize(8.5); doc.setTextColor(c.mu[0], c.mu[1], c.mu[2]);
        const ds = `${e.startDate || ""}${e.startDate ? " – " : ""}${e.endDate || "Present"}`;
        doc.text(ds, PAGE_W - MARGIN, y, { align: "right" });
      }
      y += 4.5;
      if (e.company && template !== "minimal") {
        doc.setFont(bf, isCl ? "italic" : "normal").setFontSize(9); doc.setTextColor(c.mu[0], c.mu[1], c.mu[2]);
        doc.text(e.company, MARGIN, y); y += 4;
      }
      if (e.description) {
        doc.setFont(bf, "normal").setFontSize(9); doc.setTextColor(68, 68, 68);
        for (const b of e.description.split("\n").filter(l => l.trim())) {
          const clean = b.replace(/^[•\-]\s*/, "");
          for (const bl of wrap(doc, `• ${clean}`, CONTENT_W - 4)) { y = ensureSpace(doc, y, 4); doc.text(bl, MARGIN + 2, y); y += 3.8; }
        }
      }
      y += 3;
    }
    y += 2;
  }

  // Education
  if (education.length) {
    y = sectionHead(doc, "Education", y, template);
    for (const e of education) {
      y = ensureSpace(doc, y, 10);
      doc.setFont(bf, "bold").setFontSize(10); doc.setTextColor(c.tx[0], c.tx[1], c.tx[2]);
      doc.text(e.degree || "", MARGIN, y);
      if (e.endDate) { doc.setFont(bf, isCl ? "italic" : "normal").setFontSize(8.5); doc.setTextColor(c.mu[0], c.mu[1], c.mu[2]); doc.text(e.endDate, PAGE_W - MARGIN, y, { align: "right" }); }
      y += 4.5;
      if (e.school) { doc.setFont(bf, isCl ? "italic" : "normal").setFontSize(9); doc.setTextColor(c.mu[0], c.mu[1], c.mu[2]); doc.text(e.school, MARGIN, y); y += 4; }
      y += 2;
    }
    y += 2;
  }

  // Skills
  if (skills.length) {
    y = sectionHead(doc, "Skills", y, template);
    if (template === "modern") {
      let cx = MARGIN;
      const ch = 5.5, cp2 = 3, cg = 2;
      doc.setFontSize(8);
      for (const s of skills) {
        const tw = doc.getTextWidth(s);
        const cw = tw + cp2 * 2;
        if (cx + cw > PAGE_W - MARGIN) { cx = MARGIN; y += ch + cg; y = ensureSpace(doc, y, ch + 2); }
        doc.setFillColor(c.ac[0], c.ac[1], c.ac[2]);
        doc.roundedRect(cx, y - 3.8, cw, ch, 1.5, 1.5, "F");
        doc.setFont("helvetica", "bold"); doc.setTextColor(c.at[0], c.at[1], c.at[2]);
        doc.text(s, cx + cp2, y);
        cx += cw + cg;
      }
      y += ch + 4;
    } else {
      doc.setFont(bf, "normal").setFontSize(9); doc.setTextColor(68, 68, 68);
      const sep = template === "minimal" ? "  ·  " : "  •  ";
      for (const l of wrap(doc, skills.join(sep), CONTENT_W)) { y = ensureSpace(doc, y, 4); doc.text(l, MARGIN, y); y += 4; }
      y += 4;
    }
  }

  // Projects
  if (projects.length) {
    y = sectionHead(doc, "Projects", y, template);
    for (const pr of projects) {
      y = ensureSpace(doc, y, 10);
      doc.setFont(bf, "bold").setFontSize(10); doc.setTextColor(c.tx[0], c.tx[1], c.tx[2]);
      doc.text(pr.name || "", MARGIN, y); y += 4.5;
      if (pr.description) { doc.setFont(bf, "normal").setFontSize(9); doc.setTextColor(68, 68, 68); for (const l of wrap(doc, pr.description, CONTENT_W)) { y = ensureSpace(doc, y, 4); doc.text(l, MARGIN, y); y += 3.8; } }
      if (pr.techStack.length) { y = ensureSpace(doc, y, 5); doc.setFont(bf, "italic").setFontSize(8); doc.setTextColor(c.mu[0], c.mu[1], c.mu[2]); doc.text(pr.techStack.join(", "), MARGIN, y); y += 4; }
      if (pr.link) { doc.setFont(bf, "normal").setFontSize(8); doc.setTextColor(c.pr[0], c.pr[1], c.pr[2]); doc.text(pr.link, MARGIN, y); y += 4; }
      y += 2;
    }
    y += 2;
  }

  // Certifications
  if (certifications.length) {
    y = sectionHead(doc, "Certifications", y, template);
    for (const cert of certifications) {
      y = ensureSpace(doc, y, 6);
      doc.setFont(bf, "bold").setFontSize(9); doc.setTextColor(c.tx[0], c.tx[1], c.tx[2]);
      doc.text(cert.name || "", MARGIN, y); y += 3.5;
      if (cert.issuer || cert.date) { doc.setFont(bf, "normal").setFontSize(8); doc.setTextColor(c.mu[0], c.mu[1], c.mu[2]); doc.text([cert.issuer, cert.date].filter(Boolean).join(" • "), MARGIN, y); y += 3.5; }
      y += 2;
    }
    y += 2;
  }

  // Extracurriculars
  if (extracurriculars.length) {
    y = sectionHead(doc, isCl ? "Activities" : "Extracurriculars", y, template);
    doc.setFont(bf, "normal").setFontSize(9); doc.setTextColor(68, 68, 68);
    for (const item of extracurriculars) {
      for (const l of wrap(doc, `• ${item}`, CONTENT_W)) { y = ensureSpace(doc, y, 4); doc.text(l, MARGIN, y); y += 3.8; }
    }
  }

  doc.save(getFileName(data));
}