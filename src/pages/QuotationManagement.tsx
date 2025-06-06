import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter,
  Download,
  Send,
  Eye,
  Edit2,
  Trash2,
  FileText,
  IndianRupee,
  Calendar,
  User,
  Building2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../common/Select';
import { Modal } from '../components/common/Modal';
import { Toast } from '../components/common/Toast';
import { StatusBadge } from '../components/common/StatusBadge';
import { QuotationTemplate } from '../components/quotations/QuotationTemplate';
import { useAuthStore } from '../store/authStore';
import { Quotation } from '../types/quotation';
import { Template } from '../types/template';
import { getQuotations } from '../services/quotationService';
import { getDefaultTemplateConfig } from '../services/configService';
import { formatCurrency } from '../utils/formatters';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
];

export function QuotationManagement() {
  const { user } = useAuthStore();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [filteredQuotations, setFilteredQuotations] = useState<Quotation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    description?: string;
    variant?: 'success' | 'error' | 'warning';
  }>({ show: false, title: '' });

  useEffect(() => {
    fetchQuotations();
  }, []);

  useEffect(() => {
    filterQuotations();
  }, [quotations, searchTerm, statusFilter]);

  const fetchQuotations = async () => {
    try {
      const data = await getQuotations();
      setQuotations(data);
    } catch (error) {
      console.error('Error fetching quotations:', error);
      showToast('Error fetching quotations', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const filterQuotations = () => {
    let filtered = [...quotations];

    if (searchTerm) {
      filtered = filtered.filter(quotation =>
        quotation.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quotation.customerContact.company.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(quotation => quotation.status === statusFilter);
    }

    setFilteredQuotations(filtered);
  };

  const showToast = (
    title: string,
    variant: 'success' | 'error' | 'warning' = 'success',
    description?: string
  ) => {
    setToast({ show: true, title, variant, description });
    setTimeout(() => setToast({ show: false, title: '' }), 3000);
  };

  const getDefaultTemplate = async (): Promise<Template | null> => {
    try {
      // Get the default template configuration
      const config = await getDefaultTemplateConfig();
      
      if (!config.defaultTemplateId) {
        showToast('No default template configured', 'warning', 'Please set a default template in Configuration settings.');
        return null;
      }

      // Load templates from localStorage
      const savedTemplates = localStorage.getItem('quotation-templates');
      if (!savedTemplates) {
        showToast('No templates found', 'error', 'Please create templates first.');
        return null;
      }

      const templates: Template[] = JSON.parse(savedTemplates);
      const defaultTemplate = templates.find(t => t.id === config.defaultTemplateId);

      if (!defaultTemplate) {
        showToast('Default template not found', 'error', 'The configured default template no longer exists.');
        return null;
      }

      return defaultTemplate;
    } catch (error) {
      console.error('Error getting default template:', error);
      showToast('Error loading template', 'error');
      return null;
    }
  };

  const generateQuotationContent = (quotation: Quotation, template: Template): string => {
    let content = template.content;

    // Define the data mapping for template placeholders
    const templateData = {
      // Customer information
      customer_name: quotation.customerContact.name,
      customer_email: quotation.customerContact.email,
      customer_phone: quotation.customerContact.phone,
      customer_company: quotation.customerContact.company,
      customer_address: quotation.customerContact.address,
      customer_designation: quotation.customerContact.designation || 'N/A',

      // Quotation information
      quotation_id: quotation.id.slice(0, 8).toUpperCase(),
      quotation_date: new Date(quotation.createdAt).toLocaleDateString('en-IN'),
      valid_until: new Date(new Date(quotation.createdAt).setDate(new Date(quotation.createdAt).getDate() + 30)).toLocaleDateString('en-IN'),

      // Equipment information
      equipment_name: quotation.selectedEquipment.name,
      equipment_capacity: `${quotation.selectedEquipment.name}`,
      project_duration: `${quotation.numberOfDays} days`,
      working_hours: `${quotation.workingHours} hours/day`,
      shift_type: quotation.shift === 'double' ? 'Double Shift' : 'Single Shift',
      day_night: quotation.dayNight === 'day' ? 'Day Shift' : 'Night Shift',

      // Pricing information
      total_amount: formatCurrency(quotation.totalRent),
      base_rate: formatCurrency(quotation.baseRate),
      site_location: quotation.customerContact.address,

      // Company information
      company_name: 'ASP Cranes',
      company_address: '123 Industrial Area, Mumbai, Maharashtra 400001',
      company_phone: '+91 22 1234 5678',
      company_email: 'info@aspcranes.com',
      company_gst: '27AABCS1429B1ZB',

      // Additional details
      order_type: quotation.orderType.charAt(0).toUpperCase() + quotation.orderType.slice(1),
      usage_type: quotation.usage === 'heavy' ? 'Heavy Usage' : 'Normal Usage',
      risk_factor: quotation.riskFactor.charAt(0).toUpperCase() + quotation.riskFactor.slice(1) + ' Risk',
      site_distance: `${quotation.siteDistance} km`,
      mob_demob_cost: formatCurrency(quotation.mobDemob),
      food_resources: quotation.foodResources.toString(),
      accommodation_resources: quotation.accomResources.toString(),
      extra_charges: formatCurrency(quotation.extraCharge),
      gst_applicable: quotation.includeGst ? 'Yes' : 'No'
    };

    // Replace all placeholders with actual data
    Object.entries(templateData).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      content = content.replaceAll(placeholder, value);
    });

    return content;
  };

  const handleDownloadPDF = async (quotation: Quotation) => {
    try {
      setIsGeneratingPDF(true);
      
      const template = await getDefaultTemplate();
      if (!template) {
        return;
      }

      const content = generateQuotationContent(quotation, template);
      
      // Create a new window with the content for PDF generation
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        showToast('Popup blocked', 'error', 'Please allow popups to download PDF.');
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Quotation - ${quotation.customerContact.name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              margin: 40px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #0284c7;
              padding-bottom: 20px;
            }
            .content {
              white-space: pre-wrap;
              font-size: 14px;
            }
            @media print {
              body { margin: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ASP CRANES</h1>
            <h2>QUOTATION</h2>
          </div>
          <div class="content">${content}</div>
        </body>
        </html>
      `);

      printWindow.document.close();
      
      // Wait for content to load then trigger print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);

      showToast('PDF generated successfully', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast('Error generating PDF', 'error');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleSendToCustomer = async (quotation: Quotation) => {
    try {
      setIsSendingEmail(true);
      
      const template = await getDefaultTemplate();
      if (!template) {
        return;
      }

      const content = generateQuotationContent(quotation, template);
      
      // Simulate sending email (in a real app, this would call an API)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create mailto link with the quotation content
      const subject = `Quotation from ASP Cranes - ${quotation.id.slice(0, 8).toUpperCase()}`;
      const body = `Dear ${quotation.customerContact.name},\n\nPlease find your quotation details below:\n\n${content}\n\nBest regards,\nASP Cranes Team`;
      
      const mailtoLink = `mailto:${quotation.customerContact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoLink);
      
      showToast('Email prepared successfully', 'success', 'Your email client should open with the quotation details.');
    } catch (error) {
      console.error('Error sending to customer:', error);
      showToast('Error preparing email', 'error');
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (!user || (user.role !== 'sales_agent' && user.role !== 'admin')) {
    return (
      <div className="p-4 text-center text-gray-500">
        You don't have permission to access this page.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search quotations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={setStatusFilter}
            className="w-40"
          />
        </div>
        
        <Button
          onClick={() => {/* Navigate to create quotation */}}
          leftIcon={<Plus size={16} />}
        >
          New Quotation
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quotations</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading quotations...</div>
          ) : filteredQuotations.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No quotations found. Create a new quotation to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredQuotations.map((quotation) => (
                <Card key={quotation.id} variant="bordered" className="h-full">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {quotation.customerContact.name}
                        </h3>
                        <p className="text-sm text-gray-500">{quotation.customerContact.company}</p>
                      </div>
                      <StatusBadge status={quotation.status} />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center text-gray-600">
                        <FileText className="w-4 h-4 mr-2" />
                        <span className="text-sm">{quotation.selectedEquipment.name}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span className="text-sm">{quotation.numberOfDays} days</span>
                      </div>
                      
                      <div className="flex items-center text-gray-600">
                        <IndianRupee className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">{formatCurrency(quotation.totalRent)}</span>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedQuotation(quotation);
                          setIsPreviewOpen(true);
                        }}
                        leftIcon={<Eye size={14} />}
                      >
                        Preview
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadPDF(quotation)}
                        disabled={isGeneratingPDF}
                        leftIcon={<Download size={14} />}
                      >
                        {isGeneratingPDF ? 'Generating...' : 'PDF'}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendToCustomer(quotation)}
                        disabled={isSendingEmail}
                        leftIcon={<Send size={14} />}
                      >
                        {isSendingEmail ? 'Sending...' : 'Send'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setSelectedQuotation(null);
        }}
        title="Quotation Preview"
        size="xl"
      >
        {selectedQuotation && (
          <div className="space-y-4">
            <QuotationTemplate quotation={selectedQuotation} />
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => handleDownloadPDF(selectedQuotation)}
                disabled={isGeneratingPDF}
                leftIcon={<Download size={16} />}
              >
                {isGeneratingPDF ? 'Generating PDF...' : 'Download PDF'}
              </Button>
              <Button
                onClick={() => handleSendToCustomer(selectedQuotation)}
                disabled={isSendingEmail}
                leftIcon={<Send size={16} />}
              >
                {isSendingEmail ? 'Sending...' : 'Send to Customer'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Toast Notifications */}
      {toast.show && (
        <Toast
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
          isVisible={toast.show}
          onClose={() => setToast({ show: false, title: '' })}
        />
      )}
    </div>
  );
}