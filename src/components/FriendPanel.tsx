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
    `flex-1 py-2 text-xs font-bold transition-all ${
      tab === t
        ? 'bg-white text-indigo-600 border-b-2 border-indigo-600 shadow-2xs'
        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
    }`;

  return (
    <div className="fixed right-0 top-0 h-full z-40 flex flex-col w-72 sm:w-80 bg-white border-l border-slate-200 shadow-2xl font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-600" />
          <span className="font-bold text-sm text-slate-800">島民好友系統</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-50 border-b border-slate-200">
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
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/50">
        {/* --- Friends Tab --- */}
        {tab === 'friends' && (
          <>
            {friends.length === 0 ? (
              <div className="text-center text-slate-400 text-xs mt-10">
                目前尚無好友，去搜尋或點擊島民加好友吧！
              </div>
            ) : (
              friends.map((f) => {
                const presence = presences[f.uid];
                const isOnline = !!presence;
                return (
                  <div
                    key={f.uid}
                    className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 truncate">
                          {f.displayName}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {isOnline ? '● 在線中' : '○ 離線'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isOnline && (
                        <button
                          onClick={() => onVisitHome(presence)}
                          title="拜訪小屋"
                          className="p-1 hover:bg-slate-100 rounded-lg text-amber-500 cursor-pointer"
                        >
                          <Home className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveFriend(f.uid)}
                        title="刪除好友"
                        className="p-1 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-500 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
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
              <div className="text-center text-slate-400 text-xs mt-10">
                目前沒有新的好友申請
              </div>
            ) : (
              requests.map((r) => (
                <div
                  key={r.fromUid}
                  className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs"
                >
                  <div className="text-xs font-bold text-slate-800 mb-0.5">{r.fromName}</div>
                  <div className="text-[10px] text-slate-400 mb-2">請求新增你為好友</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(r.fromUid)}
                      className="flex-1 py-1 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-2xs cursor-pointer"
                    >
                      接受
                    </button>
                    <button
                      onClick={() => handleReject(r.fromUid)}
                      className="flex-1 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg cursor-pointer"
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
              placeholder="搜尋線上島民名稱..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-2xs"
            />
            <div className="space-y-1.5 mt-2">
              {onlinePlayers.length === 0 ? (
                <div className="text-center text-slate-400 text-xs mt-8">
                  {searchQuery ? '找不到符合名稱的玩家' : '目前沒有其他線上玩家'}
                </div>
              ) : (
                onlinePlayers.map((p) => (
                  <div
                    key={p.uid}
                    className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800">{p.displayName}</div>
                      <div className="text-[10px] text-emerald-600 font-medium">● 線上遊玩中</div>
                    </div>
                    <button
                      onClick={() => handleSendRequest(p.uid, p.displayName)}
                      disabled={sentUids.has(p.uid)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        sentUids.has(p.uid)
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs'
                      }`}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
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
      className="relative p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-full text-slate-600 shadow-2xs transition-colors cursor-pointer"
      title="好友系統"
    >
      <Bell className="w-4 h-4 text-indigo-600" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
};
