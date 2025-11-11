import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { useAuth } from '../../context/AuthContext';
import { reportService } from '../../services/reportService';
import { CHART_COLORS, COMMON_CHART_OPTIONS } from '../../utils/chartConfig';
import '../../utils/chartConfig';

const SalesChart = () => {
    const { user, token } = useAuth();
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadChartData();
    }, []);

    const loadChartData = async () => {
        try {
        setLoading(true);
        const monthlyData = await reportService.getMonthlyData(token,6);
        console.log('Monthly data fetched for chart:', monthlyData);
        const chartDataset = {
            labels: monthlyData.map(item => item.month),
            datasets: [
            {
                label: 'Ventas ($) COP',
                data: monthlyData.map(item => item.total_sales),
                borderColor: CHART_COLORS.primary,
                backgroundColor: CHART_COLORS.primary + '20', 
                borderWidth: 3,
                pointBackgroundColor: CHART_COLORS.primary,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
                tension: 0.4, // Líneas curvas suaves
                fill: true,   // Rellenar área bajo la línea
            },
            {
                label: 'Órdenes',
                data: monthlyData.map(item => item.total_orders),
                borderColor: CHART_COLORS.secondary,
                backgroundColor: CHART_COLORS.secondary + '20',
                borderWidth: 3,
                pointBackgroundColor: CHART_COLORS.secondary,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
                tension: 0.4,
                yAxisID: 'y1', // Eje Y secundario para órdenes
            }
            ]
        };
            setChartData(chartDataset);
        } catch (err) {
            setError(err.message);
            console.error('Error loading chart data:', err);
        } finally {
            setLoading(false);
        }
    };
    const chartOptions = {
        ...COMMON_CHART_OPTIONS,
        plugins: {
        ...COMMON_CHART_OPTIONS.plugins,
        title: {
            display: true,
            text: '📈 Evolución de Ventas y Órdenes',
            font: {
            size: 18,
            weight: 'bold'
            },
            color: '#1F2937'
        },
        tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
            label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                label += ': ';
                }
                if (context.dataset.label === 'Ventas ($)') {
                label += new Intl.NumberFormat('es-ES', {
                    style: 'currency',
                    currency: 'USD'
                }).format(context.parsed.y);
                } else {
                label += context.parsed.y + ' órdenes';
                }
                return label;
            }
            }
        }
        },
        scales: {
        ...COMMON_CHART_OPTIONS.scales,
        y: {
            ...COMMON_CHART_OPTIONS.scales.y,
            type: 'linear',
            display: true,
            position: 'left',
            title: {
            display: true,
            text: 'Ventas ($)',
            color: CHART_COLORS.primary
            }
        },
        y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
            display: true,
            text: 'Número de Órdenes',
            color: CHART_COLORS.secondary
            },
            grid: {
            drawOnChartArea: false, // Solo muestra grid del eje Y principal
            },
        }
        },
        interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
        }
    };

    if (loading) {
        return (
        <div className="sales-chart-container">
            <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Cargando datos de ventas...</p>
            </div>
        </div>
        );
    }

    if (error) {
        return (
        <div className="sales-chart-container">
            <div className="error-message">
            <p>⚠️ Error: {error}</p>
            <button onClick={loadChartData} className="retry-button">
                🔄 Reintentar
            </button>
            </div>
        </div>
        );
    }

    return (
        <div className="sales-chart-container">
        <div className="chart-wrapper">
            {chartData && (
            <Line data={chartData} options={chartOptions} />
            )}
        </div>
        </div>
    );
};

export default SalesChart;