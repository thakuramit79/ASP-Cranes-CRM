import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, FileText } from 'lucide-react';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { Toast } from '../common/Toast';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';
import { Template } from '../../types/template';

interface DefaultTemplateConfigProps {
  onSave?: () => void;
}

export function DefaultTemplateConfig({ onSave }: DefaultTemplateConfigProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    variant?: 'success' | 'error' | 'warning';
  }>({ show: false, title: '' });

  useEffect(() => {
    loadTemplatesAndConfig();
  }, []);

  const loadTemplatesAndConfig = async () => {
    try {
      setIsLoading(true);
      
      // Load templates from localStorage
      const savedTemplates = localStorage.getItem('quotation-templates');
      let templatesList: Template[] = [];
      
      if (savedTemplates) {
        try {
          templatesList = JSON.parse(savedTemplates);
        } catch (error) {
          console.error('Error parsing templates:', error);
        }
      }
      
      setTemplates(templatesList);
      
      // Load current default template setting
      const savedConfig = localStorage.getItem('default-template-config');
      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig);
          setSelectedTemplateId(config.defaultTemplateId || '');
        } catch (error) {
          console.error('Error parsing default template config:', error);
        }
      }
    } catch (error) {
      console.error('Error loading templates and config:', error);
      showToast('Error loading configuration', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (title: string, variant: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ show: true, title, variant });
    setTimeout(() => setToast({ show: false, title: '' }), 3000);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Save the default template configuration
      const config = {
        defaultTemplateId: selectedTemplateId,
        updatedAt: new Date().toISOString()
      };
      
      localStorage.setItem('default-template-config', JSON.stringify(config));
      
      showToast('Default template configuration saved successfully');
      onSave?.();
    } catch (error) {
      console.error('Error saving default template config:', error);
      showToast('Error saving configuration', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const templateOptions = [
    { value: '', label: 'No default template selected' },
    ...templates.map(template => ({
      value: template.id,
      label: template.name
    }))
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <RefreshCw className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary-500" />
          <CardTitle>Default Quotation Template</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Default Template
            </label>
            <Select
              options={templateOptions}
              value={selectedTemplateId}
              onChange={setSelectedTemplateId}
              className="w-full max-w-md"
            />
            <p className="text-sm text-gray-500 mt-2">
              This template will be used as the default when creating new quotations.
            </p>
          </div>

          {selectedTemplateId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900">
                    Selected Template
                  </h4>
                  <p className="text-sm text-blue-700 mt-1">
                    {templates.find(t => t.id === selectedTemplateId)?.name}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {templates.find(t => t.id === selectedTemplateId)?.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          {templates.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <RefreshCw className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-900">
                    No Templates Available
                  </h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Create quotation templates first to set a default template.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-200">
          <Button
            onClick={handleSave}
            disabled={isSaving || templates.length === 0}
            leftIcon={isSaving ? <RefreshCw className="animate-spin" /> : <Save />}
            className="w-full sm:w-auto"
          >
            {isSaving ? 'Saving Configuration...' : 'Save Configuration'}
          </Button>
        </div>

        {toast.show && (
          <Toast
            title={toast.title}
            variant={toast.variant}
            isVisible={toast.show}
            onClose={() => setToast({ show: false, title: '' })}
          />
        )}
      </CardContent>
    </Card>
  );
}