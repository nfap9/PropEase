"""
Base repository implementation with common CRUD operations.
"""
from typing import Generic, TypeVar, Optional, List, Union
from sqlalchemy.orm import Session

ModelType = TypeVar("ModelType")

# ID类型现在是字符串 (ULID)
IdType = str
# 过滤值类型
FilterValue = Union[str, int, float, bool, None]


class BaseRepository(Generic[ModelType]):
    """
    Base repository class providing common CRUD operations.

    Usage:
        class UserRepository(BaseRepository[User]):
            def find_by_email(self, email: str) -> Optional[User]:
                return self.db.query(self.model).filter(User.email == email).first()
    """

    def __init__(self, db: Session, model: type[ModelType]):
        """
        Initialize repository with database session and model class.

        Args:
            db: SQLAlchemy session
            model: SQLAlchemy model class
        """
        self.db = db
        self.model = model

    def get(self, id: IdType) -> Optional[ModelType]:
        """Get a single record by ID (ULID string)."""
        return self.db.query(self.model).filter(self.model.id == id).first()

    def get_by_ids(self, ids: List[IdType]) -> List[ModelType]:
        """Get multiple records by IDs (ULID strings)."""
        return self.db.query(self.model).filter(self.model.id.in_(ids)).all()

    def get_all(
        self, skip: int = 0, limit: int = 100, **filters: FilterValue
    ) -> List[ModelType]:
        """
        Get all records with optional pagination and filtering.

        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            **filters: Filter conditions (field=value)
        """
        query = self.db.query(self.model)
        for field, value in filters.items():
            if hasattr(self.model, field) and value is not None:
                query = query.filter(getattr(self.model, field) == value)
        return query.offset(skip).limit(limit).all()

    def count(self, **filters: FilterValue) -> int:
        """Count records with optional filtering."""
        query = self.db.query(self.model)
        for field, value in filters.items():
            if hasattr(self.model, field) and value is not None:
                query = query.filter(getattr(self.model, field) == value)
        return query.count()

    def create(self, obj: ModelType) -> ModelType:
        """Create a new record."""
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def update(self, id: IdType, **kwargs: FilterValue) -> Optional[ModelType]:
        """Update a record by ID (ULID string)."""
        obj = self.get(id)
        if obj:
            for field, value in kwargs.items():
                if hasattr(obj, field) and value is not None:
                    setattr(obj, field, value)
            self.db.commit()
            self.db.refresh(obj)
        return obj

    def delete(self, id: IdType) -> bool:
        """Delete a record by ID (ULID string)."""
        obj = self.get(id)
        if obj:
            self.db.delete(obj)
            self.db.commit()
            return True
        return False

    def exists(self, id: IdType) -> bool:
        """Check if a record exists by ID (ULID string)."""
        return self.db.query(self.model).filter(self.model.id == id).first() is not None
