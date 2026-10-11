import { calculateRate } from "@dg-stats/domain";

const emptyRate = calculateRate({ makes: 0, attempts: 0 });

const metrics = [
  { label: "Fairway hits", value: "—", context: "Import a recorded round" },
  { label: "C1 in regulation", value: "—", context: "Coverage required" },
  { label: "C1 putting", value: emptyRate.display, context: "0 opportunities" },
  { label: "Scramble rate", value: "—", context: "Coverage required" }
];

export default function HomePage() {
  return (
    <main className="shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="DG Stats home">
          <span aria-hidden="true">◉</span> DG Stats
        </a>
        <nav aria-label="Primary navigation">
          <a className="active" href="/">Overview</a>
          <a href="#rounds">Rounds</a>
          <a href="#trends">Trends</a>
          <a href="#imports">Imports</a>
        </nav>
        <p className="sidebar-note">Built around rounds, not yearly averages.</p>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">PLAYER ANALYTICS</p>
            <h1>Your game, round by round.</h1>
          </div>
          <button type="button" className="primary-button">Connect player</button>
        </header>

        <section className="setup-card" aria-labelledby="setup-title">
          <div className="setup-icon" aria-hidden="true">↗</div>
          <div>
            <p className="eyebrow">GET STARTED</p>
            <h2 id="setup-title">Add a player and import the first recorded round.</h2>
            <p>
              DG Stats keeps provider definitions and coverage with every metric,
              so your trend lines stay trustworthy as your data grows.
            </p>
          </div>
          <a className="text-link" href="#imports">View import plan →</a>
        </section>

        <section className="metric-grid" aria-label="Current player metrics">
          {metrics.map((metric) => (
            <article className="metric-card" key={metric.label}>
              <p>{metric.label}</p>
              <strong>{metric.value}</strong>
              <span>{metric.context}</span>
            </article>
          ))}
        </section>

        <section className="empty-state" id="rounds">
          <p className="eyebrow">NO ROUNDS YET</p>
          <h2>The dashboard starts with source-aware facts.</h2>
          <p>
            Each imported round records scores, opportunities, source definition,
            and completeness before it appears in a season aggregate.
          </p>
        </section>
      </section>
    </main>
  );
}
