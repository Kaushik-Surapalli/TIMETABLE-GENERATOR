export default function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      className="btn btn-sm no-print"
      onClick={onToggle}
      title="Toggle light / dark theme"
      aria-label="Toggle theme"
    >
      <i className={`ti ${theme === "dark" ? "ti-sun" : "ti-moon"}`} aria-hidden="true"></i>
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}
