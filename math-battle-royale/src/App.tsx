import { useState } from 'react'
import Level1 from './Level1'
import './App.css'

function App() {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);

  const handleLevelComplete = (level: number) => {
    if (!completedLevels.includes(level)) {
      setCompletedLevels([...completedLevels, level]);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#1a1a2e' }}>
      {/* Header */}
      <header style={{ 
        padding: '20px', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '2.5rem' }}>🎮 数学大逃杀 Math Battle Royale</h1>
        <p style={{ margin: '10px 0 0 0', opacity: 0.9 }}>初中数学 × 战术竞技 创新教学游戏</p>
      </header>

      {/* Level Navigation */}
      <nav style={{ 
        padding: '15px 20px', 
        background: '#16213e',
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {[1, 2, 3, 4, 5].map((level) => (
          <button
            key={level}
            onClick={() => setCurrentLevel(level)}
            disabled={!completedLevels.includes(level - 1) && level > 1 && level !== 1}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              cursor: completedLevels.includes(level - 1) || level === 1 ? 'pointer' : 'not-allowed',
              background: currentLevel === level 
                ? '#e94560' 
                : completedLevels.includes(level)
                ? '#4ecca3'
                : '#0f3460',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              opacity: !completedLevels.includes(level - 1) && level > 1 ? 0.5 : 1,
              transition: 'all 0.3s ease'
            }}
          >
            {completedLevels.includes(level) ? '✓ ' : ''}关卡{level}
          </button>
        ))}
      </nav>

      {/* Game Area */}
      <main style={{ padding: '20px' }}>
        {currentLevel === 1 && <Level1 onComplete={() => handleLevelComplete(1)} />}
        {currentLevel === 2 && (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            color: 'white',
            background: '#16213e',
            borderRadius: '10px',
            marginTop: '20px'
          }}>
            <h2>🎒 关卡2：背包管理学（开发中）</h2>
            <p>整式与一元一次方程</p>
            <p style={{ opacity: 0.7, marginTop: '20px' }}>完成关卡1后解锁</p>
          </div>
        )}
        {currentLevel === 3 && (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            color: 'white',
            background: '#16213e',
            borderRadius: '10px',
            marginTop: '20px'
          }}>
            <h2>⚡ 关卡3：生死时速（开发中）</h2>
            <p>一元一次方程追及问题</p>
          </div>
        )}
        {currentLevel === 4 && (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            color: 'white',
            background: '#16213e',
            borderRadius: '10px',
            marginTop: '20px'
          }}>
            <h2>📍 关卡4：小地图标点（开发中）</h2>
            <p>平面直角坐标系</p>
          </div>
        )}
        {currentLevel === 5 && (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            color: 'white',
            background: '#16213e',
            borderRadius: '10px',
            marginTop: '20px'
          }}>
            <h2>🎯 关卡5：双耳定位（开发中）</h2>
            <p>二元一次方程组</p>
          </div>
        )}
      </main>

      {/* Progress Footer */}
      <footer style={{ 
        padding: '20px', 
        background: '#0f3460',
        color: 'white',
        textAlign: 'center',
        marginTop: '40px'
      }}>
        <p>进度：{completedLevels.length} / 12 关卡已完成</p>
        <div style={{ 
          width: '100%', 
          maxWidth: '400px', 
          height: '10px', 
          background: '#1a1a2e',
          borderRadius: '5px',
          margin: '10px auto',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${(completedLevels.length / 12) * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #4ecca3, #e94560)',
            transition: 'width 0.5s ease'
          }} />
        </div>
        <p style={{ fontSize: '12px', opacity: 0.7 }}>
          第一阶段：新兵入伍（七年级上册）| 核心武器：有理数、整式、一元一次方程
        </p>
      </footer>
    </div>
  )
}

export default App
