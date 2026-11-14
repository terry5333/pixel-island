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
    iconColor: 'text-indigo-600',
    title: '歡迎來到昭和・櫻花島！',
    subtitle: '自由無拘束的復古多人線上冒險',
    content: (
      <div className="space-y-3 text-xs text-slate-600 font-sans">
        <p className="text-slate-700 font-medium">你現在是這座美麗島嶼的正式島民！地圖全境解鎖，自由奔跑探索：</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-white border border-slate-200 rounded-lg text-indigo-600 font-mono font-bold text-xs shadow-2xs">W A S D</span>
            <span>鍵盤方向鍵自由走動</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-white border border-slate-200 rounded-lg text-emerald-600 font-mono font-bold text-xs shadow-2xs">SPACE</span>
            <span>進入店舖 / 拜訪住宅</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-white border border-slate-200 rounded-lg text-rose-500 text-xs shadow-2xs">📱 虛擬按鍵</span>
            <span>手機直接點擊螢幕自由行走</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-white border border-slate-200 rounded-lg text-purple-600 text-xs shadow-2xs">💬 快捷氣泡</span>
            <span>即時發送表情與島民互動</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: Home,
    iconColor: 'text-amber-500',
    title: '你的專屬島嶼居所與外觀升級',
    subtitle: '每位島民都擁有專屬日式宅邸地契',
    content: (
      <div className="space-y-3 text-xs text-slate-600 font-sans">
        <p className="text-slate-700 font-medium">島嶼住宅區已經自動為你建好了專屬居所！走至門口玄關即可進入：</p>
        <div className="space-y-2 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="flex items-start gap-2.5">
            <span className="text-lg">🔨</span>
            <div>
              <div className="font-bold text-slate-800">四段式房屋外觀升級工坊</div>
              <div className="text-[11px] text-slate-500">賺取金幣可將小屋從「紅頂小屋」升級至「原木小屋」、「石木宅邸」，直至「豪華雙層莊園」！</div>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="text-lg">🛋️</span>
            <div>
              <div className="font-bold text-slate-800">2.5D 和風家具自由佈置</div>
              <div className="text-[11px] text-slate-500">室內空間隨著房屋升級而擴充，可自由擺設屏風、榻榻米、茶几等典雅家具。</div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: Gamepad2,
    iconColor: 'text-purple-600',
    title: '街機遊樂中心與 777 娛樂城',
    subtitle: '熱門 1A2B、海戰棋、無限 OOXX 與拉霸機',
    content: (
      <div className="space-y-3 text-xs text-slate-600 font-sans">
        <p className="text-slate-700 font-medium">島嶼中心設有各大娛樂場所，隨時隨地開啟多人對戰：</p>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="text-2xl mb-1">🔢</div>
            <div className="font-bold text-slate-800">雙人 1A2B</div>
            <div className="text-[10px] text-slate-400">邏輯推理猜密碼</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="text-2xl mb-1">⭕❌</div>
            <div className="font-bold text-slate-800">無限 OOXX</div>
            <div className="text-[10px] text-slate-400">第4子消第1子</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="text-2xl mb-1">🚢</div>
            <div className="font-bold text-slate-800">海戰棋 (8×8)</div>
            <div className="text-[10px] text-slate-400">砲擊擊沉敵方艦隊</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="text-2xl mb-1">🎰</div>
            <div className="font-bold text-slate-800">CASINO 777</div>
            <div className="text-[10px] text-slate-400">娛樂城拉霸贏 50 倍彩金</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: Gift,
    iconColor: 'text-emerald-600',
    title: '新人啟航特權禮包！',
    subtitle: '恭喜完成導引，領取 1,000 島嶼金幣',
    content: (
      <div className="space-y-3 text-center py-2 font-sans">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-3xl shadow-xs">
          🪙
        </div>
        <div className="font-black text-xl text-slate-800">恭喜獲得 1,000 島嶼金幣！</div>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          你現在可以前往和服精品店購買昭和傳統服飾，或者直接去娛樂城拉霸拚大獎，甚至準備升級你的專屬宅邸！
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm select-none animate-fade-in font-sans">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xs ${step.iconColor}`}>
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-black text-base text-slate-800">{step.title}</h2>
              <p className="text-xs text-slate-400 font-medium">{step.subtitle}</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
            {currentStep + 1} / {STEPS.length}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-slate-100 w-full">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 flex-1">{step.content}</div>

        {/* Footer */}
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {currentStep > 0 ? (
            <button
              onClick={() => {
                sound.playClick();
                setCurrentStep((prev) => prev - 1);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-200 cursor-pointer transition-colors"
            >
              上一步
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={handleNext}
            disabled={isFinishing}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-sm shadow-indigo-200 flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
          >
            {isLast ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{isFinishing ? '正在領取獎勵...' : '完成教學並領取 1,000 金幣'}</span>
              </>
            ) : (
              <>
                <span>下一步</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
