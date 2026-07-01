import * as THREE from 'three';
import { useEffect, useRef, useState } from 'react';

interface Level1Props {
  onComplete?: () => void;
}

export default function Level1({ onComplete }: Level1Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const airplaneGroupRef = useRef<THREE.Group | null>(null);
  const playerGroupRef = useRef<THREE.Group | null>(null);
  const parachuteGroupRef = useRef<THREE.Group | null>(null);
  const cloudParticlesRef = useRef<THREE.Mesh[]>([]);
  
  const [playerAltitude, setPlayerAltitude] = useState(800);
  const [isJumping, setIsJumping] = useState(false);
  const [parachuteOpen, setParachuteOpen] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [task1Correct, setTask1Correct] = useState(false);
  const [task2Correct, setTask2Correct] = useState(false);
  const [feedback, setFeedback] = useState<{text: string, type: 'success' | 'error' | 'info'}>({text: '等待作答...', type: 'info'});
  
  const playerAltitudeRef = useRef(800);
  const answer1Ref = useRef<HTMLInputElement>(null);
  const answer2Ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.002);

    const camera = new THREE.PerspectiveCamera(60, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 3000);
    camera.position.set(-50, 400, 600);
    camera.lookAt(0, 200, 0);
    const cameraRef = { current: camera };

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', alpha: false });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    renderer.localClippingEnabled = true;
    containerRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffdfba, 1.5);
    directionalLight.position.set(200, 600, 300);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 4096;
    directionalLight.shadow.mapSize.height = 4096;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 2000;
    directionalLight.shadow.camera.left = -500;
    directionalLight.shadow.camera.right = 500;
    directionalLight.shadow.camera.top = 500;
    directionalLight.shadow.camera.bottom = -500;
    directionalLight.shadow.bias = -0.0001;
    scene.add(directionalLight);
    scene.add(new THREE.HemisphereLight(0x87ceeb, 0x3d5c3d, 0.7));

    // Ground with better texture
    const groundGeometry = new THREE.PlaneGeometry(2000, 2000, 120, 120);
    const colors: number[] = [];
    const positions = groundGeometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      const noise = Math.sin(positions[i] * 0.01) * Math.cos(positions[i + 1] * 0.01) * 0.15;
      positions[i + 2] += noise * 5;
      const grassColor = 0.25 + noise * 0.3;
      colors.push(grassColor, 0.55 + noise * 0.4, 0.25);
    }
    groundGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    groundGeometry.computeVertexNormals();
    const ground = new THREE.Mesh(groundGeometry, new THREE.MeshStandardMaterial({ 
      vertexColors: true, 
      roughness: 0.8,
      metalness: 0.1
    }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -5;
    ground.receiveShadow = true;
    scene.add(ground);

    // Sea with animation
    const seaGeometry = new THREE.PlaneGeometry(2000, 2000, 50, 50);
    const sea = new THREE.Mesh(seaGeometry, new THREE.MeshStandardMaterial({ 
      color: 0x1e90ff, 
      transparent: true, 
      opacity: 0.5, 
      metalness: 0.9,
      roughness: 0.2,
      side: THREE.DoubleSide
    }));
    sea.rotation.x = -Math.PI / 2;
    sea.position.y = 0;
    scene.add(sea);

    // Enhanced Airplane with more details
    const airplaneGroup = new THREE.Group();
    
    // Fuselage with gradient
    const fuselage = new THREE.Mesh(
      new THREE.CylinderGeometry(8, 8, 50, 24),
      new THREE.MeshStandardMaterial({ 
        color: 0xff6347, 
        roughness: 0.25, 
        metalness: 0.8,
        envMapIntensity: 1.0
      })
    );
    fuselage.rotation.z = Math.PI / 2;
    fuselage.castShadow = true;
    airplaneGroup.add(fuselage);
    
    // Cockpit windows
    const cockpit = new THREE.Mesh(
      new THREE.BoxGeometry(12, 6, 8),
      new THREE.MeshStandardMaterial({ 
        color: 0x4fc3f7, 
        transparent: true, 
        opacity: 0.85,
        roughness: 0.1,
        metalness: 0.9
      })
    );
    cockpit.position.set(18, 6, 0);
    airplaneGroup.add(cockpit);
    
    // Main wings
    const wings = new THREE.Mesh(
      new THREE.BoxGeometry(15, 2.5, 70),
      new THREE.MeshStandardMaterial({ 
        color: 0xcd5c5c, 
        roughness: 0.3, 
        metalness: 0.75 
      })
    );
    wings.castShadow = true;
    airplaneGroup.add(wings);
    
    // Tail wing
    const tailWing = new THREE.Mesh(
      new THREE.BoxGeometry(12, 2.5, 25),
      new THREE.MeshStandardMaterial({ color: 0xcd5c5c, roughness: 0.3, metalness: 0.75 })
    );
    tailWing.position.set(-20, 8, 0);
    tailWing.castShadow = true;
    airplaneGroup.add(tailWing);
    
    // Vertical stabilizer
    const verticalStab = new THREE.Mesh(
      new THREE.BoxGeometry(8, 15, 2.5),
      new THREE.MeshStandardMaterial({ color: 0xcd5c5c, roughness: 0.3, metalness: 0.75 })
    );
    verticalStab.position.set(-20, 12, 0);
    verticalStab.castShadow = true;
    airplaneGroup.add(verticalStab);
    
    // Engine props
    const propeller = new THREE.Mesh(
      new THREE.BoxGeometry(2, 20, 2),
      new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9 })
    );
    propeller.position.set(25, 0, 0);
    airplaneGroup.add(propeller);
    
    airplaneGroup.position.set(-300, 800, 0);
    scene.add(airplaneGroup);
    airplaneGroupRef.current = airplaneGroup;

    // Enhanced Player character
    const playerGroup = new THREE.Group();
    
    // Body with backpack
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(5, 14, 12, 20),
      new THREE.MeshStandardMaterial({ 
        color: 0xffd700, 
        roughness: 0.4,
        metalness: 0.3
      })
    );
    body.castShadow = true;
    playerGroup.add(body);
    
    // Backpack
    const backpack = new THREE.Mesh(
      new THREE.BoxGeometry(6, 10, 4),
      new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.6 })
    );
    backpack.position.set(0, 2, -5);
    backpack.castShadow = true;
    playerGroup.add(backpack);
    
    // Head with helmet
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(6, 20, 20),
      new THREE.MeshStandardMaterial({ color: 0xffccaa, roughness: 0.5 })
    );
    head.position.y = 11;
    head.castShadow = true;
    playerGroup.add(head);
    
    // Helmet
    const helmet = new THREE.Mesh(
      new THREE.SphereGeometry(6.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2.2),
      new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.3, metalness: 0.6 })
    );
    helmet.position.y = 12;
    helmet.castShadow = true;
    playerGroup.add(helmet);
    
    // Arms
    const leftArm = new THREE.Mesh(
      new THREE.CapsuleGeometry(2, 8, 8, 12),
      new THREE.MeshStandardMaterial({ color: 0xffd700 })
    );
    leftArm.position.set(-7, 5, 0);
    leftArm.rotation.z = 0.3;
    leftArm.castShadow = true;
    playerGroup.add(leftArm);
    
    const rightArm = new THREE.Mesh(
      new THREE.CapsuleGeometry(2, 8, 8, 12),
      new THREE.MeshStandardMaterial({ color: 0xffd700 })
    );
    rightArm.position.set(7, 5, 0);
    rightArm.rotation.z = -0.3;
    rightArm.castShadow = true;
    playerGroup.add(rightArm);
    
    // Legs
    const leftLeg = new THREE.Mesh(
      new THREE.CapsuleGeometry(2.5, 10, 8, 12),
      new THREE.MeshStandardMaterial({ color: 0x2c3e50 })
    );
    leftLeg.position.set(-3, -9, 0);
    leftLeg.castShadow = true;
    playerGroup.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(
      new THREE.CapsuleGeometry(2.5, 10, 8, 12),
      new THREE.MeshStandardMaterial({ color: 0x2c3e50 })
    );
    rightLeg.position.set(3, -9, 0);
    rightLeg.castShadow = true;
    playerGroup.add(rightLeg);
    
    playerGroup.position.set(-300, 800, 20);
    scene.add(playerGroup);
    playerGroupRef.current = playerGroup;

    // Enhanced Mountains with multiple peaks
    const mountainGroup = new THREE.Group();
    
    // Main mountain
    const mainMountain = new THREE.Mesh(
      new THREE.ConeGeometry(120, 140, 8, 1),
      new THREE.MeshStandardMaterial({ 
        color: 0x8b4513, 
        roughness: 0.9,
        flatShading: true
      })
    );
    mainMountain.position.set(350, 65, 0);
    mainMountain.castShadow = true;
    mainMountain.receiveShadow = true;
    mountainGroup.add(mainMountain);
    
    // Snow cap
    const snowCap = new THREE.Mesh(
      new THREE.ConeGeometry(50, 40, 8, 1),
      new THREE.MeshStandardMaterial({ 
        color: 0xffffff, 
        flatShading: true,
        roughness: 0.95
      })
    );
    snowCap.position.set(350, 130, 0);
    mountainGroup.add(snowCap);
    
    // Secondary peak
    const secondaryMountain = new THREE.Mesh(
      new THREE.ConeGeometry(80, 100, 8, 1),
      new THREE.MeshStandardMaterial({ 
        color: 0xa0522d, 
        roughness: 0.9,
        flatShading: true
      })
    );
    secondaryMountain.position.set(450, 45, 50);
    secondaryMountain.castShadow = true;
    secondaryMountain.receiveShadow = true;
    mountainGroup.add(secondaryMountain);
    
    const secondarySnow = new THREE.Mesh(
      new THREE.ConeGeometry(35, 30, 8, 1),
      new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true })
    );
    secondarySnow.position.set(450, 105, 50);
    mountainGroup.add(secondarySnow);
    
    scene.add(mountainGroup);

    // Enhanced Clouds with multiple spheres
    const cloudMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffffff, 
      transparent: true, 
      opacity: 0.7, 
      flatShading: true 
    });
    
    function createCloud(x: number, y: number, z: number, scale: number) {
      const cloud = new THREE.Group();
      const sphereCount = 5;
      for (let i = 0; i < sphereCount; i++) {
        const radius = 25 + Math.random() * 15;
        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(radius, 10, 10),
          cloudMaterial
        );
        sphere.position.set(
          (Math.random() - 0.5) * 60,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 40
        );
        cloud.add(sphere);
      }
      cloud.position.set(x, y, z);
      cloud.scale.set(scale, scale * 0.7, scale);
      return cloud;
    }
    
    const clouds = [
      createCloud(-200, 900, 100, 1.2),
      createCloud(0, 950, -150, 1.5),
      createCloud(400, 880, 200, 1.0),
      createCloud(-100, 1000, -300, 1.3),
      createCloud(250, 920, -100, 1.1)
    ];
    clouds.forEach(c => {
      scene.add(c);
      cloudParticlesRef.current.push(c as any);
    });

    // Enhanced Parachute with detailed canopy
    const parachuteGroup = new THREE.Group();
    
    // Canopy with segments
    const canopySegments = 12;
    for (let i = 0; i < canopySegments; i++) {
      const angle = (i / canopySegments) * Math.PI * 2;
      const nextAngle = ((i + 1) / canopySegments) * Math.PI * 2;
      const canopyGeometry = new THREE.BufferGeometry();
      const vertices = new Float32Array([
        0, 0, 0,
        Math.cos(angle) * 22, -22, Math.sin(angle) * 22,
        Math.cos(nextAngle) * 22, -22, Math.sin(nextAngle) * 22
      ]);
      canopyGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      const canopyMaterial = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0xffffff : 0xff4444,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95,
        flatShading: true
      });
      const segment = new THREE.Mesh(canopyGeometry, canopyMaterial);
      segment.castShadow = true;
      parachuteGroup.add(segment);
    }
    
    // Ropes
    const ropeMaterial = new THREE.LineBasicMaterial({ color: 0x222222, linewidth: 2 });
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const ropePoints = [
        new THREE.Vector3(Math.cos(angle) * 18, -22, Math.sin(angle) * 18),
        new THREE.Vector3(0, 0, 0)
      ];
      const rope = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(ropePoints),
        ropeMaterial
      );
      parachuteGroup.add(rope);
    }
    
    parachuteGroup.visible = false;
    scene.add(parachuteGroup);
    parachuteGroupRef.current = parachuteGroup;

    // Enhanced Labels with clearer text
    function createLabel(text: string, pos: THREE.Vector3, fontSize: number = 56): THREE.Sprite {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (!ctx) return new THREE.Sprite();
      
      // Gradient background
      const grad = ctx.createLinearGradient(0, 0, 1024, 256);
      grad.addColorStop(0, 'rgba(0, 60, 120, 0.92)');
      grad.addColorStop(1, 'rgba(0, 120, 180, 0.85)');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(20, 20, 984, 216, 30);
      ctx.fill();
      
      // Border glow
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 5;
      ctx.stroke();
      
      // Text shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 4;
      ctx.shadowOffsetY = 4;
      
      // Main text
      ctx.font = `Bold ${fontSize}px "Microsoft YaHei", Arial`;
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 512, 128);
      
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ 
          map: new THREE.CanvasTexture(canvas), 
          transparent: true 
        })
      );
      sprite.position.copy(pos);
      sprite.scale.set(200, 50, 1);
      return sprite;
    }

    scene.add(createLabel('✈️ 飞机 +800m', new THREE.Vector3(-300, 870, 0), 64));
    scene.add(createLabel('🏔️ 地面 -5m', new THREE.Vector3(0, 40, 100), 56));
    scene.add(createLabel('🌊 海平面 0m', new THREE.Vector3(-400, 40, 100), 56));
    scene.add(createLabel('⛰️ 山地 +50m', new THREE.Vector3(350, 160, 0), 56));

    let animationId: number;
    const clock = new THREE.Clock();
    
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Animate airplane
      if (airplaneGroupRef.current && airplaneGroupRef.current.position.x < 500) {
        airplaneGroupRef.current.position.x += 35 * delta;
        // Rotate propeller
        const propeller = airplaneGroupRef.current.children.find(c => c.position.x > 20);
        if (propeller) propeller.rotation.x += 15 * delta;
        
        if (playerGroupRef.current && !isJumping) {
          playerGroupRef.current.position.copy(airplaneGroupRef.current.position);
          playerGroupRef.current.position.z = 20;
        }
      }

      // Animate player falling
      if (isJumping && playerGroupRef.current) {
        const fallSpeed = parachuteOpen ? 12 : 70;
        playerGroupRef.current.position.y -= fallSpeed * delta;
        playerAltitudeRef.current = playerGroupRef.current.position.y;
        setPlayerAltitude(Math.round(playerAltitudeRef.current));
        
        if (parachuteGroupRef.current) {
          parachuteGroupRef.current.position.copy(playerGroupRef.current.position);
          parachuteGroupRef.current.position.y += 28;
          if (parachuteOpen) {
            parachuteGroupRef.current.rotation.z = Math.sin(clock.elapsedTime * 2) * 0.08;
            parachuteGroupRef.current.rotation.x = Math.sin(clock.elapsedTime * 1.5) * 0.05;
          }
        }
        
        // Rotate player during free fall
        if (!parachuteOpen) {
          playerGroupRef.current.rotation.x += delta * 1.5;
          playerGroupRef.current.rotation.z = Math.sin(clock.elapsedTime * 3) * 0.1;
        } else {
          // Upright position with parachute
          playerGroupRef.current.rotation.x *= 0.95;
          playerGroupRef.current.rotation.z *= 0.95;
        }
        
        if (playerGroupRef.current.position.y <= -5) {
          playerGroupRef.current.position.y = -5;
          setIsJumping(false);
        }
      }

      // Animate clouds
      cloudParticlesRef.current.forEach((cloud: any) => {
        if (cloud.position) {
          cloud.position.x += 6 * delta;
          if (cloud.position.x > 700) cloud.position.x = -700;
        }
      });

      // Smooth camera follow
      if (cameraRef.current && playerGroupRef.current) {
        const targetX = playerGroupRef.current.position.x - 80;
        const targetY = playerGroupRef.current.position.y + 180;
        cameraRef.current.position.x += (targetX - cameraRef.current.position.x) * 0.04;
        cameraRef.current.position.y += (targetY - cameraRef.current.position.y) * 0.04;
        cameraRef.current.position.z += (350 - cameraRef.current.position.z) * 0.04;
        cameraRef.current.lookAt(playerGroupRef.current.position);
      }

      // Animate sea waves
      const time = clock.elapsedTime;
      const seaPositions = seaGeometry.attributes.position.array;
      for (let i = 0; i < seaPositions.length; i += 3) {
        const x = seaPositions[i];
        const y = seaPositions[i + 1];
        seaPositions[i + 2] = Math.sin(x * 0.02 + time) * 2 + Math.cos(y * 0.015 + time * 0.8) * 2;
      }
      seaGeometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      groundGeometry.dispose();
      seaGeometry.dispose();
    };
  }, []);

  const handleJump = () => {
    if (!isJumping && playerGroupRef.current && airplaneGroupRef.current) {
      setIsJumping(true);
      playerGroupRef.current.position.x = airplaneGroupRef.current.position.x;
      setFeedback({text: '🪂 已跳伞！注意观察高度变化...', type: 'info'});
    }
  };

  const handleOpenParachute = () => {
    if (isJumping && !parachuteOpen && parachuteGroupRef.current) {
      setParachuteOpen(true);
      parachuteGroupRef.current.visible = true;
      setFeedback({text: '☂️ 降落伞已打开！下降速度减缓。', type: 'success'});
    }
  };

  const checkAnswer1 = () => {
    if (!answer1Ref.current) return;
    const answer = parseInt(answer1Ref.current.value);
    if (answer === 805) {
      setFeedback({text: '✓ 正确！相对高度差 = 800 - (-5) = 805m', type: 'success'});
      setTask1Correct(true);
    } else {
      setFeedback({text: '✗ 错误。提示：相对高度差 = 飞机高度 - 地面高度 = 800 - (?)', type: 'error'});
    }
  };

  const checkAnswer2 = () => {
    if (!answer2Ref.current) return;
    const answer = parseInt(answer2Ref.current.value);
    if (answer === 195) {
      setFeedback({text: '✓ 正确！开伞高度 = 地面海拔 + 安全高度 = -5 + 200 = 195m', type: 'success'});
      setTask2Correct(true);
      setGameComplete(true);
      if (onComplete) onComplete();
    } else {
      setFeedback({text: '✗ 错误。提示：开伞海拔 = 地面海拔 + 安全高度 = -5 + 200 = ?', type: 'error'});
    }
  };

  const feedbackStyles = {
    success: { background: '#d4edda', color: '#155724', border: '1px solid #c3e6cb' },
    error: { background: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb' },
    info: { background: '#fff3cd', color: '#856404', border: '1px solid #ffeeba' }
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '60vh' }} />
      <div style={{ padding: '20px', background: '#f0f0f0' }}>
        <h3 style={{ margin: '0 0 15px 0' }}>🪂 关卡 1：精准跳伞——有理数加减运算</h3>
        <p><strong>战场场景：</strong>飞机航线高度 +800m，目标区域地面海拔 -5m（低于海平面），周围山地海拔 +50m。</p>
        <p style={{ fontSize: '14px', color: '#666' }}>当前高度：<span style={{ fontWeight: 'bold', color: '#ff6347' }}>{playerAltitude}m</span></p>
        
        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
          <button onClick={handleJump} disabled={isJumping} style={{ padding: '12px 24px', fontSize: '16px', cursor: isJumping ? 'not-allowed' : 'pointer', background: isJumping ? '#ccc' : '#ff6347', color: 'white', border: 'none', borderRadius: '8px', transition: 'all 0.3s' }}>🪂 跳伞</button>
          <button onClick={handleOpenParachute} disabled={!isJumping || parachuteOpen} style={{ padding: '12px 24px', fontSize: '16px', cursor: (!isJumping || parachuteOpen) ? 'not-allowed' : 'pointer', background: (!isJumping || parachuteOpen) ? '#ccc' : '#4169e1', color: 'white', border: 'none', borderRadius: '8px', transition: 'all 0.3s' }}>☂️ 开伞</button>
        </div>

        <div style={{ marginBottom: '20px', padding: '15px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>任务 1：计算飞机与地面的相对高度差</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input ref={answer1Ref} type="number" placeholder="输入答案（米）" disabled={task1Correct} style={{ padding: '10px', fontSize: '14px', width: '180px', border: task1Correct ? '2px solid #28a745' : '2px solid #ddd', borderRadius: '6px' }} />
            <button onClick={checkAnswer1} disabled={task1Correct} style={{ padding: '10px 20px', cursor: task1Correct ? 'not-allowed' : 'pointer', background: task1Correct ? '#28a745' : '#007bff', color: 'white', border: 'none', borderRadius: '6px' }}>{task1Correct ? '✓ 已完成' : '提交'}</button>
          </div>
        </div>

        <div style={{ marginBottom: '20px', padding: '15px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>任务 2：开伞高度计算</h4>
          <p style={{ margin: '0 0 10px 0', color: '#666' }}>若开伞安全高度为 200m（离地高度），求下降到什么<b>海拔高度</b>时必须开伞？</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input ref={answer2Ref} type="number" placeholder="输入海拔高度（米）" disabled={task2Correct} onKeyDown={(e) => e.key === 'Enter' && checkAnswer2()} style={{ padding: '10px', fontSize: '14px', width: '180px', border: task2Correct ? '2px solid #28a745' : '2px solid #ddd', borderRadius: '6px' }} />
            <button onClick={checkAnswer2} disabled={task2Correct} style={{ padding: '10px 20px', cursor: task2Correct ? 'not-allowed' : 'pointer', background: task2Correct ? '#28a745' : '#007bff', color: 'white', border: 'none', borderRadius: '6px' }}>{task2Correct ? '✓ 已完成' : '提交'}</button>
          </div>
        </div>

        <div style={{ padding: '15px', borderRadius: '8px', fontWeight: 'bold', ...feedbackStyles[feedback.type] }}>{feedback.text}</div>

        {gameComplete && (
          <div style={{ marginTop: '15px', padding: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: '8px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 10px 0' }}>🎉 恭喜完成关卡 1！</h3>
            <p>你已经掌握了有理数加减运算在实际场景中的应用！</p>
          </div>
        )}

        <div style={{ marginTop: '15px', padding: '15px', background: '#e7f3ff', borderRadius: '8px', borderLeft: '4px solid #007bff' }}>
          <strong>🎯 数学目标：</strong>熟练掌握有理数减法法则，理解"负数"在现实海拔中的意义。
        </div>
      </div>
    </div>
  );
}
