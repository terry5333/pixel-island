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
      {/* ================= MODERN ADAPTIVE TOP HUD (手機與電腦完美適配) ================= */}
      <header className="fixed top-2.5 inset-x-2.5 sm:inset-x-4 z-40 flex items-center justify-between pointer-events-none select-none">
        {/* Left Island Branding Capsule */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/85 backdrop-blur-md rounded-full border border-slate-700/80 shadow-lg text-xs pointer-events-auto">
          <span className="text-base">🏝️</span>
          <span className="font-arcade text-amber-400 font-bold hidden sm:inline text-xs tracking-wide">
            PIXEL ISLAND
          </span>
          {user && (
            <div className="flex items-center gap-1 pl-1 border-l border-slate-700 text-slate-300 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="truncate max-w-[85px] sm:max-w-[120px] font-bold text-white">
                {user.displayName}
              </span>
            </div>
          )}
        </div>

        {/* Right Status & Action Capsules */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          {user && (
            <>
              {/* Coins Counter Capsule */}
              <div className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-950/85 backdrop-blur-md rounded-full border border-amber-500/50 shadow-md text-xs font-bold text-amber-300 font-mono">
                <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{user.coins.toLocaleString()}</span>
              </div>

              {/* House Upgrade Quick Button Capsule */}
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenHouseUpgrade();
                }}
                className="hidden xs:flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[11px] rounded-full shadow-md active:scale-95 transition-all cursor-pointer border border-amber-300"
                title="開啟房屋升級工坊"
              >
                <span>🏡</span>
                <span>Lv.{houseLevel} 升級</span>
              </button>

              {/* Friends Panel Toggle Button */}
              <button
                onClick={() => {
                  sound.playClick();
                  onToggleFriends();
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-[11px] font-bold rounded-full border border-slate-700 shadow-md active:scale-95 transition-all cursor-pointer"
                title="好友名冊"
              >
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">好友</span>
                <span className="text-[10px] px-1 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded-full font-mono">
                  {onlineCount}
                </span>
              </button>

            </>
          )}

          {/* Sound Mute Toggle */}
          <button
            onClick={toggleSound}
            className="p-1.5 bg-slate-950/85 hover:bg-slate-800 rounded-full text-slate-300 border border-slate-700/80 shadow-md transition-colors cursor-pointer"
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
            className="p-1.5 bg-slate-950/85 hover:bg-slate-800 rounded-full text-slate-200 border border-slate-700/80 shadow-md transition-colors cursor-pointer"
            title="選單"
          >
            {isMenuOpen ? <X className="w-4 h-4 text-amber-400" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ================= SLEEK RETRO SLIDE-OUT MENU DRAWER ================= */}
      {isMenuOpen && (
        <div
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-72 sm:w-80 h-full bg-[#0f172a] border-l-2 border-slate-800 p-5 flex flex-col justify-between shadow-2xl select-none"
          >
            {/* Drawer Top */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏝️</span>
                  <div>
                    <h3 className="font-arcade text-xs text-amber-400">像素島功能選單</h3>
                    <p className="text-[10px] text-slate-400">PIXEL ISLAND MENU</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Identity Card */}
              {user ? (
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400">目前身分</div>
                    <div className="font-bold text-sm text-white">{user.displayName}</div>
                    <div className="text-[10px] text-amber-400 font-mono">🪙 {user.coins.toLocaleString()} 金幣</div>
                  </div>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenAuthModal();
                    }}
                    className="text-[10px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 cursor-pointer"
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
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  立即登入遊戲
                </button>
              )}

              {/* Menu Navigation Links */}
              <div className="space-y-1.5 pt-2">
                {user && (
                  <>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenHouseUpgrade();
                      }}
                      className="w-full p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2.5 border border-slate-800 transition-colors cursor-pointer"
                    >
                      <Home className="w-4 h-4 text-amber-400" />
                      <span>島嶼房屋升級工坊</span>
                      <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                        Lv.{houseLevel}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenWardrobe();
                      }}
                      className="w-full p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2.5 border border-slate-800 transition-colors cursor-pointer"
                    >
                      <Shirt className="w-4 h-4 text-pink-400" />
                      <span>個人衣櫥換裝</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onToggleFriends();
                      }}
                      className="w-full p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2.5 border border-slate-800 transition-colors cursor-pointer"
                    >
                      <Users className="w-4 h-4 text-cyan-400" />
                      <span>島民好友名冊</span>
                    </button>

                  </>
                )}

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenTutorial();
                  }}
                  className="w-full p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2.5 border border-slate-800 transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4 text-emerald-400" />
                  <span>島嶼新手教學指引</span>
                </button>

                {user?.role === 'admin' && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenAdmin();
                    }}
                    className="w-full p-2.5 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 text-xs font-bold rounded-xl flex items-center gap-2.5 border border-rose-800/60 transition-colors cursor-pointer"
                  >
                    <Shield className="w-4 h-4 text-rose-400" />
                    <span>👑 管理員後台控制台</span>
                  </button>
                )}
              </div>
            </div>

            {/* Drawer Bottom */}
            <div className="pt-4 border-t border-slate-800 space-y-2 text-[11px] text-slate-400">
              <div className="flex items-center justify-between">
                <span>線上人數</span>
                <span className="font-mono text-emerald-400 font-bold">{onlineCount} 人</span>
              </div>
              <div className="flex items-center justify-between">
                <span>伺服器狀態</span>
                <span className="font-mono text-cyan-400 font-bold">
                  {isFirebaseConfigured ? 'Firebase Asia 🟢' : '本地模擬 🟡'}
                </span>
              </div>

              {user && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onSignOut();
                  }}
                  className="w-full mt-2 py-2 bg-slate-900 hover:bg-rose-950/50 text-slate-300 hover:text-rose-300 text-xs font-bold rounded-xl border border-slate-800 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>登出帳號</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
