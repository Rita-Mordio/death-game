import { useState, useEffect, useRef } from 'react'
import './App.css'

// ─── BGM 설정 ───────────────────────────────────────────────
// 여기에 BGM 파일 경로를 넣으세요 (예: '/bgm.mp3')
const BGM_SRC = '/The_Ticking_Drive.mp3'

// ─── 게임 데이터 ─────────────────────────────────────────────
const STORY = `당신은 늦은 밤 강남역에서\n혼자 또는 다른 정체모를 사람과\n식사를 마쳤습니다.\n비가 오고 발목이 아픕니다.\n\n당신의 선택은?`

const CHOICES = [
  {
    id: 1,
    label: '① 집에 있는 사람한테 누구랑 밥먹는지\n메뉴는 뭔지, 어디서 잘건지 하나하나 친절하게 전달한다',
    result: '거짓말 하지마십시오.\n당신은 그 선택을 하지 않았습니다.\n후회해도 늦었습니다.',
    icon: '📱',
    color: '#4ade80',
  },
  {
    id: 2,
    label: '② 집에 있는 사람은 알빠노!!\n뭐하러 신경씀?ㅋㅋ 개무시한다',
    result: '그럴줄 알았습니다.\n당신은 그런 사람입니다.\n집에 있는 사람의 빡침이\n20000 증가하였습니다. 두고두고 복수할 것입니다.',
    icon: '💀',
    color: '#f87171',
  },
]

// ─── 타이핑 훅 ───────────────────────────────────────────────
function useTyping(text, speed = 40, start = true) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!start) return
    setDisplayed('')
    setDone(false)
    let i = 0
    const id = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(id)
        setDone(true)
      }
    }, speed)
    return () => clearInterval(id)
  }, [text, speed, start])

  return { displayed, done }
}

// ─── 빗방울 배경 ─────────────────────────────────────────────
function Rain() {
  const drops = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 2}s`,
    duration: `${0.6 + Math.random() * 0.8}s`,
    opacity: 0.2 + Math.random() * 0.4,
  }))
  return (
    <div className="rain">
      {drops.map(d => (
        <div
          key={d.id}
          className="raindrop"
          style={{ left: d.left, animationDelay: d.delay, animationDuration: d.duration, opacity: d.opacity }}
        />
      ))}
    </div>
  )
}

// ─── BGM 컴포넌트 ─────────────────────────────────────────────
function BgmPlayer({ audioRef }) {
  const [playing, setPlaying] = useState(false)

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.play()
      setPlaying(true)
    }
  }

  // 외부에서 재생 시작 시 상태 동기화
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
    }
  }, [audioRef])

  return (
    <button className="bgm-btn" onClick={toggle} title={playing ? '음악 끄기' : '음악 켜기'}>
      {playing ? '🔊' : '🔇'}
    </button>
  )
}

// ─── 모달 ────────────────────────────────────────────────────
function Modal({ choice, onClose }) {
  const { displayed, done } = useTyping(choice.result, 50)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-icon">{choice.icon}</div>
        <div className="modal-title" style={{ color: choice.color }}>
          {choice.id === 1 ? '[ SYSTEM MESSAGE ]' : '[ GAME OVER ]'}
        </div>
        <div className="modal-text">
          {displayed.split('\n').map((line, i) => (
            <span key={i}>{line}<br /></span>
          ))}
          {!done && <span className="cursor">▌</span>}
        </div>
        {done && (
          <button className="modal-close" onClick={onClose}>
            [ 확인 ]
          </button>
        )}
      </div>
    </div>
  )
}

// ─── 메인 앱 ─────────────────────────────────────────────────
export default function App() {
  const [phase, setPhase] = useState('start') // start | intro | question | choices | modal
  const [selectedChoice, setSelectedChoice] = useState(null)
  const [anger, setAnger] = useState(0)
  const audioRef = useRef(null)

  const { displayed: introText, done: introDone } = useTyping(
    '▶ DEATH GAME v1.0\n\n시스템 부팅 중...\n\n경고: 이 게임은 실화를 바탕으로 합니다.',
    35,
    phase === 'intro'
  )

  const { displayed: storyText, done: storyDone } = useTyping(
    STORY,
    45,
    phase === 'question'
  )

  useEffect(() => {
    if (phase === 'intro' && introDone) {
      const t = setTimeout(() => setPhase('question'), 1200)
      return () => clearTimeout(t)
    }
  }, [introDone, phase])

  const handleStart = () => {
    if (audioRef.current) {
      audioRef.current.volume = 0.5
      audioRef.current.play()
    }
    setPhase('intro')
  }

  const handleChoice = (choice) => {
    if (choice.id === 2) setAnger(prev => prev + 20000)
    setSelectedChoice(choice)
    setPhase('modal')
  }

  const handleClose = () => {
    setSelectedChoice(null)
    setPhase('question')
  }

  return (
    <div className="game-root">
      <Rain />
      <audio ref={audioRef} src={BGM_SRC} loop />
      <BgmPlayer audioRef={audioRef} />

      {anger > 0 && (
        <div className="anger-bar">
          <span className="anger-label">💢 빡침 게이지</span>
          <div className="anger-track">
            <div
              className="anger-fill"
              style={{ width: `${Math.min((anger / 20000) * 100, 100)}%` }}
            />
          </div>
          <span className="anger-value">+{anger.toLocaleString()}</span>
        </div>
      )}

      <div className="game-window">
        <div className="window-titlebar">
          <span className="titlebar-dots">
            <span />
            <span />
            <span />
          </span>
          <span className="titlebar-title">REVENGE.EXE</span>
        </div>

        <div className="window-body">
          {/* 시작 화면 */}
          {phase === 'start' && (
            <div className="start-screen" onClick={handleStart}>
              <div className="start-title">THE<br />SILENCE</div>
              <div className="start-sub">실화를 바탕으로 한 이야기</div>
              <div className="start-touch">▶ 터치하여 시작</div>
            </div>
          )}

          {/* 인트로 */}
          {phase === 'intro' && (
            <div className="text-box">
              <pre className="story-text">
                {introText}
                {!introDone && <span className="cursor">▌</span>}
              </pre>
            </div>
          )}

          {/* 질문 + 선택하기 버튼 */}
          {phase === 'question' && (
            <>
              <div className="scene-header">
                <span className="scene-tag">[ SCENE 01 ]</span>
                <span className="scene-location">📍 강남역 · 늦은 밤 · 비</span>
              </div>
              <div className="text-box">
                <pre className="story-text">
                  {storyText}
                  {!storyDone && <span className="cursor">▌</span>}
                </pre>
              </div>
              {storyDone && (
                <div className="start-choice-wrap">
                  <button className="start-choice-btn" onClick={() => setPhase('choices')}>
                    ▶ 선택하기
                  </button>
                </div>
              )}
            </>
          )}

          {/* 선택지 */}
          {(phase === 'choices' || phase === 'modal') && (
            <div className="choices choices-enter">
              {CHOICES.map(c => (
                <button
                  key={c.id}
                  className="choice-btn"
                  style={{ '--choice-color': c.color }}
                  onClick={() => handleChoice(c)}
                  disabled={phase === 'modal'}
                >
                  <pre>{c.label}</pre>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="window-footer">
          <span>★ POWERED BY GRUDGE ENGINE ★</span>
        </div>
      </div>

      {phase === 'modal' && selectedChoice && (
        <Modal choice={selectedChoice} onClose={handleClose} />
      )}
    </div>
  )
}
