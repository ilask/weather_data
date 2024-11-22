import { useState, useEffect } from 'react';
import { FiPlus, FiX, FiSave, FiRefreshCw } from 'react-icons/fi';
import { supabase } from '@/supabase';

type ConfigData = {
  dataFetchInterval: number;
  maxRetryCount: number;
  locations: string[];
  dataTypes: string[];
  alertThreshold: {
    temperature: number;
    humidity: number;
  };
  saveHistoryDays: number;
};

type Props = {
  config: ConfigData;
  onSave: (config: ConfigData) => void;
};

const ConfigForm = ({ config, onSave }: Props) => {
  const [formData, setFormData] = useState<ConfigData>(config);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [newLocation, setNewLocation] = useState('');
  const [locationError, setLocationError] = useState('');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.dataFetchInterval < 1) {
      newErrors.dataFetchInterval = 'データ取得間隔は1以上の値を入力してください';
    }

    if (formData.maxRetryCount < 1) {
      newErrors.maxRetryCount = 'リトライ回数は1以上の値を入力してください';
    }

    if (formData.locations.length === 0) {
      newErrors.locations = '少なくとも1つの地域を選択してください';
    }

    if (formData.dataTypes.length === 0) {
      newErrors.dataTypes = '少なくとも1つのデータ種別を選択してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleThresholdChange = (field: 'temperature' | 'humidity', value: number) => {
    setFormData(prev => ({
      ...prev,
      alertThreshold: {
        ...prev.alertThreshold,
        [field]: value
      }
    }));
  };

  const validateLocation = async (location: string) => {
    // 実際の実装ではAPI呼び出しなどで地域コードの検証を行う
    if (location === '無効な地域') {
      setLocationError('無効な地域コードです');
      return false;
    }
    return true;
  };

  const handleAddLocation = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newLocation) {
      const isValid = await validateLocation(newLocation);
      if (isValid) {
        setFormData(prev => ({
          ...prev,
          locations: [...prev.locations, newLocation]
        }));
        setNewLocation('');
        setLocationError('');
      }
    }
  };

  const handleRemoveLocation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSaving(true);
      try {
        await onSave(formData);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleReset = () => {
    setFormData(config);
    setErrors({});
  };

  const availableDataTypes = ['気温', '湿度', '降水量', '風速'];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white rounded-lg shadow">
      <div className="space-y-4">
        <div>
          <label htmlFor="dataFetchInterval" className="block text-sm font-medium text-gray-700">
            データ取得間隔（分）
          </label>
          <input
            type="number"
            id="dataFetchInterval"
            value={formData.dataFetchInterval}
            onChange={(e) => handleInputChange('dataFetchInterval', parseInt(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
          {errors.dataFetchInterval && (
            <p className="text-red-500 text-sm mt-1">{errors.dataFetchInterval}</p>
          )}
        </div>

        <div>
          <label htmlFor="maxRetryCount" className="block text-sm font-medium text-gray-700">
            最大リトライ回数
          </label>
          <input
            type="number"
            id="maxRetryCount"
            value={formData.maxRetryCount}
            onChange={(e) => handleInputChange('maxRetryCount', parseInt(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">地域設定</label>
          <div className="mt-1 flex items-center">
            <input
              type="text"
              placeholder="新しい地域を入力"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              onKeyPress={handleAddLocation}
              className="block w-full rounded-md border-gray-300 shadow-sm"
            />
            <button
              type="button"
              onClick={() => setNewLocation('')}
              className="ml-2 p-2 text-gray-400 hover:text-gray-500"
            >
              <FiPlus />
            </button>
          </div>
          {locationError && <p className="text-red-500 text-sm mt-1">{locationError}</p>}
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.locations.map((location, index) => (
              <div
                key={index}
                className="flex items-center bg-gray-100 rounded-full px-3 py-1"
              >
                <span className="text-sm">{location}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveLocation(index)}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="dataTypes" className="block text-sm font-medium text-gray-700">
            データ種別選択
          </label>
          <select
            id="dataTypes"
            multiple
            value={formData.dataTypes}
            onChange={(e) => handleInputChange('dataTypes', Array.from(e.target.selectedOptions, option => option.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          >
            {availableDataTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="temperatureThreshold" className="block text-sm font-medium text-gray-700">
            気温アラートしきい値
          </label>
          <input
            type="number"
            id="temperatureThreshold"
            value={formData.alertThreshold.temperature}
            onChange={(e) => handleThresholdChange('temperature', parseInt(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>

        <div>
          <label htmlFor="humidityThreshold" className="block text-sm font-medium text-gray-700">
            湿度アラートしきい値
          </label>
          <input
            type="number"
            id="humidityThreshold"
            value={formData.alertThreshold.humidity}
            onChange={(e) => handleThresholdChange('humidity', parseInt(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>

        <div>
          <label htmlFor="saveHistoryDays" className="block text-sm font-medium text-gray-700">
            保存期間（日）
          </label>
          <input
            type="number"
            id="saveHistoryDays"
            value={formData.saveHistoryDays}
            onChange={(e) => handleInputChange('saveHistoryDays', parseInt(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
        >
          リセット
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? '保存中...' : '設定を保存'}
        </button>
      </div>
    </form>
  );
};

export default ConfigForm;