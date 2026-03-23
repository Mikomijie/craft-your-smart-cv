import { useAuth } from "@/hooks/useAuth";

const sectionTitles: Record<string, string> = {
  "my-cvs": "My CVs",
  build: "Build New CV",
  tailor: "Tailor for Job",
};

const AppTopBar = ({ activeSection }: { activeSection: string }) => {
  const { user } = useAuth();

  return (
    <header className="flex items-center justify-between pb-6 border-b border-border mb-8">
      <h1 className="text-xl font-bold tracking-tight">
        {sectionTitles[activeSection] ?? "My CVs"}
      </h1>
      {user && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/5 text-primary text-xs font-medium">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          Signed in
        </div>
      )}
    </header>
  );
};

export default AppTopBar;
