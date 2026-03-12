import React, { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useBatteryStore } from '../../store/batteryStore';
import { useT } from '../../i18n/translations';

const SERIES_COLORS = [
  '#00d4ff', '#ff6b6b', '#51cf66', '#ffd43b', '#ff922b',
  '#cc5de8', '#74c0fc', '#f783ac', '#a9e34b', '#63e6be',
  '#4dabf7', '#e599f7', '#ffa94d', '#69db7c', '#ff8787',
];

// ─── Individual cylindrical cell ─────────────────────────────────────────────
function CylindricalCell({ position, radius, height, color, label, showLabel }) {
  const [hover, setHover] = useState(false);
  return (
    <group position={position}>
      <mesh onPointerOver={() => setHover(true)} onPointerOut={() => setHover(false)}>
        <cylinderGeometry args={[radius, radius, height, 28]} />
        <meshStandardMaterial
          color={hover ? '#ffffff' : color}
          metalness={0.38} roughness={0.28}
          transparent opacity={0.93}
        />
      </mesh>
      {/* positive terminal */}
      <mesh position={[0, height / 2 + 0.4, 0]}>
        <cylinderGeometry args={[radius * 0.34, radius * 0.34, 0.8, 16]} />
        <meshStandardMaterial color="#e8e8e8" metalness={0.85} roughness={0.1} />
      </mesh>
      {/* negative terminal ring */}
      <mesh position={[0, -height / 2 + 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 0.7, 0.5, 6, 24]} />
        <meshStandardMaterial color="#888" metalness={0.7} roughness={0.3} />
      </mesh>
      {showLabel && hover && label && (
        <Text position={[0, height / 2 + 5, 0]} fontSize={3} color="#ffffff"
          anchorX="center" anchorY="bottom" renderOrder={999}>
          {label}
        </Text>
      )}
    </group>
  );
}

// ─── Prismatic / pouch cell ───────────────────────────────────────────────────
function PrismaticCell({ position, dims, color, label, showLabel }) {
  const [hover, setHover] = useState(false);
  const { length, width, thickness } = dims;
  return (
    <group position={position}>
      <mesh onPointerOver={() => setHover(true)} onPointerOut={() => setHover(false)}>
        <boxGeometry args={[width, thickness, length]} />
        <meshStandardMaterial color={hover ? '#ffffff' : color}
          metalness={0.25} roughness={0.4} transparent opacity={0.9} />
      </mesh>
      {showLabel && hover && label && (
        <Text position={[0, thickness / 2 + 4, 0]} fontSize={3} color="#ffffff"
          anchorX="center" anchorY="bottom">
          {label}
        </Text>
      )}
    </group>
  );
}

