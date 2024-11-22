import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { supabase } from '@/supabase';
import { getLlmModelAndGenerateContent } from '@/utils/functions';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

type BackupRecord = {
  id: string;
  timestamp: string;
  type: 'auto' | 'manual';
  status: 'success' | 'failed';
  size: string;
  description?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, description } = req.body;

  if (!type) {
    return res.status(400).json({ error: 'バックアップタイプは必須です' });
  }

  try {
    // バックアップ対象データの取得
    const { data: backupData, error: fetchError } = await supabase
      .from('weather_data')
      .select('*');

    if (fetchError) {
      throw new Error('データの取得に失敗しました');
    }

    if (!backupData || backupData.length === 0) {
      return res.status(404).json({ error: 'バックアップ対象のデータが存在しません' });
    }

    // バックアップファイルの作成
    const timestamp = new Date().toISOString();
    const backupFileName = `backup-${timestamp}.json`;
    const backupContent = JSON.stringify(backupData);

    // S3へのアップロード
    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET!,
          Key: backupFileName,
          Body: backupContent,
          ContentType: 'application/json'
        })
      );
    } catch (s3Error) {
      throw new Error('バックアップファイルの保存に失敗しました');
    }

    // バックアップ履歴の保存
    const backupRecord: BackupRecord = {
      id: `backup-${Date.now()}`,
      timestamp,
      type,
      status: 'success',
      size: `${(backupContent.length / (1024 * 1024)).toFixed(2)}MB`,
      description
    };

    const { data: historyData, error: historyError } = await supabase
      .from('system_logs')
      .insert([{
        log_level: 'INFO',
        message: `バックアップ完了: ${backupRecord.id}`,
        error_details: backupRecord
      }]);

    if (historyError) {
      throw new Error('バックアップ履歴の保存に失敗しました');
    }

    // AI APIを使用した結果通知の生成
    try {
      const notificationPrompt = `バックアップID: ${backupRecord.id}のバックアップが完了しました。
サイズ: ${backupRecord.size}
タイプ: ${backupRecord.type}
${description ? `説明: ${description}` : ''}
適切な通知メッセージを生成してください。`;

      const notification = await getLlmModelAndGenerateContent(
        'Gemini',
        'あなたはバックアップ完了通知を生成するアシスタントです。',
        notificationPrompt
      );

      // システムログに通知内容を記録
      await supabase.from('system_logs').insert([{
        log_level: 'INFO',
        message: notification,
        error_details: { type: 'backup_notification', backupId: backupRecord.id }
      }]);
    } catch (notificationError) {
      console.error('通知生成に失敗しました:', notificationError);
    }

    return res.status(200).json({
      success: true,
      backupId: backupRecord.id
    });

  } catch (error) {
    console.error('バックアップ処理エラー:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'バックアップ処理に失敗しました'
    });
  }
}