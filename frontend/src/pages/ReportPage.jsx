import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {useNavigate} from 'react-router-dom';
import SalesChart from '../components/reports/SalesChart';
import OrderCharts from '../components/reports/OrderCharts';
import MonthYearPicker from '../components/reports/MonthYearPicker';
import '../styles/Report.css';
import '../styles/ReportPage.css';

const ReportPage = () => {
    const navigate = useNavigate();
    const {user,isAdmin} = useAuth();
    const [selectedPeriod, setSelectedPeriod] = useState(
        new Date(2025, 11, 1)
    );

    const getPeriodRange = (date) => {
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        return {
            startDate: startOfMonth.toISOString(),
            endDate: endOfMonth.toISOString()
        };
    };

  const { startDate, endDate } = getPeriodRange(selectedPeriod);

    return (
        <div className="report-page-container">
            {!isAdmin() ? (
                <div className="permission-denied">
                    <h1>🚫 No tienes permiso de estar acá !!!</h1>
                    <p>⚠️ Contacta a un administrador para más información.</p>
                </div>
            ) : (
                <>
                    <header className="report-header">
                        <h1 className="report-title">
                            <span className="emoji">🧮</span> 
                            Centro de Reportes LibCo
                        </h1>
                        <p className="report-greeting">
                            Hola {user.name} 👋🏽
                        </p>
                        <p className="report-subtitle">
                            Primero un vistazo rápido de cómo van las cosas
                        </p>
                        <button 
                            onClick={() => navigate('/')}
                            className="report-back-button"
                        >
                            <span className="arrow-icon">←</span> Volver al Dashboard
                        </button>
                    </header>

                    <section className="chart-section">
                        <SalesChart />
                    </section>

                    <div className="info-text">
                        Recuerda que puedes filtrar los datos por fecha.
                    </div>

                    <section className="date-controls-section">
                        <h3 className="date-controls-title">
                            📅 Filtros de Período
                        </h3>
                        <div className="date-controls-container">
                            <MonthYearPicker 
                                value={selectedPeriod} 
                                onChange={setSelectedPeriod} 
                                maxDate={new Date()}
                            />
                            <button className="date-info-button">
                                📊🗓️ Estas viendo desde: {startDate.split('T')[0]} hasta: {endDate.split('T')[0]}
                            </button>
                        </div>
                    </section>
                    <section className="chart-section">
                        <OrderCharts startDate={startDate} endDate={endDate} />
                    </section>
                </>
            )}
        </div>
    );
};
export default ReportPage;