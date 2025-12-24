import type { ScheduleChangeRequest } from '../types';
import { addChangeRequest, updateChangeRequest, getChangeRequests } from './storage';
import { applyApprovedChange, revertScheduleChange } from './schedule';

/**
 * Create a new change request
 */
export async function createChangeRequest(
  employeeId: string,
  type: 'time_off' | 'swap' | 'custom_hours',
  date: string,
  swapFrom?: string,
  swapTo?: string,
  customShift?: string,
  customHours?: number
): Promise<ScheduleChangeRequest> {
  const request: ScheduleChangeRequest = {
    id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    employeeId,
    type,
    date,
    swapFrom,
    swapTo,
    customShift,
    customHours,
    status: 'pending',
    requestedAt: new Date().toISOString(),
  };
  
  await addChangeRequest(request);
  return request;
}

/**
 * Approve a change request
 */
export async function approveChangeRequest(requestId: string, approvedBy: string): Promise<void> {
  const requests = await getChangeRequests();
  const request = requests.find(req => req.id === requestId);
  
  if (request && request.status === 'pending') {
    await updateChangeRequest(requestId, {
      status: 'approved',
      approvedBy,
      approvedAt: new Date().toISOString(),
    });
    
    // Apply the change to the schedule
    await applyApprovedChange(request.employeeId, {
      type: request.type,
      date: request.date,
      swapFrom: request.swapFrom,
      swapTo: request.swapTo,
      customShift: request.customShift,
      customHours: request.customHours,
    });
  }
}

/**
 * Reject a change request
 */
export async function rejectChangeRequest(requestId: string, approvedBy: string): Promise<void> {
  await updateChangeRequest(requestId, {
    status: 'rejected',
    approvedBy,
    approvedAt: new Date().toISOString(),
  });
}

/**
 * Get pending change requests
 */
export async function getPendingRequests(): Promise<ScheduleChangeRequest[]> {
  const requests = await getChangeRequests();
  return requests.filter(req => req.status === 'pending');
}

/**
 * Get change requests for an employee
 */
export async function getEmployeeRequests(employeeId: string): Promise<ScheduleChangeRequest[]> {
  const requests = await getChangeRequests();
  return requests.filter(req => req.employeeId === employeeId);
}

/**
 * Directly apply a schedule change (for admins - no approval needed)
 */
export async function applyDirectChange(
  employeeId: string,
  type: 'time_off' | 'swap' | 'custom_hours',
  date: string,
  swapFrom?: string,
  swapTo?: string,
  customShift?: string,
  customHours?: number,
  appliedBy?: string
): Promise<void> {
  // Use provided appliedBy or default
  const appliedById = appliedBy || 'admin';
  
  // Apply the change immediately
  await applyApprovedChange(employeeId, {
    type,
    date,
    swapFrom,
    swapTo,
    customShift,
    customHours,
  });
  
  // Also create an approved request record for tracking
  const request: ScheduleChangeRequest = {
    id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    employeeId,
    type,
    date,
    swapFrom,
    swapTo,
    customShift,
    customHours,
    status: 'approved',
    requestedAt: new Date().toISOString(),
    approvedBy: appliedById,
    approvedAt: new Date().toISOString(),
  };
  
  await addChangeRequest(request);
}

/**
 * Revert a schedule change (remove approved change and restore original pattern)
 */
export async function revertChange(employeeId: string, date: string): Promise<void> {
  await revertScheduleChange(employeeId, date);
}

