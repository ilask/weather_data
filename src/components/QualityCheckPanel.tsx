import { useState, useEffect } from 'react';
import { BiRefresh, BiCheckCircle, BiError } from 'react-icons/bi';
import { FiAlertTriangle } from 'react-icons/fi';

interface QualityMetrics {
  completeness: number;
  accuracy: number;
  consistency: number;
  issues: QualityIssue[];
}

interface QualityIssue {
  id: string;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  status: 'open' | 'fixed';
}

interface QualityCheckPanelProps {
  qualityData: QualityMetrics | null;
  onCheck: () => void;
  onFix: (issue: QualityIssue) => void;
}

const QualityCheckPanel: React.FC<QualityCheckPanelProps> = ({
  qualityData,
  onCheck,
  onFix,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
      default:
        return '不明';
    }
  };

  const handleCheck = async () => {
    setIsLoading(true);
    await onCheck();
    setIsLoading(false);
  };

  const isQualityLow = qualityData && (
    qualityData.completeness < 80 ||
    qualityData.accuracy < 80 ||
    qualityData.consistency < 80
  );

  if (!qualityData) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="flex items-center justify-center h-40">
          <p className="text-gray-500">データ読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">データ品質メトリクス</h2>
          <button
            onClick={handleCheck}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <BiRefresh className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            品質チェック実行
          </button>
        </div>

        {isQualityLow && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center">
            <FiAlertTriangle className="mr-2" />
            品質メトリクスが基準値を下回っています
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">完全性</div>
            <div className="text-2xl font-bold">{qualityData.completeness}%</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">正確性</div>
            <div className="text-2xl font-bold">{qualityData.accuracy}%</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">一貫性</div>
            <div className="text-2xl font-bold">{qualityData.consistency}%</div>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">検出された問題</h3>
          {qualityData.issues.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BiCheckCircle className="mx-auto text-3xl mb-2 text-green-500" />
              検出された品質問題はありません
            </div>
          ) : (
            <div className="space-y-4">
              {qualityData.issues.map((issue) => (
                <div
                  key={issue.id}
                  className="p-4 border border-gray-200 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <BiError className="text-red-500" />
                      <span className="font-medium">{issue.description}</span>
                      <span
                        className={`${getSeverityColor(
                          issue.severity
                        )} text-white text-xs px-2 py-1 rounded`}
                      >
                        {getSeverityText(issue.severity)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">{issue.type}</div>
                  </div>
                  <button
                    onClick={() => onFix(issue)}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    修正
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QualityCheckPanel;