import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCompanySettings, CompanySetting } from '@/hooks/useCompanySettings';
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  Clock, 
  AlertTriangle,
  Save,
  RefreshCw,
  Settings
} from 'lucide-react';

const CompanySettings: React.FC = () => {
  const { toast } = useToast();
  const { settings, loading, error, updateSetting, refetch } = useCompanySettings();
  const [editingSettings, setEditingSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const handleSettingChange = (key: string, value: string) => {
    setEditingSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSetting = async (setting: CompanySetting) => {
    const newValue = editingSettings[setting.setting_key] ?? setting.setting_value;
    
    setSaving(prev => ({ ...prev, [setting.setting_key]: true }));
    
    const success = await updateSetting(setting.setting_key, newValue);
    
    setSaving(prev => ({ ...prev, [setting.setting_key]: false }));
    
    if (success) {
      toast({
        title: "Success",
        description: `${setting.description} updated successfully`,
      });
      setEditingSettings(prev => {
        const updated = { ...prev };
        delete updated[setting.setting_key];
        return updated;
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update setting",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = async () => {
    await refetch();
    toast({
      title: "Refreshed",
      description: "Company settings refreshed successfully",
    });
  };

  const renderSettingInput = (setting: CompanySetting) => {
    const currentValue = editingSettings[setting.setting_key] ?? setting.setting_value;
    const isEditing = editingSettings[setting.setting_key] !== undefined;
    const isSaving = saving[setting.setting_key];

    switch (setting.setting_type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={currentValue === 'true'}
              onCheckedChange={(checked) => handleSettingChange(setting.setting_key, checked.toString())}
            />
            <span className="text-sm text-muted-foreground">
              {currentValue === 'true' ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        );
      case 'number':
        return (
          <Input
            type="number"
            value={currentValue}
            onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
            className="max-w-xs"
          />
        );
      case 'json':
        return (
          <Textarea
            value={currentValue}
            onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
            rows={3}
            placeholder="Enter JSON data"
          />
        );
      default:
        return setting.setting_key.includes('instructions') || setting.setting_key.includes('message') ? (
          <Textarea
            value={currentValue}
            onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
            rows={3}
          />
        ) : (
          <Input
            type="text"
            value={currentValue}
            onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
            className="max-w-xs"
          />
        );
    }
  };

  const getSettingIcon = (key: string) => {
    if (key.includes('company_name') || key.includes('company_')) return <Building2 className="w-4 h-4" />;
    if (key.includes('email')) return <Mail className="w-4 h-4" />;
    if (key.includes('phone')) return <Phone className="w-4 h-4" />;
    if (key.includes('address')) return <MapPin className="w-4 h-4" />;
    if (key.includes('bank') || key.includes('payment')) return <CreditCard className="w-4 h-4" />;
    if (key.includes('duration') || key.includes('time')) return <Clock className="w-4 h-4" />;
    if (key.includes('maintenance')) return <AlertTriangle className="w-4 h-4" />;
    return <Settings className="w-4 h-4" />;
  };

  const groupSettings = (settings: CompanySetting[]) => {
    const groups = {
      'Company Information': settings.filter(s => s.setting_key.startsWith('company_')),
      'Bank Details': settings.filter(s => s.setting_key.includes('bank') || s.setting_key.includes('payment')),
      'Rental Settings': settings.filter(s => s.setting_key.includes('rental') || s.setting_key.includes('duration') || s.setting_key.includes('fee')),
      'System Settings': settings.filter(s => s.setting_key.includes('maintenance'))
    };
    return groups;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            <span>Loading company settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
            <p>Error loading company settings: {error}</p>
            <Button onClick={handleRefresh} variant="outline" className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const groupedSettings = groupSettings(settings);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Company Settings</h2>
          <p className="text-muted-foreground">Manage company information and system settings</p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {Object.entries(groupedSettings).map(([groupName, groupSettings]) => (
        <Card key={groupName}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getSettingIcon(groupSettings[0]?.setting_key || '')}
              {groupName}
            </CardTitle>
            <CardDescription>
              {groupName === 'Company Information' && 'Basic company information displayed to customers'}
              {groupName === 'Bank Details' && 'Bank account information for payment processing'}
              {groupName === 'Rental Settings' && 'Default rental durations and fee structures'}
              {groupName === 'System Settings' && 'System-wide configuration options'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {groupSettings.map((setting) => {
                const isEditing = editingSettings[setting.setting_key] !== undefined;
                const isSaving = saving[setting.setting_key];
                const hasChanges = editingSettings[setting.setting_key] !== setting.setting_value;

                return (
                  <div key={setting.id} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Label className="font-medium">{setting.description}</Label>
                        {setting.is_public && (
                          <Badge variant="secondary" className="text-xs">Public</Badge>
                        )}
                        {!setting.is_public && (
                          <Badge variant="outline" className="text-xs">Admin Only</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Key: <code className="bg-muted px-1 rounded">{setting.setting_key}</code>
                      </div>
                      {renderSettingInput(setting)}
                    </div>
                    <div className="ml-4 flex gap-2">
                      {isEditing && hasChanges && (
                        <Button
                          size="sm"
                          onClick={() => handleSaveSetting(setting)}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                      {isEditing && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingSettings(prev => {
                              const updated = { ...prev };
                              delete updated[setting.setting_key];
                              return updated;
                            });
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CompanySettings;
