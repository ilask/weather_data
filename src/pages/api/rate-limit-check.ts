import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getLlmModelAndGenerateContent } from '@/utils/functions';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

interface RateLimitConfig {
  requests_per_minute: number;
  is_blocked: boolean;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const clientId = req.headers['x-client-id'];

  if (!clientId) {
    return res.status(400).json({ error: 'クライアントIDが必要です' });
  }

  try {
    if (req.method === 'GET') {
      const { data: config, error: configError } = await supabase
        .from('api_access_logs')
        .select('requests_per_minute, is_blocked')
        .eq('client_id', clientId)
        .single();

      if (configError) {
        throw new Error('設定の取得に失敗しました');
      }

      if (config.is_blocked) {
        return res.status(429).json({ error: 'クライアントがブロックされています' });
      }

      const { data: requestCount, error: countError } = await supabase
        .rpc('get_request_count', {
          client_id_param: clientId,
          minutes_param: 1
        });

      if (countError) {
        throw new Error('リクエスト数の取得に失敗しました');
      }

      const remaining = config.requests_per_minute - requestCount.count;
      const allowed = remaining > 0;

      await supabase
        .from('api_access_logs')
        .insert({
          client_id: clientId,
          request_info: {
            method: req.method,
            path: req.url,
            timestamp: new Date().toISOString()
          }
        });

      return res.status(allowed ? 200 : 429).json(
        allowed ? { allowed, remaining } : { error: 'レート制限を超過しました' }
      );

    } else if (req.method === 'PUT') {
      const { requests_per_minute } = req.body;

      if (typeof requests_per_minute !== 'number' || requests_per_minute < 0) {
        return res.status(400).json({ error: '無効な制限値です' });
      }

      const { data, error } = await supabase
        .from('api_access_logs')
        .update({ requests_per_minute })
        .eq('client_id', clientId)
        .select();

      if (error) {
        throw new Error('制限値の更新に失敗しました');
      }

      return res.status(200).json({
        success: true,
        updated_limit: requests_per_minute
      });

    } else {
      return res.status(405).json({ error: '許可されていないメソッドです' });
    }

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
}