import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOrder } from '../context/OrderContext';
import SalesChart from '../components/reports/salesChart';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import '../styles/Report.css';

const ReportPage = () => {
    const {user,isAdmin} = useAuth();
    return (
        <div>
            {!isAdmin() && (
                <div>
                    <h1>No tienes permiso de estar aca !!!</h1>
                    <p>⚠️ Contacta a un administrador para más información.</p>
                </div>
            )}
            <h1>🧮 Centro de Reportes LibCo</h1>
            Hola  {user.name} 👋🏽
            <p>Primero un vitazo rapido de como van las cosas 🤑</p>
            <SalesChart/>
        </div>
    );
};
export default ReportPage;