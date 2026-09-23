'use client';
import { useState } from 'react';
import { Feedback } from '@/lib/schema';
export function FeedbackForm({
  id,
  repo,
  example,
}: {
  id: string;
  repo: string;
  example: boolean;
}) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  return (
    <section className="feedback" id="review">
      <div className="section-label">YOUR JUDGEMENT</div>
      <h2>What should happen next?</h2>
      <p>Your scores and specific notes become context for the next run.</p>
      {example ? (
        <p className="notice">
          This is an example. Reviews are disabled so sample data cannot affect the agents.
        </p>
      ) : (
        <form
          onChange={() => setUrl('')}
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const result = Feedback.safeParse({
              version: 1,
              ideaId: id,
              decision: f.get('decision'),
              idea: Number(f.get('idea')),
              design: Number(f.get('design')),
              copy: Number(f.get('copy')),
              usability: Number(f.get('usability')),
              note: f.get('note'),
              scope: f.get('scope'),
            });
            if (!result.success) {
              setError('Complete all scores and add a note of at least five characters.');
              return;
            }
            setError('');
            const body =
              'Owner review for the Idea Lab. Submit this issue to persist feedback.\n\n```json\n' +
              JSON.stringify(result.data, null, 2) +
              '\n```';
            setUrl(
              `https://github.com/${repo}/issues/new?${new URLSearchParams({ title: `[Lab feedback] ${id}`, body })}`,
            );
          }}
        >
          <div className="score-grid">
            {['idea', 'design', 'copy', 'usability'].map((name) => (
              <label key={name}>
                {name}
                <select name={name} required defaultValue="">
                  <option value="" disabled>
                    Score / 5
                  </option>
                  {[1, 2, 3, 4, 5].map((v) => (
                    <option key={v} value={v}>
                      {v} / 5
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <label>
            Decision
            <select name="decision" defaultValue="revise">
              <option value="pursue">Pursue</option>
              <option value="revise">Revise</option>
              <option value="reject">Reject</option>
            </select>
          </label>
          <label>
            What works, and what would you change?
            <textarea
              name="note"
              required
              minLength={5}
              maxLength={2000}
              placeholder="The editorial layout works. The headline needs to be more specific about the buyer’s problem."
            />
          </label>
          <label>
            Apply this feedback to
            <select name="scope" defaultValue="this-page">
              <option value="this-page">This page only</option>
              <option value="general-preference">Future designs too</option>
            </select>
          </label>
          {error && <p role="alert">{error}</p>}
          <button className="primary">Prepare feedback →</button>
          {url && (
            <div className="notice" role="status">
              Your feedback draft is ready. It has not been saved yet.{' '}
              <a href={url} target="_blank" rel="noreferrer">
                Open GitHub and submit the issue →
              </a>
            </div>
          )}
        </form>
      )}
    </section>
  );
}
