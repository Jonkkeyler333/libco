const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const reportService = {
    async getKPIs(token, startDate, endDate){
        try{
            const formatDate = (dateInput) => {
                const date = new Date(dateInput);
                return date.toISOString();
            };
            const formattedStartDate = formatDate(startDate);
            const formattedEndDate = formatDate(endDate);
            const params = new URLSearchParams({
                start_date: formattedStartDate,
                end_date: formattedEndDate
            });
            console.log(`Llamando API: ${API_URL}/api/reports/kpis?${params}`);
            const response = await fetch(`${API_URL}/api/reports/kpis?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error ${response.status}: ${errorText}`);
            }
            return response.json();
        }
        catch(error){
            console.error('Error fetching KPIs:', error);
            throw error;
        }
    },

    async getMonthlyData(token, monthsBack = 6){
        const monthlyData = [];
        const now = new Date();
        for (let i = monthsBack - 1; i >= 0; i--){
            const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
            endDate.setHours(23, 59, 59, 999);
            try{
                console.log(`Obteniendo datos del mes: ${startDate.toISOString()} - ${endDate.toISOString()}`);
                const data = await this.getKPIs(token, startDate.toISOString(), endDate.toISOString());
                monthlyData.push({
                    month: startDate.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
                    ...data
                });
            }catch(error){
                console.error(`Error fetching data for ${startDate.toISOString()} - ${endDate.toISOString()}:`, error);
                monthlyData.push({
                    month: startDate.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
                    total_sales: 0,
                    total_orders: 0,
                    average_order_value: 0,
                    order_status_counts: {}
                });
            }
        }
        return monthlyData;
    }
};