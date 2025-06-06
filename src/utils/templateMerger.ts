import { Quotation } from '../types/quotation';
import { Template } from '../types/template';
import { formatCurrency } from './formatters';

/**
 * Interface for template data that can be merged with templates
 */
export interface TemplateData {
  // Customer information
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_company: string;
  customer_address: string;
  customer_designation: string;

  // Quotation information
  quotation_id: string;
  quotation_date: string;
  quotation_number: string;
  valid_until: string;
  created_date: string;

  // Equipment information
  equipment_name: string;
  equipment_id: string;
  equipment_capacity: string;
  equipment_type: string;

  // Project details
  project_duration: string;
  working_hours: string;
  shift_type: string;
  day_night: string;
  order_type: string;
  usage_type: string;
  risk_factor: string;

  // Location and logistics
  site_location: string;
  site_distance: string;
  mob_demob_cost: string;

  // Pricing information
  base_rate: string;
  total_amount: string;
  subtotal: string;
  gst_amount: string;
  gst_applicable: string;

  // Resources
  food_resources: string;
  accommodation_resources: string;
  extra_charges: string;

  // Company information
  company_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  company_gst: string;
  company_pan: string;

  // Additional details
  terms_conditions: string;
  payment_terms: string;
  validity_period: string;
  notes: string;

  // Dates
  current_date: string;
  current_time: string;
  current_year: string;
}

/**
 * Converts a quotation object to template data
 */
export function quotationToTemplateData(quotation: Quotation): TemplateData {
  const createdDate = new Date(quotation.createdAt);
  const validUntilDate = new Date(createdDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days validity
  const currentDate = new Date();

  // Calculate GST amount
  const subtotalAmount = quotation.includeGst 
    ? quotation.totalRent / 1.18 
    : quotation.totalRent;
  const gstAmount = quotation.includeGst 
    ? quotation.totalRent - subtotalAmount 
    : 0;

  return {
    // Customer information
    customer_name: quotation.customerContact?.name || quotation.customerName || 'N/A',
    customer_email: quotation.customerContact?.email || 'N/A',
    customer_phone: quotation.customerContact?.phone || 'N/A',
    customer_company: quotation.customerContact?.company || 'N/A',
    customer_address: quotation.customerContact?.address || 'N/A',
    customer_designation: quotation.customerContact?.designation || 'N/A',

    // Quotation information
    quotation_id: quotation.id.slice(0, 8).toUpperCase(),
    quotation_date: createdDate.toLocaleDateString('en-IN'),
    quotation_number: `QT-${quotation.id.slice(0, 8).toUpperCase()}`,
    valid_until: validUntilDate.toLocaleDateString('en-IN'),
    created_date: createdDate.toLocaleDateString('en-IN'),

    // Equipment information
    equipment_name: quotation.selectedEquipment?.name || 'N/A',
    equipment_id: quotation.selectedEquipment?.equipmentId || 'N/A',
    equipment_capacity: `${quotation.selectedEquipment?.name || 'N/A'}`,
    equipment_type: quotation.selectedEquipment?.name?.split(' ')[0] || 'N/A',

    // Project details
    project_duration: `${quotation.numberOfDays} days`,
    working_hours: `${quotation.workingHours} hours/day`,
    shift_type: quotation.shift === 'double' ? 'Double Shift' : 'Single Shift',
    day_night: quotation.dayNight === 'day' ? 'Day Shift' : 'Night Shift',
    order_type: quotation.orderType.charAt(0).toUpperCase() + quotation.orderType.slice(1),
    usage_type: quotation.usage === 'heavy' ? 'Heavy Usage' : 'Normal Usage',
    risk_factor: quotation.riskFactor.charAt(0).toUpperCase() + quotation.riskFactor.slice(1) + ' Risk',

    // Location and logistics
    site_location: quotation.customerContact?.address || 'N/A',
    site_distance: `${quotation.siteDistance} km`,
    mob_demob_cost: formatCurrency(quotation.mobDemob),

    // Pricing information
    base_rate: formatCurrency(quotation.baseRate),
    total_amount: formatCurrency(quotation.totalRent),
    subtotal: formatCurrency(subtotalAmount),
    gst_amount: formatCurrency(gstAmount),
    gst_applicable: quotation.includeGst ? 'Yes (18%)' : 'No',

    // Resources
    food_resources: quotation.foodResources.toString(),
    accommodation_resources: quotation.accomResources.toString(),
    extra_charges: formatCurrency(quotation.extraCharge),

    // Company information
    company_name: 'ASP Cranes',
    company_address: '123 Industrial Area, Mumbai, Maharashtra 400001',
    company_phone: '+91 22 1234 5678',
    company_email: 'info@aspcranes.com',
    company_gst: '27AABCS1429B1ZB',
    company_pan: 'AABCS1429B',

    // Additional details
    terms_conditions: 'Standard terms and conditions apply',
    payment_terms: '50% advance, balance against monthly bills',
    validity_period: '30 days from quotation date',
    notes: quotation.notes || 'Thank you for your business!',

    // Dates
    current_date: currentDate.toLocaleDateString('en-IN'),
    current_time: currentDate.toLocaleTimeString('en-IN'),
    current_year: currentDate.getFullYear().toString(),
  };
}

/**
 * Merges template content with data, replacing all placeholders
 */
export function mergeTemplate(template: Template, data: TemplateData): string {
  let content = template.content;

  // Replace all placeholders with actual data
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    content = content.replace(regex, value);
  });

  // Handle any remaining unreplaced placeholders by removing them or replacing with default text
  content = content.replace(/\{\{[^}]+\}\}/g, '[Data not available]');

  return content;
}

