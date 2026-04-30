"""
FastAPI 샘플 서버
- Users 리소스: GET /users, POST /users, GET /users/{id}
- Auth: POST /auth/login
- 인메모리 저장소 사용 (재시작 시 초기화됨)
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel, EmailStr

# ───────── 앱 초기화 ─────────
app = FastAPI(
    title="Sample Users API",
    version="1.0.0",
    description="사용자 관리 및 인증을 위한 REST API",
)

# ───────── 인메모리 저장소 ─────────
# 실제 서비스에서는 DB로 교체
_users: dict[int, dict] = {
    1: {"id": 1, "name": "Alice", "email": "alice@example.com", "role": "admin", "password": "securePass123"},
    2: {"id": 2, "name": "Bob",   "email": "bob@example.com",   "role": "user",  "password": "pass456"},
}
_next_id: int = 3

# 발급된 토큰 목록 (토큰 → 사용자 id 매핑)
_tokens: dict[str, int] = {}

# ───────── Pydantic 모델 ─────────

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[str] = "user"

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 3600

# ───────── 인증 헬퍼 ─────────

def _get_current_user(authorization: str) -> dict:
    """Authorization 헤더에서 Bearer 토큰을 꺼내 사용자를 반환한다."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="유효한 Bearer 토큰이 필요합니다.")
    token = authorization.removeprefix("Bearer ").strip()
    user_id = _tokens.get(token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="유효하지 않거나 만료된 토큰입니다.")
    return _users[user_id]

# ───────── Users 엔드포인트 ─────────

@app.get("/users", response_model=dict, summary="전체 사용자 목록 조회")
def list_users(
    role: Optional[str] = None,
    authorization: Optional[str] = Header(default=None),
):
    _get_current_user(authorization)  # 인증 확인
    users = list(_users.values())
    if role:
        users = [u for u in users if u.get("role") == role]
    return {
        "users": [UserOut(**u).model_dump() for u in users],
        "total": len(users),
    }


@app.post("/users", response_model=UserOut, status_code=201, summary="새 사용자 생성")
def create_user(body: UserCreate):
    global _next_id
    # 이메일 중복 검사
    for u in _users.values():
        if u["email"] == body.email:
            raise HTTPException(status_code=409, detail="이미 사용 중인 이메일입니다.")

    new_user = {
        "id": _next_id,
        "name": body.name,
        "email": body.email,
        "role": body.role or "user",
        "password": body.password,  # 실제 서비스에서는 bcrypt 해시 저장
    }
    _users[_next_id] = new_user
    _next_id += 1
    return UserOut(**new_user)


@app.get("/users/{user_id}", response_model=UserOut, summary="특정 사용자 조회")
def get_user(
    user_id: int,
    authorization: Optional[str] = Header(default=None),
):
    _get_current_user(authorization)
    user = _users.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail=f"ID {user_id}에 해당하는 사용자를 찾을 수 없습니다.")
    return UserOut(**user)

# ───────── Auth 엔드포인트 ─────────

@app.post("/auth/login", response_model=LoginResponse, summary="로그인 및 JWT 토큰 발급")
def login(body: LoginRequest):
    # 이메일로 사용자 조회
    user = next((u for u in _users.values() if u["email"] == body.email), None)
    if not user or user["password"] != body.password:
        # 보안상 이메일 존재 여부를 노출하지 않기 위해 동일 메시지 사용
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")

    # 간단한 토큰 생성 (실제 서비스에서는 python-jose 등으로 JWT 발급)
    import secrets
    token = secrets.token_hex(32)
    _tokens[token] = user["id"]

    return LoginResponse(access_token=token)
