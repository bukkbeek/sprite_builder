import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";

interface BottomPanelProps {
  isPlaying: boolean;
  togglePlayPause: () => void;
  previousFrame: () => void;
  nextFrame: () => void;
  currentFrame: number;
  totalFrames: number;
  currentAnimation: string | null;
  animations: string[];
  setCurrentAnimation: (animation: string) => void;
  hasAnimations: boolean;
  setCurrentFrame: (frame: number) => void;
}

const BottomPanel = ({
  isPlaying,
  togglePlayPause,
  previousFrame,
  nextFrame,
  currentFrame,
  totalFrames,
  currentAnimation,
  animations,
  setCurrentAnimation,
  hasAnimations,
  setCurrentFrame
}: BottomPanelProps) => {
  return (
    <div className={`h-24 p-4 panel mx-3 mb-3 ${hasAnimations ? 'animate-fade-in' : 'opacity-70'}`}>
      <div className="flex items-center space-x-4 h-full">
        <div className="space-y-1 w-48">
          <Label htmlFor="animation-select" className="panel-label">Animation</Label>
          <Select
            value={currentAnimation || ""}
            onValueChange={setCurrentAnimation}
            disabled={!hasAnimations}
          >
            <SelectTrigger id="animation-select">
              <SelectValue placeholder={hasAnimations ? "Select Animation" : "No Animations"} />
            </SelectTrigger>
            <SelectContent>
              {animations.map((animation) => (
                <SelectItem key={animation} value={animation}>
                  {animation}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={previousFrame}
            disabled={isPlaying || !hasAnimations}
            aria-label="Previous frame"
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          
          <Button
            variant={isPlaying ? "outline" : "default"}
            size="icon"
            onClick={togglePlayPause}
            disabled={!hasAnimations}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={nextFrame}
            disabled={isPlaying || !hasAnimations}
            aria-label="Next frame"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex-1 flex flex-col space-y-1">
          <div className="flex justify-between items-center">
            <span className="panel-label">Frame</span>
            <span className="text-xs font-medium">
              {hasAnimations ? `${currentFrame} / ${totalFrames}` : "No Frames"}
            </span>
          </div>
          <Slider
            min={0}
            max={totalFrames > 0 ? totalFrames - 1 : 0}
            step={1}
            value={[currentFrame]}
            onValueChange={(values) => {
              // Update the current frame when the slider changes
              if (values.length > 0) {
                setCurrentFrame(values[0]);
              }
            }}
            disabled={isPlaying || totalFrames === 0 || !hasAnimations}
          />
        </div>
      </div>
    </div>
  );
};

export default BottomPanel;
