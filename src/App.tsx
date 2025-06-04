import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion, useScroll, useTransform } from 'framer-motion';
import gsap from 'gsap';

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  color: white;
  overflow-x: hidden;
`;

const Hero = styled.div`
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
`;

const BigNumber = styled(motion.div)`
  font-size: 25vw;
  font-weight: 900;
  background: linear-gradient(45deg, #FF6B6B, #4ECDC4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  position: relative;
  cursor: pointer;
`;

const FloatingShape = styled(motion.div)<{ size: number; color: string }>`
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  background: ${props => props.color};
  border-radius: 50%;
  position: absolute;
  filter: blur(10px);
  opacity: 0.5;
`;

const ContentSection = styled(motion.div)`
  padding: 100px 20px;
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
`;

const Title = styled(motion.h2)`
  font-size: 2.5rem;
  margin-bottom: 2rem;
  background: linear-gradient(45deg, #4ECDC4, #FF6B6B);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Text = styled(motion.p)`
  font-size: 1.2rem;
  line-height: 1.6;
  color: #e0e0e0;
  margin-bottom: 2rem;
`;

const InteractiveCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 2rem;
  border-radius: 20px;
  margin: 2rem 0;
  cursor: pointer;
`;

function App() {
  const { scrollYProgress } = useScroll();
  const numberRef = useRef<HTMLDivElement>(null);
  
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  useEffect(() => {
    if (numberRef.current) {
      const timeline = gsap.timeline({ repeat: -1 });
      timeline.to(numberRef.current, {
        duration: 2,
        scale: 1.1,
        ease: "power1.inOut"
      }).to(numberRef.current, {
        duration: 2,
        scale: 1,
        ease: "power1.inOut"
      });
    }
  }, []);

  const shapes = Array.from({ length: 5 }).map((_, i) => ({
    size: Math.random() * 100 + 50,
    color: `hsl(${Math.random() * 360}, 70%, 50%)`,
    initialX: Math.random() * window.innerWidth,
    initialY: Math.random() * window.innerHeight,
  }));

  return (
    <AppContainer>
      <Hero>
        {shapes.map((shape, i) => (
          <FloatingShape
            key={i}
            size={shape.size}
            color={shape.color}
            initial={{ x: shape.initialX, y: shape.initialY }}
            animate={{
              x: [shape.initialX - 100, shape.initialX + 100],
              y: [shape.initialY - 100, shape.initialY + 100],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          />
        ))}
        <BigNumber
          ref={numberRef}
          style={{ y, opacity }}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
        >
          37
        </BigNumber>
      </Hero>

      <ContentSection
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <Title>Discover the Magic of 37</Title>
        <Text>
          A unique prime number that holds mysteries and mathematical wonders.
          Let's explore its fascinating properties and hidden meanings.
        </Text>

        <InteractiveCard
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <h3>Did you know?</h3>
          <p>37 is a prime number that creates fascinating patterns when multiplied.</p>
        </InteractiveCard>
      </ContentSection>
    </AppContainer>
  );
}

export default App;
