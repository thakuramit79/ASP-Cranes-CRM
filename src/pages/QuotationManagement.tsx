import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  FileText, 
  Send, 
  Download,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  Truck,
  Users,
  Calendar,
  IndianRupee,
  ChevronDown,
  ChevronUp,
  Settings,
  ChevronRight,
  Edit
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/StatusBadge';
import { Toast } from '../components/common/Toast';
import { useAuthStore } from '../store/authStore';
import { Deal } from '../types/deal';
import { getDeals } from '../services/dealService';
import { createQuotation, getQuotations, updateQuotation } from '../services/quotationService';
import { formatCurrency } from '../utils/formatters';
import { Equipment, CraneCategory, OrderType } from '../types/equipment';
import { getEquipmentByCategory } from '../services/firestore/equipmentService';
import { Quotation } from '../types/quotation';

const ORDER_TYPES = [
  { value: 'micro', label: 'Micro' },
  { value: 'small', label: 'Small' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const MACHINE_TYPES = [
  { value: '', label: 'Select machine type...' },
  { value: 'mobile_crane', label: 'Mobile Crane' },
  { value: 'tower_crane', label: 'Tower Crane' },
  { value: 'crawler_crane', label: 'Crawler Crane' },
  { value: 'pick_and_carry_crane', label: 'Pick & Carry Crane' },
] satisfies { value: string; label: string }[];

const SHIFT_OPTIONS = [
  { value: 'single', label: 'Single Shift' },
  { value: 'double', label: 'Double Shift' },
];

const TIME_OPTIONS = [
  { value: 'day', label: 'Day' },
  { value: 'night', label: 'Night' },
];

const USAGE_OPTIONS = [
  { value: 'heavy', label: 'Heavy' },
  { value: 'light', label: 'Light' },
];

const DEAL_TYPES = [
  { value: 'no_advance', label: 'No Advance' },
  { value: 'credit', label: 'Credit' },
  { value: 'long_credit', label: 'Long Credit' },
];

const RISK_LEVELS = [
  { value: 'high', label: 'High Risk' },
  { value: 'medium', label: 'Medium Risk' },
  { value: 'low', label: 'Low Risk' },
];

const OTHER_FACTORS = [
  { value: 'area', label: 'Area' },
  { value: 'condition', label: 'Condition' },
  { value: 'customer_reputation', label: 'Customer Reputation' },
  { value: 'rigger', label: 'Rigger' },
  { value: 'helper', label: 'Helper' },
];

const FOOD_RATE_PER_MONTH = 2500;
const ACCOMMODATION_RATE_PER_MONTH = 4000;

const INCIDENTAL_OPTIONS = [
  { value: 'incident1', label: 'Incident 1 - ₹5,000', amount: 5000 },
  { value: 'incident2', label: 'Incident 2 - ₹10,000', amount: 10000 },
  { value: 'incident3', label: 'Incident 3 - ₹15,000', amount: 15000 },
];
const RIGGER_AMOUNT = 40000;
const HELPER_AMOUNT = 12000;

interface FormData {
  numberOfDays: string;
  orderType: OrderType;
  machineType: string;
  selectedEquipment: string;
  workingHours: string;
  dayNight: string;
  shift: string;
  sundayWorking: string;
  foodResources: string;
  accomResources: string;
  usage: string;
  siteDistance: string;
  mobDemob: string;
  mobRelaxation: string;
  workingCost: string;
  elongation: string;
  dealType: string;
  extraCharge: string;
  billing: string;
  riskFactor: string;
  incidentalCharges: string[];
  otherFactors: string[];
  includeGst: boolean;
}

export function QuotationManagement() {
  const { user } = useAuthStore();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [availableEquipment, setAvailableEquipment] = useState<Equipment[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    description?: string;
    variant?: 'success' | 'error' | 'warning';
  }>({ show: false, title: '' });

  const [selectedEquipmentBaseRate, setSelectedEquipmentBaseRate] = useState<number>(0);

  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({
    duration: true,
    orderType: true,
    machineSelection: true,
    workingHours: true,
    accommodation: true,
    mobDemob: true,
    additional: true
  });

  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const showToast = (
    title: string,
    variant: 'success' | 'error' | 'warning' = 'success'
  ) => {
    setToast({ show: true, title, variant });
    setTimeout(() => setToast({ show: false, title: '' }), 3000);
  };

  const [formData, setFormData] = useState<FormData>({
    numberOfDays: '',
    orderType: 'micro',
    machineType: '',
    selectedEquipment: '',
    workingHours: '8',
    dayNight: 'day',
    shift: 'single',
    sundayWorking: 'no',
    foodResources: '',
    accomResources: '',
    usage: 'light',
    siteDistance: '',
    mobDemob: '',
    mobRelaxation: '',
    workingCost: '',
    elongation: '',
    dealType: 'no_advance',
    extraCharge: '',
    billing: 'gst',
    riskFactor: 'low',
    incidentalCharges: [],
    otherFactors: [],
    includeGst: true,
  });

  const [calculations, setCalculations] = useState({
    baseRate: 0,
    totalHours: 0,
    workingCost: 0,
    mobDemobCost: 0,
    foodAccomCost: 0,
    usageLoadFactor: 0,
    extraCharges: 0,
    riskAdjustment: 0,
    gstAmount: 0,
    totalAmount: 0,
  });

  const determineOrderType = (days: number): OrderType => {
    if (days > 25) {
      return 'monthly';
    } else if (days > 10) {
      return 'small';
    }
    return 'micro';
  };

  useEffect(() => {
    fetchDeals();
    fetchQuotations();
  }, []);

  useEffect(() => {
    calculateQuotation();
  }, [formData, selectedEquipmentBaseRate]);

  useEffect(() => {
    if (formData.machineType) {
      fetchEquipmentByCategory(formData.machineType as CraneCategory);
    } else {
      setAvailableEquipment([]);
    }
  }, [formData.machineType]);

  useEffect(() => {
    if (formData.selectedEquipment) {
      const selected = availableEquipment.find(eq => eq.id === formData.selectedEquipment);
      if (selected?.baseRates) {
        const newBaseRate = selected.baseRates[formData.orderType];
        setSelectedEquipmentBaseRate(newBaseRate);
      }
    }
  }, [formData.orderType, formData.selectedEquipment, availableEquipment]);

  const fetchDeals = async () => {
    try {
      const data = await getDeals();
      setDeals(data.filter(deal => deal.stage === 'qualification'));
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching deals:', error);
      showToast('Error fetching deals', 'error');
    }
  };

  const fetchQuotations = async () => {
    try {
      const data = await getQuotations();
      setQuotations(data);
    } catch (error) {
      console.error('Error fetching quotations:', error);
      showToast('Error fetching quotations', 'error');
    }
  };

  const calculateQuotation = () => {
    if (!formData.numberOfDays || !selectedEquipmentBaseRate) {
      setCalculations({
        baseRate: 0,
        totalHours: 0,
        workingCost: 0,
        mobDemobCost: 0,
        foodAccomCost: 0,
        usageLoadFactor: 0,
        extraCharges: 0,
        riskAdjustment: 0,
        gstAmount: 0,
        totalAmount: 0,
      });
      return;
    }

    const days = Number(formData.numberOfDays);
    const isMonthly = days > 25;
    const effectiveDays = isMonthly ? 26 : days;
    const workingHours = calculateWorkingHours(effectiveDays);
    const shiftMultiplier = formData.shift === 'double' ? 2 : 1;
    
    let workingCost;
    if (isMonthly) {
      const actualHours = parseFloat(formData.workingHours) || 8;
      const hourlyRate = (selectedEquipmentBaseRate / 26) / actualHours;
      workingCost = hourlyRate * actualHours * effectiveDays * shiftMultiplier;
    } else {
      workingCost = selectedEquipmentBaseRate * workingHours * shiftMultiplier;
    }

    const usagePercentage = formData.usage === 'heavy' ? 0.10 : 0.05;
    const usageLoadFactor = selectedEquipmentBaseRate * usagePercentage;

    const usageFactor = formData.usage === 'heavy' ? 1.2 : 1;
    
    let foodAccomCost;
    if (isMonthly) {
      foodAccomCost = (
        (Number(formData.foodResources) * FOOD_RATE_PER_MONTH) +
        (Number(formData.accomResources) * ACCOMMODATION_RATE_PER_MONTH)
      );
    } else {
      const foodDailyRate = FOOD_RATE_PER_MONTH / 26;
      const accomDailyRate = ACCOMMODATION_RATE_PER_MONTH / 26;
      foodAccomCost = (
        (Number(formData.foodResources) * foodDailyRate +
        Number(formData.accomResources) * accomDailyRate) *
        effectiveDays
      );
    }

    const mobDemobCost = calculateMobDemobCost();
    const riskAdjustment = calculateRiskAdjustment(workingCost);
    const incidentalChargesTotal = formData.incidentalCharges.reduce((sum, val) => {
      const found = INCIDENTAL_OPTIONS.find(opt => opt.value === val);
      return sum + (found ? found.amount : 0);
    }, 0);
    let otherFactorsTotal = 0;
    if (formData.otherFactors.includes('rigger')) otherFactorsTotal += RIGGER_AMOUNT;
    if (formData.otherFactors.includes('helper')) otherFactorsTotal += HELPER_AMOUNT;
    const extraCharges = (
      Number(formData.extraCharge) +
      incidentalChargesTotal +
      otherFactorsTotal
    );
    
    const subtotal = (
      workingCost +
      foodAccomCost +
      mobDemobCost +
      riskAdjustment +
      usageLoadFactor +
      extraCharges
    );
    
    const gstAmount = formData.includeGst ? subtotal * 0.18 : 0;
    const totalAmount = subtotal + gstAmount;
    
    setCalculations({
      baseRate: selectedEquipmentBaseRate,
      totalHours: isMonthly ? 0 : workingHours,
      workingCost,
      mobDemobCost,
      foodAccomCost,
      usageLoadFactor,
      extraCharges,
      riskAdjustment,
      gstAmount,
      totalAmount,
    });
  };

  const calculateWorkingHours = (days: number): number => {
    const baseHours = formData.shift === 'single' ? 8 : Number(formData.workingHours);
    const shiftMultiplier = formData.shift === 'double' ? 2 : 1;
    return baseHours * days * shiftMultiplier;
  };

  const calculateMobDemobCost = (): number => {
    const distance = Number(formData.siteDistance);
    const trailerCost = Number(formData.mobDemob) || 0;
    const mobRelaxationPercent = Number(formData.mobRelaxation) || 0;
    const selectedEquip = availableEquipment.find(eq => eq.id === formData.selectedEquipment);
    const runningCostPerKm = selectedEquip?.runningCostPerKm || 0;
    
    const distToSiteCost = distance * runningCostPerKm * 2;
    const mobRelaxationAmount = (distToSiteCost * mobRelaxationPercent) / 100;
    const finalMobDemobCost = (distToSiteCost - mobRelaxationAmount) + trailerCost;
    
    return finalMobDemobCost;
  };

  const calculateRiskAdjustment = (baseAmount: number): number => {
    const riskPercentages: Record<'low' | 'medium' | 'high', number> = {
      low: 0.05,
      medium: 0.10,
      high: 0.15
    };
    
    return selectedEquipmentBaseRate * (riskPercentages[formData.riskFactor as 'low' | 'medium' | 'high'] || 0);
  };

  const fetchEquipmentByCategory = async (category: CraneCategory) => {
    try {
      const equipment = await getEquipmentByCategory(category);
      setAvailableEquipment(equipment.filter(eq => eq.status === 'available'));
    } catch (error) {
      console.error('Error fetching equipment:', error);
      showToast('Error fetching available equipment', 'error');
    }
  };

  const handleEdit = (quotation: Quotation) => {
    setEditingQuotation(quotation);
    // Populate form data with existing quotation data
    setFormData({
      numberOfDays: quotation.numberOfDays.toString(),
      orderType: quotation.orderType,
      machineType: quotation.selectedEquipment?.name.split(' ')[0].toLowerCase() || '',
      selectedEquipment: quotation.selectedEquipment?.id || '',
      workingHours: quotation.workingHours.toString(),
      dayNight: quotation.dayNight,
      shift: quotation.shift,
      sundayWorking: 'no', // Default value as it's not stored
      foodResources: quotation.foodResources.toString(),
      accomResources: quotation.accomResources.toString(),
      usage: quotation.usage,
      siteDistance: quotation.siteDistance.toString(),
      mobDemob: quotation.mobDemob.toString(),
      mobRelaxation: quotation.mobRelaxation.toString(),
      workingCost: '',
      elongation: '',
      dealType: 'no_advance',
      extraCharge: quotation.extraCharge.toString(),
      billing: quotation.billing,
      riskFactor: quotation.riskFactor,
      incidentalCharges: [], // Will need to reverse calculate from total
      otherFactors: [], // Will need to reverse calculate from total
      includeGst: quotation.includeGst,
    });
    setIsCreateModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedDeal && !editingQuotation) {
      showToast('Please select a deal', 'error');
      return;
    }

    try {
      const selectedEquipment = availableEquipment.find(eq => eq.id === formData.selectedEquipment);
      if (!selectedEquipment) {
        showToast('Please select equipment', 'error');
        return;
      }

      // Calculate charges
      let otherFactorsTotal = 0;
      if (formData.otherFactors.includes('rigger')) otherFactorsTotal += RIGGER_AMOUNT;
      if (formData.otherFactors.includes('helper')) otherFactorsTotal += HELPER_AMOUNT;

      const incidentalChargesTotal = formData.incidentalCharges.reduce((sum, val) => {
        const found = INCIDENTAL_OPTIONS.find(opt => opt.value === val);
        return sum + (found ? found.amount : 0);
      }, 0);

      const quotationData = {
        orderType: formData.orderType as OrderType,
        numberOfDays: Number(formData.numberOfDays),
        workingHours: Number(formData.workingHours),
        selectedEquipment: {
          id: selectedEquipment.id,
          equipmentId: selectedEquipment.equipmentId,
          name: selectedEquipment.name,
          baseRates: selectedEquipment.baseRates,
        },
        foodResources: Number(formData.foodResources),
        accomResources: Number(formData.accomResources),
        siteDistance: Number(formData.siteDistance),
        usage: formData.usage as 'normal' | 'heavy',
        riskFactor: formData.riskFactor as 'low' | 'medium' | 'high',
        extraCharge: Number(formData.extraCharge),
        incidentalCharges: incidentalChargesTotal,
        otherFactorsCharge: otherFactorsTotal,
        billing: formData.billing as 'gst' | 'non_gst',
        // Add required fields from Quotation interface
        leadId: editingQuotation?.leadId || selectedDeal?.leadId || '',
        customerId: editingQuotation?.customerId || selectedDeal?.customerId || '',
        customerName: editingQuotation?.customerName || selectedDeal?.customer.name || '',
        version: editingQuotation ? editingQuotation.version + 1 : 1,
        createdBy: user?.id || '',
        baseRate: selectedEquipmentBaseRate,
        includeGst: formData.includeGst,
        shift: formData.shift as 'single' | 'double',
        dayNight: formData.dayNight as 'day' | 'night',
        mobDemob: Number(formData.mobDemob),
        mobRelaxation: Number(formData.mobRelaxation),
        runningCostPerKm: selectedEquipment.runningCostPerKm,
      };

      if (editingQuotation) {
        await updateQuotation(editingQuotation.id, quotationData);
        showToast('Quotation updated successfully', 'success');
      } else {
        await createQuotation(quotationData);
        showToast('Quotation created successfully', 'success');
      }
      
      await fetchQuotations();
      setIsCreateModalOpen(false);
      setEditingQuotation(null);
    } catch (error) {
      console.error('Error saving quotation:', error);
      showToast('Error saving quotation', 'error');
    }
  };

  const toggleCard = (cardName: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardName]: !prev[cardName]
    }));
  };

  const toggleRow = (quotationId: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [quotationId]: !prev[quotationId]
    }));
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
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <Select
            label="Select Deal"
            options={[
              { value: '', label: 'Select a deal in qualification stage...' },
              ...deals.map(deal => ({
                value: deal.id,
                label: `${deal.customer.name} - ${deal.title} (${formatCurrency(deal.value)})`,
              }))
            ]}
            value={selectedDeal?.id || ''}
            onChange={(value) => {
              const deal = deals.find(d => d.id === value);
              setSelectedDeal(deal || null);
            }}
          />
          {!deals.length && (
            <div className="mt-2 text-sm text-gray-500">
              No deals in qualification stage available. Move deals to qualification stage to create quotations.
            </div>
          )}
        </div>
        
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          disabled={!selectedDeal}
          leftIcon={<Calculator size={16} />}
        >
          New Quotation
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quotation History</CardTitle>
        </CardHeader>
        <CardContent>
          {quotations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No quotations found. Create your first quotation to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {quotations.map((quotation) => (
                <div key={quotation.id} className="border rounded-lg overflow-hidden">
                  <div
                    className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      expandedRows[quotation.id] ? 'bg-gray-50' : ''
                    }`}
                    onClick={() => toggleRow(quotation.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary-600" />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{quotation.customerName || 'Unnamed Customer'}</h4>
                        <p className="text-sm text-gray-500">
                          Created on {new Date(quotation.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          {formatCurrency(quotation.totalRent || 0)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {(quotation.orderType?.charAt(0).toUpperCase() + quotation.orderType?.slice(1)) || 'Unknown'} Order
                        </div>
                      </div>
                      <ChevronRight
                        className={`h-5 w-5 text-gray-400 transition-transform ${
                          expandedRows[quotation.id] ? 'rotate-90' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {expandedRows[quotation.id] && (
                    <div className="border-t bg-gray-50 p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-3">
                          <h5 className="font-medium text-gray-900">Basic Information</h5>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Order Type:</span>
                              <span className="font-medium">{quotation.orderType || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Duration:</span>
                              <span className="font-medium">{quotation.numberOfDays || 0} days</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Working Hours:</span>
                              <span className="font-medium">{quotation.workingHours || 0} hrs/day</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Equipment:</span>
                              <span className="font-medium">{quotation.selectedEquipment?.name || 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h5 className="font-medium text-gray-900">Cost Breakdown</h5>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Base Rate:</span>
                              <span className="font-medium">{formatCurrency(quotation.baseRate || 0)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Extra Charges:</span>
                              <span className="font-medium">{formatCurrency(quotation.extraCharge || 0)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Incidental Charges:</span>
                              <span className="font-medium">{formatCurrency(quotation.incidentalCharges || 0)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Other Factors:</span>
                              <span className="font-medium">{formatCurrency(quotation.otherFactorsCharge || 0)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Total Rent:</span>
                              <span className="font-medium">{formatCurrency(quotation.totalRent || 0)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-medium text-gray-900">Total Amount</span>
                          <span className="text-2xl font-bold text-primary-600">
                            {formatCurrency(quotation.totalRent || 0)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Edit size={16} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(quotation);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Download size={16} />}
                        >
                          Download PDF
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Send size={16} />}
                        >
                          Send to Customer
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingQuotation(null);
        }}
        title={editingQuotation ? "Edit Quotation" : "Create New Quotation"}
        size="full"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-7 space-y-6">
              <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors duration-200" onClick={() => toggleCard('duration')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <CardTitle className="text-lg font-medium">Duration</CardTitle>
                    </div>
                    {expandedCards.duration ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </CardHeader>
                {expandedCards.duration && (
                  <CardContent className="pt-4 space-y-4">
                    <Input
                      type="number"
                      label="Number of Days"
                      value={formData.numberOfDays}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const days = Number(e.target.value);
                        if (days > 30) {
                          showToast('Maximum duration is 30 days', 'warning');
                          return;
                        }
                        const newOrderType = determineOrderType(days);
                        setFormData(prev => ({
                          ...prev,
                          numberOfDays: e.target.value,
                          orderType: newOrderType
                        }));
                      }}
                      required
                      min="1"
                      max="30"
                      placeholder="Enter number of days (max 30)"
                    />
                    {formData.numberOfDays && selectedEquipmentBaseRate > 0 && (
                      <div className="mt-2 space-y-1">
                        {formData.orderType !== 'monthly' ? (
                          <div className="text-sm text-gray-600">
                            Daily Rate: {formatCurrency(selectedEquipmentBaseRate * (formData.shift === 'single' ? 8 : Number(formData.workingHours)))}/day
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600">
                            Monthly Rate: {formatCurrency(selectedEquipmentBaseRate)}/month
                          </div>
                        )}
                        <div className="text-sm font-medium text-primary-600">
                          {Number(formData.numberOfDays) > 25 ? 'Monthly rate' :
                           Number(formData.numberOfDays) > 10 ? 'Small order rate' :
                           'Micro order rate'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Note: 
                          {Number(formData.numberOfDays) <= 10 ? '1-10 days: Micro rate (per hour)' :
                           Number(formData.numberOfDays) <= 25 ? '11-25 days: Small rate (per hour)' :
                           '26+ days: Monthly rate (fixed monthly rate)'}
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>

              <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors duration-200" onClick={() => toggleCard('orderType')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-gray-500" />
                      <CardTitle className="text-lg font-medium">Order Type</CardTitle>
                    </div>
                    {expandedCards.orderType ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </CardHeader>
                {expandedCards.orderType && (
                  <CardContent className="pt-4 space-y-4">
                    <Select
                      label="Order Type"
                      options={ORDER_TYPES}
                      value={formData.orderType}
                      onChange={(value) => setFormData(prev => ({
                        ...prev,
                        orderType: value as OrderType
                      }))}
                      disabled={Number(formData.numberOfDays) > 0}
                    />
                    {Number(formData.numberOfDays) > 0 && (
                      <div className="mt-2 text-sm text-amber-600">
                        {Number(formData.numberOfDays) > 25 ? 'Order type is set to Monthly as duration exceeds 25 days' :
                         Number(formData.numberOfDays) > 10 ? 'Order type is set to Small as duration is between 11-25 days' :
                         'Order type is set to Micro as duration is 10 days or less'}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>

              <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors duration-200" onClick={() => toggleCard('machineSelection')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Truck className="w-5 h-5 text-gray-500" />
                      <CardTitle className="text-lg font-medium">Machine Selection</CardTitle>
                    </div>
                    {expandedCards.machineSelection ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </CardHeader>
                {expandedCards.machineSelection && (
                  <CardContent className="pt-4 space-y-4">
                    <Select
                      label="Machine Type"
                      options={MACHINE_TYPES}
                      value={formData.machineType}
                      onChange={(value) => {
                        setFormData(prev => ({
                          ...prev,
                          machineType: value,
                          selectedEquipment: '',
                        }));
                        setSelectedEquipmentBaseRate(0);
                      }}
                      required
                    />

                    {formData.machineType && (
                      <Select
                        label="Select Equipment"
                        options={[
                          { value: '', label: 'Select equipment...' },
                          ...availableEquipment.map(eq => ({
                            value: eq.id,
                            label: `${eq.equipmentId} - ${eq.name} (${formatCurrency(eq.baseRates[formData.orderType])}${formData.orderType === 'monthly' ? '/month' : '/hr'})`,
                          }))
                        ]}
                        value={formData.selectedEquipment}
                        onChange={(value) => {
                          const selected = availableEquipment.find(eq => eq.id === value);
                          setFormData(prev => ({
                            ...prev,
                            selectedEquipment: value,
                          }));
                          if (selected?.baseRates) {
                            const newBaseRate = selected.baseRates[formData.orderType];
                            setSelectedEquipmentBaseRate(newBaseRate);
                          } else {
                            setSelectedEquipmentBaseRate(0);
                          }
                        }}
                        required
                      />
                    )}
                    
                    {!availableEquipment.length && formData.machineType && (
                      <div className="text-sm text-amber-600">
                        No available equipment found for this machine type
                      </div>
                    )}

                    {!formData.machineType && (
                      <div className="text-sm text-gray-500">
                        Select a machine type to view available equipment
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>

              <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors duration-200" onClick={() => toggleCard('workingHours')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-gray-500" />
                      <CardTitle className="text-lg font-medium">Working Hours</CardTitle>
                    </div>
                    {expandedCards.workingHours ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </CardHeader>
                {expandedCards.workingHours && (
                  <CardContent className="pt-4 space-y-4">
                    <Select
                      label="Shift"
                      options={SHIFT_OPTIONS}
                      value={formData.shift}
                      onChange={(value) => {
                        setFormData(prev => ({
                          ...prev,
                          shift: value
                        }));
                      }}
                    />
                    <div>
                      <Input
                        type="text"
                        label="Number of Hours"
                        value={formData.workingHours}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || /^\d*\.?\d*$/.test(value)) {
                            const numValue = parseFloat(value);
                            if (!value || (numValue >= 1 && numValue <= 24)) {
                              setFormData(prev => ({ ...prev, workingHours: value }));
                            }
                          }
                        }}
                        required
                        placeholder="Enter hours (e.g. 7.5, 8, 8.5)"
                      />
                      <div className="flex items-center mt-1.5 text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-1.5" />
                        <span>Standard single shift duration is 8 hours</span>
                      </div>
                    </div>
                    <Select
                      label="Day/Night"
                      options={TIME_OPTIONS}
                      value={formData.dayNight}
                      onChange={(value) => setFormData(prev => ({ ...prev, dayNight: value }))}
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="sundayWorking"
                        checked={formData.sundayWorking === 'yes'}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          sundayWorking: e.target.checked ? 'yes' : 'no' 
                        }))}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="sundayWorking" className="text-sm">
                        Sunday Working
                      </label>
                    </div>
                  </CardContent>
                )}
              </Card>

              <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors duration-200" onClick={() => toggleCard('accommodation')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-5 h-5 text-gray-500" />
                      <CardTitle className="text-lg font-medium">Accommodation</CardTitle>
                    </div>
                    {expandedCards.accommodation ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </CardHeader>
                {expandedCards.accommodation && (
                  <CardContent className="pt-4 space-y-4">
                    <div>
                      <Input
                        type="number"
                        label="Number of Resources (Food)"
                        value={formData.foodResources}
                        onChange={(e) => setFormData(prev => ({ ...prev, foodResources: e.target.value }))}
                      />
                      <div className="text-sm text-gray-500 mt-1">
                        Rate: ₹{FOOD_RATE_PER_MONTH}/month per person
                      </div>
                    </div>
                    <div>
                      <Input
                        type="number"
                        label="Number of Resources (Accommodation)"
                        value={formData.accomResources}
                        onChange={(e) => setFormData(prev => ({ ...prev, accomResources: e.target.value }))}
                      />
                      <div className="text-sm text-gray-500 mt-1">
                        Rate: ₹{ACCOMMODATION_RATE_PER_MONTH}/month per person
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors duration-200" onClick={() => toggleCard('mobDemob')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Truck className="w-5 h-5 text-gray-500" />
                      <CardTitle className="text-lg font-medium">Mob - Demob</CardTitle>
                    </div>
                    {expandedCards.mobDemob ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </CardHeader>
                {expandedCards.mobDemob && (
                  <CardContent className="pt-4 space-y-4">
                    <div>
                      <Input
                        type="number"
                        label="Distance to Site (km)"
                        value={formData.siteDistance}
                        onChange={(e) => setFormData(prev => ({ ...prev, siteDistance: e.target.value }))}
                        placeholder="Enter distance in kilometers"
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        label="Trailer Cost"
                        value={formData.mobDemob}
                        onChange={(e) => setFormData(prev => ({ ...prev, mobDemob: e.target.value }))}
                        placeholder="Enter additional trailer charges"
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        label="Mob Relaxation"
                        value={formData.mobRelaxation}
                        onChange={(e) => setFormData(prev => ({ ...prev, mobRelaxation: e.target.value }))}
                        placeholder="Enter relaxation value (X%)"
                      />
                      <div className="text-sm text-gray-500 mt-1">
                        Enter percentage value for discount on distance cost
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors duration-200" onClick={() => toggleCard('additional')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Settings className="w-5 h-5 text-gray-500" />
                      <CardTitle className="text-lg font-medium">Additional Parameters</CardTitle>
                    </div>
                    {expandedCards.additional ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </CardHeader>
                {expandedCards.additional && (
                  <CardContent className="pt-4 space-y-4">
                    <Select
                      label="Usage"
                      options={USAGE_OPTIONS}
                      value={formData.usage}
                      onChange={(value) => setFormData(prev => ({ ...prev, usage: value }))}
                    />
                    <div className="flex items-center mt-1.5 text-sm text-gray-600">
                      <AlertCircle className="w-4 h-4 mr-1.5" />
                      <span>Usage rates: Light - 5% of base rate | Heavy - 10% of base rate</span>
                    </div>
                    
                    <Select
                      label="Deal Type"
                      options={DEAL_TYPES}
                      value={formData.dealType}
                      onChange={(value) => setFormData(prev => ({ ...prev, dealType: value }))}
                    />
                    
                    <Input
                      type="number"
                      label="Extra Commercial Charges"
                      value={formData.extraCharge}
                      onChange={(e) => setFormData(prev => ({ ...prev, extraCharge: e.target.value }))}
                    />
                    
                    <Select
                      label="Risk Factor"
                      options={RISK_LEVELS}
                      value={formData.riskFactor}
                      onChange={(value) => setFormData(prev => ({ ...prev, riskFactor: value }))}
                    />
                    
                    <div className="flex items-center mt-1.5 text-sm text-gray-600">
                      <AlertCircle className="w-4 h-4 mr-1.5" />
                      <span>Risk rates: Low - 5% | Medium - 10% | High - 15% of base rate</span>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Incidental Charges</label>
                      <div className="space-y-2">
                        {INCIDENTAL_OPTIONS.map(opt => (
                          <label key={opt.value} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 transition-colors duration-200">
                            <input
                              type="checkbox"
                              checked={formData.incidentalCharges.includes(opt.value)}
                              onChange={e => {
                                setFormData(prev => ({
                                  ...prev,
                                  incidentalCharges: e.target.checked
                                    ? [...prev.incidentalCharges, opt.value]
                                    : prev.incidentalCharges.filter(val => val !== opt.value)
                                }));
                              }}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Other Factors</label>
                      <div className="space-y-2">
                        {OTHER_FACTORS.map((factor) => (
                          <label key={factor.value} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 transition-colors duration-200">
                            <input
                              type="checkbox"
                              checked={formData.otherFactors.includes(factor.value)}
                              onChange={e => {
                                setFormData(prev => ({
                                  ...prev,
                                  otherFactors: e.target.checked
                                    ? [...prev.otherFactors, factor.value]
                                    : prev.otherFactors.filter(f => f !== factor.value)
                                }));
                              }}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700">
                              {factor.label}
                              {factor.value === 'rigger' && ' (₹40,000)'}
                              {factor.value === 'helper' && ' (₹12,000)'}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>

            <div className="col-span-5 space-y-6 sticky top-6">
              <Card className="shadow-lg border-0 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
                <CardHeader className="border-b border-gray-100 pb-6">
                  <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-primary-500" />
                    Quotation Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedEquipmentBaseRate > 0 && (
                    <div className="mb-6 p-4 bg-primary-50/50 rounded-xl border border-primary-100">
                      <div className="text-sm font-medium text-primary-900 mb-2">Equipment Details</div>
                      <div className="text-2xl font-bold text-primary-700">
                        ₹{formatCurrency(selectedEquipmentBaseRate).replace('₹', '')}
                        <span className="text-base font-medium text-primary-600 ml-1">
                          {formData.orderType === 'monthly' ? '/month' : '/hr'}
                        </span>
                      </div>
                      <div className="text-sm text-primary-600 mt-1">
                        {formData.orderType.charAt(0).toUpperCase() + formData.orderType.slice(1)} Rate
                      </div>
                      {formData.orderType === 'monthly' && (
                        <div className="mt-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <span>Hourly Rate: </span>
                            <span className="font-medium ml-1">
                              ₹{formatCurrency((selectedEquipmentBaseRate / 26) / (parseFloat(formData.workingHours) || 8)).replace('₹', '')}/hr
                            </span>
                          </div>
                        </div>
                      )}
                      {formData.numberOfDays && (
                        <div className="mt-3 text-sm text-gray-600">
                          <div className="flex justify-between items-center mb-1">
                            <span>Total Days:</span>
                            <span className="font-medium">
                              {Number(formData.numberOfDays) > 25 ? '26 (Monthly)' : formData.numberOfDays}
                            </span>
                          </div>
                          {formData.orderType !== 'monthly' && (
                            <div className="flex justify-between items-center mb-1">
                              <span>Hours per Day:</span>
                              <span className="font-medium">
                                {formData.shift === 'single' ? '8' : formData.workingHours}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between items-center">
                            <span>Order Type:</span>
                            <span className="font-medium">
                              {formData.orderType.charAt(0).toUpperCase() + formData.orderType.slice(1)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary-500" />
                            <span className="text-sm font-medium">Working Cost</span>
                          </div>
                          <span className="font-semibold">{formatCurrency(calculations.workingCost)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary-500 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${(calculations.workingCost / calculations.totalAmount) * 100}%` 
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary-500" />
                            <span className="text-sm font-medium">Food & Accommodation</span>
                          </div>
                          <span className="font-semibold">{formatCurrency(calculations.foodAccomCost)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-success-500 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${(calculations.foodAccomCost / calculations.totalAmount) * 100}%` 
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary-500" />
                            <span className="text-sm font-medium">Usage Load Factor ({formData.usage === 'heavy' ? '10%' : '5%'})</span>
                          </div>
                          <span className="font-semibold">{formatCurrency(calculations.usageLoadFactor)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-warning-500 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${(calculations.usageLoadFactor / calculations.totalAmount) * 100}%` 
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary-500" />
                            <span className="text-sm font-medium">Incidental Charges</span>
                          </div>
                          <span className="font-semibold">{formatCurrency(formData.incidentalCharges.reduce((sum, val) => {
                            const found = INCIDENTAL_OPTIONS.find(opt => opt.value === val);
                            return sum + (found ? found.amount : 0);
                          }, 0))}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-warning-400 rounded-full transition-all duration-300"
                            style={{
                              width: `${((formData.incidentalCharges.reduce((sum, val) => {
                                const found = INCIDENTAL_OPTIONS.find(opt => opt.value === val);
                                return sum + (found ? found.amount : 0);
                              }, 0)) / calculations.totalAmount) * 100}%`
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary-500" />
                            <span className="text-sm font-medium">Other Factors</span>
                          </div>
                          <span className="font-semibold">{formatCurrency((formData.otherFactors.includes('rigger') ? RIGGER_AMOUNT : 0) + (formData.otherFactors.includes('helper') ? HELPER_AMOUNT : 0))}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-success-400 rounded-full transition-all duration-300"
                            style={{
                              width: `${(((formData.otherFactors.includes('rigger') ? RIGGER_AMOUNT : 0) + (formData.otherFactors.includes('helper') ? HELPER_AMOUNT : 0)) / calculations.totalAmount) * 100}%`
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary-500" />
                            <span className="text-sm font-medium">Commercial Charges</span>
                          </div>
                          <span className="font-semibold">{formatCurrency(Number(formData.extraCharge))}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-error-400 rounded-full transition-all duration-300"
                            style={{
                              width: `${((Number(formData.extraCharge) / calculations.totalAmount) * 100)}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Subtotal</span>
                          <span className="font-medium">{formatCurrency(calculations.totalAmount - calculations.gstAmount)}</span>
                        </div>
                        
                        {formData.includeGst && (
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>GST (18%)</span>
                            <span className="font-medium">{formatCurrency(calculations.gstAmount)}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                          <span className="text-lg font-semibold">Total Amount</span>
                          <span className="text-2xl font-bold text-primary-600">
                            {formatCurrency(calculations.totalAmount)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <label className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors duration-200">
                        <input
                          type="checkbox"
                          checked={formData.includeGst}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            includeGst: e.target.checked 
                          }))}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <div>
                          <div className="font-medium text-gray-900">Include GST</div>
                          <div className="text-sm text-gray-500">
                            GST will be calculated at 18% of the total amount
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700"
                >
                  Create Quotation
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>

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