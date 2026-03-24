import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { FileText, MessageSquare, ClipboardPaste, Download, ArrowRight, Upload, Play } from "lucide-react";
import { useRef } from "react";
import { GlowingOrbs } from "@/components/LandingBackgroundLayers";

const ease = [0.16, 1, 0.3, 1] as const;

const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.35, ease },
  },
});

// ─── Feature cards data ───
const features = [
  {
    icon: MessageSquare,
    title: "Chat to Build",
    desc: "No forms. Just talk. AI builds your CV from the conversation.",
  },
  {
    icon: ClipboardPaste,
    title: "Paste Any Job",
    desc: "Drop in a job description. Get a perfectly tailored CV in seconds.",
  },
  {
    icon: Download,
    title: "Download Beautiful PDF",
    desc: "Professional, designer-quality PDF. Ready to send.",
  },
];

// ─── Steps data ───
const steps = [
  { num: "01", icon: Upload, label: "Upload or chat to create your CV" },
  { num: "02", icon: ClipboardPaste, label: "Paste a job description" },
  { num: "03", icon: Download, label: "Download your tailored CV + cover letter" },
];

// ─── Animated feature icon wrapper ───
const FeatureIcon = ({ icon: Icon }: { icon: React.ElementType }) => (
  <motion.div
    className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-5"
    whileHover={{ scale: 1.12, rotate: -6 }}
    transition={{ type: "spring", stiffness: 300, damping: 15 }}
  >
    <Icon className="w-5 h-5 text-primary" />
  </motion.div>
);

// ─── How-it-works connector line (draws on scroll) ───
const StepConnector = () => {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  return (
    <svg
      ref={ref}
      className="hidden md:block absolute top-1/2 left-0 w-full h-[2px] -translate-y-1/2 pointer-events-none"
      preserveAspectRatio="none"
    >
      <motion.line
        x1="16.6%"
        y1="1"
        x2="83.4%"
        y2="1"
        stroke="hsl(221 83% 53%)"
        strokeWidth="2"
        strokeDasharray="6 6"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={inView ? { pathLength: 1, opacity: 0.25 } : {}}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
      />
    </svg>
  );
};

const LandingPage = () => {
  return (
    <div className="landing-section min-h-screen relative overflow-hidden">
      {/* Background layers */}
      <GlowingOrbs />

      {/* ═══ Nav ═══ */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease }}
          className="flex items-center gap-2.5"
        >
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <FileText className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight text-landing-fg">CraftCV</span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease }}
        >
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 hover:brightness-110 active:scale-[0.97]"
          >
            Open App
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </nav>

      {/* ═══ Hero ═══ */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pt-20 sm:pt-28 pb-24 text-center">
        <motion.h1
          variants={fadeUp(0)}
          initial="hidden"
          animate="visible"
          className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-landing-fg leading-[1.08] text-balance"
        >
          Your CV. Tailored to
          <br className="hidden sm:block" /> every job.{" "}
          <span className="text-primary">Instantly.</span>
        </motion.h1>

        <motion.p
          variants={fadeUp(0.12)}
          initial="hidden"
          animate="visible"
          className="mt-6 text-base sm:text-lg text-landing-muted max-w-2xl mx-auto leading-relaxed text-pretty"
        >
          Upload your CV once. Chat to build one from scratch. Then let AI
          tailor it perfectly to any job in seconds.
        </motion.p>

        <motion.div
          variants={fadeUp(0.24)}
          initial="hidden"
          animate="visible"
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-xl text-base font-semibold transition-all duration-300 hover:brightness-110 active:scale-[0.97] shadow-[0_0_40px_hsl(221_83%_53%/0.25)]"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold border-2 border-landing-border text-landing-fg transition-all duration-300 hover:border-primary/40 hover:text-primary active:scale-[0.97]"
          >
            <Play className="w-4 h-4" />
            See How It Works
          </a>
        </motion.div>
      </section>

      {/* ═══ Features (3 cards) ═══ */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-28">
        <div className="grid sm:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              variants={fadeUp(i * 0.1)}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              className="bg-landing-card border border-landing-border rounded-2xl p-7 transition-all duration-300 hover:border-primary/30 hover:shadow-[0_8px_30px_hsl(221_83%_53%/0.08)] group"
            >
              <FeatureIcon icon={f.icon} />
              <h3 className="text-base font-semibold text-landing-fg mb-2">{f.title}</h3>
              <p className="text-sm text-landing-muted leading-relaxed text-pretty">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ How It Works ═══ */}
      <section id="how-it-works" className="relative z-10 max-w-4xl mx-auto px-6 pb-32">
        <motion.h2
          variants={fadeUp(0)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          className="text-2xl sm:text-3xl font-bold text-landing-fg text-center mb-16 tracking-tight"
        >
          Three steps. That's it.
        </motion.h2>

        <div className="relative">
          <StepConnector />
          <div className="grid md:grid-cols-3 gap-10 md:gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                variants={fadeUp(0.15 + i * 0.15)}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                className="text-center relative"
              >
                <div className="relative z-10 mx-auto w-16 h-16 rounded-2xl bg-landing-card border-2 border-landing-border flex items-center justify-center mb-5 shadow-sm">
                  <step.icon className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xs font-bold text-primary tracking-widest uppercase mb-2 block">
                  Step {step.num}
                </span>
                <p className="text-sm font-medium text-landing-fg leading-relaxed text-pretty max-w-[220px] mx-auto">
                  {step.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="relative z-10 border-t border-landing-border py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm text-landing-fg">CraftCV</span>
          </div>
          <p className="text-sm text-landing-muted">Built for job seekers everywhere.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
