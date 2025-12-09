import './HistoricalToggle.css';

interface HistoricalToggleProps {
  showHistorical: boolean;
  onToggle: (show: boolean) => void;
}

export function HistoricalToggle({ showHistorical, onToggle }: HistoricalToggleProps) {
  return (
    <div className="historical-toggle">
      <label className="toggle-label">
        <input
          type="checkbox"
          checked={showHistorical}
          onChange={(e) => onToggle(e.target.checked)}
        />
        <span className="toggle-text">Show Historical Weeks</span>
      </label>
    </div>
  );
}

