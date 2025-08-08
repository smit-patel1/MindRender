import type { Context } from 'hono';
import { z } from 'zod';
import { supabase } from '../lib/supabase';

export const tokenTotalHandler = async (c: Context) => {
  try {
    const authHeader = c.req.header('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      throw new Error('Missing or invalid authorization header');
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Invalid authentication token');
    }

    const userId = c.req.query('user_id');
    const schema = z.string();
    const parsedId = schema.parse(userId);
    if (parsedId !== user.id) {
      throw new Error('Invalid or mismatched user_id');
    }

    const { data, error } = await supabase
      .from('token_usage')
      .select('tokens_used')
      .eq('user_id', parsedId);
    if (error) {
      throw new Error(error.message);
    }
    const total = data.reduce((sum, row) => sum + (row.tokens_used || 0), 0);
    return c.json({ total }, 200);
  } catch (err: any) {
    return c.json(
      { error: err.message || 'Unexpected error', total: 0 },
      500
    );
  }
};
