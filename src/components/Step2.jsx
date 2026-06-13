import { useRef } from "react";
import { DAYS, TOTAL_SLOTS, COLORS } from "../lib/constants.js";
import { parseSubjectsCSV } from "../lib/exportExcel.js";

export default function Step2({
  sections, setSections, newSecName, setNewSecName,
  subjects, setSubjects, newSub, setNewSub,
  error, setError, generating, generate, setStep,
}) {
  const fileInputRef = useRef(null);
  const totalPW = subjects.reduce((s, x) => s + Number(x.classesPerWeek), 0);
  const pct = Math.min(Math.round((totalPW / TOTAL_SLOTS) * 100), 100);

  const addSection = () => {
    const name = newSecName.trim().toUpperCase();
    if (!name) return;
    if (sections.find((s) => s.name === name)) {
      setError(`Section ${name} already exists.`);
      return;
    }
    setSections((p) => [...p, { id: Date.now(), name, overrides: {} }]);
    setNewSecName("");
    setError("");
  };

  const removeSection = (id) => {
    if (sections.length === 1) {
      setError("At least one section required.");
      return;
    }
    setSections((p) => p.filter((s) => s.id !== id));
  };

  const addSubject = () => {
    if (!newSub.name.trim() || !newSub.faculty.trim()) {
      setError("Subject name and faculty are required.");
      return;
    }
    const cpw = Number(newSub.classesPerWeek);
    if (cpw < 1) {
      setError("At least 1 period/week required.");
      return;
    }
    if (cpw > DAYS.length) {
      setError(`Max ${DAYS.length} periods/week (1 per day rule).`);
      return;
    }
    if (totalPW + cpw > TOTAL_SLOTS) {
      setError(`Total would exceed ${TOTAL_SLOTS} slots/week.`);
      return;
    }
    setSubjects((p) => [...p, { ...newSub, id: Date.now(), color: COLORS[p.length % COLORS.length] }]);
    setNewSub({ name: "", faculty: "", classesPerWeek: 2 });
    setError("");
  };

  const removeSubject = (id) => setSubjects((p) => p.filter((s) => s.id !== id));

  const handleCSVImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rows = parseSubjectsCSV(String(ev.target.result));
      if (rows.length === 0) {
        setError("No valid rows found in CSV. Expected: Subject,Faculty,PeriodsPerWeek");
        return;
      }
      let added = 0;
      setSubjects((prev) => {
        let next = [...prev];
        let runningTotal = next.reduce((s, x) => s + Number(x.classesPerWeek), 0);
        for (const row of rows) {
          const cpw = Math.min(Math.max(1, row.classesPerWeek), DAYS.length);
          if (runningTotal + cpw > TOTAL_SLOTS) break;
          next = [...next, { ...row, classesPerWeek: cpw, id: Date.now() + added, color: COLORS[next.length % COLORS.length] }];
          runningTotal += cpw;
          added++;
        }
        return next;
      });
      setError(added < rows.length ? `Imported ${added} of ${rows.length} subjects (remaining would exceed weekly capacity).` : "");
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <>
      {/* Sections */}
      <div className="card">
        <div className="card-ttl"><i className="ti ti-layout-grid" aria-hidden="true"></i> Sections</div>
        <div style={{ display: "flex", gap: 9, alignItems: "flex-end" }}>
          <div className="fld" style={{ flex: 1 }}>
            <label>Section name</label>
            <input
              type="text"
              placeholder="e.g. B"
              value={newSecName}
              onChange={(e) => setNewSecName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSection()}
            />
          </div>
          <button className="btn btn-p btn-sm" onClick={addSection} style={{ marginBottom: 1 }}>
            <i className="ti ti-plus" aria-hidden="true"></i> Add section
          </button>
        </div>
        <div className="sec-list">
          {sections.map((sec) => (
            <div className="sec-chip" key={sec.id}>
              <i className="ti ti-users" style={{ fontSize: 13, color: "var(--accent)" }} aria-hidden="true"></i>
              Section {sec.name}
              {sections.length > 1 && (
                <button className="btn btn-d" style={{ padding: "2px 6px", marginLeft: 2 }} onClick={() => removeSection(sec.id)}>
                  <i className="ti ti-x" style={{ fontSize: 11 }} aria-hidden="true"></i>
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="info-box" style={{ marginTop: ".75rem" }}>
          <i className="ti ti-shield-check" style={{ fontSize: 15 }} aria-hidden="true"></i>
          <span>
            Each faculty member is limited to <strong style={{ color: "var(--color-text-primary)" }}>1 period per day per section</strong>,
            no back-to-back periods, and cannot teach two sections simultaneously.
          </span>
        </div>
      </div>

      {/* Subjects */}
      <div className="card">
        <div className="card-ttl" style={{ justifyContent: "space-between" }}>
          <span><i className="ti ti-books" aria-hidden="true"></i> Subjects & faculty</span>
          <div>
            <input
              type="file"
              accept=".csv,text/csv"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleCSVImport}
            />
            <button className="btn btn-sm" onClick={() => fileInputRef.current?.click()}>
              <i className="ti ti-file-upload" aria-hidden="true"></i> Import CSV
            </button>
          </div>
        </div>
        <div className="add-row">
          <div className="fld" style={{ flex: "2 1 160px" }}>
            <label>Subject name</label>
            <input
              type="text"
              placeholder="e.g. Data Structures"
              value={newSub.name}
              onChange={(e) => setNewSub((s) => ({ ...s, name: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && addSubject()}
            />
          </div>
          <div className="fld" style={{ flex: "2 1 160px" }}>
            <label>Faculty name</label>
            <input
              type="text"
              placeholder="e.g. Prof. Sharma"
              value={newSub.faculty}
              onChange={(e) => setNewSub((s) => ({ ...s, faculty: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && addSubject()}
            />
          </div>
          <div className="fld" style={{ flex: "0 0 100px" }}>
            <label>Periods/week</label>
            <input
              type="number"
              min="1"
              max={DAYS.length}
              value={newSub.classesPerWeek}
              onChange={(e) => setNewSub((s) => ({ ...s, classesPerWeek: e.target.value }))}
            />
          </div>
          <button className="btn btn-p btn-sm" onClick={addSubject} style={{ flexShrink: 0, marginBottom: 1 }}>
            <i className="ti ti-plus" aria-hidden="true"></i> Add
          </button>
        </div>

        {subjects.length > 0 && (
          <>
            <div className="sub-list">
              {subjects.map((s) => (
                <div className="sub-item" key={s.id}>
                  <div className="sub-dot" style={{ background: s.color }}></div>
                  <div style={{ flex: 1 }}>
                    <div className="sub-name">{s.name}</div>
                    <div className="sub-fac"><i className="ti ti-user" style={{ fontSize: 10 }}></i> {s.faculty}</div>
                  </div>
                  <span className="sub-badge">{s.classesPerWeek}/week</span>
                  <button className="btn btn-d" onClick={() => removeSubject(s.id)}>
                    <i className="ti ti-trash" style={{ fontSize: 12 }} aria-hidden="true"></i>
                  </button>
                </div>
              ))}
            </div>
            <div className="pbar">
              <div className="pfill" style={{ width: `${pct}%`, background: pct > 90 ? "#DC2626" : "var(--accent)" }}></div>
            </div>
            <div className="plab">{totalPW} / {TOTAL_SLOTS} periods allocated ({pct}%)</div>
          </>
        )}
        <div className="info-box" style={{ marginTop: ".875rem" }}>
          <i className="ti ti-table-alias" style={{ fontSize: 15 }} aria-hidden="true"></i>
          <span>CSV import format: one subject per line — <code>Subject Name, Faculty Name, PeriodsPerWeek</code> (header row optional).</span>
        </div>
      </div>

      <div className="act">
        <button className="btn" onClick={() => { setError(""); setStep(1); }}>
          <i className="ti ti-arrow-left" aria-hidden="true"></i> Back
        </button>
        <button className="btn btn-p" disabled={subjects.length === 0 || generating} onClick={() => { setError(""); generate(); }}>
          {generating
            ? <><i className="ti ti-loader-2" style={{ fontSize: 14, animation: "spin 1s linear infinite" }}></i> Generating…</>
            : <><i className="ti ti-wand" aria-hidden="true"></i> Generate timetable</>}
        </button>
      </div>
    </>
  );
}
