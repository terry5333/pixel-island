import React, { useState } from 'react';
import { sound } from '../services/audio';
import { Sparkles, ArrowRight, Check, Compass, Home, Gamepad2, Gift } from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onComplete: () => Promise<void>;
  playerName: string;
}

const STEPS = [
  {
    icon: Compass,
    iconColor: 'text-sky-400',
    title: '歡迎來到像素島！',
    subtitle: '自由無拘束的復古多人線上冒險',
    content: (
      <div className="space-y-3 text-xs text-slate-300">
        <p>你現在是這座美麗海濱島嶼的正式島民！地圖已全面解鎖，無任何格子阻礙，讓你享受最絲滑的自由奔跑：</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-900 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-slate-800 rounded-lg text-amber-400 font-mono font-bold text-xs">W A S D</span>
            <span>鍵盤方向鍵自由走動</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-slate-800 rounded-lg text-emerald-400 font-mono font-bold text-xs">SPACE</span>
            <span>進入建築 / 拜訪好友房屋</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-slate-800 rounded-lg text-pink-400 text-xs">📱 虛擬搖桿</span>
            <span>手機點擊螢幕即可瞬間移動</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-slate-800 rounded-lg text-purple-400 text-xs">💬 快捷氣泡</span>
            <span>即時發送動態表情與島民打招呼</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: Home,
    iconColor: 'text-amber-400',
    title: '你的專屬島嶼小屋與房屋升級',
    subtitle: '每位島民都擁有專屬地契與 3D 豪宅',
    content: (
      <div className="space-y-3 text-xs text-slate-300">
        <p>島嶼住宅區已經自動為你建好了專屬小屋！走到門口即可進入專屬的 2.5D Isometric 3D 室內空間：</p>
        <div className="space-y-2 p-3 bg-slate-900 rounded-xl border border-slate-800">
          <div className="flex items-start gap-2.5">
            <span className="text-base">🔨</span>
            <div>
              <div className="font-bold text-amber-300">四段式房屋外觀升級</div>
              <div className="text-[11px] text-slate-400">賺取金幣可將小屋從「紅頂小屋」升級至「原木小屋」、「石木宅邸」，直至「豪華雙層大莊園」！</div>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="text-base">🛋️</span>
            <div>
              <div className="font-bold text-emerald-300">3D 家具自由佈置</div>
              <div className="text-[11px] text-slate-400">進入房間後點擊「佈置模式」，自由旋轉擺放床鋪、沙發與壁爐，隨時邀請線上好友到家裡開趴！</div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: Gamepad2,
    iconColor: 'text-rose-400',
    title: '「銭屋」街機樂園與對戰遊戲',
    subtitle: '多種經典休閒對戰，隨時開房或連線 NPC',
    content: (
      <div className="space-y-3 text-xs text-slate-300">
        <p>走過中央大道即可抵達復古風情的「銭屋」街機旗艦館，先創房間獲得專屬 4 碼房號，再自由挑選遊玩項目：</p>
        <div className="grid grid-cols-2 gap-2 p-3 bg-slate-900 rounded-xl border border-slate-800 text-[11px]">
          <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
            <span className="font-bold text-sky-400 block">🚢 海戰棋 Battleship</span>
            <span className="text-slate-400 text-[10px]">雷達偵測排兵佈陣，雙方互射</span>
          </div>
          <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
            <span className="font-bold text-amber-400 block">✏️ 點線棋 Dots & Boxes</span>
            <span className="text-slate-400 text-[10px]">連線佔地盤，步步為營</span>
          </div>
          <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
            <span className="font-bold text-indigo-400 block">🔢 1A2B 數字密碼</span>
            <span className="text-slate-400 text-[10px]">經典益智推理對決</span>
          </div>
          <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
            <span className="font-bold text-rose-400 block">🎰 777 復古拉霸機</span>
            <span className="text-slate-400 text-[10px]">拉動搖桿拚大獎，高額金幣</span>
          </div>
        </div>
        <p className="text-[11px] text-amber-300">💡 提示：沒有好友在線時，可以點擊房間內的「加入電腦 NPC」練習對戰！</p>
      </div>
    ),
  },
  {
    icon: Gift,
    iconColor: 'text-emerald-400',
    title: '新手登島大禮包 🎉',
    subtitle: '1,000 島嶼金幣見面禮已備齊',
    content: (
      <div className="flex flex-col items-center justify-center p-6 bg-slate-900/90 rounded-2xl border border-amber-500/40 text-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-3xl animate-bounce">
          🪙
        </div>
        <div className="text-lg font-bold text-amber-300">贈送 1,000 枚島嶼金幣！</div>
        <p className="text-xs text-slate-300 max-w-sm">
          這筆金幣已存入你的帳戶，你可以立刻用來購買精品服裝、家具，或是直接升級你的島嶼小屋！
        </p>
      </div>
    ),
  },
];

export const TutorialModal: React.FC<TutorialModalProps> = ({
  isOpen,
  onComplete,
  playerName,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);

  if (!isOpen) return null;

  const step = STEPS[currentStep];
  const IconComponent = step.icon;
  const isLast = currentStep === STEPS.length - 1;

  const handleNext = async () => {
    sound.playClick();
    if (!isLast) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setIsFinishing(true);
      sound.playSuccess();
      await onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm select-none">
      <div className="w-full max-w-xl bg-[#0f172a] border-4 border-amber-500 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-slate-900 border border-slate-800 ${step.iconColor}`}>
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-arcade text-sm sm:text-base text-amber-400">{step.title}</h2>
              <p className="text-[11px] text-slate-400">{step.subtitle}</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800">
            {currentStep + 1} / {STEPS.length}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-slate-900 w-full">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Body Content */}
        <div className="p-5 flex-1">{step.content}</div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          {currentStep > 0 ? (
            <button
              onClick={() => {
                sound.playClick();
                setCurrentStep((prev) => prev - 1);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800"
            >
              上一步
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={handleNext}
            disabled={isFinishing}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-transform cursor-pointer"
          >
            <span>{isLast ? '領取獎勵並開始冒險 🚀' : '下一步'}</span>
            {!isLast && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
