import React, { useState } from 'react';
import { Item, ItemCategory } from '../types/game';
import { dbService } from '../services/dbService';
import { sound } from '../services/audio';
import { PixelAsset } from './PixelAsset';
import { X, Plus, Upload, Trash2, Edit2, Check, RefreshCw } from 'lucide-react';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Item[];
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  items,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ItemCategory>('top');
  const [price, setPrice] = useState(150);
  const [zIndex, setZIndex] = useState(30);
  const [r2Url, setR2Url] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [secondaryColor, setSecondaryColor] = useState('#1d4ed8');
  const [variant, setVariant] = useState('tshirt');
  const [walkable, setWalkable] = useState(false);
  const [description, setDescription] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setCategory('top');
    setPrice(150);
    setZIndex(30);
    setR2Url('');
    setColor('#3b82f6');
    setSecondaryColor('#1d4ed8');
    setVariant('tshirt');
    setWalkable(false);
    setDescription('');
    setEditingId(null);
  };

  const handleEditClick = (item: Item) => {
    setEditingId(item.id);
    setName(item.name);
    setCategory(item.category);
    setPrice(item.price);
    setZIndex(item.zIndex || 30);
    setR2Url(item.r2Url || '');
    setColor(item.color || '#3b82f6');
    setSecondaryColor(item.secondaryColor || '#1d4ed8');
    setVariant(item.variant || 'default');
    setWalkable(Boolean(item.walkable));
    setDescription(item.description || '');
    setActiveTab('add');
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
      setMessage('上傳成功！已帶入 R2 圖片網址');
      sound.playWin();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setMessage('上傳失敗: ' + errMsg);
      sound.playBump();
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const itemData: Omit<Item, 'id'> = {
        name,
        category,
        price: Number(price),
        zIndex: Number(zIndex),
        r2Url: r2Url.trim() || undefined,
        color,
        secondaryColor,
        variant,
        walkable,
        description,
      };

      if (editingId) {
        await dbService.updateItem(editingId, itemData);
        setMessage('商品更新成功！');
      } else {
        await dbService.addItem(itemData);
        setMessage('商品上架成功！已動態寫入 Firestore');
      }

      sound.playBuy();
      resetForm();
      setActiveTab('list');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setMessage('儲存失敗: ' + errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('確定要下架此商品嗎？')) {
      await dbService.deleteItem(id);
      sound.playBump();
    }
  };

  // Preview mock item
  const previewItem: Item = {
    id: 'preview',
    name: name || '預覽商品',
    category,
    price,
    r2Url: r2Url || undefined,
    color,
    secondaryColor,
    variant,
    zIndex,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs">
      <div className="pixel-card w-full max-w-3xl bg-[#1e1b4b] border-4 border-slate-900 rounded-lg shadow-pixel-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-3 bg-slate-950 border-b-2 border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛠️</span>
            <h2 className="font-arcade text-sm text-rose-400">
              ADMIN DASHBOARD - 動態素材與商品後台
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b-2 border-slate-800 bg-slate-900/60 px-4 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-3 py-1.5 text-xs font-bold rounded-t border-t-2 border-x-2 ${
              activeTab === 'list'
                ? 'bg-[#1e1b4b] border-slate-700 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            商品列表 ({items.length})
          </button>
          <button
            onClick={() => {
              if (activeTab === 'list') resetForm();
              setActiveTab('add');
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-t border-t-2 border-x-2 flex items-center gap-1 ${
              activeTab === 'add'
                ? 'bg-[#1e1b4b] border-slate-700 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            {editingId ? '編輯商品' : '新增商品 / 上傳 R2'}
          </button>
        </div>

        {/* Feedback message */}
        {message && (
          <div className="px-4 py-2 bg-amber-950/80 border-b border-amber-800/80 text-amber-300 text-xs flex items-center justify-between">
            <span>{message}</span>
            <button onClick={() => setMessage(null)} className="text-amber-500 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Tab Content */}
        <div className="p-4 overflow-y-auto flex-1">
          {activeTab === 'list' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {items.map((it) => (
                <div
                  key={it.id}
                  className="pixel-card p-3 bg-slate-900/80 border-2 border-slate-800 rounded flex flex-col justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-slate-950 border border-slate-700 rounded flex-shrink-0">
                      <PixelAsset
                        category={it.category}
                        item={it}
                        r2Url={it.r2Url}
                        width={48}
                        height={48}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-white truncate">{it.name}</div>
                      <div className="text-[10px] text-amber-400 mt-0.5">🪙 {it.price} 金幣</div>
                      <div className="text-[9px] text-slate-400 mt-1 capitalize">
                        類別: {it.category} | Z: {it.zIndex || 30}
                      </div>
                      {it.r2Url && (
                        <div className="text-[9px] text-emerald-400 mt-0.5 truncate" title={it.r2Url}>
                          ☁️ R2: {it.r2Url}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => handleEditClick(it)}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] rounded flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" /> 編輯
                    </button>
                    <button
                      onClick={() => handleDelete(it.id)}
                      className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-[10px] rounded flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> 刪除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Form Input Side */}
              <form onSubmit={handleSubmit} className="md:col-span-7 flex flex-col gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">商品名稱</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="例如：復古彩虹毛衣"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">商品分類</label>
                    <select
                      value={category}
                      onChange={(e) => {
                        const cat = e.target.value as ItemCategory;
                        setCategory(cat);
                        // Auto adjust default zIndex based on paperdoll layer rule
                        if (cat === 'bottom') setZIndex(20);
                        else if (cat === 'top') setZIndex(30);
                        else if (cat === 'hair') setZIndex(40);
                        else if (cat === 'accessory') setZIndex(50);
                      }}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-white"
                    >
                      <option value="top">上衣 (Top)</option>
                      <option value="bottom">下著 (Bottom)</option>
                      <option value="hair">髮型 (Hair)</option>
                      <option value="accessory">配件 (Accessory)</option>
                      <option value="furniture">家具 (Furniture)</option>
                      <option value="tile">地磚 (Tile)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">價格 (金幣)</label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      min="0"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-white"
                    />
                  </div>
                </div>

                {/* Cloudflare R2 Upload & URL Section */}
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded">
                  <label className="block text-amber-300 font-bold mb-1">
                    ☁️ Cloudflare R2 圖片上傳 / 網址
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="pixel-btn px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded cursor-pointer flex items-center gap-1">
                      <Upload className="w-3.5 h-3.5" />
                      {isUploading ? '上傳中...' : '選擇檔案上傳 R2'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                    </label>
                    <span className="text-[10px] text-slate-400">支援 64x64 PNG 透明圖</span>
                  </div>
                  <input
                    type="text"
                    value={r2Url}
                    onChange={(e) => setR2Url(e.target.value)}
                    placeholder="或直接貼上 R2 公開 URL (例如 https://pub-xxx.r2.dev/item.png)"
                    className="w-full px-3 py-1 bg-slate-900 border border-slate-700 rounded text-white text-[11px]"
                  />
                </div>

                {/* Visual Fallback Customization */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">主色彩 (色票)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-8 h-8 rounded border border-slate-700 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-24 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white text-[11px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">輔助色 (色票)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-8 h-8 rounded border border-slate-700 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-24 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white text-[11px]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">商品描述</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="簡單介紹這件商品的特色..."
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-white"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="pixel-btn px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    {isSubmitting ? '處理中...' : editingId ? '確認更新' : '確認上架商品'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="pixel-btn px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> 重設
                  </button>
                </div>
              </form>

              {/* Live 64x64 Paperdoll Alignment Preview Side */}
              <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-950/80 border-2 border-slate-800 rounded-lg">
                <div className="text-center font-bold text-amber-300 text-xs mb-1">
                  64x64 紙娃娃對齊預覽框
                </div>
                <div className="text-[10px] text-slate-400 mb-4 text-center">
                  即時疊加於標準素體上，確認圖層與穿著對齊正確
                </div>

                {/* 64x64 Scaled up Preview (128x128 displayed) */}
                <div className="relative w-36 h-36 border-2 border-dashed border-amber-500/60 bg-[#262b44] rounded flex items-center justify-center shadow-pixel">
                  {/* Base Body */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <PixelAsset category="body" width={96} height={96} />
                  </div>

                  {/* Overlaid Item being configured */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <PixelAsset
                      category={previewItem.category}
                      item={previewItem}
                      r2Url={previewItem.r2Url}
                      width={96}
                      height={96}
                    />
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <div className="text-xs font-bold text-white">{previewItem.name}</div>
                  <div className="text-[10px] text-amber-400 mt-0.5">🪙 {previewItem.price} 金幣</div>
                  <div className="text-[9px] text-slate-400 mt-1">
                    圖層順序 (Z-Index): {previewItem.zIndex || 30}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
