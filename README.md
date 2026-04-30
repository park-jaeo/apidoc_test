# API 문서 시각화 예시 프로젝트

## 왜 이 방식인가?

대부분의 API 문서화 도구(Swagger UI, Redoc 등)는 **서버가 살아있어야** 문서를 볼 수 있습니다.
이 프로젝트는 반대 방향을 취합니다:

- **JSON 파일이 API의 단일 진실 공급원(Single Source of Truth)**
- 백엔드 서버 없이 `python -m http.server` 하나로 문서 뷰어 실행
- 각 엔드포인트 파일에 `scenarios` 필드를 포함해 **시퀀스 다이어그램 자동 생성**
- FastAPI 서버는 실제 동작 확인용 별도 레이어 (문서와 독립)

이 구조는 다음 상황에 적합합니다:
- API 설계 단계에서 백엔드 구현 전에 먼저 문서 작성
- 프론트엔드/백엔드 팀 간 계약(Contract) 공유
- CI에서 `validate_docs.py`로 JSON 스키마 자동 검증

---

## 디렉터리 구조

```
project-root/
├── app/
│   └── main.py              # FastAPI 샘플 서버 (Users API + Auth)
├── docs/
│   ├── index.json           # API 목록 메타데이터 (그룹 + 엔드포인트 목록)
│   ├── endpoints/
│   │   ├── users-list.json  # GET /users
│   │   ├── users-create.json# POST /users
│   │   ├── users-get.json   # GET /users/{id}
│   │   └── auth-login.json  # POST /auth/login
│   ├── index.html           # 정적 문서 뷰어 (사이드바 + 메인 패널)
│   ├── app.js               # 뷰어 로직 (fetch, Mermaid 렌더링, cURL 생성)
│   └── style.css            # 스타일 (라이트/다크 모드)
├── scripts/
│   └── validate_docs.py     # JSON 스키마 검증 스크립트
├── requirements.txt
└── README.md
```

---

## 실행 방법

### 사전 준비

```bash
pip install -r requirements.txt
```

### FastAPI 서버 실행

```bash
uvicorn app.main:app --reload
```

- 서버: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`

#### 빠른 테스트 (서버 실행 후)

```bash
# 1. 로그인으로 토큰 발급
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"securePass123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# 2. 토큰으로 사용자 목록 조회
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/users
```

### 문서 뷰어 실행 (백엔드 불필요)

```bash
cd docs
python -m http.server 3000
```

브라우저에서 `http://localhost:3000` 접속

### JSON 스키마 검증

```bash
python scripts/validate_docs.py
```

---

## JSON 스키마 명세

### `docs/index.json`

```jsonc
{
  "title": "string",        // API 제목
  "version": "string",      // 버전 (예: "1.0.0")
  "baseUrl": "string",      // 기본 URL (예: "http://localhost:8000")
  "description": "string",  // 설명 (선택)
  "groups": [               // 엔드포인트 그룹 배열
    {
      "name": "string",
      "description": "string",
      "endpoints": [
        {
          "id": "string",       // 고유 식별자
          "method": "GET|POST|PUT|PATCH|DELETE",
          "path": "string",
          "summary": "string",
          "file": "string"      // endpoints/ 기준 상대 경로
        }
      ]
    }
  ]
}
```

### `docs/endpoints/*.json`

```jsonc
{
  "id": "string",
  "method": "GET|POST|PUT|PATCH|DELETE",
  "path": "string",
  "summary": "string",
  "description": "string",
  "request": {
    "pathParams":  [ /* 파라미터 항목 배열 */ ],
    "queryParams": [ /* 파라미터 항목 배열 */ ],
    "headers":     [ /* 파라미터 항목 배열 */ ],
    "body":        [ /* 파라미터 항목 배열 */ ]
  },
  "responses": [
    {
      "status": 200,
      "description": "string",
      "body": { /* 예시 응답 객체 */ }
    }
  ],
  "scenarios": [
    {
      "name": "string",
      "description": "string",
      "steps": [
        {
          "actor": "Client|API|DB|External",
          "action": "string",
          "data": { /* 선택: 메시지에 표시할 데이터 */ }
        }
      ]
    }
  ]
}
```

**파라미터 항목 공통 구조:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `name` | string | ✓ | 파라미터 이름 |
| `type` | string | ✓ | 타입 (string, integer, boolean 등) |
| `required` | boolean | ✓ | 필수 여부 |
| `description` | string | ✓ | 설명 |
| `example` | any | - | 예시 값 |
