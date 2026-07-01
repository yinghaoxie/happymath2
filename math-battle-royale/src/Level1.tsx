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
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.0015);

    const camera = new THREE.PerspectiveCamera(60, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 3000);
    camera.position.set(-100, 500, 800);
    camera.lookAt(0, 200, 0);
    const cameraRef = { current: camera };

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    containerRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffdfba, 1.2);
    directionalLight.position.set(200, 600, 300);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    scene.add(new THREE.HemisphereLight(0x87ceeb, 0x3d5c3d, 0.6));

    const groundGeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
    const colors: number[] = [];
    const positions = groundGeometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      const noise = Math.sin(positions[i] * 0.01) * Math.cos(positions[i + 1] * 0.01) * 0.1;
      colors.push(0.2 + noise, 0.5 + noise * 0.5, 0.2);
    }
    groundGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const ground = new THREE.Mesh(groundGeometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -5;
    ground.receiveShadow = true;
    scene.add(ground);

    const sea = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshStandardMaterial({ color: 0x1e90ff, transparent: true, opacity: 0.4, metalness: 0.8 }));
    sea.rotation.x = -Math.PI / 2;
    sea.position.y = 0;
    scene.add(sea);

    const airplaneGroup = new THREE.Group();
    const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 50, 16), new THREE.MeshStandardMaterial({ color: 0xff6347, roughness: 0.3, metalness: 0.7 }));
    fuselage.rotation.z = Math.PI / 2;
    fuselage.castShadow = true;
    airplaneGroup.add(fuselage);
    const wings = new THREE.Mesh(new THREE.BoxGeometry(15, 2, 60), new THREE.MeshStandardMaterial({ color: 0xcd5c5c, roughness: 0.3, metalness: 0.7 }));
    wings.castShadow = true;
    airplaneGroup.add(wings);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(10, 2, 20), new THREE.MeshStandardMaterial({ color: 0xcd5c5c }));
    tail.position.set(-20, 5, 0);
    airplaneGroup.add(tail);
    const cockpit = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 16), new THREE.MeshStandardMaterial({ color: 0x87ceeb, transparent: true, opacity: 0.7 }));
    cockpit.position.set(15, 5, 0);
    airplaneGroup.add(cockpit);
    airplaneGroup.position.set(-400, 800, 0);
    scene.add(airplaneGroup);
    airplaneGroupRef.current = airplaneGroup;

    const playerGroup = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(4, 12, 8, 16), new THREE.MeshStandardMaterial({ color: 0xffff00, roughness: 0.5 }));
    body.castShadow = true;
    playerGroup.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(5, 16, 16), new THREE.MeshStandardMaterial({ color: 0xffccaa }));
    head.position.y = 10;
    head.castShadow = true;
    playerGroup.add(head);
    playerGroup.position.set(-400, 800, 15);
    scene.add(playerGroup);
    playerGroupRef.current = playerGroup;

    const mountain = new THREE.Mesh(new THREE.ConeGeometry(100, 120, 8, 1), new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.95, flatShading: true }));
    mountain.position.set(300, 55, 0);
    mountain.castShadow = true;
    mountain.receiveShadow = true;
    scene.add(mountain);
    const snowCap = new THREE.Mesh(new THREE.ConeGeometry(40, 30, 8, 1), new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true }));
    snowCap.position.set(300, 110, 0);
    scene.add(snowCap);

    const cloudGeometry = new THREE.SphereGeometry(30, 8, 8);
    const cloudMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, flatShading: true });
    const cloudPositions: number[][] = [[-200, 900, 100], [0, 950, -150], [400, 880, 200], [-100, 1000, -300], [250, 920, -100]];
    cloudPositions.forEach(pos => {
      const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
      cloud.position.set(pos[0], pos[1], pos[2]);
      cloud.scale.set(1 + Math.random(), 0.6 + Math.random() * 0.4, 1 + Math.random());
      scene.add(cloud);
      cloudParticlesRef.current.push(cloud);
    });

    const parachuteGroup = new THREE.Group();
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(20, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.9 }));
    canopy.castShadow = true;
    parachuteGroup.add(canopy);
    const ropePoints: THREE.Vector3[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      ropePoints.push(new THREE.Vector3(Math.cos(angle) * 15, -20, Math.sin(angle) * 15));
      ropePoints.push(new THREE.Vector3(0, 0, 0));
    }
    parachuteGroup.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(ropePoints), new THREE.LineBasicMaterial({ color: 0x333333 })));
    parachuteGroup.visible = false;
    scene.add(parachuteGroup);
    parachuteGroupRef.current = parachuteGroup;

    function createLabel(text: string, pos: THREE.Vector3): THREE.Sprite {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (!ctx) return new THREE.Sprite();
      const grad = ctx.createLinearGradient(0, 0, 512, 128);
      grad.addColorStop(0, 'rgba(0, 50, 100, 0.85)');
      grad.addColorStop(1, 'rgba(0, 100, 150, 0.75)');
      ctx.fillStyle = grad;
      ctx.roundRect(10, 10, 492, 108, 20);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.font = 'Bold 48px Arial';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText(text, 256, 80);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true }));
      sprite.position.copy(pos);
      sprite.scale.set(150, 37.5, 1);
      return sprite;
    }

    scene.add(createLabel('✈️ 飞机 +800m', new THREE.Vector3(-400, 860, 0)));
    scene.add(createLabel('🏔️ 地面 -5m', new THREE.Vector3(0, 30, 80)));
    scene.add(createLabel('🌊 海平面 0m', new THREE.Vector3(-500, 30, 80)));
    scene.add(createLabel('⛰️ 山地 +50m', new THREE.Vector3(300, 140, 0)));

    let animationId: number;
    const clock = new THREE.Clock();
    
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (airplaneGroupRef.current && airplaneGroupRef.current.position.x < 500) {
        airplaneGroupRef.current.position.x += 30 * delta;
        if (playerGroupRef.current && !isJumping) {
          playerGroupRef.current.position.copy(airplaneGroupRef.current.position);
          playerGroupRef.current.position.z = 15;
        }
      }

      if (isJumping && playerGroupRef.current) {
        const fallSpeed = parachuteOpen ? 15 : 60;
        playerGroupRef.current.position.y -= fallSpeed * delta;
        playerAltitudeRef.current = playerGroupRef.current.position.y;
        setPlayerAltitude(Math.round(playerAltitudeRef.current));
        
        if (parachuteGroupRef.current) {
          parachuteGroupRef.current.position.copy(playerGroupRef.current.position);
          parachuteGroupRef.current.position.y += 25;
          if (parachuteOpen) parachuteGroupRef.current.rotation.z = Math.sin(clock.elapsedTime * 2) * 0.1;
        }
        if (!parachuteOpen) playerGroupRef.current.rotation.x += delta * 2;
        if (playerGroupRef.current.position.y <= -5) {
          playerGroupRef.current.position.y = -5;
          setIsJumping(false);
        }
      }

      cloudParticlesRef.current.forEach(cloud => {
        cloud.position.x += 5 * delta;
        if (cloud.position.x > 600) cloud.position.x = -600;
      });

      if (cameraRef.current && playerGroupRef.current) {
        cameraRef.current.position.x += (playerGroupRef.current.position.x - 100 - cameraRef.current.position.x) * 0.05;
        cameraRef.current.position.y += (playerGroupRef.current.position.y + 200 - cameraRef.current.position.y) * 0.05;
        cameraRef.current.lookAt(playerGroupRef.current.position);
      }

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
      if (containerRef.current && renderer.domElement) containerRef.current.removeChild(renderer.domElement);
      renderer.dispose();
      groundGeometry.dispose();
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
