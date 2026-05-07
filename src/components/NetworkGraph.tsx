'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import * as THREE from 'three';

// ── "GOD LEVEL DATA CONSTELLATION" ───────────────────────────────
// Deep, immersive, heavy particle field

function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  
  const particleCount = 200;
  
  // Generate random positions on a large sphere
  const [positions, connections] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const nodes: THREE.Vector3[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      // Math.random() distribution
      const r = 5 + Math.random() * 3;
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      
      nodes.push(new THREE.Vector3(x, y, z));
    }
    
    // Connect nodes that are close to each other
    const linePos: number[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dist = nodes[i].distanceTo(nodes[j]);
        if (dist < 2.5) { // Threshold for connection
          linePos.push(
            nodes[i].x, nodes[i].y, nodes[i].z,
            nodes[j].x, nodes[j].y, nodes[j].z
          );
        }
      }
    }
    
    const lines = new Float32Array(linePos);
    return [pos, lines];
  }, []);

  useFrame(({ clock, pointer }) => {
    if (!pointsRef.current || !linesRef.current) return;
    const t = clock.getElapsedTime();
    
    // Slow, god-like rotation
    const rotX = t * 0.05 + pointer.y * 0.1;
    const rotY = t * 0.08 + pointer.x * 0.1;
    
    pointsRef.current.rotation.x = rotX;
    pointsRef.current.rotation.y = rotY;
    linesRef.current.rotation.x = rotX;
    linesRef.current.rotation.y = rotY;
  });

  return (
    <group>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.06} color="#c4b5fd" transparent opacity={0.8} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[connections, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#7c3aed" transparent opacity={0.15} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>
    </group>
  );
}

function CoreGlow() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const scale = 1 + Math.sin(clock.getElapsedTime()) * 0.05;
    meshRef.current.scale.set(scale, scale, scale);
  });
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2.5, 64, 64]} />
      <meshBasicMaterial color="#4c1d95" transparent opacity={0.05} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
}

export default function NetworkGraph() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Deep, premium backdrop glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 50% 50%, rgba(91,33,182,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        dpr={[1, 2]} // High res for premium feel
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <CoreGlow />
        <ParticleField />
        <Preload all />
      </Canvas>
      
      {/* Vignette to blend into the black background seamlessly */}
      <div style={{
        position: 'absolute', inset: 0,
        boxShadow: 'inset 0 0 100px 50px #000000',
        pointerEvents: 'none',
      }} />
    </div>
  );
}
