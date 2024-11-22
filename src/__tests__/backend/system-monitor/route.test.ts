import { createMocks } from 'node-mocks-http';
import { NextApiRequest } from 'next';
import systemMonitor from '@/pages/api/system-monitor';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

jest.mock('@supabase/supabase-js');
jest.mock('nodemailer');

describe('システム異常検知処理 API', () => {
  const mockSupabaseClient = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
  };

  const mockTransporter = {
    sendMail: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);
  });

  const mockSystemMetrics = {
    cpu: 85,
    memory: 90,
    disk: 95,
    network: {
      incoming: 1000,
      outgoing: 800
    }
  };

  const mockAnomalyRules = {
    cpu: 80,
    memory: 85,
    disk: 90,
    network: {
      incoming: 900,
      outgoing: 700
    }
  };

  test('正常なシステムメトリクスの場合、200を返すこと', async () => {
    const normalMetrics = {
      cpu: 50,
      memory: 60,
      disk: 70,
      network: {
        incoming: 500,
        outgoing: 400
      }
    };

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        metrics: normalMetrics
      }
    });

    await systemMonitor(req as NextApiRequest, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      status: 'normal',
      message: 'システムは正常に動作しています'
    });
  });

  test('異常なシステムメトリクスの場合、警告を送信すること', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        metrics: mockSystemMetrics
      }
    });

    await systemMonitor(req as NextApiRequest, res);

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('system_logs');
    expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
      log_level: 'warning',
      message: expect.any(String),
      error_details: expect.any(Object)
    });
    expect(mockTransporter.sendMail).toHaveBeenCalled();
    expect(res._getStatusCode()).toBe(200);
  });

  test('複数の異常が検出された場合、重要度の高い警告を優先すること', async () => {
    const criticalMetrics = {
      cpu: 95,
      memory: 95,
      disk: 98,
      network: {
        incoming: 2000,
        outgoing: 1500
      }
    };

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        metrics: criticalMetrics
      }
    });

    await systemMonitor(req as NextApiRequest, res);

    expect(JSON.parse(res._getData())).toEqual({
      status: 'critical',
      message: expect.any(String),
      alerts: expect.any(Array)
    });
  });

  test('無効なメトリクスデータの場合、400エラーを返すこと', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        metrics: {
          cpu: 'invalid'
        }
      }
    });

    await systemMonitor(req as NextApiRequest, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Invalid metrics data'
    });
  });

  test('DBエラー時に500エラーを返すこと', async () => {
    mockSupabaseClient.insert.mockRejectedValueOnce(new Error('DB Error'));

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        metrics: mockSystemMetrics
      }
    });

    await systemMonitor(req as NextApiRequest, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Internal server error'
    });
  });

  test('通知送信エラー時にもログを記録すること', async () => {
    mockTransporter.sendMail.mockRejectedValueOnce(new Error('Mail Error'));

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        metrics: mockSystemMetrics
      }
    });

    await systemMonitor(req as NextApiRequest, res);

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('system_logs');
    expect(mockSupabaseClient.insert).toHaveBeenCalledTimes(2);
    expect(res._getStatusCode()).toBe(200);
  });

  test('GETメソッドの場合、405エラーを返すこと', async () => {
    const { req, res } = createMocks({
      method: 'GET'
    });

    await systemMonitor(req as NextApiRequest, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Method not allowed'
    });
  });

  test('異常判定ルールのカスタマイズが反映されること', async () => {
    const customRules = {
      cpu: 70,
      memory: 75,
      disk: 80,
      network: {
        incoming: 800,
        outgoing: 600
      }
    };

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        metrics: mockSystemMetrics,
        rules: customRules
      }
    });

    await systemMonitor(req as NextApiRequest, res);

    expect(JSON.parse(res._getData())).toEqual({
      status: 'warning',
      message: expect.any(String),
      alerts: expect.arrayContaining([
        expect.objectContaining({
          type: 'cpu',
          severity: 'warning'
        })
      ])
    });
  });

  test('履歴データと比較して急激な変化を検出すること', async () => {
    mockSupabaseClient.select.mockResolvedValueOnce({
      data: [{
        metrics: {
          cpu: 40,
          memory: 45,
          disk: 50,
          network: {
            incoming: 300,
            outgoing: 250
          }
        }
      }]
    });

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        metrics: mockSystemMetrics
      }
    });

    await systemMonitor(req as NextApiRequest, res);

    expect(JSON.parse(res._getData())).toEqual({
      status: 'warning',
      message: expect.any(String),
      alerts: expect.arrayContaining([
        expect.objectContaining({
          type: 'rapid_change',
          severity: 'warning'
        })
      ])
    });
  });

  test('空のメトリクスデータの場合、400エラーを返すこと', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        metrics: {}
      }
    });

    await systemMonitor(req as NextApiRequest, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Metrics data is required'
    });
  });
});