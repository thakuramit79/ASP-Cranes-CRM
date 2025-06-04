import { OrderType } from './equipment';
import { Equipment } from './equipment';

export interface CustomerContact {
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  designation?: string;
}

export interface QuotationInputs {
  orderType: OrderType;
  numberOfDays: number;
  workingHours: number;
  selectedEquipment: {
    id: string;
    equipmentId: string;
    name: string;
    baseRates: {
      micro: number;
      small: number;
      monthly: number;
      yearly: number;
    };
  };
  foodResources: number;
  accomResources: number;
  siteDistance: number;
  usage: 'normal' | 'heavy';
  riskFactor: 'low' | 'medium' | 'high';
  extraCharge: number;
  incidentalCharges: number;
  otherFactorsCharge: number;
  billing: 'gst' | 'non_gst';
  baseRate: number;
  includeGst: boolean;
  shift: 'single' | 'double';
  dayNight: 'day' | 'night';
  mobDemob: number;
  mobRelaxation: number;
  runningCostPerKm: number;
}

export interface Quotation extends QuotationInputs {
  id: string;
  leadId: string;
  customerId: string;
  customerName: string;
  customerContact: CustomerContact;
  totalRent: number;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
}