import { Loader2, FileText } from 'lucide-react';
import { AnimatedDots } from './ui/AnimatedDots';

export const ProcessingAnimation = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 w-full space-y-6">
      {/* Icon section */}
      <div className="relative">
        <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
        <FileText className="w-8 h-8 text-blue-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Text section */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-white">
          Processing your research paper<AnimatedDots />
        </h3>
        <p className="text-sm text-gray-400">
          This may take 2-5 minutes. Please don't close this window.
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full w-full bg-blue-500 animate-pulse"></div>
      </div>
    </div>
  );
};
