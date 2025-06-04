import { Quotation, QuotationInputs } from '../types/quotation';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getLeadById } from './leadService';
import { getDealById } from './dealService';

const quotationsCollection = collection(db, 'quotations');

// Get all quotations
export const getQuotations = async (): Promise<Quotation[]> => {
  try {
    const snapshot = await getDocs(quotationsCollection);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Quotation[];
  } catch (error) {
    console.error('Error fetching quotations:', error);
    throw error;
  }
};

// Calculate total rent based on the form data
const calculateTotalRent = (quotationData: QuotationInputs): number => {
  try {
    // Early return if required fields are missing
    if (!quotationData.numberOfDays || !quotationData.baseRate) {
      return 0;
    }

    const days = Number(quotationData.numberOfDays);
    const isMonthly = days > 25;
    const effectiveDays = isMonthly ? 26 : days;
    const workingHours = Number(quotationData.workingHours || 8);
    const shiftMultiplier = quotationData.shift === 'double' ? 2 : 1;
    
    // Calculate working cost
    let workingCost;
    if (isMonthly) {
      const hourlyRate = (quotationData.baseRate / 26) / workingHours;
      workingCost = hourlyRate * workingHours * effectiveDays * shiftMultiplier;
    } else {
      workingCost = quotationData.baseRate * workingHours * effectiveDays * shiftMultiplier;
    }

    // Calculate usage load factor
    const usagePercentage = quotationData.usage === 'heavy' ? 0.10 : 0.05;
    const usageLoadFactor = quotationData.baseRate * usagePercentage;

    // Calculate elongation cost
    const elongationCost = workingCost * 0.15;
    
    // Calculate food and accommodation cost
    const foodDailyRate = 2500 / 26; // ₹2500 per month
    const accomDailyRate = 4000 / 26; // ₹4000 per month
    const foodAccomCost = isMonthly
      ? (Number(quotationData.foodResources || 0) * 2500) + (Number(quotationData.accomResources || 0) * 4000)
      : ((Number(quotationData.foodResources || 0) * foodDailyRate) + (Number(quotationData.accomResources || 0) * accomDailyRate)) * effectiveDays;

    // Calculate mob-demob cost
    const distance = Number(quotationData.siteDistance || 0);
    const trailerCost = Number(quotationData.mobDemob || 0);
    const mobRelaxationPercent = Number(quotationData.mobRelaxation || 0);
    const runningCostPerKm = quotationData.runningCostPerKm || 0;
    
    const distToSiteCost = distance * runningCostPerKm * 2;
    const mobRelaxationAmount = (distToSiteCost * mobRelaxationPercent) / 100;
    const mobDemobCost = (distToSiteCost - mobRelaxationAmount) + trailerCost;

    // Calculate risk adjustment
    let riskAdjustment = 0;
    switch (quotationData.riskFactor) {
      case 'high': riskAdjustment = quotationData.baseRate * 0.15; break;
      case 'medium': riskAdjustment = quotationData.baseRate * 0.10; break;
      case 'low': riskAdjustment = quotationData.baseRate * 0.05; break;
    }

    // Calculate extra charges
    const extraCharges = 
      Number(quotationData.extraCharge || 0) +
      Number(quotationData.incidentalCharges || 0) +
      Number(quotationData.otherFactorsCharge || 0);

    // Calculate subtotal
    const subtotal = 
      workingCost +
      elongationCost +
      foodAccomCost +
      mobDemobCost +
      riskAdjustment +
      usageLoadFactor +
      extraCharges;

    // Add GST if applicable
    const gstAmount = quotationData.includeGst ? subtotal * 0.18 : 0;
    
    return subtotal + gstAmount;
  } catch (error) {
    console.error('Error calculating total rent:', error);
    return 0;
  }
};

// Create quotation
export const createQuotation = async (quotationData: Omit<Quotation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Quotation> => {
  try {
    const timestamp = new Date().toISOString();
    const newQuotation = {
      ...quotationData,
      createdAt: timestamp,
      updatedAt: timestamp,
      totalRent: calculateTotalRent(quotationData)
    };

    const docRef = await addDoc(quotationsCollection, newQuotation);
    
    return {
      id: docRef.id,
      ...newQuotation
    };
  } catch (error) {
    console.error('Error creating quotation:', error);
    throw error;
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

// Update quotation
export const updateQuotation = async (id: string, quotationData: Partial<Quotation>): Promise<Quotation> => {
  try {
    const quotationRef = doc(quotationsCollection, id);
    
    // If we're updating a quotation, get the latest deal information
    if (quotationData.leadId) {
      const deal = await getDealById(quotationData.leadId);
      if (deal) {
        quotationData.customerContact = {
          name: deal.customer.name,
          email: deal.customer.email,
          phone: deal.customer.phone,
          company: deal.customer.company,
          address: deal.customer.address,
          designation: deal.customer.designation
        };
      }
    }

    const updateData = {
      ...quotationData,
      updatedAt: new Date().toISOString()
    };

    await updateDoc(quotationRef, updateData);

    const updatedDoc = await getDoc(quotationRef);
    if (!updatedDoc.exists()) {
      throw new Error('Quotation not found');
    }

    return {
      id: updatedDoc.id,
      ...updatedDoc.data()
    } as Quotation;
  } catch (error) {
    console.error('Error updating quotation:', error);
    throw error;
  }
};