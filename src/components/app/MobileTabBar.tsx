import { FolderOpen, PlusCircle, Target, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const tabs = [
  { id: "my-cvs", label: "My CVs", icon: FolderOpen },
  { id: "build", label: "Build", icon: PlusCircle },
  { id: "tailor", label: "Tailor", icon: Target },
];

interface MobileTabBarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const MobileTabBar = ({ activeSection, onSectionChange }: MobileTabBarProps) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border">
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSectionChange(tab.id)}
              className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all duration-300 ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
        <button
          onClick={async () => { await signOut(); navigate("/"); }}
          className="flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl text-muted-foreground"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[10px] font-medium">Exit</span>
        </button>
      </div>
    </nav>
  );
};

export default MobileTabBar;
