import type { Context } from 'hono';
import { z } from 'zod';
import { supabase } from '../lib/supabase';

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
  'kissing'
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
    'impact'
  ];
  const phrases = [
    /how\s+.*\s+works/i,
    /simulate\s+.*\s+concept/i,
    /educational\s+(activity|model)/i,
    /visualize\s+(the)?\s+process/i
  ];
  if (keywords.some((w) => lower.includes(w))) return true;
  if (phrases.some((r) => r.test(prompt))) return true;
  return false;
}

function validatePrompt(prompt: string, subject?: string) {
  const lower = prompt.toLowerCase();
  if (!(subject === 'Biology' && /\b(reproduction|fertilization)\b/.test(lower))) {
    for (const w of BLOCKED_KEYWORDS) {
      if (new RegExp(`\\b${w}\\b`, 'i').test(prompt)) {
        return { isValid: false, reason: 'Please keep content strictly scientific and non-sexual.' };
      }
    }
  }
  if (!isLikelyEducational(prompt)) {
    return {
      isValid: false,
      reason:
        'Only educational simulations are supported. Please rephrase your prompt to focus on explaining or demonstrating a concept.'
    };
  }
  if (prompt.trim().length < 10) {
    return { isValid: false, reason: 'Please provide more detail (≥ 10 characters).' };
  }
  if (prompt.length > 1000) {
    return { isValid: false, reason: 'Please keep your prompt under 1000 characters.' };
  }
  return { isValid: true };
}

async function callClaude(messages: any[]) {
  const timeoutMs = Number(process.env.ANTHROPIC_TIMEOUT_MS || 12000);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_FAST_MODEL || 'claude-3-5-sonnet-latest',
        max_tokens: Number(process.env.ANTHROPIC_MAX_TOKENS || 2500),
        temperature: 0.3,
        messages
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      if (res.status >= 500) {
        throw new Error(`Server error: ${res.status}`);
      }
      throw new Error(`Claude API returned ${res.status}`);
    }
    
    const data = await res.json();
    return {
      content: data.content[0]?.text ? [data.content[0].text] : data.content,
      usage: data.usage
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError' || (error.message && error.message.includes('Server error'))) {
      // Retry once with fallback model and reduced tokens
      const fallbackController = new AbortController();
      const fallbackTimeoutId = setTimeout(() => fallbackController.abort(), timeoutMs);
      
      try {
        const fallbackRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: process.env.ANTHROPIC_FALLBACK_MODEL || 'claude-sonnet-4-20250514',
            max_tokens: Number(process.env.ANTHROPIC_FALLBACK_MAX_TOKENS || 2200),
            temperature: 0.3,
            messages
          }),
          signal: fallbackController.signal
        });
        
        clearTimeout(fallbackTimeoutId);
        
        if (!fallbackRes.ok) throw new Error(`Fallback Claude API returned ${fallbackRes.status}`);
        
        const fallbackData = await fallbackRes.json();
        return {
          content: fallbackData.content[0]?.text ? [fallbackData.content[0].text] : fallbackData.content,
          usage: fallbackData.usage
        };
      } catch (fallbackError) {
        clearTimeout(fallbackTimeoutId);
        throw fallbackError;
      }
    }
    
    throw error;
  }
}

function createSimulationPrompt(prompt: string, subject: string) {
  return `Create an interactive ${subject} simulation. Output exactly and only the three sections with these markers. Do not add extra sections, markdown fences, or commentary outside them.

---CANVAS---
<canvas id="sim" width="800" height="600"></canvas>

---SCRIPT---
// Essential JavaScript only
---EXPLANATION---
[Max 120 words explaining the ${subject} concepts]

Prompt: "${prompt}"

Requirements:
- Keep the JavaScript succinct and only include essential math and interactivity.
- No external libraries; no network calls.
- Draw all controls inside the canvas.`;
}

function extractCode(content: string) {
  const canvas =
    content.match(/---CANVAS---\s*([\s\S]*?)\s*---SCRIPT---/i)?.[1]?.trim() ||
    content.match(/<canvas[^>]*>.*?<\/canvas>/is)?.[0] ||
    null;
  const js =
    content.match(/---SCRIPT---\s*([\s\S]*?)\s*---EXPLANATION---/i)?.[1]?.trim() ||
    content.match(/<script[^>]*>([\s\S]*?)<\/script>/i)?.[1]?.trim() ||
    null;
  return { canvas, js };
}

// Simple SHA-256 hash function
async function generateHash(input: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    // Use Web Crypto API if available
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } else {
    // Fallback: simple hash function (not cryptographically secure)
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }
}

