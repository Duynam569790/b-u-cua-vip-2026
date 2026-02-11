import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox, Text } from "@react-three/drei";
import * as THREE from "three";
import { SymbolType, symbols } from "./Dice";

interface Dice3DBoxProps {
  isRolling: boolean;
  result: SymbolType;
  index: number;
}

const Dice3DBox = ({ isRolling, result, index }: Dice3DBoxProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const targetRotation = useRef({ x: 0, y: 0, z: 0 });
  const symbol = symbols[result];

  // Generate target rotation that shows front face correctly oriented
  useMemo(() => {
    if (!isRolling) {
      // Keep front face visible with slight random tilt for variety
      targetRotation.current = {
        x: (Math.random() - 0.5) * 0.3, // Small tilt up/down
        y: (Math.random() - 0.5) * 0.3, // Small tilt left/right
        z: 0, // No rotation on z-axis to keep emoji upright
      };
    }
  }, [result, isRolling]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    if (isRolling) {
      // Spin rapidly when rolling
      meshRef.current.rotation.x += delta * (8 + index * 2);
      meshRef.current.rotation.y += delta * (10 + index * 3);
      meshRef.current.rotation.z += delta * (6 + index);
    } else {
      // Smoothly interpolate to target rotation
      meshRef.current.rotation.x = THREE.MathUtils.lerp(
        meshRef.current.rotation.x,
        targetRotation.current.x,
        delta * 5
      );
      meshRef.current.rotation.y = THREE.MathUtils.lerp(
        meshRef.current.rotation.y,
        targetRotation.current.y,
        delta * 5
      );
      meshRef.current.rotation.z = THREE.MathUtils.lerp(
        meshRef.current.rotation.z,
        targetRotation.current.z,
        delta * 5
      );
    }
  });

  const colorMap: Record<SymbolType, string> = {
    bau: "#22c55e",
    cua: "#ef4444",
    ca: "#3b82f6",
    ga: "#eab308",
    tom: "#f97316",
    nai: "#d97706",
  };

  return (
    <mesh ref={meshRef} position={[(index - 1) * 2.5, 0, 0]} castShadow>
      <RoundedBox args={[1.8, 1.8, 1.8]} radius={0.15} smoothness={4}>
        <meshStandardMaterial color={colorMap[result]} />
      </RoundedBox>
      {/* Emoji on each face */}
      {[
        { pos: [0, 0, 0.92] as [number, number, number], rot: [0, 0, 0] as [number, number, number] },
        { pos: [0, 0, -0.92] as [number, number, number], rot: [0, Math.PI, 0] as [number, number, number] },
        { pos: [0.92, 0, 0] as [number, number, number], rot: [0, Math.PI / 2, 0] as [number, number, number] },
        { pos: [-0.92, 0, 0] as [number, number, number], rot: [0, -Math.PI / 2, 0] as [number, number, number] },
        { pos: [0, 0.92, 0] as [number, number, number], rot: [-Math.PI / 2, 0, 0] as [number, number, number] },
        { pos: [0, -0.92, 0] as [number, number, number], rot: [Math.PI / 2, 0, 0] as [number, number, number] },
      ].map((face, i) => (
        <Text
          key={i}
          position={face.pos}
          rotation={face.rot}
          fontSize={0.8}
          anchorX="center"
          anchorY="middle"
        >
          {symbol.emoji}
        </Text>
      ))}
    </mesh>
  );
};

interface Dice3DProps {
  results: SymbolType[];
  isRolling: boolean;
}

export const Dice3D = ({ results, isRolling }: Dice3DProps) => {
  return (
    <div className="w-full h-48 md:h-64">
      <Canvas camera={{ position: [0, 2, 8], fov: 45 }} shadows>
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-far={20}
          shadow-camera-near={0.5}
          shadow-camera-left={-6}
          shadow-camera-right={6}
          shadow-camera-top={6}
          shadow-camera-bottom={-6}
        />
        <directionalLight position={[-5, -5, -5]} intensity={0.2} />
        <pointLight position={[0, 5, 0]} intensity={0.4} />
        
        {/* Shadow-receiving ground plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <shadowMaterial opacity={0.3} />
        </mesh>
        
        {results.map((result, index) => (
          <Dice3DBox
            key={index}
            result={result}
            isRolling={isRolling}
            index={index}
          />
        ))}
      </Canvas>
    </div>
  );
};
