import { useState, useEffect } from 'react';
import { reportService } from '../../services/reportService';
import { useAuth } from '../../context/AuthContext';

const KPICards = () => {
    const {token} = useAuth();
    const [kpiData, setKpiData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadKPIData();
    }, []);

    const loadKPIData = async () => {
        try {
            setLoading(true);
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            startOfMonth.setHours(0, 0, 0, 0);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            endOfMonth.setHours(23, 59, 59, 999);
            
            const currentMonthData = await reportService.getKPIs(token,
                startOfMonth.toISOString(),
                endOfMonth.toISOString()
            );
            const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            prevMonthStart.setHours(0, 0, 0, 0);
            const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
            prevMonthEnd.setHours(23, 59, 59, 999);

            const prevMonthData = await reportService.getKPIs(token,
                prevMonthStart.toISOString(),
                prevMonthEnd.toISOString()
            );
            console.log('KPI Data - Current Month:', currentMonthData);
            console.log('KPI Data - Previous Month:', prevMonthData);
            setKpiData({
                current: currentMonthData,
                previous: prevMonthData
            });
            } catch (err) {
            setError(err.message);
            } finally {
            setLoading(false);
        }
    };

    const calculateChange = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };
    const getChangeColor = (change) => {
        if (change > 0) return 'text-green-600';
        if (change < 0) return 'text-red-600';
        return 'text-gray-500';
    };
    const getChangeIcon = (change) => {
        if (change > 0) return '📈';
        if (change < 0) return '📉';
        return '➖';
    };
    if (loading) {
        return (
        <div className="kpi-cards-container">
            <div className="kpi-cards-grid">
            {[1,2,3,4].map(i => (
                <div key={i} className="kpi-card loading">
                <div className="loading-skeleton"></div>
                </div>
            ))}
            </div>
        </div>
        );
    }
    if (error) {
        return (
        <div className="error-message">
            <p>⚠️ Error al cargar KPIs: {error}</p>
            <button onClick={loadKPIData} className="retry-button">🔄 Reintentar</button>
        </div>
        );
    }
    const { current, previous } = kpiData;
    const salesChange = calculateChange(current.total_sales, previous.total_sales);
    const ordersChange = calculateChange(current.total_orders, previous.total_orders);
    const avgChange = calculateChange(current.average_order_value, previous.average_order_value);
    const completedCurrent = current.order_status_counts.completed || 0;
    const completedPrev = previous.order_status_counts.completed || 0;
    const completedChange = calculateChange(completedCurrent, completedPrev);
    return (
        <div className="kpi-cards-container">
        <div className="kpi-cards-grid">
            <div className="kpi-card sales-card">
            <div className="kpi-card-header">
                <div className="kpi-icon">💰</div>
                <div className="kpi-title">Ventas Totales</div>
            </div>
            <div className="kpi-value">
                ${current.total_sales.toLocaleString('es-ES', { maximumFractionDigits: 2 })}
            </div>
            <div className="kpi-change">
                <span className={`change-percentage ${getChangeColor(salesChange)}`}>
                {getChangeIcon(salesChange)} {Math.abs(salesChange).toFixed(1)}%
                </span>
                <span className="change-period">vs mes anterior</span>
            </div>
            </div>
            <div className="kpi-card orders-card">
            <div className="kpi-card-header">
                <div className="kpi-icon">📦</div>
                <div className="kpi-title">Total Órdenes</div>
            </div>
            <div className="kpi-value">
                {current.total_orders}
            </div>
            <div className="kpi-change">
                <span className={`change-percentage ${getChangeColor(ordersChange)}`}>
                {getChangeIcon(ordersChange)} {Math.abs(ordersChange).toFixed(1)}%
                </span>
                <span className="change-period">vs mes anterior</span>
            </div>
            </div>
            <div className="kpi-card avg-card">
            <div className="kpi-card-header">
                <div className="kpi-icon">🎯</div>
                <div className="kpi-title">Valor Promedio</div>
            </div>
            <div className="kpi-value">
                ${current.average_order_value.toLocaleString('es-ES', { maximumFractionDigits: 2 })}
            </div>
            <div className="kpi-change">
                <span className={`change-percentage ${getChangeColor(avgChange)}`}>
                {getChangeIcon(avgChange)} {Math.abs(avgChange).toFixed(1)}%
                </span>
                <span className="change-period">vs mes anterior</span>
            </div>
            </div>
            <div className="kpi-card completed-card">
            <div className="kpi-card-header">
                <div className="kpi-icon">✅</div>
                <div className="kpi-title">Órdenes Completadas</div>
            </div>
            <div className="kpi-value">
                {completedCurrent}
            </div>
            <div className="kpi-change">
                <span className={`change-percentage ${getChangeColor(completedChange)}`}>
                {getChangeIcon(completedChange)} {Math.abs(completedChange).toFixed(1)}%
                </span>
                <span className="change-period">vs mes anterior</span>
            </div>
            </div>

        </div>
        </div>
    );
};
export default KPICards;