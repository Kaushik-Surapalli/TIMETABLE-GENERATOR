import * as XLSX from "xlsx";
import { PERIODS, DAYS } from "./constants.js";

const hdrS = {
  font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10 },
  fill: { fgColor: { rgb: "1E3A5F" } },
  alignment: { horizontal: "center", vertical: "center", wrapText: true },
  border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } },
};
const dayS = {
  font: { bold: true, sz: 10 },
  fill: { fgColor: { rgb: "EFF6FF" } },
  alignment: { horizontal: "center", vertical: "center" },
  border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } },
};
const lunchS = {
  font: { bold: true, italic: true, color: { rgb: "5B21B6" }, sz: 9 },
  fill: { fgColor: { rgb: "EDE9FE" } },
  alignment: { horizontal: "center", vertical: "center" },
  border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } },
};
const cellS = {
  font: { sz: 10 },
  alignment: { horizontal: "center", vertical: "center", wrapText: true },
  border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } },
};
const emptyS = { ...cellS, font: { sz: 10, color: { rgb: "D1D5DB" } } };

function buildSectionSheet(grid) {
  const header = ["Day / Period", ...PERIODS.map((p) => `${p.full}\n${p.start}–${p.end}`)];
  const dataRows = DAYS.map((day) => {
    const row = [day];
    PERIODS.forEach((p) => {
      if (p.isBreak) {
        row.push("── LUNCH BREAK ──");
        return;
      }
      const slot = grid[day][p.id];
      row.push(slot ? `${slot.name}\n(${slot.faculty})` : "");
    });
    return row;
  });

  const ws = XLSX.utils.aoa_to_sheet([header, ...dataRows]);
  ws["!cols"] = [{ wch: 13 }, ...PERIODS.map((p) => (p.isBreak ? { wch: 18 } : { wch: 22 }))];
  ws["!rows"] = [{ hpt: 40 }, ...DAYS.map(() => ({ hpt: 42 }))];

  const range = XLSX.utils.decode_range(ws["!ref"]);
  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[addr]) ws[addr] = { v: "", t: "s" };
      const v = ws[addr].v;
      if (R === 0) ws[addr].s = hdrS;
      else if (C === 0) ws[addr].s = dayS;
      else if (v === "── LUNCH BREAK ──") ws[addr].s = lunchS;
      else if (!v) ws[addr].s = emptyS;
      else ws[addr].s = cellS;
    }
  }
  return ws;
}

// Export all sections (plus an Info sheet) to a single workbook
export function exportAllToExcel({ meta, sections, subjects, timetables }) {
  if (!timetables) return;
  const wb = XLSX.utils.book_new();

  const infoRows = [
    ["Timetable Information"], [],
    ["Year", meta.year], ["Branch", meta.branch], ["Effective From", meta.date],
    ["Sections", sections.map((s) => s.name).join(", ")], [],
    ["Subject", "Faculty", "Periods/Week"],
    ...subjects.map((s) => [s.name, s.faculty, s.classesPerWeek]),
  ];
  const infoWs = XLSX.utils.aoa_to_sheet(infoRows);
  infoWs["!cols"] = [{ wch: 22 }, { wch: 30 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, infoWs, "Info");

  for (const sec of sections) {
    const grid = timetables[sec.name];
    if (!grid) continue;
    const ws = buildSectionSheet(grid);
    XLSX.utils.book_append_sheet(wb, ws, `Section ${sec.name}`);
  }

  XLSX.writeFile(wb, `Timetable_${meta.branch || "Class"}_${meta.year || "Year"}.xlsx`);
}

// Export a single section's timetable to its own workbook
export function exportSectionToExcel({ meta, sectionName, grid }) {
  if (!grid) return;
  const wb = XLSX.utils.book_new();
  const ws = buildSectionSheet(grid);
  XLSX.utils.book_append_sheet(wb, ws, `Section ${sectionName}`);
  XLSX.writeFile(wb, `Timetable_${meta.branch || "Class"}_Section_${sectionName}.xlsx`);
}

// Parse a CSV file's text into subject entries: "Subject Name,Faculty Name,PeriodsPerWeek"
export function parseSubjectsCSV(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const out = [];
  for (const line of lines) {
    // Skip an optional header row
    if (/^subject/i.test(line)) continue;
    const parts = line.split(",").map((p) => p.trim());
    if (parts.length < 2) continue;
    const [name, faculty, cpw] = parts;
    if (!name || !faculty) continue;
    out.push({ name, faculty, classesPerWeek: Number(cpw) > 0 ? Number(cpw) : 2 });
  }
  return out;
}
