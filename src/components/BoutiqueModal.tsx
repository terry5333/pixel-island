import React, { useState } from 'react';
import { Item, ItemCategory, UserProfile, EquippedItems } from '../types/game';
import { dbService } from '../services/dbService';
import { sound } from '../services/audio';
import { CharacterSprite } from './CharacterSprite';
import { PixelAsset } from './PixelAsset';
import { X, ShoppingBag, Shirt, Check, Coins } from 'lucide-react';

interface BoutiqueModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  items: Item[];
  initialTab?: 'shop' | 'wardrobe';
  onEquipChange: (newEquipped: EquippedItems) => Promise<void>;
  onBuyItem: (item: Item) => Promise<void>;
}

export const BoutiqueModal: React.FC<BoutiqueModalProps> = ({
  isOpen,
  onClose,
  user,
  items,
  initialTab = 'shop',
  onEquipChange,
  onBuyItem,
}) => {
  const [activeTab, setActiveTab] = useState<'shop' | 'wardrobe'>(initialTab);
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | 'all'>('all');

  // Preview outfit
  const [previewEquipped, setPreviewEquipped] = useState<EquippedItems>(user.equipped);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const itemsMap: Record<string, Item> = {};
  items.forEach((it) => {
    itemsMap[it.id] = it;
  });

  // Filter items for Shop
  const shopItems = items.filter((it) => {
    if (selectedCategory === 'all') return it.category !== 'tile';
    return it.category === selectedCategory;
  });

  // Filter items for Wardrobe (must be in user's inventory)
  const wardrobeItems = items.filter((it) => {
    if (!user.inventory.includes(it.id)) return false;
    if (selectedCategory === 'all') return it.category !== 'tile' && it.category !== 'furniture';
    return it.category === selectedCategory;
  });

  const handleTryOn = (item: Item) => {
    if (['hair', 'top', 'bottom', 'accessory'].includes(item.category)) {
      setPreviewEquipped((prev) => ({
        ...prev,
        [item.category]: item.id,
      }));
      sound.playClick();
    }
  };

  const handleBuy = async (item: Item) => {
    if (user.coins < item.price) {
      setFeedback('🪙 金幣不足！去遊樂場玩遊戲可以賺取金幣喔！');
      sound.playBump();
      return;
    }
    if (user.inventory.includes(item.id)) {
      setFeedback('您已經擁有這件商品囉！');
      sound.playBump();
      return;
    }

    try {
      await onBuyItem(item);
      sound.playBuy();
      setFeedback(`購買成功！獲得「${item.name}」`);
      // Auto try on
      handleTryOn(item);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setFeedback('購買失敗: ' + errMsg);
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs">
      <div className="pixel-card w-full max-w-4xl bg-[#1e1b4b] border-4 border-slate-900 rounded-lg shadow-pixel-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-3 bg-slate-950 border-b-2 border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{activeTab === 'shop' ? '🛍️' : '👗'}</span>
            <h2 className="font-arcade text-sm text-pink-400">
              {activeTab === 'shop' ? '島嶼精品服飾店 (BOUTIQUE)' : '個人衣櫃與穿搭 (WARDROBE)'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/80 border border-amber-600 rounded text-xs font-bold text-amber-300">
              <Coins className="w-3.5 h-3.5" />
              <span>{user.coins.toLocaleString()}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Tabs */}
        <div className="flex border-b-2 border-slate-800 bg-slate-900/60 px-4 pt-2 gap-2">
          <button
            onClick={() => {
              setActiveTab('shop');
              sound.playClick();
            }}
            className={`px-4 py-2 text-xs font-bold rounded-t border-t-2 border-x-2 flex items-center gap-1.5 ${
              activeTab === 'shop'
                ? 'bg-[#1e1b4b] border-slate-700 text-pink-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            服飾商城
          </button>
          <button
            onClick={() => {
              setActiveTab('wardrobe');
              sound.playClick();
            }}
            className={`px-4 py-2 text-xs font-bold rounded-t border-t-2 border-x-2 flex items-center gap-1.5 ${
              activeTab === 'wardrobe'
                ? 'bg-[#1e1b4b] border-slate-700 text-pink-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shirt className="w-3.5 h-3.5" />
            個人衣櫃
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="px-4 py-2 bg-pink-950/80 border-b border-pink-800 text-pink-200 text-xs flex items-center justify-between">
            <span>{feedback}</span>
            <button onClick={() => setFeedback(null)} className="text-pink-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Body Layout: Left Mannequin Preview, Right Item Catalog */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 p-4 gap-4">
          {/* Mannequin Fitting Room Column */}
          <div className="md:col-span-4 flex flex-col items-center justify-between p-4 bg-slate-950/80 border-2 border-slate-800 rounded-lg">
            <div className="text-xs font-bold text-slate-300 text-center">
              {activeTab === 'shop' ? '✨ 即時試穿預覽框' : '✨ 當前穿搭造型'}
            </div>

            {/* Scaled Up Character Preview */}
            <div className="my-auto py-6 flex flex-col items-center justify-center">
              <div className="p-4 bg-slate-900 border-2 border-amber-500/50 rounded-xl shadow-pixel">
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
                className="pixel-btn w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded flex items-center justify-center gap-1.5 shadow-pixel"
              >
                <Check className="w-4 h-4" />
                {isSaving ? '同步中...' : '確認換裝 (同步至全島)'}
              </button>
            ) : (
              <button
                onClick={() => setPreviewEquipped(user.equipped)}
                className="pixel-btn w-full py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded"
              >
                重設試穿
              </button>
            )}
          </div>

          {/* Catalog & Wardrobe Items Column */}
          <div className="md:col-span-8 flex flex-col overflow-hidden">
            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 text-xs">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 rounded font-bold transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-pink-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setSelectedCategory('hair')}
                className={`px-3 py-1 rounded font-bold transition-all ${
                  selectedCategory === 'hair'
                    ? 'bg-pink-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                髮型
              </button>
              <button
                onClick={() => setSelectedCategory('top')}
                className={`px-3 py-1 rounded font-bold transition-all ${
                  selectedCategory === 'top'
                    ? 'bg-pink-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                上衣
              </button>
              <button
                onClick={() => setSelectedCategory('bottom')}
                className={`px-3 py-1 rounded font-bold transition-all ${
                  selectedCategory === 'bottom'
                    ? 'bg-pink-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                下著
              </button>
              <button
                onClick={() => setSelectedCategory('accessory')}
                className={`px-3 py-1 rounded font-bold transition-all ${
                  selectedCategory === 'accessory'
                    ? 'bg-pink-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                配件
              </button>
              {activeTab === 'shop' && (
                <button
                  onClick={() => setSelectedCategory('furniture')}
                  className={`px-3 py-1 rounded font-bold transition-all ${
                    selectedCategory === 'furniture'
                      ? 'bg-pink-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  家具
                </button>
              )}
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
                    className={`pixel-card p-2.5 bg-slate-900/90 border-2 rounded-lg cursor-pointer flex flex-col justify-between transition-all ${
                      isEquipped
                        ? 'border-pink-500 bg-pink-950/40 ring-1 ring-pink-400'
                        : 'border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="p-2 bg-slate-950 rounded-md border border-slate-800 my-1">
                        <PixelAsset
                          category={it.category}
                          item={it}
                          r2Url={it.r2Url}
                          width={48}
                          height={48}
                        />
                      </div>
                      <div className="font-bold text-xs text-white mt-1 max-w-full truncate">
                        {it.name}
                      </div>
                      <div className="text-[10px] text-slate-400 capitalize">
                        {it.category}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      {activeTab === 'shop' ? (
                        <>
                          <div className="text-[11px] font-bold text-amber-400">
                            🪙 {it.price}
                          </div>
                          {isOwned ? (
                            <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-800">
                              已擁有
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBuy(it);
                              }}
                              className="pixel-btn px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] rounded"
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
                            className={`w-full py-1 text-[10px] font-bold rounded ${
                              isEquipped
                                ? 'bg-pink-600 text-white'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {isEquipped ? '✓ 已穿戴' : '點擊穿上'}
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
