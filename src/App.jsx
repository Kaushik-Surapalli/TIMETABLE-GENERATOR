import { useState, useCallback, useEffect, useRef } from "react";
import Step1 from "./components/Step1.jsx";
import Step2 from "./components/Step2.jsx";
import Step3 from "./components/Step3.jsx";
import ThemeToggle from "./components/ThemeToggle.jsx";
import { scheduleSections, validateSwap } from "./lib/scheduler.js";
import { exportAllToExcel, exportSectionToExcel } from "./lib/exportExcel.js";
import { saveState, loadState, clearState, getSavedTheme, saveTheme } from "./lib/storage.js";

export default function App() {
  const [step, setStep] = useState(1);
  const [meta, setMeta] = useState({ year: "", branch: "", date: "" });
  const [sections, setSections] = useState([{ id: 1, name: "A", overrides: {} }]);
  const [newSecName, setNewSecName] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [newSub, setNewSub] = useState({ name: "", faculty: "", classesPerWeek: 2 });
  const [timetables, setTimetables] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("A");
  const [activeTab, setActiveTab] = useState("preview");
  const [editMode, setEditMode] = useState(false);
  const [theme, setTheme] = useState("light");
  const [restoreAvailable, setRestoreAvailable] = useState(false);
  const restoredRef = useRef(false);

  // ── Theme ──
  useEffect(() => {
    const saved = getSavedTheme();
    const initial = saved || (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    saveTheme(next);
  };

  // ── Restore previous session (if any) ──
  useEffect(() => {
    const saved = loadState();
    if (saved && (saved.subjects?.length || saved.meta?.year || saved.meta?.branch)) {
      setRestoreAvailable(true);
    }
  }, []);

  const restoreSession = () => {
    const saved = loadState();
    if (!saved) return;
    setMeta(saved.meta || { year: "", branch: "", date: "" });
    setSections(saved.sections?.length ? saved.sections : [{ id: 1, name: "A", overrides: {} }]);
    setSubjects(saved.subjects || []);
    setTimetables(saved.timetables || null);
    setStep(saved.step || 1);
    setActiveSection(saved.activeSection || (saved.sections?.[0]?.name ?? "A"));
    restoredRef.current = true;
    setRestoreAvailable(false);
  };

  const dismissRestore = () => {
    clearState();
    setRestoreAvailable(false);
  };

  // ── Autosave on change ──
  useEffect(() => {
    saveState({ meta, sections, subjects, timetables, step, activeSection });
  }, [meta, sections, subjects, timetables, step, activeSection]);

  const totalPW = subjects.reduce((s, x) => s + Number(x.classesPerWeek), 0);

  // ── Generate ──
  const generate = useCallback(() => {
    if (subjects.length === 0) {
      setError("Add at least one subject first.");
      return;
    }
    setGenerating(true);
    setError("");
    setTimeout(() => {
      const result = scheduleSections(sections, subjects);
      if (result.error) {
        setError(result.error);
        setGenerating(false);
        return;
      }
      setTimetables(result.grids);
      setActiveSection(sections[0].name);
      setEditMode(false);
      setStep(3);
      setGenerating(false);
    }, 400);
  }, [sections, subjects]);

  // ── Manual drag-and-drop swap ──
  const onSwap = (sectionName, a, b) => {
    const result = validateSwap(timetables, sectionName, a, b);
    if (!result.ok) {
      setError(result.reason || "That swap isn't allowed.");
      return;
    }
    setError("");
    setTimetables((prev) => ({ ...prev, [sectionName]: result.newGrid }));
  };

  // ── Export ──
  const exportAll = () => exportAllToExcel({ meta, sections, subjects, timetables });
  const exportSection = (sectionName) =>
    exportSectionToExcel({ meta, sectionName, grid: timetables?.[sectionName] });

  // ── Start over ──
  const startOver = () => {
    if (!window.confirm("This will clear all data and start a new timetable. Continue?")) return;
    clearState();
    setMeta({ year: "", branch: "", date: "" });
    setSections([{ id: 1, name: "A", overrides: {} }]);
    setSubjects([]);
    setTimetables(null);
    setStep(1);
    setActiveSection("A");
    setActiveTab("preview");
    setError("");
  };

  return (
    <div className="app">
      {/* Header */}
      <div className="hdr">
        <div className="hdr-left">
          <div className="hdr-icon"><i className="ti ti-calendar-event" aria-hidden="true"></i></div>
          <div>
            <h1>Automatic Timetable Generator</h1>
            <p>Conflict-free scheduling across sections with faculty constraint enforcement.</p>
          </div>
        </div>
        <div className="hdr-actions">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          <button className="btn btn-sm no-print" onClick={startOver} title="Clear everything and start a new timetable">
            <i className="ti ti-rotate-clockwise-2" aria-hidden="true"></i> New
          </button>
        </div>
      </div>

      {restoreAvailable && (
        <div className="info-box no-print" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <span><i className="ti ti-history" style={{ marginRight: 6 }} aria-hidden="true"></i>We found a saved session from earlier. Restore it?</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-sm btn-p" onClick={restoreSession}>Restore</button>
            <button className="btn btn-sm" onClick={dismissRestore}>Dismiss</button>
          </div>
        </div>
      )}

      {/* Steps */}
      <div className="steps no-print">
        {[
          { n: 1, label: "Class details" },
          { n: 2, label: "Sections & subjects" },
          { n: 3, label: "Generated timetable" },
        ].map((s) => (
          <div
            key={s.n}
            className={`stp${step === s.n ? " active" : ""}${step > s.n ? " done" : ""}`}
            onClick={() => step > s.n && setStep(s.n)}
          >
            <div className="stp-n">
              {step > s.n ? <i className="ti ti-check" style={{ fontSize: 12 }}></i> : s.n}
            </div>
            <span className="stp-l">{s.label}</span>
          </div>
        ))}
      </div>

      {error && (
        <div className="err">
          <span><i className="ti ti-alert-circle" style={{ fontSize: 16, marginRight: 8 }} aria-hidden="true"></i>{error}</span>
          <button className="btn btn-sm" onClick={() => setError("")} aria-label="Dismiss error">
            <i className="ti ti-x" style={{ fontSize: 12 }}></i>
          </button>
        </div>
      )}

      {step === 1 && (
        <Step1 meta={meta} setMeta={setMeta} setError={setError} setStep={setStep} />
      )}

      {step === 2 && (
        <Step2
          sections={sections} setSections={setSections}
          newSecName={newSecName} setNewSecName={setNewSecName}
          subjects={subjects} setSubjects={setSubjects}
          newSub={newSub} setNewSub={setNewSub}
          error={error} setError={setError}
          generating={generating} generate={generate}
          setStep={setStep}
        />
      )}

      {step === 3 && timetables && (
        <Step3
          meta={meta} sections={sections} subjects={subjects} timetables={timetables}
          activeSection={activeSection} setActiveSection={setActiveSection}
          activeTab={activeTab} setActiveTab={setActiveTab}
          generating={generating} generate={generate}
          setStep={setStep} setTimetables={setTimetables} setError={setError}
          onSwap={onSwap} editMode={editMode} setEditMode={setEditMode}
          exportAll={exportAll} exportSection={exportSection}
        />
      )}

      <footer className="no-print" style={{ textAlign: "center", fontSize: 11, color: "var(--color-text-tertiary)", margin: "2rem 0 1rem" }}>
        {totalPW > 0 && `${totalPW} period${totalPW !== 1 ? "s" : ""}/week scheduled · `}
        Your data is saved locally in this browser only.
      </footer>
    </div>
  );
}
