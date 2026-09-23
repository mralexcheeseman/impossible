import Link from 'next/link';
import { batches, repository, standards } from '@/lib/data';
export const dynamic = 'force-dynamic';
export default async function Home() {
  const all = await batches();
  const rows = all.flatMap((b) =>
    b.ideas.map((i) => ({
      idea: i,
      batch: b,
      challenge: b.challenges.find((c) => c.ideaId === i.id)!,
      page: b.pages.find((p) => p.ideaId === i.id),
    })),
  );
  const uniqueRows = rows.filter(
    (row, index) => rows.findIndex((other) => other.idea.id === row.idea.id) === index,
  );
  const live = all.filter((b) => b.mode === 'live');
  const memory = await standards();
  return (
    <div className="shell">
      <aside>
        <Link className="wordmark" href="/">
          i.<span>IMPOSSIBLE</span>
        </Link>
        <p className="aside-label">THE WORKSPACE</p>
        <a className="nav-link selected" href="#collection">
          01 <span>Idea collection</span>
        </a>
        <a className="nav-link" href="#memory">
          02 <span>Design memory</span>
        </a>
        <a className="nav-link" href="#operations">
          03 <span>Runbook</span>
        </a>
        <div className="aside-bottom">
          <span className="avatar">AC</span>
          <div>
            Alex’s studio<small>Ideas into experiments</small>
          </div>
        </div>
      </aside>
      <main className="workspace">
        <header className="topbar">
          <span>
            IDEA LAB <span className="muted">/ COLLECTION</span>
          </span>
          <a href={`https://github.com/${repository()}/pulls`} target="_blank" rel="noreferrer">
            Open review queue ↗
          </a>
        </header>
        <section className="intro">
          <div className="section-label">
            <span className="dot" /> A WORKING COLLECTION
          </div>
          <h1>
            Make room for
            <br />
            <em>what’s next.</em>
          </h1>
          <p>
            Interesting problems. Considered designs.
            <br />
            Your judgement makes the next round better.
          </p>
          <div className="summary">
            <div>
              <strong>
                {live
                  .reduce((n, b) => n + b.ideas.length, 0)
                  .toString()
                  .padStart(2, '0')}
              </strong>
              <span>researched ideas</span>
            </div>
            <div>
              <strong>
                {live
                  .reduce((n, b) => n + b.pages.length, 0)
                  .toString()
                  .padStart(2, '0')}
              </strong>
              <span>page concepts</span>
            </div>
            <div>
              <strong>{live.length.toString().padStart(2, '0')}</strong>
              <span>completed batches</span>
            </div>
          </div>
        </section>
        <section id="collection">
          <div className="section-heading">
            <h2>
              The collection <span>{uniqueRows.length}</span>
            </h2>
            <span className="muted">
              {live.length
                ? 'This deployment’s snapshot'
                : 'Examples · pipeline awaiting activation'}
            </span>
          </div>
          <div className="idea-grid">
            {uniqueRows.map(({ idea, batch, challenge, page }, index) => (
              <Link className="idea-card" href={`/ideas/${idea.id}`} key={idea.id}>
                <div
                  className={`card-art ${page?.theme ?? ['editorial', 'signal', 'studio'][index % 3]}`}
                >
                  <span className="card-kicker">
                    {batch.mode === 'example' ? 'ILLUSTRATIVE CONCEPT' : 'RESEARCH CANDIDATE'}
                  </span>
                  <div className="card-art-title">
                    {idea.name}
                    <span>↗</span>
                  </div>
                  <span className="card-art-line">{idea.tagline}</span>
                </div>
                <div className="card-details">
                  <div className="card-meta">
                    <span>{idea.audience}</span>
                    <span>
                      {batch.mode === 'example' ? 'EXAMPLE' : challenge.verdict.toUpperCase()}
                    </span>
                  </div>
                  <h3>{idea.name}</h3>
                  <p>{idea.tagline}</p>
                  <div className="card-bottom">
                    <span>{page ? 'Page concept included' : 'Research brief'}</span>
                    <span>Review →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
        <section className="memory-panel" id="memory">
          <div>
            <p className="section-label">DESIGN MEMORY / V1</p>
            <h2>
              A point of view,
              <br />
              <em>getting sharper.</em>
            </h2>
            <p>Examples, decisions and specific feedback guide every new page.</p>
          </div>
          <div>
            <ul>
              <li>Clear hierarchy. Confident typography.</li>
              <li>Specific copy. One useful next action.</li>
              <li>Distinctive ideas with honest claims.</li>
              <li>Your feedback, carried into the next run.</li>
            </ul>
            <details>
              <summary>Read the full design standards</summary>
              <pre>{memory}</pre>
            </details>
          </div>
        </section>
        <section id="operations" className="operations">
          <div className="section-label">THE OPERATING RHYTHM</div>
          <h2>Research. Challenge. Make. Learn.</h2>
          <div className="step-grid">
            {[
              [
                '01',
                'Scout & challenge',
                'Two candidates each Monday, Wednesday and Friday. Contrary evidence required.',
              ],
              [
                '02',
                'Build & inspect',
                'Monday and Friday: one strong candidate, desktop and mobile checks, visual critique.',
              ],
              [
                '03',
                'Your review',
                'Pursue, revise or reject. Scores and notes are saved through your GitHub feedback issue.',
              ],
              [
                '04',
                'The next run',
                'Agents read your latest feedback. Permanent rule changes stay reviewable.',
              ],
            ].map(([n, title, body]) => (
              <article key={n}>
                <span className="number">{n}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
          <p className="notice">
            This page is a deployment snapshot, not a live scheduler status. Check GitHub Actions
            for actual runs. Scheduled work requires a private repository, a model key and explicit
            activation.
          </p>
        </section>
        <footer className="workspace-footer">
          IMPOSSIBLE / IDEA LAB <span>Quality of judgement, over quantity of output.</span>
        </footer>
      </main>
    </div>
  );
}
