import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Square,
  ArrowDown,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  ArrowUpLeft,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowDownRight,
  Axis3d,
  Grid2X2,
  ZoomIn,
  ZoomOut,
  Image,
  Palette,
  SquareAsterisk,
  Camera,
  Sun,
  Contrast,
  Paintbrush,
  Layers
} from "lucide-react";
import * as THREE from "three";
import { useState } from "react";
import { ImageEffects } from "@/hooks/useImageEffects";

interface LeftPanelProps {
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  showAxes: boolean;
  setShowAxes: (show: boolean) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  resetCamera: () => void;
  viewTopLeft: () => void;
  viewTop: () => void;
  viewTopRight: () => void;
  viewLeft: () => void;
  viewCenter: () => void;
  viewRight: () => void;
  viewBottomLeft: () => void;
  viewBottom: () => void;
  viewBottomRight: () => void;
  panCameraLeft: () => void;
  panCameraRight: () => void;
  panCameraUp: () => void;
  panCameraDown: () => void;
  transparentBackground: boolean;
  setTransparentBackground: (transparent: boolean) => void;
  backgroundColor: string;
  setBackgroundColor: (color: string) => void;
  showExportPreview: boolean;
  setShowExportPreview: (show: boolean) => void;
  isOrthographic: boolean;
  setIsOrthographic: (isOrthographic: boolean) => void;
  setCameraPosition: (position: THREE.Vector3 | ((prev: THREE.Vector3) => THREE.Vector3)) => void;
  cameraTarget: THREE.Vector3;
  setCameraTarget: (target: THREE.Vector3) => void;
  cameraPosition: THREE.Vector3;
  effects: ImageEffects;
  setBrightness: (value: number) => void;
  setContrast: (value: number) => void;
  setSaturation: (value: number) => void;
  setHue: (value: number) => void;
  setColorSteps: (value: number) => void;
  resetEffects: () => void;
}

