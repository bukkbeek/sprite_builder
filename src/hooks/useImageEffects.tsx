import { useState, useCallback } from 'react';

export interface ImageEffects {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  colorSteps: number;
}

export const useImageEffects = () => {
  const [effects, setEffects] = useState<ImageEffects>({
    brightness: 1.0,
    contrast: 1.0,
    saturation: 1.0,
    hue: 0,
    colorSteps: 0
  });

  const setBrightness = useCallback((value: number) => {
    setEffects(prev => ({ ...prev, brightness: value }));
  }, []);

  const setContrast = useCallback((value: number) => {
    setEffects(prev => ({ ...prev, contrast: value }));
  }, []);

  const setSaturation = useCallback((value: number) => {
    setEffects(prev => ({ ...prev, saturation: value }));
  }, []);

  const setHue = useCallback((value: number) => {
    setEffects(prev => ({ ...prev, hue: value }));
  }, []);

  const setColorSteps = useCallback((value: number) => {
    setEffects(prev => ({ ...prev, colorSteps: value }));
  }, []);

  const resetEffects = useCallback(() => {
    setEffects({
      brightness: 1.0,
      contrast: 1.0,
      saturation: 1.0,
      hue: 0,
      colorSteps: 0
    });
  }, []);

  return {
    effects,
    setBrightness,
    setContrast,
    setSaturation,
    setHue,
    setColorSteps,
    resetEffects
  };
}; 