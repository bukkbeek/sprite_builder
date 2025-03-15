import { useState, useEffect } from "react";
import ViewportContainer from "@/components/ViewportContainer";
import LeftPanel from "@/components/LeftPanel";
import RightPanel from "@/components/RightPanel";
import BottomPanel from "@/components/BottomPanel";
import StatusBar from "@/components/StatusBar";
import { useModelLoader } from "@/hooks/useModelLoader";
import { useCamera } from "@/hooks/useCamera";
import { useAnimation } from "@/hooks/useAnimation";
import { useExport } from "@/hooks/useExport";
import { useImageEffects } from "@/hooks/useImageEffects";

const Index = () => {
  const [showGrid, setShowGrid] = useState(false);
  const [showAxes, setShowAxes] = useState(false);
  const [status, setStatus] = useState("Ready");

  const {
    model,
    loadModel,
    loadingProgress,
    isLoading,
    hasAnimations,
    error: modelError
  } = useModelLoader();

  const {
    cameraPosition,
    cameraTarget,
    modelOffset,
    zoom,
    isOrthographic,
    setIsOrthographic,
    setZoom,
    resetCamera,
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
    setCameraPosition,
    setCameraTarget
  } = useCamera();

  const {
    isPlaying,
    currentAnimation,
    animations,
    currentFrame,
    totalFrames,
    togglePlayPause,
    previousFrame,
    nextFrame,
    setCurrentAnimation,
    setCurrentFrame
  } = useAnimation(model);

  const {
    width,
    height,
    backgroundColor,
    renderSteps,
    outputFolder,
    setWidth,
    setHeight,
    setBackgroundColor,
    setRenderSteps,
    selectOutputFolder,
    exportFrame,
    exportSequence
  } = useExport();

  const {
    effects,
    setBrightness,
    setContrast,
    setSaturation,
    setHue,
    setColorSteps,
    resetEffects
  } = useImageEffects();

  // Force transparent background for exports
  useEffect(() => {
    // This ensures exports always use transparent background
    const forceTransparentExports = async () => {
      // Implementation details handled in the useExport hook
    };
    
    forceTransparentExports();
  }, []);

  // Update status when model is loading
  useEffect(() => {
    if (isLoading) {
      setStatus(`Loading model: ${Math.round(loadingProgress * 100)}%`);
    } else if (modelError) {
      setStatus(`Error: ${modelError}`);
    } else if (model) {
      setStatus(`Model loaded: ${model.name || "Unnamed model"}`);
    } else {
      setStatus("Ready - Import a GLB model to begin");
    }
  }, [isLoading, loadingProgress, model, modelError]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      <StatusBar status={status} />
      
      <div className="flex-1 flex overflow-hidden">
        <LeftPanel
          showGrid={showGrid} 
          setShowGrid={setShowGrid}
          showAxes={showAxes}
          setShowAxes={setShowAxes}
          zoom={zoom}
          setZoom={setZoom}
          resetCamera={resetCamera}
          viewTopLeft={viewTopLeft}
          viewTop={viewTop}
          viewTopRight={viewTopRight}
          viewLeft={viewLeft}
          viewCenter={viewCenter}
          viewRight={viewRight}
          viewBottomLeft={viewBottomLeft}
          viewBottom={viewBottom}
          viewBottomRight={viewBottomRight}
          panCameraLeft={panCameraLeft}
          panCameraRight={panCameraRight}
          panCameraUp={panCameraUp}
          panCameraDown={panCameraDown}
          transparentBackground={true}
          setTransparentBackground={() => {}}
          backgroundColor={backgroundColor}
          setBackgroundColor={setBackgroundColor}
          showExportPreview={true}
          setShowExportPreview={() => {}}
          isOrthographic={isOrthographic}
          setIsOrthographic={setIsOrthographic}
          setCameraPosition={setCameraPosition}
          cameraTarget={cameraTarget}
          setCameraTarget={setCameraTarget}
          cameraPosition={cameraPosition}
          effects={effects}
          setBrightness={setBrightness}
          setContrast={setContrast}
          setSaturation={setSaturation}
          setHue={setHue}
          setColorSteps={setColorSteps}
          resetEffects={resetEffects}
        />
        
        <ViewportContainer 
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
          exportWidth={width}
          exportHeight={height}
          showExportPreview={true}
          backgroundColor={backgroundColor}
          effects={effects}
        />
        
        <RightPanel
          loadModel={loadModel}
          exportFrame={exportFrame}
          exportSequence={exportSequence}
          width={width}
          height={height}
          setWidth={setWidth}
          setHeight={setHeight}
          renderSteps={renderSteps}
          setRenderSteps={setRenderSteps}
          outputFolder={outputFolder}
          selectOutputFolder={selectOutputFolder}
          currentAnimation={currentAnimation}
          totalFrames={totalFrames}
        />
      </div>
      
      <BottomPanel
        isPlaying={isPlaying}
        togglePlayPause={togglePlayPause}
        previousFrame={previousFrame}
        nextFrame={nextFrame}
        currentFrame={currentFrame}
        totalFrames={totalFrames}
        currentAnimation={currentAnimation}
        animations={animations}
        setCurrentAnimation={setCurrentAnimation}
        hasAnimations={hasAnimations}
        setCurrentFrame={setCurrentFrame}
      />
    </div>
  );
};

export default Index;
