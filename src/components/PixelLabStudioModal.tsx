import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Map,
  Shirt,
  Layout,
  Key,
  Download,
  Check,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Sliders,
} from 'lucide-react';
import {
  PixelLabService,
  PixelLabGeneratedAsset,
  PixelLabGenerateParams,
} from '../services/pixelLabService';
import { sound } from '../services/audio';

interface PixelLabStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyMapBackground?: (imageUrl: string) => void;
  onEquipCustomClothing?: (category: 'top' | 'bottom' | 'hair' | 'accessory', itemDataUrl: string) => void;
}

export const PixelLabStudioModal: React.FC<PixelLabStudioModalProps> = ({
  isOpen,
  onClose,
  onApplyMapBackground,
  onEquipCustomClothing,
}) => {
  const [activeTab, setActiveTab] = useState<'map' | 'clothing' | 'ui' | 'settings'>('map');
  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState<'top' | 'bottom' | 'hair' | 'accessory'>('top');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentAsset, setCurrentAsset] = useState<PixelLabGeneratedAsset | null>(null);
  const [history, setHistory] = useState<PixelLabGeneratedAsset[]>([]);
  const [apiToken, setApiToken] = useState(PixelLabService.getToken());
  const [tokenSaved, setTokenSaved] = useState(false);
  const [applySuccessNotice, setApplySuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setHistory(PixelLabService.getHistory());
      setApiToken(PixelLabService.getToken());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Preset Prompts for instant discovery
  const mapPresets = [
    { label: '霓虹賽博龐克島嶼', prompt: 'Cyberpunk neon pixel island, high-tech asphalt roads, purple holographic buildings and glowing sea' },
    { label: '日系江戶復古小鎮', prompt: 'Cozy Japanese retro pixel town, wooden shingle cottages, stone path, cherry blossoms and quiet canal' },
    { label: '奇幻魔法水晶森林', prompt: 'Enchanted fantasy pixel grove with giant luminescent mushrooms, crystal trees and magic pond' },
    { label: '熱帶夏日陽光海灘', prompt: 'Tropical summer pixel beach, golden sand, palm trees, blue lagoon and wooden boardwalk piers' },
  ];

  const clothingPresets = [
    { label: '科技霓虹夾克', cat: 'top', prompt: 'Cyberpunk neon light runner jacket with glowing cyber collar' },
    { label: '黃金帝王戰甲', cat: 'top', prompt: 'Royal golden knight armor with crimson royal cape' },
    { label: '星空漸層法袍', cat: 'top', prompt: 'Mystic galaxy gradient wizard robe with starry embroidery' },
    { label: '火焰聖光戰翼', cat: 'accessory', prompt: 'Blazing phoenix sacred fire wings accessory' },
    { label: '賽博銀白短髮', cat: 'hair', prompt: 'Futuristic sleek silver white anime styled pixel hair' },
  ];

  const uiPresets = [
    { label: '9-Slice 對話框', cat: 'dialogue', prompt: 'Retro 16-bit RPG dialogue frame with ornate gold borders' },
    { label: '像素 3D 按鈕', cat: 'button', prompt: 'Chunky arcade bevel pixel button with jewel glow' },
    { label: '金色傳奇星章', cat: 'icon', prompt: 'Gilded five-star pixel victory achievement medal icon' },
  ];

  const handleGenerate = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt.trim()) return;

    sound.playClick();
    setIsGenerating(true);
    setApplySuccessNotice(null);

    try {
      const params: PixelLabGenerateParams = {
        type: activeTab === 'settings' ? 'map' : activeTab,
        prompt: finalPrompt,
        category: activeTab === 'clothing' ? category : undefined,
      };

      const asset = await PixelLabService.generateAsset(params);
      setCurrentAsset(asset);
      setHistory(PixelLabService.getHistory());
      sound.playSuccess();
    } catch (err: any) {
      alert(`生成失敗: ${err.message || err}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToken = () => {
    PixelLabService.setToken(apiToken);
    setTokenSaved(true);
    sound.playSuccess();
    setTimeout(() => setTokenSaved(false), 2000);
  };

  const handleApplyToGame = (asset: PixelLabGeneratedAsset) => {
    sound.playClick();
    if (asset.type === 'map') {
      if (onApplyMapBackground) {
        onApplyMapBackground(asset.imageUrl);
        setApplySuccessNotice('🎉 已成功替換為新遊戲世界背景！');
        setTimeout(() => setApplySuccessNotice(null), 3000);
      }
    } else if (asset.type === 'clothing') {
      if (onEquipCustomClothing) {
        onEquipCustomClothing((asset.category as any) || 'top', asset.imageUrl);
        setApplySuccessNotice('👗 已成功裝備最新 AI 設計服飾！');
        setTimeout(() => setApplySuccessNotice(null), 3000);
      }
    }
  };

  const handleDownload = (asset: PixelLabGeneratedAsset) => {
    const a = document.createElement('a');
    a.href = asset.imageUrl;
    a.download = `${asset.type}_${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-4xl h-[90vh] max-h-[760px] bg-slate-900 border-2 border-indigo-500/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 font-sans">
        
        {/* ================= MODAL HEADER ================= */}
        <div className="px-4 py-3 bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 border-b border-indigo-700/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/30 border border-indigo-400 flex items-center justify-center text-indigo-300 shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-300 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-indigo-200 to-purple-200">
                  PixelLab AI 創作者工坊
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-400/40">
                  api.pixellab.ai
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                AI 像素生成引擎：一鍵打造 16-Bit 專屬地圖、服飾外觀與 UI 介面
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= NAVIGATION TABS ================= */}
        <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('map');
                setPrompt('');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'map'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 border border-indigo-400'
                  : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Map className="w-4 h-4" />
              <span>地圖與世界</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('clothing');
                setPrompt('');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'clothing'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 border border-purple-400'
                  : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Shirt className="w-4 h-4" />
              <span>服飾與裝扮</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('ui');
                setPrompt('');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'ui'
                  ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/30 border border-pink-400'
                  : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Layout className="w-4 h-4" />
              <span>UI 介面與圖示</span>
            </button>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('settings');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-amber-600 text-white border border-amber-400'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">PixelLab API Key</span>
          </button>
        </div>

        {/* ================= MAIN CONTENT ================= */}
        <div className="flex-1 p-3 sm:p-5 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* LEFT PANEL: PROMPT & CONTROLS (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-3.5">
            
            {activeTab !== 'settings' ? (
              <>
                {/* Mode description & sub-selector */}
                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                      {activeTab === 'map' && '地圖生成模式 (Tileset / Map View)'}
                      {activeTab === 'clothing' && '服飾部位選擇 (Equippable Category)'}
                      {activeTab === 'ui' && 'UI 圖示類型 (Component Design)'}
                    </span>
                    <span className="text-[11px] text-indigo-400 font-mono">
                      {PixelLabService.hasToken() ? '● Live PixelLab API' : '● Instant Pixel Engine'}
                    </span>
                  </div>

                  {/* Sub-selector for Clothing */}
                  {activeTab === 'clothing' && (
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { id: 'top', label: '上衣 / 戰甲' },
                        { id: 'bottom', label: '褲裝 / 裙子' },
                        { id: 'hair', label: '髮型 / 髮色' },
                        { id: 'accessory', label: '羽翼 / 配件' },
                      ].map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            sound.playClick();
                            setCategory(c.id as any);
                          }}
                          className={`py-1.5 px-2 text-xs rounded-lg font-bold border transition-colors cursor-pointer ${
                            category === c.id
                              ? 'bg-purple-600 border-purple-400 text-white'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Presets Grid */}
                  <div className="mt-2.5">
                    <div className="text-[11px] text-slate-400 mb-1.5">💡 快速靈感範例 (點擊直接填入)：</div>
                    <div className="flex flex-wrap gap-1.5">
                      {activeTab === 'map' &&
                        mapPresets.map((p, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              sound.playClick();
                              setPrompt(p.prompt);
                              handleGenerate(p.prompt);
                            }}
                            className="px-2.5 py-1 bg-slate-800/80 hover:bg-indigo-900/60 text-slate-300 hover:text-indigo-200 border border-slate-700 hover:border-indigo-500 rounded-lg text-[11px] transition-all cursor-pointer flex items-center gap-1"
                          >
                            <span>{p.label}</span>
                            <ChevronRight className="w-3 h-3 opacity-60" />
                          </button>
                        ))}

                      {activeTab === 'clothing' &&
                        clothingPresets.map((p, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              sound.playClick();
                              setCategory(p.cat as any);
                              setPrompt(p.prompt);
                              handleGenerate(p.prompt);
                            }}
                            className="px-2.5 py-1 bg-slate-800/80 hover:bg-purple-900/60 text-slate-300 hover:text-purple-200 border border-slate-700 hover:border-purple-500 rounded-lg text-[11px] transition-all cursor-pointer flex items-center gap-1"
                          >
                            <span>{p.label}</span>
                            <ChevronRight className="w-3 h-3 opacity-60" />
                          </button>
                        ))}

                      {activeTab === 'ui' &&
                        uiPresets.map((p, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              sound.playClick();
                              setPrompt(p.prompt);
                              handleGenerate(p.prompt);
                            }}
                            className="px-2.5 py-1 bg-slate-800/80 hover:bg-pink-900/60 text-slate-300 hover:text-pink-200 border border-slate-700 hover:border-pink-500 rounded-lg text-[11px] transition-all cursor-pointer flex items-center gap-1"
                          >
                            <span>{p.label}</span>
                            <ChevronRight className="w-3 h-3 opacity-60" />
                          </button>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Prompt Textarea */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>自訂像素描述 (Prompt)：</span>
                    <span className="text-[10px] text-slate-500">支援中文或英文，越細緻效果越驚豔</span>
                  </label>
                  <textarea
                    rows={3}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={
                      activeTab === 'map'
                        ? '例如：日落金色沙灘、椰子樹與石砌小路，懷舊像素風格...'
                        : activeTab === 'clothing'
                        ? '例如：賽博龐克風格紫黑漸層風衣，帶有發光霓虹領口與腰帶...'
                        : '例如：金色 16-bit 像素 RPG 對話框，邊框飾有藍寶石...'
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none font-sans"
                  />
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleGenerate()}
                  disabled={isGenerating || !prompt.trim()}
                  className={`w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-[0.99] ${
                    isGenerating || !prompt.trim()
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white shadow-indigo-500/25 border border-indigo-400/80'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>PixelLab AI 正在精細雕刻像素...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>開始生成 {activeTab === 'map' ? '像素地圖' : activeTab === 'clothing' ? '服飾裝扮' : 'UI 元件'}</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              /* ================= SETTINGS TAB ================= */
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-col gap-4">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Key className="w-4 h-4" />
                  <span>PixelLab API 連線金鑰設定</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  本系統支援直連 <strong className="text-indigo-300">PixelLab 官方 API</strong> (
                  <code className="text-pink-300">api.pixellab.ai</code>)。若您已註冊 PixelLab，可在此填入您的
                  Secret API Token，所有生成請求將自動透過官方 GPU 像素大模型輸出！
                </p>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-300">PixelLab API Secret Token：</label>
                  <input
                    type="password"
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                    placeholder="輸入 Bearer YOUR_API_TOKEN..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <a
                    href="https://www.pixellab.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 underline underline-offset-2"
                  >
                    <span>前往 PixelLab 官網取得 Token</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={handleSaveToken}
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                  >
                    {tokenSaved ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>已儲存金鑰！</span>
                      </>
                    ) : (
                      <span>儲存設定</span>
                    )}
                  </button>
                </div>

                <div className="p-3 bg-indigo-950/40 border border-indigo-800/60 rounded-lg text-[11px] text-indigo-300">
                  💡 <strong>提示：</strong>若未填寫 Token，系統將無縫調用內建的<strong>高解析度 16-Bit 即時程序化像素引擎</strong>，依然可立刻生成並一鍵套用至遊戲中！
                </div>
              </div>
            )}

            {/* History Gallery */}
            {history.length > 0 && (
              <div className="mt-1 flex flex-col gap-1.5">
                <span className="text-xs font-bold text-slate-400">🕒 生成歷史紀錄 (點擊檢視)：</span>
                <div className="flex gap-2 overflow-x-auto pb-1.5">
                  {history.slice(0, 10).map((h) => (
                    <div
                      key={h.id}
                      onClick={() => {
                        sound.playClick();
                        setCurrentAsset(h);
                      }}
                      className={`w-16 h-16 rounded-xl border-2 shrink-0 cursor-pointer overflow-hidden p-1 bg-slate-950 transition-all ${
                        currentAsset?.id === h.id
                          ? 'border-indigo-400 scale-105 shadow-md shadow-indigo-500/30'
                          : 'border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <img
                        src={h.imageUrl}
                        alt={h.title}
                        className="w-full h-full object-contain"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANEL: PREVIEW & APPLY BUTTONS (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col bg-slate-950/60 rounded-xl border border-slate-800 p-3 sm:p-4">
            <div className="text-xs font-bold text-slate-300 flex items-center justify-between mb-2">
              <span>🖼️ 即時效果預覽</span>
              {currentAsset && (
                <span className="text-[10px] text-slate-400 font-mono">
                  {currentAsset.type.toUpperCase()}
                </span>
              )}
            </div>

            {/* Preview Box */}
            <div className="flex-1 min-h-[220px] rounded-xl border border-slate-700/80 bg-[#071329] flex flex-col items-center justify-center p-3 relative overflow-hidden group">
              {currentAsset ? (
                <>
                  <img
                    src={currentAsset.imageUrl}
                    alt={currentAsset.title}
                    className="max-w-full max-h-[240px] object-contain drop-shadow-xl"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <div className="absolute bottom-2 left-2 right-2 px-2 py-1 bg-black/70 backdrop-blur-xs rounded text-[10px] text-slate-300 truncate">
                    {currentAsset.title}
                  </div>
                </>
              ) : (
                <div className="text-center p-4 text-slate-500 flex flex-col items-center gap-2">
                  <Sparkles className="w-8 h-8 opacity-40 text-indigo-400" />
                  <p className="text-xs">請在左側輸入描述或點擊靈感範例，生成專屬像素素材</p>
                </div>
              )}
            </div>

            {/* Success notice */}
            {applySuccessNotice && (
              <div className="mt-2.5 p-2 bg-emerald-950/80 border border-emerald-500/80 rounded-lg text-xs text-emerald-200 text-center font-bold animate-bounce-short">
                {applySuccessNotice}
              </div>
            )}

            {/* Action Bar */}
            {currentAsset && (
              <div className="mt-3 flex flex-col gap-2">
                {currentAsset.type === 'map' && onApplyMapBackground && (
                  <button
                    onClick={() => handleApplyToGame(currentAsset)}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md border border-emerald-400/80 cursor-pointer flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>一鍵套用為遊戲世界地圖</span>
                  </button>
                )}

                {currentAsset.type === 'clothing' && onEquipCustomClothing && (
                  <button
                    onClick={() => handleApplyToGame(currentAsset)}
                    className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md border border-purple-400/80 cursor-pointer flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <Shirt className="w-4 h-4" />
                    <span>一鍵穿上此 AI 像素服飾</span>
                  </button>
                )}

                <button
                  onClick={() => handleDownload(currentAsset)}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>下載 PNG 高解析像素原檔</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ================= FOOTER ================= */}
        <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>PixelLab Multi-Model Integration Ready</span>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
