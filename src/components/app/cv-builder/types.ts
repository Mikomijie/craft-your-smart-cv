export interface PersonalInfo {
  name: string; title: string; email: string; phone: string; location: string; website: string; summary: string;
}

export interface Experience {
  id: string; company: string; role: string; startDate: string; endDate: string; description: string;
}

export interface Education {
  id: string; school: string; degree: string; startDate: string; endDate: string;
}

export interface CVData {
  personal: PersonalInfo; experience: Experience[]; education: Education[]; skills: string[];
}

export const defaultCV: CVData = {
  personal: { name: "", title: "", email: "", phone: "", location: "", website: "", summary: "" },
  experience: [], education: [], skills: [],
};

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export const uid = () => Math.random().toString(36).slice(2, 9);
