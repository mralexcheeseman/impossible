import { z } from 'zod';
export interface ModelResult<T> {
  value: T;
  inputTokens: number;
  outputTokens: number;
  sourceUrls: string[];
}
export interface ModelProvider {
  generate<T>(task: {
    prompt: string;
    schema: z.ZodType<T>;
    search?: boolean;
    images?: string[];
  }): Promise<ModelResult<T>>;
}
// Formats accepted by OpenAI structured outputs in strict mode.
const STRICT_FORMATS = new Set([
  'date-time',
  'time',
  'date',
  'duration',
  'email',
  'hostname',
  'ipv4',
  'ipv6',
  'uuid',
]);

// Strict mode rejects keywords outside its supported subset. Drop them and move string length
// limits into descriptions; the Zod schema still enforces every constraint on the response.
export function strictJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const clean = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(clean);
    if (!node || typeof node !== 'object') return node;
    const out: Record<string, unknown> = {};
    const hints: string[] = [];
    for (const [key, value] of Object.entries(node)) {
      if (key === '$schema') continue;
      if (key === 'minLength' || key === 'maxLength') {
        hints.push(`${key === 'minLength' ? 'At least' : 'At most'} ${value} characters.`);
        continue;
      }
      if (key === 'format' && !STRICT_FORMATS.has(String(value))) continue;
      out[key] = clean(value);
    }
    if (hints.length) out.description = [out.description, ...hints].filter(Boolean).join(' ');
    return out;
  };
  return clean(z.toJSONSchema(schema)) as Record<string, unknown>;
}

export class ResponsesProvider implements ModelProvider {
  private calls = 0;
  constructor(
    private readonly key: string,
    private readonly model: string,
    private readonly maxCalls = 6,
  ) {}
  async generate<T>({
    prompt,
    schema,
    search = false,
    images = [],
  }: {
    prompt: string;
    schema: z.ZodType<T>;
    search?: boolean;
    images?: string[];
  }): Promise<ModelResult<T>> {
    if (++this.calls > this.maxCalls) throw new Error('Model call cap reached');
    if (prompt.length > 100000) throw new Error('Input size cap reached');
    const content: Record<string, unknown>[] = [
      { type: 'input_text', text: prompt },
      ...images.map((image_url) => ({ type: 'input_image', image_url, detail: 'auto' })),
    ];
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.key}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(180000),
      body: JSON.stringify({
        model: this.model,
        store: false,
        max_output_tokens: 7000,
        input: [{ role: 'user', content }],
        ...(search
          ? {
              tools: [{ type: 'web_search', search_context_size: 'low' }],
              max_tool_calls: 3,
              include: ['web_search_call.action.sources'],
            }
          : {}),
        text: {
          format: {
            type: 'json_schema',
            name: 'agent_output',
            strict: true,
            schema: strictJsonSchema(schema),
          },
        },
      }),
    });
    if (!response.ok)
      throw new Error(
        `Model API returned HTTP ${response.status}: ${(await response.text()).slice(0, 500)}`,
      );
    const result = await response.json();
    if (result.status !== 'completed') throw new Error('Model response incomplete');
    let output = '';
    const urls = new Set<string>();
    for (const item of result.output ?? []) {
      for (const source of item.action?.sources ?? []) if (source.url) urls.add(source.url);
      for (const c of item.content ?? []) {
        if (c.type === 'output_text') output += c.text;
        for (const a of c.annotations ?? [])
          if (a.type === 'url_citation' && a.url) urls.add(a.url);
      }
    }
    return {
      value: schema.parse(JSON.parse(output)),
      inputTokens: result.usage?.input_tokens ?? 0,
      outputTokens: result.usage?.output_tokens ?? 0,
      sourceUrls: [...urls],
    };
  }
}