export const simulateHandler = async (c: Context) => {
  try {
    const authHeader = c.req.header('authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) throw new Error('Unauthorized');

    const body = await c.req.json();
    const schema = z.object({ prompt: z.string(), subject: z.string().optional() });
    const { prompt, subject = 'Physics' } = schema.parse(body);

    const { isValid, reason } = validatePrompt(prompt, subject);
    if (!isValid) throw new Error(reason);

    // Check for streaming request
    const isStreamingEnabled = process.env.STREAMING_ENABLED === 'true';
    const acceptsStreaming = c.req.header('accept')?.includes('text/event-stream') || 
                           c.req.query('stream') === '1';
    
    if (isStreamingEnabled && acceptsStreaming) {
      // Streaming path structure - early return for now
      return c.json({ error: 'Streaming not yet implemented' }, 501);
    }

    // Generate cache key
    const cacheKey = `${subject}:${prompt}`;
    const promptHash = await generateHash(cacheKey);

    // Check cache first
    const { data: cacheHit } = await supabase
      .from('sim_cache')
      .select('canvas_html, js_code, explanation')
      .eq('user_id', user.id)
      .eq('subject', subject)
      .eq('prompt_hash', promptHash)
      .single();

    if (cacheHit) {
      return c.json(
        {
          canvasHtml: cacheHit.canvas_html,
          jsCode: cacheHit.js_code,
          explanation: cacheHit.explanation,
          usage: { totalTokens: 0, cacheHit: true }
        },
        200
      );
    }

    const systemPrompt = createSimulationPrompt(prompt, subject);
    const claudeResp = await callClaude([{ role: 'user', content: systemPrompt }]);

    const raw = claudeResp.content.join('\n');
    const { canvas, js } = extractCode(raw);
    if (!canvas || !js) throw new Error('Could not extract code sections');

    const totalTokens = (claudeResp.usage.input_tokens || 0) + (claudeResp.usage.output_tokens || 0);
    if (totalTokens > 10000) {
      return c.json(
        {
          error: 'Token limit exceeded',
          explanation: `<div style="color:#222; max-height:60vh; overflow-y:auto; padding-right:8px;">
          Simulation couldn’t be produced—you’ve used ${totalTokens}/10000 tokens. Please try again later.
        </div>`,
          canvasHtml:
            '<canvas id="sim" width="800" height="600" style="width:100%;height:100%;display:block;"></canvas>',
          jsCode: '',
          usage: { totalTokens }
        },
        200
      );
    }

    const styledCanvas = canvas.replace(
      /<canvas/,
      `<canvas style="width:100%; height:100%; display:block;"`
    );
    const wrappedJs = `
(function(){
  ${js}
})();
`;

    // Non-blocking token logging
    const tokenLogPromise = (async () => {
      try {
        await supabase.from('token_usage').insert({
          user_id: user.id,
          prompt: `${subject}: ${prompt}`,
          tokens_used: totalTokens,
          created_at: new Date().toISOString()
        });
      } catch (err) {
        console.error('Token logging failed:', err);
      }
    })();
    
    if ((c as any).executionCtx?.waitUntil) {
      (c as any).executionCtx.waitUntil(tokenLogPromise);
    }

    const rawExp = raw.split('---EXPLANATION---')[1]?.trim() || '';
    const safeExp = `<div style="color:#222; max-height:60vh; overflow-y:auto; padding-right:8px;">
      ${rawExp}
    </div>`;

    // Non-blocking cache write
    const cacheWritePromise = (async () => {
      try {
        await supabase.from('sim_cache').insert({
          user_id: user.id,
          subject,
          prompt_hash: promptHash,
          canvas_html: styledCanvas,
          js_code: wrappedJs,
          explanation: safeExp
        });
      } catch (err) {
        console.error('Cache write failed:', err);
      }
    })();
    
    if ((c as any).executionCtx?.waitUntil) {
      (c as any).executionCtx.waitUntil(cacheWritePromise);
    }

    return c.json(
      {
        canvasHtml: styledCanvas,
        jsCode: wrappedJs,
        explanation: safeExp,
        usage: { totalTokens }
      },
      200
    );
  } catch (err: any) {
    const msg = err.message || 'Unexpected error';
    return c.json(
      {
        error: 'Simulation failed',
        explanation: `<div style="color:#222; max-height:60vh; overflow-y:auto; padding-right:8px;">
        ${msg}
      </div>`,
        canvasHtml:
          '<canvas id="sim" width="800" height="600" style="width:100%;height:100%;display:block;"></canvas>',
        jsCode: '',
        usage: { totalTokens: 0 }
      },
      200
    );
  }
};
