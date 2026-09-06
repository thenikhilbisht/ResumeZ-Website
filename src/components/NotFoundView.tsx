import React from 'react';
import { Compass, Home, ArrowLeft } from 'lucide-react';

interface NotFoundViewProps {
  onNavigateHome: () => void;
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({ onNavigateHome }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#C6A75E]/10 border border-[#C6A75E]/30 text-[#E1C77A] mb-6 shadow-2xl shadow-[#C6A75E]/10">
        <Compass className="h-10 w-10 animate-spin-slow" />
      </div>
      <span className="rounded-full bg-[#C6A75E]/20 border border-[#C6A75E]/40 px-3 py-1 text-xs font-bold text-[#E1C77A] uppercase tracking-wider mb-3">
        404 • Page Not Found
      </span>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F5F1E8] tracking-tight mb-3">
        Lost in Career Space?
      </h1>
      <p className="max-w-md text-sm sm:text-base text-[#AAA6B7] mb-8 leading-relaxed">
        The page or view you are looking for doesn't exist, may have been moved, or is temporarily unavailable.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-2 rounded-xl bg-[#C6A75E] px-5 py-3 text-sm font-semibold text-[#080711] hover:bg-[#D5B97B] transition cursor-pointer shadow-lg shadow-[#C6A75E]/20"
        >
          <Home className="h-4 w-4" />
          Back to Overview
        </button>
      </div>
    </div>
  );
};
