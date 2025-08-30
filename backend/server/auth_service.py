from fastapi import HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta

from . import models
from .database import get_db

# CONFIG
SECRET_KEY = "secret-jwt-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 3500

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=15))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_user(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()


class AuthService:
    @staticmethod
    def signup(username: str, password: str, email:str, db: Session):
        user = get_user(db, username=username)
        if user:
            raise HTTPException(status_code=400, detail="Username already exists")

        hashed_password = get_password_hash(password)
        new_user = models.User(username=username, password=hashed_password, email=email)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return {"username": new_user.username, "id": new_user.userid}

    @staticmethod
    def login(username, password , db: Session):
        user = get_user(db, username=username)
        if not user or not verify_password(password, user.password):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        access_token = create_access_token(
            data={
                    "sub": user.username,
                    "id": user.userid
            },
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        return {"access_token": access_token, "token_type": "bearer"}

    @staticmethod
    def get_user_info(db: Session, token: str):
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            username = payload.get("sub")
            if username is None:
                raise HTTPException(status_code=401, detail="Invalid token")
            user = get_user(db, username=username)
            return {"username": user.username, "id": user.id}
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid token")

    @staticmethod
    def update_password(db: Session, user_id: int, new_password: str):
        user = db.query(models.User).filter(models.User.userid == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        hashed_password = get_password_hash(new_password)
        user.password = hashed_password
        db.commit()
        return {"message": "Password updated successfully"}

    @staticmethod
    def update_username(db: Session, user_id: int, username: str):
        user = db.query(models.User).filter(models.User.userid == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.username = username
        db.commit()
        return {"message": "Username updated successfully"}
