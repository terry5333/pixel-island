import React, { useState, useEffect, useCallback } from 'react';
import { Item, ItemCategory, UserProfile, ArcadeRoom } from '../types/game';
import { dbService } from '../services/dbService';
import { sound } from '../services/audio';
import {
  X, Plus, Upload, Trash2, Edit2, Check, RefreshCw, Sparkles,
  Users, Home, LayoutDashboard, Shirt, Settings, Coins, 
  Eye, Ban, ChevronDown, ChevronUp, Zap, Globe, Activity
} from 'lucide-react';
import { PixelAsset } from './PixelAsset';

// Gemini API key: environment variable with base64 encoded fallback and localStorage persistence
const DEFAULT_GEMINI_KEY = typeof atob !== 'undefined'
  ? atob('QVEuQWI4Uk42SnMya2VBd21SNE1SM2psbEpUQmNiTVhaSERVakFGVjFGd29CX09yNFE3MHc=')
  : '';

type AdminTab = 'dashboard' | 'items' | 'players' | 'rooms';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  items: Item[];
  presences?: Record<string, any>;
}

export const AdminDashboardModal: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  items,
  presences = {},
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex bg-[#0d0f1a]">
      {/* Sidebar */}
      <div className="w-16 sm:w-56 h-full bg-[#13162b] border-r border-indigo-900/60 flex flex-col shrink-0">
        {/* Logo */}
        <div className="p-3 sm:p-4 border-b border-indigo-900/60">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">🏝️</span>
            <div className="hidden sm:block">
              <div className="font-black text-xs text-amber-400 tracking-wider">PIXEL ISLAND</div>
              <div className="text-[10px] text-indigo-400">管理員後台</div>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-2 space-y-1">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: '島嶼總覽', color: 'text-cyan-400' },
            { id: 'items', icon: Shirt, label: '服裝管理', color: 'text-pink-400' },
            { id: 'players', icon: Users, label: '玩家管理', color: 'text-emerald-400' },
            { id: 'rooms', icon: Home, label: '房間管理', color: 'text-amber-400' },
          ].map((nav) => (
            <button
              key={nav.id}
              onClick={() => { sound.playClick(); setActiveTab(nav.id as AdminTab); }}
              className={`w-full flex items-center gap-2 px-2 sm:px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === nav.id
                  ? 'bg-indigo-600/40 border border-indigo-500/60 text-white shadow-lg'
                  : 'text-slate-400 hover:bg-indigo-900/30 hover:text-slate-200'
              }`}
            >
              <nav.icon className={`w-4 h-4 shrink-0 ${nav.color}`} />
              <span className="hidden sm:inline">{nav.label}</span>
            </button>
          ))}
        </nav>

        {/* Close */}
        <div className="p-2">
          <button
            onClick={() => { sound.playClick(); onClose(); }}
            className="w-full flex items-center gap-2 px-2 sm:px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/70 text-rose-400 text-xs font-bold border border-rose-800/60 cursor-pointer transition-all"
          >
            <X className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">關閉後台</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-[#0d0f1a]">
        {activeTab === 'dashboard' && <DashboardTab presences={presences} items={items} />}
        {activeTab === 'items' && <ItemsTab items={items} />}
        {activeTab === 'players' && <PlayersTab />}
        {activeTab === 'rooms' && <RoomsTab />}
      </div>
    </div>
  );
};

