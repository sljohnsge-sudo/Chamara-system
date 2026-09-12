import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import JobOpeningForm from './components/JobOpeningForm';
import JobCardList from './components/JobCardList';
import InventoryManager from './components/InventoryManager';
import QuotationManager from './components/QuotationManager';
import CustomerHistory from './components/CustomerHistory';
import JobDetailModal from './components/JobDetailModal';
import QuotationDetailModal from './components/QuotationDetailModal';
import LoginPage from './components/LoginPage';
import ManagerDashboard from './components/ManagerDashboard';
import { getJobCards } from './services/api';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('peugeot_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState(() => {
    const saved = sessionStorage.getItem('peugeot_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.role === 'Workshop Manager') return 'dashboard';
      if (parsed.role === 'Master Technician' || parsed.role === 'Technician') return 'jobs-list';
      if (parsed.role === 'Inventory Officer') return 'inventory';
    }
    return 'new-job';
  });

  const [openJobsCount, setOpenJobsCount] = useState(0);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedJobStage, setSelectedJobStage] = useState('work-stage');
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [quotationToConvert, setQuotationToConvert] = useState(null);

  const handleOpenJobModal = (jobOrId, stage = 'work-stage') => {
    const id = typeof jobOrId === 'object' && jobOrId !== null ? jobOrId.id : jobOrId;
    setSelectedJobId(id);
    setSelectedJobStage(stage);
  };

  const fetchActiveJobsCount = () => {
    if (!user) return;
    getJobCards()
      .then(res => {
        const active = res.data.filter(j => j.status !== 'Completed' && j.status !== 'Delivered');
        setOpenJobsCount(active.length);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    if (user) {
      fetchActiveJobsCount();
      if (user.role === 'Workshop Manager' && activeTab === 'new-job') {
        setActiveTab('dashboard');
      } else if ((user.role === 'Master Technician' || user.role === 'Technician') && (activeTab === 'dashboard' || activeTab === 'inventory')) {
        setActiveTab('jobs-list');
      }
    }
  }, [user]);

  const handleLogin = (userData) => {
    setUser(userData);
    sessionStorage.setItem('peugeot_user', JSON.stringify(userData));
    if (userData.role === 'Workshop Manager') {
      setActiveTab('dashboard');
    } else if (userData.role === 'Master Technician' || userData.role === 'Technician') {
      setActiveTab('jobs-list');
    } else if (userData.role === 'Inventory Officer') {
      setActiveTab('inventory');
    } else {
      setActiveTab('new-job');
    }
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('peugeot_user');
  };

  const handleJobCreated = (newJob) => {
    fetchActiveJobsCount();
    setSelectedJobId(newJob.id);
    setSelectedJobStage('work-stage');
    setQuotationToConvert(null);
  };

  const handleOpenJobInEditor = (job) => {
    setSelectedJobId(null);
    setSelectedQuotation(null);
    setQuotationToConvert(job);
    setActiveTab('new-job');
  };

  const handleConvertToJob = (quotation) => {
    setSelectedJobId(null);
    setSelectedQuotation(null);
    setQuotationToConvert(quotation);
    setActiveTab('new-job');
  };

  // Render Login Page if user is not logged in
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const isModalOpen = selectedJobId || selectedQuotation;

  return (
    <div className="min-h-screen pb-16 px-4 sm:px-6 lg:px-8 w-full pt-4">
      
      {/* Navigation Bar - Hidden on Print */}
      <div className="no-print">
        <Navbar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if (tab !== 'new-job') setQuotationToConvert(null);
            setActiveTab(tab);
          }}
          openJobsCount={openJobsCount}
          user={user}
          onLogout={handleLogout}
        />
      </div>

      {/* Main Content Area - Hidden on Print when any Modal is active */}
      <main className={isModalOpen ? 'no-print' : ''}>
        {activeTab === 'dashboard' && (user.role === 'Workshop Manager' || user.role === 'Admin') && (
          <ManagerDashboard
            onNavigate={(tab) => setActiveTab(tab)}
            onViewJob={(jobId, stage) => handleOpenJobModal(jobId, stage || 'invoice-stage')}
          />
        )}

        {activeTab === 'new-job' && (
          <JobOpeningForm 
            onJobCreated={handleJobCreated} 
            initialData={quotationToConvert}
            onClearInitialData={() => setQuotationToConvert(null)}
          />
        )}

        {activeTab === 'jobs-list' && (
          <JobCardList 
            onViewJob={(job, stage) => handleOpenJobModal(job, stage)}
            onOpenJobInEditor={handleOpenJobInEditor}
          />
        )}

        {activeTab === 'quotations' && (
          <QuotationManager 
            onViewQuotation={(q) => setSelectedQuotation(q)}
            onConvertToJob={handleConvertToJob} 
          />
        )}

        {activeTab === 'customers' && (
          <CustomerHistory
            onViewJob={(jobId, stage) => handleOpenJobModal(jobId, stage || 'work-stage')}
            onViewQuotation={(q) => setSelectedQuotation(q)}
            onConvertToJob={handleConvertToJob}
            onOpenNewJobForCustomer={(customer) => {
              setQuotationToConvert({
                customer_name: customer.name,
                customer_phone: customer.phone,
                customer_email: customer.email,
                customer_address: customer.address
              });
              setActiveTab('new-job');
            }}
          />
        )}

        {activeTab === 'inventory' && user.role !== 'Master Technician' && user.role !== 'Technician' && (
          <InventoryManager />
        )}
      </main>

      {/* Official Peugeot Land Invoice / Work Order Modal */}
      {selectedJobId && (
        <JobDetailModal
          jobId={selectedJobId}
          initialStage={selectedJobStage}
          onClose={() => setSelectedJobId(null)}
          onRefresh={fetchActiveJobsCount}
        />
      )}

      {/* Official Peugeot Land Quotation / Estimate Modal */}
      {selectedQuotation && (
        <QuotationDetailModal
          quotation={selectedQuotation}
          onClose={() => setSelectedQuotation(null)}
          onConvertToJob={handleConvertToJob}
        />
      )}

    </div>
  );
}
