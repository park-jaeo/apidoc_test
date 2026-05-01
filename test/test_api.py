from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_login_and_list_users():
    res = client.post("/auth/login", json={"email": "alice@example.com", "password": "securePass123"})
    assert res.status_code == 200
    token = res.json()["access_token"]

    res = client.get("/users", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["total"] >= 1
