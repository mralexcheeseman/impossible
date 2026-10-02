"use client";
export default function ControlError({ reset }: { reset: () => void }) {
  return (
    <main>
      <section className="intro">
        <h1>Control Room unavailable</h1>
        <p>
          We could not confirm the current state. No success is being assumed.
          Reload to reconcile any command whose result was uncertain.
        </p>
        <button onClick={reset}>Reload current state</button>
      </section>
    </main>
  );
}