/**
 * Convenience function to merge a quotation with a template
 */
export function mergeQuotationWithTemplate(quotation: Quotation, template: Template): string {
  const templateData = quotationToTemplateData(quotation);
  return mergeTemplate(template, templateData);
}

/**
 * Get available template placeholders for documentation/help
 */
export function getAvailablePlaceholders(): Array<{ key: string; description: string; category: string }> {
  return [
    // Customer placeholders
    { key: 'customer_name', description: 'Customer full name', category: 'Customer' },
    { key: 'customer_email', description: 'Customer email address', category: 'Customer' },
    { key: 'customer_phone', description: 'Customer phone number', category: 'Customer' },
    { key: 'customer_company', description: 'Customer company name', category: 'Customer' },
    { key: 'customer_address', description: 'Customer address', category: 'Customer' },
    { key: 'customer_designation', description: 'Customer designation/title', category: 'Customer' },

    // Quotation placeholders
    { key: 'quotation_id', description: 'Quotation ID (short)', category: 'Quotation' },
    { key: 'quotation_number', description: 'Full quotation number', category: 'Quotation' },
    { key: 'quotation_date', description: 'Quotation creation date', category: 'Quotation' },
    { key: 'valid_until', description: 'Quotation validity end date', category: 'Quotation' },

    // Equipment placeholders
    { key: 'equipment_name', description: 'Equipment full name', category: 'Equipment' },
    { key: 'equipment_id', description: 'Equipment ID', category: 'Equipment' },
    { key: 'equipment_capacity', description: 'Equipment capacity/specifications', category: 'Equipment' },
    { key: 'equipment_type', description: 'Equipment type', category: 'Equipment' },

    // Project placeholders
    { key: 'project_duration', description: 'Project duration in days', category: 'Project' },
    { key: 'working_hours', description: 'Working hours per day', category: 'Project' },
    { key: 'shift_type', description: 'Single or double shift', category: 'Project' },
    { key: 'day_night', description: 'Day or night shift', category: 'Project' },
    { key: 'order_type', description: 'Order type (micro/small/monthly/yearly)', category: 'Project' },
    { key: 'usage_type', description: 'Usage type (normal/heavy)', category: 'Project' },
    { key: 'risk_factor', description: 'Risk factor level', category: 'Project' },

    // Location placeholders
    { key: 'site_location', description: 'Project site location', category: 'Location' },
    { key: 'site_distance', description: 'Distance to site', category: 'Location' },
    { key: 'mob_demob_cost', description: 'Mobilization/demobilization cost', category: 'Location' },

    // Pricing placeholders
    { key: 'base_rate', description: 'Base equipment rate', category: 'Pricing' },
    { key: 'total_amount', description: 'Total quotation amount', category: 'Pricing' },
    { key: 'subtotal', description: 'Subtotal before GST', category: 'Pricing' },
    { key: 'gst_amount', description: 'GST amount', category: 'Pricing' },
    { key: 'gst_applicable', description: 'Whether GST is applicable', category: 'Pricing' },
    { key: 'extra_charges', description: 'Additional charges', category: 'Pricing' },

    // Resources placeholders
    { key: 'food_resources', description: 'Number of food resources', category: 'Resources' },
    { key: 'accommodation_resources', description: 'Number of accommodation resources', category: 'Resources' },

    // Company placeholders
    { key: 'company_name', description: 'Company name', category: 'Company' },
    { key: 'company_address', description: 'Company address', category: 'Company' },
    { key: 'company_phone', description: 'Company phone number', category: 'Company' },
    { key: 'company_email', description: 'Company email', category: 'Company' },
    { key: 'company_gst', description: 'Company GST number', category: 'Company' },
    { key: 'company_pan', description: 'Company PAN number', category: 'Company' },

    // Additional placeholders
    { key: 'terms_conditions', description: 'Terms and conditions', category: 'Additional' },
    { key: 'payment_terms', description: 'Payment terms', category: 'Additional' },
    { key: 'validity_period', description: 'Quotation validity period', category: 'Additional' },
    { key: 'notes', description: 'Additional notes', category: 'Additional' },

    // Date placeholders
    { key: 'current_date', description: 'Current date', category: 'Dates' },
    { key: 'current_time', description: 'Current time', category: 'Dates' },
    { key: 'current_year', description: 'Current year', category: 'Dates' },
  ];
}

/**
 * Validate template content for missing or invalid placeholders
 */
export function validateTemplate(templateContent: string): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Find all placeholders in the template
  const placeholderRegex = /\{\{([^}]+)\}\}/g;
  const foundPlaceholders = [...templateContent.matchAll(placeholderRegex)];
  
  // Get list of valid placeholders
  const validPlaceholders = getAvailablePlaceholders().map(p => p.key);
  
  // Check each placeholder
  foundPlaceholders.forEach(match => {
    const placeholder = match[1].trim();
    
    if (!validPlaceholders.includes(placeholder)) {
      warnings.push(`Unknown placeholder: {{${placeholder}}}`);
    }
  });
  
  // Check for common issues
  if (templateContent.includes('{{') && !templateContent.includes('}}')) {
    errors.push('Template contains unclosed placeholder brackets');
  }
  
  if (templateContent.includes('}}') && !templateContent.includes('{{')) {
    errors.push('Template contains unopened placeholder brackets');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}