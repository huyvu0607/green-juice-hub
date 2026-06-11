import { useState } from "react";

export default function StarRatingInput({ value = 0, onChange }) {
  const [hovered, setHovered] = useState(0);
  const labels = ["", "Tệ", "Không ổn", "Bình thường", "Tốt", "Tuyệt vời"];

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="w-8 h-8 transition-transform duration-100 hover:scale-110"
          >
            <svg viewBox="0 0 20 20" className="w-full h-full">
              <path
                d="M10 1l2.39 4.84 5.35.78-3.87 3.77.91 5.33L10 13.27l-4.78 2.51.91-5.33L2.26 6.62l5.35-.78z"
                fill={(hovered || value) >= star ? "#f59e0b" : "#e5e7eb"}
                className="transition-colors duration-100"
              />
            </svg>
          </button>
        ))}
      </div>
      {(hovered || value) > 0 && (
        <span className="text-sm font-medium text-amber-600">
          {labels[hovered || value]}
        </span>
      )}
    </div>
  );
}