'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import { Play, Pause, RotateCcw, LogOut, Heart, Volume2, VolumeX, Sparkles, AlertCircle, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Brick Color Types and Hex Palette (Pastel/Crayon tones)
type BrickColorKey = 'lightRed' | 'lightOrange' | 'lightYellow' | 'lightBlue' | 'lightGreen' | 'lightPurple';

interface BrickTypeInfo {
  name: string;
  fill: string;
  border: string;
  shadow: string;
  isTargetRed?: boolean;
}

const BRICK_PALETTE: Record<BrickColorKey, BrickTypeInfo> = {
  lightRed: {
    name: '연한 빨강',
    fill: '#ff9aa2',
    border: '#e8737d',
    shadow: '#d15b66',
    isTargetRed: true,
  },
  lightOrange: {
    name: '연한 주황',
    fill: '#ffdac1',
    border: '#f5b58e',
    shadow: '#e59a6c',
  },
  lightYellow: {
    name: '연한 노랑',
    fill: '#fff5ba',
    border: '#e8d97e',
    shadow: '#cfbe59',
  },
  lightBlue: {
    name: '연한 파랑',
    fill: '#b5eaf2',
    border: '#8accd8',
    shadow: '#6bb6c4',
  },
  lightGreen: {
    name: '연한 녹색',
    fill: '#c7f9cc',
    border: '#9edaa5',
    shadow: '#7ec086',
  },
  lightPurple: {
    name: '연한 보라',
    fill: '#e2d4f7',
    border: '#bfa8e6',
    shadow: '#a78bd6',
  },
};

interface Brick {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  colorKey: BrickColorKey;
  alive: boolean;
  roughJitter: number[]; // Crayon outline jitter offsets
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
}

export interface RankingRecord {
  name: string;
  time: string; // m:ss
  elapsedSeconds?: number;
  date?: string;
}

