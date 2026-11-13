import React, { useState } from 'react';
import { UserProfile } from '../types/game';
import { dbService } from '../services/dbService';
import { isFirebaseConfigured } from '../config/firebase';
import { sound } from '../services/audio';
import { X, LogIn, UserCheck, Shield, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  isMandatory?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  isMandatory = false,
}) => {
  const [customName, setCustomName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    sound.playClick();
    setLoading(true);
    try {
      await dbService.signInWithGoogle();
      onClose();
    } catch (err: unknown) {
      alert('Google 登入失敗: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleCustomNickLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    sound.playClick();
    const uid = 'user_' + Math.floor(1000 + Math.random() * 9000);
    const profile = dbService.initMockDefaultUser(uid, customName.trim(), 'user');
    // Save to guest storage
    localStorage.setItem('pixel_island_firebase_guest', JSON.stringify(profile));
    onClose();
  };

  const handleQuickCharacter = (name: string, role: 'user' | 'admin' = 'user') => {
    sound.playClick();
    const uid = 'user_' + Math.floor(1000 + Math.random() * 9000);
    const profile = dbService.initMockDefaultUser(uid, name, role);
    localStorage.setItem('pixel_island_firebase_guest', JSON.stringify(profile));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-black/85 backdrop-blur-sm select-none">
      <div className="w-full max-w-md bg-[#0f172a] border-4 border-amber-500 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🏝️</span>
            <div>
              <h2 className="font-arcade text-xs sm:text-sm text-amber-400">
                {isMandatory ? '登入像素島 · 開啟島民身分' : '玩家身分與帳號切換'}
              </h2>
              <p className="text-[10px] text-slate-400">PIXEL ISLAND AUTHENTICATION</p>
            </div>
          </div>
          {!isMandatory && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4 text-xs">
          {currentUser && !isMandatory && (
            <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400">目前登入身分：</div>
                <div className="font-bold text-amber-300 text-sm">{currentUser.displayName}</div>
                <div className="text-[10px] text-slate-400">UID: {currentUser.uid}</div>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  currentUser.role === 'admin'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {currentUser.role === 'admin' ? '👑 管理員' : '島民'}
              </span>
            </div>
          )}

          {/* Option A: Google Official Sign-In */}
          {isFirebaseConfigured && (
            <div className="space-y-2">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3 bg-white hover:bg-slate-100 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg text-xs sm:text-sm cursor-pointer transition-transform active:scale-95"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.67v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.16z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.56H1.25C.45 8.15 0 9.99 0 12s.45 3.85 1.25 5.44l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.56l4.03 3.15c.95-2.83 3.6-4.96 6.72-4.96z"
                  />
                </svg>
                <span>使用 Google 帳號一鍵登入 (推薦)</span>
              </button>

              <div className="flex items-center gap-3 my-2 text-slate-500 text-[10px]">
                <div className="flex-1 h-px bg-slate-800" />
                <span>或直接輸入暱稱遊玩</span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>
            </div>
          )}

          {/* Option B: Enter Custom Nickname */}
          <form onSubmit={handleCustomNickLogin} className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="輸入你的自訂島民暱稱 (如: Terry)"
                maxLength={12}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={!customName.trim()}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl cursor-pointer shadow-md active:scale-95 transition-transform"
              >
                進入遊戲 🚀
              </button>
            </div>
          </form>

          {/* Quick Preset Characters */}
          <div className="pt-2 border-t border-slate-800">
            <div className="text-[10px] text-slate-400 mb-2 font-bold">快速選擇角色：</div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleQuickCharacter('Terry', 'admin')}
                className="p-2 bg-slate-900 hover:bg-slate-800 border border-amber-500/40 rounded-xl flex flex-col items-center gap-0.5 cursor-pointer active:scale-95 transition-transform"
              >
                <span className="text-base">👑</span>
                <span className="font-bold text-amber-300 text-[11px]">Terry</span>
                <span className="text-[9px] text-slate-400">管理員</span>
              </button>
              <button
                onClick={() => handleQuickCharacter('小智', 'user')}
                className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl flex flex-col items-center gap-0.5 cursor-pointer active:scale-95 transition-transform"
              >
                <span className="text-base">🧢</span>
                <span className="font-bold text-slate-200 text-[11px]">小智</span>
                <span className="text-[9px] text-slate-400">訓練家</span>
              </button>
              <button
                onClick={() => handleQuickCharacter('小霞', 'user')}
                className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl flex flex-col items-center gap-0.5 cursor-pointer active:scale-95 transition-transform"
              >
                <span className="text-base">🌊</span>
                <span className="font-bold text-slate-200 text-[11px]">小霞</span>
                <span className="text-[9px] text-slate-400">水系館主</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
