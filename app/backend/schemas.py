import datetime as dt

from pydantic import BaseModel, Field

STATUSES = ["pending", "confirmed", "ready", "completed", "cancelled"]


class RegisterIn(BaseModel):
    name: str = Field(min_length=1)
    email: str = Field(min_length=3)
    password: str = Field(min_length=6)


class LoginIn(BaseModel):
    email: str
    password: str


class TokenOut(BaseModel):
    token: str
    name: str
    is_admin: bool


class ItemIn(BaseModel):
    name: str = Field(min_length=1)
    description: str = ""
    price: float = Field(gt=0)


class ItemOut(ItemIn):
    id: int
    available: bool
    model_config = {"from_attributes": True}


class OrderIn(BaseModel):
    item_id: int
    quantity: int = Field(ge=1, le=100)
    note: str = ""


class StatusIn(BaseModel):
    status: str


class OrderOut(BaseModel):
    id: int
    item_name: str
    quantity: int
    note: str
    status: str
    customer: str
    total: float
    created_at: dt.datetime
