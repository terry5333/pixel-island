import React from 'react';
import { IslandPresence, Item } from '../types/game';
import { CharacterSprite } from './CharacterSprite';
import { sound } from '../services/audio';
import { X, Gamepad2, Home, Hand, UserPlus } from 'lucide-react';
import { dbService } from '../services/dbService';

interface PlayerActionModalProps {
  player: IslandPresence | null;
  currentUid: string;
  currentName: string;
  itemsMap: Record<string, Item>;
  onClose: () => void;
  onChallenge: (player: IslandPresence) => void;
  onVisitHome: (player: IslandPresence) => void;
  onSendWave: (player: IslandPresence) => void;
}

export const PlayerActionModal: React.FC<PlayerActionModalProps> = ({
  player,
  currentUid,
  currentName,
  itemsMap,
  onClose,
  onChallenge,
  onVisitHome,
  onSendWave,
}) => {
  if (!player) return null;

  const handleAddFriend = async () => {
    sound.playClick();
    await dbService.sendFriendRequest(currentUid, currentName, player.uid, player.displayName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between shadow-xs">
          <span className="text-sm font-bold text-white flex items-center gap-1.5">
            <span>👥</span> 島民互動交流
          </span>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full text-white/90 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Player Profile Preview */}
        <div className="p-5 flex flex-col items-center gap-3 bg-slate-50/50">
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <CharacterSprite
              displayName={player.displayName}
              facing={player.facing}
              equipped={player.equipped}
              itemsMap={itemsMap}
              size={80}
            />
          </div>

          <div className="text-center">
            <div className="font-black text-base text-slate-800">{player.displayName}</div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-mono">UID: #{player.uid.slice(-6)}</div>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex flex-col gap-2 mt-2 text-xs">
            <button
              onClick={() => {
                sound.playClick();
                onChallenge(player);
                onClose();
              }}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-sm shadow-indigo-200 active:scale-95 transition-all cursor-pointer"
            >
              <Gamepad2 className="w-4 h-4" />
              發起對戰邀請 (1A2B / OOXX)
            </button>

            <button
              onClick={() => {
                sound.playDoor();
                onVisitHome(player);
                onClose();
              }}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-2xl flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
              拜訪他的個人小屋
            </button>

            <button
              onClick={handleAddFriend}
              className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-2xl border border-slate-200 flex items-center justify-center gap-2 shadow-2xs active:scale-95 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-indigo-600" />
              加為好友 ➕
            </button>

            <button
              onClick={() => {
                sound.playPop();
                onSendWave(player);
                onClose();
              }}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Hand className="w-4 h-4 text-amber-500" />
              揮手打招呼 👋
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
