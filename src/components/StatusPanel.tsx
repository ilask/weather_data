import React, { useState, useEffect } from 'react';
import { BiServer, BiMemoryCard, BiHdd, BiWifi } from 'react-icons/bi';
import { AiOutlineCheckCircle, AiOutlineWarning, AiOutlineClockCircle } from 'react-icons/ai';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: {
    incoming: number;
    outgoing: number;
  };
  uptime: string;
  lastUpdate: string;
}

interface SystemStatus {
  overall: string;
  components: {
    dataFetcher: string;
    database: string;
    apiServer: string;
    taskScheduler: string;
  };
  alerts: {
    id: string;
    severity: string;
    message: string;
    timestamp: string;
  }[];
}

interface StatusPanelProps {
  metrics: SystemMetrics;
  status: SystemStatus;
}

const StatusPanel: React.FC<StatusPanelProps> = ({ metrics, status }) => {
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'yyyy/MM/dd HH:mm:ss', { locale: ja });
  };

  const getStatusColor = (value: number) => {
    if (value >= 90) return 'critical bg-red-100 text-red-700';
    if (value >= 70) return 'warning bg-yellow-100 text-yellow-700';
    return 'normal bg-green-100 text-green-700';
  };

  const getComponentStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'warning':
        return 'warning bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <AiOutlineCheckCircle className="healthy w-6 h-6 text-green-500" />;
      case 'warning':
        return <AiOutlineWarning className="w-6 h-6 text-yellow-500" />;
      default:
        return <AiOutlineWarning className="w-6 h-6 text-red-500" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">システムステータス</h2>
        <div className="flex items-center" data-testid="overall-status-icon">
          {getStatusIcon(status.overall)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className={`p-4 rounded-lg ${getStatusColor(metrics.cpu)}`} data-testid="cpu-metric">
          <div className="flex items-center">
            <BiServer className="w-6 h-6 mr-2" />
            <span className="font-semibold">CPU</span>
          </div>
          <div className="text-2xl font-bold mt-2">{metrics.cpu}%</div>
        </div>

        <div className={`p-4 rounded-lg ${getStatusColor(metrics.memory)}`} data-testid="memory-metric">
          <div className="flex items-center">
            <BiMemoryCard className="w-6 h-6 mr-2" />
            <span className="font-semibold">メモリ</span>
          </div>
          <div className="text-2xl font-bold mt-2">{metrics.memory}%</div>
        </div>

        <div className={`p-4 rounded-lg ${getStatusColor(metrics.disk)}`}>
          <div className="flex items-center">
            <BiHdd className="w-6 h-6 mr-2" />
            <span className="font-semibold">ディスク</span>
          </div>
          <div className="text-2xl font-bold mt-2">{metrics.disk}%</div>
        </div>

        <div className="p-4 rounded-lg bg-blue-100 text-blue-700">
          <div className="flex items-center">
            <BiWifi className="w-6 h-6 mr-2" />
            <span className="font-semibold">ネットワーク</span>
          </div>
          <div className="mt-2">
            <div>↓ {metrics.network.incoming} KB/s</div>
            <div>↑ {metrics.network.outgoing} KB/s</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">コンポーネントステータス</h3>
          <div data-testid="component-status-list" className="space-y-2">
            {Object.entries(status.components).map(([key, value]) => (
              <div key={key} className={`p-2 rounded ${getComponentStatusColor(value)}`}>
                {key === 'dataFetcher' && 'データフェッチャー: '}
                {key === 'database' && 'データベース: '}
                {key === 'apiServer' && 'APIサーバー: '}
                {key === 'taskScheduler' && 'タスクスケジューラー: '}
                {value === 'active' ? '稼働中' : '警告'}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold mb-2">システム情報</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <AiOutlineClockCircle className="mr-2" />
                <span>稼働時間: {metrics.uptime}</span>
              </div>
              <div>最終更新: {formatDate(metrics.lastUpdate)}</div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">アラート</h3>
            <div data-testid="alert-list" className="space-y-2">
              {status.alerts.map(alert => (
                <div key={alert.id} className={`p-2 rounded ${alert.severity === 'warning' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                  {alert.message}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusPanel;