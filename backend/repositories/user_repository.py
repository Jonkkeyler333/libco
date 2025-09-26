# User repository for database operations
from sqlmodel import Session, select
from typing import Optional
from models.user import User
from services.auth_service import get_password_hash

class UserRepository:
    
    def __init__(self, session: Session):
        self.session = session
    
    def get_user_by_username(self, username: str) -> Optional[User]:
        """Get user by username"""
        statement = select(User).where(User.username == username)
        return self.session.exec(statement).first()
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        statement = select(User).where(User.email == email)
        return self.session.exec(statement).first()
    
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID"""
        statement = select(User).where(User.user_id == user_id)
        return self.session.exec(statement).first()
    
    def create_user(self, username: str, email: str, name: str, last_name: str, password: str) -> User:
        """Create a new user"""
        # Generate unique ID (simple incrementing - in production use better method)
        last_user = self.session.exec(select(User).order_by(User.ID.desc())).first()
        new_id = (last_user.ID + 1) if last_user else 1
        
        user = User(
            username=username,
            email=email,
            name=name,
            last_name=last_name,
            ID=new_id,
            password_hash=get_password_hash(password)
        )
        
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        return user
    
    def username_exists(self, username: str) -> bool:
        """Check if username already exists"""
        return self.get_user_by_username(username) is not None
    
    def email_exists(self, email: str) -> bool:
        """Check if email already exists"""
        return self.get_user_by_email(email) is not None