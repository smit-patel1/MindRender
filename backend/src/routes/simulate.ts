import type { Context } from 'hono';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { getUserRole } from '../lib/roles';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;

// Moderation helpers
const BLOCKED_KEYWORDS = [
  'sexual',
  'sex',
  'intercourse',
  'intimacy',
  'nude',
  'naked',
  'porn',
  'erotic',
  'kill',
  'murder',
  'blood',
  'gore',
  'racist',
  'nazi',
  'hate crime',
  'suicide',
  'self-harm',
  'drug dealing',
  'meth',
  'cocaine',
  'kiss',
  'kissing',
];

function isLikelyEducational(prompt: string) {
  const lower = prompt.toLowerCase();
  const keywords = [
    'explain',
    'visualize',
    'simulate',
    'demonstrate',
    'illustrate',
    'teach',
    'understand',
    'learn',
    'model',
    'concept',
    'how',
    'why',
    'what',
    'effect',
    'impact',
  ];
  const phrases = [
    /how\s+.*\s+works/i,
    /simulate\s+.*\s+concept/i,
    /educational\s+(activity|model)/i,
    /visualize\s+(the)?\s+process/i,
  ];
  if (keywords.some((w) => lower.includes(w))) return true;
  if (phrases.some((r) => r.test(prompt))) return true;
  return false;
}

function validatePrompt(prompt: string, subject?: string) {
  const lower = prompt.toLowerCase();
  if (
    !(subject === 'Biology' && /\b(reproduction|fertilization)\b/.test(lower))
  ) {
    for (const w of BLOCKED_KEYWORDS) {
      if (new RegExp(`\\b${w}\\b`, 'i').test(prompt)) {
        return {
          isValid: false,
          reason: 'Please keep content strictly scientific and non-sexual.',
        };
      }
    }
  }
  if (!isLikelyEducational(prompt)) {
    return {
      isValid: false,
      reason:
        'Only educational simulations are supported. Please rephrase your prompt to focus on explaining or demonstrating a concept.',
    };
  }
  if (prompt.trim().length < 10) {
    return {
      isValid: false,
      reason: 'Please provide more detail (≥ 10 characters).',
    };
  }
  if (prompt.length > 500) {
    return {
      isValid: false,
      reason: 'Please keep your prompt under 500 characters.',
    };
  }
  return { isValid: true };
}

async function callClaude(messages: Array<{ role: string; content: string }>) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 10000,
      temperature: 0.3,
      messages,
    }),
  });
  if (!res.ok) throw new Error(`Claude API returned ${res.status}`);
  const data = await res.json();
  return {
    content: data.content[0]?.text ? [data.content[0].text] : data.content,
    usage: data.usage,
  };
}

function createSimulationPrompt(prompt: string, subject: string) {
  return `You are an expert JavaScript engineer. Create a clean, runnable interactive ${subject} simulation without any assumptions. Output must follow this format:
\n\n\`\`\`
---CANVAS---
<canvas id="sim" width="800" height="600"></canvas>

---SCRIPT---
// 1. SETUP: grab canvas, get context, init data & listeners, console.log('initialized')
// 2. ANIMATE: function animate(){ update; clear; draw; requestAnimationFrame(animate);} animate();
// 3. HELPERS: optional helper functions
---EXPLANATION---
[Explain how this simulation demonstrates the ${subject} concepts]

> Prompt: "${prompt}"
\`\`\`

Requirements:
- Draw all controls inside the canvas.
- Use a coherent color palette and legible on-canvas text.
- Keep complexity balanced—only essential math and interactivity.`;
}

function extractCode(content: string) {
  const canvas =
    content.match(/---CANVAS---\s*([\s\S]*?)\s*---SCRIPT---/i)?.[1]?.trim() ||
    content.match(/<canvas[^>]*>.*?<\/canvas>/is)?.[0] ||
    null;
  const js =
    content
      .match(/---SCRIPT---\s*([\s\S]*?)\s*---EXPLANATION---/i)?.[1]
      ?.trim() ||
    content.match(/<script[^>]*>([\s\S]*?)<\/script>/i)?.[1]?.trim() ||
    null;
  return { canvas, js };
}

export const simulateHandler = async (c: Context) => {
  try {
    const authHeader = c.req.header('authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser(token);
    if (authErr || !user) throw new Error('Unauthorized');

    const body = await c.req.json();
    const schema = z.object({
      prompt: z.string(),
      subject: z.string().optional(),
    });
    const { prompt, subject = 'Physics' } = schema.parse(body);

    const { isValid, reason } = validatePrompt(prompt, subject);
    if (!isValid) throw new Error(reason);

    const role = await getUserRole(user.id, user.email || undefined);

    const systemPrompt = createSimulationPrompt(prompt, subject);
    const claudeResp = await callClaude([
      { role: 'user', content: systemPrompt },
    ]);

    const raw = claudeResp.content.join('\n');
    const { canvas, js } = extractCode(raw);
    if (!canvas || !js) throw new Error('Could not extract code sections');

    const totalTokens =
      (claudeResp.usage.input_tokens || 0) +
      (claudeResp.usage.output_tokens || 0);
    if (role !== 'dev' && totalTokens > 10000) {
      return c.json(
        {
          error: 'Token limit exceeded',
          explanation: `<div style="color:#222; max-height:60vh; overflow-y:auto; padding-right:8px;">
          Simulation couldn’t be produced—you’ve used ${totalTokens}/10000 tokens. Please try again later.
        </div>`,
          canvasHtml:
            '<canvas id="sim" width="800" height="600" style="width:100%;height:100%;display:block;"></canvas>',
          jsCode: '',
          usage: { totalTokens },
        },
        200,
      );
    }

    const styledCanvas = canvas.replace(
      /<canvas/,
      `<canvas style="width:100%; height:100%; display:block;"`,
    );
    const wrappedJs = `
(function(){
  ${js}
})();
`;

    await supabase.from('token_usage').insert({
      user_id: user.id,
      prompt: `${subject}: ${prompt}`,
      subject,
      tokens_used: totalTokens,
      created_at: new Date().toISOString(),
    });

    const rawExp = raw.split('---EXPLANATION---')[1]?.trim() || '';
    const safeExp = `<div style="color:#222; max-height:60vh; overflow-y:auto; padding-right:8px;">
      ${rawExp}
    </div>`;

    return c.json(
      {
        canvasHtml: styledCanvas,
        jsCode: wrappedJs,
        explanation: safeExp,
        usage: { totalTokens },
      },
      200,
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unexpected error';
    return c.json(
      {
        error: 'Simulation failed',
        explanation: `<div style="color:#222; max-height:60vh; overflow-y:auto; padding-right:8px;">
        ${msg}
      </div>`,
        canvasHtml:
          '<canvas id="sim" width="800" height="600" style="width:100%;height:100%;display:block;"></canvas>',
        jsCode: '',
        usage: { totalTokens: 0 },
      },
      200,
    );
  }
};
