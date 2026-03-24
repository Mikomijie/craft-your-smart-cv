import { useState } from "react";
import { FileText, Plus, Sparkles, Download, Trash2, Loader2 } from "lucide-react";
import { sampleCV } from "@/components/app/cv-builder/sampleCV";
import { uid } from "@/components/app/cv-builder/types";
import type { CVData } from "@/components/app/cv-builder/types";
import { generateCV } from "@/components/app/cv-builder/pdfGenerator";
import { toast } from "sonner";

const MyCVsSection = ({ onNavigate }: { onNavigate: (section: string) => void }) => {
  const [, forceUpdate] = useState(0);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const savedList: { id: string; name: string; data: CVData; createdAt: string }[] =
    JSON.parse(localStorage.getItem("craftcv-list") || "[]");

  const handleTryDemo = () => {
    const saved = [...savedList];
    saved.push({
      id: uid(),
      name: sampleCV.personal.name,
      data: sampleCV,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem("craftcv-list", JSON.stringify(saved));
    toast.success("Sample CV added! You can now tailor it for any job.");
    forceUpdate((n) => n + 1);
  };

  const handleDownload = (cv: { id: string; data: CVData }, e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloadingId(cv.id);
    try {
      generateCV(cv.data, "modern");
      toast.success("PDF downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = (cvId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedList.filter((c) => c.id !== cvId);
    localStorage.setItem("craftcv-list", JSON.stringify(updated));
    toast.success("CV deleted");
    forceUpdate((n) => n + 1);
  };

  return (
    <div className="space-y-6">
      {savedList.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedList.map((cv) => (
            <div
              key={cv.id}
              className="group relative bg-card rounded-2xl border border-border p-6 hover:border-primary/30 hover:shadow-md transition-all duration-300 cursor-pointer"
              onClick={() => onNavigate("build")}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleDownload(cv, e)}
                    disabled={downloadingId === cv.id}
                    className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                    title="Download PDF"
                  >
                    {downloadingId === cv.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={(e) => handleDelete(cv.id, e)}
                    className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                    title="Delete CV"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
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
