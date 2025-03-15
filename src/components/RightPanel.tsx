import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { FileInput, Image, Download, Folder, Layers } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface RightPanelProps {
  loadModel: (file: File) => void;
  exportFrame: () => void;
  exportSequence?: (currentAnimation: string | null, totalFrames: number) => void;
  width: number;
  height: number;
  setWidth: (width: number) => void;
  setHeight: (height: number) => void;
  renderSteps?: number;
  setRenderSteps?: (steps: number) => void;
  outputFolder?: string | null;
  selectOutputFolder?: () => void;
  currentAnimation?: string | null;
  totalFrames?: number;
}

const RightPanel = ({
  loadModel,
  exportFrame,
  exportSequence,
  width,
  height,
  setWidth,
  setHeight,
  renderSteps = 1,
  setRenderSteps = () => {},
  outputFolder = null,
  selectOutputFolder = () => {},
  currentAnimation = null,
  totalFrames = 0
}: RightPanelProps) => {
  const [isDragging, setIsDragging] = useState(false);
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (file.name.toLowerCase().endsWith('.glb')) {
      loadModel(file);
    } else {
      toast({
        title: "Invalid file format",
        description: "Please select a GLB file",
        variant: "destructive"
      });
    }
  };
  
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    
    const files = event.dataTransfer.files;
    if (files.length === 0) return;
    
    const file = files[0];
    if (file.name.toLowerCase().endsWith('.glb')) {
      loadModel(file);
    } else {
      toast({
        title: "Invalid file format",
        description: "Please select a GLB file",
        variant: "destructive"
      });
    }
  };

  const handleExportSequence = () => {
    if (exportSequence && currentAnimation && totalFrames > 0) {
      exportSequence(currentAnimation, totalFrames);
    } else {
      toast({
        title: "Cannot export sequence",
        description: "No animation selected or no frames available",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="w-72 p-4 panel m-3 overflow-auto animate-slide-in-right">
      <div className="space-y-6">
        <div className="space-y-3">
          <h3 className="panel-label">File Operations</h3>
          
          <div
            className={`border-2 border-dashed p-6 rounded-lg text-center transition-colors ${
              isDragging ? "border-accent bg-accent/10" : "border-muted"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center gap-2">
              <FileInput className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Drag & drop a GLB file</p>
              <p className="text-xs text-muted-foreground">or</p>
              <Label
                htmlFor="file-input"
                className="cursor-pointer bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm font-medium transition-colors hover:bg-primary/90"
              >
                Browse Files
              </Label>
              <Input
                id="file-input"
                type="file"
                accept=".glb"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-3">
          <h3 className="panel-label">Export Options</h3>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Image className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="width">Width (px)</Label>
                </div>
                <Input
                  id="width"
                  type="number"
                  min={1}
                  step={1}
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Image className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="height">Height (px)</Label>
                </div>
                <Input
                  id="height"
                  type="number"
                  min={1}
                  step={1}
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex gap-1 flex-wrap">
                {[64, 128, 256, 512, 1024].map((size) => (
                  <Button 
                    key={size} 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setWidth(size);
                      setHeight(size);
                    }}
                    className="flex-1 min-w-0 px-2 py-1 h-auto text-xs"
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground italic">
              output may vary from this preview estimation
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="render-steps">Render Steps: {renderSteps}</Label>
              </div>
              <Slider
                id="render-steps"
                min={1}
                max={12}
                step={1}
                value={[renderSteps]}
                onValueChange={(value) => setRenderSteps(value[0])}
                className="py-2"
              />
              {totalFrames > 0 && renderSteps > 0 && (
                <p className="text-xs text-muted-foreground">
                  export approx. {Math.ceil(totalFrames / renderSteps)} frames
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Folder className="h-4 w-4 text-muted-foreground" />
                <Label>Output Folder</Label>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex-1 truncate bg-muted p-2 rounded-md text-xs">
                  {outputFolder || "No folder selected"}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectOutputFolder}
                >
                  Browse
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="panel-label">Export Actions</h3>
          
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full flex gap-2"
              onClick={exportFrame}
            >
              <Download className="h-4 w-4" />
              <span>Export Current Frame</span>
            </Button>

            <Button
              variant="default"
              className="w-full flex gap-2"
              onClick={handleExportSequence}
              disabled={!outputFolder || !currentAnimation || totalFrames === 0}
            >
              <Layers className="h-4 w-4" />
              <span>Export Sequence</span>
            </Button>
          </div>
        </div>
        
        <div className="flex justify-end items-center mt-4">
          <span className="text-xs text-muted-foreground"><span className="font-bold">Sprite Builder</span> by bukkbeek | ceylonblocks v 1.0</span>
        </div>
      </div>
    </div>
  );
};

export default RightPanel;
