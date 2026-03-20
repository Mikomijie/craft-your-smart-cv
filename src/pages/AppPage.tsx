import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FileText, Plus, Trash2, ArrowLeft, Download, User, Briefcase,
  GraduationCap, Wrench, Mail, Phone, MapPin, Globe, ChevronDown, ChevronUp,
} from "lucide-react";

// Types
interface PersonalInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  summary: string;
}

interface Experience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface Education {
  id: string;
  school: string;
  degree: string;
  startDate: string;
  endDate: string;
}

interface CVData {
  personal: PersonalInfo;
  experience: Experience[];
  education: Education[];
  skills: string[];
}

const defaultCV: CVData = {
  personal: { name: "", title: "", email: "", phone: "", location: "", website: "", summary: "" },
  experience: [],
  education: [],
  skills: [],
};

const uid = () => Math.random().toString(36).slice(2, 9);

const sectionAnim = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

// Input component
const Field = ({ label, value, onChange, type = "text", placeholder = "", multiline = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; multiline?: boolean;
}) => (
  <div className="space-y-1.5">
    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>
    {multiline ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-300 resize-none"
      />
    ) : (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-300"
      />
    )}
  </div>
);

// Collapsible section
const Section = ({ icon: Icon, title, children, defaultOpen = true }: {
  icon: React.ElementType; title: string; children: React.ReactNode; defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <motion.div variants={sectionAnim} initial="hidden" animate="visible" className="bg-card rounded-2xl border border-border overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors duration-300 hover:bg-muted/50 active:scale-[0.995]"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-sm">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Preview
const CVPreview = ({ data }: { data: CVData }) => {
  const { personal, experience, education, skills } = data;
  const hasContent = personal.name || experience.length > 0 || education.length > 0 || skills.length > 0;

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-20">
        <FileText className="w-12 h-12 mb-4 opacity-30" />
        <p className="text-sm">Start filling in your details to see a preview here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-sm">
      {/* Header */}
      {personal.name && (
        <div className="border-b border-border pb-5">
          <h2 className="text-2xl font-bold tracking-tight">{personal.name}</h2>
          {personal.title && <p className="text-primary font-medium mt-1">{personal.title}</p>}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-muted-foreground text-xs">
            {personal.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{personal.email}</span>}
            {personal.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{personal.phone}</span>}
            {personal.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{personal.location}</span>}
            {personal.website && <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{personal.website}</span>}
          </div>
          {personal.summary && <p className="mt-4 text-foreground/80 leading-relaxed text-pretty">{personal.summary}</p>}
        </div>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Experience</h3>
          <div className="space-y-4">
            {experience.map((e) => (
              <div key={e.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{e.role || "Untitled Role"}</p>
                    <p className="text-muted-foreground">{e.company}</p>
                  </div>
                  {(e.startDate || e.endDate) && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{e.startDate} — {e.endDate || "Present"}</span>
                  )}
                </div>
                {e.description && <p className="mt-1.5 text-foreground/70 leading-relaxed text-pretty">{e.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Education</h3>
          <div className="space-y-3">
            {education.map((e) => (
              <div key={e.id} className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{e.degree || "Untitled"}</p>
                  <p className="text-muted-foreground">{e.school}</p>
                </div>
                {(e.startDate || e.endDate) && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{e.startDate} — {e.endDate || "Present"}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {skills.map((s, i) => (
              <span key={i} className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium">{s}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Main App
const AppPage = () => {
  const [data, setData] = useState<CVData>(() => {
    try {
      const saved = localStorage.getItem("craftcv-data");
      return saved ? JSON.parse(saved) : defaultCV;
    } catch {
      return defaultCV;
    }
  });

  const [skillInput, setSkillInput] = useState("");

  // Auto-save
  useEffect(() => {
    const t = setTimeout(() => localStorage.setItem("craftcv-data", JSON.stringify(data)), 400);
    return () => clearTimeout(t);
  }, [data]);

  const updatePersonal = useCallback((field: keyof PersonalInfo, value: string) => {
    setData((prev) => ({ ...prev, personal: { ...prev.personal, [field]: value } }));
  }, []);

  const addExperience = () => {
    setData((prev) => ({
      ...prev,
      experience: [...prev.experience, { id: uid(), company: "", role: "", startDate: "", endDate: "", description: "" }],
    }));
  };

  const updateExperience = (id: string, field: keyof Experience, value: string) => {
    setData((prev) => ({
      ...prev,
      experience: prev.experience.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    }));
  };

  const removeExperience = (id: string) => {
    setData((prev) => ({ ...prev, experience: prev.experience.filter((e) => e.id !== id) }));
  };

  const addEducation = () => {
    setData((prev) => ({
      ...prev,
      education: [...prev.education, { id: uid(), school: "", degree: "", startDate: "", endDate: "" }],
    }));
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    setData((prev) => ({
      ...prev,
      education: prev.education.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    }));
  };

  const removeEducation = (id: string) => {
    setData((prev) => ({ ...prev, education: prev.education.filter((e) => e.id !== id) }));
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !data.skills.includes(trimmed)) {
      setData((prev) => ({ ...prev, skills: [...prev.skills, trimmed] }));
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setData((prev) => ({ ...prev, skills: prev.skills.filter((s) => s !== skill) }));
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-5 py-3">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-300 active:scale-[0.97]">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm">CraftCV</span>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:brightness-110 active:scale-[0.97]"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-5 py-8 grid lg:grid-cols-[1fr_1fr] gap-8">
        {/* Editor */}
        <div className="space-y-4">
          <Section icon={User} title="Personal Information">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full Name" value={data.personal.name} onChange={(v) => updatePersonal("name", v)} placeholder="Alex Morgan" />
              <Field label="Job Title" value={data.personal.title} onChange={(v) => updatePersonal("title", v)} placeholder="Product Designer" />
              <Field label="Email" value={data.personal.email} onChange={(v) => updatePersonal("email", v)} placeholder="alex@example.com" type="email" />
              <Field label="Phone" value={data.personal.phone} onChange={(v) => updatePersonal("phone", v)} placeholder="+1 234 567 890" />
              <Field label="Location" value={data.personal.location} onChange={(v) => updatePersonal("location", v)} placeholder="San Francisco, CA" />
              <Field label="Website" value={data.personal.website} onChange={(v) => updatePersonal("website", v)} placeholder="alexmorgan.com" />
            </div>
            <Field label="Summary" value={data.personal.summary} onChange={(v) => updatePersonal("summary", v)} placeholder="A brief overview of your background and goals..." multiline />
          </Section>

          <Section icon={Briefcase} title="Experience" defaultOpen={false}>
            <div className="space-y-4">
              {data.experience.map((exp) => (
                <motion.div key={exp.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl border border-border bg-background space-y-3 relative group">
                  <button
                    onClick={() => removeExperience(exp.id)}
                    className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-300 opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Field label="Company" value={exp.company} onChange={(v) => updateExperience(exp.id, "company", v)} placeholder="Acme Inc" />
                    <Field label="Role" value={exp.role} onChange={(v) => updateExperience(exp.id, "role", v)} placeholder="Senior Designer" />
                    <Field label="Start Date" value={exp.startDate} onChange={(v) => updateExperience(exp.id, "startDate", v)} placeholder="Jan 2022" />
                    <Field label="End Date" value={exp.endDate} onChange={(v) => updateExperience(exp.id, "endDate", v)} placeholder="Present" />
                  </div>
                  <Field label="Description" value={exp.description} onChange={(v) => updateExperience(exp.id, "description", v)} placeholder="Key responsibilities and achievements..." multiline />
                </motion.div>
              ))}
              <button
                onClick={addExperience}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-primary hover:border-primary/40 transition-all duration-300 active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                Add Experience
              </button>
            </div>
          </Section>

          <Section icon={GraduationCap} title="Education" defaultOpen={false}>
            <div className="space-y-4">
              {data.education.map((edu) => (
                <motion.div key={edu.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl border border-border bg-background space-y-3 relative group">
                  <button
                    onClick={() => removeEducation(edu.id)}
                    className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-300 opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Field label="School" value={edu.school} onChange={(v) => updateEducation(edu.id, "school", v)} placeholder="Stanford University" />
                    <Field label="Degree" value={edu.degree} onChange={(v) => updateEducation(edu.id, "degree", v)} placeholder="B.S. Computer Science" />
                    <Field label="Start Date" value={edu.startDate} onChange={(v) => updateEducation(edu.id, "startDate", v)} placeholder="2018" />
                    <Field label="End Date" value={edu.endDate} onChange={(v) => updateEducation(edu.id, "endDate", v)} placeholder="2022" />
                  </div>
                </motion.div>
              ))}
              <button
                onClick={addEducation}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-primary hover:border-primary/40 transition-all duration-300 active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                Add Education
              </button>
            </div>
          </Section>

          <Section icon={Wrench} title="Skills" defaultOpen={false}>
            <div className="flex gap-2">
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSkill()}
                placeholder="Type a skill and press Enter..."
                className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-300"
              />
              <button
                onClick={addSkill}
                className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium transition-all duration-300 hover:brightness-110 active:scale-[0.97]"
              >
                Add
              </button>
            </div>
            {data.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {data.skills.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium group">
                    {s}
                    <button onClick={() => removeSkill(s)} className="opacity-50 hover:opacity-100 transition-opacity duration-200">×</button>
                  </span>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <div className="bg-card rounded-2xl border border-border p-8 shadow-sm min-h-[600px]">
            <CVPreview data={data} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppPage;
