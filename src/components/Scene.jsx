import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls,
  Html,
  Environment,
  ContactShadows,
  Center,
  useGLTF,
  Billboard,
  Text
} from '@react-three/drei';
import * as THREE from 'three';
import NutrientGraph from './NutrientGraph.jsx';

function useModelAvailability(modelPath) {
  const [available, setAvailable] = useState(false);
  const [checking, setChecking] = useState(!!modelPath);

  useEffect(() => {
    let active = true;
    if (!modelPath) {
      setAvailable(false);
      setChecking(false);
      return undefined;
    }

    setChecking(true);
    const base = import.meta.env.BASE_URL || '/';
    const resolved =
      modelPath && modelPath.startsWith('/')
        ? base.replace(/\/$/, '') + modelPath
        : base + modelPath;

    fetch(resolved, { method: 'HEAD' })
      .then((res) => {
        if (!active) return;
        setAvailable(res.ok);
      })
      .catch(() => active && setAvailable(false))
      .finally(() => active && setChecking(false));

    return () => {
      active = false;
    };
  }, [modelPath]);

  return { available, checking };
}

function FruitModel({ modelPath, onBounds, targetSize = 1.5, scaleOverride }) {
  const base = import.meta.env.BASE_URL || '/';
  const resolved =
    modelPath && modelPath.startsWith('/')
      ? base.replace(/\/$/, '') + modelPath
      : base + modelPath;
  const { scene } = useGLTF(resolved);

  const cloned = useMemo(() => scene.clone(true), [scene]);

  const { scale, offset, bounds } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    const safeDim = maxDim || 1;
    const autoScale = targetSize / safeDim;

    return {
      scale: scaleOverride || autoScale,
      offset: center,
      bounds: { size, center }
    };
  }, [cloned, targetSize, scaleOverride]);

  useEffect(() => {
    if (!bounds || !onBounds) return;
    const radius = Math.max(bounds.size.x, bounds.size.z) * scale * 0.5;
    const height = bounds.size.y * scale;
    onBounds({
      radius: radius || 1.2,
      height: height || 1.2,
      center: [0, 0, 0]
    });
  }, [bounds, onBounds, scale]);

  return (
    <Center>
      <group scale={scale} position={[-offset.x * scale, -offset.y * scale, -offset.z * scale]}>
        <primitive object={cloned} castShadow receiveShadow />
      </group>
    </Center>
  );
}

export function FruitSceneContent({
  fruit,
  sliceMode,
  nutrients,
  selectedNutrient,
  onSelectNutrient,
  isAR = false,
  showShadows = true,
  backgroundColor = '#f6f7fb'
}) {
  const modelPath = useMemo(() => {
    if (sliceMode && fruit?.slicedModelPath) return fruit.slicedModelPath;
    return fruit?.modelPath;
  }, [fruit, sliceMode]);

  const { available, checking } = useModelAvailability(modelPath);
  const [modelLayout, setModelLayout] = useState(null);

  return (
    <>
      {!isAR ? <color attach="background" args={[backgroundColor]} /> : null}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[4, 6, 4]}
        intensity={1.1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <Environment preset="studio" />

      <Suspense
        fallback={
          <Html center>
            <div
              style={{
                padding: '8px 12px',
                background: '#fff',
                borderRadius: 6,
                border: '1px solid #d0d5dd'
              }}
            >
              Loading fruit model...
            </div>
          </Html>
        }
      >
        <group position={[0, 0, 0]}>
          {available && modelPath && (
            <FruitModel
              modelPath={modelPath}
              onBounds={setModelLayout}
              targetSize={1.25}
              scaleOverride={fruit?.scale}
            />
          )}
          {!checking && (!available || !modelPath) && (
            <group>
              <Html center>
                <div
                  style={{
                    padding: '8px 12px',
                    background: '#fff',
                    borderRadius: 6,
                    border: '1px solid #d0d5dd'
                  }}
                >
                  3D model not found. Showing placeholder.
                </div>
              </Html>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#4f46e5" />
              </mesh>
            </group>
          )}

          <NutrientGraph
            nutrients={nutrients}
            nutritionData={nutrients}
            selectedNutrient={selectedNutrient}
            onSelectNutrient={onSelectNutrient}
            fruitId={fruit?.id || 'Fruit'}
            modelLayout={modelLayout}
            forceExpandAll={isAR}
          />

          {showShadows ? (
            <ContactShadows
              position={[0, -0.01, 0]}
              opacity={0.3}
              scale={6}
              blur={2.4}
              far={6}
            />
          ) : null}
          {modelLayout ? (
            <Billboard position={[0, modelLayout.height ? modelLayout.height * 0.65 : 0.6, 0]} depthTest={false}>
              <Text
                fontSize={0.18}
                color="#0f172a"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.014}
                outlineColor="white"
                depthTest={false}
                depthWrite={false}
                renderOrder={10}
              >
                {fruit?.name || fruit?.id || 'Fruit'}
              </Text>
            </Billboard>
          ) : null}
        </group>
      </Suspense>
    </>
  );
}

function Scene({
  fruit,
  sliceMode,
  nutrients,
  selectedNutrient,
  onSelectNutrient,
  isAR = false
}) {
  if (isAR) {
    return (
      <div className="canvas-wrapper" style={{ background: '#000' }}>
        <div className="model-fallback">
          <p>WebXR AR is not stable on mobile. Use AR Viewer page.</p>
        </div>
      </div>
    );
  }

  return (
    <Canvas
      key={`${fruit?.id}-${sliceMode ? 'sliced' : 'whole'}`}
      shadows
      camera={{ position: [0, 2.6, 4.2], fov: 45 }}
    >
      <FruitSceneContent
        fruit={fruit}
        sliceMode={sliceMode}
        nutrients={nutrients}
        selectedNutrient={selectedNutrient}
        onSelectNutrient={onSelectNutrient}
        isAR={false}
        showShadows
        backgroundColor="#f6f7fb"
      />

      <OrbitControls
        enableDamping
        minDistance={2}
        maxDistance={6}
        maxPolarAngle={Math.PI / 2}
      />
    </Canvas>
  );
}

export default Scene;
