export interface PersonalInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  summary: string;
  linkedin: string;
  github: string;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  startDate: string;
  endDate: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  techStack: string[];
  link: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
}

export interface CVData {
  personal: PersonalInfo;
  experience: Experience[];
  education: Education[];
  skills: string[];
  projects: Project[];
  certifications: Certification[];
  extracurriculars: string[];
}

export const defaultCV: CVData = {
  personal: { name: "", title: "", email: "", phone: "", location: "", website: "", summary: "", linkedin: "", github: "" },
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  extracurriculars: [],
};

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export const uid = () => Math.random().toString(36).slice(2, 9);
