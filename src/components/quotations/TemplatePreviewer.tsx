import React, { useState } from 'react';
import { QuotationTemplate } from '../../types/quotationTemplate';
import { Dialog } from '../common/Dialog';
import { Button } from '../common/Button';
import { X, Download, Printer } from 'lucide-react';
import { PDFViewer } from '@react-pdf/renderer';
import { QuotationPDF } from './QuotationPDF';

interface TemplatePreviewerProps {
  template: QuotationTemplate;
  onClose: () => void;
}

export function TemplatePreviewer({ template, onClose }: TemplatePreviewerProps) {
  const [sampleData] = useState({
    items: [
      {
        description: 'Crane Rental - 50T Mobile Crane',
        quantity: 1,
        rate: 15000,
        amount: 15000
      },
      {
        description: 'Operator Charges',
        quantity: 8,
        rate: 500,
        amount: 4000
      },
      {
        description: 'Transportation',
        quantity: 1,
        rate: 3000,
        amount: 3000
      }
    ],
    subtotal: 22000,
    gst: 3960,
    total: 25960,
    customerInfo: {
      name: 'John Doe',
      company: 'ABC Construction Ltd',
      address: '123 Builder Street, Construction City',
      phone: '+91 98765 43210',
      email: 'john@abcconstruction.com'
    },
    quotationInfo: {
      number: 'QT-2024-001',
      date: new Date().toLocaleDateString(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
    }
  });

  return (
    <Dialog
      open={true}
      onClose={onClose}
      className="w-full max-w-5xl h-[90vh]"
    >
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Preview Template</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Printer className="w-4 h-4" />}
              onClick={() => window.print()}
            >
              Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-4 h-4" />}
            >
              Download PDF
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              leftIcon={<X className="w-4 h-4" />}
            >
              Close
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <PDFViewer style={{ width: '100%', height: '100%' }}>
            <QuotationPDF template={template} data={sampleData} />
          </PDFViewer>
        </div>
      </div>
    </Dialog>
  );
} 