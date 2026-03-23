import type { CVData } from "./types";

export const sampleCV: CVData = {
  personal: {
    name: "Alex Johnson",
    title: "Full Stack Developer",
    email: "alex.johnson@email.com",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA",
    website: "alexjohnson.dev",
    summary:
      "Results-driven Full Stack Developer with 5+ years of experience building scalable web applications. Expertise in React, Node.js, and cloud infrastructure. Passionate about clean code, performance optimization, and delivering exceptional user experiences.",
    linkedin: "linkedin.com/in/alexjohnson",
    github: "github.com/alexjohnson",
  },
  experience: [
    {
      id: "exp-0",
      company: "TechFlow Inc.",
      role: "Senior Full Stack Developer",
      startDate: "Jan 2022",
      endDate: "Present",
      description:
        "Led development of a real-time analytics dashboard serving 50K+ daily users\nArchitected microservices backend reducing API response time by 40%\nMentored a team of 4 junior developers and established code review practices\nImplemented CI/CD pipelines reducing deployment time from 2 hours to 15 minutes",
    },
    {
      id: "exp-1",
      company: "DataWave Solutions",
      role: "Frontend Developer",
      startDate: "Jun 2019",
      endDate: "Dec 2021",
      description:
        "Built responsive React applications with TypeScript for enterprise clients\nDesigned and implemented a component library used across 8 internal products\nOptimized bundle size by 60% through code splitting and lazy loading\nCollaborated with UX team to improve accessibility compliance to WCAG 2.1 AA",
    },
  ],
  education: [
    {
      id: "edu-0",
      school: "University of California, Berkeley",
      degree: "B.S. Computer Science",
      startDate: "2015",
      endDate: "2019",
    },
  ],
  skills: [
    "React",
    "TypeScript",
    "Node.js",
    "Python",
    "PostgreSQL",
    "AWS",
    "Docker",
    "GraphQL",
    "Git",
    "Tailwind CSS",
    "Next.js",
    "Redis",
  ],
  projects: [
    {
      id: "proj-0",
      name: "DevMetrics",
      description:
        "Open-source developer productivity dashboard that aggregates GitHub, Jira, and Slack data into actionable insights.",
      techStack: ["React", "Node.js", "PostgreSQL", "D3.js"],
      link: "github.com/alexjohnson/devmetrics",
    },
    {
      id: "proj-1",
      name: "QuickDeploy",
      description:
        "CLI tool that simplifies deploying containerized applications to AWS ECS with zero-config setup.",
      techStack: ["TypeScript", "Docker", "AWS SDK"],
      link: "github.com/alexjohnson/quickdeploy",
    },
  ],
  certifications: [
    {
      id: "cert-0",
      name: "AWS Solutions Architect Associate",
      issuer: "Amazon Web Services",
      date: "2023",
    },
  ],
  extracurriculars: [
    "Open source contributor to React and Next.js ecosystems",
    "Speaker at local JavaScript meetups",
  ],
};
