import { useMemo, useState } from "react";

// Generally accepted rule of thumb tables for septic tank pump frequency
// (years), based on USDA / Fraser Valley industry guidance.
// Rows are tank size (gallons), columns are household size (people).
const FREQUENCY_TABLE: Record<number, Record<number, number>> = {
  500:  { 1: 5.8, 2: 2.6, 3: 1.5, 4: 1.0, 5: 0.7, 6: 0.4, 7: 0.3, 8: 0.2 },
  750:  { 1: 9.1, 2: 4.2, 3: 2.6, 4: 1.8, 5: 1.3, 6: 1.0, 7: 0.7, 8: 0.6 },
  900:  { 1: 11.0, 2: 5.2, 3: 3.3, 4: 2.3, 5: 1.7, 6: 1.3, 7: 1.0, 8: 0.8 },
  1000: { 1: 12.4, 2: 5.9, 3: 3.7, 4: 2.6, 5: 2.0, 6: 1.5, 7: 1.2, 8: 1.0 },
  1250: { 1: 15.6, 2: 7.5, 3: 4.8, 4: 3.4, 5: 2.6, 6: 2.0, 7: 1.7, 8: 1.4 },
  1500: { 1: 18.9, 2: 9.1, 3: 5.9, 4: 4.2, 5: 3.3, 6: 2.6, 7: 2.1, 8: 1.8 },
  1750: { 1: 22.1, 2: 10.7, 3: 6.9, 4: 5.0, 5: 3.9, 6: 3.1, 7: 2.6, 8: 2.2 },
  2000: { 1: 25.4, 2: 12.4, 3: 8.0, 4: 5.9, 5: 4.5, 6: 3.7, 7: 3.1, 8: 2.6 },
};

const TANK_SIZES = [500, 750, 900, 1000, 1250, 1500, 1750, 2000];

export default function SepticCalculator() {
  const [people, setPeople] = useState(4);
  const [tankSize, setTankSize] = useState(1000);
  const [lastPumped, setLastPumped] = useState<string>("");

  const recommendation = useMemo(() => {
    const baseYears = FREQUENCY_TABLE[tankSize]?.[Math.min(8, Math.max(1, people))] ?? 3;
    let nextDue = "";
    let overdue = false;
    if (lastPumped) {
      const lp = new Date(lastPumped);
      const due = new Date(lp);
      due.setMonth(due.getMonth() + Math.round(baseYears * 12));
      nextDue = due.toLocaleDateString("en-CA", { year: "numeric", month: "long" });
      overdue = due < new Date();
    }
    return { baseYears, nextDue, overdue };
  }, [people, tankSize, lastPumped]);

  return (
    <div className="calculator">
      <div className="calculator__grid">
        <label className="cf-field">
          <span className="cf-label">People in household</span>
          <input
            type="number"
            min={1}
            max={12}
            value={people}
            onChange={e => setPeople(Math.max(1, Math.min(12, Number(e.target.value) || 1)))}
          />
        </label>

        <label className="cf-field">
          <span className="cf-label">Tank size (US gallons)</span>
          <select value={tankSize} onChange={e => setTankSize(Number(e.target.value))}>
            {TANK_SIZES.map(s => (
              <option key={s} value={s}>{s} gal</option>
            ))}
          </select>
        </label>

        <label className="cf-field">
          <span className="cf-label">Last pumped (optional)</span>
          <input
            type="date"
            value={lastPumped}
            onChange={e => setLastPumped(e.target.value)}
          />
        </label>
      </div>

      <div className="calculator__result">
        <div className="calculator__metric">
          <span className="calculator__metric-label">Recommended frequency</span>
          <span className="calculator__metric-value">
            Every {recommendation.baseYears < 1 ? "< 1" : recommendation.baseYears.toFixed(1)} year{recommendation.baseYears === 1 ? "" : "s"}
          </span>
        </div>
        {recommendation.nextDue && (
          <div className={`calculator__metric ${recommendation.overdue ? "is-overdue" : ""}`}>
            <span className="calculator__metric-label">Next service due</span>
            <span className="calculator__metric-value">
              {recommendation.nextDue}
              {recommendation.overdue && <span className="calculator__badge"> Overdue</span>}
            </span>
          </div>
        )}
        <p className="calculator__note">
          This is an estimate based on industry guidance. Garbage disposal use,
          laundry volume, and tank condition can shorten this interval. When in
          doubt, schedule an inspection.
        </p>
        <a href="/contact/" className="btn btn-primary btn-lg">Book Service</a>
      </div>

      <style>{`
        .calculator {
          background: var(--c-white);
          border: 1px solid var(--c-border);
          border-radius: var(--radius-lg);
          padding: 32px;
          box-shadow: var(--shadow-md);
        }
        .calculator__grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 28px;
        }
        .calculator .cf-field { display: flex; flex-direction: column; gap: 6px; }
        .calculator .cf-label {
          font-family: var(--font-heading);
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--c-ink);
        }
        .calculator input, .calculator select {
          padding: 14px 16px;
          font-size: 16px;
          border: 1px solid var(--c-border);
          border-radius: var(--radius-sm);
          background: var(--c-bg-alt);
        }
        .calculator__result {
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 24px;
          background: var(--c-bg-alt);
          border-radius: var(--radius-md);
        }
        .calculator__metric {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 12px;
          padding-bottom: 12px;
          border-bottom: 1px dashed var(--c-border);
        }
        .calculator__metric:last-of-type { border-bottom: 0; padding-bottom: 0; }
        .calculator__metric-label {
          font-family: var(--font-heading);
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--c-text-muted);
        }
        .calculator__metric-value {
          font-family: var(--font-heading);
          font-size: 22px;
          font-weight: 600;
          color: var(--c-ink);
        }
        .calculator__badge {
          display: inline-block;
          margin-left: 8px;
          padding: 4px 10px;
          background: #c0392b;
          color: var(--c-white);
          border-radius: 99px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.04em;
        }
        .calculator__note { font-size: 14px; color: var(--c-text-muted); margin: 8px 0 16px; }
        @media (max-width: 720px) {
          .calculator__grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
