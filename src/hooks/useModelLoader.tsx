
import { useState, useCallback } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { toast } from "@/hooks/use-toast";

export const useModelLoader = () => {
  const [model, setModel] = useState<any>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAnimations, setHasAnimations] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const loadModel = useCallback((file: File) => {
    setIsLoading(true);
    setLoadingProgress(0);
    setError(null);
    
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      if (!event.target?.result) {
        setIsLoading(false);
        setError("Failed to read file");
        toast({
          title: "Error",
          description: "Failed to read file",
          variant: "destructive"
        });
        return;
      }
      
      const loader = new GLTFLoader();
      
      try {
        loader.load(
          URL.createObjectURL(file),
          (gltf) => {
            setModel({
              ...gltf,
              name: file.name.replace(".glb", "")
            });
            setHasAnimations(gltf.animations.length > 0);
            setIsLoading(false);
            toast({
              title: "Success",
              description: `Model "${file.name}" loaded successfully`,
            });
          },
          (progress) => {
            const percentage = progress.loaded / progress.total;
            setLoadingProgress(percentage);
          },
          (error) => {
            console.error("Error loading model:", error);
            setError(error.message);
            setIsLoading(false);
            toast({
              title: "Error",
              description: `Failed to load model: ${error.message}`,
              variant: "destructive"
            });
          }
        );
      } catch (e: any) {
        console.error("Exception loading model:", e);
        setError(e.message);
        setIsLoading(false);
        toast({
          title: "Error",
          description: `Failed to load model: ${e.message}`,
          variant: "destructive"
        });
      }
    };
    
    reader.onerror = () => {
      setError("Failed to read file");
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Failed to read file",
        variant: "destructive"
      });
    };
    
    reader.readAsArrayBuffer(file);
  }, []);
  
  return {
    model,
    loadModel,
    isLoading,
    loadingProgress,
    hasAnimations,
    error
  };
};
