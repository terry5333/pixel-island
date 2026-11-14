import React, { useState } from 'react';
import { UserProfile } from '../types/game';
import { sound } from '../services/audio';
import { X, Sparkles, Check, ArrowRight, Home, Coins, ShieldAlert } from 'lucide-react';
import { CozyCottageBuilding } from './scenery/CozyCottageBuilding';

interface HouseUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUpgradeSuccess: (newLevel: number, cost: number) => Promise<void>;
}

interface TierInfo {
  level: number;
  name: string;
  cost: number;
  description: string;
  interiorSize: string;
  perks: string[];
}

const TIERS: TierInfo[] = [
  {
    level: 1,
    name: '初階紅頂小屋',
    cost: 0,
    description: '經典溫馨的圓錐紅瓦小屋，島民新手專屬起點。',
    interiorSize: '6 × 6 經典格局',
    perks: ['專屬島嶼地契', '基礎家具擺設空間', '煙囪裊裊炊煙'],
  },
  {
    level: 2,
    name: '溫馨原木小屋',
    cost: 500,
    description: '純天然杉木搭建的林間度假風木屋，帶有閣樓觀景窗與紫色瓦頂。',
    interiorSize: '8 × 8 寬敞格局',
    perks: ['+50% 家具擺放空間', '暖黃燈火落地窗', '紫靛色精緻屋頂瓦片'],
  },
  {
    level: 3,
    name: '歐風石木鄉村宅邸',
    cost: 1500,
    description: '堅固耐用鵝卵石砌磚與重型木造結構，雙層斜頂莊園。',
    interiorSize: '10 × 10 豪華格局',
    perks: ['可容納大型壁爐與鋼琴', '重型防風木栓門', '透光天青石玻璃窗'],
  },
  {
    level: 4,
    name: '豪華景觀雙層莊園',
    cost: 3000,
    description: '尊貴象徵！英式維多利亞雙層豪宅，窗台鮮花爭艷，前廊石階。',
    interiorSize: '12 × 12 尊榮總統級空間',
    perks: ['頂級玫瑰花箱陽台', '迎賓門廊古典吊燈', '全島專屬頂級金色名牌'],
  },
];

export const HouseUpgradeModal: React.FC<HouseUpgradeModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpgradeSuccess,
}) => {
  const currentLevel = currentUser.houseLevel || 1;
  const [selectedTier, setSelectedTier] = useState<number>(Math.min(currentLevel + 1, 4));
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeTier = TIERS.find((t) => t.level === selectedTier) || TIERS[0];
  const isOwned = selectedTier <= currentLevel;
  const isNext = selectedTier === currentLevel + 1;
  const safeCoins = Math.max(0, currentUser.coins || 0);
  const canAfford = safeCoins >= activeTier.cost;

  const handleUpgrade = async () => {
    if (!isNext) return;
    if (!canAfford) {
      sound.playBump();
      setErrorMsg(`金幣不足！升級需要 ${activeTier.cost} 金幣，你目前擁有 ${safeCoins} 金幣。`);
      return;
    }

    try {
      setIsUpgrading(true);
      setErrorMsg(null);
      sound.playSuccess();
      await onUpgradeSuccess(selectedTier, activeTier.cost);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || '升級失敗，請稍候重試');
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner">
              🔨
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-wide text-white drop-shadow-xs flex items-center gap-2">
                島嶼房屋升級工坊
              </h2>
              <p className="text-[11px] text-amber-100 font-medium">花費島嶼金幣，將你的小屋打造成頂級雙層大莊園！</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="px-3 py-1 rounded-full bg-white/95 text-slate-800 font-bold text-xs flex items-center gap-1.5 shadow-xs font-mono">
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              <span>{safeCoins.toLocaleString()}</span>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-1.5 hover:bg-white/20 rounded-full text-white/90 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Level Tabs */}
        <div className="grid grid-cols-4 gap-1.5 p-2.5 bg-slate-50 border-b border-slate-200">
          {TIERS.map((tier) => {
            const isTabActive = tier.level === selectedTier;
            const isTabOwned = tier.level <= currentLevel;
            return (
              <button
                key={tier.level}
                onClick={() => {
                  sound.playClick();
                  setSelectedTier(tier.level);
                  setErrorMsg(null);
                }}
                className={`py-2 px-1 rounded-2xl text-xs font-bold transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                  isTabActive
                    ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-200 scale-[1.02]'
                    : isTabOwned
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100/70'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span>Lv.{tier.level}</span>
                  {isTabOwned && <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />}
                </div>
                <span className="truncate text-[10px] sm:text-[11px]">{tier.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto flex flex-col gap-4 bg-slate-50/50">
          {/* House Architectural Preview */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="w-48 h-40 flex items-center justify-center shrink-0">
              <CozyCottageBuilding
                width={192}
                height={154}
                level={activeTier.level}
                ownerName={currentUser.displayName}
                isSelf={true}
              />
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-base sm:text-lg font-black text-slate-800">
                  {activeTier.name}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold border border-slate-200">
                  {activeTier.interiorSize}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{activeTier.description}</p>

              <div className="mt-2 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-700">專屬升級特權：</div>
                {activeTier.perks.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer Action Bar */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">升級費用：</span>
            {activeTier.cost === 0 ? (
              <span className="text-sm font-bold text-emerald-600">免費取得</span>
            ) : (
              <span className="text-base font-black text-amber-600 flex items-center gap-1 font-mono">
                <Coins className="w-4 h-4 text-amber-500" />
                {activeTier.cost.toLocaleString()} 金幣
              </span>
            )}
          </div>

          <div>
            {isOwned ? (
              <button
                disabled
                className="px-4 py-2.5 rounded-2xl bg-slate-100 text-slate-500 text-xs font-bold border border-slate-200 flex items-center gap-1.5 cursor-default"
              >
                <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                目前已擁有此階段
              </button>
            ) : isNext ? (
              <button
                onClick={handleUpgrade}
                disabled={isUpgrading || !canAfford}
                className={`px-6 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-transform active:scale-95 ${
                  canAfford
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 cursor-pointer shadow-amber-200'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>{isUpgrading ? '正在施工升級中...' : `確認升級 (${activeTier.cost} 金幣)`}</span>
              </button>
            ) : (
              <button
                disabled
                className="px-4 py-2.5 rounded-2xl bg-slate-100 text-slate-400 text-xs font-bold border border-slate-200 flex items-center gap-1.5 cursor-not-allowed"
              >
                <span>需先升級至 Lv.{selectedTier - 1}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
