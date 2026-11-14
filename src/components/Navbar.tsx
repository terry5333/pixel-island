import React, { useState } from 'react';
import { UserProfile } from '../types/game';
import { sound } from '../services/audio';
import { 
  Volume2, 
  VolumeX, 
  Shield, 
  Shirt, 
  Menu, 
  X, 
  LogOut, 
  Home,
  Users,
  HelpCircle,
  Coins
} from 'lucide-react';
import { isFirebaseConfigured } from '../config/firebase';

interface NavbarProps {
  user: UserProfile | null;
  onlineCount: number;
  onOpenAdmin: () => void;
  onOpenWardrobe: () => void;
  onOpenAuthModal: () => void;
  onOpenHouseUpgrade: () => void;
  onOpenTutorial: () => void;
  onSignOut: () => void;
  onToggleFriends: () => void;
  currentUid: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onlineCount,
  onOpenAdmin,
  onOpenWardrobe,
  onOpenAuthModal,
  onOpenHouseUpgrade,
  onOpenTutorial,
  onSignOut,
  onToggleFriends,
  currentUid,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [muted, setMuted] = useState(sound.isMuted);

  const toggleSound = () => {
    const isNowMuted = sound.toggleMute();
    setMuted(isNowMuted);
    if (!isNowMuted) sound.playClick();
  };

  const houseLevel = user?.houseLevel || 1;

