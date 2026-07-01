import * as THREE from 'three';
import { useEffect, useRef } from 'react';

interface Level1Props {
  onComplete?: () => void;
}

export default function Level1({ onComplete }: Level1Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const airplaneRef = useRef<THREE.Mesh | null>(null);
  const groundRef = useRef<THREE.Mesh | null>(null);
  const playerRef = useRef<THREE.Mesh | null>(null);
  const parachuteRef = useRef<THREE.Mesh | null>(null);
  
  // Game state
  const playerAltitudeRef = useRef(800);
  const isJumpingRef = useRef(false);
  const parachuteOpenRef = useRef(false);
  const answerInputRef = useRef<HTMLInputElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      2000
    );
    camera.position.set(0, 400, 600);
    camera.lookAt(0, 200, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 500, 200);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Ground (sea level with negative elevation area)
    const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x228b22,
      transparent: true,
      opacity: 0.9
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -5; // Ground level at -5m
    ground.receiveShadow = true;
    scene.add(ground);
    groundRef.current = ground;

    // Sea level indicator
    const seaGeometry = new THREE.PlaneGeometry(1000, 1000);
    const seaMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x1e90ff,
      transparent: true,
      opacity: 0.5
    });
    const sea = new THREE.Mesh(seaGeometry, seaMaterial);
    sea.rotation.x = -Math.PI / 2;
    sea.position.y = 0;
    scene.add(sea);

    // Airplane
    const airplaneGeometry = new THREE.BoxGeometry(60, 15, 20);
    const airplaneMaterial = new THREE.MeshStandardMaterial({ color: 0xff6347 });
    const airplane = new THREE.Mesh(airplaneGeometry, airplaneMaterial);
    airplane.position.set(-300, 800, 0);
    airplane.castShadow = true;
    scene.add(airplane);
    airplaneRef.current = airplane;

    // Player (before jump)
    const playerGeometry = new THREE.SphereGeometry(5, 16, 16);
    const playerMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
    const player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.set(-300, 800, 10);
    player.castShadow = true;
    scene.add(player);
    playerRef.current = player;

    // Mountain
    const mountainGeometry = new THREE.ConeGeometry(80, 100, 4);
    const mountainMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
    mountain.position.set(200, 45, 0); // Base at -5, peak at ~95
    mountain.castShadow = true;
    scene.add(mountain);

    // Parachute (hidden initially)
    const parachuteGeometry = new THREE.SphereGeometry(15, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const parachuteMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      side: THREE.DoubleSide
    });
    const parachute = new THREE.Mesh(parachuteGeometry, parachuteMaterial);
    parachute.visible = false;
    parachute.position.copy(player.position);
    scene.add(parachute);
    parachuteRef.current = parachute;

    // Labels using sprite
    function createTextLabel(text: string, position: THREE.Vector3): THREE.Sprite {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return new THREE.Sprite();
      
      canvas.width = 256;
      canvas.height = 64;
      context.fillStyle = 'rgba(0, 0, 0, 0.7)';
      context.fillRect(0, 0, 256, 64);
      context.font = 'Bold 24px Arial';
      context.fillStyle = 'white';
      context.textAlign = 'center';
      context.fillText(text, 128, 40);
      
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(material);
      sprite.position.copy(position);
      sprite.scale.set(100, 25, 1);
      return sprite;
    }

    const airplaneLabel = createTextLabel('飞机 +800m', new THREE.Vector3(-300, 830, 0));
    const groundLabel = createTextLabel('地面 -5m', new THREE.Vector3(0, 20, 50));
    const seaLabel = createTextLabel('海平面 0m', new THREE.Vector3(-400, 20, 50));
    const mountainLabel = createTextLabel('山地 +50m', new THREE.Vector3(200, 120, 0));
    
    scene.add(airplaneLabel, groundLabel, seaLabel, mountainLabel);

    // Animation loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Move airplane
      if (airplaneRef.current && airplaneRef.current.position.x < 400) {
        airplaneRef.current.position.x += 0.5;
        if (playerRef.current && !isJumpingRef.current) {
          playerRef.current.position.x = airplaneRef.current.position.x;
          playerRef.current.position.y = airplaneRef.current.position.y;
        }
      }

      // Player falling
      if (isJumpingRef.current && playerRef.current) {
        const fallSpeed = parachuteOpenRef.current ? 2 : 8;
        playerRef.current.position.y -= fallSpeed;
        playerAltitudeRef.current = playerRef.current.position.y;
        
        if (parachuteRef.current) {
          parachuteRef.current.position.copy(playerRef.current.position);
          parachuteRef.current.position.y += 20;
        }

        // Stop at ground
        if (playerRef.current.position.y <= -5) {
          playerRef.current.position.y = -5;
          isJumpingRef.current = false;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometryDispose();
    };

    function geometryDispose() {
      // Cleanup geometries and materials
    }
  }, []);

  const handleJump = () => {
    if (!isJumpingRef.current && playerRef.current && airplaneRef.current) {
      isJumpingRef.current = true;
      playerRef.current.position.x = airplaneRef.current.position.x;
    }
  };

  const handleOpenParachute = () => {
    if (isJumpingRef.current && !parachuteOpenRef.current && parachuteRef.current) {
      parachuteOpenRef.current = true;
      parachuteRef.current.visible = true;
    }
  };

  const checkAnswer1 = () => {
    if (!answerInputRef.current || !feedbackRef.current) return;
    const answer = parseInt(answerInputRef.current.value);
    // Correct answer: 800 - (-5) = 805
    if (answer === 805) {
      feedbackRef.current.textContent = '✓ 正确！相对高度差 = 800 - (-5) = 805m';
      feedbackRef.current.style.color = 'green';
    } else {
      feedbackRef.current.textContent = '✗ 错误。提示：相对高度差 = 飞机高度 - 地面高度';
      feedbackRef.current.style.color = 'red';
    }
  };

  const checkAnswer2 = () => {
    if (!answerInputRef.current || !feedbackRef.current) return;
    const answer = parseInt(answerInputRef.current.value);
    // Correct answer: -5 + 200 = 195
    if (answer === 195) {
      feedbackRef.current.textContent = '✓ 正确！开伞高度 = 地面海拔 + 安全高度 = -5 + 200 = 195m';
      feedbackRef.current.style.color = 'green';
      if (onComplete) onComplete();
    } else {
      feedbackRef.current.textContent = '✗ 错误。提示：开伞海拔 = 地面海拔 + 安全高度';
      feedbackRef.current.style.color = 'red';
    }
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '60vh' }} />
      
      <div style={{ padding: '20px', background: '#f0f0f0' }}>
        <h3 style={{ margin: '0 0 15px 0' }}>🪂 关卡1：精准跳伞——有理数加减运算</h3>
        
        <div style={{ marginBottom: '20px' }}>
          <p><strong>战场场景：</strong>飞机航线高度 +800m，目标区域地面海拔 -5m（低于海平面），周围山地海拔 +50m。</p>
          
          <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
            <button 
              onClick={handleJump}
              style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer', background: '#ff6347', color: 'white', border: 'none', borderRadius: '5px' }}
            >
              🪂 跳伞
            </button>
            <button 
              onClick={handleOpenParachute}
              style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer', background: '#4169e1', color: 'white', border: 'none', borderRadius: '5px' }}
            >
              ☂️ 开伞
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '20px', padding: '15px', background: 'white', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>任务1：计算飞机与地面的相对高度差</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input 
              ref={answerInputRef}
              type="number" 
              placeholder="输入答案（米）"
              style={{ padding: '8px', fontSize: '14px', width: '150px' }}
            />
            <button 
              onClick={checkAnswer1}
              style={{ padding: '8px 16px', cursor: 'pointer', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px' }}
            >
              提交
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '20px', padding: '15px', background: 'white', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>任务2：开伞高度计算</h4>
          <p>若开伞安全高度为 200m（离地高度），求从飞机上跳下后，下降到什么<b>海拔高度</b>时必须开伞？</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input 
              type="number" 
              placeholder="输入海拔高度（米）"
              style={{ padding: '8px', fontSize: '14px', width: '150px' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') checkAnswer2();
              }}
            />
            <button 
              onClick={checkAnswer2}
              style={{ padding: '8px 16px', cursor: 'pointer', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px' }}
            >
              提交
            </button>
          </div>
        </div>

        <div 
          ref={feedbackRef}
          style={{ padding: '10px', background: '#fff3cd', borderRadius: '5px', fontWeight: 'bold' }}
        >
          等待作答...
        </div>

        <div style={{ marginTop: '15px', padding: '10px', background: '#e7f3ff', borderRadius: '5px' }}>
          <strong>🎯 数学目标：</strong>熟练掌握有理数减法法则，理解"负数"在现实海拔中的意义。
        </div>
      </div>
    </div>
  );
}
