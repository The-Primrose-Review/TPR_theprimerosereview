import { Eye, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function PreviewBanner() {
  const navigate = useNavigate();
  const exitPath = sessionStorage.getItem('previewExitPath') ?? '/dashboard';

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-indigo-600 px-4 py-2.5 text-white shadow-md">
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20">
          <Eye className="h-3.5 w-3.5" />
        </div>
        <div className="text-sm">
          <span className="font-semibold">Student Experience Preview</span>
          <span className="mx-2 opacity-60">·</span>
          <span className="opacity-80">You are seeing the student view. Data writes are disabled.</span>
        </div>
      </div>
      <button
        onClick={() => navigate(exitPath)}
        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 text-sm font-medium transition-colors shrink-0"
      >
        <X className="h-3.5 w-3.5" />
        Exit preview
      </button>
    </div>
  );
}
