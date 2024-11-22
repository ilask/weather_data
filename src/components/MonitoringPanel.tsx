import React, { useState } from 'react';
import { BiRefresh, BiChevronDown, BiChevronUp } from 'react-icons/bi';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

type ErrorDetails = {
  code: number;
  endpoint: string;
};

type ErrorLog = {
  id: string;
  timestamp: string;
  message: string;
  severity: 'error' | 'critical' | 'warning';
  details: ErrorDetails;
};

type MonitoringStatus = {
  isRunning: boolean;
  lastUpdated: string;
  progress: number;
  currentTask: string;
};

type MonitoringPanelProps = {
  status: MonitoringStatus;
  errors: ErrorLog[];
  onRetry: () => void;
};

const MonitoringPanel: React.FC<MonitoringPanelProps> = ({ status, errors, onRetry }) => {
  const [expandedErrors, setExpandedErrors] = useState<string[]>([]);

  const toggleErrorDetails = (errorId: string) => {
    setExpandedErrors(prev =>
      prev.includes(errorId)
        ? prev.filter(id => id !== errorId)
        : [...prev, errorId]
    );
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'yyyy/MM/dd HH:mm:ss', { locale: ja });
  };

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 border-red-500 error-critical';
      case 'error':
        return 'bg-orange-100 border-orange-500';
      default:
        return 'bg-yellow-100 border-yellow-500';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">モニタリングパネル</h2>

      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-700">実行状態：{status.isRunning ? '稼働中' : '停止中'}</p>
            <p className="text-gray-700">最終更新：{formatDate(status.lastUpdated)}</p>
          </div>
          <button
            onClick={onRetry}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            <BiRefresh className="mr-2" />
            リトライ
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-gray-700">{status.currentTask}</p>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block text-blue-600">
                  進捗状況
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-blue-600">
                  {status.progress}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
              <div
                role="progressbar"
                style={{ width: `${status.progress}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                aria-valuenow={status.progress}
                aria-valuemin={0}
                aria-valuemax={100}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">エラーログ</h3>
        {errors.length === 0 ? (
          <p className="text-gray-500">エラーは発生していません</p>
        ) : (
          <div className="space-y-3">
            {errors.map(error => (
              <div
                key={error.id}
                data-testid={`error-item-${error.id}`}
                className={`border-l-4 p-4 rounded ${getSeverityClass(error.severity)}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{error.message}</p>
                    <p className="text-sm text-gray-600">{formatDate(error.timestamp)}</p>
                  </div>
                  <button
                    onClick={() => toggleErrorDetails(error.id)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    {expandedErrors.includes(error.id) ? (
                      <>
                        <span className="text-sm mr-1">詳細を隠す</span>
                        <BiChevronUp />
                      </>
                    ) : (
                      <>
                        <span className="text-sm mr-1">詳細を表示</span>
                        <BiChevronDown />
                      </>
                    )}
                  </button>
                </div>
                {expandedErrors.includes(error.id) && (
                  <div className="mt-3 text-sm text-gray-600">
                    <p>エラーコード: {error.details.code}</p>
                    <p>エンドポイント: {error.details.endpoint}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MonitoringPanel;