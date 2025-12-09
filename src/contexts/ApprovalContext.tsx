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
  ) => ScheduleChangeRequest;
  applyDirectChange: (
    employeeId: string,
    type: 'time_off' | 'swap' | 'custom_hours',
    date: string,
    swapFrom?: string,
    swapTo?: string,
    customShift?: string,
    customHours?: number
  ) => void;
  revertChange: (employeeId: string, date: string) => void;
  approveRequest: (requestId: string) => void;
  rejectRequest: (requestId: string) => void;
  refreshRequests: () => void;
}

const ApprovalContext = createContext<ApprovalContextType | undefined>(undefined);

export function ApprovalProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<ScheduleChangeRequest[]>([]);
  const { user } = useAuth();
  const { refreshSchedules } = useSchedule();

  useEffect(() => {
    refreshRequests();
  }, []);

  const refreshRequests = () => {
    const allRequests = getChangeRequests();
    setRequests(allRequests);
  };

  const handleCreateRequest = (
    employeeId: string,
    type: 'time_off' | 'swap' | 'custom_hours',
    date: string,
    swapFrom?: string,
    swapTo?: string,
    customShift?: string,
    customHours?: number
  ): ScheduleChangeRequest => {
    const request = createRequest(employeeId, type, date, swapFrom, swapTo, customShift, customHours);
    refreshRequests();
    return request;
  };

  const handleApplyDirectChange = (
    employeeId: string,
    type: 'time_off' | 'swap' | 'custom_hours',
    date: string,
    swapFrom?: string,
    swapTo?: string,
    customShift?: string,
    customHours?: number
  ): void => {
    if (user) {
      applyDirect(employeeId, type, date, swapFrom, swapTo, customShift, customHours, user.id);
      refreshRequests();
      refreshSchedules();
    }
  };

  const handleApproveRequest = (requestId: string) => {
    if (user) {
      approveChangeRequest(requestId, user.id);
      refreshRequests();
      refreshSchedules();
    }
  };

  const handleRejectRequest = (requestId: string) => {
    if (user) {
      rejectChangeRequest(requestId, user.id);
      refreshRequests();
    }
  };

  const handleRevertChange = (employeeId: string, date: string) => {
    revertChange(employeeId, date);
    refreshRequests();
    refreshSchedules();
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

