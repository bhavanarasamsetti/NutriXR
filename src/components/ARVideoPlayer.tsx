import { useEffect, useMemo, useRef, useState } from "react";
import type { YogaClip } from "../data/yogaClips";

declare global {
  interface Window {
    AFRAME?: any;
  }
}

type ARVideoPlayerProps = {
  clip: YogaClip;
  onExit: () => void;
  onNext: () => void;
  onError: (message: string) => void;
};

let aframeLoader: Promise<void> | null = null;

const loadAFrame = () => {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (window.AFRAME) return Promise.resolve();
  if (aframeLoader) return aframeLoader;

  aframeLoader = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://aframe.io/releases/1.5.0/aframe.min.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load A-Frame"));
    document.head.appendChild(script);
  });

  return aframeLoader;
};

const registerAFrameComponents = () => {
  const AFRAME = window.AFRAME;
  if (!AFRAME) return;
  if (AFRAME.components["yoga-hit-test"]) return;

  AFRAME.registerComponent("yoga-billboard", {
    tick: function () {
      const scene = this.el.sceneEl;
      if (!scene?.camera) return;
      const obj = this.el.object3D;
      const camera = scene.camera;
      const cameraPos = new AFRAME.THREE.Vector3();
      camera.getWorldPosition(cameraPos);
      cameraPos.y = obj.position.y;
      obj.lookAt(cameraPos);
    }
  });

  AFRAME.registerComponent("yoga-hit-test", {
    init: function () {
      this.reticle = this.el;
      this.hitTestSource = null;
      this.viewerSpace = null;
      this.refSpace = null;
      this.xrSession = null;
      this.reticle.object3D.matrixAutoUpdate = false;
      this.reticle.object3D.visible = false;

      this.onSessionStart = () => {
        const scene = this.el.sceneEl;
        const renderer = scene?.renderer;
        const session = renderer?.xr?.getSession?.();
        if (!session) return;

        this.xrSession = session;
        this.refSpace = renderer.xr.getReferenceSpace();

        session
          .requestReferenceSpace("viewer")
          .then((space) => {
            this.viewerSpace = space;
            return session.requestHitTestSource({ space });
          })
          .then((source) => {
            this.hitTestSource = source;
          })
          .catch(() => {
            this.hitTestSource = null;
          });

        session.addEventListener("end", () => {
          this.hitTestSource = null;
          this.viewerSpace = null;
          this.refSpace = null;
        });
      };

      this.onSessionEnd = () => {
        this.hitTestSource = null;
        this.viewerSpace = null;
        this.refSpace = null;
      };

      const scene = this.el.sceneEl;
      scene?.addEventListener("enter-vr", this.onSessionStart);
      scene?.addEventListener("exit-vr", this.onSessionEnd);
    },
    tick: function () {
      if (this.el.dataset.placed === "true") {
        this.reticle.object3D.visible = false;
        return;
      }

      const scene = this.el.sceneEl;
      const frame = scene?.frame;
      if (!frame || !this.hitTestSource || !this.refSpace) return;

      const hitTestResults = frame.getHitTestResults(this.hitTestSource);
      if (!hitTestResults.length) {
        this.reticle.object3D.visible = false;
        return;
      }

      const hit = hitTestResults[0];
      const pose = hit.getPose(this.refSpace);
      if (!pose) return;

      this.reticle.object3D.visible = true;
      this.reticle.object3D.matrix.fromArray(pose.transform.matrix);
      this.reticle.object3D.matrix.decompose(
        this.reticle.object3D.position,
        this.reticle.object3D.quaternion,
        this.reticle.object3D.scale
      );
    },
    remove: function () {
      const scene = this.el.sceneEl;
      scene?.removeEventListener("enter-vr", this.onSessionStart);
      scene?.removeEventListener("exit-vr", this.onSessionEnd);
    }
  });
};

