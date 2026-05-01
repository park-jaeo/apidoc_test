"""
FastAPI 엔드포인트 테스트

TestClient를 사용하므로 서버를 별도로 실행할 필요 없음.
실행: pytest test/
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app, _users, _tokens, _next_id

client = TestClient(app)


# ───────── 픽스처 ─────────

@pytest.fixture(autouse=True)
def reset_store():
    """각 테스트 전후 인메모리 저장소를 초기 상태로 복원"""
    original_users = dict(_users)
    original_tokens = dict(_tokens)
    global _next_id

    # app.main의 모듈 전역 변수를 직접 조작
    import app.main as m
    original_next_id = m._next_id

    yield  # 테스트 실행

    _users.clear()
    _users.update(original_users)
    _tokens.clear()
    _tokens.update(original_tokens)
    m._next_id = original_next_id


@pytest.fixture
def token():
    """alice 계정으로 로그인하여 액세스 토큰 반환"""
    res = client.post("/auth/login", json={
        "email": "alice@example.com",
        "password": "securePass123",
    })
    assert res.status_code == 200
    return res.json()["access_token"]


@pytest.fixture
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# ───────── Auth 테스트 ─────────

class TestAuthLogin:
    def test_성공(self):
        res = client.post("/auth/login", json={
            "email": "alice@example.com",
            "password": "securePass123",
        })
        assert res.status_code == 200
        body = res.json()
        assert "access_token" in body
        assert body["token_type"] == "bearer"
        assert body["expires_in"] == 3600

    def test_틀린_비밀번호(self):
        res = client.post("/auth/login", json={
            "email": "alice@example.com",
            "password": "wrong",
        })
        assert res.status_code == 401

    def test_없는_이메일(self):
        res = client.post("/auth/login", json={
            "email": "nobody@example.com",
            "password": "any",
        })
        assert res.status_code == 401

    def test_바디_누락(self):
        res = client.post("/auth/login", json={"email": "alice@example.com"})
        assert res.status_code == 422


# ───────── Users 테스트 ─────────

class TestUsersList:
    def test_성공(self, auth_headers):
        res = client.get("/users", headers=auth_headers)
        assert res.status_code == 200
        body = res.json()
        assert "users" in body
        assert body["total"] >= 2

    def test_role_필터(self, auth_headers):
        res = client.get("/users?role=admin", headers=auth_headers)
        assert res.status_code == 200
        users = res.json()["users"]
        assert all(u["role"] == "admin" for u in users)

    def test_인증_없음(self):
        res = client.get("/users")
        assert res.status_code == 401

    def test_잘못된_토큰(self):
        res = client.get("/users", headers={"Authorization": "Bearer fake-token"})
        assert res.status_code == 401


class TestUsersGet:
    def test_성공(self, auth_headers):
        res = client.get("/users/1", headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["id"] == 1
        assert res.json()["name"] == "Alice"

    def test_없는_id(self, auth_headers):
        res = client.get("/users/9999", headers=auth_headers)
        assert res.status_code == 404

    def test_인증_없음(self):
        res = client.get("/users/1")
        assert res.status_code == 401


class TestUsersCreate:
    def test_성공(self):
        res = client.post("/users", json={
            "name": "Dave",
            "email": "dave@example.com",
            "password": "pass789",
        })
        assert res.status_code == 201
        body = res.json()
        assert body["email"] == "dave@example.com"
        assert body["role"] == "user"
        assert "id" in body

    def test_기본_role은_user(self):
        res = client.post("/users", json={
            "name": "Eve",
            "email": "eve@example.com",
            "password": "pass",
        })
        assert res.status_code == 201
        assert res.json()["role"] == "user"

    def test_이메일_중복(self):
        res = client.post("/users", json={
            "name": "Duplicate",
            "email": "alice@example.com",
            "password": "pass",
        })
        assert res.status_code == 409

    def test_잘못된_이메일_형식(self):
        res = client.post("/users", json={
            "name": "Bad",
            "email": "not-an-email",
            "password": "pass",
        })
        assert res.status_code == 422
