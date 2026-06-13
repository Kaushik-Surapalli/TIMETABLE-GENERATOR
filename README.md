# Automatic Timetable Generator

A conflict-free class timetable generator with faculty constraint enforcement,
manual drag-and-drop editing, Excel export, CSV import, dark mode, and
auto-save — built with React + Vite.

## Features

- Step-by-step wizard: class details -> sections & subjects -> generated timetable
- Constraint-aware scheduler:
  1. Each faculty member teaches at most 1 period/day per section
  2. No back-to-back periods for the same faculty in a section
  3. A faculty member can never be double-booked across sections at the same time
- Multiple sections with per-subject overrides
- CSV import of subjects (Subject, Faculty, PeriodsPerWeek)
- Manual drag-and-drop editing of the generated timetable, with live
  conflict validation (rejects swaps that would break the rules above)
- Faculty view with search/filter
- Faculty workload summary (total periods, busy/free days, load bar)
- Excel export - full workbook (all sections) or a single section
- Print / Save as PDF - clean print stylesheet for the active timetable
- Dark / light theme, persisted across visits
- Auto-save: your in-progress data is saved to localStorage and can be
  restored on your next visit

## Project structure

```
timetable-generator/
├── index.html              HTML entry point (Vite)
├── package.json
├── vite.config.js
├── netlify.toml             Netlify build & SPA redirect config
├── server.js                Express server for Node hosting
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx              React root
    ├── App.jsx               App state, autosave, theme, generation
    ├── styles.css            Theme variables + all component styles
    ├── lib/
    │   ├── constants.js       Periods, days, colors, storage keys
    │   ├── scheduler.js        Scheduling engine + swap validation + workload
    │   ├── storage.js           localStorage helpers (state + theme)
    │   └── exportExcel.js        Excel export + CSV import parsing
    └── components/
        ├── Step1.jsx           Class details form
        ├── Step2.jsx           Sections, subjects, CSV import
        ├── Step3.jsx           Timetable view, drag-drop edit, faculty/workload views
        ├── FacultyWorkload.jsx Workload summary table
        └── ThemeToggle.jsx     Dark/light toggle button
```

## Local development

```bash
npm install
npm run dev
```

Opens at http://localhost:5173

## Build for production

```bash
npm run build
```

Outputs static files to `dist/`.


## Run on a Node server

```bash
npm install
npm run build
npm start
```

This builds the app and starts an Express server (`server.js`) that serves
the static `dist/` folder with SPA fallback. By default it listens on port
3000 - set the PORT environment variable to change it.

## Notes

- All data is stored locally in the browser (localStorage); nothing is sent
  to a server, so there is no backend/database to configure.
- The schedule covers Monday-Saturday, 7 periods/day (50 min each) with a
  50-minute lunch break after Period 4. To change this, edit
  src/lib/constants.js (PERIODS, DAYS).
