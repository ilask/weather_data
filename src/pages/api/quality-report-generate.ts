import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/supabase';
import { getLlmModelAndGenerateContent } from '@/utils/functions';
import axios from 'axios';

type WeatherData = {
  id: string;
  area_code: string;
  weather_data: {
    temperature: number;
    humidity: number;
    precipitation: number;
  };
  created_at: string;
};

type QualityReport = {
  metrics: {
    completeness: number;
    accuracy: number;
    consistency: number;
  };
  issues: Array<{
    id: string;
    type: string;
    description: string;
    field?: string;
    value?: any;
  }>;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { startDate = new Date().toISOString().split('T')[0], endDate = new Date().toISOString().split('T')[0] } = req.body;

    // データの抽出
    const { data: weatherData, error: fetchError } = await supabase
      .from('weather_data')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (fetchError) {
      throw new Error('データの抽出に失敗しました');
    }

    if (!weatherData) {
      return res.status(404).json({ error: '対象データが見つかりませんでした' });
    }

    // 品質メトリクスの計算
    const metrics = calculateQualityMetrics(weatherData);

    // 異常値・欠損値の検出
    const issues = detectIssues(weatherData);

    const report = {
      report_date: new Date().toISOString(),
      quality_metrics: metrics,
      issues_found: issues
    };

    // レポートの保存
    const { data: savedReport, error: saveError } = await supabase
      .from('data_quality_reports')
      .insert([report]);

    if (saveError) {
      throw new Error('レポートの保存に失敗しました');
    }

    // 重大な問題が検出された場合は通知を送信
    if (issues.some(issue => issue.type === 'critical')) {
      await sendNotification(issues);
    }

    return res.status(200).json({
      reportId: savedReport?.[0]?.id,
      metrics,
      issues,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    if (error.message === '認証エラー') {
      return res.status(401).json({ error: '認証に失敗しました' });
    }
    return res.status(500).json({ error: error.message });
  }
}

function calculateQualityMetrics(data: WeatherData[]): QualityReport['metrics'] {
  const totalFields = data.length * 3; // temperature, humidity, precipitation
  let validFields = 0;
  let accurateFields = 0;
  let consistentFields = 0;

  data.forEach(record => {
    const { temperature, humidity, precipitation } = record.weather_data;

    // Completeness check
    if (temperature !== null) validFields++;
    if (humidity !== null) validFields++;
    if (precipitation !== null) validFields++;

    // Accuracy check
    if (isValidTemperature(temperature)) accurateFields++;
    if (isValidHumidity(humidity)) accurateFields++;
    if (isValidPrecipitation(precipitation)) accurateFields++;

    // Consistency check
    if (isConsistentWeatherData(record.weather_data)) {
      consistentFields += 3;
    }
  });

  return {
    completeness: validFields / totalFields,
    accuracy: accurateFields / totalFields,
    consistency: consistentFields / totalFields
  };
}

function detectIssues(data: WeatherData[]): QualityReport['issues'] {
  const issues: QualityReport['issues'] = [];

  data.forEach(record => {
    const { temperature, humidity, precipitation } = record.weather_data;

    // Missing values check
    if (temperature === null) {
      issues.push({
        id: `${record.id}-temp`,
        type: 'missing_value',
        description: '気温データが欠損しています',
        field: 'temperature'
      });
    }

    // Anomaly check
    if (temperature !== null && !isValidTemperature(temperature)) {
      issues.push({
        id: `${record.id}-temp-anomaly`,
        type: 'anomaly',
        description: '異常な気温値が検出されました',
        field: 'temperature',
        value: temperature
      });
    }

    // Similar checks for humidity and precipitation
    if (humidity !== null && !isValidHumidity(humidity)) {
      issues.push({
        id: `${record.id}-humidity-anomaly`,
        type: 'anomaly',
        description: '異常な湿度値が検出されました',
        field: 'humidity',
        value: humidity
      });
    }

    if (precipitation !== null && !isValidPrecipitation(precipitation)) {
      issues.push({
        id: `${record.id}-precip-anomaly`,
        type: 'critical',
        description: '異常な降水量値が検出されました',
        field: 'precipitation',
        value: precipitation
      });
    }
  });

  return issues;
}

function isValidTemperature(temp: number): boolean {
  return temp >= -50 && temp <= 50;
}

function isValidHumidity(humidity: number): boolean {
  return humidity >= 0 && humidity <= 100;
}

function isValidPrecipitation(precipitation: number): boolean {
  return precipitation >= 0 && precipitation <= 1000;
}

function isConsistentWeatherData(weatherData: WeatherData['weather_data']): boolean {
  const { temperature, humidity, precipitation } = weatherData;
  
  // 基本的な整合性チェック
  if (temperature > 0 && precipitation > 0 && humidity < 30) {
    return false;
  }
  
  return true;
}

async function sendNotification(issues: QualityReport['issues']) {
  try {
    const criticalIssues = issues.filter(issue => issue.type === 'critical');
    const message = `重大な品質問題が検出されました:
${criticalIssues.map(issue => issue.description).join('
')}`;
    
    // 通知の送信（サンプル実装）
    await getLlmModelAndGenerateContent('Gemini', 
      'You are a weather data quality notification system',
      `Notify administrators about the following issues: ${message}`
    );
  } catch (error) {
    console.error('通知の送信に失敗しました:', error);
  }
}