  return (
    <>
      {/* ================= SHOWA JAPANESE RETRO TOP HUD (日式昭和和風頂部導航) ================= */}
      <header className="fixed top-2.5 inset-x-2.5 sm:inset-x-4 z-40 flex items-center justify-between pointer-events-none select-none font-serif">
        {/* Left Japanese Wooden Plaque (木札風格招牌) */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#24130a]/95 backdrop-blur-md rounded-2xl border-2 border-[#8b4513] shadow-[0_4px_16px_rgba(0,0,0,0.8)] pointer-events-auto">
          <span className="text-base">🏮</span>
          <span className="text-[#fef08a] font-black text-xs sm:text-sm tracking-wider drop-shadow">
            昭和・櫻花島
          </span>
          {user && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-[#8b4513]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="truncate max-w-[85px] sm:max-w-[120px] font-bold text-[#f5ebd7] text-[11px] bg-[#3a1d10] px-2 py-0.5 rounded border border-[#6b3518]">
                {user.displayName}
              </span>
            </div>
          )}
        </div>

        {/* Right Status & Action Capsules */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          {user && (
            <>
              {/* Gold Coins Plaque (千兩小判金幣匣) */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3a1d10]/95 backdrop-blur-md rounded-2xl border-2 border-[#b45309] shadow-md text-xs font-bold text-[#fde047] font-mono">
                <Coins className="w-3.5 h-3.5 text-[#fbbf24] shrink-0" />
                <span className="tracking-wide">{user.coins.toLocaleString()} 兩</span>
              </div>

              {/* House Upgrade Japanese Plaque */}
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenHouseUpgrade();
                }}
                className="hidden xs:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#991b1b] to-[#7f1d1d] hover:from-[#b91c1c] hover:to-[#991b1b] text-[#fef08a] font-bold text-[11px] rounded-2xl shadow-md active:scale-95 transition-all cursor-pointer border-2 border-[#f59e0b]"
                title="開啟房屋升級工坊"
              >
                <span>🏡</span>
                <span>邸宅 Lv.{houseLevel} 普請</span>
              </button>

              {/* Friends Panel Toggle Button */}
              <button
                onClick={() => {
                  sound.playClick();
                  onToggleFriends();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3a1d10]/95 hover:bg-[#4a2716] text-[#f5ebd7] text-[11px] font-bold rounded-2xl border-2 border-[#8b4513] shadow-md active:scale-95 transition-all cursor-pointer"
                title="島民名冊"
              >
                <Users className="w-3.5 h-3.5 text-[#fde047]" />
                <span className="hidden sm:inline">島民帳</span>
                <span className="text-[10px] px-1.5 bg-[#201109] text-[#fbbf24] border border-[#a16207] rounded-full font-mono">
                  {onlineCount}
                </span>
              </button>
            </>
          )}

          {/* Sound Mute Toggle */}
          <button
            onClick={toggleSound}
            className="p-2 bg-[#3a1d10]/95 hover:bg-[#4a2716] rounded-2xl text-[#fde047] border-2 border-[#8b4513] shadow-md transition-colors cursor-pointer"
            title={muted ? '開啟音效' : '靜音'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Drawer Menu Button */}
          <button
            onClick={() => {
              sound.playClick();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="p-2 bg-[#3a1d10]/95 hover:bg-[#4a2716] rounded-2xl text-[#fef08a] border-2 border-[#b45309] shadow-md transition-colors cursor-pointer"
            title="功能目錄"
          >
            {isMenuOpen ? <X className="w-4 h-4 text-amber-300" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ================= SHOWA JAPANESE TEA ROOM DRAWER (日式茶屋風格滑出選單) ================= */}
      {isMenuOpen && (
        <div
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fade-in font-serif"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-72 sm:w-80 h-full bg-[#1e0f07] border-l-4 border-[#8b4513] p-5 flex flex-col justify-between shadow-[0_0_50px_rgba(0,0,0,0.9)] select-none text-[#f5ebd7]"
          >
            {/* Drawer Top */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b-2 border-[#6b3518]">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏮</span>
                  <div>
                    <h3 className="font-black text-sm text-[#fde047] tracking-wider">櫻花島・遊島宿帳</h3>
                    <p className="text-[10px] text-[#d4a373] tracking-widest">SHOWA RETRO ISLAND</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1 hover:bg-[#381c0e] rounded-xl text-[#d4a373] hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Identity Plaque */}
              {user ? (
                <div className="p-3 bg-[#2d170b] rounded-2xl border-2 border-[#78350f] flex items-center justify-between shadow-inner">
                  <div>
                    <div className="text-[10px] text-[#a88265]">島民登錄證</div>
                    <div className="font-black text-sm text-[#fef08a] mt-0.5">{user.displayName}</div>
                    <div className="text-[11px] text-[#f59e0b] font-mono mt-0.5">🪙 所持金：{user.coins.toLocaleString()} 兩</div>
                  </div>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenAuthModal();
                    }}
                    className="text-[11px] px-3 py-1.5 bg-[#422211] hover:bg-[#572e18] text-[#fde047] font-bold rounded-xl border border-[#b45309] cursor-pointer"
                  >
                    切換
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenAuthModal();
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-[#b91c1c] to-[#991b1b] hover:from-[#dc2626] hover:to-[#b91c1c] text-[#fef08a] font-black text-xs rounded-2xl shadow-lg border-2 border-[#fef08a] cursor-pointer"
                >
                  🏮 登入櫻花島
                </button>
              )}

              {/* Menu Navigation Links (木札短冊風格選項) */}
              <div className="space-y-2 pt-2">
                {user && (
                  <>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenHouseUpgrade();
                      }}
                      className="w-full p-3 bg-[#2d170b] hover:bg-[#3d200f] text-[#f5ebd7] text-xs font-bold rounded-2xl flex items-center gap-3 border-2 border-[#5c2b12] hover:border-[#b45309] shadow transition-all cursor-pointer"
                    >
                      <Home className="w-4 h-4 text-[#fde047]" />
                      <span>🏡 邸宅普請（房屋升級工坊）</span>
                      <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-[#78350f] text-[#fde047] font-mono font-bold border border-[#b45309]">
                        Lv.{houseLevel}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenWardrobe();
                      }}
                      className="w-full p-3 bg-[#2d170b] hover:bg-[#3d200f] text-[#f5ebd7] text-xs font-bold rounded-2xl flex items-center gap-3 border-2 border-[#5c2b12] hover:border-[#b45309] shadow transition-all cursor-pointer"
                    >
                      <Shirt className="w-4 h-4 text-[#fb7185]" />
                      <span>👘 著物衣櫥（個人換裝）</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onToggleFriends();
                      }}
                      className="w-full p-3 bg-[#2d170b] hover:bg-[#3d200f] text-[#f5ebd7] text-xs font-bold rounded-2xl flex items-center gap-3 border-2 border-[#5c2b12] hover:border-[#b45309] shadow transition-all cursor-pointer"
                    >
                      <Users className="w-4 h-4 text-[#38bdf8]" />
                      <span>👥 島民名冊（好友名簿）</span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenTutorial();
                  }}
                  className="w-full p-3 bg-[#2d170b] hover:bg-[#3d200f] text-[#f5ebd7] text-xs font-bold rounded-2xl flex items-center gap-3 border-2 border-[#5c2b12] hover:border-[#b45309] shadow transition-all cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4 text-[#4ade80]" />
                  <span>📜 昭和島遊覽導引指南</span>
                </button>

                {user?.role === 'admin' && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenAdmin();
                    }}
                    className="w-full p-3 bg-gradient-to-r from-[#7f1d1d] to-[#450a0a] hover:from-[#991b1b] hover:to-[#5c1111] text-[#fef08a] text-xs font-bold rounded-2xl flex items-center gap-3 border-2 border-[#dc2626] shadow-lg transition-all cursor-pointer"
                  >
                    <Shield className="w-4 h-4 text-[#fde047]" />
                    <span>👑 御用管理後台總覽</span>
                  </button>
                )}
              </div>
            </div>

            {/* Drawer Bottom */}
            <div className="pt-4 border-t-2 border-[#6b3518] space-y-2 text-[11px] text-[#d4a373]">
              <div className="flex items-center justify-between">
                <span>島內即時人數</span>
                <span className="font-mono text-[#4ade80] font-black">{onlineCount} 人</span>
              </div>
              <div className="flex items-center justify-between">
                <span>連線狀態</span>
                <span className="font-mono text-[#fde047] font-bold">
                  {isFirebaseConfigured ? '連線良好 🟢' : '本地模擬 🟡'}
                </span>
              </div>

              {user && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onSignOut();
                  }}
                  className="w-full mt-2 py-2.5 bg-[#2d170b] hover:bg-[#7f1d1d] text-[#f5ebd7] hover:text-[#fef08a] text-xs font-bold rounded-2xl border-2 border-[#5c2b12] flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>門扉登出</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
