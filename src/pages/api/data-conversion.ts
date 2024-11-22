import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/supabase';
import { getLlmModelAndGenerateContent } from '@/utils/functions';

type ConversionRule = 'celsius_to_fahrenheit' | 'mm_to_inch';

interface ConversionRequest {
  data: WeatherData[];
  rules: {
    [key: string]: ConversionRule;
  };
}

interface WeatherData {
  temperature?: number;
  rainfall?: number;
  [key: string]: number | undefined;
}

interface ConversionJob {
  id: string;
  status: 'processing' | 'completed' | 'cancelled' | 'failed';
  result?: WeatherData[];
  error?: string;
}

const SUPPORTED_CONVERSION_RULES = ['celsius_to_fahrenheit', 'mm_to_inch'];

const convertData = async (data: WeatherData[], rules: { [key: string]: ConversionRule }): Promise<WeatherData[]> => {
  return data.map(item => {
    const converted: WeatherData = {};
    Object.entries(rules).forEach(([key, rule]) => {
      if (item[key] === undefined) return;
      
      switch (rule) {
        case 'celsius_to_fahrenheit':
          converted[key] = (item[key] as number) * 9/5 + 32;
          break;
        case 'mm_to_inch':
          converted[key] = (item[key] as number) * 0.0393701;
          break;
      }
    });
    return converted;
  });
};

const validateRules = (rules: { [key: string]: ConversionRule }): boolean => {
  return Object.values(rules).every(rule => SUPPORTED_CONVERSION_RULES.includes(rule));
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'POST':
      return handlePostRequest(req, res);
    case 'GET':
      return handleGetRequest(req, res);
    case 'DELETE':
      return handleDeleteRequest(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handlePostRequest(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { data, rules } = req.body as ConversionRequest;

    if (!data || !rules || !Array.isArray(data)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    if (!validateRules(rules)) {
      return res.status(400).json({ error: 'Invalid conversion rule' });
    }

    const { data: jobData, error: insertError } = await supabase
      .from('system_logs')
      .insert({
        log_level: 'INFO',
        message: 'データ変換ジョブ開始',
        error_details: {
          dataCount: data.length,
          rules: rules
        }
      })
      .select('id')
      .single();

    if (insertError) {
      throw insertError;
    }

    // バックグラウンドでの変換処理を開始
    convertDataInBackground(jobData.id, data, rules);

    return res.status(200).json({
      jobId: jobData.id,
      status: 'processing'
    });

  } catch (error) {
    console.error('Error in data conversion:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGetRequest(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { jobId } = req.query;

    if (!jobId) {
      return res.status(400).json({ error: 'Job ID is required' });
    }

    const { data: jobData, error } = await supabase
      .from('system_logs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error || !jobData) {
      return res.status(404).json({ error: 'Job not found' });
    }

    return res.status(200).json({
      status: jobData.log_level === 'ERROR' ? 'failed' : jobData.message.includes('完了') ? 'completed' : 'processing',
      result: jobData.error_details?.result
    });

  } catch (error) {
    console.error('Error fetching job status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleDeleteRequest(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { jobId } = req.query;

    if (!jobId) {
      return res.status(400).json({ error: 'Job ID is required' });
    }

    const { data: jobData, error } = await supabase
      .from('system_logs')
      .update({
        message: 'データ変換ジョブキャンセル',
        error_details: { status: 'cancelled' }
      })
      .eq('id', jobId)
      .select()
      .single();

    if (error) {
      return res.status(404).json({ error: 'Job not found' });
    }

    return res.status(200).json({ status: 'cancelled' });

  } catch (error) {
    console.error('Error cancelling job:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function convertDataInBackground(jobId: string, data: WeatherData[], rules: { [key: string]: ConversionRule }) {
  try {
    const convertedData = await convertData(data, rules);

    await supabase
      .from('system_logs')
      .update({
        message: 'データ変換ジョブ完了',
        error_details: {
          result: convertedData,
          completedAt: new Date().toISOString()
        }
      })
      .eq('id', jobId);

    // AI APIを使用してデータ品質の評価を行う
    const prompt = `Convert the following weather data and evaluate its quality:
    Original: ${JSON.stringify(data.slice(0, 5))}
    Converted: ${JSON.stringify(convertedData.slice(0, 5))}`;

    try {
      const evaluation = await getLlmModelAndGenerateContent('Gemini', 'You are a data quality expert.', prompt);
      
      await supabase
        .from('system_logs')
        .update({
          error_details: {
            quality_evaluation: evaluation
          }
        })
        .eq('id', jobId);
    } catch (error) {
      console.error('Error in AI evaluation:', error);
    }

  } catch (error) {
    await supabase
      .from('system_logs')
      .update({
        log_level: 'ERROR',
        message: 'データ変換ジョブ失敗',
        error_details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          failedAt: new Date().toISOString()
        }
      })
      .eq('id', jobId);
  }
}