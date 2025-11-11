import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,    // Para ejes X (fechas, categorías)
  LinearScale,      // Para ejes Y (números)
  PointElement,     // Puntos en gráficos de línea
  LineElement,      // Líneas conectoras
  BarElement,       // Barras
  ArcElement,       // Para gráficos circulares
  Title,            // Títulos
  Tooltip,          // Hover tooltips
  Legend,           // Leyenda
  Filler            // Para áreas sombreadas
);

export const CHART_COLORS = {
  primary: '#3B82F6',      // Azul principal
  secondary: '#10B981',    // Verde éxito
  danger: '#EF4444',       // Rojo peligro
  warning: '#F59E0B',      // Amarillo alerta
  purple: '#8B5CF6',       // Púrpura
  gray: '#6B7280'          // Gris neutro
};

export const COMMON_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: '#374151',
        font: {
          family: 'Inter, sans-serif',
          size: 12
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        color: '#F3F4F6'
      },
      ticks: {
        color: '#6B7280'
      }
    },
    y: {
      grid: {
        color: '#F3F4F6'
      },
      ticks: {
        color: '#6B7280'
      }
    }
  }
};