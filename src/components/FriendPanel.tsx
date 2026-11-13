import React, { useState, useEffect } from 'react';
import { X, Users, UserPlus, Bell, Trash2, Home } from 'lucide-react';
import { dbService } from '../services/dbService';
import { FriendEntry, FriendRequest, IslandPresence } from '../types/game';

interface FriendPanelProps {
  currentUid: string;
  currentName: string;
  presences: Record<string, IslandPresence>;
  onClose: () => void;
  onVisitHome: (presence: IslandPresence) => void;
}

type Tab = 'friends' | 'requests' | 'search';

export const FriendPanel: React.FC<FriendPanelProps> = ({
  currentUid,
  currentName,
  presences,
  onClose,
  onVisitHome,
}) => {
  const [tab, setTab] = useState<Tab>('friends');
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sentUids, setSentUids] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsubFriends = dbService.subscribeToFriends(currentUid, setFriends);
    const unsubRequests = dbService.subscribeToFriendRequests(currentUid, setRequests);
    return () => {
      unsubFriends();
      unsubRequests();
    };
  }, [currentUid]);

  const pendingCount = requests.length;

  // Online players excluding self and existing friends
  const onlinePlayers = Object.values(presences).filter(
    (p) =>
      p.uid !== currentUid &&
      !friends.find((f) => f.uid === p.uid) &&
      (searchQuery === '' ||
        p.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAccept = async (fromUid: string) => {
    await dbService.acceptFriendRequest(currentUid, fromUid);
  };

  const handleReject = async (fromUid: string) => {
    await dbService.rejectFriendRequest(currentUid, fromUid);
  };

  const handleRemoveFriend = async (friendUid: string) => {
    await dbService.removeFriend(currentUid, friendUid);
  };

  const handleSendRequest = async (toUid: string, toName: string) => {
    await dbService.sendFriendRequest(currentUid, currentName, toUid, toName);
    setSentUids((prev) => new Set(prev).add(toUid));
  };

  const tabClass = (t: Tab) =>
    `flex-1 py-1.5 text-[11px] font-bold transition-colors ${
      tab === t
        ? 'bg-slate-700 text-amber-300'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
    }`;

  return (
    <div className="fixed right-0 top-0 h-full z-40 flex flex-col w-72 bg-[#181425] border-l-2 border-slate-700 shadow-pixel-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-400" />
          <span className="font-arcade text-xs text-amber-400">好友系統</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button className={tabClass('friends')} onClick={() => setTab('friends')}>
          👥 好友 ({friends.length})
        </button>
        <button className={tabClass('requests')} onClick={() => setTab('requests')}>
          🔔 申請{pendingCount > 0 && ` (${pendingCount})`}
        </button>
        <button className={tabClass('search')} onClick={() => setTab('search')}>
          🔍 搜尋
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {/* --- Friends Tab --- */}
        {tab === 'friends' && (
          <>
            {friends.length === 0 ? (
              <div className="text-center text-slate-500 text-xs mt-8">
                還沒有好友，去搜尋玩家吧！
              </div>
            ) : (
              friends.map((f) => {
                const presence = presences[f.uid];
                const isOnline = !!presence;
                return (
                  <div
                    key={f.uid}
                    className="flex items-center justify-between p-2 bg-slate-900 rounded border border-slate-800"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          isOnline ? 'bg-emerald-400' : 'bg-slate-600'
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">
                          {f.displayName}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {isOnline ? '● 線上' : '○ 離線'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isOnline && (
                        <button
                          onClick={() => onVisitHome(presence)}
                          title="拜訪小屋"
                          className="p-1 hover:bg-slate-700 rounded text-amber-400"
                        >
                          <Home className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveFriend(f.uid)}
                        title="刪除好友"
                        className="p-1 hover:bg-red-900 rounded text-slate-500 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* --- Requests Tab --- */}
        {tab === 'requests' && (
          <>
            {requests.length === 0 ? (
              <div className="text-center text-slate-500 text-xs mt-8">
                目前沒有好友申請
              </div>
            ) : (
              requests.map((r) => (
                <div
                  key={r.fromUid}
                  className="p-2 bg-slate-900 rounded border border-slate-700"
                >
                  <div className="text-xs font-bold text-white mb-1">{r.fromName}</div>
                  <div className="text-[10px] text-slate-500 mb-2">想加你為好友</div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleAccept(r.fromUid)}
                      className="flex-1 py-1 text-[11px] font-bold bg-emerald-700 hover:bg-emerald-600 text-white rounded"
                    >
                      接受
                    </button>
                    <button
                      onClick={() => handleReject(r.fromUid)}
                      className="flex-1 py-1 text-[11px] font-bold bg-slate-700 hover:bg-slate-600 text-slate-200 rounded"
                    >
                      拒絕
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* --- Search Tab --- */}
        {tab === 'search' && (
          <>
            <input
              type="text"
              placeholder="搜尋線上玩家名稱..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <div className="space-y-1.5 mt-1">
              {onlinePlayers.length === 0 ? (
                <div className="text-center text-slate-500 text-xs mt-6">
                  {searchQuery ? '找不到符合的玩家' : '沒有其他線上玩家'}
                </div>
              ) : (
                onlinePlayers.map((p) => (
                  <div
                    key={p.uid}
                    className="flex items-center justify-between p-2 bg-slate-900 rounded border border-slate-800"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{p.displayName}</div>
                      <div className="text-[10px] text-emerald-400">● 線上中</div>
                    </div>
                    <button
                      onClick={() => handleSendRequest(p.uid, p.displayName)}
                      disabled={sentUids.has(p.uid)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold ${
                        sentUids.has(p.uid)
                          ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                          : 'bg-cyan-700 hover:bg-cyan-600 text-white'
                      }`}
                    >
                      <UserPlus className="w-3 h-3" />
                      {sentUids.has(p.uid) ? '已送出' : '加好友'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/** Badge showing pending friend request count — used on the toggle button */
export const FriendBadge: React.FC<{ currentUid: string; onClick: () => void }> = ({
  currentUid,
  onClick,
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const unsub = dbService.subscribeToFriendRequests(currentUid, (reqs) => {
      setCount(reqs.length);
    });
    return unsub;
  }, [currentUid]);

  return (
    <button
      onClick={onClick}
      className="relative p-1.5 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-200 transition-colors"
      title="好友系統"
    >
      <Bell className="w-3.5 h-3.5 text-cyan-400" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
};
