import React, { useState } from 'react';
import { UserProfile } from '../types/game';
import { dbService } from '../services/dbService';
import { sound } from '../services/audio';
import { X, LogIn, UserCheck, Shield } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  isMandatory?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-black/75 backdrop-blur-xs select-none font-serif">
      <div className="w-full max-w-md bg-[#FFFDF9] border-4 border-[#5D4037] shadow-[8px_8px_0px_#5D4037] rounded-sm overflow-hidden flex flex-col relative text-[#2D1E18]">
        {/* Vermilion Stamp Watermark */}
        <div 
          className="absolute top-2 right-2 sm:right-4 w-18 h-18 rounded-full border-2 border-double border-[#C62828] text-[#C62828] flex flex-col items-center justify-center font-black leading-tight pointer-events-none opacity-85"
          style={{ transform: 'rotate(-10deg)' }}
        >
          <span className="text-[8px] border-b border-[#C62828] pb-0.5">昭和試驗局</span>
          <span className="text-xs">受 付 濟</span>
        </div>

        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#F7F3E9] border-b-4 border-double border-[#5D4037] flex items-center justify-between">
          <div>
            <div className="text-[9px] sm:text-[10px] text-[#8D6E63] font-bold tracking-[0.25em] uppercase">
              - CANDIDATE REGISTRATION DESK -
            </div>
            <h2 className="text-lg sm:text-xl font-black tracking-[0.2em] text-[#2D1E18]">
              {isMandatory ? '受驗生入局登記' : '考局身分登記與切換'}
            </h2>
          </div>

          {!isMandatory && (
            <button
              onClick={onClose}
              className="p-1 border border-[#5D4037] hover:bg-[#EFEBE4] text-[#5D4037] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Official Google Sign-in */}
          <div>
            <div className="text-xs font-bold text-[#8D6E63] mb-2 tracking-wider">
              【 甲等正式證明 】Google 雲端帳號聯動：
            </div>
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3 bg-[#FFFDF9] hover:bg-[#F7F3E9] text-[#2D1E18] font-black text-xs sm:text-sm tracking-widest border-2 border-[#5D4037] shadow-[4px_4px_0px_#5D4037] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <LogIn className="w-4 h-4 text-[#C62828]" />
              <span>{loading ? '公文聯網查驗中...' : '以 Google 帳號正式入局'}</span>
            </button>
            <p className="text-[10px] text-[#8D6E63] mt-1 text-center">
              ※ 管理員 (ltairui79@gmail.com) 登入後將直接引導至試驗局總務後台
            </p>
          </div>

          <div className="border-t-2 border-dashed border-[#5D4037] relative my-2">
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#FFFDF9] px-2 text-[10px] font-bold text-[#8D6E63]">
              或使用自訂名冊入局
            </span>
          </div>

          {/* Quick Custom Nickname Input */}
          <form onSubmit={handleCustomNickLogin} className="space-y-2">
            <label className="block text-xs font-bold text-[#8D6E63]">
              【 乙等受驗生簽名 】自訂考生名諱：
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="例如：夏目漱石、芥川..."
                maxLength={12}
                className="flex-1 p-2 bg-[#F7F3E9] border-2 border-[#5D4037] text-xs font-bold text-[#2D1E18] focus:outline-none shadow-[2px_2px_0px_#5D4037]"
              />
              <button
                type="submit"
                disabled={!customName.trim()}
                className="px-4 py-2 bg-[#5D4037] hover:bg-[#4E342E] text-[#FFFDF9] text-xs font-black tracking-widest border-2 border-[#2D1E18] shadow-[2px_2px_0px_#2D1E18] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer disabled:opacity-40"
              >
                入局
              </button>
            </div>
          </form>

          {/* Quick preset candidates */}
          <div>
            <div className="text-[11px] font-bold text-[#8D6E63] mb-2">
              快捷選派名冊代行：
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickCharacter('太宰治')}
                className="p-2 bg-[#F7F3E9] hover:bg-[#EFEBE4] border border-[#5D4037] text-[#2D1E18] font-bold text-center shadow-[2px_2px_0px_#5D4037] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
              >
                文豪・太宰治
              </button>
              <button
                type="button"
                onClick={() => handleQuickCharacter('宮澤賢治')}
                className="p-2 bg-[#F7F3E9] hover:bg-[#EFEBE4] border border-[#5D4037] text-[#2D1E18] font-bold text-center shadow-[2px_2px_0px_#5D4037] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
              >
                詩人・宮澤賢治
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
