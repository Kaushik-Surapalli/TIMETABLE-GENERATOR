// Periods: P1–P4 (50 min each), then LUNCH (50 min), then P5–P7 (50 min each)
export const PERIODS = [
  { id: 1, label: "P1", full: "Period 1", start: "09:00", end: "09:50" },
  { id: 2, label: "P2", full: "Period 2", start: "09:50", end: "10:40" },
  { id: 3, label: "P3", full: "Period 3", start: "10:40", end: "11:30" },
  { id: 4, label: "P4", full: "Period 4", start: "11:30", end: "12:20" },
  { id: "lunch", label: "Lunch", full: "Lunch Break", start: "12:20", end: "13:10", isBreak: true },
  { id: 5, label: "P5", full: "Period 5", start: "13:10", end: "14:00" },
  { id: 6, label: "P6", full: "Period 6", start: "14:00", end: "14:50" },
  { id: 7, label: "P7", full: "Period 7", start: "14:50", end: "15:40" },
];

export const CLASS_PERIODS = PERIODS.filter((p) => !p.isBreak); // 7 teachable slots/day
export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const TOTAL_SLOTS = DAYS.length * CLASS_PERIODS.length; // 42

export const COLORS = [
  "#4F46E5", "#0891B2", "#059669", "#D97706", "#DC2626",
  "#7C3AED", "#0284C7", "#16A34A", "#B45309", "#E11D48",
  "#6D28D9", "#0369A1", "#15803D", "#CA8A04", "#BE123C",
  "#1D4ED8", "#0F766E", "#9333EA", "#DB2777", "#854F0B",
];

export const STORAGE_KEY = "timetable-generator-state-v1";
export const THEME_KEY = "timetable-generator-theme";
