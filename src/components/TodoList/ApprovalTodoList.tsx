import { useState } from 'react';
import { useApproval } from '../../contexts/ApprovalContext';
import { useSchedule } from '../../contexts/ScheduleContext';
import { format } from 'date-fns';
import { parseISO } from 'date-fns';
import { ApprovalModal } from '../Modals/ApprovalModal';
import type { ScheduleChangeRequest } from '../../types';
import './ApprovalTodoList.css';

export function ApprovalTodoList() {
  const { pendingRequests } = useApproval();
  const { employees } = useSchedule();
  const [selectedRequest, setSelectedRequest] = useState<ScheduleChangeRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRequestClick = (request: ScheduleChangeRequest) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee?.name || 'Unknown';
  };

  if (pendingRequests.length === 0) {
    return (
      <div className="todo-list-empty">
        <p>No pending approvals</p>
      </div>
    );
  }

  return (
    <>
      <div className="approval-todo-list">
        <h3>Pending Approvals ({pendingRequests.length})</h3>
        <ul>
          {pendingRequests.map((request) => (
            <li
              key={request.id}
              className="todo-item"
              onClick={() => handleRequestClick(request)}
            >
              <div className="todo-item-header">
                <span className="employee-name">{getEmployeeName(request.employeeId)}</span>
                <span className="request-type">
                  {request.type === 'time_off' 
                    ? 'Time Off' 
                    : request.type === 'custom_hours'
                    ? 'Custom Hours'
                    : 'Swap'}
                </span>
              </div>
              <div className="todo-item-details">
                <span className="request-date">
                  {format(parseISO(request.date), 'MMM d')}
                </span>
                {request.type === 'swap' && request.swapTo && (
                  <>
                    <span className="swap-arrow">↔</span>
                    <span className="request-date">
                      {format(parseISO(request.swapTo), 'MMM d')}
                    </span>
                  </>
                )}
                {request.type === 'custom_hours' && (
                  <span className="custom-hours-info">
                    {request.customShift} ({request.customHours}h)
                  </span>
                )}
              </div>
              <div className="todo-item-time">
                {format(parseISO(request.requestedAt), 'MMM d, h:mm a')}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <ApprovalModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
      />
    </>
  );
}

