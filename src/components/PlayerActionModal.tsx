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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs">
      <div className="pixel-card w-full max-w-sm bg-[#1e1b4b] border-4 border-slate-900 rounded-lg shadow-pixel-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-3 bg-slate-950 border-b-2 border-slate-800 flex items-center justify-between">
          <span className="font-arcade text-xs text-amber-400">島民互動</span>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player Profile Preview */}
        <div className="p-5 flex flex-col items-center gap-3">
          <div className="p-3 bg-slate-900 border-2 border-slate-700 rounded-xl shadow-pixel">
            <CharacterSprite
              displayName={player.displayName}
              facing={player.facing}
              equipped={player.equipped}
              itemsMap={itemsMap}
              size={80}
            />
          </div>

          <div className="text-center">
            <div className="font-bold text-base text-white">{player.displayName}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">UID: {player.uid}</div>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex flex-col gap-2 mt-2 text-xs">
            <button
              onClick={() => {
                sound.playClick();
                onChallenge(player);
                onClose();
              }}
              className="pixel-btn w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded flex items-center justify-center gap-2"
            >
              <Gamepad2 className="w-4 h-4" />
              發起遊樂場對戰邀請 (1A2B / OOXX)
            </button>

            <button
              onClick={() => {
                sound.playDoor();
                onVisitHome(player);
                onClose();
              }}
              className="pixel-btn w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              拜訪他的個人小屋
            </button>

            <button
              onClick={handleAddFriend}
              className="pixel-btn w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              加為好友 ➕
            </button>

            <button
              onClick={() => {
                sound.playEmoji();
                onSendWave(player);
                onClose();
              }}
              className="pixel-btn w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded flex items-center justify-center gap-2"
            >
              <Hand className="w-4 h-4 text-amber-400" />
              向他揮手打招呼 (👋)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
