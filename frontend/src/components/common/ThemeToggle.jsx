import { useTheme } from "@/hooks/useTheme";

export default function ThemeToggle() {
  const { isDark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Chuyển sang Light mode" : "Chuyển sang Dark mode"}
      className="relative w-9 h-9 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-muted)] transition-colors duration-[var(--duration-base)]"
    >
      {/* Sun */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18" height="18" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
        className={`absolute transition-all duration-[var(--duration-base)] ${
          isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-75"
        }`}
      >
        <circle cx="12" cy="12" r="4"/>
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
      </svg>

      {/* Moon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18" height="18" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
        className={`absolute transition-all duration-[var(--duration-base)] ${
          isDark ? "opacity-0 -rotate-90 scale-75" : "opacity-100 rotate-0 scale-100"
        }`}
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
    </button>
  );
}