// ─── Single cell slot holder (circular opening + corner clips) ────────────────
function CellSlotHolder({ cellR, wall, bt, clipSize }) {
  const innerR = cellR + 0.5;
  const outerR = innerR + wall;
  // LatheGeometry rotates a 2D profile around Y → perfect hollow cylinder
  const lathePoints = useMemo(() => [
    new THREE.Vector2(innerR, -bt / 2),
    new THREE.Vector2(outerR, -bt / 2),
    new THREE.Vector2(outerR,  bt / 2),
    new THREE.Vector2(innerR,  bt / 2),
  ], [innerR, outerR, bt]);

  // Corner clips sit just inside the outer square corners
  const cornerOffset = outerR * 0.76;

  return (
    <group>
      {/* Hollow cylinder ring — circular opening matching technical drawing */}
      <mesh>
        <latheGeometry args={[lathePoints, 40]} />
        <meshStandardMaterial color="#0d1e33" metalness={0.18} roughness={0.80} />
      </mesh>

      {/* 4 corner clip posts (rotated 45°) */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], ki) => (
        <mesh
          key={ki}
          position={[sx * cornerOffset, 0, sz * cornerOffset]}
          rotation={[0, Math.PI / 4, 0]}
        >
          <boxGeometry args={[clipSize, bt * 1.1, clipSize]} />
          <meshStandardMaterial color="#1a3a5c" metalness={0.22} roughness={0.72} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Bracket holder — places CellSlotHolder at each layer boundary ────────────
function BracketHolder({ electrical, dimensions, layerConfig, selectedCell, explodeOffset }) {
  const { S, P } = electrical;
  const { layers, bracketThickness: bt, cellGap } = layerConfig;
  if (bt <= 0) return null;

  const perLayerP = dimensions.perLayerP || Math.ceil(P / layers);
  const isCyl = selectedCell.format === 'cylindrical';

  const cellH = isCyl ? selectedCell.height : selectedCell.thickness;
  const cellW = isCyl ? selectedCell.diameter : selectedCell.width;
  const cellL = isCyl ? selectedCell.diameter : selectedCell.length;

  // Radial wall thickness (1.75mm for 32.5mm cell, scales proportionally)
  const wall = Math.max(2.2, Math.min(cellW * 0.055, 5.5));
  const clipSize = wall * 1.55;

  // Cell centre XZ positions
  const cellXZ = useMemo(() => {
    return Array.from({ length: S }, (_, si) =>
      Array.from({ length: perLayerP }, (_, pi) => {
        const cx = pi * (cellW + cellGap) - (perLayerP * (cellW + cellGap) - cellGap) / 2 + cellW / 2;
        const cz = si * (cellL + cellGap) - (S * (cellL + cellGap) - cellGap) / 2 + cellL / 2;
        return [cx, cz];
      })
    ).flat();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [S, perLayerP, cellW, cellL, cellGap]);

  // Y positions: bottom plate / inter-layer plates / top plate
  const plateYs = [
    -cellH / 2 - bt / 2,
    ...Array.from({ length: layers - 1 }, (_, i) =>
      i * (cellH + bt + explodeOffset) + cellH / 2 + bt / 2
    ),
    (layers - 1) * (cellH + bt + explodeOffset) + cellH / 2 + bt / 2,
  ];

  return (
    <>
      {plateYs.map((y, pi) => (
        <group key={pi} position={[0, y, 0]}>
          {cellXZ.map(([cx, cz], ci) => (
            <group key={ci} position={[cx, 0, cz]}>
              {isCyl ? (
                <CellSlotHolder cellR={cellW / 2} wall={wall} bt={bt} clipSize={clipSize} />
              ) : (
                /* Prismatic / pouch: simple 4-bar square frame */
                <>
                  <mesh position={[0, 0, -(cellL / 2 + wall / 2)]}>
                    <boxGeometry args={[cellW + wall * 2, bt, wall]} />
                    <meshStandardMaterial color="#0d1e33" metalness={0.12} roughness={0.88} />
                  </mesh>
                  <mesh position={[0, 0, cellL / 2 + wall / 2]}>
                    <boxGeometry args={[cellW + wall * 2, bt, wall]} />
                    <meshStandardMaterial color="#0d1e33" metalness={0.12} roughness={0.88} />
                  </mesh>
                  <mesh position={[-(cellW / 2 + wall / 2), 0, 0]}>
                    <boxGeometry args={[wall, bt, cellL]} />
                    <meshStandardMaterial color="#0d1e33" metalness={0.12} roughness={0.88} />
                  </mesh>
                  <mesh position={[cellW / 2 + wall / 2, 0, 0]}>
                    <boxGeometry args={[wall, bt, cellL]} />
                    <meshStandardMaterial color="#0d1e33" metalness={0.12} roughness={0.88} />
                  </mesh>
                </>
              )}
            </group>
          ))}
        </group>
      ))}
    </>
  );
}

// ─── Cross-section plane ──────────────────────────────────────────────────────
function CrossSectionPlane({ dims }) {
  return (
    <mesh>
      <planeGeometry args={[(dims?.width ?? 200) + 30, (dims?.height ?? 200) + 30]} />
      <meshBasicMaterial color="#1a1d2e" side={THREE.DoubleSide} transparent opacity={0.88} />
    </mesh>
  );
}

// ─── Main scene ───────────────────────────────────────────────────────────────
function BatteryScene() {
  const { selectedCell, results, layerConfig, visualizer } = useBatteryStore();
  const { electrical, dimensions } = results;
  const { showBrackets, showLabels, explodedView, crossSection } = visualizer;
  const explodeOffset = explodedView ? 32 : 0;

  const cells = useMemo(() => {
    if (!electrical || !dimensions || !selectedCell) return [];
    const { S, P } = electrical;
    const { layers, bracketThickness: bt, cellGap } = layerConfig;
    const perLayerP = dimensions.perLayerP || Math.ceil(P / layers);
    const isVert = layerConfig.orientation === 'vertical';
    const items = [];

    for (let li = 0; li < layers; li++) {
      const count = li === layers - 1
        ? Math.max(1, P - perLayerP * (layers - 1))
        : perLayerP;

      for (let si = 0; si < S; si++) {
        for (let pi = 0; pi < count; pi++) {
          let x, y, z;
          if (selectedCell.format === 'cylindrical') {
            const r = selectedCell.diameter / 2;
            const h = selectedCell.height;
            if (isVert) {
              x = pi * (selectedCell.diameter + cellGap) - (count * (selectedCell.diameter + cellGap) - cellGap) / 2 + r;
              z = si * (selectedCell.diameter + cellGap) - (S     * (selectedCell.diameter + cellGap) - cellGap) / 2 + r;
              y = li * (h + bt + explodeOffset);
            } else {
              x = pi * (h + cellGap) - (count * (h + cellGap) - cellGap) / 2 + h / 2;
              z = si * (selectedCell.diameter + cellGap) - (S * (selectedCell.diameter + cellGap) - cellGap) / 2 + r;
              y = li * (selectedCell.diameter + bt + explodeOffset);
            }
          } else {
            const { length: cl, width: cw, thickness: ct } = selectedCell;
            x = pi * (cw + cellGap) - (count * (cw + cellGap) - cellGap) / 2 + cw / 2;
            z = si * (cl + cellGap) - (S * (cl + cellGap) - cellGap) / 2 + cl / 2;
            y = li * (ct + bt + explodeOffset);
          }
          items.push({
            key: `${li}-${si}-${pi}`,
            position: [x, y, z],
            seriesIdx: si,
            label: `S${si + 1}P${li * perLayerP + pi + 1}`,
          });
        }
      }
    }
    return items;
  }, [electrical, dimensions, selectedCell, layerConfig, explodeOffset]);

  // Vertically center the whole assembly
  const groupOffsetY = useMemo(() => {
    if (!electrical || !selectedCell) return 0;
    const { layers, bracketThickness: bt } = layerConfig;
    const cellH = selectedCell.format === 'cylindrical' ? selectedCell.height : selectedCell.thickness;
    return -((layers - 1) * (cellH + bt + explodeOffset)) / 2;
  }, [electrical, selectedCell, layerConfig, explodeOffset]);

  if (!cells.length || !selectedCell) return null;

  const visibleCells = crossSection ? cells.filter((c) => c.position[0] >= 0) : cells;

  return (
    <group position={[0, groupOffsetY, 0]}>
      {visibleCells.map((cell) => {
        const color = SERIES_COLORS[cell.seriesIdx % SERIES_COLORS.length];
        if (selectedCell.format === 'cylindrical') {
          const isHoriz = layerConfig.orientation === 'horizontal';
          return (
            <group key={cell.key} rotation={isHoriz ? [0, 0, Math.PI / 2] : [0, 0, 0]}>
              <CylindricalCell
                position={cell.position}
                radius={selectedCell.diameter / 2}
                height={selectedCell.height}
                color={color} label={cell.label} showLabel={showLabels}
              />
            </group>
          );
        }
        return (
          <PrismaticCell
            key={cell.key} position={cell.position} dims={selectedCell}
            color={color} label={cell.label} showLabel={showLabels}
          />
        );
      })}

      {showBrackets && electrical && dimensions && (
        <BracketHolder
          electrical={electrical} dimensions={dimensions}
          layerConfig={layerConfig} selectedCell={selectedCell}
          explodeOffset={explodeOffset}
        />
      )}

      {crossSection && <CrossSectionPlane dims={dimensions?.withBracket} />}
    </group>
  );
}

// ─── Controls overlay ─────────────────────────────────────────────────────────
function Controls() {
  const { updateVisualizer, visualizer, language } = useBatteryStore();
  const t = useT(language);
  const buttons = [
    { key: 'showBrackets', label: t.brackets },
    { key: 'showLabels',   label: t.labels },
    { key: 'explodedView', label: t.exploded },
    { key: 'crossSection', label: t.crossSection },
  ];
  return (
    <div className="absolute top-3 left-3 flex gap-1.5 z-10 flex-wrap">
      {buttons.map(({ key, label }) => (
        <button key={key}
          onClick={() => updateVisualizer({ [key]: !visualizer[key] })}
          className={`text-xs px-2.5 py-1 rounded border transition-colors ${
            visualizer[key]
              ? 'border-accent bg-accent/20 text-accent'
              : 'border-border bg-panel/80 text-text-dim hover:border-accent/40'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function Visualizer3D() {
  const { results, language } = useBatteryStore((s) => ({
    results: s.results, language: s.language,
  }));
  const t = useT(language);
  const electrical = results?.electrical;

  return (
    <div className="relative w-full h-full bg-bg rounded-lg overflow-hidden border border-border">
      <Controls />

      {electrical && (
        <div className="absolute top-3 right-3 z-10 bg-panel/90 border border-border rounded px-3 py-1 text-xs font-mono">
          <span className="text-accent">{electrical.S}S{electrical.P}P</span>
          <span className="text-text-dim ml-2">{electrical.totalCells} {t.cells}</span>
        </div>
      )}

      <Canvas
        camera={{ position: [160, 130, 210], fov: 44 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#0f1117' }}
      >
        <ambientLight intensity={0.65} />
        <directionalLight position={[120, 220, 160]} intensity={1.3} castShadow />
        <directionalLight position={[-120, -60, -100]} intensity={0.3} color="#4488ff" />
        <pointLight position={[0, 250, 0]} intensity={0.45} color="#00d4ff" />

        <gridHelper args={[600, 60, '#151c2c', '#151c2c']} position={[0, -90, 0]} />

        <BatteryScene />

        <OrbitControls enablePan enableZoom enableRotate
          minDistance={40} maxDistance={900}
          dampingFactor={0.08} enableDamping
        />
      </Canvas>

      {(!electrical || electrical.totalCells === 0) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-text-dim">
            <div className="text-5xl mb-3 opacity-20">⚡</div>
            <div className="text-sm">{t.configurePack}</div>
          </div>
        </div>
      )}
    </div>
  );
}
