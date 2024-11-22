import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getLlmModelAndGenerateContent } from '@/utils/functions';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type ExportRequest = {
  startDate: string;
  endDate: string;
  format: 'csv' | 'json';
  areaCode: string;
};

type ExportJob = {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  totalRecords: number;
  processedRecords: number;
  downloadUrl?: string;
  error?: string;
};

async function validateRequest(body: any): Promise<ExportRequest | null> {
  try {
    const { startDate, endDate, format, areaCode } = body;
    if (!startDate || !endDate || !format || !areaCode) return null;
    if (!['csv', 'json'].includes(format)) return null;
    if (!/^\d{6}$/.test(areaCode)) return null;
    if (isNaN(Date.parse(startDate)) || isNaN(Date.parse(endDate))) return null;
    return { startDate, endDate, format, areaCode };
  } catch {
    return null;
  }
}

async function startExportJob(params: ExportRequest): Promise<string> {
  const jobId = uuidv4();
  const { error } = await supabase
    .from('export_jobs')
    .insert({
      id: jobId,
      status: 'pending',
      params,
      progress: 0,
      totalRecords: 0,
      processedRecords: 0
    });

  if (error) throw new Error('ジョブの作成に失敗しました');

  // バックグラウンドでエクスポート処理を開始
  processExportJob(jobId, params);

  return jobId;
}

async function processExportJob(jobId: string, params: ExportRequest) {
  try {
    const { data, error } = await supabase
      .from('weather_data')
      .select('*')
      .eq('area_code', params.areaCode)
      .gte('created_at', params.startDate)
      .lte('created_at', params.endDate);

    if (error) throw error;

    const totalRecords = data.length;
    let processedRecords = 0;

    await supabase
      .from('export_jobs')
      .update({
        status: 'processing',
        totalRecords
      })
      .eq('id', jobId);

    // データの変換処理
    const chunks = [];
    for (let i = 0; i < data.length; i += 1000) {
      const chunk = data.slice(i, i + 1000);
      chunks.push(chunk);
      processedRecords += chunk.length;

      await supabase
        .from('export_jobs')
        .update({
          processedRecords,
          progress: Math.floor((processedRecords / totalRecords) * 100)
        })
        .eq('id', jobId);
    }

    // ファイルの生成と保存
    const fileName = `export_${jobId}.${params.format}`;
    const fileContent = params.format === 'csv' 
      ? convertToCsv(data)
      : JSON.stringify(data, null, 2);

    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('exports')
      .upload(fileName, fileContent);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('exports')
      .getPublicUrl(fileName);

    await supabase
      .from('export_jobs')
      .update({
        status: 'completed',
        downloadUrl: publicUrl
      })
      .eq('id', jobId);

  } catch (error) {
    await supabase
      .from('export_jobs')
      .update({
        status: 'failed',
        error: error instanceof Error ? error.message : '不明なエラーが発生しました'
      })
      .eq('id', jobId);
  }
}

function convertToCsv(data: any[]): string {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(item => headers.map(header => item[header]));
  return [headers.join(','), ...rows.map(row => row.join(','))].join('
');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'POST') {
      const validatedParams = await validateRequest(req.body);
      if (!validatedParams) {
        return res.status(400).json({ error: '無効なリクエストパラメータです' });
      }

      const jobId = await startExportJob(validatedParams);
      return res.status(202).json({
        message: 'エクスポート処理を開始しました',
        jobId
      });

    } else if (req.method === 'GET') {
      const { jobId } = req.query;
      if (!jobId || typeof jobId !== 'string') {
        return res.status(400).json({ error: 'ジョブIDが指定されていません' });
      }

      const { data, error } = await supabase
        .from('export_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: '指定されたジョブが見つかりません' });
      }

      return res.status(200).json(data);

    } else {
      return res.status(405).json({ error: '許可されていないメソッドです' });
    }

  } catch (error) {
    console.error('エクスポート処理エラー:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'データの抽出に失敗しました'
    });
  }
}