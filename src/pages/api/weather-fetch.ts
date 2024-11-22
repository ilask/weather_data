import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { getLlmModelAndGenerateContent } from '@/utils/functions';
import { supabase } from '@/supabase';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

interface WeatherData {
  area: {
    code: string;
    name?: string;
  };
  temperature?: number;
  rainfall?: number;
}

interface RequestBody {
  areaCode?: string;
  areaCodes?: string[];
  items: string[];
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const validateWeatherData = (data: WeatherData): string[] => {
  const warnings: string[] = [];
  if (data.temperature !== undefined && (data.temperature < -50 || data.temperature > 50)) {
    warnings.push('温度の値が異常です');
  }
  if (data.rainfall !== undefined && data.rainfall < 0) {
    warnings.push('降水量の値が異常です');
  }
  return warnings;
};

const fetchWeatherData = async (areaCode: string, retryCount = 0): Promise<WeatherData> => {
  try {
    const response = await axios.get(`https://api.weather.example.com/v1/${areaCode}`);
    return response.data;
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      await sleep(RETRY_DELAY);
      return fetchWeatherData(areaCode, retryCount + 1);
    }
    throw error;
  }
};

const logSystemMessage = async (level: string, message: string, error?: any) => {
  try {
    await supabase.from('system_logs').insert({
      log_level: level,
      message,
      error_details: error ? JSON.stringify(error) : null,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('ログの記録に失敗しました:', error);
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { areaCode, areaCodes, items } = req.body as RequestBody;

  if ((!areaCode && !areaCodes) || !items || !items.length) {
    return res.status(400).json({ error: '必須パラメータが不足しています' });
  }

  try {
    const targetAreaCodes = areaCodes || [areaCode];
    const weatherDataResults: WeatherData[] = [];
    const warnings: string[] = [];

    for (const code of targetAreaCodes) {
      const weatherData = await fetchWeatherData(code);
      const dataWarnings = validateWeatherData(weatherData);
      if (dataWarnings.length > 0) {
        warnings.push(...dataWarnings);
      }
      weatherDataResults.push(weatherData);
    }

    const { error: insertError } = await supabase
      .from('weather_data')
      .insert(
        weatherDataResults.map(data => ({
          area_code: data.area.code,
          weather_data: data,
          created_at: new Date().toISOString()
        }))
      );

    if (insertError) {
      throw new Error(`データの保存に失敗しました: ${insertError.message}`);
    }

    await logSystemMessage(
      'INFO',
      `気象データ取得成功: ${targetAreaCodes.length}件のデータを処理しました`,
      { weatherDataCount: targetAreaCodes.length }
    );

    const response: any = {
      success: true,
      data: weatherDataResults
    };

    if (warnings.length > 0) {
      response.warnings = warnings;
    }

    return res.status(200).json(response);

  } catch (error) {
    const errorMessage = `データ取得に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`;
    
    await logSystemMessage(
      'ERROR',
      errorMessage,
      error
    );

    return res.status(500).json({ error: errorMessage });
  }
}