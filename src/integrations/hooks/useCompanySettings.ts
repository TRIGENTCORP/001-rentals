import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CompanySetting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_type: 'text' | 'number' | 'boolean' | 'json';
  description: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompanySettings {
  company_name: string;
  company_email: string;
  company_phone: string;
  company_address: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_name: string;
  bank_code: string;
  payment_instructions: string;
  default_rental_duration_hours: number;
  late_return_fee_per_hour: number;
  max_rental_duration_days: number;
  maintenance_mode: boolean;
  maintenance_message: string;
}

export const useCompanySettings = () => {
  const [settings, setSettings] = useState<CompanySetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .order('setting_key', { ascending: true });

      if (error) throw error;

      setSettings(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch company settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (settingKey: string, value: string) => {
    try {
      const { error } = await supabase
        .from('company_settings')
        .update({ 
          setting_value: value,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', settingKey);

      if (error) throw error;

      // Update local state
      setSettings(prev => prev.map(setting => 
        setting.setting_key === settingKey 
          ? { ...setting, setting_value: value, updated_at: new Date().toISOString() }
          : setting
      ));

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update setting');
      return false;
    }
  };

  const getSettingValue = (key: string, defaultValue: string = ''): string => {
    const setting = settings.find(s => s.setting_key === key);
    return setting?.setting_value || defaultValue;
  };

  const getPublicSettings = (): Partial<CompanySettings> => {
    const publicSettings = settings.filter(s => s.is_public);
    const result: any = {};
    
    publicSettings.forEach(setting => {
      let value: any = setting.setting_value;
      
      // Convert based on type
      switch (setting.setting_type) {
        case 'number':
          value = parseFloat(value) || 0;
          break;
        case 'boolean':
          value = value === 'true';
          break;
        case 'json':
          try {
            value = JSON.parse(value);
          } catch {
            value = setting.setting_value;
          }
          break;
        default:
          value = setting.setting_value;
      }
      
      result[setting.setting_key] = value;
    });
    
    return result;
  };

  const getAllSettings = (): CompanySettings => {
    const result: any = {};
    
    settings.forEach(setting => {
      let value: any = setting.setting_value;
      
      // Convert based on type
      switch (setting.setting_type) {
        case 'number':
          value = parseFloat(value) || 0;
          break;
        case 'boolean':
          value = value === 'true';
          break;
        case 'json':
          try {
            value = JSON.parse(value);
          } catch {
            value = setting.setting_value;
          }
          break;
        default:
          value = setting.setting_value;
      }
      
      result[setting.setting_key] = value;
    });
    
    return result as CompanySettings;
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    error,
    updateSetting,
    getSettingValue,
    getPublicSettings,
    getAllSettings,
    refetch: fetchSettings
  };
};
