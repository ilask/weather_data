import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';
import { supabase } from '@/supabase';
import { getLlmModelAndGenerateContent } from '@/utils/functions';

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: {
    incoming: number;
    outgoing: number;
  };
}

interface AnomalyRules {
  cpu: number;
  memory: number;
  disk: number;
  network: {
    incoming: number;
    outgoing: number;
  };
}

interface Alert {
  type: string;
  severity: 'warning' | 'error' | 'critical';
  message: string;
}

const defaultAnomalyRules: AnomalyRules = {
  cpu: 80,
  memory: 85,
  disk: 90,
  network: {
    incoming: 900,
    outgoing: 700
  }
};

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const validateMetrics = (metrics: any): metrics is SystemMetrics => {
  return (
    typeof metrics === 'object' &&
    typeof metrics.cpu === 'number' &&
    typeof metrics.memory === 'number' &&
    typeof metrics.disk === 'number' &&
    typeof metrics.network === 'object' &&
    typeof metrics.network.incoming === 'number' &&
    typeof metrics.network.outgoing === 'number'
  );
};

const detectAnomalies = (
  metrics: SystemMetrics,
  rules: AnomalyRules = defaultAnomalyRules
): Alert[] => {
  const alerts: Alert[] = [];

  if (metrics.cpu > rules.cpu) {
    alerts.push({
      type: 'cpu',
      severity: metrics.cpu > 90 ? 'critical' : 'warning',
      message: `CPU使用率が${metrics.cpu}%で閾値を超えています`,
    });
  }

  if (metrics.memory > rules.memory) {
    alerts.push({
      type: 'memory',
      severity: metrics.memory > 90 ? 'critical' : 'warning',
      message: `メモリ使用率が${metrics.memory}%で閾値を超えています`,
    });
  }

  if (metrics.disk > rules.disk) {
    alerts.push({
      type: 'disk',
      severity: metrics.disk > 95 ? 'critical' : 'warning',
      message: `ディスク使用率が${metrics.disk}%で閾値を超えています`,
    });
  }

  if (metrics.network.incoming > rules.network.incoming) {
    alerts.push({
      type: 'network_incoming',
      severity: 'warning',
      message: `ネットワーク受信量が閾値を超えています`,
    });
  }

  if (metrics.network.outgoing > rules.network.outgoing) {
    alerts.push({
      type: 'network_outgoing',
      severity: 'warning',
      message: `ネットワーク送信量が閾値を超えています`,
    });
  }

  return alerts;
};

const sendNotification = async (alerts: Alert[]) => {
  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
  
  if (criticalAlerts.length > 0) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: process.env.ADMIN_EMAIL,
        subject: '【緊急】システム異常を検知しました',
        text: criticalAlerts.map(alert => alert.message).join('
'),
      });
    } catch (error) {
      await supabase.from('system_logs').insert({
        log_level: 'error',
        message: '通知メール送信に失敗しました',
        error_details: { error: error instanceof Error ? error.message : '不明なエラー' }
      });
    }
  }
};

const logAnomalies = async (alerts: Alert[], metrics: SystemMetrics) => {
  try {
    await supabase.from('system_logs').insert({
      log_level: alerts.some(alert => alert.severity === 'critical') ? 'error' : 'warning',
      message: '異常を検知しました',
      error_details: {
        alerts,
        metrics
      }
    });
  } catch (error) {
    console.error('ログの記録に失敗しました:', error);
    throw error;
  }
};

const checkRapidChange = async (currentMetrics: SystemMetrics): Promise<Alert[]> => {
  const alerts: Alert[] = [];
  
  try {
    const { data: lastMetrics } = await supabase
      .from('system_logs')
      .select('error_details')
      .order('created_at', { ascending: false })
      .limit(1);

    if (lastMetrics && lastMetrics[0]?.error_details?.metrics) {
      const previous = lastMetrics[0].error_details.metrics as SystemMetrics;
      
      if (currentMetrics.cpu - previous.cpu > 30) {
        alerts.push({
          type: 'rapid_change',
          severity: 'warning',
          message: 'CPU使用率が急激に上昇しています'
        });
      }
    }
  } catch (error) {
    console.error('履歴データの取得に失敗しました:', error);
  }

  return alerts;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { metrics, rules } = req.body;

    if (!metrics || Object.keys(metrics).length === 0) {
      return res.status(400).json({ error: 'Metrics data is required' });
    }

    if (!validateMetrics(metrics)) {
      return res.status(400).json({ error: 'Invalid metrics data' });
    }

    const anomalyRules = rules || defaultAnomalyRules;
    const alerts = [...detectAnomalies(metrics, anomalyRules)];
    
    const rapidChangeAlerts = await checkRapidChange(metrics);
    alerts.push(...rapidChangeAlerts);

    if (alerts.length > 0) {
      await logAnomalies(alerts, metrics);
      await sendNotification(alerts);

      return res.status(200).json({
        status: alerts.some(alert => alert.severity === 'critical') ? 'critical' : 'warning',
        message: '異常を検知しました',
        alerts
      });
    }

    return res.status(200).json({
      status: 'normal',
      message: 'システムは正常に動作しています'
    });

  } catch (error) {
    console.error('システム監視処理でエラーが発生しました:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}