<!DOCTYPE html>

<html lang="ko"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>INU 벽돌깨기 - 아기자기 손그림 스케치북</title>
<!-- Tailwind CSS CDN -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<!-- Google Fonts: Gaegu (손글씨 감성) & Gowun Dodum -->
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Gaegu:wght@400;700&amp;family=Gowun+Dodum&amp;family=Jua&amp;display=swap" rel="stylesheet"/>
<!-- Tailwind Custom Config -->
<script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            doodle: {
              sky: '#7cc2eb',
              skySoft: '#c2e4fa',
              skyLight: '#ebf6fd',
              cream: '#fdfbf7',
              paper: '#fffdfa',
              pencil: '#334155',
              crayonYellow: '#fcd34d',
              crayonOrange: '#fb923c',
              crayonRed: '#f87171',
              tape: 'rgba(254, 240, 138, 0.75)',
            }
          },
          fontFamily: {
            hand: ['"Gaegu"', 'cursive', 'sans-serif'],
            display: ['"Jua"', 'sans-serif'],
            body: ['"Gowun Dodum"', 'sans-serif'],
          },
          boxShadow: {
            'sketchbook': '0 25px 50px -12px rgba(71, 107, 138, 0.28), 0 0 0 1px rgba(0,0,0,0.04)',
            'paper-float': '4px 6px 16px rgba(0, 0, 0, 0.08)',
            'clay-button': '0 6px 0 #4fa5d8, 0 10px 15px rgba(0,0,0,0.1)',
            'clay-button-active': '0 2px 0 #4fa5d8, 0 4px 6px rgba(0,0,0,0.1)',
          }
        }
      }
    }
  </script>