export default function ARVideoPlayer({ clip, onExit, onNext, onError }: ARVideoPlayerProps) {
  const sceneRef = useRef<any>(null);
  const reticleRef = useRef<any>(null);
  const planeRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [aframeReady, setAframeReady] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState("Tap a surface to place the video panel.");

  useEffect(() => {
    let active = true;
    loadAFrame()
      .then(() => {
        if (!active) return;
        registerAFrameComponents();
        setAframeReady(true);
      })
      .catch(() => {
        if (!active) return;
        onError("AR library failed to load. Switching to video mode.");
      });
    return () => {
      active = false;
    };
  }, [onError]);

  useEffect(() => {
    const sceneEl = sceneRef.current;
    if (!sceneEl) return;

    const handleEnter = () => setIsPresenting(true);
    const handleExit = () => setIsPresenting(false);
    const handleLoaded = () => setSceneReady(true);

    sceneEl.addEventListener("enter-vr", handleEnter);
    sceneEl.addEventListener("exit-vr", handleExit);
    sceneEl.addEventListener("loaded", handleLoaded);
    if (sceneEl.hasLoaded) setSceneReady(true);

    return () => {
      sceneEl.removeEventListener("enter-vr", handleEnter);
      sceneEl.removeEventListener("exit-vr", handleExit);
      sceneEl.removeEventListener("loaded", handleLoaded);
    };
  }, [aframeReady]);

  useEffect(() => {
    setPlaced(false);
    setStatus("Tap a surface to place the video panel.");
    const reticleEl = reticleRef.current;
    if (reticleEl) {
      reticleEl.dataset.placed = "false";
      reticleEl.object3D.visible = false;
    }
    const planeEl = planeRef.current;
    if (planeEl) {
      planeEl.object3D.visible = false;
    }
    const videoEl = videoRef.current;
    if (videoEl) {
      videoEl.pause();
      videoEl.currentTime = 0;
      setIsPlaying(false);
    }
  }, [clip.videoSrc]);

  const handleStartAR = async () => {
    const sceneEl = sceneRef.current;
    if (!sceneEl) return;

    if (!navigator.xr?.isSessionSupported) {
      onError("AR is not available in this browser. Switching to video mode.");
      return;
    }

    try {
      const supported = await navigator.xr.isSessionSupported("immersive-ar");
      if (!supported) {
        onError("AR is not supported on this device. Switching to video mode.");
        return;
      }
    } catch (err) {
      setStatus("Starting AR without a support check.");
    }

    const startSession = async () => {
      try {
        await sceneEl.enterVR();
      } catch (err) {
        onError("AR session failed to start. Switching to video mode.");
      }
    };

    if (!sceneReady) {
      sceneEl.addEventListener("loaded", startSession, { once: true });
      setStatus("Loading AR scene...");
      return;
    }

    await startSession();
  };

  const placePlane = () => {
    const sceneEl = sceneRef.current;
    const planeEl = planeRef.current;
    const reticleEl = reticleRef.current;
    if (!planeEl || !sceneEl) return;

    const camera = sceneEl.camera;
    if (reticleEl?.object3D?.visible) {
      planeEl.object3D.position.copy(reticleEl.object3D.position);
      planeEl.object3D.quaternion.copy(reticleEl.object3D.quaternion);
    } else if (camera) {
      const dir = new window.AFRAME.THREE.Vector3(0, 0, -1);
      dir.applyQuaternion(camera.quaternion);
      const camPos = new window.AFRAME.THREE.Vector3();
      camera.getWorldPosition(camPos);
      const target = camPos.add(dir.multiplyScalar(1.5));
      planeEl.object3D.position.copy(target);
    }

    planeEl.object3D.visible = true;
    if (reticleEl) {
      reticleEl.dataset.placed = "true";
      reticleEl.object3D.visible = false;
    }
    setPlaced(true);
    setStatus("Tap Play to start the video.");
  };

  useEffect(() => {
    const sceneEl = sceneRef.current;
    if (!sceneEl) return;

    const handleSelect = () => {
      if (!placed) {
        placePlane();
      }
    };

    sceneEl.addEventListener("click", handleSelect);
    sceneEl.addEventListener("select", handleSelect);

    return () => {
      sceneEl.removeEventListener("click", handleSelect);
      sceneEl.removeEventListener("select", handleSelect);
    };
  }, [placed]);

  const togglePlay = async () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    if (videoEl.paused) {
      try {
        await videoEl.play();
        setIsPlaying(true);
      } catch (err) {
        setStatus("Video did not start. Tap Play again.");
      }
    } else {
      videoEl.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    videoEl.muted = !videoEl.muted;
    setIsMuted(videoEl.muted);
  };

  const handleExit = async () => {
    const sceneEl = sceneRef.current;
    const videoEl = videoRef.current;
    if (videoEl) {
      videoEl.pause();
    }
    if (sceneEl?.is("vr-mode")) {
      try {
        await sceneEl.exitVR();
      } catch (err) {
        onError("AR session ended with errors. Switching to video mode.");
      }
    }
    onExit();
  };

  const infoLine = useMemo(
    () => `Goal: ${clip.goal} | Duration: ${clip.duration} | Level: ${clip.level}`,
    [clip.goal, clip.duration, clip.level]
  );

  if (!aframeReady) {
    return (
      <div className="yoga-player">
        <header className="yoga-player-header">
          <button className="yoga-back" type="button" onClick={onExit}>
            Back to Yoga Hub
          </button>
        </header>
        <div className="yoga-ar-loading">Loading AR tools...</div>
      </div>
    );
  }

  return (
    <div className="yoga-ar-shell">
      <div className="yoga-ar-top">
        <button className="yoga-back" type="button" onClick={handleExit}>
          Exit
        </button>
        <div className="yoga-ar-title">
          <h2>{clip.title}</h2>
          <p>{infoLine}</p>
        </div>
        {!isPresenting && (
          <button className="yoga-primary" type="button" onClick={handleStartAR}>
            Start AR
          </button>
        )}
      </div>

      <div className="yoga-ar-stage">
        <a-scene
          ref={sceneRef}
          embedded
          vr-mode-ui="enabled: false"
          xr-mode-ui="enabled: false"
          renderer="colorManagement: true; physicallyCorrectLights: true"
          webxr="optionalFeatures: hit-test, dom-overlay, local-floor"
        >
          <a-assets>
            <video
              id="yoga-video"
              ref={videoRef}
              src={clip.videoSrc}
              preload="auto"
              playsInline
              crossOrigin="anonymous"
            />
          </a-assets>

          <a-entity camera position="0 1.6 0" />

          <a-entity
            ref={reticleRef}
            yoga-hit-test
            geometry="primitive: ring; radiusInner: 0.08; radiusOuter: 0.12"
            material="color: #2dd4bf; shader: flat; opacity: 0.85"
            rotation="-90 0 0"
          />

          <a-plane
            ref={planeRef}
            position="0 1 -1.5"
            width="1.2"
            height="0.7"
            material="shader: flat; src: #yoga-video"
            yoga-billboard
            visible="false"
          />
        </a-scene>
      </div>

      <div className="yoga-ar-status">{status}</div>

      <div className="yoga-ar-controls">
        <button className="yoga-primary" type="button" onClick={togglePlay}>
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button className="yoga-secondary" type="button" onClick={toggleMute}>
          {isMuted ? "Unmute" : "Mute"}
        </button>
        <button className="yoga-secondary" type="button" onClick={onNext}>
          Next
        </button>
        <button className="yoga-ghost" type="button" onClick={handleExit}>
          Exit
        </button>
      </div>
    </div>
  );
}
