import { FileText, Plus, Sparkles } from "lucide-react";
import { sampleCV } from "@/components/app/cv-builder/sampleCV";
import { uid } from "@/components/app/cv-builder/types";
import { toast } from "sonner";

const MyCVsSection = ({ onNavigate }: { onNavigate: (section: string) => void }) => {
  const hasCVs = !!localStorage.getItem("craftcv-data") || (JSON.parse(localStorage.getItem("craftcv-list") || "[]")).length > 0;

  const handleTryDemo = () => {
    const saved = JSON.parse(localStorage.getItem("craftcv-list") || "[]");
    saved.push({
      id: uid(),
      name: sampleCV.personal.name,
      data: sampleCV,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem("craftcv-list", JSON.stringify(saved));
    toast.success("Sample CV added! You can now tailor it for any job.");
    // Force re-render
    window.dispatchEvent(new Event("storage"));
    onNavigate("my-cvs");
  };

  const savedList = JSON.parse(localStorage.getItem("craftcv-list") || "[]");

  return (
    <div className="space-y-6">
      {savedList.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedList.map((cv: any) => (
            <div
              key={cv.id}
              className="group relative bg-card rounded-2xl border border-border p-6 hover:border-primary/30 hover:shadow-md transition-all duration-300 cursor-pointer"
              onClick={() => onNavigate("build")}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{cv.name || "My CV"}</h3>
              <p className="text-xs text-muted-foreground">
                {cv.data?.personal?.title || "No title"} · Created {new Date(cv.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}

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
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => onNavigate("build")}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 hover:brightness-110 active:scale-[0.97]"
            >
              <Plus className="w-4 h-4" />
              Build Your First CV
            </button>
            <button
              onClick={handleTryDemo}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-primary/30 bg-primary/5 text-primary text-sm font-medium hover:bg-primary/10 transition-all duration-300"
            >
              <Sparkles className="w-4 h-4" />
              Try with Sample CV
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCVsSection;
