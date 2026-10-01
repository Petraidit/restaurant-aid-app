import os
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models
import schemas
from auth import admin_user, create_token, current_user, hash_password, verify_password
from database import Base, engine, get_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)  # create tables on startup
    yield


app = FastAPI(title="Restaurant Aid API", lifespan=lifespan)

# In production, replace "*" with your real frontend domain.
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[ALLOWED_ORIGINS] if ALLOWED_ORIGINS != "*" else ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def order_out(o: models.Order) -> schemas.OrderOut:
    return schemas.OrderOut(
        id=o.id, item_name=o.item.name, quantity=o.quantity, note=o.note,
        status=o.status, customer=o.user.name, total=round(o.item.price * o.quantity, 2),
        created_at=o.created_at,
    )


# ---- health (used later by Docker, load balancer and Kubernetes probes) ----
@app.get("/health")
def health(db: Session = Depends(get_db)):
    db.execute(models.User.__table__.select().limit(1))
    return {"status": "ok"}


# ---- auth ----
@app.post("/auth/register", response_model=schemas.TokenOut)
def register(data: schemas.RegisterIn, db: Session = Depends(get_db)):
    email = data.email.strip().lower()
    if db.query(models.User).filter_by(email=email).first():
        raise HTTPException(409, "That email is already registered")
    is_first = db.query(models.User).count() == 0  # first account becomes the admin
    user = models.User(name=data.name.strip(), email=email,
                       password_hash=hash_password(data.password), is_admin=is_first)
    db.add(user)
    db.commit()
    return schemas.TokenOut(token=create_token(user.id), name=user.name, is_admin=user.is_admin)


@app.post("/auth/login", response_model=schemas.TokenOut)
def login(data: schemas.LoginIn, db: Session = Depends(get_db)):
    user = db.query(models.User).filter_by(email=data.email.strip().lower()).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Wrong email or password")
    return schemas.TokenOut(token=create_token(user.id), name=user.name, is_admin=user.is_admin)


# ---- items ----
@app.get("/items", response_model=list[schemas.ItemOut])
def list_items(db: Session = Depends(get_db)):
    return db.query(models.Item).filter_by(available=True).order_by(models.Item.id).all()


@app.post("/items", response_model=schemas.ItemOut, status_code=201)
def create_item(data: schemas.ItemIn, db: Session = Depends(get_db), _=Depends(admin_user)):
    item = models.Item(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


# ---- orders ----
@app.post("/orders", response_model=schemas.OrderOut, status_code=201)
def place_order(data: schemas.OrderIn, db: Session = Depends(get_db), user=Depends(current_user)):
    item = db.get(models.Item, data.item_id)
    if not item or not item.available:
        raise HTTPException(404, "Item not found")
    order = models.Order(user_id=user.id, item_id=item.id, quantity=data.quantity, note=data.note)
    db.add(order)
    db.commit()
    db.refresh(order)
    return order_out(order)


@app.get("/orders/mine", response_model=list[schemas.OrderOut])
def my_orders(db: Session = Depends(get_db), user=Depends(current_user)):
    rows = db.query(models.Order).filter_by(user_id=user.id).order_by(models.Order.id.desc()).all()
    return [order_out(o) for o in rows]


@app.get("/orders", response_model=list[schemas.OrderOut])
def all_orders(db: Session = Depends(get_db), _=Depends(admin_user)):
    rows = db.query(models.Order).order_by(models.Order.id.desc()).all()
    return [order_out(o) for o in rows]


@app.patch("/orders/{order_id}/status", response_model=schemas.OrderOut)
def update_status(order_id: int, data: schemas.StatusIn,
                  db: Session = Depends(get_db), _=Depends(admin_user)):
    if data.status not in schemas.STATUSES:
        raise HTTPException(400, f"Status must be one of: {', '.join(schemas.STATUSES)}")
    order = db.get(models.Order, order_id)
    if not order:
        raise HTTPException(404, "Order not found")
    order.status = data.status
    db.commit()
    db.refresh(order)
    return order_out(order)
