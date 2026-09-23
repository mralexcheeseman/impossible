import { z } from 'zod';
const text = z.string().min(1).max(800);
export const Source = z
  .object({
    url: z.url().startsWith('https://').max(1000),
    title: text,
    claim: text,
    kind: z.enum(['observation', 'counterevidence', 'context']),
  })
  .strict();
export const Idea = z
  .object({
    id: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(70),
    name: z.string().min(1).max(70),
    tagline: z.string().min(1).max(160),
    audience: text,
    problem: text,
    solution: text,
    whyNow: text,
    distribution: text,
    priceHypothesis: text,
    falsificationTest: text,
    uncertainties: z.array(text).min(1).max(5),
    sources: z.array(Source).min(1).max(4),
  })
  .strict();
export const Challenge = z
  .object({
    ideaId: z.string(),
    score: z.number().int().min(0).max(100),
    verdict: z.enum(['build', 'research', 'reject']),
    rationale: text,
    strongestObjection: text,
  })
  .strict();
export const Landing = z
  .object({
    ideaId: z.string(),
    theme: z.enum(['editorial', 'signal', 'studio']),
    eyebrow: z.string().max(70),
    headline: z.string().min(1).max(100),
    subhead: z.string().min(1).max(260),
    cta: z.string().min(1).max(40),
    benefits: z
      .array(
        z.object({ title: z.string().min(1).max(70), body: z.string().min(1).max(220) }).strict(),
      )
      .min(3)
      .max(4),
    steps: z.array(z.string().min(1).max(150)).length(3),
    closing: z.string().min(1).max(140),
    designRationale: text,
  })
  .strict();
export const Feedback = z
  .object({
    version: z.literal(1),
    ideaId: z
      .string()
      .regex(/^[a-z0-9-]+$/)
      .max(70),
    decision: z.enum(['pursue', 'revise', 'reject']),
    idea: z.number().int().min(1).max(5),
    design: z.number().int().min(1).max(5),
    copy: z.number().int().min(1).max(5),
    usability: z.number().int().min(1).max(5),
    note: z.string().min(5).max(2000),
    scope: z.enum(['this-page', 'general-preference']),
  })
  .strict();
export const Critique = z
  .object({
    pass: z.boolean(),
    strengths: z.array(text).max(4),
    changes: z.array(text).max(5),
    proposedRule: text,
  })
  .strict();
export const Batch = z.object({
  id: z.string(),
  createdAt: z.iso.datetime(),
  mode: z.enum(['example', 'live']),
  ideas: z.array(Idea).max(3),
  challenges: z.array(Challenge),
  pages: z.array(Landing).max(1),
  critique: Critique.nullable(),
  events: z.array(
    z.object({
      at: z.string(),
      type: z.string(),
      detail: z.string(),
      inputTokens: z.number().optional(),
      outputTokens: z.number().optional(),
    }),
  ),
  feedbackCount: z.number().int().nonnegative(),
});
export type IdeaType = z.infer<typeof Idea>;
export type LandingType = z.infer<typeof Landing>;
export type BatchType = z.infer<typeof Batch>;
export type FeedbackType = z.infer<typeof Feedback>;
export function verifyRelations(batch: BatchType) {
  const ids = batch.ideas.map((i) => i.id);
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate idea IDs');
  if (
    batch.challenges.length !== ids.length ||
    new Set(batch.challenges.map((c) => c.ideaId)).size !== ids.length ||
    [...batch.challenges, ...batch.pages].some((x) => !ids.includes(x.ideaId))
  )
    throw new Error('Invalid idea references');
}
export function sourceKey(url: string) {
  const u = new URL(url);
  u.hash = '';
  return u.href.replace(/\/$/, '');
}
export function verifySources(ideas: IdeaType[], urls: string[]) {
  const allowed = new Set(urls.map(sourceKey));
  for (const idea of ideas)
    for (const source of idea.sources)
      if (!allowed.has(sourceKey(source.url)))
        throw new Error('Evidence URL was not returned by research tools');
}
export function feedbackFromIssue(
  body: string,
  author: string,
  owner: string,
): FeedbackType | null {
  if (author !== owner) return null;
  const m = body.match(/```json\s*([\s\S]*?)\s*```/);
  if (!m) return null;
  try {
    const p = Feedback.safeParse(JSON.parse(m[1]));
    return p.success ? p.data : null;
  } catch {
    return null;
  }
}
