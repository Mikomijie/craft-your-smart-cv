import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FileText, Sparkles, Download, Zap, ArrowRight } from "lucide-react";
import { GlowingOrbs, DriftingWords, CircuitLines } from "@/components/LandingBackgroundLayers";

const ease = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { delay: i * 0.1, duration: 0.6, ease },
  }),
};

const features = [
  {
    icon: FileText,
    title: "Structured Sections",
    desc: "Experience, education, skills — all organized in clean, editable blocks.",
  },
  {
    icon: Sparkles,
    title: "Live Preview",
    desc: "See your CV update in real-time as you type. No guesswork.",
  },
  {
    icon: Download,
    title: "Export Ready",
    desc: "Download your finished CV as a polished PDF, ready to send.",
  },
  {
    icon: Zap,
    title: "Auto-Save",
    desc: "Your progress saves automatically. Come back anytime and pick up where you left.",
  },
];

const LandingPage = () => {
  return (
    <div className="landing-section min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease }}
          className="flex items-center gap-2"
        >
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <FileText className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-landing-fg">CraftCV</span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease }}
        >
          <Link
            to="/app"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 hover:brightness-110 active:scale-[0.97]"
          >
            Open App
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-landing-border bg-landing-card text-sm text-landing-muted mb-8"
        >
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          Free & open — no sign-up required
        </motion.div>

        <motion.h1
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-5xl sm:text-7xl font-bold tracking-tight text-landing-fg leading-[1.05] text-balance"
        >
          Your CV,
          <br />
          but{" "}
          <span className="text-primary">smarter</span>.
        </motion.h1>

        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-6 text-lg sm:text-xl text-landing-muted max-w-xl mx-auto text-pretty"
        >
          Build a clean, professional CV in minutes. No templates to fight, no
          formatting headaches — just your story, presented beautifully.
        </motion.p>

        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-10 flex items-center justify-center gap-4"
        >
          <Link
            to="/app"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-7 py-3.5 rounded-xl text-base font-semibold transition-all duration-300 hover:brightness-110 active:scale-[0.97] shadow-[0_0_32px_hsl(221_83%_53%/0.3)]"
          >
            Start Building
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Glow */}
        <div className="relative mt-16">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-glow-pulse pointer-events-none" />
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-32">
        <div className="grid sm:grid-cols-2 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              className="bg-landing-card border border-landing-border rounded-2xl p-6 transition-colors duration-300 hover:border-primary/30 group"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 transition-colors duration-300 group-hover:bg-primary/20">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-landing-fg mb-1.5">{f.title}</h3>
              <p className="text-sm text-landing-muted leading-relaxed text-pretty">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-landing-border py-8 text-center text-sm text-landing-muted">
        <p>CraftCV — built with care, no data leaves your browser.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
