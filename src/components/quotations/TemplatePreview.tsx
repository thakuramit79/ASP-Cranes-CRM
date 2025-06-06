import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';
import { Button } from '../common/Button';
import { Select } from '../common/Select';
import { Toast } from '../common/Toast';
import { Template } from '../../types/template';
import { Quotation } from '../../types/quotation';
import { mergeQuotationWithTemplate, getAvailablePlaceholders } from '../../utils/templateMerger';
import { Eye, Download, Send, FileText, Info } from 'lucide-react';

interface TemplatePreviewProps {
  template: Template;
  quotation: Quotation;
  onDownloadPDF?: () => void;
  onSendEmail?: () => void;
  className?: string;
}

export function TemplatePreview({ 
  template, 
  quotation, 
  onDownloadPDF, 
  onSendEmail,
  className = '' 
}: TemplatePreviewProps) {
  const [showPlaceholders, setShowPlaceholders] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    variant?: 'success' | 'error' | 'warning';
  }>({ show: false, title: '' });

  const showToast = (title: string, variant: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ show: true, title, variant });
    setTimeout(() => setToast({ show: false, title: '' }), 3000);
  };

  // Merge template with quotation data
  const mergedContent = mergeQuotationWithTemplate(quotation, template);

  // Get available placeholders grouped by category
  const placeholders = getAvailablePlaceholders();
  const placeholdersByCategory = placeholders.reduce((acc, placeholder) => {
    if (!acc[placeholder.category]) {
      acc[placeholder.category] = [];
    }
    acc[placeholder.category].push(placeholder);
    return acc;
  }, {} as Record<string, typeof placeholders>);

  const handleCopyContent = () => {
    navigator.clipboard.writeText(mergedContent).then(() => {
      showToast('Content copied to clipboard', 'success');
    }).catch(() => {
      showToast('Failed to copy content', 'error');
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Template Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Template: {template.name}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPlaceholders(!showPlaceholders)}
                leftIcon={<Info className="w-4 h-4" />}
              >
                {showPlaceholders ? 'Hide' : 'Show'} Placeholders
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyContent}
              >
                Copy Content
              </Button>
            </div>
          </div>
        </CardHeader>
        {template.description && (
          <CardContent>
            <p className="text-sm text-gray-600">{template.description}</p>
          </CardContent>
        )}
      </Card>

      {/* Available Placeholders */}
      {showPlaceholders && (
        <Card>
          <CardHeader>
            <CardTitle>Available Placeholders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(placeholdersByCategory).map(([category, items]) => (
                <div key={category}>
                  <h4 className="font-medium text-gray-900 mb-2">{category}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {items.map((placeholder) => (
                      <div
                        key={placeholder.key}
                        className="text-xs font-mono bg-gray-100 px-2 py-1 rounded cursor-pointer hover:bg-gray-200 transition-colors"
                        title={placeholder.description}
                        onClick={() => {
                          navigator.clipboard.writeText(`{{${placeholder.key}}}`);
                          showToast(`Copied {{${placeholder.key}}}`, 'success');
                        }}
                      >
                        {`{{${placeholder.key}}}`}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Click on any placeholder to copy it to your clipboard.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Merged Content Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Quotation Preview</CardTitle>
            <div className="flex items-center gap-2">
              {onDownloadPDF && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDownloadPDF}
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Download PDF
                </Button>
              )}
              {onSendEmail && (
                <Button
                  size="sm"
                  onClick={onSendEmail}
                  leftIcon={<Send className="w-4 h-4" />}
                >
                  Send to Customer
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-white border rounded-lg p-6 shadow-sm max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
              {mergedContent}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Toast Notifications */}
      {toast.show && (
        <Toast
          title={toast.title}
          variant={toast.variant}
          isVisible={toast.show}
          onClose={() => setToast({ show: false, title: '' })}
        />
      )}
    </div>
  );
}