export default function Home() {
  // Screen state
  const [userName, setUserName] = useState<string>('');
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);

  // Gameplay state
  const [lives, setLives] = useState<number>(3);
  const [redBricksDestroyed, setRedBricksDestroyed] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null); // 3, 2, 1, or null
  const [gameResult, setGameResult] = useState<'success' | 'failure' | null>(null);
  const [muted, setMuted] = useState<boolean>(false);

  // Game timer tracking & Top 3 rankings
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [finalTimeStr, setFinalTimeStr] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [topRankings, setTopRankings] = useState<RankingRecord[]>([]);
  const [isLoadingRankings, setIsLoadingRankings] = useState<boolean>(false);

  const gameStartTimeRef = useRef<number | null>(null);
  const totalPausedDurationRef = useRef<number>(0);
  const pauseStartRef = useRef<number | null>(null);
  const hasSavedRecordRef = useRef<boolean>(false);

  // References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Game coordinates & physics refs (canvas fixed at 800 x 540)
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 540;

  // Paddle
  const paddleWidth = 110;
  const paddleHeight = 16;
  const paddleY = CANVAS_HEIGHT - 35;
  const paddleXRef = useRef<number>((CANVAS_WIDTH - paddleWidth) / 2);
  const paddleSpeed = 8;
  const keysPressed = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });

  // Ball
  const ballRadius = 8;
  const ballPosRef = useRef<{ x: number; y: number }>({
    x: CANVAS_WIDTH / 2,
    y: paddleY - ballRadius - 2,
  });
  const ballVelRef = useRef<{ vx: number; vy: number }>({ vx: 4, vy: -5 });
  const ballStuckRef = useRef<boolean>(true); // ball attached to paddle during countdown

  // Bricks & Particles
  const bricksRef = useRef<Brick[]>([]);
  const particlesRef = useRef<Particle[]>([]);

  // Sound generator (Web Audio API)
  const playHitSound = useCallback((frequency = 520, type: OscillatorType = 'triangle', duration = 0.08) => {
    if (muted) return;
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(frequency * 1.5, ctx.currentTime + duration);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio context error handling
    }
  }, [muted]);

  const playLoseLifeSound = useCallback(() => {
    if (muted) return;
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  }, [muted]);

  // Create Bricks: 5 rows x 8 cols = 40 bricks
  // 30% of 40 = 12 lightRed bricks guaranteed, rest randomly distributed among other pastel colors
  const initBricks = useCallback(() => {
    const rows = 5;
    const cols = 8;
    const padding = 10;
    const offsetTop = 45;
    const offsetLeft = 45;
    const brickWidth = (CANVAS_WIDTH - offsetLeft * 2 - padding * (cols - 1)) / cols;
    const brickHeight = 26;

    // Distribute 12 lightRed and 28 other colors
    const otherColors: BrickColorKey[] = ['lightOrange', 'lightYellow', 'lightBlue', 'lightGreen', 'lightPurple'];
    const colorList: BrickColorKey[] = [];

    for (let i = 0; i < 12; i++) {
      colorList.push('lightRed');
    }
    for (let i = 0; i < 28; i++) {
      const randColor = otherColors[Math.floor(Math.random() * otherColors.length)];
      colorList.push(randColor);
    }

    // Shuffle colorList
    for (let i = colorList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [colorList[i], colorList[j]] = [colorList[j], colorList[i]];
    }

    const newBricks: Brick[] = [];
    let idx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = offsetLeft + c * (brickWidth + padding);
        const y = offsetTop + r * (brickHeight + padding);
        
        // Generate pre-calculated crayon jitter points for rough look
        const jitter = Array.from({ length: 8 }, () => (Math.random() - 0.5) * 3);

        newBricks.push({
          id: idx,
          x,
          y,
          w: brickWidth,
          h: brickHeight,
          colorKey: colorList[idx],
          alive: true,
          roughJitter: jitter,
        });
        idx++;
      }
    }
    bricksRef.current = newBricks;
  }, [CANVAS_WIDTH]);

  // Add crayon particle explosion
  const addParticles = (x: number, y: number, color: string) => {
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 4 + 2,
        alpha: 1,
        life: 1,
      });
    }
  };

  // Start Countdown helper
  const startCountdown = useCallback(() => {
    setIsPaused(false);
    ballStuckRef.current = true;
    paddleXRef.current = (CANVAS_WIDTH - paddleWidth) / 2;
    ballPosRef.current = {
      x: paddleXRef.current + paddleWidth / 2,
      y: paddleY - ballRadius - 2,
    };
    // initial randomized launch angle (upward)
    const angle = (Math.random() * 40 - 20) * (Math.PI / 180); // -20 to +20 deg
    const speed = 6.2;
    ballVelRef.current = {
      vx: Math.sin(angle) * speed,
      vy: -Math.cos(angle) * speed,
    };

    setCountdown(3);
    const timer3 = setTimeout(() => {
      setCountdown(2);
      const timer2 = setTimeout(() => {
        setCountdown(1);
        const timer1 = setTimeout(() => {
          setCountdown(null);
          ballStuckRef.current = false;
          // 카운트다운이 끝난 직후 실제 게임 시작 시간 기록
          if (gameStartTimeRef.current === null) {
            gameStartTimeRef.current = Date.now();
            totalPausedDurationRef.current = 0;
            pauseStartRef.current = null;
          }
        }, 800);
        return () => clearTimeout(timer1);
      }, 800);
      return () => clearTimeout(timer2);
    }, 800);

    return () => clearTimeout(timer3);
  }, [CANVAS_WIDTH, paddleWidth, paddleY]);

  // Google Sheets Save Function (Runs ONLY on game success)
  const saveGameRecord = useCallback(async (timeStr: string, totalSec: number) => {
    setSaveStatus('saving');
    setIsLoadingRankings(true);

    // Format timestamp: "2026. 10. 9 오후 11:19:57"
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const hours24 = now.getHours();
    const ampm = hours24 >= 12 ? '오후' : '오전';
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timestampStr = `${year}. ${month}. ${date} ${ampm} ${hours12}:${minutes}:${seconds}`;

    const newRecord: RankingRecord = {
      name: userName,
      time: timeStr,
      elapsedSeconds: totalSec,
      date: timestampStr,
    };

    // 구글 앱스 스크립트 Web App URL
    const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;

    if (!scriptUrl) {
      console.warn('.env.local에 NEXT_PUBLIC_GOOGLE_SCRIPT_URL이 설정되지 않았습니다.');
      setSaveStatus('saved');
      setIsLoadingRankings(false);
      return;
    }

    try {
      // CORS 및 리다이렉트 대응: no-cors 및 text/plain 표준 전송
      await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          timestamp: timestampStr,
          name: userName,
          finishtime: timeStr,
          elapsedSeconds: totalSec,
        }),
      });

      setSaveStatus('saved');

      // 2. 구글 앱스 스크립트에서 최신 전체 Top 3 랭킹 불러오기 시도 (캐시 방지 쿼리 추가)
      try {
        const res = await fetch(`/api/rankings?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.rankings) && data.rankings.length > 0) {
            const sorted = data.rankings.sort(
              (a: RankingRecord, b: RankingRecord) =>
                (a.elapsedSeconds ?? 99999) - (b.elapsedSeconds ?? 99999)
            );
            setTopRankings(sorted.slice(0, 3));
          }
        }
      } catch (err) {
        console.warn('원격 랭킹 조회 실패:', err);
      }
    } catch (err) {
      console.error('구글 앱스 스크립트 실행 실패:', err);
      setSaveStatus('error');
    } finally {
      setIsLoadingRankings(false);
    }
  }, [userName]);

  // Game timer ticking effect
  useEffect(() => {
    if (!isGameStarted || isPaused || gameResult || countdown !== null || !gameStartTimeRef.current) {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - gameStartTimeRef.current! - totalPausedDurationRef.current;
      const totalSec = Math.floor(Math.max(0, elapsedMs) / 1000);
      setElapsedSeconds(totalSec);
    }, 200);

    return () => clearInterval(interval);
  }, [isGameStarted, isPaused, gameResult, countdown]);

  // Start fresh game
  const startGame = () => {
    if (!userName.trim()) return;
    setIsGameStarted(true);
    setLives(3);
    setRedBricksDestroyed(0);
    setGameResult(null);
    setElapsedSeconds(0);
    setFinalTimeStr('');
    setSaveStatus('idle');
    gameStartTimeRef.current = null;
    totalPausedDurationRef.current = 0;
    pauseStartRef.current = null;
    hasSavedRecordRef.current = false;
    initBricks();

    // Start background music with moderate volume
    if (bgmRef.current) {
      bgmRef.current.currentTime = 0;
      bgmRef.current.volume = 0.22;
      bgmRef.current.play().catch(() => {});
    }

    startCountdown();
  };

  // Restart button (returns to countdown)
  const handleRestart = () => {
    setLives(3);
    setRedBricksDestroyed(0);
    setGameResult(null);
    setElapsedSeconds(0);
    setFinalTimeStr('');
    setSaveStatus('idle');
    setTopRankings([]);
    gameStartTimeRef.current = null;
    totalPausedDurationRef.current = 0;
    pauseStartRef.current = null;
    hasSavedRecordRef.current = false;
    initBricks();
    particlesRef.current = [];
    if (bgmRef.current) {
      bgmRef.current.currentTime = 0;
      bgmRef.current.play().catch(() => {});
    }
    startCountdown();
  };

  // Pause / Resume
  const handleTogglePause = () => {
    if (gameResult || countdown !== null) return;
    setIsPaused((prev) => {
      const next = !prev;
      if (next) {
        // Paused: record pause start time
        pauseStartRef.current = Date.now();
        if (bgmRef.current) bgmRef.current.pause();
      } else {
        // Resumed: accumulate paused duration
        if (pauseStartRef.current) {
          totalPausedDurationRef.current += Date.now() - pauseStartRef.current;
          pauseStartRef.current = null;
        }
        if (bgmRef.current) bgmRef.current.play().catch(() => {});
      }
      return next;
    });
  };

  // Exit game to main screen (중간 중단 시 저장하지 않음)
  const handleExit = () => {
    setIsGameStarted(false);
    setIsPaused(false);
    setCountdown(null);
    setGameResult(null);
    setElapsedSeconds(0);
    setFinalTimeStr('');
    setSaveStatus('idle');
    setTopRankings([]);
    gameStartTimeRef.current = null;
    totalPausedDurationRef.current = 0;
    pauseStartRef.current = null;
    hasSavedRecordRef.current = false;
    if (bgmRef.current) {
      bgmRef.current.pause();
      bgmRef.current.currentTime = 0;
    }
  };

  // Touch swipe support for Mobile
  const touchStartRef = useRef<{ clientX: number; paddleStartX: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const touchCanvasX = (touch.clientX - rect.left) * scaleX;

    touchStartRef.current = {
      clientX: touch.clientX,
      paddleStartX: paddleXRef.current,
    };

    // If tapped directly, center paddle on touch position immediately
    const targetX = Math.max(10, Math.min(CANVAS_WIDTH - paddleWidth - 10, touchCanvasX - paddleWidth / 2));
    paddleXRef.current = targetX;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!touchStartRef.current || e.touches.length === 0) return;
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const deltaX = (touch.clientX - touchStartRef.current.clientX) * scaleX;

    const newPaddleX = touchStartRef.current.paddleStartX + deltaX;
    paddleXRef.current = Math.max(10, Math.min(CANVAS_WIDTH - paddleWidth - 10, newPaddleX));
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
  };

  // Key event listeners for left/right arrows
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        keysPressed.current.left = true;
      } else if (e.key === 'ArrowRight') {
        keysPressed.current.right = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        keysPressed.current.left = false;
      } else if (e.key === 'ArrowRight') {
        keysPressed.current.right = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Success firework effect
  useEffect(() => {
    if (gameResult === 'success') {
      const end = Date.now() + 3000;
      const colors = ['#ff9aa2', '#ffdac1', '#fff5ba', '#b5eaf2', '#c7f9cc', '#e2d4f7'];

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();

      // Confetti burst in center
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.6 },
        colors,
      });
    }
  }, [gameResult]);

  // Main Canvas Render & Physics Loop
  useEffect(() => {
    if (!isGameStarted) return;

    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Clear background (Soft warm paper texture feel)
      ctx.fillStyle = '#faf7f2';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Subtle sketch grid/paper dots
      ctx.fillStyle = 'rgba(215, 204, 190, 0.25)';
      for (let px = 20; px < CANVAS_WIDTH; px += 25) {
        for (let py = 20; py < CANVAS_HEIGHT; py += 25) {
          ctx.beginPath();
          ctx.arc(px, py, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 2. Physics & Paddle movement (only if not paused and no game over)
      if (!isPaused && !gameResult) {
        if (keysPressed.current.left) {
          paddleXRef.current = Math.max(10, paddleXRef.current - paddleSpeed);
        }
        if (keysPressed.current.right) {
          paddleXRef.current = Math.min(CANVAS_WIDTH - paddleWidth - 10, paddleXRef.current + paddleSpeed);
        }

        // Ball attached during countdown
        if (ballStuckRef.current) {
          ballPosRef.current.x = paddleXRef.current + paddleWidth / 2;
          ballPosRef.current.y = paddleY - ballRadius - 2;
        } else {
          // Ball movement
          let bx = ballPosRef.current.x + ballVelRef.current.vx;
          let by = ballPosRef.current.y + ballVelRef.current.vy;

          // Wall collisions (Left & Right)
          if (bx - ballRadius <= 5) {
            bx = 5 + ballRadius;
            ballVelRef.current.vx = Math.abs(ballVelRef.current.vx);
            playHitSound(420, 'sine', 0.04);
          } else if (bx + ballRadius >= CANVAS_WIDTH - 5) {
            bx = CANVAS_WIDTH - 5 - ballRadius;
            ballVelRef.current.vx = -Math.abs(ballVelRef.current.vx);
            playHitSound(420, 'sine', 0.04);
          }

          // Wall collision (Top)
          if (by - ballRadius <= 5) {
            by = 5 + ballRadius;
            ballVelRef.current.vy = Math.abs(ballVelRef.current.vy);
            playHitSound(440, 'sine', 0.05);
          }

          // Paddle collision
          if (
            by + ballRadius >= paddleY &&
            by - ballRadius <= paddleY + paddleHeight &&
            bx >= paddleXRef.current - 4 &&
            bx <= paddleXRef.current + paddleWidth + 4
          ) {
            by = paddleY - ballRadius;
            // Calculate bounce angle based on where ball hits the paddle
            const hitPoint = (bx - (paddleXRef.current + paddleWidth / 2)) / (paddleWidth / 2); // -1 to 1
            const maxAngle = (65 * Math.PI) / 180;
            const bounceAngle = hitPoint * maxAngle;
            const currentSpeed = Math.sqrt(
              ballVelRef.current.vx * ballVelRef.current.vx + ballVelRef.current.vy * ballVelRef.current.vy
            );
            const speed = Math.max(currentSpeed, 6.4);

            ballVelRef.current.vx = Math.sin(bounceAngle) * speed;
            ballVelRef.current.vy = -Math.cos(bounceAngle) * speed;
            playHitSound(580, 'triangle', 0.06);
            addParticles(bx, paddleY, '#ffb480');
          }

          // Bottom wall: Miss ball / lose life
          if (by - ballRadius > CANVAS_HEIGHT) {
            playLoseLifeSound();
            let isGameOver = false;

            setLives((prevLives) => {
              const newLives = prevLives - 1;
              if (newLives <= 0) {
                isGameOver = true;
                setGameResult('failure');
                if (bgmRef.current) bgmRef.current.pause();
              }
              return newLives;
            });

            if (!isGameOver) {
              // 발판(패들) 위로 공 즉시 위치 이동 및 위쪽으로 재발사
              const currentPaddleX = paddleXRef.current;
              bx = currentPaddleX + paddleWidth / 2;
              by = paddleY - ballRadius - 4;
              ballPosRef.current = { x: bx, y: by };

              const angle = (Math.random() * 40 - 20) * (Math.PI / 180); // -20 to +20도
              const speed = 6.2;
              ballVelRef.current = {
                vx: Math.sin(angle) * speed,
                vy: -Math.cos(angle) * speed,
              };
              ballStuckRef.current = false;
            } else {
              return;
            }
          }

          // Brick collision detection
          for (const brick of bricksRef.current) {
            if (!brick.alive) continue;

            if (
              bx + ballRadius >= brick.x &&
              bx - ballRadius <= brick.x + brick.w &&
              by + ballRadius >= brick.y &&
              by - ballRadius <= brick.y + brick.h
            ) {
              brick.alive = false;
              playHitSound(740, 'sine', 0.08);

              const pInfo = BRICK_PALETTE[brick.colorKey];
              addParticles(brick.x + brick.w / 2, brick.y + brick.h / 2, pInfo.fill);

              // Check if it was light red
              if (pInfo.isTargetRed) {
                setRedBricksDestroyed((prev) => {
                  const updated = prev + 1;
                  if (updated >= 3 && !hasSavedRecordRef.current) {
                    hasSavedRecordRef.current = true;
                    setGameResult('success');
                    if (bgmRef.current) bgmRef.current.pause();

                    // Calculate final game clear time (finishtime in m:ss format, e.g. "0:14")
                    const now = Date.now();
                    const startTime = gameStartTimeRef.current || now;
                    const elapsedMs = Math.max(0, now - startTime - totalPausedDurationRef.current);
                    const totalSec = Math.floor(elapsedMs / 1000);
                    const m = Math.floor(totalSec / 60);
                    const s = String(totalSec % 60).padStart(2, '0');
                    const formattedFinishTime = `${m}:${s}`;
                    setFinalTimeStr(formattedFinishTime);

                    // Save to Google Sheets ONLY on game success (딱 1회만 호출 보장)
                    saveGameRecord(formattedFinishTime, totalSec);
                  }
                  return updated;
                });
              }

              // Determine collision side (vertical vs horizontal)
              const overlapLeft = bx + ballRadius - brick.x;
              const overlapRight = brick.x + brick.w - (bx - ballRadius);
              const overlapTop = by + ballRadius - brick.y;
              const overlapBottom = brick.y + brick.h - (by - ballRadius);

              const minOverlapX = Math.min(overlapLeft, overlapRight);
              const minOverlapY = Math.min(overlapTop, overlapBottom);

              if (minOverlapX < minOverlapY) {
                ballVelRef.current.vx = -ballVelRef.current.vx;
              } else {
                ballVelRef.current.vy = -ballVelRef.current.vy;
              }
              break; // Handle one brick per frame
            }
          }

          ballPosRef.current.x = bx;
          ballPosRef.current.y = by;
        }
      }

      // 3. Render Crayon Textured Bricks
      bricksRef.current.forEach((brick) => {
        if (!brick.alive) return;
        const info = BRICK_PALETTE[brick.colorKey];
        const j = brick.roughJitter;

        ctx.save();
        // Crayon rough fill
        ctx.fillStyle = info.fill;
        ctx.beginPath();
        ctx.roundRect(brick.x, brick.y, brick.w, brick.h, 6);
        ctx.fill();

        // Crayon texture strokes (cross hatch scribbles inside)
        ctx.strokeStyle = info.border;
        ctx.lineWidth = 1.8;
        ctx.lineCap = 'round';

        // Chalky/crayon rough outline
        ctx.beginPath();
        ctx.moveTo(brick.x + j[0], brick.y + j[1]);
        ctx.lineTo(brick.x + brick.w + j[2], brick.y + j[3]);
        ctx.lineTo(brick.x + brick.w + j[4], brick.y + brick.h + j[5]);
        ctx.lineTo(brick.x + j[6], brick.y + brick.h + j[7]);
        ctx.closePath();
        ctx.stroke();

        // Inner crayon crayon hatching
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 1.5;
        for (let i = 8; i < brick.w - 6; i += 12) {
          ctx.beginPath();
          ctx.moveTo(brick.x + i, brick.y + 4);
          ctx.lineTo(brick.x + i + 8, brick.y + brick.h - 4);
          ctx.stroke();
        }

        // Highlight target red bricks with a cute target indicator
        if (info.isTargetRed) {
          ctx.fillStyle = '#b33939';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('★TARGET', brick.x + brick.w / 2, brick.y + brick.h / 2 + 4);
        }

        ctx.restore();
      });

      // 4. Render Crayon Paddle
      ctx.save();
      const px = paddleXRef.current;
      // Paddle shadow
      ctx.fillStyle = '#dcd4c7';
      ctx.beginPath();
      ctx.roundRect(px + 2, paddleY + 3, paddleWidth, paddleHeight, 8);
      ctx.fill();

      // Paddle body (crayon warm wooden/clay tone)
      ctx.fillStyle = '#f8b195';
      ctx.beginPath();
      ctx.roundRect(px, paddleY, paddleWidth, paddleHeight, 8);
      ctx.fill();

      // Crayon rough border
      ctx.strokeStyle = '#c06c84';
      ctx.lineWidth = 2.4;
      ctx.stroke();

      // Paddle grip texture
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      for (let i = 20; i < paddleWidth - 15; i += 14) {
        ctx.beginPath();
        ctx.moveTo(px + i, paddleY + 3);
        ctx.lineTo(px + i, paddleY + paddleHeight - 3);
        ctx.stroke();
      }
      ctx.restore();

      // 5. Render Crayon Ball (Rough textured circle)
      ctx.save();
      const bx = ballPosRef.current.x;
      const by = ballPosRef.current.y;

      // Ball shadow
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.beginPath();
      ctx.arc(bx + 2, by + 3, ballRadius, 0, Math.PI * 2);
      ctx.fill();

      // Ball body
      ctx.fillStyle = '#ff6f69';
      ctx.beginPath();
      ctx.arc(bx, by, ballRadius, 0, Math.PI * 2);
      ctx.fill();

      // Crayon rough border around ball
      ctx.strokeStyle = '#d43d38';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bx + (Math.random() - 0.5) * 1.5, by + (Math.random() - 0.5) * 1.5, ballRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Ball crayon highlight
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(bx - 2.5, by - 2.5, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 6. Render Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12; // gravity
        p.alpha -= 0.025;
        p.life -= 0.025;

        if (p.alpha <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        // rough jitter particle
        ctx.fillRect(p.x + (Math.random() - 0.5), p.y + (Math.random() - 0.5), p.size, p.size);
        ctx.restore();
      }

      // Loop
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    isGameStarted,
    isPaused,
    gameResult,
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    paddleWidth,
    paddleHeight,
    paddleY,
    ballRadius,
    playHitSound,
    playLoseLifeSound,
    startCountdown,
  ]);

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-3 sm:p-6 md:p-8 font-body text-slate-700 selection:bg-amber-200 selection:text-slate-900">
      {/* Hidden Audio Element for BGM */}
      <audio ref={bgmRef} src="/Hyper_Speed_Run.mp3" loop preload="auto" />

      {/* MAIN SKETCHBOOK DESKTOP WRAPPER */}
      <main className="relative w-full max-w-5xl mx-auto">
        {/* Desk Props: Left Sky Crayon */}
        <div aria-hidden="true" className="absolute -top-6 -left-6 z-20 pointer-events-none hidden md:block">
          <div className="w-24 h-6 bg-sky-400 rounded-sm transform -rotate-12 shadow-md flex items-center border border-sky-500">
            <div className="w-5 h-full bg-sky-300 rounded-l-sm"></div>
            <span className="text-[9px] font-hand font-bold text-sky-900 pl-2">CRAYON</span>
          </div>
        </div>

        {/* Desk Props: Bottom-Left Sunny Crayon */}
        <div aria-hidden="true" className="absolute -bottom-5 -left-4 z-20 pointer-events-none hidden sm:block">
          <div className="w-20 h-5 bg-amber-300 rounded-sm transform rotate-45 shadow-sm border border-amber-400 flex items-center">
            <div className="w-4 h-full bg-amber-200"></div>
            <span className="text-[8px] font-hand font-bold text-amber-800 pl-1">SUNNY</span>
          </div>
          <div className="w-2 h-2 rounded-full bg-slate-300 ml-12 -mt-2 opacity-60"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-16 mt-1 opacity-50"></div>
        </div>

        {/* Desk Props: Top-Right Mini Doodle Bricks */}
        <div aria-hidden="true" className="absolute -top-4 right-16 z-0 hidden lg:flex gap-1.5 opacity-80 rotate-6">
          <span className="w-6 h-3 bg-rose-300 rounded-sm border border-slate-700"></span>
          <span className="w-6 h-3 bg-amber-300 rounded-sm border border-slate-700"></span>
          <span className="w-6 h-3 bg-sky-300 rounded-sm border border-slate-700"></span>
        </div>

        {/* SKETCHBOOK BODY */}
        <div className="relative bg-white rounded-3xl shadow-sketchbook overflow-hidden border-2 border-slate-300/80 paper-texture">
          {/* Spiral Binder Header */}
          <div className="h-10 bg-slate-200/70 border-b border-slate-300/60 flex items-center justify-around px-6 relative">
            <div className="absolute inset-x-0 h-4 top-3 flex justify-evenly">
              <div className="w-3.5 h-7 -mt-2 bg-gradient-to-b from-slate-400 via-slate-200 to-slate-500 rounded-full shadow-inner border border-slate-400"></div>
              <div className="w-3.5 h-7 -mt-2 bg-gradient-to-b from-slate-400 via-slate-200 to-slate-500 rounded-full shadow-inner border border-slate-400"></div>
              <div className="w-3.5 h-7 -mt-2 bg-gradient-to-b from-slate-400 via-slate-200 to-slate-500 rounded-full shadow-inner border border-slate-400"></div>
              <div className="w-3.5 h-7 -mt-2 bg-gradient-to-b from-slate-400 via-slate-200 to-slate-500 rounded-full shadow-inner border border-slate-400 hidden sm:block"></div>
              <div className="w-3.5 h-7 -mt-2 bg-gradient-to-b from-slate-400 via-slate-200 to-slate-500 rounded-full shadow-inner border border-slate-400 hidden sm:block"></div>
              <div className="w-3.5 h-7 -mt-2 bg-gradient-to-b from-slate-400 via-slate-200 to-slate-500 rounded-full shadow-inner border border-slate-400"></div>
              <div className="w-3.5 h-7 -mt-2 bg-gradient-to-b from-slate-400 via-slate-200 to-slate-500 rounded-full shadow-inner border border-slate-400"></div>
              <div className="w-3.5 h-7 -mt-2 bg-gradient-to-b from-slate-400 via-slate-200 to-slate-500 rounded-full shadow-inner border border-slate-400 hidden md:block"></div>
              <div className="w-3.5 h-7 -mt-2 bg-gradient-to-b from-slate-400 via-slate-200 to-slate-500 rounded-full shadow-inner border border-slate-400 hidden md:block"></div>
              <div className="w-3.5 h-7 -mt-2 bg-gradient-to-b from-slate-400 via-slate-200 to-slate-500 rounded-full shadow-inner border border-slate-400"></div>
              <div className="w-3.5 h-7 -mt-2 bg-gradient-to-b from-slate-400 via-slate-200 to-slate-500 rounded-full shadow-inner border border-slate-400"></div>
            </div>
          </div>

          {/* Sketchbook Interior Content */}
          <div className="p-5 sm:p-8 md:p-10 relative">
            {/* Top Doodle Header Banner */}
            <div className="flex items-center justify-between pb-4 border-b-2 border-dashed border-sky-200/90 mb-6">
              <div className="flex items-center space-x-2">
                <span className="inline-block w-3 h-3 rounded-full bg-rose-400 animate-pulse"></span>
                <span className="inline-block w-3 h-3 rounded-full bg-amber-400"></span>
                <span className="inline-block w-3 h-3 rounded-full bg-sky-400"></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-xs sm:text-sm font-hand text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200 font-bold">
                  ★ 인천대학교 특별판 🎮
                </div>
                {/* Audio Mute button during game */}
                {isGameStarted && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMuted((m) => {
                        const next = !m;
                        if (bgmRef.current) {
                          bgmRef.current.muted = next;
                        }
                        return next;
                      });
                    }}
                    className="flex items-center gap-1.5 border-slate-300 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer h-7 px-2 text-xs font-hand"
                  >
                    {muted ? <VolumeX className="w-3.5 h-3.5 text-red-500" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-600" />}
                    <span>{muted ? '소리 켜기' : '소리 끄기'}</span>
                  </Button>
                )}
              </div>
            </div>

            {!isGameStarted ? (
              /* ==============================================================
                 SCREEN 1: WELCOME SCREEN (Matches screen.png & DESIGN.md)
                 ============================================================== */
              <div className="flex flex-col items-center justify-center text-center">
                {/* Mascot Frame Section */}
                <div className="relative group my-2 animate-gentle-wiggle">
                  {/* Masking tape on top */}
                  <div className="masking-tape absolute -top-3.5 left-1/2 -translate-x-1/2 w-28 h-6 z-10 flex items-center justify-center">
                    <span className="text-[10px] font-hand text-amber-800 opacity-70 tracking-widest uppercase">tape :: INU</span>
                  </div>

                  {/* Photo frame card */}
                  <div className="w-56 h-56 sm:w-64 sm:h-64 bg-white doodle-box p-4 shadow-paper-float border-2 border-slate-700/80 relative flex flex-col items-center justify-center bg-gradient-to-b from-white via-orange-50/20 to-amber-50/30">
                    <div className="w-full h-full doodle-border-dash bg-amber-50/40 flex flex-col items-center justify-center p-2 relative overflow-hidden group">
                      {/* Orange flame glow background */}
                      <div className="absolute w-36 h-36 rounded-full bg-orange-300/25 blur-2xl pointer-events-none"></div>

                      {/* Mascot Image (Mascot.jpg) */}
                      <div className="relative w-28 h-28 sm:w-32 sm:h-32 mb-1 drop-shadow-sm transition-transform duration-300 group-hover:scale-105">
                        <Image
                          src="/Mascot.jpg"
                          alt="인천대학교 마스코트 횃불이"
                          fill
                          priority
                          sizes="(max-width: 640px) 112px, 128px"
                          className="object-contain"
                        />
                      </div>

                      <span className="font-display text-base sm:text-lg text-slate-800 tracking-wide">
                        마스코트 횃불이
                      </span>
                      <span className="text-xs font-hand text-slate-500">
                        인천대학교 공식 마스코트
                      </span>
                    </div>
                  </div>

                  {/* Sparkle badge */}
                  <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-yellow-200 rounded-full border border-slate-700 flex items-center justify-center text-xs shadow-sm">
                    ✨
                  </div>
                </div>

                {/* Title Section */}
                <div className="mt-4 mb-4">
                  <div className="inline-block relative">
                    <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-sky-600 tracking-wider filter drop-shadow-[2px_3px_0px_rgba(56,189,248,0.3)]">
                      INU 벽돌깨기
                    </h1>
                    {/* Crayon Underline SVG */}
                    <svg className="w-full h-4 text-sky-300 -mt-1" fill="none" preserveAspectRatio="none" viewBox="0 0 300 20">
                      <path d="M5 12 Q 75 4, 150 11 T 295 10" opacity="0.6" stroke="#38bdf8" strokeLinecap="round" strokeWidth="6"></path>
                    </svg>
                  </div>
                  <p className="font-hand text-lg sm:text-xl text-slate-600 mt-1 font-bold">
                    인천대학교 횃불이와 함께하는 신나는 블록 격파!
                  </p>
                </div>

                {/* Nickname Form */}
                <form
                  className="w-full max-w-sm space-y-4 px-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (userName.trim()) startGame();
                  }}
                >
                  <div className="relative text-left">
                    <label className="block font-hand text-base sm:text-lg text-slate-600 font-bold mb-1 ml-2" htmlFor="playerName">
                      ✏️ 도전자 이름을 적어주세요
                    </label>
                    <div className="relative">
                      <input
                        id="playerName"
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="예: 횃불이대장"
                        maxLength={10}
                        required
                        className="w-full bg-sky-50/60 font-hand text-xl px-4 py-3 rounded-2xl border-2 border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:bg-white placeholder-slate-400 text-slate-800 transition-all shadow-[2px_3px_0px_#334155]"
                        autoFocus
                      />
                      <span className="absolute right-3.5 top-3.5 text-base text-slate-400 pointer-events-none font-hand font-bold">
                        (최대 10자)
                      </span>
                    </div>
                  </div>

                  {/* Cloud Start Game Button */}
                  <button
                    type="submit"
                    disabled={!userName.trim()}
                    className="cloud-btn w-full py-3.5 px-6 bg-sky-400 hover:bg-sky-500 disabled:opacity-60 text-white font-display text-2xl tracking-wider rounded-3xl border-2 border-slate-700 shadow-clay-button active:shadow-clay-button-active flex items-center justify-center space-x-2 group cursor-pointer"
                  >
                    <span>게임 시작!</span>
                    <span className="transform transition-transform group-hover:translate-x-1.5 text-xl">🚀</span>
                  </button>
                </form>

                {/* Creator Note at Bottom Right (from DESIGN.md) */}
                <div className="w-full mt-6 pt-4 border-t border-slate-200/60 flex justify-end">
                  <aside className="relative max-w-xs sm:max-w-sm bg-amber-50 p-3 sm:p-4 rounded-xl border-2 border-slate-600 shadow-[3px_4px_0px_rgba(51,65,85,0.7)] rotate-1 hover:rotate-0 transition-transform">
                    {/* Top tape */}
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-16 h-4 bg-sky-200/90 rounded-sm border border-sky-300"></div>
                    <div className="flex items-start space-x-2.5">
                      <span className="text-xl">🏷️</span>
                      <div className="text-left font-hand">
                        <div className="text-xs font-bold text-slate-500 border-b border-amber-200 pb-0.5 mb-1 flex items-center justify-between">
                          <span>CREATOR INFO</span>
                          <span className="text-[10px] text-amber-700">INU PROJECT</span>
                        </div>
                        <p className="text-sm sm:text-base font-bold text-slate-800 leading-snug">
                          제작자 | 인천대학교 분자의생명전공
                        </p>
                        <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                          학번: <span className="font-bold text-slate-700">202202478</span> | 성명: <span className="font-bold text-slate-800">안희진</span>
                        </p>
                      </div>
                    </div>
                  </aside>
                </div>
              </div>
            ) : (
              /* ==============================================================
                 SCREEN 2: GAMEPLAY SCREEN (Fully Mobile Responsive)
                 ============================================================== */
              <div className="w-full flex flex-col items-center gap-2 sm:gap-3">
                {/* Top Status Bar: Responsive grid/flex layout */}
                <div className="w-full max-w-[800px] flex flex-wrap items-center justify-between gap-1.5 sm:gap-3 bg-amber-50/80 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl border-2 border-slate-700 shadow-[2px_3px_0px_#334155]">
                  <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap">
                    <span className="font-hand font-bold text-xs sm:text-base text-slate-800 bg-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg border border-slate-400">
                      선수: <strong className="text-sky-700">{userName}</strong>
                    </span>

                    {/* Target Red Block Progress */}
                    <div className="flex items-center gap-1 font-hand font-bold text-xs sm:text-sm bg-rose-100 text-rose-800 px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg border border-rose-300">
                      <span className="inline-block w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-sm bg-[#ff9aa2] border border-[#e8737d]" />
                      <span>
                        빨강: <strong className="text-sm sm:text-base text-rose-900">{redBricksDestroyed}</strong> / 3개
                      </span>
                    </div>

                    {/* Live Play Timer */}
                    <div className="flex items-center gap-1 font-hand font-bold text-xs sm:text-sm bg-sky-100 text-sky-800 px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg border border-sky-300">
                      <span>⏱️</span>
                      <span>
                        시간: <strong className="text-sm sm:text-base text-sky-900 font-mono">
                          {Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, '0')}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Lives (Hearts) */}
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <span className="font-hand font-bold text-xs sm:text-sm text-slate-600 mr-0.5">생명:</span>
                    {[1, 2, 3].map((heartIndex) => (
                      <Heart
                        key={heartIndex}
                        className={`w-4 h-4 sm:w-5 sm:h-5 transition-all ${
                          heartIndex <= lives
                            ? 'fill-rose-500 text-rose-500 scale-100 drop-shadow-sm'
                            : 'fill-slate-200 text-slate-300 scale-90'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Game Canvas Box */}
                <div className="relative w-full max-w-[800px] aspect-[800/540] rounded-xl sm:rounded-2xl overflow-hidden border-2 sm:border-3 border-slate-700 shadow-[3px_4px_0px_#334155] sm:shadow-[4px_6px_0px_#334155] bg-[#fdfcf9] touch-none">
                  <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchEnd}
                    className="w-full h-full block cursor-ew-resize select-none"
                  />

                  {/* Ready Countdown Overlay (3, 2, 1) */}
                  {countdown !== null && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-3 text-center animate-fade-in pointer-events-none">
                      <div className="text-white font-hand text-lg sm:text-2xl font-bold tracking-widest mb-1 drop-shadow">
                        준비하세요!
                      </div>
                      <div className="font-display text-6xl sm:text-9xl text-[#ffea79] drop-shadow-[0_6px_10px_rgba(0,0,0,0.5)] animate-bounce">
                        {countdown}
                      </div>
                    </div>
                  )}

                  {/* Paused Overlay */}
                  {isPaused && !gameResult && countdown === null && (
                    <div className="absolute inset-0 bg-black/55 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center text-white">
                      <Pause className="w-10 h-10 sm:w-14 sm:h-14 mb-1 text-yellow-300 animate-pulse" />
                      <h3 className="font-display text-2xl sm:text-3xl mb-1">일시 정지됨</h3>
                      <p className="font-hand text-sm sm:text-lg text-zinc-200 mb-3">공의 움직임이 멈추었습니다.</p>
                      <button
                        onClick={handleTogglePause}
                        className="cloud-btn bg-amber-400 hover:bg-amber-500 text-slate-900 font-display text-base sm:text-lg px-5 py-2 sm:px-6 sm:py-2.5 rounded-2xl border-2 border-slate-700 shadow-clay-button cursor-pointer"
                      >
                        게임 계속하기
                      </button>
                    </div>
                  )}

                  {/* Mission Complete (Success) Overlay */}
                  {gameResult === 'success' && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 text-center animate-in zoom-in-95 duration-200 overflow-y-auto">
                      <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-emerald-100 border-2 border-emerald-400 flex items-center justify-center text-emerald-600 mb-1.5 sm:mb-2 shadow-inner shrink-0">
                        <Trophy className="w-6 h-6 sm:w-8 sm:h-8" />
                      </div>
                      <h3 className="font-display text-xl sm:text-3xl md:text-4xl text-emerald-700 mb-1 flex items-center justify-center gap-1.5 leading-tight">
                        <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-500 shrink-0" />
                        미션 성공! 축하합니다!
                        <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-500 shrink-0" />
                      </h3>
                      <p className="font-hand text-sm sm:text-lg md:text-xl text-slate-700 font-bold mb-0.5 leading-snug">
                        <strong className="text-emerald-800">{userName}</strong> 님이 연한 빨강 벽돌 3개를 모두 제거하였습니다!
                      </p>

                      {/* Clear Time & Google Sheets Sync Notice */}
                      <div className="my-1.5 p-2 bg-amber-50 rounded-xl border border-amber-300 max-w-sm w-full">
                        <div className="font-hand font-bold text-base sm:text-lg text-amber-900 flex items-center justify-center gap-1.5">
                          ⏱️ 완료 시간 (finishtime): <span className="font-display text-xl sm:text-2xl text-emerald-700">{finalTimeStr}</span>
                        </div>
                        <div className="text-[11px] sm:text-xs font-hand font-bold mt-0.5 text-slate-600">
                          {saveStatus === 'saving' && '📊 구글 시트에 기록 저장 및 랭킹 갱신 중...'}
                          {saveStatus === 'saved' && '✅ 구글 시트 저장 완료!'}
                          {saveStatus === 'error' && '⚠️ 구글 시트 전송 실패 (로컬 랭킹 적용)'}
                          {saveStatus === 'idle' && '구글 시트 저장 대기 중'}
                        </div>
                      </div>

                      {/* TOP 3 RANKINGS (전당 순위표) */}
                      <div className="w-full max-w-sm bg-gradient-to-b from-amber-50/90 to-orange-50/90 p-2.5 sm:p-3 rounded-2xl border-2 border-slate-700 shadow-[2px_3px_0px_#334155] my-1 text-left">
                        <div className="flex items-center justify-between border-b border-amber-300 pb-1 mb-1.5">
                          <span className="font-display text-sm sm:text-base text-slate-800 flex items-center gap-1">
                            🏆 명예의 전당 Top 3 (빠른 순)
                          </span>
                          <span className="text-[10px] font-hand font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full">
                            {isLoadingRankings ? '동기화 중...' : '실시간 집계'}
                          </span>
                        </div>

                        {topRankings.length === 0 ? (
                          <div className="py-2 text-center font-hand text-xs text-slate-500 font-bold">
                            아직 등록된 랭킹 기록이 없습니다.
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {topRankings.map((rank, idx) => {
                              const badgeEmoji = idx === 0 ? '🥇 1등' : idx === 1 ? '🥈 2등' : '🥉 3등';
                              const isCurrentPlayer = rank.name === userName && rank.time === finalTimeStr;
                              return (
                                <div
                                  key={idx}
                                  className={`flex items-center justify-between px-2.5 py-1 rounded-xl font-hand text-xs sm:text-sm font-bold border transition-colors ${
                                    isCurrentPlayer
                                      ? 'bg-amber-200/90 border-amber-400 text-amber-950 shadow-sm'
                                      : 'bg-white/80 border-amber-200 text-slate-800'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs sm:text-sm">{badgeEmoji}</span>
                                    <span className="truncate max-w-[110px] sm:max-w-[140px]">
                                      {rank.name}
                                      {isCurrentPlayer && <span className="text-[10px] ml-1 text-emerald-700">(나)</span>}
                                    </span>
                                  </div>
                                  <div className="font-mono text-xs sm:text-sm text-sky-800 font-extrabold bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-200">
                                    {rank.time}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 sm:gap-3 flex-wrap justify-center mt-2">
                        <button
                          onClick={handleRestart}
                          className="cloud-btn bg-emerald-500 hover:bg-emerald-600 text-white font-display text-sm sm:text-base md:text-lg px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl border-2 border-slate-700 shadow-clay-button cursor-pointer flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          다시 도전
                        </button>
                        <button
                          onClick={handleExit}
                          className="cloud-btn bg-white hover:bg-slate-50 text-slate-700 font-display text-sm sm:text-base md:text-lg px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl border-2 border-slate-700 shadow-[2px_3px_0px_#334155] cursor-pointer flex items-center gap-1"
                        >
                          <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          이름 화면으로
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Mission Failed Overlay */}
                  {gameResult === 'failure' && (
                    <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 text-center animate-in zoom-in-95 duration-200 text-white overflow-y-auto">
                      <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-rose-400 mb-1.5 sm:mb-2 shrink-0">
                        <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8" />
                      </div>
                      <h3 className="font-display text-2xl sm:text-4xl text-rose-400 mb-1 leading-tight">게임 미션 실패</h3>
                      <p className="font-hand text-sm sm:text-lg text-slate-200 max-w-sm mb-3 sm:mb-4 leading-snug font-bold">
                        공을 모두 놓쳐 생명을 모두 소진하였습니다.<br />
                        미션이 실패하여 시간은 측정되지 않습니다.
                      </p>

                      <div className="flex gap-2 sm:gap-3 flex-wrap justify-center">
                        <button
                          onClick={handleRestart}
                          className="cloud-btn bg-rose-500 hover:bg-rose-600 text-white font-display text-sm sm:text-base md:text-lg px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl border-2 border-slate-800 shadow-clay-button cursor-pointer flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          다시 시작
                        </button>
                        <button
                          onClick={handleExit}
                          className="cloud-btn bg-slate-800 border-2 border-slate-600 hover:bg-slate-700 text-slate-200 font-display text-sm sm:text-base md:text-lg px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl shadow-[2px_3px_0px_#334155] cursor-pointer flex items-center gap-1"
                        >
                          <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          메인 화면
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Controls Bar in Hand-Drawn Crayon Style */}
                <div className="w-full max-w-[800px] flex items-center justify-end gap-1.5 sm:gap-3 bg-white/90 p-2 sm:p-2.5 rounded-xl border-2 border-slate-700 shadow-[2px_3px_0px_#334155]">
                  <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-center sm:justify-end">
                    {/* 일시정지 버튼 */}
                    <button
                      onClick={handleTogglePause}
                      disabled={Boolean(gameResult) || countdown !== null}
                      className="cloud-btn flex-1 sm:flex-none border-2 border-slate-700 bg-amber-50 hover:bg-amber-100 text-slate-800 font-display text-sm sm:text-base px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-[2px_2px_0px_#334155] cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {isPaused ? <Play className="w-4 h-4 text-emerald-600" /> : <Pause className="w-4 h-4 text-amber-600" />}
                      <span>{isPaused ? '계속' : '일시정지'}</span>
                    </button>

                    {/* 다시 시작 버튼 */}
                    <button
                      onClick={handleRestart}
                      className="cloud-btn flex-1 sm:flex-none border-2 border-slate-700 bg-sky-50 hover:bg-sky-100 text-slate-800 font-display text-sm sm:text-base px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-[2px_2px_0px_#334155] cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-4 h-4 text-sky-600" />
                      <span>다시 시작</span>
                    </button>

                    {/* 게임 종료 버튼 */}
                    <button
                      onClick={handleExit}
                      className="cloud-btn flex-1 sm:flex-none border-2 border-slate-700 bg-rose-400 hover:bg-rose-500 text-white font-display text-sm sm:text-base px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-[2px_2px_0px_#334155] cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>종료</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

