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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
      <div className="pixel-card w-full max-w-4xl bg-[#201109] border-4 border-[#8b4513] rounded-2xl shadow-[0_0_35px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh] font-serif text-[#fef08a]">
        {/* Japanese Showa Lacquer Wood Header */}
        <div className="p-3 bg-[#150a04] border-b-2 border-[#8b4513] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏮</span>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#fef08a] tracking-wider flex items-center gap-1.5">
                {activeTab === 'shop' ? '和風・著物精品閣 (BOUTIQUE)' : '私藏桐木和式衣櫃 (WARDROBE)'}
              </h2>
              <p className="text-[10px] text-[#fed7aa]">昭和傳統服飾・全島造型同步</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Senryobako Japanese Gold Coins Box */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#3a1d0d] border border-[#b45309] rounded-full text-xs font-bold text-[#fbbf24] shadow-inner">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>{user.coins.toLocaleString()}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-[#3a1d0d] rounded-lg text-[#fed7aa] hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Japanese Wooden Plaque Tabs */}
        <div className="flex border-b-2 border-[#8b4513] bg-[#1a0c06] px-4 pt-2 gap-2">
          <button
            onClick={() => {
              setActiveTab('shop');
              sound.playWindChime();
            }}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg border-t-2 border-x-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'shop'
                ? 'bg-[#201109] border-[#b45309] text-[#fef08a] shadow-md'
                : 'border-transparent text-[#fed7aa]/70 hover:text-[#fed7aa] hover:bg-[#281309]'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
            著物陳列閣
          </button>
          <button
            onClick={() => {
              setActiveTab('wardrobe');
              sound.playWindChime();
            }}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg border-t-2 border-x-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'wardrobe'
                ? 'bg-[#201109] border-[#b45309] text-[#fef08a] shadow-md'
                : 'border-transparent text-[#fed7aa]/70 hover:text-[#fed7aa] hover:bg-[#281309]'
            }`}
          >
            <Shirt className="w-3.5 h-3.5 text-rose-400" />
            私藏衣櫃
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="px-4 py-2 bg-[#991b1b]/90 border-b border-[#f59e0b] text-[#fef08a] text-xs flex items-center justify-between">
            <span>{feedback}</span>
            <button onClick={() => setFeedback(null)} className="text-[#fef08a] hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Body Layout: Left Mannequin Preview, Right Item Catalog */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 p-4 gap-4">
          {/* Mannequin Fitting Room Column */}
          <div className="md:col-span-4 flex flex-col items-center justify-between p-4 bg-[#150a04] border-2 border-[#8b4513] rounded-xl shadow-inner">
            <div className="text-xs font-bold text-[#fed7aa] text-center tracking-wide">
              {activeTab === 'shop' ? '⛩️ 著物試穿立鏡' : '⛩️ 當前造型鏡台'}
            </div>

            {/* Scaled Up Character Preview inside Japanese Wood Frame */}
            <div className="my-auto py-6 flex flex-col items-center justify-center">
              <div className="p-4 bg-[#231006] border-2 border-[#b45309] rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.8)]">
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
                className="w-full py-2.5 bg-[#991b1b] hover:bg-[#b91c1c] text-[#fef08a] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border-2 border-[#f59e0b] shadow-lg cursor-pointer tracking-wider active:scale-95 transition-all"
              >
                <Check className="w-4 h-4" />
                {isSaving ? '同步中...' : '確認換裝 (同步至全島)'}
              </button>
            ) : (
              <button
                onClick={() => setPreviewEquipped(user.equipped)}
                className="w-full py-2 bg-[#33180c] hover:bg-[#451e0e] text-[#fed7aa] font-bold text-xs rounded-xl border border-[#8b4513] cursor-pointer"
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
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-[#991b1b] text-[#fef08a] border border-[#f59e0b]'
                    : 'bg-[#2a140a] text-[#fed7aa] border border-[#78350f] hover:bg-[#381a0d]'
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setSelectedCategory('hair')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedCategory === 'hair'
                    ? 'bg-[#991b1b] text-[#fef08a] border border-[#f59e0b]'
                    : 'bg-[#2a140a] text-[#fed7aa] border border-[#78350f] hover:bg-[#381a0d]'
                }`}
              >
                髮型
              </button>
              <button
                onClick={() => setSelectedCategory('top')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedCategory === 'top'
                    ? 'bg-[#991b1b] text-[#fef08a] border border-[#f59e0b]'
                    : 'bg-[#2a140a] text-[#fed7aa] border border-[#78350f] hover:bg-[#381a0d]'
                }`}
              >
                上衣・羽織
              </button>
              <button
                onClick={() => setSelectedCategory('bottom')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedCategory === 'bottom'
                    ? 'bg-[#991b1b] text-[#fef08a] border border-[#f59e0b]'
                    : 'bg-[#2a140a] text-[#fed7aa] border border-[#78350f] hover:bg-[#381a0d]'
                }`}
              >
                下著・袴
              </button>
              <button
                onClick={() => setSelectedCategory('accessory')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedCategory === 'accessory'
                    ? 'bg-[#991b1b] text-[#fef08a] border border-[#f59e0b]'
                    : 'bg-[#2a140a] text-[#fed7aa] border border-[#78350f] hover:bg-[#381a0d]'
                }`}
              >
                配件・飾物
              </button>
              {activeTab === 'shop' && (
                <button
                  onClick={() => setSelectedCategory('furniture')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    selectedCategory === 'furniture'
                      ? 'bg-[#991b1b] text-[#fef08a] border border-[#f59e0b]'
                      : 'bg-[#2a140a] text-[#fed7aa] border border-[#78350f] hover:bg-[#381a0d]'
                  }`}
                >
                  和式家具
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
                    className={`p-2.5 bg-[#2a140a] border-2 rounded-xl cursor-pointer flex flex-col justify-between transition-all shadow-md ${
                      isEquipped
                        ? 'border-[#f59e0b] bg-[#4a1c0d] ring-2 ring-[#fde047]'
                        : 'border-[#78350f] hover:border-[#b45309]'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="p-2 bg-[#1a0c06] rounded-xl border border-[#78350f] my-1">
                        <PixelAsset
                          category={it.category}
                          item={it}
                          r2Url={it.r2Url}
                          width={48}
                          height={48}
                        />
                      </div>
                      <div className="font-bold text-xs text-[#fef08a] mt-1 max-w-full truncate tracking-wide">
                        {it.name}
                      </div>
                      <div className="text-[10px] text-[#fed7aa]/70 capitalize">
                        {it.category}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[#78350f]/60 flex items-center justify-between">
                      {activeTab === 'shop' ? (
                        <>
                          <div className="text-[11px] font-bold text-[#fbbf24]">
                            🪙 {it.price}
                          </div>
                          {isOwned ? (
                            <span className="text-[9px] bg-[#1a3818] text-[#86efac] px-2 py-0.5 rounded-md border border-[#22c55e]">
                              已收藏
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBuy(it);
                              }}
                              className="px-2.5 py-1 bg-[#b45309] hover:bg-[#d97706] text-[#fef08a] font-bold text-[10px] rounded-lg border border-[#fef08a] shadow cursor-pointer active:scale-95 transition-all"
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
                                ? 'bg-[#991b1b] text-[#fef08a] border border-[#f59e0b]'
                                : 'bg-[#381a0d] text-[#fed7aa] hover:bg-[#4a2211] border border-[#78350f]'
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