// ======================= DASHBOARD TAB =======================
const DashboardTab: React.FC<{ presences: Record<string, any>; items: Item[] }> = ({ presences, items }) => {
  const onlineCount = Object.keys(presences).length;
  const totalItems = items.length;
  const wearableItems = items.filter(i => ['hair','top','bottom','accessory'].includes(i.category)).length;
  const furnitureItems = items.filter(i => i.category === 'furniture').length;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white">🏝️ 像素島嶼 Dashboard</h1>
        <p className="text-xs text-slate-400 mt-1">即時島嶼運作狀態總覽</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: '線上玩家', value: onlineCount, icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-950/40 border-emerald-700/60' },
          { label: '服裝素材', value: wearableItems, icon: Shirt, color: 'text-pink-400', bg: 'bg-pink-950/40 border-pink-700/60' },
          { label: '家具道具', value: furnitureItems, icon: Home, color: 'text-amber-400', bg: 'bg-amber-950/40 border-amber-700/60' },
          { label: '全部素材', value: totalItems, icon: Globe, color: 'text-cyan-400', bg: 'bg-cyan-950/40 border-cyan-700/60' },
        ].map((stat) => (
          <div key={stat.label} className={`p-4 rounded-2xl border ${stat.bg} flex flex-col gap-1`}>
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
            <div className={`text-2xl sm:text-3xl font-black ${stat.color}`}>{stat.value}</div>
            <div className="text-[11px] text-slate-400 font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Online Players List */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
        <h2 className="font-black text-sm text-white mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          目前線上玩家
        </h2>
        {Object.keys(presences).length === 0 ? (
          <p className="text-xs text-slate-500">目前無玩家在線</p>
        ) : (
          <div className="space-y-2">
            {Object.values(presences).map((p: any) => (
              <div key={p.uid} className="flex items-center justify-between p-2 bg-slate-800/60 rounded-xl text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="font-bold text-white">{p.displayName}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400">
                  <span>📍 ({Math.round(p.x || 0)}, {Math.round(p.y || 0)})</span>
                  <span className="capitalize">{p.currentPlace || 'island'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats Chart (bar) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
        <h2 className="font-black text-sm text-white mb-3">🎯 素材分類分佈</h2>
        {[
          { cat: 'top', label: '上衣', color: 'bg-pink-500' },
          { cat: 'bottom', label: '褲裝', color: 'bg-blue-500' },
          { cat: 'hair', label: '髮型', color: 'bg-amber-500' },
          { cat: 'accessory', label: '配件', color: 'bg-purple-500' },
          { cat: 'furniture', label: '家具', color: 'bg-emerald-500' },
        ].map(({ cat, label, color }) => {
          const count = items.filter(i => i.category === cat).length;
          const pct = totalItems > 0 ? Math.round((count / totalItems) * 100) : 0;
          return (
            <div key={cat} className="flex items-center gap-3 mb-2">
              <span className="text-xs text-slate-400 w-10">{label}</span>
              <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className={`${color} h-full rounded-full transition-all`} style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs text-slate-400 w-8 text-right">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ======================= ITEMS TAB (服裝管理 + Gemini AI) =======================
const ItemsTab: React.FC<{ items: Item[] }> = ({ items }) => {
  const [view, setView] = useState<'list' | 'add' | 'ai'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ItemCategory>('top');
  const [price, setPrice] = useState(150);
  const [r2Url, setR2Url] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [secondaryColor, setSecondaryColor] = useState('#1d4ed8');
  const [variant, setVariant] = useState('tshirt');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Gemini AI states
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiCategory, setAiCategory] = useState<ItemCategory>('top');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiGeneratedItems, setAiGeneratedItems] = useState<Partial<Item>[]>([]);
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return localStorage.getItem('pixel_island_gemini_key') || (import.meta.env.VITE_GEMINI_API_KEY as string) || DEFAULT_GEMINI_KEY;
  });
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  const resetForm = () => {
    setName(''); setCategory('top'); setPrice(150); setR2Url('');
    setColor('#3b82f6'); setSecondaryColor('#1d4ed8'); setVariant('tshirt');
    setDescription(''); setEditingId(null);
  };

  const handleEditClick = (item: Item) => {
    setEditingId(item.id); setName(item.name); setCategory(item.category);
    setPrice(item.price); setR2Url(item.r2Url || ''); setColor(item.color || '#3b82f6');
    setSecondaryColor(item.secondaryColor || '#1d4ed8'); setVariant(item.variant || 'default');
    setDescription(item.description || ''); setView('add');
    sound.playClick();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      setMessage('正在上傳圖片至 Cloudflare R2...');
      const uploadedUrl = await dbService.uploadR2Asset(file);
      setR2Url(uploadedUrl);
      setMessage('✅ 上傳成功！');
      sound.playSuccess?.();
    } catch (err: any) {
      setMessage(`❌ 上傳失敗: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) { setMessage('請輸入名稱'); return; }
    setIsSubmitting(true);
    try {
      const itemData: Omit<Item, 'id'> = { name, category, price, r2Url: r2Url || undefined, color, secondaryColor, variant, description };
      if (editingId) {
        await dbService.updateItem(editingId, itemData);
        setMessage('✅ 更新成功！');
      } else {
        await dbService.addItem(itemData);
        setMessage('✅ 新增成功！');
      }
      sound.playSuccess?.();
      resetForm();
      setTimeout(() => setView('list'), 1000);
    } catch (err: any) {
      setMessage(`❌ 失敗: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定刪除此服裝素材？')) return;
    await dbService.deleteItem(id);
    sound.playClick();
  };

  // Gemini AI clothing generation
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    const key = geminiApiKey.trim();
    if (!key) {
      setMessage('❌ 請先設定 Gemini API Key');
      setShowApiKeyInput(true);
      return;
    }
    setIsAiGenerating(true);
    setAiGeneratedItems([]);
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `你是一個像素 RPG 遊戲服裝設計師。根據以下描述，生成 3 個服裝設計方案，以 JSON 陣列格式回傳（不加 markdown code block），格式如下：
[{"name":"服裝名稱","category":"${aiCategory}","price":數字,"color":"#hex主色","secondaryColor":"#hex輔色","variant":"tshirt|hoodie|jacket|dress|kimono|default","description":"中文描述"}]

描述：${aiPrompt}

注意：
- name 要有創意，帶有日式昭和風格或動漫感
- color 和 secondaryColor 要搭配好看
- price 在 100~500 之間
- variant 只能選 tshirt, hoodie, jacket, dress, kimono, default 之一
- 只回傳純 JSON 陣列，不加任何說明文字`
            }]
          }]
        })
      });
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanText);
      setAiGeneratedItems(parsed);
      sound.playSuccess?.();
    } catch (err: any) {
      setMessage(`❌ AI 生成失敗: ${err.message}`);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleAiSave = async (item: Partial<Item>) => {
    try {
      await dbService.addItem({
        name: item.name || 'AI 生成服裝',
        category: (item.category as ItemCategory) || 'top',
        price: item.price || 150,
        color: item.color,
        secondaryColor: item.secondaryColor,
        variant: item.variant,
        description: item.description,
      });
      setMessage('✅ 已新增至服裝庫！');
      sound.playSuccess?.();
    } catch (err: any) {
      setMessage(`❌ 儲存失敗: ${err.message}`);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Shirt className="w-5 h-5 text-pink-400" />
            服裝素材管理
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">共 {items.length} 件素材</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { sound.playClick(); setView('ai'); }}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border transition-all ${view === 'ai' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-indigo-950/60 border-indigo-700/60 text-indigo-300 hover:bg-indigo-900/60'}`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Gemini AI 生成
          </button>
          <button
            onClick={() => { sound.playClick(); resetForm(); setView(view === 'add' ? 'list' : 'add'); }}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border transition-all ${view === 'add' ? 'bg-pink-600 border-pink-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
          >
            <Plus className="w-3.5 h-3.5" />
            {view === 'add' ? '取消' : '新增素材'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-xl text-xs font-bold border ${message.startsWith('✅') ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300' : 'bg-rose-950/60 border-rose-700 text-rose-300'}`}>
          {message}
        </div>
      )}

      {/* Gemini AI Panel */}
      {view === 'ai' && (
        <div className="bg-gradient-to-br from-indigo-950/60 to-purple-950/60 border border-indigo-700/60 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <div>
                <h3 className="font-black text-sm text-white">Gemini AI 服裝設計師</h3>
                <p className="text-[11px] text-indigo-300">描述你想要的服裝，AI 自動生成設計方案</p>
              </div>
            </div>
            <button
              onClick={() => setShowApiKeyInput(prev => !prev)}
              className="text-[10px] text-indigo-300 hover:text-white px-2 py-1 bg-indigo-900/60 hover:bg-indigo-800 rounded-lg border border-indigo-700/60 cursor-pointer flex items-center gap-1"
            >
              <Settings className="w-3 h-3" />
              <span>{showApiKeyInput ? '隱藏金鑰' : '金鑰設定'}</span>
            </button>
          </div>

          {showApiKeyInput && (
            <div className="p-2.5 bg-slate-900/90 rounded-xl border border-indigo-600/40 space-y-1.5">
              <label className="text-[10px] font-bold text-indigo-200">Gemini API Key：</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={e => {
                    const val = e.target.value;
                    setGeminiApiKey(val);
                    localStorage.setItem('pixel_island_gemini_key', val);
                  }}
                  placeholder="輸入 Gemini API Key..."
                  className="flex-1 px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono"
                />
                <button
                  onClick={() => {
                    localStorage.setItem('pixel_island_gemini_key', geminiApiKey);
                    setMessage('✅ 金鑰已儲存！');
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  儲存
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <select
              value={aiCategory}
              onChange={e => setAiCategory(e.target.value as ItemCategory)}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-400 cursor-pointer"
            >
              <option value="top">上衣</option>
              <option value="bottom">下裝</option>
              <option value="hair">髮型</option>
              <option value="accessory">配件</option>
            </select>
          </div>

          <div className="flex gap-2">
            <textarea
              rows={3}
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              placeholder="例如：昭和時代復古和服，紅白相間，帶有金色腰帶和花紋刺繡..."
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-400 resize-none"
            />
          </div>

          <button
            onClick={handleAiGenerate}
            disabled={isAiGenerating || !aiPrompt.trim()}
            className={`w-full py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 cursor-pointer transition-all ${
              isAiGenerating || !aiPrompt.trim()
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white shadow-lg'
            }`}
          >
            {isAiGenerating ? (
              <><RefreshCw className="w-4 h-4 animate-spin" />Gemini 正在設計中...</>
            ) : (
              <><Sparkles className="w-4 h-4 text-amber-300" />生成 3 款設計方案</>
            )}
          </button>

          {/* AI Generated Results */}
          {aiGeneratedItems.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-indigo-300">✨ AI 生成的 {aiGeneratedItems.length} 款設計：</h4>
              {aiGeneratedItems.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-900/80 border border-slate-700 rounded-xl flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg border border-slate-600 shrink-0"
                    style={{ backgroundColor: item.color || '#3b82f6' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-white">{item.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{item.description}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded">{item.variant}</span>
                      <span className="text-[10px] text-amber-400">🪙 {item.price}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAiSave(item)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1 shrink-0"
                  >
                    <Check className="w-3 h-3" />
                    儲存
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Form */}
      {view === 'add' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h3 className="font-black text-sm text-white">{editingId ? '✏️ 編輯素材' : '+ 新增服裝素材'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 mb-1 block">名稱</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="服裝名稱" className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-pink-400" />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 mb-1 block">類別</label>
              <select value={category} onChange={e => setCategory(e.target.value as ItemCategory)} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-pink-400">
                <option value="top">上衣</option>
                <option value="bottom">下裝</option>
                <option value="hair">髮型</option>
                <option value="accessory">配件</option>
                <option value="furniture">家具</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-400 mb-1 block">售價 (金幣)</label>
              <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-pink-400" />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 mb-1 block">外觀樣式</label>
              <input value={variant} onChange={e => setVariant(e.target.value)} placeholder="tshirt/hoodie/kimono..." className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-pink-400" />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 mb-1 block">主色</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-10 h-8 rounded border border-slate-700 bg-slate-800 cursor-pointer" />
                <input value={color} onChange={e => setColor(e.target.value)} className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-pink-400 font-mono" />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-slate-400 mb-1 block">輔色</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-10 h-8 rounded border border-slate-700 bg-slate-800 cursor-pointer" />
                <input value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-pink-400 font-mono" />
              </div>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-slate-400 mb-1 block">R2 圖片連結（選填）</label>
            <div className="flex gap-2">
              <input value={r2Url} onChange={e => setR2Url(e.target.value)} placeholder="https://..." className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-pink-400 font-mono" />
              <label className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer border transition-all flex items-center gap-1 ${isUploading ? 'bg-slate-700 text-slate-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'}`}>
                <Upload className="w-3.5 h-3.5" />
                {isUploading ? '上傳中...' : '上傳'}
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
              </label>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-slate-400 mb-1 block">描述</label>
            <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="商品說明..." className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-pink-400 resize-none" />
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`w-full py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 cursor-pointer transition-all ${isSubmitting ? 'bg-slate-700 text-slate-400' : 'bg-pink-600 hover:bg-pink-500 text-white shadow-md'}`}
          >
            {isSubmitting ? <><RefreshCw className="w-4 h-4 animate-spin" />儲存中...</> : <><Check className="w-4 h-4" />{editingId ? '更新素材' : '新增素材'}</>}
          </button>
        </div>
      )}

      {/* Item List */}
      {view === 'list' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[1fr_60px_60px_60px_80px] text-[11px] font-bold text-slate-400 px-4 py-2 border-b border-slate-800">
            <span>名稱 / 類別</span>
            <span>主色</span>
            <span>售價</span>
            <span>預覽</span>
            <span>操作</span>
          </div>
          <div className="divide-y divide-slate-800">
            {items.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">尚無服裝素材，點擊新增或使用 AI 生成</div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="grid grid-cols-[1fr_60px_60px_60px_80px] items-center px-4 py-2.5 hover:bg-slate-800/40 transition-colors">
                  <div>
                    <div className="font-bold text-xs text-white">{item.name}</div>
                    <div className="text-[10px] text-slate-400">{item.category}</div>
                  </div>
                  <div className="w-6 h-6 rounded-lg border border-slate-700" style={{ backgroundColor: item.color || '#3b82f6' }} />
                  <div className="text-xs text-amber-400 font-mono">🪙{item.price}</div>
                  <div className="w-8 h-8">
                    <PixelAsset category={item.category as any} item={item} width={32} height={32} />
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => handleEditClick(item)} className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg cursor-pointer transition-colors">
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 bg-rose-900/60 hover:bg-rose-700 text-rose-300 rounded-lg cursor-pointer transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ======================= PLAYERS TAB =======================
const PlayersTab: React.FC = () => {
  const [players, setPlayers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editCoins, setEditCoins] = useState<Record<string, number>>({});
  const [savingUid, setSavingUid] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadPlayers = useCallback(async () => {
    setLoading(true);
    const data = await dbService.adminGetAllUsers();
    setPlayers(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadPlayers(); }, [loadPlayers]);

  const handleSaveCoins = async (uid: string) => {
    const coins = editCoins[uid];
    if (coins === undefined) return;
    setSavingUid(uid);
    await dbService.adminUpdateUserCoins(uid, coins);
    setMessage(`✅ 已更新玩家金幣`);
    sound.playSuccess?.();
    setSavingUid(null);
    setTimeout(() => setMessage(null), 2000);
  };

  const handleDeletePlayer = async (uid: string, name: string) => {
    if (!confirm(`確定刪除玩家「${name}」？此操作無法還原。`)) return;
    await dbService.adminDeleteUser(uid);
    setMessage(`✅ 已刪除玩家 ${name}`);
    loadPlayers();
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            玩家管理
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">共 {players.length} 名玩家</p>
        </div>
        <button onClick={loadPlayers} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer border border-slate-700 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {message && (
        <div className="p-3 rounded-xl text-xs font-bold bg-emerald-950/60 border border-emerald-700 text-emerald-300">
          {message}
        </div>
      )}

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[1fr_80px_100px_60px] text-[11px] font-bold text-slate-400 px-4 py-2 border-b border-slate-800">
          <span>玩家</span>
          <span>等級</span>
          <span>金幣調整</span>
          <span>操作</span>
        </div>
        {loading ? (
          <div className="p-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            載入玩家資料中...
          </div>
        ) : players.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">尚無玩家資料</div>
        ) : (
          <div className="divide-y divide-slate-800">
            {players.map((player) => (
              <div key={player.uid} className="grid grid-cols-[1fr_80px_100px_60px] items-center px-4 py-3 hover:bg-slate-800/40 transition-colors">
                <div>
                  <div className="font-bold text-xs text-white flex items-center gap-1.5">
                    {player.role === 'admin' && <span className="text-amber-400">👑</span>}
                    {player.displayName}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate max-w-[180px]">{player.email}</div>
                </div>
                <div>
                  <span className="px-2 py-0.5 rounded-lg bg-amber-950/60 text-amber-300 text-[10px] font-bold border border-amber-700/60">
                    Lv.{player.houseLevel || 1}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    defaultValue={player.coins}
                    onChange={e => setEditCoins(prev => ({ ...prev, [player.uid]: Number(e.target.value) }))}
                    className="w-16 px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={() => handleSaveCoins(player.uid)}
                    disabled={savingUid === player.uid || editCoins[player.uid] === undefined}
                    className="p-1 bg-emerald-800 hover:bg-emerald-700 text-emerald-200 rounded-lg cursor-pointer transition-colors disabled:opacity-40"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex gap-1">
                  {player.role !== 'admin' && (
                    <button
                      onClick={() => handleDeletePlayer(player.uid, player.displayName)}
                      className="p-1.5 bg-rose-900/60 hover:bg-rose-700 text-rose-300 rounded-lg cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ======================= ROOMS TAB =======================
const RoomsTab: React.FC = () => {
  const [rooms, setRooms] = useState<ArcadeRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    const data = await dbService.adminGetAllArcadeRooms();
    setRooms(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadRooms(); }, [loadRooms]);

  const handleDelete = async (roomId: string) => {
    if (!confirm(`確定刪除房間 #${roomId}？`)) return;
    await dbService.adminDeleteArcadeRoom(roomId);
    setMessage(`✅ 已刪除房間 #${roomId}`);
    loadRooms();
    sound.playClick();
  };

  const gameTypeLabel: Record<string, string> = {
    '1a2b': '🔢 1A2B 猜數字',
    'ooxx': '⭕ 無限 OOXX',
    'battleship': '🚢 海戰棋',
    'dots_boxes': '📦 點線棋',
    'slots': '🎰 777 拉霸',
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Home className="w-5 h-5 text-amber-400" />
            遊戲房間管理
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">共 {rooms.length} 個活躍房間</p>
        </div>
        <button onClick={loadRooms} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer border border-slate-700 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {message && (
        <div className="p-3 rounded-xl text-xs font-bold bg-emerald-950/60 border border-emerald-700 text-emerald-300">
          {message}
        </div>
      )}

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[80px_1fr_1fr_60px_60px] text-[11px] font-bold text-slate-400 px-4 py-2 border-b border-slate-800">
          <span>房號</span>
          <span>遊戲</span>
          <span>狀態</span>
          <span>人數</span>
          <span>操作</span>
        </div>
        {loading ? (
          <div className="p-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            載入房間資料中...
          </div>
        ) : rooms.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">目前無活躍遊戲房間</div>
        ) : (
          <div className="divide-y divide-slate-800">
            {rooms.map((room) => (
              <div key={room.roomId} className="grid grid-cols-[80px_1fr_1fr_60px_60px] items-center px-4 py-3 hover:bg-slate-800/40 transition-colors">
                <div className="font-mono font-black text-sm text-amber-400">#{room.roomId}</div>
                <div className="text-xs text-slate-200">{gameTypeLabel[room.gameType] || room.gameType}</div>
                <div>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                    room.status === 'waiting' ? 'bg-amber-950/60 text-amber-300 border-amber-700/60' :
                    room.status === 'playing' ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60' :
                    'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {room.status === 'waiting' ? '等待中' : room.status === 'playing' ? '遊戲中' : '已結束'}
                  </span>
                </div>
                <div className="text-xs text-slate-300">
                  {room.playerIds?.length || 0}/{room.maxPlayers || 2}
                </div>
                <div>
                  <button
                    onClick={() => handleDelete(room.roomId)}
                    className="p-1.5 bg-rose-900/60 hover:bg-rose-700 text-rose-300 rounded-lg cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
