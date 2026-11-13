import React, { useState } from 'react';
import { UserProfile } from '../types/game';
import { dbService } from '../services/dbService';
import { isFirebaseConfigured } from '../config/firebase';
import { sound } from '../services/audio';
import { X, LogIn, UserCheck, Shield } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [customName, setCustomName] = useState('');

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    sound.playClick();
    try {
      await dbService.signInWithGoogle();
      onClose();
    } catch (err: unknown) {
      alert('Google 登入失敗: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleSwitchMockUser = (uid: string, name: string, role: 'user' | 'admin' = 'user') => {
    sound.playClick();
    dbService.initMockDefaultUser(uid, name, role);
    onClose();
  };

  const handleCustomMockLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const uid = 'user_' + Math.floor(Math.random() * 10000);
    sound.playClick();
    dbService.initMockDefaultUser(uid, customName.trim(), 'user');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
      <div className="pixel-card w-full max-w-md bg-[#1e1b4b] border-4 border-slate-900 rounded-lg shadow-pixel-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-3 bg-slate-950 border-b-2 border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏝️</span>
            <h2 className="font-arcade text-xs sm:text-sm text-amber-400">
              {isFirebaseConfigured ? 'FIREBASE 玩家登入' : '玩家登入與身份切換'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4 text-xs">
          {currentUser && (
            <div className="p-3 bg-slate-900/90 border border-slate-700 rounded-lg flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400">目前登入角色：</div>
                <div className="font-bold text-amber-300 text-sm">{currentUser.displayName}</div>
                <div className="text-[10px] text-slate-400">UID: {currentUser.uid}</div>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  currentUser.role === 'admin'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {currentUser.role === 'admin' ? '👑 管理員 (Admin)' : '島民 (User)'}
              </span>
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            className="pixel-btn w-full py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded flex items-center justify-center gap-2 shadow-pixel text-xs sm:text-sm"
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
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>使用 Google 帳號登入</span>
          </button>

          {/* Quick Mock Switch for Local Testing */}
          <div className="pt-2 border-t border-slate-800">
            <div className="text-[11px] text-slate-400 font-bold mb-2">
              快速切換本地測試角色（可用不同分頁測試多人同島）：
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleSwitchMockUser('player_blue', '冒險家小藍', 'user')}
                className="p-2 bg-blue-950/80 hover:bg-blue-900 border border-blue-700 rounded text-center"
              >
                <div className="font-bold text-blue-300">小藍</div>
                <div className="text-[9px] text-blue-400">一般玩家</div>
              </button>
              <button
                onClick={() => handleSwitchMockUser('player_sakura', '探險家小櫻', 'user')}
                className="p-2 bg-pink-950/80 hover:bg-pink-900 border border-pink-700 rounded text-center"
              >
                <div className="font-bold text-pink-300">小櫻</div>
                <div className="text-[9px] text-pink-400">一般玩家</div>
              </button>
              <button
                onClick={() => handleSwitchMockUser('admin_boss', '島主管理員', 'admin')}
                className="p-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-700 rounded text-center"
              >
                <div className="font-bold text-rose-300 flex items-center justify-center gap-0.5">
                  <Shield className="w-3 h-3 text-amber-400" />
                  <span>管理員</span>
                </div>
                <div className="text-[9px] text-rose-400">擁有後台權限</div>
              </button>
            </div>
          </div>

          {/* Custom Name Login */}
          <form onSubmit={handleCustomMockLogin} className="flex gap-2">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="自訂島民暱稱..."
              className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-white"
            />
            <button
              type="submit"
              className="pixel-btn px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded"
            >
              進入島嶼
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
