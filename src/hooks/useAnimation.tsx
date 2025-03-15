import { useState, useEffect, useCallback, useRef } from "react";

export const useAnimation = (model: any) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState<string | null>(null);
  const [animations, setAnimations] = useState<string[]>([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);
  
  // Update available animations when model changes
  useEffect(() => {
    if (!model || !model.animations) {
      setAnimations([]);
      setCurrentAnimation(null);
      setTotalFrames(0);
      setCurrentFrame(0);
      return;
    }
    
    const animNames = model.animations.map((anim: any) => anim.name);
    setAnimations(animNames);
    
    if (animNames.length > 0 && !currentAnimation) {
      setCurrentAnimation(animNames[0]);
    }
    
    // Set total frames based on first animation
    if (model.animations.length > 0) {
      const firstAnim = model.animations[0];
      const fps = 30; // Assume 30 fps
      const frames = Math.floor(firstAnim.duration * fps);
      setTotalFrames(frames);
    }
  }, [model, currentAnimation]);
  
  // Handle animation playback
  useEffect(() => {
    if (!isPlaying || !model || !model.animations || !currentAnimation) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }
    
    const fps = 30; // Frames per second
    const anim = model.animations.find((a: any) => a.name === currentAnimation);
    if (!anim) return;
    
    const animationDuration = anim.duration;
    const frameTime = 1000 / fps; // Time per frame in ms
    
    const updateFrame = (timestamp: number) => {
      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = timestamp;
      }
      
      const elapsed = timestamp - lastFrameTimeRef.current;
      
      if (elapsed >= frameTime) {
        setCurrentFrame((prevFrame) => {
          const nextFrame = (prevFrame + 1) % totalFrames;
          return nextFrame;
        });
        
        lastFrameTimeRef.current = timestamp;
      }
      
      animationFrameRef.current = requestAnimationFrame(updateFrame);
    };
    
    animationFrameRef.current = requestAnimationFrame(updateFrame);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying, model, currentAnimation, totalFrames]);
  
  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);
  
  const previousFrame = useCallback(() => {
    setCurrentFrame((prev) => {
      if (prev <= 0) return totalFrames - 1;
      return prev - 1;
    });
  }, [totalFrames]);
  
  const nextFrame = useCallback(() => {
    setCurrentFrame((prev) => {
      if (prev >= totalFrames - 1) return 0;
      return prev + 1;
    });
  }, [totalFrames]);
  
  const setAnimation = useCallback((animation: string) => {
    setCurrentAnimation(animation);
    setCurrentFrame(0);
    
    // Find the animation in the model to get its duration
    if (model && model.animations) {
      const anim = model.animations.find((a: any) => a.name === animation);
      if (anim) {
        const fps = 30; // Assume 30 fps
        const frames = Math.floor(anim.duration * fps);
        setTotalFrames(frames);
      }
    }
  }, [model]);
  
  return {
    isPlaying,
    currentAnimation,
    animations,
    currentFrame,
    totalFrames,
    togglePlayPause,
    previousFrame,
    nextFrame,
    setCurrentAnimation: setAnimation,
    setCurrentFrame
  };
};
