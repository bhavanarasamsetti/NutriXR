import { useFrame } from '@react-three/fiber';
import React from 'react';

export default function useFloatY(amplitude = 0.06, speed = 1.2, phase = 0) {
  const ref = React.useRef();
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime * speed + phase;
    const offset = Math.sin(t) * amplitude;
    ref.current.position.y += offset * state.clock.getDelta();
  });
  return ref;
}
