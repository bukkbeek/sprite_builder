import { useEffect, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";

interface StatusBarProps {
  status: string;
}

const StatusBar = ({ status }: StatusBarProps) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 10000);
    
    return () => clearTimeout(timer);
  }, [status]);
  
  return (
    <div 
      className={`h-10 panel mx-3 mt-3 px-4 flex items-center justify-between transition-opacity duration-500 ${
        isVisible ? "opacity-100" : "opacity-40"
      }`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <div className="flex items-center space-x-3">
        <ThemeToggle />
        <div className="h-2 w-2 rounded-full bg-accent animate-pulse-subtle" />
        <span className="text-sm font-medium">{status}</span>
      </div>
      <div className="flex items-center gap-4">
        {/* ThemeToggle moved to left side and "Sprite Viewer Pro" text removed */}
      </div>
    </div>
  );
};

export default StatusBar;
