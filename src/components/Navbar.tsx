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
  const safeCoins = Math.max(0, user?.coins || 0);

  return (
    <>
      {/* ================= CLEAN LIGHT MODERN JAPANESE TOP HUD ================= */}
      <header className="fixed top-2.5 inset-x-2.5 sm:inset-x-4 z-40 flex items-center justify-between pointer-events-none select-none font-sans">
        {/* Left Clean Light Island Badge */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-md pointer-events-auto">
          <span className="text-base">🌸</span>
          <span className="text-slate-800 font-black text-xs sm:text-sm tracking-wide">
            昭和・櫻花島
          </span>
          {user && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="truncate max-w-[85px] sm:max-w-[120px] font-bold text-slate-700 text-xs bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                {user.displayName}
              </span>
            </div>
          )}
        </div>

        {/* Right Status & Action Capsules */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          {user && (
            <>
              {/* Gold Coins Pill */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-2xl border border-amber-200 shadow-sm text-xs font-bold text-amber-700 font-mono">
                <Coins className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="tracking-wide">{safeCoins.toLocaleString()}</span>
              </div>

              {/* House Upgrade Pill */}
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenHouseUpgrade();
                }}
                className="hidden xs:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-2xl shadow-sm active:scale-95 transition-all cursor-pointer"
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
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 shadow-sm active:scale-95 transition-all cursor-pointer"
                title="島民名冊"
              >
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">島民名冊</span>
                <span className="text-[10px] px-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full font-mono font-bold">
                  {onlineCount}
                </span>
              </button>
            </>
          )}

          {/* Sound Mute Toggle */}
          <button
            onClick={toggleSound}
            className="p-2 bg-white/95 hover:bg-slate-50 rounded-2xl text-slate-700 border border-slate-200 shadow-sm transition-colors cursor-pointer"
            title={muted ? '開啟音效' : '靜音'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
          </button>

          {/* Drawer Menu Button */}
          <button
            onClick={() => {
              sound.playClick();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="p-2 bg-white/95 hover:bg-slate-50 rounded-2xl text-slate-800 border border-slate-200 shadow-sm transition-colors cursor-pointer"
            title="功能目錄"
          >
            {isMenuOpen ? <X className="w-4 h-4 text-indigo-600" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ================= CLEAN LIGHT THEME DRAWER ================= */}
      {isMenuOpen && (
        <div
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-fade-in font-sans"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-72 sm:w-80 h-full bg-white border-l border-slate-200 p-5 flex flex-col justify-between shadow-2xl select-none text-slate-800"
          >
            {/* Drawer Top */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🌸</span>
                  <div>
                    <h3 className="font-black text-sm text-slate-800 tracking-wide">櫻花島・遊客導航</h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Showa Retro Island</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Identity Card */}
              {user ? (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between shadow-2xs">
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold">目前登入身分</div>
                    <div className="font-black text-sm text-slate-800 mt-0.5">{user.displayName}</div>
                    <div className="text-xs text-amber-600 font-mono font-bold mt-0.5">🪙 所持金：{safeCoins.toLocaleString()}</div>
                  </div>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenAuthModal();
                    }}
                    className="text-xs px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 cursor-pointer shadow-xs"
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
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-sm cursor-pointer"
                >
                  登入櫻花島
                </button>
              )}

              {/* Menu Navigation Links */}
              <div className="space-y-2 pt-2">
                {user && (
                  <>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenHouseUpgrade();
                      }}
                      className="w-full p-3 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-2xl flex items-center gap-3 border border-slate-200 shadow-2xs transition-all cursor-pointer"
                    >
                      <Home className="w-4 h-4 text-amber-500" />
                      <span>🏡 房屋升級工坊</span>
                      <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-mono font-bold border border-amber-200">
                        Lv.{houseLevel}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenWardrobe();
                      }}
                      className="w-full p-3 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-2xl flex items-center gap-3 border border-slate-200 shadow-2xs transition-all cursor-pointer"
                    >
                      <Shirt className="w-4 h-4 text-rose-500" />
                      <span>👘 和式著物衣櫃</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onToggleFriends();
                      }}
                      className="w-full p-3 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-2xl flex items-center gap-3 border border-slate-200 shadow-2xs transition-all cursor-pointer"
                    >
                      <Users className="w-4 h-4 text-indigo-500" />
                      <span>👥 島民好友名冊</span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenTutorial();
                  }}
                  className="w-full p-3 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-2xl flex items-center gap-3 border border-slate-200 shadow-2xs transition-all cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4 text-emerald-500" />
                  <span>📜 櫻花島新手導引指南</span>
                </button>

                {user?.role === 'admin' && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenAdmin();
                    }}
                    className="w-full p-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold rounded-2xl flex items-center gap-3 shadow-sm transition-all cursor-pointer"
                  >
                    <Shield className="w-4 h-4 text-amber-300" />
                    <span>👑 管理員後台控制中心</span>
                  </button>
                )}
              </div>
            </div>

            {/* Drawer Bottom */}
            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500">
              <div className="flex items-center justify-between">
                <span>島內即時在線</span>
                <span className="font-mono text-emerald-600 font-bold">{onlineCount} 人</span>
              </div>
              <div className="flex items-center justify-between">
                <span>連線狀態</span>
                <span className="font-mono text-slate-700 font-bold">
                  {isFirebaseConfigured ? '即時連線 🟢' : '本地模擬 🟡'}
                </span>
              </div>

              {user && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onSignOut();
                  }}
                  className="w-full mt-2 py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 text-xs font-bold rounded-2xl border border-slate-200 hover:border-rose-200 flex items-center justify-center gap-2 cursor-pointer transition-colors"
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
