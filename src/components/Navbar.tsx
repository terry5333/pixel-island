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
  Sparkles, 
  LogOut, 
  Radio
} from 'lucide-react';
import { isFirebaseConfigured } from '../config/firebase';

interface NavbarProps {
  user: UserProfile | null;
  onlineCount: number;
  onOpenAdmin: () => void;
  onOpenWardrobe: () => void;
  onOpenAuthModal: () => void;
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

  return (
    <>
      {/* ================= MINIMALIST RETRO TOP STATUS CAPSULE (參考截圖極簡風格) ================= */}
      <div className="fixed top-3 right-3 z-40 flex items-center gap-2 pointer-events-auto">
        {/* Sleek Floating Status Pill */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-950/80 backdrop-blur-md rounded-full border border-slate-700/80 shadow-pixel-sm text-xs select-none">
          {/* Signal Indicator (as seen in top-right of reference photo) */}
          <div className="flex items-end gap-0.5 h-3 pr-1 border-r border-slate-700" title="即時連線信號良好">
            <span className="w-1 h-1.5 bg-emerald-400 rounded-xs" />
            <span className="w-1 h-2 bg-emerald-400 rounded-xs" />
            <span className="w-1 h-2.5 bg-emerald-400 rounded-xs" />
            <span className="w-1 h-3 bg-emerald-400 rounded-xs" />
          </div>

          {/* Coins Counter */}
          {user && (
            <div className="flex items-center gap-1 font-bold text-amber-300">
              <span className="text-xs">🪙</span>
              <span>{user.coins.toLocaleString()}</span>
            </div>
          )}

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-1 hover:bg-slate-800 rounded-full text-slate-300 transition-colors"
            title={muted ? '開啟音效' : '靜音'}
          >
            {muted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>

          {/* Menu Drawer Toggle Button */}
          <button
            onClick={() => {
              sound.playClick();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="p-1 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-200 transition-colors"
            title="選單"
          >
            {isMenuOpen ? <X className="w-3.5 h-3.5 text-amber-400" /> : <Menu className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ================= SLEEK RETRO SLIDE-OUT MENU DRAWER ================= */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-fade-in">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-72 sm:w-80 h-full bg-[#181425] border-l-3 border-slate-800 p-5 flex flex-col justify-between shadow-pixel-lg"
          >
            {/* Drawer Header */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏝️</span>
                  <div>
                    <h2 className="font-arcade text-xs text-amber-400">PIXEL ISLAND</h2>
                    <span className="text-[10px] text-slate-400">
                      {isFirebaseConfigured ? '🟢 Firebase 雲端伺服器' : '⚡ 本地連線模式'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* User Profile Card */}
              {user && (
                <div className="mt-4 p-3 bg-slate-900/90 rounded-lg border border-slate-700/80 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400">目前登入玩家</div>
                    <div className="font-bold text-sm text-amber-300">{user.displayName}</div>
                    <div className="text-[10px] text-emerald-400 mt-0.5">● 線上中 ({onlineCount} 人在島)</div>
                  </div>
                  <button
                    onClick={() => {
                      onOpenAuthModal();
                      setIsMenuOpen(false);
                    }}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                    title="切換身份"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </button>
                </div>
              )}

              {/* Navigation Options */}
              <div className="flex flex-col gap-2 mt-5 text-xs font-bold">
                <button
                  onClick={() => {
                    sound.playClick();
                    onOpenWardrobe();
                    setIsMenuOpen(false);
                  }}
                  className="pixel-btn w-full p-2.5 bg-purple-700 hover:bg-purple-600 text-white rounded flex items-center gap-2.5"
                >
                  <Shirt className="w-4 h-4" />
                  <span>個人衣櫃與穿搭</span>
                </button>

                {user?.role === 'admin' && (
                  <button
                    onClick={() => {
                      sound.playClick();
                      onOpenAdmin();
                      setIsMenuOpen(false);
                    }}
                    className="pixel-btn w-full p-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded flex items-center gap-2.5"
                  >
                    <Shield className="w-4 h-4 text-amber-300" />
                    <span>🛠️ 管理員動態素材後台</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    sound.playClick();
                    onOpenAuthModal();
                    setIsMenuOpen(false);
                  }}
                  className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded flex items-center gap-2.5"
                >
                  <Radio className="w-4 h-4 text-cyan-400" />
                  <span>切換角色 / 登入帳號</span>
                </button>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-500">
                2D 像素島 v2.0
              </span>
              <button
                onClick={() => {
                  onSignOut();
                  setIsMenuOpen(false);
                }}
                className="px-2.5 py-1 bg-red-950/80 hover:bg-red-900 text-red-300 rounded border border-red-800 flex items-center gap-1 text-[11px]"
              >
                <LogOut className="w-3 h-3" />
                登出
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
