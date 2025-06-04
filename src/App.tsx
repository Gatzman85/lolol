import React, { useEffect, useRef, useState, useMemo, Suspense } from 'react';
import styled from 'styled-components';
import { motion, useScroll, useTransform, useMotionValue } from 'framer-motion';
import gsap from 'gsap';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text3D, Float, Sparkles, Stars, Center, MeshTransmissionMaterial, ContactShadows } from '@react-three/drei';
import { EffectComposer as PostProcessing, Bloom as BloomPost, Vignette as VignettePost } from '@react-three/postprocessing';
import * as THREE from 'three';

const AppContainer = styled.div`
  min-height: 100vh;
  background: radial-gradient(ellipse at center, #0a0a0a 0%, #1a0033 25%, #000000 70%);
  color: white;
  overflow: hidden;
  position: relative;
`;

const CanvasContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
`;

const UIOverlay = styled.div`
  position: relative;
  z-index: 2;
  pointer-events: none;
  width: 100%;
  height: 100vh;
`;

const ParticleCanvas = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  background: radial-gradient(ellipse at center, transparent 0%, rgba(138, 43, 226, 0.1) 50%, rgba(255, 0, 150, 0.1) 100%);
`;

const Hero = styled.div`
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  pointer-events: auto;
`;

const BigNumber = styled(motion.div)`
  font-size: 25vw;
  font-weight: 900;
  background: linear-gradient(45deg, #ff0080, #8a2be2, #00ffff, #ff6b6b);
  background-size: 400% 400%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  position: relative;
  cursor: pointer;
  filter: drop-shadow(0 0 30px rgba(255, 0, 128, 0.8)) drop-shadow(0 0 60px rgba(138, 43, 226, 0.6));
  animation: gradientShift 3s ease-in-out infinite;
  
  @keyframes gradientShift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
`;

const FloatingShape = styled(motion.div)<{ size: number; color: string }>`
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  background: ${props => props.color};
  border-radius: 50%;
  position: absolute;
  filter: blur(15px);
  opacity: 0.7;
  box-shadow: 0 0 50px ${props => props.color}, 0 0 100px ${props => props.color};
`;

const MagicParticle = styled(motion.div)<{ x: number; y: number; delay: number }>`
  position: fixed;
  width: 4px;
  height: 4px;
  background: radial-gradient(circle, #fff 0%, #8a2be2 50%, transparent 100%);
  border-radius: 50%;
  pointer-events: none;
  box-shadow: 0 0 10px #8a2be2, 0 0 20px #ff0080;
`;

const RippleEffect = styled(motion.div)`
  position: fixed;
  border: 2px solid rgba(255, 0, 128, 0.6);
  border-radius: 50%;
  pointer-events: none;
`;

const AwesomeText = styled(motion.div)`
  position: fixed;
  font-size: 4rem;
  font-weight: 900;
  pointer-events: none;
  z-index: 1000;
  background: linear-gradient(45deg, #ff0080, #00ffff, #8a2be2, #ff6b6b);
  background-size: 400% 400%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 30px rgba(255, 0, 128, 0.8), 0 0 60px rgba(138, 43, 226, 0.6);
  filter: drop-shadow(0 0 20px rgba(0, 255, 255, 0.8));
  animation: textGradientShift 2s ease-in-out infinite;
  white-space: nowrap;
  transform-origin: center;
  
  @keyframes textGradientShift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
`;

const ContentSection = styled(motion.div)`
  padding: 100px 20px;
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
  pointer-events: auto;
`;

const Title = styled(motion.h2)`
  font-size: 2.5rem;
  margin-bottom: 2rem;
  background: linear-gradient(45deg, #00ffff, #ff0080, #8a2be2);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradientShift 2s ease-in-out infinite;
  text-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
`;

const Text = styled(motion.p)`
  font-size: 1.2rem;
  line-height: 1.6;
  color: #e0e0e0;
  margin-bottom: 2rem;
  text-shadow: 0 0 10px rgba(224, 224, 224, 0.3);
`;

const InteractiveCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  padding: 2rem;
  border-radius: 20px;
  margin: 2rem 0;
  cursor: pointer;
  border: 1px solid rgba(255, 0, 128, 0.3);
  box-shadow: 0 8px 32px rgba(138, 43, 226, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 0, 128, 0.2), transparent);
    transition: left 0.5s;
  }
  
  &:hover::before {
    left: 100%;
  }
