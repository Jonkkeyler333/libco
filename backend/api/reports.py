from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import datetime, timezone, timedelta
from schemas.products import ProductsResponse
from db.database import get_session
from core.config import settings
from api.auth import get_current_user
from schemas.auth import UserResponse
from schemas.reports import GetKPIsRequest , KPIsResponse
from services.KPIs import total_sales_period,order_status_counts

router = APIRouter(prefix="/reports", tags=["Reportes y KPIs"])

@router.get("/kpis", response_model=KPIsResponse)
async def get_kpis_report(
    start_date: datetime,
    end_date: datetime,
    session: Session = Depends(get_session),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Obtiene KPIs consolidados para el período especificado.
    
    - **start_date**: Fecha de inicio del período (ISO 8601)
    - **end_date**: Fecha de fin del período (ISO 8601)
    
    Solo accesible para usuarios con rol admin.
    """
    # Verificar que el usuario sea admin
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permisos insuficientes. Solo administradores pueden acceder a reportes."
        )
    total_sales, total_orders, avg_order_value = total_sales_period(session, start_date, end_date)
    order_status = order_status_counts(session, start_date, end_date)
    return KPIsResponse(
        total_sales=total_sales,
        total_orders=total_orders,
        average_order_value=avg_order_value,
        order_status_counts=order_status
    )