<!-- BEGIN: Custom Hand-Drawn Styles -->
<style data-purpose="hand-drawn-effects">
    /* 울퉁불퉁한 손그림 느낌의 보더 테두리 */
    .doodle-border {
      border: 3px solid #334155;
      border-radius: 255px 15px 225px 15px/15px 225px 15px 255px;
    }
    
    .doodle-box {
      border-radius: 255px 25px 225px 25px/25px 225px 25px 255px;
    }

    .doodle-border-dash {
      border: 2.5px dashed #64748b;
      border-radius: 220px 20px 240px 18px/18px 240px 20px 220px;
    }

    /* 스프링 스케치북 바인더 구멍 */
    .binder-rings {
      background-image: radial-gradient(circle, #cbd5e1 35%, #94a3b8 42%, #475569 50%, transparent 55%);
      background-size: 32px 32px;
      background-position: center;
    }

    /* 마스킹 테이프 양끝 톱니 효과 */
    .masking-tape {
      background-color: rgba(254, 240, 138, 0.85);
      backdrop-filter: blur(2px);
      box-shadow: 0 2px 4px rgba(0,0,0,0.06);
      clip-path: polygon(3% 0%, 97% 0%, 100% 50%, 97% 100%, 3% 100%, 0% 50%);
    }

    /* 구름 모양 둥글둥글 버튼 스타일 */
    .cloud-btn {
      transition: all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .cloud-btn:hover {
      transform: translateY(-2px) scale(1.02);
    }
    .cloud-btn:active {
      transform: translateY(4px) scale(0.99);
    }

    /* 부드러운 손그림 종이 질감 패턴 */
    .paper-texture {
      background-color: #fdfcf9;
      background-image: 
        radial-gradient(#e2e8f0 0.75px, transparent 0.75px),
        radial-gradient(#e2e8f0 0.75px, #fdfcf9 0.75px);
      background-size: 30px 30px;
      background-position: 0 0, 15px 15px;
    }

    /* 흔들리는 낙서 애니메이션 */
    @keyframes gentle-wiggle {
      0%, 100% { transform: rotate(-2deg); }
      50% { transform: rotate(2deg); }
    }
    .animate-gentle-wiggle {
      animation: gentle-wiggle 4s ease-in-out infinite;
    }
  </style>
<!-- END: Custom Hand-Drawn Styles -->
</head>
<body class="min-h-screen bg-slate-100 flex items-center justify-center p-3 sm:p-6 md:p-8 font-body text-slate-700 selection:bg-amber-200 selection:text-slate-900">
<!-- BEGIN: MainContainer -->
<!-- 바탕 책상/배경 및 전체 레이아웃 래퍼 -->
<main class="relative w-full max-w-5xl mx-auto" data-purpose="sketchbook-desktop-wrapper">
<!-- 책상 위 데코 오브젝트 (크레파스, 지우개, 낙서 블록들) -->
<!-- BEGIN: DesktopProps -->
<div aria-hidden="true" class="absolute -top-6 -left-6 z-20 pointer-events-none hidden md:block">
<!-- 하늘색 크레파스 -->
<div class="w-24 h-6 bg-sky-400 rounded-sm transform -rotate-12 shadow-md flex items-center border border-sky-500">
<div class="w-5 h-full bg-sky-300 rounded-l-sm"></div>
<span class="text-[9px] font-hand font-bold text-sky-900 pl-2">CRAYON</span>
</div>
</div>
<div aria-hidden="true" class="absolute -bottom-5 -left-4 z-20 pointer-events-none hidden sm:block">
<!-- 노란색 뒹구는 크레파스 & 지우개 가루 -->
<div class="w-20 h-5 bg-amber-300 rounded-sm transform rotate-45 shadow-sm border border-amber-400 flex items-center">
<div class="w-4 h-full bg-amber-200"></div>
<span class="text-[8px] font-hand font-bold text-amber-800 pl-1">SUNNY</span>
</div>
<div class="w-2 h-2 rounded-full bg-slate-300 ml-12 -mt-2 opacity-60"></div>
<div class="w-1.5 h-1.5 rounded-full bg-slate-300 ml-16 mt-1 opacity-50"></div>
</div>
<!-- 스케치북 뒤 귀여운 미니 손그림 벽돌들 데코레이션 -->
<div aria-hidden="true" class="absolute -top-4 right-16 z-0 hidden lg:flex gap-1.5 opacity-80 rotate-6">
<span class="w-6 h-3 bg-rose-300 rounded-sm border border-slate-700"></span>
<span class="w-6 h-3 bg-amber-300 rounded-sm border border-slate-700"></span>
<span class="w-6 h-3 bg-sky-300 rounded-sm border border-slate-700"></span>
</div>
<!-- END: DesktopProps -->
<!-- BEGIN: SketchbookBody -->
<!-- 메인 스케치북 프레임 (스프링 바인더 + 종이 본체) -->
<div class="relative bg-white rounded-3xl shadow-sketchbook overflow-hidden border-2 border-slate-300/80 paper-texture">
<!-- 상단 스프링 제본 바인더 홀 (Ring Binder Effect) -->
<div class="h-10 bg-slate-200/70 border-b border-slate-300/60 flex items-center justify-around px-6 relative" data-purpose="spiral-rings-header">
<div class="absolute inset-x-0 h-4 top-3 flex justify-evenly">
<!-- 스프링 고리 반복 생성 -->
<div class="w-3.5 h-7 -mt-2 bg-gradient-to-b from-slate-400 via-slate-200 to-slate-500 rounded-full shadow-inner border border-slate-400"></div>
<div class="w-3.5 h-7 -mt-2 bg-gradient-to-b from-slate-400 via-slate-200 to-slate-500 rounded-full shadow-inner border border-slate-400"></div>
<div class="w-3.5 h-7 -mt-2 bg-gradient-to-b from-slate-400 via-slate-200 to-slate-500 rounded-full shadow-inner border border-slate-400"></div>
<div class="w-3.5 h-7 -mt-2 bg-gradient-to-b from-slate-400 via-slate-200 to-slate-500 rounded-full shadow-inner border border-slate-400 hidden sm:block"></div>
<div class="w-3.5 h-7 -mt-2 bg-gradient-to-b from-slate-400 via-slate-200 to-slate-500 rounded-full shadow-inner border border-slate-400 hidden sm:block"></div>
<div class="w-3.5 h-7 -mt-2 bg-gradient-to-b from-slate-400 via-slate-200 to-slate-500 rounded-full shadow-inner border border-slate-400"></div>
<div class="w-3.5 h-7 -mt-2 bg-gradient-to-b from-slate-400 via-slate-200 to-slate-500 rounded-full shadow-inner border border-slate-400"></div>
<div class="w-3.5 h-7 -mt-2 bg-gradient-to-b from-slate-400 via-slate-200 to-slate-500 rounded-full shadow-inner border border-slate-400 hidden md:block"></div>
<div class="w-3.5 h-7 -mt-2 bg-gradient-to-b from-slate-400 via-slate-200 to-slate-500 rounded-full shadow-inner border border-slate-400 hidden md:block"></div>
<div class="w-3.5 h-7 -mt-2 bg-gradient-to-b from-slate-400 via-slate-200 to-slate-500 rounded-full shadow-inner border border-slate-400"></div>
<div class="w-3.5 h-7 -mt-2 bg-gradient-to-b from-slate-400 via-slate-200 to-slate-500 rounded-full shadow-inner border border-slate-400"></div>
</div>
</div>
<!-- 스케치북 내부 본문 영역 -->
<div class="p-5 sm:p-8 md:p-10 relative">
<!-- 은은한 상단 낙서 배너 -->
<div class="flex items-center justify-between pb-4 border-b-2 border-dashed border-sky-200/90 mb-6">
<div class="flex items-center space-x-2">
<span class="inline-block w-3 h-3 rounded-full bg-rose-400 animate-pulse"></span>
<span class="inline-block w-3 h-3 rounded-full bg-amber-400"></span>
<span class="inline-block w-3 h-3 rounded-full bg-sky-400"></span>
<span class="text-xs font-hand text-slate-400 tracking-wider ml-1">MY DOODLE SKETCHBOOK #03</span>
</div>
<div class="text-xs sm:text-sm font-hand text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
            ★ 인천대학교 특별판 🎮
          </div>
</div>
<!-- 중앙 콘텐츠 컨테이너: 디자인 초안 레이아웃 (세로 정렬) 충실히 구현 -->
<div class="max-w-xl mx-auto flex flex-col items-center justify-center text-center">
<!-- BEGIN: MascotSection -->
<!-- 3. 마스코트 횃불이 스탠드 (마스킹 테이프로 고정된 사진 프레임) -->
<div class="relative group my-2 animate-gentle-wiggle" data-purpose="mascot-frame-container">
<!-- 위쪽 마스킹 테이프 장식 -->
<div class="masking-tape absolute -top-3.5 left-1/2 -translate-x-1/2 w-28 h-6 z-10 flex items-center justify-center">
<span class="text-[10px] font-hand text-amber-800 opacity-70 tracking-widest uppercase">tape :: INU</span>
</div>
<!-- 마스코트 포토 프레임 카드 -->
<div class="w-56 h-56 sm:w-64 sm:h-64 bg-white doodle-box p-4 shadow-paper-float border-2 border-slate-700/80 relative flex flex-col items-center justify-center bg-gradient-to-b from-white via-orange-50/20 to-amber-50/30">
<!-- 횃불이 마스코트 영역 (추후 이미지 삽입용 가이드) -->
<div class="w-full h-full doodle-border-dash bg-amber-50/50 flex flex-col items-center justify-center p-3 relative overflow-hidden group">
<!-- 부드러운 오렌지빛 불꽃 글로우 효과 -->
<div class="absolute w-32 h-32 rounded-full bg-orange-300/25 blur-2xl pointer-events-none"></div>
<!-- 횃불 불꽃 손그림 일러스트 아이콘 (SVG) -->
<div class="w-16 h-16 mb-2 text-orange-500 drop-shadow-sm transition-transform duration-300 group-hover:scale-110">
<svg class="w-full h-full text-amber-500 filter drop-shadow" fill="currentColor" viewbox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
<path clip-rule="evenodd" d="M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.177A7.547 7.547 0 0 1 6.75 11.25a.75.75 0 0 0-.75.75 6.75 6.75 0 0 0 11.758 4.606A6.74 6.74 0 0 0 19.5 12a6.72 6.72 0 0 0-1.25-3.87.75.75 0 0 0-1.077-.184 5.25 5.25 0 0 1-3.21 1.054 5.256 5.256 0 0 1-1-6.714Z" fill-rule="evenodd"></path>
</svg>
</div>
<span class="font-display text-base sm:text-lg text-slate-800 tracking-wide">
                  마스코트 횃불이 영역
                </span>
<span class="text-xs font-hand text-slate-500 mt-1">
                  (추후 이미지 삽입 예정)
                </span>
<!-- 귀여운 미니 태그 -->
<div class="absolute bottom-2 right-2 bg-orange-100 text-orange-700 text-[10px] font-hand px-2 py-0.5 rounded-full border border-orange-300">
                  🔥 횃불이 대기중
                </div>
</div>
</div>
<!-- 작은 핀/스티커 장식 -->
<div class="absolute -bottom-2 -left-2 w-6 h-6 bg-yellow-200 rounded-full border border-slate-700 flex items-center justify-center text-xs shadow-sm">
              ✨
            </div>
</div>
<!-- END: MascotSection -->
<!-- BEGIN: TitleSection -->
<!-- 2. 게임 타이틀: "INU 벽돌깨기" 손글씨 & 파스텔 캘리그라피 -->
<div class="mt-4 mb-5" data-purpose="game-title">
<div class="inline-block relative">
<h1 class="font-display text-4xl sm:text-5xl md:text-6xl text-sky-600 tracking-wider filter drop-shadow-[2px_3px_0px_rgba(56,189,248,0.3)]">
                INU 벽돌깨기
              </h1>
<!-- 타이틀 아래 크레파스 밑줄 낙서 스타일 (SVG) -->
<svg class="w-full h-4 text-sky-300 -mt-1" fill="none" preserveaspectratio="none" viewbox="0 0 300 20">
<path d="M5 12 Q 75 4, 150 11 T 295 10" opacity="0.6" stroke="#38bdf8" stroke-linecap="round" stroke-width="6"></path>
</svg>
</div>
<p class="font-hand text-lg sm:text-xl text-slate-600 mt-1 font-bold">
              인천대학교 횃불이와 함께하는 신나는 블록 격파!
            </p>
</div>
<!-- END: TitleSection -->
<!-- BEGIN: UserInputSection -->
<!-- 4. 사용자 이름 입력 및 게임 시작 버튼 폼 -->
<form class="w-full max-w-sm space-y-4 px-2" data-purpose="nickname-form" onsubmit="event.preventDefault(); alert('게임을 시작합니다! 횃불이와 함께 벽돌을 부숴보아요!');">
<!-- 이름 입력 필드 (연필/크레파스 밑줄 감성) -->
<div class="relative text-left">
<label class="block font-hand text-base sm:text-lg text-slate-600 font-bold mb-1 ml-2" for="playerName">
                ✏️ 도전자 이름을 적어주세요
              </label>
<div class="relative">
<input class="w-full bg-sky-50/60 font-hand text-xl px-4 py-3 rounded-2xl border-2 border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:bg-white placeholder-slate-400 text-slate-800 transition-all shadow-[2px_3px_0px_#334155]" id="playerName" maxlength="10" name="playerName" placeholder="예: 횃불이대장" required="" type="text"/>
<span class="absolute right-3.5 top-3.5 text-base text-slate-400 pointer-events-none font-hand font-bold">
                  (최대 10자)
                </span>
</div>
</div>
<!-- "게임 시작!" 몽글몽글 구름 모양 푹신한 버튼 -->
<button class="cloud-btn w-full py-3.5 px-6 bg-sky-400 hover:bg-sky-500 text-white font-display text-2xl tracking-wider rounded-3xl border-2 border-slate-700 shadow-clay-button active:shadow-clay-button-active flex items-center justify-center space-x-2 group cursor-pointer" data-purpose="start-game-button" type="submit">
<span>게임 시작!</span>
<span class="transform transition-transform group-hover:translate-x-1.5 text-xl">🚀</span>
</button>
</form>
<!-- END: UserInputSection -->
</div>
<!-- BEGIN: CreatorNote -->
<!-- 5. 제작자 정보 (스케치북 우측 하단 손글씨 메모지/명찰 디자인) -->
<footer class="mt-8 pt-4 border-t border-slate-200/60 flex justify-end" data-purpose="creator-badge-footer">
<!-- 마스킹 테이프로 부착된 포스트잇 메모지 -->
<aside class="relative max-w-xs sm:max-w-sm bg-amber-50 p-3 sm:p-4 rounded-xl border-2 border-slate-600 shadow-[3px_4px_0px_rgba(51,65,85,0.7)] rotate-1 hover:rotate-0 transition-transform">
<!-- 포스트잇 상단 미니 테이프 -->
<div class="absolute -top-2.5 left-1/2 -translate-x-1/2 w-16 h-4 bg-sky-200/90 rounded-sm border border-sky-300"></div>
<div class="flex items-start space-x-2.5">
<span class="text-xl">🏷️</span>
<div class="text-left font-hand">
<div class="text-xs font-bold text-slate-500 border-b border-amber-200 pb-0.5 mb-1 flex items-center justify-between">
<span>CREATOR INFO</span>
<span class="text-[10px] text-amber-700">INU PROJECT</span>
</div>
<p class="text-sm sm:text-base font-bold text-slate-800 leading-snug">
                  제작자 | 인천대학교 정보기술대학 OO학과
                </p>
<p class="text-xs sm:text-sm text-slate-600 mt-0.5">
                  학번: <span class="font-bold text-slate-700">202400000</span> | 성명: <span class="font-bold text-slate-800">OOO</span>
</p>
</div>
</div>
</aside>
</footer>
<!-- END: CreatorNote -->
</div>
</div>
<!-- END: SketchbookBody -->
</main>
<!-- END: MainContainer -->
<!-- BEGIN: InteractiveScript -->
<!-- 입력창 포커스 및 사운드 효과 대리 안내용 가벼운 스크립트 -->
<script data-purpose="form-interactivity">
    document.addEventListener('DOMContentLoaded', () => {
      const inputEl = document.getElementById('playerName');
      if (inputEl) {
        // 부드럽게 첫 입력 유도
        inputEl.setAttribute('autocomplete', 'off');
      }
    });
  </script>
<!-- END: InteractiveScript -->
</body></html>