`;

// 3D Number Component
function Floating3DNumber() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const { viewport } = useThree();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.3;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.5;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <Center>
        <Text3D
          ref={meshRef}
          font="/fonts/helvetiker_bold.typeface.json"
          size={viewport.width > 10 ? 8 : 4}
          height={1}
          curveSegments={12}
          bevelEnabled
          bevelThickness={0.1}
          bevelSize={0.02}
          bevelOffset={0}
          bevelSegments={5}
        >
          37
          <MeshTransmissionMaterial
            backside
            samples={16}
            thickness={3}
            chromaticAberration={0.1}
            anisotropy={0.5}
            distortion={0.5}
            distortionScale={0.3}
            temporalDistortion={0.2}
            iridescence={1}
            iridescenceIOR={1}
            iridescenceThicknessRange={[0, 1400]}
            color="#8a2be2"
          />
        </Text3D>
      </Center>
    </Float>
  );
}

// Optimized Particle System Component
function ParticleSystem() {
  const points = useRef<THREE.Points>(null!);
  const particleCount = 500; // Reduced from 2000
  
  const positions = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30; // Reduced range
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    return positions;
  }, []);

  useFrame((state) => {
    if (points.current) {
      points.current.rotation.x = state.clock.elapsedTime * 0.02; // Slower rotation
      points.current.rotation.y = state.clock.elapsedTime * 0.03;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial size={0.15} color="#8a2be2" transparent opacity={0.4} />
    </points>
  );
}

// Simplified Geometry Component
function MorphingGeometry() {
  const meshRef = useRef<THREE.Mesh>(null!);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.1; // Slower
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.15;
      meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.2); // Slower, smaller scale
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -8]}>
      <icosahedronGeometry args={[1.5, 2]} /> {/* Simpler geometry */}
      <meshBasicMaterial
        color="#ff0080" 
        wireframe 
        transparent 
        opacity={0.2}
      />
    </mesh>
  );
}

// Optimized Mouse Particles
function MouseParticles() {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    life: number;
  }>>([]);
  
  const lastMouseTime = useRef(0);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastMouseTime.current < 50) return; // Throttle to every 50ms
      lastMouseTime.current = now;
      
      const newParticle = {
        id: now + Math.random(),
        x: e.clientX,
        y: e.clientY,
        life: 1
      };
      
      setParticles(prev => [...prev, newParticle].slice(-8)); // Reduced from 20
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev => 
        prev.map(p => ({ ...p, life: p.life - 0.05 })) // Faster decay
            .filter(p => p.life > 0)
      );
    }, 32); // Reduced frequency
    
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {particles.map(particle => (
        <MagicParticle
          key={particle.id}
          x={particle.x}
          y={particle.y}
          delay={0}
          initial={{ opacity: 1, scale: 1 }}
          animate={{ 
            opacity: particle.life,
            scale: particle.life * 1.5, // Reduced scale
            y: particle.y - (1 - particle.life) * 50 // Reduced movement
          }}
          style={{
            left: particle.x,
            top: particle.y,
            opacity: particle.life
          }}
        />
      ))}
    </>
  );
}

function App() {
  const { scrollYProgress } = useScroll();
  const numberRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [ripples, setRipples] = useState<Array<{
    id: number;
    x: number;
    y: number;
  }>>([]);
  
  const [awesomeTexts, setAwesomeTexts] = useState<Array<{
    id: number;
    x: number;
    y: number;
  }>>([]);
  
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const rotateX = useTransform(mouseY, [0, window.innerHeight], [5, -5]);
  const rotateY = useTransform(mouseX, [0, window.innerWidth], [-5, 5]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    
    const handleClick = (e: MouseEvent) => {
      const newRipple = {
        id: Date.now(),
        x: e.clientX,
        y: e.clientY
      };
      setRipples(prev => [...prev, newRipple]);
      
      const newAwesomeText = {
        id: Date.now() + Math.random(),
        x: e.clientX,
        y: e.clientY
      };
      setAwesomeTexts(prev => [...prev, newAwesomeText]);
      
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 1000);
      
      setTimeout(() => {
        setAwesomeTexts(prev => prev.filter(t => t.id !== newAwesomeText.id));
      }, 3000);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
    };
  }, [mouseX, mouseY]);

  useEffect(() => {
    if (numberRef.current) {
      const timeline = gsap.timeline({ repeat: -1 });
      timeline
        .to(numberRef.current, {
          duration: 3,
          scale: 1.1,
          ease: "power2.inOut"
        })
        .to(numberRef.current, {
          duration: 3,
          scale: 1,
          ease: "power2.inOut"
        });
    }
  }, []);

  const shapes = useMemo(() => 
    Array.from({ length: 6 }).map((_, index) => ({ // Reduced from 12
      size: Math.random() * 60 + 20, // Smaller sizes
      color: `hsl(${280 + Math.random() * 80}, 70%, 50%)`,
      initialX: Math.random() * window.innerWidth,
      initialY: Math.random() * window.innerHeight,
      index
    })), []
  );

  return (
    <AppContainer>
      <ParticleCanvas />
      
      <CanvasContainer>
        <Canvas camera={{ position: [0, 0, 15], fov: 60 }}>
          <Suspense fallback={null}>
            <ambientLight intensity={0.3} />
            <pointLight position={[10, 10, 10]} intensity={0.8} color="#8a2be2" />
            <pointLight position={[-10, -10, 10]} intensity={0.4} color="#ff0080" />
            
            <Floating3DNumber />
            <ParticleSystem />
            <MorphingGeometry />
            
            <Sparkles count={150} scale={15} size={1.5} speed={0.3} color="#8a2be2" />
            <Stars radius={30} depth={30} count={800} factor={3} saturation={0} fade />
            
            <ContactShadows 
              resolution={512} 
              frames={1} 
              position={[0, -6, 0]} 
              scale={15} 
              blur={2} 
              opacity={0.2} 
              far={15} 
            />
          </Suspense>
          
          <PostProcessing>
            <BloomPost intensity={1.2} luminanceThreshold={0.3} luminanceSmoothing={0.7} />
            <VignettePost eskil={false} offset={0.2} darkness={0.6} />
          </PostProcessing>
        </Canvas>
      </CanvasContainer>

      <UIOverlay>
        <MouseParticles />
        
        {ripples.map(ripple => (
          <RippleEffect
            key={ripple.id}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 20, opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              left: ripple.x - 25,
              top: ripple.y - 25,
              width: 50,
              height: 50
            }}
          />
        ))}
        
        {awesomeTexts.map(text => (
          <AwesomeText
            key={text.id}
            initial={{ 
              scale: 0,
              opacity: 0,
              rotateZ: -180,
              y: 0
            }}
            animate={{ 
              scale: [0, 1.2, 1],
              opacity: [0, 1, 1, 0],
              rotateZ: [180, 0, 0],
              y: [0, -100, -150]
            }}
            transition={{ 
              duration: 3,
              times: [0, 0.3, 0.7, 1],
              ease: ["easeOut", "easeInOut", "easeIn"],
              type: "spring",
              stiffness: 100
            }}
            style={{
              left: text.x - 200,
              top: text.y - 40
            }}
          >
            JP IS AWESOME
          </AwesomeText>
        ))}
        
        <Hero>
          {shapes.map((shape) => (
            <FloatingShape
              key={shape.index}
              size={shape.size}
              color={shape.color}
              initial={{ x: shape.initialX, y: shape.initialY }}
              animate={{
                x: [shape.initialX - 100, shape.initialX + 100],
                y: [shape.initialY - 100, shape.initialY + 100],
                rotate: [0, 180],
              }}
              transition={{
                duration: 20 + shape.index * 2,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
            />
          ))}
          <BigNumber
            ref={numberRef}
            style={{ 
              y, 
              opacity,
              rotateX,
              rotateY,
              perspective: 1000
            }}
            whileHover={{ 
              scale: 1.3,
              rotateY: 15,
              rotateX: 5,
              textShadow: "0 0 50px rgba(255, 0, 128, 0.8)"
            }}
            whileTap={{ scale: 0.8 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
          >
            37
          </BigNumber>
        </Hero>

        <ContentSection
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.3 }}
        >
          <Title
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            Discover the Magic of 37
          </Title>
          <Text
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.7 }}
          >
            A unique prime number that transcends dimensions, creates reality-bending visual effects,
            and opens portals to mathematical wonderlands beyond imagination.
          </Text>

          <InteractiveCard
            whileHover={{ 
              scale: 1.08,
              rotateY: 5,
              boxShadow: "0 20px 60px rgba(138, 43, 226, 0.4)"
            }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300 }}
            initial={{ opacity: 0, rotateX: 45 }}
            whileInView={{ opacity: 1, rotateX: 0 }}
          >
            <h3>Did you know?</h3>
            <p>37 creates impossible geometries and defies the laws of visual physics in this dimension.</p>
          </InteractiveCard>
        </ContentSection>
      </UIOverlay>
    </AppContainer>
  );
}

export default App;
