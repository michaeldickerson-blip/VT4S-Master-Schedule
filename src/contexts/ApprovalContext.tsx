import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { ScheduleChangeRequest } from '../types';
import { getChangeRequests } from '../services/storage';
import { approveChangeRequest, rejectChangeRequest, createChangeRequest as createRequest, applyDirectChange as applyDirect, revertChange } from '../services/approvals';
import { useAuth } from './AuthContext';
import { useSchedule } from './ScheduleContext';

interface ApprovalContextType {
  pendingRequests: ScheduleChangeRequest[];
  allRequests: ScheduleChangeRequest[];
  createChangeRequest: (
    employeeId: string,
    type: 'time_off' | 'swap' | 'custom_hours',
    date: string,
    swapFrom?: string,
    swapTo?: string,
    customShift?: string,
    customHours?: number
  ) => Promise<ScheduleChangeRequest>;
  applyDirectChange: (
    employeeId: string,
    type: 'time_off' | 'swap' | 'custom_hours',
    date: string,
    swapFrom?: string,
    swapTo?: string,
    customShift?: string,
    customHours?: number
  ) => Promise<void>;
  revertChange: (employeeId: string, date: string) => Promise<void>;
  approveRequest: (requestId: string) => Promise<void>;
  rejectRequest: (requestId: string) => Promise<void>;
  refreshRequests: () => Promise<void>;
}

const ApprovalContext = createContext<ApprovalContextType | undefined>(undefined);

export function ApprovalProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<ScheduleChangeRequest[]>([]);
  const { user } = useAuth();
  const { refreshSchedules } = useSchedule();

  useEffect(() => {
    refreshRequests();
  }, []);

  const refreshRequests = async () => {
    try {
      const allRequests = await getChangeRequests();
      setRequests(allRequests);
    } catch (error) {
      console.error('Error refreshing requests:', error);
    }
  };

  const handleCreateRequest = async (
    employeeId: string,
    type: 'time_off' | 'swap' | 'custom_hours',
    date: string,
    swapFrom?: string,
    swapTo?: string,
    customShift?: string,
    customHours?: number
  ): Promise<ScheduleChangeRequest> => {
    const request = await createRequest(employeeId, type, date, swapFrom, swapTo, customShift, customHours);
    await refreshRequests();
    return request;
  };

  const handleApplyDirectChange = async (
    employeeId: string,
    type: 'time_off' | 'swap' | 'custom_hours',
    date: string,
    swapFrom?: string,
    swapTo?: string,
    customShift?: string,
    customHours?: number
  ): Promise<void> => {
    if (user) {
      await applyDirect(employeeId, type, date, swapFrom, swapTo, customShift, customHours, user.id);
      await refreshRequests();
      await refreshSchedules();
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    if (user) {
      await approveChangeRequest(requestId, user.id);
      await refreshRequests();
      await refreshSchedules();
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (user) {
      await rejectChangeRequest(requestId, user.id);
      await refreshRequests();
    }
  };

  const handleRevertChange = async (employeeId: string, date: string) => {
    await revertChange(employeeId, date);
    await refreshRequests();
    await refreshSchedules();
  };

  const value: ApprovalContextType = {
    pendingRequests: requests.filter(req => req.status === 'pending'),
    allRequests: requests,
    createChangeRequest: handleCreateRequest,
    applyDirectChange: handleApplyDirectChange,
    revertChange: handleRevertChange,
    approveRequest: handleApproveRequest,
    rejectRequest: handleRejectRequest,
    refreshRequests,
  };

  return <ApprovalContext.Provider value={value}>{children}</ApprovalContext.Provider>;
}

export function useApproval() {
  const context = useContext(ApprovalContext);
  if (context === undefined) {
    throw new Error('useApproval must be used within an ApprovalProvider');
  }
  return context;
}

