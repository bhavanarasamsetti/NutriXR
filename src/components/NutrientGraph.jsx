import React, { useMemo, useState } from 'react';
import { Text, Billboard } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useFloatY from './hooks/useFloatY.js';

const categoryColors = {
  vitamins: '#2563eb',
  minerals: '#db2777',
  calories: '#d97706',
  energy: '#7c3aed',
  other: '#6b7280'
};
const defaultSoftColor = new THREE.Color('#6b7280').lerp(new THREE.Color('#ffffff'), 0.35);

const categorize = (nutrient) => {
  const name = (nutrient.name || '').toLowerCase();
  if (name.includes('vitamin')) return 'vitamins';
  if (
    name.includes('potassium') ||
    name.includes('iron') ||
    name.includes('calcium') ||
    name.includes('magnesium') ||
    name.includes('zinc')
  ) {
    return 'minerals';
  }
  if (name.includes('energy') || name.includes('calorie') || name.includes('protein') || name.includes('carb') || name.includes('sugar')) {
    return 'calories';
  }
  if (name.includes('fat')) return 'energy';
  if (name.includes('fiber') || name.includes('fibre')) return 'energy';
  return 'other';
};

const buildCategories = (nutrients = []) => {
  const buckets = {
    vitamins: [],
    minerals: [],
    calories: [],
    energy: [],
    other: []
  };
  nutrients.forEach((n) => {
    buckets[categorize(n)].push(n);
  });
  return Object.entries(buckets)
    .filter(([, items]) => items.length > 0)
    .map(([key, items]) => ({
      id: key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      items
    }));
};

const polarPosition = (index, count, radius, y, centerX = 0, centerZ = 0) => {
  const angle = (index / count) * Math.PI * 2;
  const x = centerX + Math.cos(angle) * radius;
  const z = centerZ + Math.sin(angle) * radius;
  return [x, y, z];
};

function FloatWrapper({ children, position, amplitude = 0.06, speed = 0.8, phase = 0 }) {
  const ref = useFloatY(amplitude, speed, phase);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime * 0.8 + phase;
    const s = 1 + Math.sin(t) * 0.05;
    ref.current.scale.setScalar(s);
    ref.current.rotation.y = Math.sin(t * 0.6) * 0.15;
  });
  return (
    <group position={position} ref={ref}>
      {children}
    </group>
  );
}

function dedupeByName(list = []) {
  const seen = new Map();
  list.forEach((item) => {
    const key = (item.name || '').toLowerCase();
    if (key && !seen.has(key)) seen.set(key, item);
  });
  return Array.from(seen.values());
}

function extractVitamins(nutrients = [], nutritionData) {
  const collected = [];

  if (Array.isArray(nutrients)) {
    nutrients.forEach((n) => {
      if ((n.name || '').toLowerCase().includes('vitamin')) collected.push(n);
    });
  }

  if (nutritionData) {
    if (Array.isArray(nutritionData.vitamins)) {
      collected.push(...nutritionData.vitamins);
    }
    if (nutritionData.categories?.Vitamins && Array.isArray(nutritionData.categories.Vitamins)) {
      collected.push(...nutritionData.categories.Vitamins);
    }
    if (typeof nutritionData === 'object' && !Array.isArray(nutritionData)) {
      Object.entries(nutritionData).forEach(([key, value]) => {
        if (key.toLowerCase().startsWith('vitamin')) {
          const name = key.replace(/_/g, ' ');
          if (typeof value === 'object' && value !== null && (value.amount || value.unit)) {
            collected.push({ id: key, name, amount: value.amount, unit: value.unit, benefit: value.benefit });
          } else if (typeof value === 'number') {
            collected.push({ id: key, name, amount: value, unit: '', benefit: '' });
          }
        }
      });
    }
  }

  return dedupeByName(collected);
}

