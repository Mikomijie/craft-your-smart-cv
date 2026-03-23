import type { CVData, ChatMessage } from "./types";
import { defaultCV, uid } from "./types";

/**
 * Improved extraction: processes each user message contextually based on the
 * preceding assistant question so we know *what* the user is answering.
 */
export function extractDataFromMessages(messages: ChatMessage[]): CVData {
  const cv: CVData = JSON.parse(JSON.stringify(defaultCV));

  // Walk through messages in order, pairing each user reply with the preceding assistant prompt
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role !== "user") continue;

    const text = msg.content.trim();
    const prevAssistant = messages
      .slice(0, i)
      .reverse()
      .find((m) => m.role === "assistant")?.content.toLowerCase() || "";

    // Determine topic from the assistant question
    const isNameTopic = prevAssistant.includes("name") || prevAssistant.includes("role") || prevAssistant.includes("let's start");
    const isExpTopic = prevAssistant.includes("experience") || prevAssistant.includes("work") || prevAssistant.includes("company");
    const isEduTopic = prevAssistant.includes("education") || prevAssistant.includes("study") || prevAssistant.includes("degree") || prevAssistant.includes("university");
    const isSkillsTopic = prevAssistant.includes("skill");
    const isContactTopic = prevAssistant.includes("email") || prevAssistant.includes("phone") || prevAssistant.includes("contact") || prevAssistant.includes("reach");

    if (isNameTopic && !cv.personal.name) {
      parseNameAndTitle(text, cv);
    } else if (isExpTopic) {
      parseExperience(text, cv);
    } else if (isEduTopic) {
      parseEducation(text, cv);
    } else if (isSkillsTopic) {
      parseSkills(text, cv);
    } else if (isContactTopic) {
      parseContact(text, cv);
    } else {
      // Fallback: try to detect content type
      inferAndParse(text, cv);
    }
  }

  // Auto-suggest skills based on job title and experience if none added
  if (cv.skills.length === 0) {
    const suggestedSkills = suggestSkillsFromRole(cv);
    cv.skills = suggestedSkills;
  }

  return cv;
}

