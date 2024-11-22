import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getLlmModelAndGenerateContent } from '@/utils/functions';
import axios from 'axios';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

interface Task {
  id: string;
  name: string;
  schedule: string;
  status: 'active' | 'inactive';
  lastRun: string;
  nextRun: string;
  handler: string;
}

interface TaskExecutionResult {
  success: boolean;
  message?: string;
  error?: string;
}

const MAX_EXECUTION_TIME = 5000;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getPendingTasks(req, res);
      case 'POST':
        return await executeTasks(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('タスク実行エラー:', error);
    return res.status(500).json({ error: 'タスク実行中にエラーが発生しました' });
  }
}

async function getPendingTasks(req: NextApiRequest, res: NextApiResponse) {
  const { data: tasks, error } = await supabase
    .from('system_logs')
    .select('*')
    .eq('status', 'active')
    .lte('nextRun', new Date().toISOString());

  if (error) {
    return res.status(500).json({ error: 'データベースへの接続に失敗しました' });
  }

  return res.status(200).json({ tasks });
}

async function executeTasks(req: NextApiRequest, res: NextApiResponse) {
  const { taskId, taskIds, notify } = req.body;
  const targetTaskIds = taskIds || [taskId];

  if (!targetTaskIds?.length) {
    return res.status(400).json({ error: 'タスクIDが指定されていません' });
  }

  const { data: tasks, error: fetchError } = await supabase
    .from('system_logs')
    .select('*')
    .in('id', targetTaskIds);

  if (fetchError) {
    return res.status(500).json({ error: 'データベースへの接続に失敗しました' });
  }

  if (!tasks?.length) {
    return res.status(404).json({ error: 'タスクが見つかりません' });
  }

  const results: TaskExecutionResult[] = [];
  const executionTimeout = setTimeout(() => {
    return res.status(500).json({ error: 'タスクの実行がタイムアウトしました' });
  }, MAX_EXECUTION_TIME);

  for (const task of tasks) {
    if (task.status === 'inactive') {
      results.push({ success: true, message: 'タスクはスキップされました' });
      continue;
    }

    try {
      const result = await executeTask(task);
      results.push(result);

      if (notify && result.success) {
        await sendNotification(task, result);
      }
    } catch (error) {
      results.push({
        success: false,
        error: error instanceof Error ? error.message : '不明なエラーが発生しました'
      });
    }
  }

  clearTimeout(executionTimeout);

  const { error: updateError } = await supabase
    .from('system_logs')
    .insert(
      results.map((result, index) => ({
        log_level: result.success ? 'INFO' : 'ERROR',
        message: result.message || result.error || '実行完了',
        error_details: result.error ? { error: result.error } : null,
        created_at: new Date().toISOString()
      }))
    );

  if (updateError) {
    return res.status(500).json({ error: 'ログの記録に失敗しました' });
  }

  return res.status(200).json({ results });
}

async function executeTask(task: Task): Promise<TaskExecutionResult> {
  try {
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('system_logs')
      .update({
        lastRun: now,
        nextRun: calculateNextRun(task.schedule)
      })
      .eq('id', task.id);

    if (updateError) {
      throw new Error('タスク状態の更新に失敗しました');
    }

    return { success: true, message: 'タスクが正常に実行されました' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '不明なエラーが発生しました'
    };
  }
}

async function sendNotification(task: Task, result: TaskExecutionResult) {
  try {
    const notificationEndpoint = process.env.NOTIFICATION_ENDPOINT;
    if (!notificationEndpoint) {
      throw new Error('通知エンドポイントが設定されていません');
    }

    await axios.post(notificationEndpoint, {
      taskId: task.id,
      taskName: task.name,
      result: result
    });
  } catch (error) {
    console.error('通知送信エラー:', error);
  }
}

function calculateNextRun(schedule: string): string {
  const [minute, hour, dayOfMonth, month, dayOfWeek] = schedule.split(' ');
  const now = new Date();
  const next = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return next.toISOString();
}