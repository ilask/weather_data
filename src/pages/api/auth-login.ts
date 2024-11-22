import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getLlmModelAndGenerateContent } from '@/utils/functions';
import { supabase } from '@/supabase';

type LoginRequest = {
  userId: string;
  password: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { userId, password } = req.body as LoginRequest;

    if (!userId || !password) {
      return res.status(400).json({ error: 'ユーザーIDとパスワードは必須です' });
    }

    if (!userId.trim() || !password.trim()) {
      return res.status(400).json({ error: '有効なユーザーIDとパスワードを入力してください' });
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: userId,
      password: password,
    });

    if (authError) {
      await logApiAccess(userId, 'login_failed');
      return res.status(401).json({ error: authError.message });
    }

    if (!authData.session) {
      await logApiAccess(userId, 'login_failed');
      return res.status(401).json({ error: '認証に失敗しました' });
    }

    await logApiAccess(userId, 'login_success');

    return res.status(200).json({
      token: authData.session.access_token,
      user: {
        id: authData.session.user.id,
        email: authData.session.user.email,
      }
    });

  } catch (error) {
    console.error('認証エラー:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function logApiAccess(clientId: string, status: string) {
  try {
    await supabase.from('api_access_logs').insert({
      client_id: clientId,
      request_info: {
        method: 'POST',
        path: '/api/auth/login',
        status: status,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('ログ記録エラー:', error);
  }
}