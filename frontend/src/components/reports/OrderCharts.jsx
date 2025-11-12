import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { useAuth } from '../../context/AuthContext';
import { reportService } from '../../services/reportService';
import { CHART_COLORS, COMMON_CHART_OPTIONS } from '../../utils/chartConfig';

const OrderCharts = ({ startDate, endDate }) => {
    const [error, setError] = useState(null);
    const [chartData, setChartData] = useState(null);
    const { token } = useAuth();
    useEffect( () => {
        loadData();
    },[startDate,endDate]);
    const loadData = async () => {
        try{
            const data = await reportService.getKPIs(token,startDate,endDate);
            console.log(data);
            setChartData(data);
        }catch(err){
            setError(err.message);
            console.error('Error loading order chart data:', err);
        }
    };
    const barStatusData = () => {
        if (!chartData) return null;
        const labels = Object.keys(chartData.order_status_counts);
        const values = Object.values(chartData.order_status_counts);
        const data = { labels : labels , datasets : [{
            label: 'Cantidad de Órdenes por Estado',
            data : values,
            backgroundColor: CHART_COLORS.primary + '80',
            borderColor: CHART_COLORS.primary,
            borderWidth: 2,
            borderRadius: 5,
            borderSkipped: false,
        }]};
        return data
    };
    const barStatusOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
                text: '📊 Distribución de Órdenes por Estado',
                font: {
                    size: 16,
                    weight: 'bold'
                },
                color: '#1F2937'
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: 'white',
                bodyColor: 'white',
                borderColor: CHART_COLORS.primary,
                borderWidth: 1,
                callbacks: {
                    label: (context) => {
                        const value = context.parsed.y || 0;
                        const status = context.label;
                        return `${status}: ${value} órdenes`;
                    }
                }
            },
            legend: {
                display: false
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                min: 0,
                max: Math.max(...(chartData?.order_status_counts ? Object.values(chartData.order_status_counts) : [5])) + 1,
                ticks: {
                    stepSize: 1,
                    precision: 0,
                    callback: function(value) {
                        return Number.isInteger(value) ? value : '';
                    }
                },
                title: {
                    display: true,
                    text: 'Cantidad de Órdenes',
                    color: '#6B7280'
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Estado de la Orden',
                    color: '#6B7280'
                }
            }
        }
    };
    const barDataProducts = () => {
        if (!chartData) return null;
        const labels = Object.keys(chartData.top_selling_products);
        const values = Object.values(chartData.top_selling_products);
        const data = {labels:labels , datasets : [{
            label: 'Productos Más Vendidos',
            data : values,
            backgroundColor: '#10B981' + '80',
            borderColor: '#10B981',
            borderWidth: 2,
            borderRadius: 5,
            borderSkipped: false,
        }]};
        return data;
    };
    const barOptionsProducts = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
                text: '📓 Productos más vendidos',
                font: {
                    size: 16,
                    weight: 'bold'
                },
                color: '#1F2937'
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: 'white',
                bodyColor: 'white',
                borderColor: CHART_COLORS.primary,
                borderWidth: 1,
                callbacks: {
                    label: (context) => {
                        const value = context.parsed.y || 0;
                        const status = context.label;
                        return `${status}: ${value} órdenes`;
                    }
                }
            },
            legend: {
                display: false
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                min: 0,
                max: Math.max(...(chartData?.top_selling_products ? Object.values(chartData.top_selling_products) : [7])) + 1,
                ticks: {
                    stepSize: 1,
                    precision: 0,
                    callback: function(value) {
                        return Number.isInteger(value) ? value : '';
                    }
                },
                title: {
                    display: true,
                    text: 'Cantidad de Reservas',
                    color: '#6B7280'
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Libros',
                    color: '#6B7280'
                }
            }
        }
    };

    const barData = barStatusData();
    const barDataProductsChart = barDataProducts();
    return (
        <div>
            {error && <div className="text-red-600">Error: {error}</div>}
            <h2 className="bar-chart-title">📊 Resumen de Ventas y Órdenes</h2>
            <table className="kpi-table">
                <thead>
                    <tr>
                        <th>Métrica</th>
                        <th>Valor</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Ventas Totales</td>
                        <td>${chartData ? chartData.total_sales.toLocaleString('es-ES', { maximumFractionDigits: 4 }) : 'Cargando...'}</td>
                    </tr>
                    <tr>
                        <td>Valor Promedio de órdenes</td>
                        <td>${chartData ? (chartData.average_order_value).toLocaleString('es-ES', { maximumFractionDigits: 4 }) : 'Cargando...'}</td>
                    </tr>
                    <tr>
                        <td>Total Órdenes</td>
                        <td>{chartData ? chartData.total_orders : 'Cargando...'}</td>
                    </tr>
                </tbody>
            </table>
            <p className="info-note">Los valores de orden promedio se calculan en base a las órdenes completadas.</p>
            
            <div className="bar-chart-container">
                <h3 className="bar-chart-title">📈 Distribución de Órdenes por Estado</h3>
                {barData && chartData && (
                    <div style={{height:'400px'}}>
                        <Bar data={barData} options={barStatusOptions} />
                    </div>
                )}
            </div>

            <div className="bar-chart-container">
                <h3 className="bar-chart-title">📚 Productos Más Vendidos</h3>
                {barDataProductsChart && chartData && (
                    <div style={{height:'400px'}}>
                        <Bar data={barDataProductsChart} options={barOptionsProducts} />
                    </div>
                )}
            </div>
        </div>

    )

};
export default OrderCharts;