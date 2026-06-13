export default function Step1({ meta, setMeta, setError, setStep }) {
  return (
    <div className="card">
      <div className="card-ttl"><i className="ti ti-school" aria-hidden="true"></i> Class information</div>
      <div className="g3">
        <div className="fld">
          <label>Academic year</label>
          <input
            type="text"
            placeholder="e.g. 2024–25"
            value={meta.year}
            onChange={(e) => setMeta((m) => ({ ...m, year: e.target.value }))}
          />
        </div>
        <div className="fld">
          <label>Branch / Dept.</label>
          <input
            type="text"
            placeholder="e.g. Computer Science"
            value={meta.branch}
            onChange={(e) => setMeta((m) => ({ ...m, branch: e.target.value }))}
          />
        </div>
        <div className="fld">
          <label>Effective from</label>
          <input
            type="date"
            value={meta.date}
            onChange={(e) => setMeta((m) => ({ ...m, date: e.target.value }))}
          />
        </div>
      </div>
      <div className="info-box">
        <i className="ti ti-info-circle" style={{ fontSize: 15 }} aria-hidden="true"></i>
        <span>
          Schedule runs <strong style={{ color: "var(--color-text-primary)" }}>Monday – Saturday</strong> (Sunday off).
          Each period is <strong style={{ color: "var(--color-text-primary)" }}>50 minutes</strong>.
          Lunch break is <strong style={{ color: "var(--color-text-primary)" }}>50 minutes after Period 4</strong> (12:20–13:10).
        </span>
      </div>
      <div className="act">
        <button
          className="btn btn-p"
          onClick={() => {
            if (!meta.year || !meta.branch) {
              setError("Year and branch are required.");
              return;
            }
            setError("");
            setStep(2);
          }}
        >
          Next <i className="ti ti-arrow-right" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  );
}
