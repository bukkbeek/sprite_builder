import { useRef, useEffect, useState, useCallback } from "react";
import Viewport from "@/components/Viewport";
import * as THREE from "three";
import { ImageEffects } from "@/hooks/useImageEffects";

interface ViewportContainerProps {
  model: any;
  cameraPosition: THREE.Vector3;
  cameraTarget: THREE.Vector3;
  modelOffset: THREE.Vector3;
  zoom: number;
  isOrthographic: boolean;
  showGrid: boolean;
  showAxes: boolean;
  isPlaying: boolean;
  currentAnimation: string | null;
  currentFrame: number;
  totalFrames: number;
  exportWidth: number;
  exportHeight: number;
  showExportPreview: boolean;
  backgroundColor?: string;
  effects: ImageEffects;
}

const ViewportContainer = ({
  model,
  cameraPosition,
  cameraTarget,
  modelOffset,
  zoom,
  isOrthographic,
  showGrid,
  showAxes,
  isPlaying,
  currentAnimation,
  currentFrame,
  totalFrames,
  exportWidth,
  exportHeight,
  backgroundColor,
  effects
}: ViewportContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportBoxRef = useRef<HTMLDivElement>(null);
  const exportFrameRef = useRef<HTMLDivElement>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [exportFrameSize, setExportFrameSize] = useState({ width: 0, height: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [startSize, setStartSize] = useState({ width: 0, height: 0 });

  // Calculate the aspect ratio for the export frame
  const exportAspectRatio = exportWidth / exportHeight;

  // Update container size when the window is resized
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        // Clear any existing timeout
        if (resizeTimeoutRef.current) {
          clearTimeout(resizeTimeoutRef.current);
        }
        
        // Use a timeout to debounce the size update
        resizeTimeoutRef.current = setTimeout(() => {
          const { width, height } = containerRef.current.getBoundingClientRect();
          
          // Only update if dimensions are valid
          if (width > 0 && height > 0) {
            setContainerSize({ width, height });
          }
        }, 100);
      }
    };

    // Initial size calculation
    updateSize();

    // Add resize observer for more reliable size detection
    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Also listen for window resize events
    window.addEventListener("resize", updateSize);

    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  // Function to update the export frame position and size
  const updateExportFrame = useCallback(() => {
    if (!exportFrameRef.current || !viewportBoxRef.current) return;
    
    // Get the current viewport dimensions
    const viewportRect = viewportBoxRef.current.getBoundingClientRect();
    const viewportWidth = viewportRect.width;
    const viewportHeight = viewportRect.height;
    
    let frameWidth, frameHeight;
    
    // Determine the export frame dimensions based on which constraint is limiting
    if (exportAspectRatio > viewportWidth / viewportHeight) {
      // Width is the constraint
      frameWidth = viewportWidth * 0.8;
      frameHeight = frameWidth / exportAspectRatio;
    } else {
      // Height is the constraint
      frameHeight = viewportHeight * 0.8;
      frameWidth = frameHeight * exportAspectRatio;
    }
    
    // Ensure minimum size
    const minSize = Math.min(viewportWidth, viewportHeight) * 0.3;
    frameWidth = Math.max(frameWidth, minSize * exportAspectRatio);
    frameHeight = Math.max(frameHeight, minSize);
    
    // Ensure maximum size
    frameWidth = Math.min(frameWidth, viewportWidth * 0.9);
    frameHeight = Math.min(frameHeight, viewportHeight * 0.9);
    
    // Round dimensions to avoid subpixel rendering issues
    frameWidth = Math.round(frameWidth);
    frameHeight = Math.round(frameHeight);
    
    // Center the export frame in the viewport
    const left = Math.round((viewportWidth - frameWidth) / 2);
    const top = Math.round((viewportHeight - frameHeight) / 2);
    
    // Update the export frame size and position
    exportFrameRef.current.style.width = `${frameWidth}px`;
    exportFrameRef.current.style.height = `${frameHeight}px`;
    exportFrameRef.current.style.left = `${left}px`;
    exportFrameRef.current.style.top = `${top}px`;
    
    // Store the size for other calculations
    setExportFrameSize({ width: frameWidth, height: frameHeight });
    
    // Dispatch an event to notify the viewport of the export frame size and position
    const event = new CustomEvent('export-frame-update', {
      detail: {
        width: frameWidth,
        height: frameHeight,
        left,
        top,
        exportWidth,
        exportHeight
      }
    });
    window.dispatchEvent(event);
  }, [exportWidth, exportHeight, exportAspectRatio]);

  // Update the export frame when container size or export dimensions change
  useEffect(() => {
    updateExportFrame();
  }, [containerSize, exportWidth, exportHeight, updateExportFrame]);

  // Handle double-click to maximize the viewport
  const handleDoubleClick = useCallback(() => {
    // Implement if needed
  }, []);

  // Resize handling
  const handleResizeStart = useCallback((e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeDirection(direction);
    setStartPoint({ x: e.clientX, y: e.clientY });
    
    if (viewportBoxRef.current) {
      const { width, height } = viewportBoxRef.current.getBoundingClientRect();
      setStartSize({ width, height });
    }
    
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  }, []);

  // Handle resize movement
  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !resizeDirection || !viewportBoxRef.current) return;
    
    const deltaX = e.clientX - startPoint.x;
    const deltaY = e.clientY - startPoint.y;
    
    let newWidth = startSize.width;
    let newHeight = startSize.height;
    
    // Calculate new dimensions based on resize direction
    switch (resizeDirection) {
      case 'se':
        newWidth = startSize.width + deltaX;
        newHeight = startSize.height + deltaY;
        break;
      case 'sw':
        newWidth = startSize.width - deltaX;
        newHeight = startSize.height + deltaY;
        break;
      case 'ne':
        newWidth = startSize.width + deltaX;
        newHeight = startSize.height - deltaY;
        break;
      case 'nw':
        newWidth = startSize.width - deltaX;
        newHeight = startSize.height - deltaY;
        break;
    }
    
    // Ensure minimum size
    newWidth = Math.max(newWidth, 300);
    newHeight = Math.max(newHeight, 300);
    
    // Ensure maximum size
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      newWidth = Math.min(newWidth, containerRect.width * 0.95);
      newHeight = Math.min(newHeight, containerRect.height * 0.95);
    }
    
    // Apply the new dimensions
    viewportBoxRef.current.style.width = `${newWidth}px`;
    viewportBoxRef.current.style.height = `${newHeight}px`;
    
    // Update the export frame
    updateExportFrame();
    
    // Dispatch a resize event to notify the viewport
    const event = new CustomEvent('viewport-resize', {
      detail: { width: newWidth, height: newHeight }
    });
    window.dispatchEvent(event);
  }, [isResizing, resizeDirection, startPoint, startSize, updateExportFrame]);

  // Handle resize end
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    setResizeDirection(null);
    
    // Update container size
    if (viewportBoxRef.current) {
      const { width, height } = viewportBoxRef.current.getBoundingClientRect();
      setContainerSize({ width, height });
    }
    
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  }, [handleResizeMove]);

  // Add event listeners for resize
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [handleResizeMove, handleResizeEnd]);

  // Calculate clip path for the overlay
  const calculateClipPath = useCallback(() => {
    if (!viewportBoxRef.current || !exportFrameRef.current) return '';
    
    const viewportRect = viewportBoxRef.current.getBoundingClientRect();
    const frameRect = exportFrameRef.current.getBoundingClientRect();
    
    // Calculate the frame position relative to the viewport
    const top = (frameRect.top - viewportRect.top) / viewportRect.height * 100;
    const right = 100 - ((frameRect.right - viewportRect.left) / viewportRect.width * 100);
    const bottom = 100 - ((frameRect.bottom - viewportRect.top) / viewportRect.height * 100);
    const left = (frameRect.left - viewportRect.left) / viewportRect.width * 100;
    
    // Create a polygon that covers everything except the frame area
    return `polygon(
      0% 0%, 100% 0%, 100% 100%, 0% 100%,
      0% ${top}%, ${left}% ${top}%, ${left}% ${100-bottom}%, ${100-right}% ${100-bottom}%,
      ${100-right}% ${top}%, 0% ${top}%
    )`;
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="flex-1 relative overflow-hidden"
    >
      <div 
        ref={viewportBoxRef}
        className="w-full h-full relative"
      >
        <Viewport
          model={model}
          cameraPosition={cameraPosition}
          cameraTarget={cameraTarget}
          modelOffset={modelOffset}
          zoom={zoom}
          isOrthographic={isOrthographic}
          showGrid={showGrid}
          showAxes={showAxes}
          isPlaying={isPlaying}
          currentAnimation={currentAnimation}
          currentFrame={currentFrame}
          totalFrames={totalFrames}
          backgroundColor={backgroundColor}
          effects={effects}
        />
        
        {/* Always show export preview */}
        <div 
          ref={exportFrameRef}
          className="absolute border-2 border-dashed border-primary pointer-events-none"
          style={{
            width: exportFrameSize.width,
            height: exportFrameSize.height,
            boxSizing: 'border-box'
          }}
        >
          <div className="absolute top-0 left-0 bg-background/80 text-xs px-1 py-0.5 rounded-br">
            {exportWidth}×{exportHeight}
          </div>
        </div>
        
        {/* Resize handles */}
        <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize" 
          onMouseDown={(e) => handleResizeStart(e, 'se')}
        />
        <div className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize" 
          onMouseDown={(e) => handleResizeStart(e, 'sw')}
        />
        <div className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize" 
          onMouseDown={(e) => handleResizeStart(e, 'ne')}
        />
        <div className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize" 
          onMouseDown={(e) => handleResizeStart(e, 'nw')}
        />
      </div>
    </div>
  );
};

export default ViewportContainer;