import { supabase } from './supabase';

export async function getUserRole(
  userId: string,
  email?: string,
): Promise<'user' | 'dev'> {
  const devEmails = (process.env.DEV_UNLIMITED_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const { data, error } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(error.message);
  }

  const role: 'user' | 'dev' = (data?.role as 'user' | 'dev') || 'user';
  const userEmail = data?.email || email;

  if (userEmail && devEmails.includes(userEmail.toLowerCase())) {
    if (role !== 'dev') {
      await supabase
        .from('profiles')
        .upsert({ id: userId, email: userEmail, role: 'dev' });
    }
    return 'dev';
  }

  if (!data) {
    await supabase
      .from('profiles')
      .upsert({ id: userId, email: userEmail, role });
  }

  return role;
}
