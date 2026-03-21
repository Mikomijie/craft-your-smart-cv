import { Lock } from "lucide-react";

const sectionTitles: Record<string, string> = {
  "my-cvs": "My CVs",
  build: "Build New CV",
  tailor: "Tailor for Job",
};

const AppTopBar = ({ activeSection }: { activeSection: string }) => (
  <header className="flex items-center justify-between pb-6 border-b border-border mb-8">
    <h1 className="text-xl font-bold tracking-tight">
      {sectionTitles[activeSection] ?? "My CVs"}
    </h1>
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted text-muted-foreground text-xs font-medium">
      <Lock className="w-3 h-3" />
      Your CVs are saved locally
    </div>
  </header>
);

export default AppTopBar;