function NutrientGraph({
  nutrients = [],
  nutritionData = null,
  selectedNutrient,
  onSelectNutrient,
  fruitId,
  modelLayout,
  forceExpandAll = false
}) {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const softColorMap = useMemo(() => {
    const map = {};
    Object.entries(categoryColors).forEach(([key, value]) => {
      map[key] = new THREE.Color(value).lerp(new THREE.Color('#ffffff'), 0.18);
    });
    map.default = defaultSoftColor;
    return map;
  }, []);

  const centerX = modelLayout?.center?.[0] ?? 0;
  const centerY = modelLayout?.center?.[1] ?? 0;
  const centerZ = modelLayout?.center?.[2] ?? 0;

  const baseRadius =
    modelLayout?.radius && modelLayout.radius > 0
      ? modelLayout.radius * 3
      : 2.8;
  const categoryHeight = centerY + 0.65;

  const vitaminsDynamic = useMemo(
    () => extractVitamins(nutrients, nutritionData),
    [nutrients, nutritionData]
  );

  const categories = useMemo(
    () => {
      const base = buildCategories(nutrients);
      return base.map((cat) =>
        cat.id === 'vitamins' ? { ...cat, items: vitaminsDynamic } : cat
      );
    },
    [nutrients, vitaminsDynamic]
  );

  const categoryNodes = useMemo(() => {
    const count = categories.length || 1;
    return categories.map((cat, index) => {
      const summary =
        cat.id === 'vitamins'
          ? `${cat.items.length} vit`
          : cat.id === 'minerals'
            ? `${cat.items.length} min`
            : cat.id === 'calories'
              ? cat.items[0]?.amount ? `${cat.items[0].amount} ${cat.items[0].unit || ''}` : ''
              : cat.id === 'energy'
                ? `${cat.items.length} items`
                : '';

      return {
        ...cat,
        summary,
        position: polarPosition(index, count, baseRadius, categoryHeight, centerX, centerZ),
        phase: index * 0.7
      };
    });
  }, [categories, baseRadius, categoryHeight, centerX, centerZ]);

  return (
    <group>
      {categoryNodes.map((cat) => {
        const softColor = softColorMap[cat.id] || softColorMap.default;
        const isExpanded = forceExpandAll || expandedCategory === cat.id;
        const baseScale = isExpanded ? 1.15 : 1;
        return (
          <FloatWrapper key={cat.id} position={cat.position} amplitude={0.06} speed={0.8} phase={cat.phase || 0}>
            <mesh
              onClick={() => {
                if (forceExpandAll) return;
                setExpandedCategory(isExpanded ? null : cat.id);
              }}
              scale={baseScale}
              castShadow
              >
              <sphereGeometry args={[0.22, 24, 24]} />
              <meshStandardMaterial
                color={softColor}
                emissive={softColor}
                emissiveIntensity={0.28}
                transparent
                opacity={0.45}
              />
            </mesh>
            <Billboard position={[0, 0.26, 0.2]} depthTest={false} renderOrder={2000}>
              <group>
                <Text
                  fontSize={0.11}
                  color="#0f172a"
                  anchorX="center"
                  anchorY="middle"
                  outlineWidth={0}
                  outlineColor="#ffffff"
                  maxWidth={1.6}
                  depthTest={false}
                  depthWrite={false}
                  renderOrder={2000}
                  toneMapped={false}
                >
                  {cat.items?.[0]?.amount ? `${cat.items[0].amount} ${cat.items[0].unit || ''}` : '--'}
                </Text>
              </group>
            </Billboard>
            <Billboard position={[0, 0.38, 0]} depthTest={false} renderOrder={2000}>
              <Text
                fontSize={0.12}
                color="#0f172a"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0}
                outlineColor="white"
                depthTest={false}
                depthWrite={false}
                renderOrder={999}
                toneMapped={false}
              >
                {cat.label}
              </Text>
            </Billboard>
          </FloatWrapper>
        );
      })}

      {categoryNodes.map((cat) => {
        if (!forceExpandAll && expandedCategory !== cat.id) return null;
        const nutrientsInCat = cat.items || [];
        if (!nutrientsInCat.length) return null;
        const subRadius = 0.95;
        const subHeight = cat.position[1] + 0.05;
        const count = nutrientsInCat.length || 1;
        const list = forceExpandAll ? nutrientsInCat : nutrientsInCat.slice(0, 6);
        return list.map((nutrient, idx) => {
          const pos = polarPosition(
            idx,
            Math.min(count, forceExpandAll ? count : 6),
            subRadius,
            subHeight,
            cat.position[0],
            cat.position[2]
          );
          const isSelected = selectedNutrient?.id === nutrient.id || selectedNutrient?.name === nutrient.name;
          const softColor = softColorMap[cat.id] || softColorMap.default;
          const benefit = nutrient.benefit || '';
          return (
            <FloatWrapper
              key={`nut-${nutrient.id || nutrient.name || idx}`}
              position={pos}
              amplitude={0.04}
              speed={1.0}
              phase={cat.phase ? cat.phase + idx * 0.4 : idx * 0.4}
            >
              <mesh
                onClick={() => {
                  onSelectNutrient?.(nutrient);
                }}
                scale={isSelected ? 1.15 : 1}
                castShadow
              >
                <sphereGeometry args={[0.16, 18, 18]} />
              <meshStandardMaterial
                color={softColor}
                emissive={softColor}
                emissiveIntensity={isSelected ? 0.45 : 0.28}
                transparent
                opacity={0.5}
              />
            </mesh>
              <Billboard position={[0, 0.26, 0]} depthTest={false} renderOrder={2000}>
                <Text
                  fontSize={0.1}
                  color="#0f172a"
                  anchorX="center"
                  anchorY="middle"
                  outlineWidth={0}
                  outlineColor="white"
                  depthTest={false}
                  depthWrite={false}
                  renderOrder={2000}
                  toneMapped={false}
                >
                  {nutrient.name}
                </Text>
              </Billboard>
              <Billboard position={[0, 0.16, 0.12]} depthTest={false} renderOrder={2000}>
                <Text
                  fontSize={0.09}
                  color="#0f172a"
                  anchorX="center"
                  anchorY="middle"
                  outlineWidth={0}
                  outlineColor="white"
                  depthTest={false}
                  depthWrite={false}
                  renderOrder={2000}
                  toneMapped={false}
                >
                  {nutrient.amount ?? '--'} {nutrient.unit ?? ''}
                </Text>
              </Billboard>
              {isSelected && benefit ? (
                <Billboard position={[0, -0.5, 0]} depthTest={false} renderOrder={999}>
                  <group>
                    <mesh position={[0, 0, -0.01]}>
                      <planeGeometry args={[1.8, 0.32]} />
                      <meshStandardMaterial
                        color={softColor}
                        transparent
                        opacity={0.22}
                        roughness={0.35}
                        metalness={0}
                      />
                    </mesh>
                    <Text
                      fontSize={0.075}
                      color="#0f172a"
                      anchorX="center"
                      anchorY="middle"
                      outlineWidth={0}
                      outlineColor="#ffffff"
                      maxWidth={1.6}
                      depthTest={false}
                      depthWrite={false}
                      renderOrder={999}
                      toneMapped={false}
                    >
                      {benefit}
                    </Text>
                  </group>
                </Billboard>
              ) : null}
            </FloatWrapper>
          );
        });
      })}
    </group>
  );
}

export default NutrientGraph;

