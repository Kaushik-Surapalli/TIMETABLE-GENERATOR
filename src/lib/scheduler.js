import { DAYS, CLASS_PERIODS } from "./constants.js";

// ── Constraint-aware scheduler ──────────────────────────────────────────────
// Constraints enforced:
//  1. Faculty max 1 period per day within a section
//  2. No back-to-back classes for the same faculty in the same section on the same day
//  3. Faculty cannot teach in two sections simultaneously (same day + same period)
export function scheduleSections(sections, subjects) {
  // facultyGlobal[faculty][day][periodId] = true → globally occupied across all sections
  const facultyGlobal = {};
  subjects.forEach((s) => {
    if (!facultyGlobal[s.faculty]) facultyGlobal[s.faculty] = {};
    DAYS.forEach((d) => {
      if (!facultyGlobal[s.faculty][d]) facultyGlobal[s.faculty][d] = {};
    });
  });

  const grids = {};

  for (const sec of sections) {
    const grid = {};
    DAYS.forEach((d) => {
      grid[d] = {};
      CLASS_PERIODS.forEach((p) => {
        grid[d][p.id] = null;
      });
    });

    // per-section per-faculty: which day has already been assigned (faculty max 1/day/section)
    const facultyDayUsed = {};
    subjects.forEach((s) => {
      facultyDayUsed[s.faculty] = {};
    });

    // build pool
    const sectionSubjects = subjects
      .map((s) => {
        const ov = sec.overrides?.[s.id];
        return { ...s, classesPerWeek: ov !== undefined ? ov : s.classesPerWeek };
      })
      .filter((s) => Number(s.classesPerWeek) > 0);

    const pool = sectionSubjects.flatMap((s) =>
      Array.from({ length: Number(s.classesPerWeek) }, () => ({ ...s }))
    );

    // Fisher-Yates shuffle
    const shuffle = (arr) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    shuffle(pool);

    const allSlots = shuffle(DAYS.flatMap((d) => CLASS_PERIODS.map((p) => ({ day: d, period: p.id }))));

    for (const sub of pool) {
      let placed = false;
      for (const { day, period } of allSlots) {
        // slot taken in this section
        if (grid[day][period] !== null) continue;

        // faculty already has a class this day in this section (rule: max 1/day/section)
        if (facultyDayUsed[sub.faculty][day] !== undefined) continue;

        // faculty globally busy at this day+period (teaching another section)
        if (facultyGlobal[sub.faculty][day][period]) continue;

        // no back-to-back: check adjacent periods in this section on this day
        const idx = CLASS_PERIODS.findIndex((p) => p.id === period);
        const prev = idx > 0 ? grid[day][CLASS_PERIODS[idx - 1].id] : null;
        const next = idx < CLASS_PERIODS.length - 1 ? grid[day][CLASS_PERIODS[idx + 1].id] : null;
        if (prev?.faculty === sub.faculty) continue;
        if (next?.faculty === sub.faculty) continue;

        // ✅ place
        grid[day][period] = sub;
        facultyDayUsed[sub.faculty][day] = period;
        facultyGlobal[sub.faculty][day][period] = true;
        placed = true;
        break;
      }
      if (!placed) {
        return {
          error: `Could not place "${sub.name}" (${sub.faculty}) in Section ${sec.name}. Try reducing periods/week, splitting across more faculty, or adding more subjects to fill gaps.`,
        };
      }
    }

    grids[sec.name] = grid;
  }

  return { grids };
}

// ── Manual edit support ─────────────────────────────────────────────────────
// Validates whether swapping two cells (within the SAME section's grid) keeps
// all three scheduling constraints intact across every section.
//
// `grids`  : the full { [sectionName]: grid } map (all sections, for global checks)
// `section`: name of the section being edited
// `a`,`b`  : { day, period } cell coordinates being swapped
//
// Returns { ok: true } or { ok: false, reason: string }
export function validateSwap(grids, section, a, b) {
  const grid = grids[section];
  const slotA = grid[a.day][a.period];
  const slotB = grid[b.day][b.period];

  // No-op: dropping a cell onto itself
  if (a.day === b.day && a.period === b.period) return { ok: true, newGrid: grid };

  // Build the proposed grid for this section
  const newGrid = {};
  DAYS.forEach((d) => {
    newGrid[d] = { ...grid[d] };
  });
  newGrid[a.day][a.period] = slotB;
  newGrid[b.day][b.period] = slotA;

  // Helper: check section-local constraints (1/day + no back-to-back) for a given faculty
  const checkLocal = (faculty) => {
    if (!faculty) return true;
    for (const day of DAYS) {
      const periodsWithFaculty = CLASS_PERIODS.filter((p) => newGrid[day][p.id]?.faculty === faculty);
      if (periodsWithFaculty.length > 1) return false; // more than 1/day
      if (periodsWithFaculty.length === 1) {
        const idx = CLASS_PERIODS.findIndex((p) => p.id === periodsWithFaculty[0].id);
        const prev = idx > 0 ? newGrid[day][CLASS_PERIODS[idx - 1].id] : null;
        const next = idx < CLASS_PERIODS.length - 1 ? newGrid[day][CLASS_PERIODS[idx + 1].id] : null;
        if (prev?.faculty === faculty || next?.faculty === faculty) return false; // back-to-back
      }
    }
    return true;
  };

  // Helper: check global constraint (faculty can't be in 2 sections at same day+period)
  const checkGlobal = (faculty, day, period, sectionName) => {
    if (!faculty) return true;
    for (const [secName, secGrid] of Object.entries(grids)) {
      if (secName === sectionName) continue;
      if (secGrid[day][period]?.faculty === faculty) return false;
    }
    return true;
  };

  for (const faculty of [slotA?.faculty, slotB?.faculty]) {
    if (!checkLocal(faculty)) {
      return { ok: false, reason: `${faculty} would exceed 1 period/day or be scheduled back-to-back.` };
    }
  }

  if (slotA && !checkGlobal(slotA.faculty, b.day, b.period, section)) {
    return { ok: false, reason: `${slotA.faculty} is already teaching another section at that time.` };
  }
  if (slotB && !checkGlobal(slotB.faculty, a.day, a.period, section)) {
    return { ok: false, reason: `${slotB.faculty} is already teaching another section at that time.` };
  }

  return { ok: true, newGrid };
}

// ── Faculty workload summary ────────────────────────────────────────────────
// Returns an array of { faculty, subjects: [...], totalPeriods, perSection: {sec: count}, busyDays }
export function getFacultyWorkload(grids, subjects) {
  const faculties = [...new Set(subjects.map((s) => s.faculty))];
  return faculties.map((faculty) => {
    const facSubjects = subjects.filter((s) => s.faculty === faculty).map((s) => s.name);
    const perSection = {};
    const busyDaySet = new Set();
    let totalPeriods = 0;

    for (const [secName, grid] of Object.entries(grids)) {
      let count = 0;
      DAYS.forEach((day) => {
        CLASS_PERIODS.forEach((p) => {
          if (grid[day][p.id]?.faculty === faculty) {
            count++;
            busyDaySet.add(day);
          }
        });
      });
      if (count > 0) perSection[secName] = count;
      totalPeriods += count;
    }

    return {
      faculty,
      subjects: facSubjects,
      totalPeriods,
      perSection,
      busyDays: busyDaySet.size,
      freeDays: DAYS.length - busyDaySet.size,
    };
  }).sort((a, b) => b.totalPeriods - a.totalPeriods);
}
