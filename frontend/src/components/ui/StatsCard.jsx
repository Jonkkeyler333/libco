// Stats Card component for LibCo
const StatsCard = ({ title, value, subtitle, icon, color }) => {
  return (
    <div className={`stats-card ${color || ''}`}>
      <div className="stats-icon">
        <span>{icon}</span>
      </div>
      <div className="stats-content">
        <h3>{value}</h3>
        <span className="stats-title">{title}</span>
        {subtitle && <span className="stats-subtitle">{subtitle}</span>}
      </div>
    </div>
  );
};

export default StatsCard;