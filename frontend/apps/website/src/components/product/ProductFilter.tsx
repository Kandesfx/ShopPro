'use client';

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface ProductFilterProps {
  categories: Category[];
  filters: {
    category: string;
    brand: string;
    min_price: string;
    max_price: string;
    search: string;
  };
  onFilterChange: (key: string, value: string) => void;
}

export function ProductFilter({ categories, filters, onFilterChange }: ProductFilterProps) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm sticky top-24">
      <h3 className="font-extrabold text-slate-900 mb-4">Bộ Lọc</h3>

      {/* Category Filter */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold mb-2.5 text-slate-700">Danh Mục</h4>
        <select
          value={filters.category}
          onChange={(e) => onFilterChange('category', e.target.value)}
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
        >
          <option value="">Tất Cả Danh Mục</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold mb-2.5 text-slate-700">Khoảng Giá</h4>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Tối thiểu"
            value={filters.min_price}
            onChange={(e) => onFilterChange('min_price', e.target.value)}
            className="w-1/2 px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
          <input
            type="number"
            placeholder="Tối đa"
            value={filters.max_price}
            onChange={(e) => onFilterChange('max_price', e.target.value)}
            className="w-1/2 px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Clear Filters */}
      <button
        onClick={() => {
          onFilterChange('category', '');
          onFilterChange('min_price', '');
          onFilterChange('max_price', '');
          onFilterChange('search', '');
        }}
        className="w-full px-4 py-2.5 text-sm text-blue-600 border-2 border-blue-600 rounded-xl hover:bg-blue-50 font-semibold transition-colors"
      >
        Xóa Tất Cả Lọc
      </button>
    </div>
  );
}

export default ProductFilter;
