import Link from "next/link";

export default function Home() {
  return (
    <main>
      <header>
        <Link className="wordmark" href="/" aria-label="IMPOSSIBLE home">
          IMPOSSIBLE<span aria-hidden="true">.</span>
        </Link>
        <span className="status">Foundation / M0</span>
      </header>
      <section className="intro" aria-labelledby="mission">
        <p className="eyebrow">An experiment in entrepreneurship</p>
        <h1 id="mission">
          Can AI build a real business from nothing in seven days?
        </h1>
        <p className="lead">
          Find a real problem. Test the smallest useful idea. Let the evidence
          decide what happens next.
        </p>
      </section>
      <section className="experiment" aria-labelledby="experiment-title">
        <div>
          <p className="eyebrow">Experiment status</p>
          <h2 id="experiment-title">No experiment has been started.</h2>
          <p>
            The foundation is in place. Experiment controls will arrive with the
            next milestone.
          </p>
        </div>
        <div className="principle">
          <span>Our measure of progress</span>
          <strong>
            Real behaviour.
            <br />
            Validated learning.
          </strong>
        </div>
      </section>
      <footer>
        <span>Evidence over assertion.</span>
        <span>Human control, always.</span>
      </footer>
    </main>
  );
}
