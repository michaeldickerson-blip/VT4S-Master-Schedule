import { format } from 'date-fns';
import { parseISO } from 'date-fns';
import { useApproval } from '../../contexts/ApprovalContext';
import { useSchedule } from '../../contexts/ScheduleContext';
import type { ScheduleChangeRequest } from '../../types';
import './ApprovalModal.css';

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ScheduleChangeRequest | null;
}

export function ApprovalModal({ isOpen, onClose, request }: ApprovalModalProps) {
  const { approveRequest, rejectRequest } = useApproval();
  const { employees } = useSchedule();

  if (!isOpen || !request) return null;

  const employee = employees.find(emp => emp.id === request.employeeId);

  const handleApprove = () => {
    approveRequest(request.id);
    onClose();
  };

  const handleReject = () => {
    if (confirm('Are you sure you want to reject this request?')) {
      rejectRequest(request.id);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Review Schedule Change Request</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="request-details">
            <p>
              <strong>Employee:</strong> {employee?.name || 'Unknown'}
            </p>
            <p>
              <strong>Type:</strong>{' '}
              {request.type === 'time_off' 
                ? 'Time Off Request' 
                : request.type === 'custom_hours'
                ? 'Custom Hours Request'
                : 'Day Swap Request'}
            </p>
            <p>
              <strong>Date:</strong> {format(parseISO(request.date), 'EEEE, MMMM d, yyyy')}
            </p>
            {request.type === 'swap' && request.swapTo && (
              <p>
                <strong>Swap To:</strong>{' '}
                {format(parseISO(request.swapTo), 'EEEE, MMMM d, yyyy')}
              </p>
            )}
            {request.type === 'custom_hours' && (
              <>
                <p>
                  <strong>Custom Shift:</strong> {request.customShift || 'N/A'}
                </p>
                <p>
                  <strong>Custom Hours:</strong> {request.customHours || 0}h
                </p>
              </>
            )}
            <p>
              <strong>Requested:</strong>{' '}
              {format(parseISO(request.requestedAt), 'MMM d, yyyy h:mm a')}
            </p>
            <p>
              <strong>Status:</strong>{' '}
              <span className={`status-badge status-${request.status}`}>
                {request.status}
              </span>
            </p>
          </div>

          {request.status === 'pending' && (
            <div className="modal-actions">
              <button onClick={handleReject} className="reject-button">
                Reject
              </button>
              <button onClick={handleApprove} className="approve-button">
                Approve
              </button>
            </div>
          )}

          {request.status !== 'pending' && (
            <div className="modal-actions">
              <button onClick={onClose} className="close-action-button">
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

