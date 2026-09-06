import React from 'react';
import { Loader2 } from 'lucide-react';

export const ViewLoadingFallback: React.FC = () => {
  return (
    <div className="flex min-h-[65vh] w-full flex-col items-center justify-center py-24 text-center">
      <div className="relative flex items-center justify-center">
        <div className="h-14 w-14 rounded-full border-2 border-[#292344] border-t-[#C6A75E] animate-spin" />
        <Loader2 className="absolute h-6 w-6 text-[#C6A75E] animate-pulse" />
      </div>
      <p className="mt-4 text-sm font-medium text-[#AAA6B7] tracking-wide animate-pulse">
        Loading module...
      </p>
    </div>
  );
};
