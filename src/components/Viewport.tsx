import { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { ImageEffects } from "@/hooks/useImageEffects";

interface ViewportProps {
  model: any;
  cameraPosition: THREE.Vector3;
  cameraTarget: THREE.Vector3;
  modelOffset?: THREE.Vector3;
  zoom: number;
  isOrthographic: boolean;
  showGrid: boolean;
  showAxes: boolean;
  isPlaying: boolean;
  currentAnimation: string | null;
  currentFrame: number;
  totalFrames: number;
  exportWidth?: number;
  exportHeight?: number;
  showExportPreview?: boolean;
  backgroundColor?: string;
  effects: ImageEffects;
}

// Custom shader for image effects
const ImageEffectsShader = {
  uniforms: {
    "tDiffuse": { value: null },
    "brightness": { value: 1.0 },
    "contrast": { value: 1.0 },
    "saturation": { value: 1.0 },
    "hue": { value: 0.0 },
    "colorSteps": { value: 0.0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float brightness;
    uniform float contrast;
    uniform float saturation;
    uniform float hue;
    uniform float colorSteps;
    varying vec2 vUv;

    vec3 rgb2hsv(vec3 c) {
      vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
      vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
      vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
      float d = q.x - min(q.w, q.y);
      float e = 1.0e-10;
      return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    }

    vec3 hsv2rgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      
      // Apply brightness
      vec3 color = texel.rgb * brightness;
      
      // Apply contrast
      color = (color - 0.5) * contrast + 0.5;
      
      // Apply hue and saturation
      vec3 hsv = rgb2hsv(color);
      
      // Apply hue shift (0-360 degrees)
      hsv.x = fract(hsv.x + hue / 360.0);
      
      // Apply saturation
      hsv.y *= saturation;
      
      // Convert back to RGB
      color = hsv2rgb(hsv);
      
      // Apply color steps (posterization)
      if (colorSteps > 0.0) {
        float steps = max(2.0, floor(colorSteps));
        color = floor(color * steps) / steps;
      }
      
      gl_FragColor = vec4(color, texel.a);
    }
  `
};

const Viewport = ({
  model,
  cameraPosition,
  cameraTarget,
  modelOffset = new THREE.Vector3(0, 0, 0),
  zoom,
  isOrthographic,
  showGrid,
  showAxes,
  isPlaying,
  currentAnimation,
  currentFrame,
  totalFrames,
  exportWidth = 128,
  exportHeight = 128,
  showExportPreview = true,
  backgroundColor = "#121212",
  effects
}: ViewportProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const perspectiveCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const orthographicCameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const gridRef = useRef<THREE.GridHelper | null>(null);
  const axesRef = useRef<THREE.AxesHelper | null>(null);
  const animationMixerRef = useRef<THREE.AnimationMixer | null>(null);
  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const effectsPassRef = useRef<ShaderPass | null>(null);

  const updateExportPreview = useCallback(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    if (containerWidth !== containerSize.width || containerHeight !== containerSize.height) {
      setContainerSize({ width: containerWidth, height: containerHeight });
    }

    const exportAspectRatio = exportWidth / exportHeight;
    const containerAspectRatio = containerWidth / containerHeight;

    let previewWidth, previewHeight;

    if (exportAspectRatio > containerAspectRatio) {
      const scaleFactor = Math.min(0.98, 0.85 + (containerWidth / 1500) * 0.13);
      previewWidth = containerWidth * scaleFactor;
      previewHeight = previewWidth / exportAspectRatio;
    } else {
      const scaleFactor = Math.min(0.98, 0.85 + (containerHeight / 1000) * 0.13);
      previewHeight = containerHeight * scaleFactor;
      previewWidth = previewHeight * exportAspectRatio;
    }

    const minPreviewSize = Math.min(containerWidth, containerHeight) * 0.5;
    previewWidth = Math.max(previewWidth, minPreviewSize * exportAspectRatio);
    previewHeight = Math.max(previewHeight, minPreviewSize);

    const left = (containerWidth - previewWidth) / 2;
    const top = (containerHeight - previewHeight) / 2;

    const roundedLeft = Math.round(left);
    const roundedTop = Math.round(top);
    const roundedWidth = Math.round(previewWidth);
    const roundedHeight = Math.round(previewHeight);

    // Store the export preview rect information for the renderer
    if (canvasRef.current) {
      (canvasRef.current as any).__exportPreviewRect = {
        left: roundedLeft,
        top: roundedTop,
        width: roundedWidth,
        height: roundedHeight,
        containerWidth,
        containerHeight,
        exportWidth,
        exportHeight,
        exportAspectRatio
      };

      console.log("Export preview rect updated:", (canvasRef.current as any).__exportPreviewRect);
    }
  }, [containerSize, exportWidth, exportHeight, showExportPreview]);

  const updateModelPosition = useCallback(() => {
    if (!sceneRef.current || !model) return;

    const container = sceneRef.current.getObjectByName("importedModel");
    if (!container) return;

    container.position.copy(modelOffset);
    
    if (rendererRef.current && sceneRef.current) {
      const activeCamera = isOrthographic 
        ? orthographicCameraRef.current 
        : perspectiveCameraRef.current;
        
      if (activeCamera) {
        rendererRef.current.render(sceneRef.current, activeCamera);
      }
    }
  }, [model, modelOffset, isOrthographic]);

  const centerModel = useCallback(() => {
    if (!sceneRef.current || !model) return;

    const container = sceneRef.current.getObjectByName("importedModel");
    if (!container) return;

    const box = new THREE.Box3().setFromObject(container);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // Apply the model offset but preserve the y-position from modelOffset
    container.position.set(modelOffset.x, modelOffset.y, modelOffset.z);
  }, [model, modelOffset]);

  const centerCameraOnModel = useCallback(() => {
    if (!sceneRef.current || !model || !perspectiveCameraRef.current || !orthographicCameraRef.current || !controlsRef.current || !canvasRef.current) return;

    const container = sceneRef.current.getObjectByName("importedModel");
    if (!container) return;

    const box = new THREE.Box3().setFromObject(container);
    const size = new THREE.Vector3();
    box.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = perspectiveCameraRef.current.fov;

    const viewportWidth = canvasRef.current.clientWidth;
    const viewportHeight = canvasRef.current.clientHeight;
    const viewportSize = Math.max(viewportWidth, viewportHeight);

    const viewportScaleFactor = 1 + Math.log10(viewportSize / 500 + 1);
    const cameraDistance = (maxDim / (2 * Math.tan((fov * Math.PI) / 360))) * viewportScaleFactor;

    const minDistance = 5 * viewportScaleFactor;
    const distance = Math.max(cameraDistance * 1.5, minDistance);

    const newPosition = new THREE.Vector3(distance, distance, distance);
    perspectiveCameraRef.current.position.copy(newPosition);
    orthographicCameraRef.current.position.copy(newPosition);

    const orthoCam = orthographicCameraRef.current;
    const aspectRatio = viewportWidth / viewportHeight;
    const frustumSize = maxDim * 0.75 * viewportScaleFactor;

    orthoCam.left = -frustumSize * aspectRatio;
    orthoCam.right = frustumSize * aspectRatio;
    orthoCam.top = frustumSize;
    orthoCam.bottom = -frustumSize;
    orthoCam.updateProjectionMatrix();

    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  }, [model]);

  useEffect(() => {
    updateModelPosition();
  }, [modelOffset, updateModelPosition]);

  useEffect(() => {
    if (!canvasRef.current || isInitialized) return;

    setIsLoading(true);

    const checkCanvasDimensions = () => {
      const width = canvasRef.current?.clientWidth || 0;
      const height = canvasRef.current?.clientHeight || 0;

      if (width > 0 && height > 0) {
        initializeScene();
      } else {
        setTimeout(checkCanvasDimensions, 50);
      }
    };

    const initializeScene = () => {
      const scene = new THREE.Scene();
      const colorHex = backgroundColor ? parseInt(backgroundColor.replace('#', '0x')) : 0x121212;
      scene.background = new THREE.Color(colorHex);
      sceneRef.current = scene;

      const width = canvasRef.current!.clientWidth;
      const height = canvasRef.current!.clientHeight;
      const aspectRatio = width / height;

      const perspectiveCamera = new THREE.PerspectiveCamera(
        75,
        aspectRatio,
        0.1,
        1000
      );
      const initialDistance = 5 * (1 + Math.log10(Math.max(width, height) / 500 + 1));
      perspectiveCamera.position.set(initialDistance, initialDistance, initialDistance);
      perspectiveCameraRef.current = perspectiveCamera;

      const initialFrustumSize = 5 * (1 + Math.log10(Math.max(width, height) / 400 + 1));
      const orthographicCamera = new THREE.OrthographicCamera(
        -initialFrustumSize * aspectRatio, 
        initialFrustumSize * aspectRatio, 
        initialFrustumSize, 
        -initialFrustumSize, 
        0.1, 
        1000
      );
      orthographicCamera.position.set(initialDistance, initialDistance, initialDistance);
      orthographicCameraRef.current = orthographicCamera;

      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current!,
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.shadowMap.enabled = true;
      rendererRef.current = renderer;

      // Setup post-processing
      const composer = new EffectComposer(renderer);
      composerRef.current = composer;

      // Add render pass
      const renderPass = new RenderPass(scene, isOrthographic ? orthographicCamera : perspectiveCamera);
      composer.addPass(renderPass);

      // Add effects pass
      const effectsPass = new ShaderPass(ImageEffectsShader);
      effectsPass.uniforms.brightness.value = effects.brightness;
      effectsPass.uniforms.contrast.value = effects.contrast;
      effectsPass.uniforms.saturation.value = effects.saturation;
      effectsPass.uniforms.hue.value = effects.hue;
      effectsPass.uniforms.colorSteps.value = effects.colorSteps;
      composer.addPass(effectsPass);
      effectsPassRef.current = effectsPass;
      
      // Expose the composer to the canvas element for access during export
      if (canvasRef.current) {
        (canvasRef.current as any).__effectComposer = composer;
      }

      const activeCamera = isOrthographic ? orthographicCamera : perspectiveCamera;
      (canvasRef.current as any).__r3f = {
        fiber: {
          renderer,
          scene,
          camera: activeCamera
        }
      };

      const controls = new OrbitControls(activeCamera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.target.set(0, 0, 0);
      controlsRef.current = controls;

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(5, 10, 7.5);
      directionalLight.castShadow = true;
      scene.add(directionalLight);

      const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x404040, 0.5);
      scene.add(hemisphereLight);

      const grid = new THREE.GridHelper(10, 10, 0x888888, 0xcccccc);
      grid.visible = showGrid;
      grid.position.set(0, 0, 0);
      scene.add(grid);
      gridRef.current = grid;

      const axes = new THREE.AxesHelper(5);
      axes.visible = showAxes;
      scene.add(axes);
      axesRef.current = axes;

      updateExportPreview();

      const handleResize = () => {
        if (!canvasRef.current || 
            !perspectiveCameraRef.current || 
            !orthographicCameraRef.current || 
            !rendererRef.current) return;
        
        setIsLoading(true);

        if (resizeTimeoutRef.current) {
          clearTimeout(resizeTimeoutRef.current);
        }

        resizeTimeoutRef.current = setTimeout(() => {
          const width = canvasRef.current!.clientWidth;
          const height = canvasRef.current!.clientHeight;
          
          if (width === 0 || height === 0) {
            resizeTimeoutRef.current = setTimeout(() => handleResize(), 100);
            return;
          }
          
          const aspectRatio = width / height;

          perspectiveCameraRef.current!.aspect = aspectRatio;
          perspectiveCameraRef.current!.updateProjectionMatrix();

          const orthoCam = orthographicCameraRef.current!;
          const baseSize = 5 * (1 + Math.log10(Math.max(width, height) / 400 + 1));
          
          orthoCam.left = -baseSize * aspectRatio;
          orthoCam.right = baseSize * aspectRatio;
          orthoCam.top = baseSize;
          orthoCam.bottom = -baseSize;
          orthoCam.updateProjectionMatrix();

          rendererRef.current!.setSize(width, height);
          rendererRef.current!.setPixelRatio(window.devicePixelRatio);
          
          updateExportPreview();
          
          if (controlsRef.current) {
            controlsRef.current.update();
          }
          
          setIsLoading(false);
        }, 150);
      };

      const resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      const handleWindowResize = () => {
        handleResize();
      };

      window.addEventListener("resize", handleWindowResize);

      setIsInitialized(true);
      setIsLoading(false);

      return () => {
        if (resizeTimeoutRef.current) {
          clearTimeout(resizeTimeoutRef.current);
        }
        
        resizeObserver.disconnect();
        window.removeEventListener("resize", handleWindowResize);
        
        if (requestRef.current !== null) {
          cancelAnimationFrame(requestRef.current);
        }

        if (rendererRef.current) {
          rendererRef.current.dispose();
        }

        setIsInitialized(false);
      };
    };
    
    checkCanvasDimensions();
  }, [isInitialized, backgroundColor, isOrthographic, showGrid, showAxes, updateExportPreview, effects]);

  useEffect(() => {
    if (!canvasRef.current || !rendererRef.current) return;

    const activeCamera = isOrthographic 
      ? orthographicCameraRef.current 
      : perspectiveCameraRef.current;

    if (activeCamera && canvasRef.current) {
      (canvasRef.current as any).__r3f.fiber.camera = activeCamera;

      if (controlsRef.current) {
        controlsRef.current.object = activeCamera;
        controlsRef.current.update();
      }
    }
  }, [isOrthographic]);

  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.visible = showGrid;
    }
  }, [showGrid]);

  useEffect(() => {
    if (axesRef.current) {
      axesRef.current.visible = showAxes;
    }
  }, [showAxes]);

  useEffect(() => {
    updateExportPreview();
  }, [containerSize, exportWidth, exportHeight, showExportPreview]);

  useEffect(() => {
    if (!sceneRef.current || !model) return;

    setIsLoading(true);

    const existingModel = sceneRef.current.getObjectByName("importedModel");
    if (existingModel) {
      sceneRef.current.remove(existingModel);
    }

    const container = new THREE.Group();
    container.name = "importedModel";

    container.add(model.scene);
    sceneRef.current.add(container);

    centerModel();
    
    setTimeout(() => {
      centerCameraOnModel();
      setIsLoading(false);
    }, 200);

    if (model.animations && model.animations.length > 0) {
      animationMixerRef.current = new THREE.AnimationMixer(model.scene);
    }

    return () => {
      if (animationMixerRef.current) {
        animationMixerRef.current = null;
      }
    };
  }, [model, centerCameraOnModel, centerModel]);

  useEffect(() => {
    if (!perspectiveCameraRef.current || 
        !orthographicCameraRef.current || 
        !controlsRef.current) return;

    perspectiveCameraRef.current.position.copy(cameraPosition);
    orthographicCameraRef.current.position.copy(cameraPosition);

    controlsRef.current.target.copy(cameraTarget);
    controlsRef.current.update();
  }, [cameraPosition, cameraTarget]);

  useEffect(() => {
    if (!perspectiveCameraRef.current || !orthographicCameraRef.current) return;

    perspectiveCameraRef.current.zoom = zoom;
    perspectiveCameraRef.current.updateProjectionMatrix();

    orthographicCameraRef.current.zoom = zoom;
    orthographicCameraRef.current.updateProjectionMatrix();
  }, [zoom]);

  useEffect(() => {
    if (!animationMixerRef.current || !model || !currentAnimation) return;

    const clip = model.animations.find((anim: THREE.AnimationClip) => 
      anim.name === currentAnimation
    );

    if (clip) {
      const action = animationMixerRef.current.clipAction(clip);
      animationMixerRef.current.stopAllAction();
      action.play();
    }
  }, [currentAnimation, model]);

  useEffect(() => {
    if (!animationMixerRef.current || !model || !currentAnimation) return;

    const clip = model.animations.find((anim: THREE.AnimationClip) => 
      anim.name === currentAnimation
    );

    if (clip && totalFrames > 0) {
      if (!isPlaying) {
        const normalizedTime = currentFrame / totalFrames;
        animationMixerRef.current.setTime(normalizedTime * clip.duration);
      }
    }
  }, [currentFrame, totalFrames, currentAnimation, isPlaying, model]);

  const animate = useCallback((time: number) => {
    if (!rendererRef.current || !sceneRef.current) return;

    const deltaTime = previousTimeRef.current ? (time - previousTimeRef.current) / 1000 : 0;
    previousTimeRef.current = time;

    // Update animation mixer if it exists
    if (animationMixerRef.current && isPlaying) {
      animationMixerRef.current.update(deltaTime);
    }

    // Update controls
    if (controlsRef.current) {
      controlsRef.current.update();
    }

    // Render the scene
    const activeCamera = isOrthographic 
      ? orthographicCameraRef.current 
      : perspectiveCameraRef.current;
      
    if (activeCamera) {
      if (composerRef.current) {
        // Use the composer for rendering with post-processing effects
        composerRef.current.render(deltaTime);
      } else if (rendererRef.current && sceneRef.current) {
        // Fallback to direct rendering if composer is not available
        rendererRef.current.render(sceneRef.current, activeCamera);
      }
    }

    // Request next frame
    requestRef.current = requestAnimationFrame(animate);
  }, [isPlaying, isOrthographic]);

  useEffect(() => {
    const handleFrameChange = (event: CustomEvent) => {
      if (animationMixerRef.current && model && model.animations && currentAnimation) {
        const frame = event.detail.frame;
        const totalFramesInEvent = event.detail.totalFrames || totalFrames;
        const anim = model.animations.find((a: any) => a.name === currentAnimation);
        if (anim) {
          const normalizedTime = frame / (totalFramesInEvent - 1);
          animationMixerRef.current.setTime(normalizedTime * anim.duration);
          
          if (rendererRef.current && sceneRef.current) {
            const activeCamera = isOrthographic 
              ? orthographicCameraRef.current 
              : perspectiveCameraRef.current;
              
            if (activeCamera) {
              rendererRef.current.render(sceneRef.current, activeCamera);
            }
          }
        }
      }
    };

    window.addEventListener('set-frame', handleFrameChange as EventListener);
    window.addEventListener('frame-change', handleFrameChange as EventListener);

    return () => {
      window.removeEventListener('set-frame', handleFrameChange as EventListener);
      window.removeEventListener('frame-change', handleFrameChange as EventListener);
    };
  }, [model, currentAnimation, isOrthographic, totalFrames]);

  useEffect(() => {
    if (!containerRef.current || !isInitialized) return;
    
    const expansionObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        
        if (
          width > containerSize.width * 1.15 || 
          height > containerSize.height * 1.15 ||
          width < containerSize.width * 0.85 ||
          height < containerSize.height * 0.85
        ) {
          setContainerSize({ width, height });
          
          requestAnimationFrame(() => {
            if (perspectiveCameraRef.current && orthographicCameraRef.current) {
              perspectiveCameraRef.current.aspect = width / height;
              perspectiveCameraRef.current.updateProjectionMatrix();
              
              const orthoCam = orthographicCameraRef.current;
              const baseSize = 5 * (1 + Math.log10(Math.max(width, height) / 400 + 1));
              const aspectRatio = width / height;
              
              orthoCam.left = -baseSize * aspectRatio;
              orthoCam.right = baseSize * aspectRatio;
              orthoCam.top = baseSize;
              orthoCam.bottom = -baseSize;
              orthoCam.updateProjectionMatrix();
              
              if (controlsRef.current) {
                controlsRef.current.update();
              }
              
              if (rendererRef.current) {
                rendererRef.current.setSize(width, height);
                rendererRef.current.setPixelRatio(window.devicePixelRatio);
              }
            }
            
            setTimeout(() => {
              updateExportPreview();
            }, 50);
          });
        }
      }
    });
    
    expansionObserver.observe(containerRef.current);
    
    return () => {
      expansionObserver.disconnect();
    };
  }, [isInitialized, containerSize]);

  useEffect(() => {
    const handleViewportResize = (event: CustomEvent) => {
      if (!perspectiveCameraRef.current || 
          !orthographicCameraRef.current || 
          !rendererRef.current) return;
      
      setIsLoading(true);
      
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      
      resizeTimeoutRef.current = setTimeout(() => {
        const { width, height } = event.detail;
        
        if (width === 0 || height === 0) {
          resizeTimeoutRef.current = setTimeout(() => {
            const newEvent = new CustomEvent('viewport-resize', {
              detail: { width: canvasRef.current?.clientWidth || 0, height: canvasRef.current?.clientHeight || 0 }
            });
            window.dispatchEvent(newEvent as Event);
          }, 100);
          return;
        }
        
        const aspectRatio = width / height;
        
        perspectiveCameraRef.current.aspect = aspectRatio;
        perspectiveCameraRef.current.updateProjectionMatrix();
        
        const orthoCam = orthographicCameraRef.current;
        const baseSize = 5 * (1 + Math.log10(Math.max(width, height) / 400 + 1));
        
        orthoCam.left = -baseSize * aspectRatio;
        orthoCam.right = baseSize * aspectRatio;
        orthoCam.top = baseSize;
        orthoCam.bottom = -baseSize;
        orthoCam.updateProjectionMatrix();
        
        rendererRef.current.setSize(width, height, false);
        rendererRef.current.setPixelRatio(window.devicePixelRatio);
        
        if (controlsRef.current) {
          controlsRef.current.update();
        }
        
        if (model) {
          centerCameraOnModel();
        }
        
        setIsLoading(false);
      }, 150);
    };
    
    window.addEventListener('viewport-resize', handleViewportResize as EventListener);
    
    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      window.removeEventListener('viewport-resize', handleViewportResize as EventListener);
    };
  }, [model, centerCameraOnModel]);

  useEffect(() => {
    if (sceneRef.current) {
      const colorHex = backgroundColor ? parseInt(backgroundColor.replace('#', '0x')) : 0x121212;
      sceneRef.current.background = new THREE.Color(colorHex);
    }
  }, [backgroundColor]);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    (canvasRef.current as any).__getExportViewSettings = () => {
      const activeCamera = isOrthographic 
        ? orthographicCameraRef.current 
        : perspectiveCameraRef.current;
      
      if (!activeCamera) return null;
      
      let target = new THREE.Vector3(0, 0, 0);
      if (controlsRef.current) {
        target = controlsRef.current.target.clone();
      }
      
      const settings: any = {
        camera: activeCamera.clone(),
        position: activeCamera.position.clone(),
        rotation: activeCamera.rotation.clone(),
        quaternion: activeCamera.quaternion.clone(),
        zoom: (activeCamera as any).zoom,
        isOrthographic,
        target,
        aspect: isOrthographic 
          ? null 
          : (activeCamera as THREE.PerspectiveCamera).aspect,
        fov: isOrthographic 
          ? null 
          : (activeCamera as THREE.PerspectiveCamera).fov,
        near: activeCamera.near,
        far: activeCamera.far,
        left: isOrthographic 
          ? (activeCamera as THREE.OrthographicCamera).left 
          : null,
        right: isOrthographic 
          ? (activeCamera as THREE.OrthographicCamera).right 
          : null,
        top: isOrthographic 
          ? (activeCamera as THREE.OrthographicCamera).top 
          : null,
        bottom: isOrthographic 
          ? (activeCamera as THREE.OrthographicCamera).bottom 
          : null,
        viewportWidth: canvasRef.current.clientWidth,
        viewportHeight: canvasRef.current.clientHeight
      };
      
      if ((canvasRef.current as any).__exportPreviewRect) {
        settings.exportPreviewRect = { ...(canvasRef.current as any).__exportPreviewRect };
      }
      
      return settings;
    };
  }, [isOrthographic]);

  // Update effects when they change
  useEffect(() => {
    if (effectsPassRef.current) {
      effectsPassRef.current.uniforms.brightness.value = effects.brightness;
      effectsPassRef.current.uniforms.contrast.value = effects.contrast;
      effectsPassRef.current.uniforms.saturation.value = effects.saturation;
      effectsPassRef.current.uniforms.hue.value = effects.hue;
      effectsPassRef.current.uniforms.colorSteps.value = effects.colorSteps;
    }
  }, [effects]);

  // Update the render pass when the camera changes
  useEffect(() => {
    if (!composerRef.current || !sceneRef.current) return;
    
    const activeCamera = isOrthographic 
      ? orthographicCameraRef.current 
      : perspectiveCameraRef.current;
      
    if (activeCamera && composerRef.current.passes.length > 0) {
      // Update the first pass (RenderPass) with the new camera
      const renderPass = composerRef.current.passes[0] as RenderPass;
      renderPass.camera = activeCamera;
    }
  }, [isOrthographic]);

  // Start the animation loop
  useEffect(() => {
    if (!isInitialized || !rendererRef.current || !sceneRef.current) return;

    // Start the animation loop
    requestRef.current = requestAnimationFrame(animate);

    // Clean up on unmount
    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [animate, isInitialized]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !rendererRef.current) return;
      
      const width = canvasRef.current.clientWidth;
      const height = canvasRef.current.clientHeight;
      
      // Update renderer size
      rendererRef.current.setSize(width, height);
      
      // Update composer size
      if (composerRef.current) {
        composerRef.current.setSize(width, height);
      }
      
      // Update camera aspect ratio
      if (perspectiveCameraRef.current) {
        perspectiveCameraRef.current.aspect = width / height;
        perspectiveCameraRef.current.updateProjectionMatrix();
      }
      
      if (orthographicCameraRef.current) {
        const aspectRatio = width / height;
        const frustumSize = 5 * (1 + Math.log10(Math.max(width, height) / 400 + 1));
        
        orthographicCameraRef.current.left = -frustumSize * aspectRatio;
        orthographicCameraRef.current.right = frustumSize * aspectRatio;
        orthographicCameraRef.current.top = frustumSize;
        orthographicCameraRef.current.bottom = -frustumSize;
        orthographicCameraRef.current.updateProjectionMatrix();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full"
      style={{ position: 'relative' }}
    >
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 z-10">
          <div className="loading-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default Viewport;
