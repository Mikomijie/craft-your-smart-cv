import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, FolderOpen, PlusCircle, Target, Lightbulb, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const navItems = [
  { id: "my-cvs", label: "My CVs", icon: FolderOpen },
  { id: "build", label: "Build New CV", icon: PlusCircle },
  { id: "tailor", label: "Tailor for Job", icon: Target },
];

const tips = [
  "Quantify achievements with numbers — recruiters love metrics.",
  "Tailor your summary for each role you apply to.",
  "Keep your CV to one page for most roles.",
  "Use action verbs: Led, Built, Designed, Shipped.",
  "Add a link to your portfolio or LinkedIn profile.",
];

interface AppSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const AppSidebar = ({ activeSection, onSectionChange }: AppSidebarProps) => {
  const [tipIndex, setTipIndex] = useState(0);
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <aside className="hidden md:flex flex-col w-[280px] h-screen bg-card border-r border-border fixed left-0 top-0 z-30">
      <Link to="/" className="flex items-center gap-2.5 px-6 py-5 border-b border-border">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
          <FileText className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-bold text-base tracking-tight">CraftCV</span>
      </Link>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`
                relative w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                transition-all duration-300 group
                ${isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <item.icon className={`w-[18px] h-[18px] transition-colors duration-300 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Tip Card */}
      <div className="px-4 pb-3">
        <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
              <Lightbulb className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-xs font-semibold text-primary">Pro Tip</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={tipIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="text-xs text-muted-foreground leading-relaxed"
            >
              {tips[tipIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* User + Sign Out */}
      <div className="px-4 pb-5 border-t border-border pt-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground truncate max-w-[180px]">
            {user?.email || ""}
          </span>
          <button
            onClick={handleSignOut}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
