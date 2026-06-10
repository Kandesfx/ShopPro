import React, { useState } from 'react';

interface Variant {
  id: number;
  sku: string;
  size: string;
  color: string;
  stock: number;
}

interface VariantSelectorProps {
  variants: Variant[];
  onSelect: (variant: Variant) => void;
  onClose: () => void;
}

export function VariantSelector({ variants, onSelect, onClose }: VariantSelectorProps) {
  const sizes = [...new Set(variants.map((v) => v.size))];
  const colors = [...new Set(variants.map((v) => v.color))];

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const selectedVariant =
    selectedSize && selectedColor
      ? variants.find((v) => v.size === selectedSize && v.color === selectedColor)
      : selectedSize
      ? variants.filter((v) => v.size === selectedSize)[0]
      : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-extrabold text-slate-900">Chọn Phân Loại</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl font-light">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5">
          {sizes.length > 1 && (
            <div>
              <h3 className="font-bold text-slate-800 mb-2.5 text-sm uppercase tracking-wide">Size</h3>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => {
                      setSelectedSize(size);
                      setSelectedColor(null);
                    }}
                    className={`px-4 py-2 rounded-xl border-2 font-semibold transition-all ${
                      selectedSize === size
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {colors.length > 1 && (
            <div>
              <h3 className="font-bold text-slate-800 mb-2.5 text-sm uppercase tracking-wide">Màu</h3>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 rounded-xl border-2 font-semibold transition-all ${
                      selectedColor === color
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
          <button
            onClick={() => selectedVariant && onSelect(selectedVariant)}
            disabled={!selectedVariant || selectedVariant.stock === 0}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!selectedVariant ? 'Vui lòng chọn size/màu' : selectedVariant.stock === 0 ? 'Hết hàng' : 'Thêm Vào Giỏ'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default VariantSelector;
