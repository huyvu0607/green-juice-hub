import { useState, Children } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

function Section({ title, children, maxVisible = 6 }) {
  const [open, setOpen] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const childArray = Children.toArray(children);
  const visible = showAll ? childArray : childArray.slice(0, maxVisible);
  const hasMore = childArray.length > maxVisible;

  return (
    <div className="border-b border-[var(--color-border-subtle)] pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full mb-3
                   text-sm font-semibold text-[var(--color-text-primary)]"
      >
        {title}
        {open
          ? <ChevronUp size={14} className="text-[var(--color-text-muted)]" />
          : <ChevronDown size={14} className="text-[var(--color-text-muted)]" />
        }
      </button>
      {open && (
        <div className="space-y-2.5">
          {visible}
          {hasMore && (
            <button
              onClick={() => setShowAll(o => !o)}
              className="text-xs text-[var(--color-primary)] hover:underline mt-1"
            >
              {showAll ? "Thu gọn" : `+${childArray.length - maxVisible} xem thêm`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function RadioItem({ name, checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group py-0.5">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="accent-[var(--color-primary)] w-4 h-4 shrink-0"
      />
      <span className="text-sm text-[var(--color-text-secondary)]
                       group-hover:text-[var(--color-text-primary)] transition-colors">
        {label}
      </span>
    </label>
  );
}

function CheckItem({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group py-0.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="accent-[var(--color-primary)] w-4 h-4 rounded shrink-0"
      />
      <span className="text-sm text-[var(--color-text-secondary)]
                       group-hover:text-[var(--color-text-primary)] transition-colors">
        {label}
      </span>
    </label>
  );
}

export default function FilterSidebar({ filter, categories, flavors, sizes, onChange, onReset }) {
  const flavorIds = filter.flavorIds ?? [];
  const sizeIds = filter.sizeIds ?? [];

  const toggleList = (key, id) => {
    const cur = filter[key] ?? [];
    onChange({ [key]: cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id] });
  };

  return (
    <div className="rounded-2xl border border-[var(--color-border-subtle)]
                bg-[var(--color-bg-card)] p-4 w-full overflow-hidden">

      {/* ── Khoảng giá (shown inside sidebar/modal on mobile) ── */}
      <div className="border-b border-[var(--color-border-subtle)] pb-4 mb-4">
        <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
          Khoảng giá
        </p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Từ đ"
            value={filter.minPrice ?? ""}
            onChange={e => onChange({ minPrice: e.target.value })}
            className="flex-1 min-w-0  px-2.5 py-1.5 text-sm rounded-lg
                       border border-[var(--color-border-subtle)] bg-transparent
                       text-[var(--color-text-primary)]
                       focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          />
          <span className="text-[var(--color-text-muted)] text-xs shrink-0">—</span>
          <input
            type="number"
            placeholder="Đến đ"
            value={filter.maxPrice ?? ""}
            onChange={e => onChange({ maxPrice: e.target.value })}
            className="flex-1  min-w-0  px-2.5 py-1.5 text-sm rounded-lg
                       border border-[var(--color-border-subtle)] bg-transparent
                       text-[var(--color-text-primary)]
                       focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          />
        </div>
      </div>

      {/* ── Danh mục ── */}
      <Section title="Danh mục">
        {[{ id: null, name: "Tất cả" }, ...categories].map(cat => (
          <RadioItem
            key={cat.id ?? "all"}
            name="category"
            checked={filter.categoryId === cat.id}
            onChange={() => onChange({ categoryId: cat.id })}
            label={cat.name}
          />
        ))}
      </Section>

      {/* ── Hương vị ── */}
      {flavors.length > 0 && (
        <Section title="Hương vị" maxVisible={4}>
          {flavors.map(f => (
            <CheckItem
              key={f.id}
              checked={flavorIds.includes(f.id)}
              onChange={() => toggleList("flavorIds", f.id)}
              label={f.name}
            />
          ))}
        </Section>
      )}

      {/* ── Kích cỡ ── */}
      {sizes.length > 0 && (
        <Section title="Kích cỡ">
          {sizes.map(s => (
            <CheckItem
              key={s.id}
              checked={sizeIds.includes(s.id)}
              onChange={() => toggleList("sizeIds", s.id)}
              label={s.name}
            />
          ))}
        </Section>
      )}

      {/* ── Đánh giá ── */}
      <Section title="Đánh giá">
        {[5, 4, 3].map(r => (
          <RadioItem
            key={r}
            name="rating"
            checked={filter.minRating === r}
            onChange={() => onChange({ minRating: r })}
            label={
              <span className="flex items-center gap-1">
                <span className="text-yellow-400">{"★".repeat(r)}</span>
                <span className="text-[var(--color-text-muted)] text-xs">≥ {r} sao</span>
              </span>
            }
          />
        ))}
        <RadioItem
          name="rating"
          checked={filter.minRating === null}
          onChange={() => onChange({ minRating: null })}
          label="Tất cả"
        />
      </Section>

      {/* ── Trạng thái ── */}
      <Section title="Trạng thái">
        <CheckItem
          checked={filter.inStock === true}
          onChange={() => onChange({ inStock: filter.inStock === true ? null : true })}
          label="Còn hàng"
        />
        <CheckItem
          checked={filter.onSale === true}
          onChange={() => onChange({ onSale: filter.onSale === true ? null : true })}
          label="Đang khuyến mãi"
        />
      </Section>

      {/* ── Reset ── */}
      <button
        onClick={onReset}
        className="w-full mt-2 py-2 rounded-xl border border-[var(--color-border-subtle)]
                   text-sm text-[var(--color-text-secondary)]
                   hover:bg-[var(--color-bg-muted)] transition-colors"
      >
        Xoá bộ lọc
      </button>
    </div>
  );
}