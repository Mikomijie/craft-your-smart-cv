import { FileText, Plus } from "lucide-react";

const MyCVsSection = ({ onNavigate }: { onNavigate: (section: string) => void }) => {
  const hasCVs = !!localStorage.getItem("craftcv-data");

  return (
    <div className="space-y-6">
      {hasCVs ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="group relative bg-card rounded-2xl border border-border p-6 hover:border-primary/30 hover:shadow-md transition-all duration-300 cursor-pointer"
            onClick={() => onNavigate("build")}
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-sm mb-1">My CV</h3>
            <p className="text-xs text-muted-foreground">Last edited recently</p>
          </div>

          <button
            onClick={() => onNavigate("build")}
            className="flex flex-col items-center justify-center bg-card rounded-2xl border border-dashed border-border p-6 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 min-h-[140px]"
          >
            <Plus className="w-6 h-6 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground font-medium">Create New</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold mb-2">No CVs yet</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            Create your first CV and tailor it to any job in seconds.
          </p>
          <button
            onClick={() => onNavigate("build")}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 hover:brightness-110 active:scale-[0.97]"
          >
            <Plus className="w-4 h-4" />
            Build Your First CV
          </button>
        </div>
      )}
    </div>
  );
};

export default MyCVsSection;
