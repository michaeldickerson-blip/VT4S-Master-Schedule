import type { ScheduleChangeRequest } from '../types';
import { addChangeRequest, updateChangeRequest, getChangeRequests } from './storage';
import { applyApprovedChange, revertScheduleChange } from './schedule';

/**
 * Create a new change request
 */
export function createChangeRequest(
  employeeId: string,
  type: 'time_off' | 'swap' | 'custom_hours',
  date: string,
  swapFrom?: string,
  swapTo?: string,
  customShift?: string,
  customHours?: number
): ScheduleChangeRequest {
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
  
  addChangeRequest(request);
  return request;
}

/**
 * Approve a change request
 */
export function approveChangeRequest(requestId: string, approvedBy: string): void {
  const requests = getChangeRequests();
  const request = requests.find(req => req.id === requestId);
  
  if (request && request.status === 'pending') {
    updateChangeRequest(requestId, {
      status: 'approved',
      approvedBy,
      approvedAt: new Date().toISOString(),
    });
    
    // Apply the change to the schedule
    applyApprovedChange(request.employeeId, {
      type: request.type,
      date: request.date,
      swapFrom: request.swapFrom,
      swapTo: request.swapTo,
    });
  }
}

/**
 * Reject a change request
 */
export function rejectChangeRequest(requestId: string, approvedBy: string): void {
  updateChangeRequest(requestId, {
    status: 'rejected',
    approvedBy,
    approvedAt: new Date().toISOString(),
  });
}

/**
 * Get pending change requests
 */
export function getPendingRequests(): ScheduleChangeRequest[] {
  return getChangeRequests().filter(req => req.status === 'pending');
}

/**
 * Get change requests for an employee
 */
export function getEmployeeRequests(employeeId: string): ScheduleChangeRequest[] {
  return getChangeRequests().filter(req => req.employeeId === employeeId);
}

/**
 * Directly apply a schedule change (for admins - no approval needed)
 */
export function applyDirectChange(
  employeeId: string,
  type: 'time_off' | 'swap' | 'custom_hours',
  date: string,
  swapFrom?: string,
  swapTo?: string,
  customShift?: string,
  customHours?: number,
  appliedBy?: string
): void {
  // Use provided appliedBy or default
  const appliedById = appliedBy || 'admin';
  
  // Apply the change immediately
  applyApprovedChange(employeeId, {
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
  
  addChangeRequest(request);
}

/**
 * Revert a schedule change (remove approved change and restore original pattern)
 */
export function revertChange(employeeId: string, date: string): void {
  revertScheduleChange(employeeId, date);
}

