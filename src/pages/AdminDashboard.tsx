import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  IndianRupee, 
  Truck, 
  Users, 
  Settings, 
  MapPin,
  Activity,
  FileText,
  Calendar
} from 'lucide-react';
import { StatCard } from '../components/dashboard/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import { getLeads } from '../services/leadService';
import { getJobs, getAllOperators } from '../services/jobService';
import { getEquipment as getAllEquipment } from '../services/firestore/equipmentService';
import { getDeals } from '../services/dealService';
import { Lead } from '../types/lead';
import { Job } from '../types/job';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils/formatters';
import { Equipment } from '../types/equipment';
import { Deal } from '../types/deal';

export function AdminDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [equipmentCount, setEquipmentCount] = useState(0);
  const [operatorCount, setOperatorCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leadsData, jobsData, equipmentData, operatorsData, dealsData] = await Promise.all([
          getLeads(),
          getJobs(),
          getAllEquipment(),
          getAllOperators(),
          getDeals(),
        ]);
        
        setLeads(leadsData);
        setJobs(jobsData);
        setEquipmentCount(equipmentData.length);
        setOperatorCount(operatorsData.length);
        setEquipment(equipmentData);
        setDeals(dealsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Calculate KPIs
  const totalRevenue = jobs
    .filter(job => job.status === 'completed')
    .length * 50000; // Mock average revenue per job in INR
  
  const equipmentUtilization = jobs.filter(
    job => job.status === 'in_progress' || job.status === 'scheduled'
  ).length / equipmentCount * 100;
  
  // Equipment status counts
  const availableCount = equipment.filter(e => e.status === 'available').length;
  const inUseCount = equipment.filter(e => e.status === 'in_use').length;
  const maintenanceCount = equipment.filter(e => e.status === 'maintenance').length;
  
  // Deal conversion calculation
  const dealConversion = leads.length > 0 ? (deals.length / leads.length) * 100 : 0;
  
  if (isLoading) {
    return <div className="flex justify-center py-10">Loading dashboard...</div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={<IndianRupee className="h-5 w-5 text-primary-600" />}
          variant="primary"
          trend={{ value: 15, isPositive: true }}
        />
        <StatCard
          title="Equipment Utilization"
          value={`${Math.round(equipmentUtilization)}%`}
          icon={<Truck className="h-5 w-5 text-secondary-600" />}
          variant="secondary"
        />
        <StatCard
          title="Deal Conversion"
          value={`${Math.round(dealConversion)}%`}
          icon={<Activity className="h-5 w-5 text-success-600" />}
          variant="success"
        />
        <StatCard
          title="Active Operators"
          value={operatorCount}
          icon={<Users className="h-5 w-5 text-accent-600" />}
          variant="accent"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Recent Jobs</CardTitle>
                <Link to="/jobs">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {jobs.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent jobs</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Start Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {jobs.slice(0, 5).map((job) => (
                        <tr key={job.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{job.customerName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{job.location}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {new Date(job.startDate).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={job.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Link to="/quotations" className="group">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full h-auto py-3 px-4 flex flex-col items-center gap-2 hover:border-primary-500 transition-colors"
                  >
                    <FileText size={20} className="text-gray-500 group-hover:text-primary-500" />
                    <span>Quotation</span>
                  </Button>
                </Link>
                <Link to="/config/equipment" className="group">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full h-auto py-3 px-4 flex flex-col items-center gap-2 hover:border-primary-500 transition-colors"
                  >
                    <Truck size={20} className="text-gray-500 group-hover:text-primary-500" />
                    <span>Equipment</span>
                  </Button>
                </Link>
                <Link to="/customers" className="group">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full h-auto py-3 px-4 flex flex-col items-center gap-2 hover:border-primary-500 transition-colors"
                  >
                    <Users size={20} className="text-gray-500 group-hover:text-primary-500" />
                    <span>Customers</span>
                  </Button>
                </Link>
                <Link to="/jobs" className="group">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full h-auto py-3 px-4 flex flex-col items-center gap-2 hover:border-primary-500 transition-colors"
                  >
                    <Calendar size={20} className="text-gray-500 group-hover:text-primary-500" />
                    <span>Jobs</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Lead Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center px-4 py-6">
              <div className="flex-1 flex flex-col items-center">
                <div className="text-sm text-gray-500 mb-1">New</div>
                <div className="text-3xl font-bold text-gray-900">{leads.filter(l => l.status === 'new').length}</div>
              </div>
              <div className="h-10 w-px bg-gray-200 mx-2" />
              <div className="flex-1 flex flex-col items-center">
                <div className="text-sm text-gray-500 mb-1 text-center">In Process</div>
                <div className="text-3xl font-bold text-gray-900">{leads.filter(l => l.status === 'in_process').length}</div>
              </div>
              <div className="h-10 w-px bg-gray-200 mx-2" />
              <div className="flex-1 flex flex-col items-center">
                <div className="text-sm text-gray-500 mb-1">Qualified</div>
                <div className="text-3xl font-bold text-gray-900">{leads.filter(l => l.status === 'qualified').length}</div>
              </div>
              <div className="h-10 w-px bg-gray-200 mx-2" />
              <div className="flex-1 flex flex-col items-center">
                <div className="text-sm text-gray-500 mb-1">Unqualified</div>
                <div className="text-3xl font-bold text-gray-900">{leads.filter(l => l.status === 'unqualified').length}</div>
              </div>
              <div className="h-10 w-px bg-gray-200 mx-2" />
              <div className="flex-1 flex flex-col items-center">
                <div className="text-sm text-gray-500 mb-1">Lost</div>
                <div className="text-3xl font-bold text-gray-900">{leads.filter(l => l.status === 'lost').length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Equipment Availability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
                <span className="font-medium text-gray-700">{availableCount} Available</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>
                <span className="font-medium text-gray-700">{inUseCount} In Use</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-block w-3 h-3 rounded-full bg-yellow-500"></span>
                <span className="font-medium text-gray-700">{maintenanceCount} Under Maintenance</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}