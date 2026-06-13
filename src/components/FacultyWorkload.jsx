import { getFacultyWorkload } from "../lib/scheduler.js";
import { TOTAL_SLOTS } from "../lib/constants.js";

export default function FacultyWorkload({ grids, subjects }) {
  const workload = getFacultyWorkload(grids, subjects);

  return (
    <div className="card">
      <div className="card-ttl">
        <i className="ti ti-clipboard-list" aria-hidden="true"></i> Faculty workload summary
      </div>
      <div className="tt-wrap">
        <table className="tt wl-table">
          <thead>
            <tr>
              <th className="day-hdr" style={{ textAlign: "left" }}>Faculty</th>
              <th>Subjects</th>
              <th>Total periods/week</th>
              <th>Busy days</th>
              <th>Free days</th>
              <th>Load</th>
            </tr>
          </thead>
          <tbody>
            {workload.map((w) => {
              const pct = Math.min(Math.round((w.totalPeriods / TOTAL_SLOTS) * 100), 100);
              return (
                <tr key={w.faculty}>
                  <td className="day-cell" style={{ textAlign: "left" }}>
                    <i className="ti ti-user-circle" style={{ marginRight: 6, color: "var(--accent)" }} aria-hidden="true"></i>
                    {w.faculty}
                  </td>
                  <td style={{ fontSize: 11 }}>{w.subjects.join(", ")}</td>
                  <td>{w.totalPeriods}</td>
                  <td>{w.busyDays} / 6</td>
                  <td>{w.freeDays}</td>
                  <td style={{ minWidth: 100 }}>
                    <div className="pbar">
                      <div className="pfill" style={{ width: `${pct}%`, background: pct > 70 ? "#DC2626" : "var(--accent)" }}></div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
