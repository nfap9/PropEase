"""
Bill controller - handles bill management operations.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.bill import BillStatus
from app.models.organization import MemberRole
from app.services.bill_service import BillService
from app.schemas.bill import (
    BillCreate,
    BillUpdate,
    BillResponse,
    PaymentCreate,
    PaymentResponse,
    GenerateBillsRequest,
)
from app.controllers.common.errors import NotFoundError, ForbiddenError, BadRequestError
from app.controllers.common.deps import get_org_membership, require_role
from app.utils.exports import generate_bill_pdf, generate_bills_excel

router = APIRouter()


def get_bill_service(db: Session = Depends(get_db)) -> BillService:
    """Get bill service instance."""
    return BillService(db)


@router.get("", response_model=List[BillResponse])
def list_bills(
    org_id: int = Query(...),
    lease_id: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    status: Optional[BillStatus] = Query(None),
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
    org_id: int = Query(...),
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
    org_id: int = Query(...),
    current_user: User = Depends(get_current_user),
    bill_service: BillService = Depends(get_bill_service),
    db: Session = Depends(get_db),
):
    """Create a new bill manually."""
    membership = get_org_membership(org_id, current_user, db)
    if membership.role == MemberRole.VIEWER:
        raise ForbiddenError("Viewers cannot create bills")
    return bill_service.create_bill(org_id, data)


@router.get("/{bill_id}", response_model=BillResponse)
def get_bill(
    bill_id: int,
    org_id: int = Query(...),
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
    bill_id: int,
    data: BillUpdate,
    org_id: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a bill."""
    membership = get_org_membership(org_id, current_user, db)
    if membership.role == MemberRole.VIEWER:
        raise ForbiddenError("Viewers cannot update bills")

    bill_service = BillService(db)
    bill = bill_service.get_bill(bill_id, org_id)
    if not bill:
        raise NotFoundError("Bill")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(bill, field, value)

    db.commit()
    db.refresh(bill)
    return bill


@router.delete("/{bill_id}")
def delete_bill(
    bill_id: int,
    org_id: int = Query(...),
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
    bill_id: int,
    data: PaymentCreate,
    org_id: int = Query(...),
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


@router.get("/{bill_id}/payments", response_model=List[PaymentResponse])
def list_payments(
    bill_id: int,
    org_id: int = Query(...),
    current_user: User = Depends(get_current_user),
    bill_service: BillService = Depends(get_bill_service),
    db: Session = Depends(get_db),
):
    """List payments for a bill."""
    get_org_membership(org_id, current_user, db)
    return bill_service.get_bill_payments(bill_id)


@router.get("/{bill_id}/pdf")
def export_bill_pdf(
    bill_id: int,
    org_id: int = Query(...),
    current_user: User = Depends(get_current_user),
    bill_service: BillService = Depends(get_bill_service),
    db: Session = Depends(get_db),
):
    """Export bill as PDF."""
    get_org_membership(org_id, current_user, db)

    bill = bill_service.get_bill(bill_id, org_id)
    if not bill:
        raise NotFoundError("Bill")

    # Get organization name
    from app.models.organization import Organization

    org = db.query(Organization).filter(Organization.id == org_id).first()
    org_name = org.name if org else "Apartment Ultra"

    bill_data = bill_service.prepare_bill_export_data(bill)
    pdf_bytes = generate_bill_pdf(bill_data, org_name)

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=bill_{bill_id}.pdf"},
    )
