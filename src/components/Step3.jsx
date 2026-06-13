import { useState } from "react";
import { PERIODS, DAYS, CLASS_PERIODS, TOTAL_SLOTS } from "../lib/constants.js";
import FacultyWorkload from "./FacultyWorkload.jsx";

export default function Step3({
  meta, sections, subjects, timetables,
  activeSection, setActiveSection,
  activeTab, setActiveTab,
  generating, generate, setStep, setTimetables, setError,
  onSwap, editMode, setEditMode,
  exportAll, exportSection,
}) {
  const totalPW = subjects.reduce((s, x) => s + Number(x.classesPerWeek), 0);
  const [dragFrom, setDragFrom] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [facultyFilter, setFacultyFilter] = useState("");

  const grid = timetables[activeSection];

  const handleDragStart = (day, period) => (e) => {
    if (!editMode) return;
    setDragFrom({ day, period });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (day, period) => (e) => {
    e.preventDefault();
    setDropTarget(null);
    if (!editMode || !dragFrom) return;
    onSwap(activeSection, dragFrom, { day, period });
    setDragFrom(null);
  };

  return (
    <>
      {/* Meta row */}
      <div className="meta-row no-print">
        {[
          { l: "Year", v: meta.year || "—" },
          { l: "Branch", v: meta.branch || "—" },
          { l: "Sections", v: sections.map((s) => s.name).join(", ") },
          { l: "Effective from", v: meta.date || "—" },
        ].map((m) => (
          <div className="mc" key={m.l}><div className="mc-l">{m.l}</div><div className="mc-v">{m.v}</div></div>
        ))}
      </div>

      {/* Stats */}
      <div className="stats no-print">
        {[
          { n: sections.length, l: "Sections" },
          { n: subjects.length, l: "Subjects" },
          { n: [...new Set(subjects.map((s) => s.faculty))].length, l: "Faculty" },
          { n: totalPW, l: "Periods/week" },
          { n: TOTAL_SLOTS - totalPW, l: "Free slots" },
        ].map((s) => (
          <div className="stat" key={s.l}>
            <div className="stat-n">{s.n}</div>
            <div className="stat-l">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Section selector */}
      {sections.length > 1 && (
        <div className="sec-tabs no-print">
          {sections.map((sec) => (
            <button key={sec.id} className={`sec-tab${activeSection === sec.name ? " active" : ""}`} onClick={() => setActiveSection(sec.name)}>
              Section {sec.name}
            </button>
          ))}
        </div>
      )}

      {/* View tabs */}
      <div className="vtabs no-print">
        <div className={`vtab${activeTab === "preview" ? " active" : ""}`} onClick={() => setActiveTab("preview")}>
          <i className="ti ti-table" style={{ fontSize: 13, marginRight: 5 }}></i>Timetable
        </div>
        <div className={`vtab${activeTab === "faculty" ? " active" : ""}`} onClick={() => setActiveTab("faculty")}>
          <i className="ti ti-users" style={{ fontSize: 13, marginRight: 5 }}></i>Faculty view
        </div>
        <div className={`vtab${activeTab === "workload" ? " active" : ""}`} onClick={() => setActiveTab("workload")}>
          <i className="ti ti-clipboard-list" style={{ fontSize: 13, marginRight: 5 }}></i>Workload
        </div>
      </div>

      {/* Timetable preview — Days LEFT, Periods TOP */}
      {activeTab === "preview" && grid && (
        <div className="card print-area" style={{ padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: ".625rem" }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)" }}>
              Section {activeSection} · {meta.branch} · {meta.year}
            </div>
            <label className="no-print" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
              <input
                type="checkbox"
                style={{ width: "auto" }}
                checked={editMode}
                onChange={(e) => setEditMode(e.target.checked)}
              />
              <i className="ti ti-arrows-move" style={{ fontSize: 13 }} aria-hidden="true"></i> Drag to swap periods
            </label>
          </div>
          <div className="tt-wrap">
            <table className="tt">
              <thead>
                <tr>
                  <th className="day-hdr">Day</th>
                  {PERIODS.map((p) => (
                    <th key={p.id} className={p.isBreak ? "break-hdr" : ""}>
                      {p.isBreak
                        ? <><i className="ti ti-bowl-chopsticks" style={{ fontSize: 12, display: "block", margin: "0 auto 2px" }} aria-hidden="true"></i>Lunch</>
                        : p.label}
                      <div style={{ fontSize: 9, opacity: .7, fontWeight: 400, marginTop: 2 }}>{p.start}–{p.end}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day) => (
                  <tr key={day}>
                    <td className="day-cell">{day}</td>
                    {PERIODS.map((p) => {
                      if (p.isBreak) return (
                        <td key="lunch" className="break-cell">
                          <div style={{ fontSize: 10 }}>Lunch</div>
                          <div style={{ fontSize: 9, opacity: .7 }}>50 min</div>
                        </td>
                      );
                      const slot = grid[day][p.id];
                      const isDropTarget = editMode && dropTarget && dropTarget.day === day && dropTarget.period === p.id;
                      const cellProps = editMode
                        ? {
                            draggable: !!slot,
                            onDragStart: handleDragStart(day, p.id),
                            onDragOver: (e) => { e.preventDefault(); setDropTarget({ day, period: p.id }); },
                            onDragLeave: () => setDropTarget(null),
                            onDrop: handleDrop(day, p.id),
                          }
                        : {};
                      if (!slot) return (
                        <td key={p.id} className={`free-cell${isDropTarget ? " drop-target" : ""}`} {...cellProps}>—</td>
                      );
                      return (
                        <td key={p.id} className={isDropTarget ? "drop-target" : ""} style={{ background: slot.color + "18", cursor: editMode ? "grab" : "default" }} {...cellProps}>
                          <div className="slot">
                            <span className="slot-s" style={{ color: slot.color }}>{slot.name}</span>
                            <span className="slot-f" style={{ color: slot.color }}>{slot.faculty}</span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="legend">
            {subjects.map((s) => (
              <div className="leg-item" key={s.id}>
                <div className="leg-dot" style={{ background: s.color }}></div>
                {s.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Faculty view */}
      {activeTab === "faculty" && grid && (() => {
        const faculties = [...new Set(subjects.map((s) => s.faculty))]
          .filter((f) => f.toLowerCase().includes(facultyFilter.toLowerCase()));
        return (
          <div>
            <div className="fld no-print" style={{ marginBottom: ".875rem", maxWidth: 320 }}>
              <label>Search faculty</label>
              <input type="text" placeholder="Type a faculty name…" value={facultyFilter} onChange={(e) => setFacultyFilter(e.target.value)} />
            </div>
            {faculties.length === 0 && <div className="info-box">No faculty matches "{facultyFilter}".</div>}
            {faculties.map((fac) => {
              const facSubjs = subjects.filter((s) => s.faculty === fac);
              let count = 0;
              DAYS.forEach((d) => CLASS_PERIODS.forEach((p) => { if (grid[d][p.id]?.faculty === fac) count++; }));
              return (
                <div className="card" key={fac} style={{ marginBottom: ".875rem" }}>
                  <div className="card-ttl" style={{ marginBottom: ".875rem", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <i className="ti ti-user-circle" aria-hidden="true"></i> {fac}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 400, color: "var(--color-text-secondary)" }}>
                      {facSubjs.map((s) => s.name).join(", ")} · {count} period{count !== 1 ? "s" : ""} in Section {activeSection}
                    </span>
                  </div>
                  <div className="tt-wrap">
                    <table className="tt">
                      <thead>
                        <tr>
                          <th className="day-hdr">Day</th>
                          {PERIODS.map((p) => (
                            <th key={p.id} className={p.isBreak ? "break-hdr" : ""}>
                              {p.isBreak ? "Lunch" : p.label}
                              <div style={{ fontSize: 9, opacity: .7, fontWeight: 400, marginTop: 1 }}>{p.start}–{p.end}</div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {DAYS.map((day) => (
                          <tr key={day}>
                            <td className="day-cell">{day}</td>
                            {PERIODS.map((p) => {
                              if (p.isBreak) return <td key="lunch" className="break-cell" style={{ fontSize: 10 }}>Lunch</td>;
                              const slot = grid[day][p.id];
                              const isFac = slot?.faculty === fac;
                              if (!isFac) return <td key={p.id} className="free-cell">—</td>;
                              return (
                                <td key={p.id} style={{ background: slot.color + "18" }}>
                                  <div className="slot">
                                    <span className="slot-s" style={{ color: slot.color }}>{slot.name}</span>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Workload view (new) */}
      {activeTab === "workload" && <FacultyWorkload grids={timetables} subjects={subjects} />}

      <div className="act no-print">
        <button className="btn" onClick={() => { setStep(2); setTimetables(null); setError(""); }}>
          <i className="ti ti-arrow-left" aria-hidden="true"></i> Edit
        </button>
        <button className="btn btn-p" disabled={generating} onClick={() => { setError(""); generate(); }}>
          {generating
            ? <><i className="ti ti-loader-2" style={{ fontSize: 14, animation: "spin 1s linear infinite" }}></i> Regenerating…</>
            : <><i className="ti ti-refresh" aria-hidden="true"></i> Regenerate</>}
        </button>
        <button className="btn btn-g" onClick={exportAll}>
          <i className="ti ti-file-spreadsheet" aria-hidden="true"></i> Export all sections to Excel
        </button>
        <button className="btn" onClick={() => exportSection(activeSection)}>
          <i className="ti ti-file-spreadsheet" aria-hidden="true"></i> Export this section
        </button>
        <button className="btn" onClick={() => window.print()}>
          <i className="ti ti-printer" aria-hidden="true"></i> Print / Save as PDF
        </button>
      </div>
    </>
  );
}
