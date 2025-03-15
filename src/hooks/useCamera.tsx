import { useState, useCallback, useRef } from "react";
import * as THREE from "three";

export const useCamera = () => {
  const [cameraPosition, setCameraPosition] = useState(new THREE.Vector3(5, 5, 5));
  const [cameraTarget, setCameraTarget] = useState(new THREE.Vector3(0, 0, 0));
  const [modelOffset, setModelOffset] = useState(new THREE.Vector3(0, 0, 0));
  const [zoom, setZoom] = useState(1);
  const [isOrthographic, setIsOrthographic] = useState(true);
  
  const setPresetView = useCallback((position: THREE.Vector3) => {
    setCameraPosition(position);
    // Always keep the target at the center of the scene
    setCameraTarget(new THREE.Vector3(0, 0, 0));
  }, []);
  
  const viewTopLeft = useCallback(() => {
    setPresetView(new THREE.Vector3(-5, 5, 5));
  }, [setPresetView]);
  
  const viewTop = useCallback(() => {
    setPresetView(new THREE.Vector3(0, 10, 0));
  }, [setPresetView]);
  
  const viewTopRight = useCallback(() => {
    setPresetView(new THREE.Vector3(5, 5, 5));
  }, [setPresetView]);
  
  const viewLeft = useCallback(() => {
    setPresetView(new THREE.Vector3(-10, 0, 0));
  }, [setPresetView]);
  
  const viewCenter = useCallback(() => {
    setPresetView(new THREE.Vector3(0, 10, 0.001)); // Small offset to avoid axis alignment issues
  }, [setPresetView]);
  
  const viewRight = useCallback(() => {
    setPresetView(new THREE.Vector3(10, 0, 0));
  }, [setPresetView]);
  
  const viewBottomLeft = useCallback(() => {
    setPresetView(new THREE.Vector3(-5, 5, -5));
  }, [setPresetView]);
  
  const viewBottom = useCallback(() => {
    setPresetView(new THREE.Vector3(0, 0, -10));
  }, [setPresetView]);
  
  const viewBottomRight = useCallback(() => {
    setPresetView(new THREE.Vector3(5, 5, -5));
  }, [setPresetView]);
  
  // Pan functions - now only move the model, not the camera or target
  const panCameraLeft = useCallback(() => {
    // Calculate the right vector (perpendicular to camera direction and up vector)
    const direction = new THREE.Vector3().subVectors(cameraTarget, cameraPosition).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(up, direction).normalize();
    
    // Calculate the offset to apply to the model (opposite direction of camera movement)
    const offset = right;
    
    // Move model (opposite direction)
    setModelOffset(prev => new THREE.Vector3(
      prev.x + offset.x,
      prev.y + offset.y,
      prev.z + offset.z
    ));
  }, [cameraPosition, cameraTarget]);
  
  const panCameraRight = useCallback(() => {
    // Calculate the right vector (perpendicular to camera direction and up vector)
    const direction = new THREE.Vector3().subVectors(cameraTarget, cameraPosition).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(up, direction).normalize();
    
    // Calculate the offset to apply to the model (opposite direction of camera movement)
    const offset = new THREE.Vector3(-right.x, -right.y, -right.z);
    
    // Move model (opposite direction)
    setModelOffset(prev => new THREE.Vector3(
      prev.x + offset.x,
      prev.y + offset.y,
      prev.z + offset.z
    ));
  }, [cameraPosition, cameraTarget]);
  
  const panCameraUp = useCallback(() => {
    // Move model down (opposite direction)
    const offset = new THREE.Vector3(0, -0.25, 0);
    
    setModelOffset(prev => {
      const newY = prev.y + offset.y;
      return new THREE.Vector3(prev.x, newY, prev.z);
    });
  }, []);
  
  const panCameraDown = useCallback(() => {
    // Move model up (opposite direction)
    const offset = new THREE.Vector3(0, 0.25, 0);
    
    setModelOffset(prev => {
      const newY = prev.y + offset.y;
      return new THREE.Vector3(prev.x, newY, prev.z);
    });
  }, []);
  
  const resetCamera = useCallback(() => {
    setCameraPosition(new THREE.Vector3(5, 5, 5));
    setCameraTarget(new THREE.Vector3(0, 0, 0));
    setModelOffset(new THREE.Vector3(0, 0, 0)); // Reset model offset
    setZoom(1);
    setIsOrthographic(true);
  }, []);
  
  const rotateCameraLeft = useCallback(() => {
    setCameraPosition((prev) => {
      const position = prev.clone();
      const rotationMatrix = new THREE.Matrix4().makeRotationY(Math.PI / 12);
      position.applyMatrix4(rotationMatrix);
      return position;
    });
  }, []);
  
  const rotateCameraRight = useCallback(() => {
    setCameraPosition((prev) => {
      const position = prev.clone();
      const rotationMatrix = new THREE.Matrix4().makeRotationY(-Math.PI / 12);
      position.applyMatrix4(rotationMatrix);
      return position;
    });
  }, []);
  
  const rotateCameraUp = useCallback(() => {
    setCameraPosition((prev) => {
      const position = prev.clone();
      const distance = position.distanceTo(cameraTarget);
      
      const spherical = new THREE.Spherical().setFromVector3(
        position.clone().sub(cameraTarget)
      );
      
      spherical.phi = Math.max(0.1, spherical.phi - Math.PI / 12);
      
      const newPosition = new THREE.Vector3().setFromSpherical(spherical).add(cameraTarget);
      
      return newPosition;
    });
  }, [cameraTarget]);
  
  const rotateCameraDown = useCallback(() => {
    setCameraPosition((prev) => {
      const position = prev.clone();
      const distance = position.distanceTo(cameraTarget);
      
      const spherical = new THREE.Spherical().setFromVector3(
        position.clone().sub(cameraTarget)
      );
      
      spherical.phi = Math.min(Math.PI - 0.1, spherical.phi + Math.PI / 12);
      
      const newPosition = new THREE.Vector3().setFromSpherical(spherical).add(cameraTarget);
      
      return newPosition;
    });
  }, [cameraTarget]);
  
  return {
    cameraPosition,
    cameraTarget,
    modelOffset,
    zoom,
    isOrthographic,
    setZoom,
    setIsOrthographic,
    setCameraPosition,
    setCameraTarget,
    setModelOffset,
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
    rotateCameraLeft,
    rotateCameraRight,
    rotateCameraUp,
    rotateCameraDown,
    panCameraLeft,
    panCameraRight,
    panCameraUp,
    panCameraDown
  };
};