function parseNameAndTitle(text: string, cv: CVData) {
  const namePatterns = [
    /(?:i'?m|i am|my name is|name is|name:)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/m,
  ];
  for (const p of namePatterns) {
    const m = text.match(p);
    if (m) { cv.personal.name = m[1].trim(); break; }
  }

  const rolePatterns = [
    /(?:looking for|role|position|work as|want to be|i'?m an?|i am an?)\s+(?:a\s+)?(.+?)(?:\s+role|\s+position|\s+job|[.,!]|$)/i,
    /(?:as (?:a |an )?)([\w\s]+?)(?:\s+at|\s+for|[,.]|$)/i,
  ];
  for (const p of rolePatterns) {
    const m = text.match(p);
    if (m && m[1].trim().length > 2) { cv.personal.title = m[1].trim(); break; }
  }
}

function parseExperience(text: string, cv: CVData) {
  const patterns = [
    /(?:work(?:ed|ing)?|was|am)\s+(?:as\s+)?(?:an?\s+)?([\w\s/&-]+?)\s+(?:at|for|@)\s+([\w\s&.,'-]+?)(?:\s+(?:for|since|from|,)|[.!]|$)/i,
    /(?:at|@)\s+([\w\s&.,'-]+?)\s+(?:as|,)\s+(?:an?\s+)?([\w\s/&-]+?)(?:\s+(?:for|since|from)|[.!]|$)/i,
  ];

  let role = "";
  let company = "";

  const m1 = text.match(patterns[0]);
  if (m1) {
    role = m1[1].trim();
    company = m1[2].trim();
  } else {
    const m2 = text.match(patterns[1]);
    if (m2) {
      company = m2[1].trim();
      role = m2[2].trim();
    }
  }

  // Date extraction
  const dateMatch = text.match(/(?:from|since)\s+(\w+\s*\d{4})\s*(?:to|-|–)\s*(\w+\s*\d{4}|present|now|current)/i);
  const startDate = dateMatch?.[1] || "";
  const endDate = dateMatch?.[2] || "Present";

  const isCurrent = /\b(currently|current|present|now|still)\b/i.test(text);

  // Extract only responsibilities/achievements — NOT the "I worked as X at Y" sentence
  const description = extractResponsibilities(text);

  if (role || company) {
    cv.experience.push({
      id: uid(),
      company: cleanTrailing(company),
      role: capitalizeRole(cleanTrailing(role)),
      startDate,
      endDate: isCurrent ? "Present" : endDate,
      description,
    });
  }
}

/**
 * Extract only responsibility/achievement bullet points from text.
 * Filters out the introductory "I worked as X at Y" type sentences.
 */
function extractResponsibilities(text: string): string {
  // Split by common delimiters
  const parts = text.split(/[•\-\n;]/).map(s => s.trim()).filter(s => s.length > 0);

  // Filter out "I worked as..." / "I was a..." / "at Company" intro sentences
  const introPattern = /^(?:i\s+(?:work(?:ed|ing)?|was|am)\s+(?:as\s+)?(?:an?\s+)?[\w\s/&-]+\s+(?:at|for|@)\s+[\w\s&.,'-]+|(?:at|@)\s+[\w\s&.,'-]+\s+(?:as|,)\s+[\w\s/&-]+)/i;

  const responsibilities = parts.filter(part => {
    // Skip short fragments
    if (part.length < 15) return false;
    // Skip if it's just the intro sentence about where they worked
    if (introPattern.test(part)) return false;
    // Skip sentences that are just "I worked at X" with no real responsibility info
    if (/^i\s+(?:work(?:ed|ing)?|was|am)\b/i.test(part) && !/(?:responsible|managed|led|built|created|developed|designed|improved|increased|reduced|implemented|delivered|achieved)/i.test(part)) return false;
    return true;
  });

  if (responsibilities.length === 0) return "";
  return responsibilities.map(r => r.replace(/^[•\-\s]+/, "")).join("\n");
}

function parseEducation(text: string, cv: CVData) {
  // Extract only the university/school name, not the full sentence
  let school = "";

  // Match specific university name patterns
  const uniNameMatch = text.match(/((?:[\w]+\s+)*(?:University|College|Institute|School)(?:\s+of\s+[\w\s]+)?)/i);
  if (uniNameMatch) {
    school = uniNameMatch[1].trim();
  } else {
    // Try "at [School Name]" or "from [School Name]"
    const atMatch = text.match(/(?:at|from)\s+([\w\s]+?)(?:[,;.]|\s+(?:studying|majoring|in|with|where|and))/i);
    if (atMatch) {
      school = atMatch[1].trim();
    } else {
      // Last resort: first segment before comma, only if it looks like a name
      const firstSeg = text.split(/[,;]/)[0].trim();
      if (firstSeg.length > 3 && firstSeg.length < 60 && /^[A-Z]/.test(firstSeg)) {
        school = firstSeg;
      }
    }
  }

  // Degree extraction
  const degreeMatch = text.match(/\b(b\.?s\.?c?\.?|m\.?s\.?c?\.?|bachelor'?s?|master'?s?|ph\.?d\.?|diploma|associate'?s?)\s*(?:in\s+|of\s+)?([\w\s]+?)(?:[,;.]|$)/i);
  let degree = "";
  let field = "";
  if (degreeMatch) {
    degree = degreeMatch[1].trim();
    field = degreeMatch[2]?.trim() || "";
  } else {
    const fieldMatch = text.match(/(?:computer science|engineering|mathematics|physics|business|economics|law|medicine|chemistry|biology|psychology|marketing|finance|accounting|design|arts|literature|philosophy|history)/i);
    if (fieldMatch) field = fieldMatch[0];
  }

  // GPA / grade extraction
  const gpaMatch = text.match(/(\d\.\d{1,2})\s*(?:gpa|cgpa|grade)?/i)
    || text.match(/(?:gpa|cgpa|grade|finished with|graduated with)\s*[:.]?\s*(\d\.\d{1,2})/i);
  const gpa = gpaMatch ? gpaMatch[1] : "";

  // Year extraction
  const yearMatch = text.match(/\b(20\d{2}|19\d{2})\b/);
  const endDate = yearMatch ? yearMatch[1] : "";

  if (school || degree || field) {
    const fullDegree = degree && field
      ? `${normalizeDegree(degree)} ${field}`
      : degree || (field ? `BSc ${field}` : "");

    cv.education.push({
      id: uid(),
      school,
      degree: fullDegree + (gpa ? ` (${gpa} GPA)` : ""),
      startDate: "",
      endDate,
    });
  }
}

function parseSkills(text: string, cv: CVData) {
  const items = text
    .split(/[,;\n•]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && s.length < 40);
  cv.skills = [...new Set([...cv.skills, ...items])].slice(0, 20);
}

function parseContact(text: string, cv: CVData) {
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (emailMatch) cv.personal.email = emailMatch[0];

  const phoneMatch = text.match(/[\d+][\d\s()-]{6,}/);
  if (phoneMatch) cv.personal.phone = phoneMatch[0].trim();

  const locMatch = text.match(/(?:location|based in|live in|from|in)\s+(.+?)(?:[,.]|$)/i);
  if (locMatch) cv.personal.location = locMatch[1].trim();

  let remaining = text;
  [emailMatch?.[0], phoneMatch?.[0], locMatch?.[0]].forEach(m => {
    if (m) remaining = remaining.replace(m, "");
  });
  remaining = remaining.replace(/\b(email|phone|location|based|live)\b/gi, "").trim();
  if (remaining.length > 20) cv.personal.summary = remaining;
}

function inferAndParse(text: string, cv: CVData) {
  if (/(?:work|company|engineer|manager|developer|designer|at\s)/i.test(text)) {
    parseExperience(text, cv);
  } else if (/(?:university|college|degree|bachelor|master|studied|graduated)/i.test(text)) {
    parseEducation(text, cv);
  } else if (/(?:@|email|phone|\d{3})/i.test(text)) {
    parseContact(text, cv);
  } else if (text.includes(",") && text.split(",").length >= 3) {
    parseSkills(text, cv);
  }
}

/**
 * Auto-suggest skills based on the user's job title and experience companies.
 */
function suggestSkillsFromRole(cv: CVData): string[] {
  const title = (cv.personal.title || "").toLowerCase();
  const roles = cv.experience.map(e => e.role.toLowerCase()).join(" ");
  const combined = `${title} ${roles}`;

  const skillMap: Record<string, string[]> = {
    "software engineer": ["JavaScript", "Python", "Git", "Problem Solving"],
    "frontend": ["React", "TypeScript", "CSS", "Responsive Design"],
    "backend": ["Node.js", "SQL", "REST APIs", "System Design"],
    "fullstack": ["React", "Node.js", "TypeScript", "SQL"],
    "full stack": ["React", "Node.js", "TypeScript", "SQL"],
    "data scientist": ["Python", "Machine Learning", "SQL", "Data Analysis"],
    "data analyst": ["SQL", "Excel", "Python", "Data Visualization"],
    "ai engineer": ["Python", "Machine Learning", "Deep Learning", "TensorFlow"],
    "machine learning": ["Python", "TensorFlow", "PyTorch", "Statistics"],
    "product manager": ["Product Strategy", "Agile", "Stakeholder Management", "Data Analysis"],
    "project manager": ["Project Planning", "Agile", "Risk Management", "Communication"],
    "designer": ["Figma", "UI/UX Design", "Prototyping", "User Research"],
    "ux": ["User Research", "Wireframing", "Figma", "Usability Testing"],
    "devops": ["Docker", "Kubernetes", "CI/CD", "AWS"],
    "marketing": ["Digital Marketing", "SEO", "Content Strategy", "Analytics"],
    "sales": ["CRM", "Negotiation", "Lead Generation", "Communication"],
  };

  for (const [key, skills] of Object.entries(skillMap)) {
    if (combined.includes(key)) return skills;
  }

  // Generic fallback if we have a title but no match
  if (cv.personal.title) {
    return ["Communication", "Problem Solving", "Team Collaboration", "Time Management"];
  }

  return [];
}

// Helpers
function cleanTrailing(s: string): string {
  return s.replace(/[\s,;.]+$/, "").trim();
}

function capitalizeRole(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalizeDegree(d: string): string {
  const lower = d.toLowerCase().replace(/\./g, "");
  if (/^bsc?$/.test(lower)) return "BSc";
  if (/^msc?$/.test(lower)) return "MSc";
  if (/^phd$/.test(lower)) return "PhD";
  if (/^bachelor/.test(lower)) return "Bachelor's";
  if (/^master/.test(lower)) return "Master's";
  return d;
}
