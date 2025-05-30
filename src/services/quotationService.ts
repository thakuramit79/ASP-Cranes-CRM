import { Quotation, QuotationInputs } from '../types/quotation';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getLeadById } from './leadService';

const quotationsCollection = collection(db, 'quotations');

// Calculate total rent based on the form data
const calculateTotalRent = (quotationData: any): number => {
  try {
    // Get the appropriate base rate based on the order type
    const baseRate = quotationData.selectedEquipment?.baseRates?.[quotationData.orderType] || 0;
    
    // Calculate working cost
    const workingHours = quotationData.workingHours * quotationData.numberOfDays;
    const workingCost = baseRate * workingHours;
    
    // Calculate other costs
    const elongationCost = workingCost * 0.15; // 15% of working cost
    const foodAccomCost = (quotationData.foodResources * 25 + quotationData.accomResources * 100) * quotationData.numberOfDays;
    const trailerCost = quotationData.siteDistance * 50; // ₹50 per km
    const usageFactor = quotationData.usage === 'heavy' ? 1.2 : 1;
    const usageLoadFactor = workingCost * (usageFactor - 1);
    
    // Risk adjustment
    let riskAdjustment = 0;
    switch (quotationData.riskFactor) {
      case 'high': riskAdjustment = workingCost * 0.15; break;
      case 'medium': riskAdjustment = workingCost * 0.10; break;
      case 'low': riskAdjustment = workingCost * 0.05; break;
    }
    
    // Extra charges
    const extraCharges = Number(quotationData.extraCharge || 0) +
                        Number(quotationData.incidentalCharges || 0) +
                        Number(quotationData.otherFactorsCharge || 0);
    
    // Calculate subtotal
    const subtotal = workingCost * usageFactor +
                    elongationCost +
                    foodAccomCost +
                    trailerCost +
                    riskAdjustment +
                    extraCharges;
    
    // Add GST if applicable
    const gstAmount = quotationData.billing === 'gst' ? subtotal * 0.18 : 0;
    
    // Return total amount
    return subtotal + gstAmount;
  } catch (error) {
    console.error('Error calculating total rent:', error);
    return 0;
  }
};

const getMachineBaseRate = (type: string): number => {
  switch (type) {
    case 'mobile_crane': return 15000;
    case 'tower_crane': return 25000;
    case 'crawler_crane': return 30000;
    case 'pick_and_carry': return 12000;
    default: return 0;
  }
};

const getDays = (orderType: string, workingHours: number): number => {
  switch (orderType) {
    case 'monthly': return 26;
    case 'yearly': return 312;
    default: return workingHours / 10;
  }
};

const calculateRiskAdjustment = (baseAmount: number, riskFactor: string): number => {
  switch (riskFactor) {
    case 'high': return baseAmount * 0.15;
    case 'medium': return baseAmount * 0.10;
    case 'low': return baseAmount * 0.05;
    default: return 0;
  }
};

// Get quotations for a lead
export const getQuotationsForLead = async (leadId: string): Promise<Quotation[]> => {
  const q = query(
    quotationsCollection,
    where('leadId', '==', leadId),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quotation));
};

// Get quotations for a customer
export const getQuotationsForCustomer = async (customerId: string): Promise<Quotation[]> => {
  const q = query(
    quotationsCollection,
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quotation));
};

// Get quotation by ID
export const getQuotationById = async (id: string): Promise<Quotation | null> => {
  const docRef = doc(quotationsCollection, id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Quotation;
};

// Create quotation
export const createQuotation = async (quotationData: any): Promise<Quotation> => {
  try {
    // Get lead details to get customer information
    const lead = await getLeadById(quotationData.leadId);
    if (!lead) {
      throw new Error('Lead not found');
    }

    const totalRent = calculateTotalRent(quotationData);
    
    const newQuotation = {
      ...quotationData,
      customerId: lead.customerId || '',  // Add customer ID from lead
      customerName: lead.customerName,    // Add customer name from lead
      totalRent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const docRef = await addDoc(quotationsCollection, newQuotation);
    return { id: docRef.id, ...newQuotation };
  } catch (error) {
    console.error('Error creating quotation:', error);
    throw error;
  }
};

// Update quotation
export const updateQuotation = async (
  id: string,
  updates: any
): Promise<Quotation | null> => {
  try {
    const docRef = doc(quotationsCollection, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    const updatedData = {
      ...updates,
      totalRent: calculateTotalRent(updates),
      updatedAt: new Date().toISOString(),
    };
    
    await updateDoc(docRef, updatedData);
    return { id, ...docSnap.data(), ...updatedData };
  } catch (error) {
    console.error('Error updating quotation:', error);
    throw error;
  }
};