"""
Bill controller - handles bill management operations.
"""

import io

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.configs.database import get_db
from app.controllers.common.deps import get_org_membership
from app.controllers.common.errors import BadRequestError, ForbiddenError, NotFoundError
from app.dependencies import get_current_user
from app.models.bill import BillStatus
from app.models.organization import MemberRole
from app.models.user import User
from app.schemas.bill import (
    BillCreate,
    BillResponse,
    BillUpdate,
    GenerateBillsRequest,
    PaymentCreate,
    PaymentResponse,
)
from app.services.bill_service import BillService
from app.utils.exports import generate_bill_pdf, generate_bills_excel

router = APIRouter()


def get_bill_service(db: Session = Depends(get_db)) -> BillService:
    """Get bill service instance."""
    return BillService(db)


@router.get("", response_model=list[BillResponse])
def list_bills(
    org_id: str = Query(...),
    lease_id: str | None = Query(None),
    year: int | None = Query(None),
    month: int | None = Query(None),
    status: BillStatus | None = Query(None),
    current_user: User = Depends(get_current_user),
    bill_service: BillService = Depends(get_bill_service),
    db: Session = Depends(get_db),
):
    """List bills with optional filters."""
    get_org_membership(org_id, current_user, db)
    return bill_service.list_bills(org_id, lease_id, year, month, status)


@router.post("/generate")
def generate_bills(
    data: GenerateBillsRequest,
    org_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    bill_service: BillService = Depends(get_bill_service),
    db: Session = Depends(get_db),
):
    """Generate bills for active leases."""
    membership = get_org_membership(org_id, current_user, db)
    if membership.role == MemberRole.VIEWER:
        raise ForbiddenError("Viewers cannot generate bills")
    return bill_service.generate_bills(org_id, data)


@router.post("", response_model=BillResponse, status_code=status.HTTP_201_CREATED)
def create_bill(
    data: BillCreate,
    org_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    bill_service: BillService = Depends(get_bill_service),
    db: Session = Depends(get_db),
):
    """Create a new bill manually."""
    membership = get_org_membership(org_id, current_user, db)
    if membership.role == MemberRole.VIEWER:
        raise ForbiddenError("Viewers cannot create bills")
    return bill_service.create_bill(org_id, data)


@router.get("/export/excel")
def export_bills_excel(
    org_id: str = Query(...),
    status: BillStatus | None = Query(None),
    year: int | None = Query(None),
    month: int | None = Query(None),
    export_type: str | None = Query(None, alias="exportType"),
    current_user: User = Depends(get_current_user),
    bill_service: BillService = Depends(get_bill_service),
    db: Session = Depends(get_db),
):
    """Export bills as Excel file."""
    get_org_membership(org_id, current_user, db)

    # 如果是导出未完成账单，则获取非已支付状态的账单
    if export_type == "unfinished":
        # 获取 pending, partial, overdue 状态的账单
        all_bills = bill_service.list_bills(org_id, year=year, month=month)
        bills = [b for b in all_bills if b.status != BillStatus.PAID]
    else:
        bills = bill_service.list_bills(org_id, year=year, month=month, status=status)

    if not bills:
        raise BadRequestError("没有可导出的账单")

    org_name = bill_service.get_organization_name(org_id)
    bills_data = [bill_service.prepare_bill_export_data(bill) for bill in bills]
    excel_bytes = generate_bills_excel(bills_data, org_name)

    filename = "bills"
    if export_type == "unfinished":
        filename += "_unfinished"
    elif status:
        filename += f"_{status.value}"
    filename += ".xlsx"

    return StreamingResponse(
        io.BytesIO(excel_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/{bill_id}", response_model=BillResponse)
def get_bill(
    bill_id: str,
    org_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    bill_service: BillService = Depends(get_bill_service),
    db: Session = Depends(get_db),
):
    """Get a bill by ID."""
    get_org_membership(org_id, current_user, db)
    bill = bill_service.get_bill(bill_id, org_id)
    if not bill:
        raise NotFoundError("Bill")
    return bill


@router.put("/{bill_id}", response_model=BillResponse)
def update_bill(
    bill_id: str,
    data: BillUpdate,
    org_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    bill_service: BillService = Depends(get_bill_service),
    db: Session = Depends(get_db),
):
    """Update a bill."""
    membership = get_org_membership(org_id, current_user, db)
    if membership.role == MemberRole.VIEWER:
        raise ForbiddenError("Viewers cannot update bills")

    try:
        return bill_service.update_bill(bill_id, org_id, data)
    except ValueError as e:
        raise NotFoundError(str(e))


@router.delete("/{bill_id}")
def delete_bill(
    bill_id: str,
    org_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    bill_service: BillService = Depends(get_bill_service),
    db: Session = Depends(get_db),
):
    """Delete a bill."""
    membership = get_org_membership(org_id, current_user, db)
    if membership.role == MemberRole.VIEWER:
        raise ForbiddenError("Viewers cannot delete bills")

    try:
        bill_service.delete_bill(bill_id, org_id)
        return {"message": "Bill deleted successfully"}
    except ValueError as e:
        raise BadRequestError(str(e))


@router.post("/{bill_id}/payments", response_model=PaymentResponse)
def create_payment(
    bill_id: str,
    data: PaymentCreate,
    org_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    bill_service: BillService = Depends(get_bill_service),
    db: Session = Depends(get_db),
):
    """Record a payment for a bill."""
    membership = get_org_membership(org_id, current_user, db)
    if membership.role == MemberRole.VIEWER:
        raise ForbiddenError("Viewers cannot create payments")

    try:
        return bill_service.record_payment(bill_id, data)
    except ValueError as e:
        raise BadRequestError(str(e))


@router.get("/{bill_id}/payments", response_model=list[PaymentResponse])
def list_payments(
    bill_id: str,
    org_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    bill_service: BillService = Depends(get_bill_service),
    db: Session = Depends(get_db),
):
    """List payments for a bill."""
    get_org_membership(org_id, current_user, db)
    return bill_service.get_bill_payments(bill_id)


@router.get("/{bill_id}/pdf")
def export_bill_pdf(
    bill_id: str,
    org_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    bill_service: BillService = Depends(get_bill_service),
    db: Session = Depends(get_db),
):
    """Export bill as PDF."""
    get_org_membership(org_id, current_user, db)

    bill = bill_service.get_bill(bill_id, org_id)
    if not bill:
        raise NotFoundError("Bill")

    org_name = bill_service.get_organization_name(org_id)
    bill_data = bill_service.prepare_bill_export_data(bill)
    pdf_bytes = generate_bill_pdf(bill_data, org_name)

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=bill_{bill_id}.pdf"},
    )
