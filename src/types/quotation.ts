import { OrderType } from './equipment';

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
}

export interface Quotation extends QuotationInputs {
  id: string;
  leadId: string;
  customerId: string;
  customerName: string;
  totalRent: number;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}