import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getLlmModelAndGenerateContent } from '@/utils/functions';
import { supabase } from '@/supabase';
import axios from 'axios';

type ArchiveResponse = {
  success: boolean;
  message: string;
  archivedCount?: number;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ArchiveResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const { data: archiveData, error: selectError } = await supabase
      .from('weather_data')
      .select('*')
      .lte('created_at', oneYearAgo.toISOString());

    if (selectError) {
      return res.status(500).json({
        success: false,
        message: 'アーカイブ対象データの取得に失敗しました',
        error: selectError.message
      });
    }

    if (!archiveData || archiveData.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'アーカイブ対象のデータが存在しません',
        archivedCount: 0
      });
    }

    try {
      // 外部ストレージへのアーカイブ処理
      const archiveFileName = `weather_archive_${new Date().toISOString()}.json`;
      const { error: uploadError } = await supabase
        .storage
        .from('archives')
        .upload(archiveFileName, JSON.stringify(archiveData));

      if (uploadError) {
        throw uploadError;
      }

      // アーカイブ済みデータの削除
      const { error: deleteError } = await supabase
        .from('weather_data')
        .delete()
        .lte('created_at', oneYearAgo.toISOString());

      if (deleteError) {
        throw deleteError;
      }

      // アーカイブログの記録
      await supabase
        .from('system_logs')
        .insert({
          log_level: 'INFO',
          message: `${archiveData.length}件のデータをアーカイブしました`,
          error_details: {
            archive_file: archiveFileName,
            archived_count: archiveData.length,
            archive_date: new Date().toISOString()
          }
        });

      return res.status(200).json({
        success: true,
        message: 'アーカイブ処理が完了しました',
        archivedCount: archiveData.length
      });

    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'アーカイブ処理に失敗しました',
        error: error.message
      });
    }

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'アーカイブ処理中にエラーが発生しました',
      error: error.message
    });
  }
}