const LeftPanel = ({
  showGrid,
  setShowGrid,
  showAxes,
  setShowAxes,
  zoom,
  setZoom,
  viewTopLeft,
  viewTop,
  viewTopRight,
  viewLeft,
  viewCenter,
  viewRight,
  viewBottomLeft,
  viewBottom,
  viewBottomRight,
  panCameraLeft,
  panCameraRight,
  panCameraUp,
  panCameraDown,
  transparentBackground,
  setTransparentBackground,
  backgroundColor,
  setBackgroundColor,
  showExportPreview,
  setShowExportPreview,
  isOrthographic,
  setIsOrthographic,
  setCameraPosition,
  cameraTarget,
  setCameraTarget,
  cameraPosition,
  effects,
  setBrightness,
  setContrast,
  setSaturation,
  setHue,
  setColorSteps,
  resetEffects
}: LeftPanelProps) => {
  // Add state for vertical pan value only
  const [verticalPan, setVerticalPan] = useState(0);

  // Simple function to handle vertical panning
  const handleVerticalPan = (direction: 'up' | 'down' | 'reset', amount: number = 0.5) => {
    // Get the canvas and controls
    const canvas = document.querySelector('canvas');
    if (!canvas || !(canvas as any).__r3f?.fiber?.controls) return;
    
    // Disable controls during panning
    (canvas as any).__r3f.fiber.controls.enabled = false;
    
    switch (direction) {
      case 'up':
        // Move camera up and update state
        panCameraUp();
        setVerticalPan(prev => {
          const newValue = Math.min(4, prev + amount);
          return Number(newValue.toFixed(1)); // Round to 1 decimal place
        });
        break;
      case 'down':
        // Move camera down and update state
        panCameraDown();
        setVerticalPan(prev => {
          const newValue = Math.max(-4, prev - amount);
          return Number(newValue.toFixed(1)); // Round to 1 decimal place
        });
        break;
      case 'reset':
        // Reset to center (0)
        if (verticalPan > 0) {
          // If above center, move down
          for (let i = 0; i < Math.abs(verticalPan) * 2; i++) {
            panCameraDown();
          }
        } else if (verticalPan < 0) {
          // If below center, move up
          for (let i = 0; i < Math.abs(verticalPan) * 2; i++) {
            panCameraUp();
          }
        }
        // Reset state to 0
        setVerticalPan(0);
        break;
    }
    
    // Re-enable controls after panning
    setTimeout(() => {
      if (canvas && (canvas as any).__r3f?.fiber?.controls) {
        (canvas as any).__r3f.fiber.controls.enabled = true;
      }
    }, 100);
  };

  // Function to handle direct input value changes
  const handleVerticalInputChange = (value: number) => {
    // Clamp the value between -4 and 4
    const clampedValue = Math.max(-4, Math.min(4, value));
    
    // Calculate the difference from current position
    const diff = clampedValue - verticalPan;
    
    // Update the state
    setVerticalPan(clampedValue);
    
    // Apply camera movement based on the difference
    if (diff !== 0) {
      // Get the canvas and controls
      const canvas = document.querySelector('canvas');
      if (canvas && (canvas as any).__r3f?.fiber?.controls) {
        // Temporarily disable controls during panning
        (canvas as any).__r3f.fiber.controls.enabled = false;
      }
      
      if (diff > 0) {
        // Move up (positive direction)
        for (let i = 0; i < Math.abs(diff) * 2; i++) {
          panCameraUp();
        }
      } else {
        // Move down (negative direction)
        for (let i = 0; i < Math.abs(diff) * 2; i++) {
          panCameraDown();
        }
      }
      
      // Re-enable controls after panning
      setTimeout(() => {
        if (canvas && (canvas as any).__r3f?.fiber?.controls) {
          (canvas as any).__r3f.fiber.controls.enabled = true;
        }
      }, 100);
    }
  };

  return (
    <div className="w-72 p-4 panel m-3 overflow-auto animate-slide-in" style={{ zIndex: 10 }}>
      <div className="space-y-6">
        {/* Image Effects Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="panel-label">Image Effects</h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetEffects}
              className="h-7 px-2"
            >
              Reset
            </Button>
          </div>
          
          <div className="space-y-4">
            {/* Brightness Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  Brightness
                </Label>
                <span className="text-xs text-muted-foreground">
                  {effects.brightness.toFixed(2)}
                </span>
              </div>
              <Slider
                value={[effects.brightness]}
                min={0}
                max={2}
                step={0.01}
                onValueChange={(value) => setBrightness(value[0])}
              />
            </div>
            
            {/* Contrast Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="flex items-center gap-2">
                  <Contrast className="h-4 w-4" />
                  Contrast
                </Label>
                <span className="text-xs text-muted-foreground">
                  {effects.contrast.toFixed(2)}
                </span>
              </div>
              <Slider
                value={[effects.contrast]}
                min={0}
                max={2}
                step={0.01}
                onValueChange={(value) => setContrast(value[0])}
              />
            </div>
            
            {/* Saturation Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Saturation
                </Label>
                <span className="text-xs text-muted-foreground">
                  {effects.saturation.toFixed(2)}
                </span>
              </div>
              <Slider
                value={[effects.saturation]}
                min={0}
                max={2}
                step={0.01}
                onValueChange={(value) => setSaturation(value[0])}
              />
            </div>
            
            {/* Hue Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="flex items-center gap-2">
                  <Paintbrush className="h-4 w-4" />
                  Hue Shift
                </Label>
                <span className="text-xs text-muted-foreground">
                  {effects.hue}°
                </span>
              </div>
              <Slider
                value={[effects.hue]}
                min={0}
                max={360}
                step={1}
                onValueChange={(value) => setHue(value[0])}
              />
            </div>
            
            {/* Color Steps Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Color Steps
                </Label>
                <span className="text-xs text-muted-foreground">
                  {effects.colorSteps}
                </span>
              </div>
              <Slider
                value={[effects.colorSteps]}
                min={0}
                max={16}
                step={1}
                onValueChange={(value) => setColorSteps(value[0])}
              />
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <h3 className="panel-label">Camera Presets</h3>
          <div className="aspect-square w-full max-w-[150px] mx-auto border border-border rounded-sm overflow-hidden">
            <div className="grid grid-cols-3 gap-0 h-full">
              {/* Top Row */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="button-icon aspect-square w-full p-0 rounded-none border-r border-b border-border"
                    onClick={viewTopLeft}
                    aria-label="View top left"
                  >
                    <ArrowUpLeft className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Back Left View</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="button-icon aspect-square w-full p-0 rounded-none border-r border-b border-border"
                    onClick={viewTop}
                    aria-label="View top"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Back View</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="button-icon aspect-square w-full p-0 rounded-none border-b border-border"
                    onClick={viewTopRight}
                    aria-label="View top right"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Back Right View</TooltipContent>
              </Tooltip>
              
              {/* Middle Row */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="button-icon aspect-square w-full p-0 rounded-none border-r border-b border-border"
                    onClick={viewLeft}
                    aria-label="View left"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Left Side View</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="button-icon aspect-square w-full p-0 rounded-none border-r border-b border-border"
                    onClick={viewCenter}
                    aria-label="View top"
                  >
                    <Square className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Top View</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="button-icon aspect-square w-full p-0 rounded-none border-b border-border"
                    onClick={viewRight}
                    aria-label="View right"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Right Side View</TooltipContent>
              </Tooltip>
              
              {/* Bottom Row */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="button-icon aspect-square w-full p-0 rounded-none border-r border-border"
                    onClick={viewBottomLeft}
                    aria-label="View bottom left"
                  >
                    <ArrowDownLeft className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Front Left View</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="button-icon aspect-square w-full p-0 rounded-none border-r border-border"
                    onClick={viewBottom}
                    aria-label="View bottom"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Front View</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="button-icon aspect-square w-full p-0 rounded-none border-border"
                    onClick={viewBottomRight}
                    aria-label="View bottom right"
                  >
                    <ArrowDownRight className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Front Right View</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="panel-label">Camera Controls</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <ZoomOut className="h-4 w-4 text-muted-foreground" />
              <Slider
                className="mx-3 flex-1"
                min={0.1}
                max={10}
                step={0.1}
                value={[zoom]}
                onValueChange={(values) => setZoom(values[0])}
              />
              <ZoomIn className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="vertical-pan" className="text-xs">Vertical Pan</Label>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">-4</span>
                  <Slider
                    id="vertical-pan"
                    className="w-32"
                    min={-4}
                    max={4}
                    step={0.5}
                    value={[verticalPan]}
                    onValueChange={(values) => handleVerticalInputChange(values[0])}
                  />
                  <span className="text-xs text-muted-foreground">+4</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="panel-label">Viewport Options</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Camera className="h-4 w-4" />
              <Label htmlFor="orthographic-camera">Orthographic Camera</Label>
            </div>
            <Switch
              id="orthographic-camera"
              checked={isOrthographic}
              onCheckedChange={setIsOrthographic}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Grid2X2 className="h-4 w-4" />
              <Label htmlFor="show-grid">Show Grid</Label>
            </div>
            <Switch
              id="show-grid"
              checked={showGrid}
              onCheckedChange={setShowGrid}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Axis3d className="h-4 w-4" />
              <Label htmlFor="show-axes">Show Axes</Label>
            </div>
            <Switch
              id="show-axes"
              checked={showAxes}
              onCheckedChange={setShowAxes}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Palette className="h-4 w-4" />
              <Label htmlFor="bg-color">Background Color</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Input
                id="bg-color"
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-10 h-8 p-0 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;
