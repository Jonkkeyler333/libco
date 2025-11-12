const MonthYearPicker = ({ value, onChange, maxDate = new Date() }) => {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({length: 3}, (_, i) => currentYear - i);

  return (
    <div className="period-selector">
      <select 
        value={value.getMonth()} 
        onChange={(e) => onChange(new Date(value.getFullYear(), parseInt(e.target.value), 1))}
        className="month-selector"
      >
        {months.map((month, index) => (
          <option key={index} value={index}>{month}</option>
        ))}
      </select>
      
      <select 
        value={value.getFullYear()} 
        onChange={(e) => onChange(new Date(parseInt(e.target.value), value.getMonth(), 1))}
        className="year-selector"
      >
        {years.map(year => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>
      
      <button 
        onClick={() => onChange(new Date())}
        className="current-month-btn"
      >
        📅 Mes Actual
      </button>
    </div>
  );
};
export default MonthYearPicker;