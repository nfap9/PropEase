"""
Base service class for business logic.
"""
from sqlalchemy.orm import Session


class BaseService:
    """
    Base service class providing database session access.

    All service classes should inherit from this class.
    """

    def __init__(self, db: Session):
        """
        Initialize service with database session.

        Args:
            db: SQLAlchemy session for database operations
        """
        self.db = db
