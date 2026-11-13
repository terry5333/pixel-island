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
    description: '純天然杉木搭建的林間度假風木屋，帶有閣樓觀景窗。',
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
  const canAfford = currentUser.coins >= activeTier.cost;

  const handleUpgrade = async () => {
    if (!isNext) return;
    if (!canAfford) {
      sound.playBump();
      setErrorMsg(`金幣不足！升級需要 ${activeTier.cost} 金幣，你目前擁有 ${currentUser.coins} 金幣。`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-[#0f172a] border-4 border-amber-500/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-3.5 sm:p-4 bg-slate-950 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-2xl">🔨</span>
            <div>
              <h2 className="font-arcade text-sm sm:text-base text-amber-400 flex items-center gap-2">
                島嶼房屋升級工坊
              </h2>
              <p className="text-[11px] text-slate-400">花費島嶼金幣，將你的小屋打造成頂級雙層大莊園！</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-400/40 text-amber-300 font-bold text-xs flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>{currentUser.coins.toLocaleString()}</span>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Level Tabs */}
        <div className="grid grid-cols-4 gap-1 p-2 bg-slate-900 border-b border-slate-800">
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
                className={`py-2 px-1 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
                  isTabActive
                    ? 'bg-amber-500 text-slate-950 shadow-md scale-[1.02]'
                    : isTabOwned
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-600/40 hover:bg-emerald-900/60'
                    : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700/80'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span>Lv.{tier.level}</span>
                  {isTabOwned && <Check className="w-3 h-3 text-emerald-400" />}
                </div>
                <span className="truncate text-[10px] sm:text-[11px]">{tier.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto flex flex-col gap-4">
          {/* House Architectural Preview */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-950/80 rounded-xl border border-slate-800">
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
                <span className="text-base sm:text-lg font-bold text-amber-300">
                  {activeTier.name}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {activeTier.interiorSize}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{activeTier.description}</p>

              <div className="mt-2 space-y-1">
                <div className="text-[11px] font-bold text-slate-400">專屬升級特權：</div>
                {activeTier.perks.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-emerald-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-600/60 text-rose-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer Action Bar */}
        <div className="p-3.5 sm:p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">升級費用：</span>
            {activeTier.cost === 0 ? (
              <span className="text-sm font-bold text-emerald-400">免費取得</span>
            ) : (
              <span className="text-base font-bold text-amber-400 flex items-center gap-1 font-mono">
                <Coins className="w-4 h-4 text-amber-400" />
                {activeTier.cost.toLocaleString()} 金幣
              </span>
            )}
          </div>

          <div>
            {isOwned ? (
              <button
                disabled
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-default"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                目前已擁有此階段
              </button>
            ) : isNext ? (
              <button
                onClick={handleUpgrade}
                disabled={isUpgrading || !canAfford}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-transform active:scale-95 ${
                  canAfford
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 cursor-pointer shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>{isUpgrading ? '正在施工升級中...' : `確認升級 (${activeTier.cost} 金幣)`}</span>
              </button>
            ) : (
              <button
                disabled
                className="px-4 py-2 rounded-xl bg-slate-800/60 text-slate-500 text-xs font-bold border border-slate-800 flex items-center gap-1.5 cursor-not-allowed"
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
