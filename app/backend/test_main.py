import os

os.environ["DATABASE_URL"] = "sqlite:///./test.db"

from fastapi.testclient import TestClient  # noqa: E402

from database import Base, engine  # noqa: E402
from main import app  # noqa: E402


def setup_module():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def test_full_flow():
    c = TestClient(app)
    assert c.get("/health").json() == {"status": "ok"}

    admin = c.post("/auth/register", json={"name": "Boss", "email": "boss@x.com", "password": "secret1"}).json()
    assert admin["is_admin"] is True
    cust = c.post("/auth/register", json={"name": "Ada", "email": "ada@x.com", "password": "secret1"}).json()
    assert cust["is_admin"] is False

    # only admin can add items
    body = {"name": "Alteration", "description": "Hem trousers", "price": 3500}
    assert c.post("/items", json=body, headers=auth(cust["token"])).status_code == 403
    item = c.post("/items", json=body, headers=auth(admin["token"])).json()

    # customer places and sees own order
    o = c.post("/orders", json={"item_id": item["id"], "quantity": 2}, headers=auth(cust["token"])).json()
    assert o["total"] == 7000 and o["status"] == "pending"
    assert len(c.get("/orders/mine", headers=auth(cust["token"])).json()) == 1

    # admin sees all and updates status; customer cannot
    assert len(c.get("/orders", headers=auth(admin["token"])).json()) == 1
    assert c.get("/orders", headers=auth(cust["token"])).status_code == 403
    r = c.patch(f"/orders/{o['id']}/status", json={"status": "ready"}, headers=auth(admin["token"]))
    assert r.json()["status"] == "ready"
    assert c.patch(f"/orders/{o['id']}/status", json={"status": "nope"}, headers=auth(admin["token"])).status_code == 400


def test_login_wrong_password():
    c = TestClient(app)
    assert c.post("/auth/login", json={"email": "ada@x.com", "password": "wrong"}).status_code == 999
