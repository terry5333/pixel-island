import React, { useState, useMemo } from 'react';
import { Item, EquippedItems, UserProfile } from '../types/game';
import { PixelAsset } from './PixelAsset';
import { CharacterSprite } from './CharacterSprite';
import { sound } from '../services/audio';
import { X, ShoppingBag, Shirt, Check, Coins, Sparkles } from 'lucide-react';

interface BoutiqueModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  items: Item[];
  itemsMap?: Record<string, Item>;
  onBuyItem: (item: Item) => Promise<void>;
  onEquipChange: (equipped: EquippedItems) => Promise<void>;
  initialTab?: 'shop' | 'wardrobe';
}

export const BoutiqueModal: React.FC<BoutiqueModalProps> = ({
  isOpen,
  onClose,
  user,
  items,
  itemsMap = {},
  onBuyItem,
  onEquipChange,
  initialTab = 'shop',
}) => {
  const [activeTab, setActiveTab] = useState<'shop' | 'wardrobe'>(initialTab);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewEquipped, setPreviewEquipped] = useState<EquippedItems>(user.equipped);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setPreviewEquipped(user.equipped);
      setActiveTab(initialTab);
    }
  }, [isOpen, user.equipped, initialTab]);

  const shopItems = useMemo(() => {
    return items.filter((it) => {
      if (selectedCategory === 'all') return true;
      return it.category === selectedCategory;
    });
  }, [items, selectedCategory]);

  const wardrobeItems = useMemo(() => {
    return items.filter((it) => {
      const isOwned = user.inventory.includes(it.id);
      if (!isOwned) return false;
      if (selectedCategory === 'all') return true;
      return it.category === selectedCategory;
    });
  }, [items, user.inventory, selectedCategory]);

  if (!isOpen) return null;

  const safeCoins = Math.max(0, user.coins || 0);

  const handleBuy = async (item: Item) => {
    if (safeCoins < item.price) {
      sound.playBump();
      setFeedback(`金幣不足！購買 ${item.name} 需要 ${item.price} 金幣，你目前擁有 ${safeCoins} 金幣。`);
      return;
    }

    try {
      await onBuyItem(item);
      sound.playBuy();
      setFeedback(`恭喜購得【${item.name}】！已收入你的和風衣櫃中。`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setFeedback('購買失敗: ' + errMsg);
    }
  };

  const handleTryOn = (item: Item) => {
    const cat = item.category as 'hair' | 'top' | 'bottom' | 'accessory';
    setPreviewEquipped((prev) => ({
      ...prev,
      [cat]: prev[cat] === item.id ? undefined : item.id,
    }));
    sound.playClick();
  };

  const handleToggleEquip = (item: Item) => {
    const cat = item.category as 'hair' | 'top' | 'bottom' | 'accessory';
    setPreviewEquipped((prev) => ({
      ...prev,
      [cat]: prev[cat] === item.id ? undefined : item.id,
    }));
    sound.playClick();
  };

  const handleSaveOutfit = async () => {
    setIsSaving(true);
    try {
      await onEquipChange(previewEquipped);
      sound.playWin();
      setFeedback('✨ 換裝成功！島上其他玩家已同步看到你的全新穿搭！');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setFeedback('儲存失敗: ' + errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Clean Light-Themed Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner">
              👘
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-wide text-white drop-shadow-xs flex items-center gap-1.5">
                {activeTab === 'shop' ? '和風・著物精品閣 (BOUTIQUE)' : '私藏和式衣櫃 (WARDROBE)'}
              </h2>
              <p className="text-[11px] text-pink-100 font-medium">傳統服飾・隨心試穿・全島同步</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {/* Coins Display */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 rounded-full text-xs font-bold text-slate-800 shadow-xs font-mono">
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              <span>{safeCoins.toLocaleString()}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-full text-white/90 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Clean Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-2.5 gap-2">
          <button
            onClick={() => {
              setActiveTab('shop');
              sound.playWindChime();
            }}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl border-t border-x flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'shop'
                ? 'bg-white border-slate-200 text-rose-600 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-rose-500" />
            著物陳列閣 (商店)
          </button>
          <button
            onClick={() => {
              setActiveTab('wardrobe');
              sound.playWindChime();
            }}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl border-t border-x flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'wardrobe'
                ? 'bg-white border-slate-200 text-rose-600 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <Shirt className="w-4 h-4 text-purple-500" />
            私藏衣櫃 (更衣)
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="px-5 py-2.5 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs flex items-center justify-between font-medium">
            <span>{feedback}</span>
            <button onClick={() => setFeedback(null)} className="text-rose-400 hover:text-rose-700 cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* Body Layout: Left Mannequin Preview, Right Item Catalog */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 p-4 sm:p-5 gap-4 bg-slate-50/50">
          {/* Mannequin Fitting Room Column */}
          <div className="md:col-span-4 flex flex-col items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="text-xs font-bold text-slate-700 text-center tracking-wide flex items-center gap-1.5">
              <span>🪞</span>
              <span>{activeTab === 'shop' ? '著物試穿立鏡' : '當前造型全身鏡'}</span>
            </div>

            {/* Scaled Up Character Preview */}
            <div className="my-auto py-6 flex flex-col items-center justify-center">
              <div className="p-5 bg-gradient-to-b from-indigo-50/50 to-pink-50/50 border border-slate-200 rounded-2xl shadow-sm">
                <CharacterSprite
                  displayName={user.displayName}
                  equipped={previewEquipped}
                  itemsMap={itemsMap}
                  isMoving={false}
                  size={96}
                  isSelf={true}
                />
              </div>
            </div>

            {/* Save Outfit Button for Wardrobe */}
            {activeTab === 'wardrobe' ? (
              <button
                onClick={handleSaveOutfit}
                disabled={isSaving}
                className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm shadow-rose-200 cursor-pointer active:scale-95 transition-all"
              >
                <Check className="w-4 h-4" />
                {isSaving ? '同步中...' : '確認換裝 (同步至全島)'}
              </button>
            ) : (
              <button
                onClick={() => setPreviewEquipped(user.equipped)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 cursor-pointer transition-colors"
              >
                重設試穿
              </button>
            )}
          </div>

          {/* Catalog & Wardrobe Items Column */}
          <div className="md:col-span-8 flex flex-col overflow-hidden">
            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 text-xs">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setSelectedCategory('hair')}
                className={`px-3.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                  selectedCategory === 'hair'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                髮型
              </button>
              <button
                onClick={() => setSelectedCategory('top')}
                className={`px-3.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                  selectedCategory === 'top'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                上衣・羽織
              </button>
              <button
                onClick={() => setSelectedCategory('bottom')}
                className={`px-3.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                  selectedCategory === 'bottom'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                下著・袴
              </button>
              <button
                onClick={() => setSelectedCategory('accessory')}
                className={`px-3.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                  selectedCategory === 'accessory'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                配件・飾物
              </button>
            </div>

            {/* Items Grid */}
            <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(activeTab === 'shop' ? shopItems : wardrobeItems).map((it) => {
                const isOwned = user.inventory.includes(it.id);
                const isEquipped =
                  previewEquipped[it.category as 'hair' | 'top' | 'bottom' | 'accessory'] === it.id;

                return (
                  <div
                    key={it.id}
                    onClick={() => {
                      if (activeTab === 'shop') handleTryOn(it);
                      else handleToggleEquip(it);
                    }}
                    className={`p-3 bg-white border rounded-2xl cursor-pointer flex flex-col justify-between transition-all shadow-xs ${
                      isEquipped
                        ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/30'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 my-1">
                        <PixelAsset
                          category={it.category}
                          item={it}
                          r2Url={it.r2Url}
                          width={48}
                          height={48}
                        />
                      </div>
                      <div className="font-bold text-xs text-slate-800 mt-1 max-w-full truncate">
                        {it.name}
                      </div>
                      <div className="text-[10px] text-slate-400 capitalize">
                        {it.category}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      {activeTab === 'shop' ? (
                        <>
                          <div className="text-[11px] font-bold text-amber-600 font-mono flex items-center gap-1">
                            <Coins className="w-3.5 h-3.5 text-amber-500" />
                            {it.price}
                          </div>
                          {isOwned ? (
                            <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                              已擁有
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBuy(it);
                              }}
                              className="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white font-bold text-[10px] rounded-lg shadow-xs cursor-pointer active:scale-95 transition-all"
                            >
                              購買
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="w-full flex items-center justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleEquip(it);
                            }}
                            className={`w-full py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                              isEquipped
                                ? 'bg-rose-500 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                            }`}
                          >
                            {isEquipped ? '✓ 已穿戴' : '點擊穿戴'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
