# API 문서 시각화 예시 프로젝트

## 왜 이 방식인가?

대부분의 API 문서화 도구(Swagger UI, Redoc 등)는 **서버가 살아있어야** 문서를 볼 수 있습니다.
이 프로젝트는 반대 방향을 취합니다:

- **JSON 파일이 API의 단일 진실 공급원(Single Source of Truth)**
- `docs/index.html`을 **그냥 더블클릭**해서 열면 바로 동작 (HTTP 서버 불필요)
- JSON → `data.js` 빌드 과정 한 번으로 `file://` 직접 실행 지원
- 각 엔드포인트 파일에 `scenarios` 필드를 포함해 **시퀀스 다이어그램 자동 생성**
- FastAPI 서버와 pytest 테스트는 `test/`로 분리

---

## 디렉터리 구조

```
project-root/
├── app/
│   └── main.py              # FastAPI 샘플 서버 (Users API + Auth)
├── docs/                    # ← 이 폴더만으로 단독 동작
│   ├── index.json           # API 목록 메타데이터 (편집 대상)
│   ├── endpoints/
│   │   ├── users-list.json  # GET /users
│   │   ├── users-create.json# POST /users
│   │   ├── users-get.json   # GET /users/{id}
│   │   └── auth-login.json  # POST /auth/login
│   ├── data.js              # ★ 자동 생성 — JSON 번들 (직접 편집 X)
│   ├── index.html           # 문서 뷰어 (더블클릭으로 열기)
│   ├── app.js               # 뷰어 로직
│   └── style.css            # 스타일 (라이트/다크 모드)
├── scripts/
│   ├── build_data.py        # JSON → data.js 번들링 (docs 수정 후 실행)
│   └── validate_docs.py     # JSON 스키마 검증
├── test/
│   └── test_api.py          # FastAPI 엔드포인트 테스트 (pytest)
├── requirements.txt
└── README.md
```

---

## 실행 방법

### 문서 뷰어 열기 (서버 불필요)

```
docs/index.html 파일을 브라우저에서 직접 열기
```

JSON 파일을 수정했다면 먼저 번들을 재생성:

```bash
python scripts/build_data.py
```

그 다음 `docs/index.html`을 새로고침하면 반영됩니다.

---

### FastAPI 서버 실행

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

- 서버: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`

빠른 테스트:

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"securePass123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/users
```

### API 테스트 실행

```bash
pytest test/ -v
```

서버 실행 없이 TestClient로 동작합니다.

### JSON 스키마 검증

```bash
python scripts/validate_docs.py
```

---

## JSON 파일 수정 워크플로우

```
docs/endpoints/*.json 편집
        ↓
python scripts/build_data.py   # data.js 재생성
        ↓
docs/index.html 새로고침        # 바로 반영
```

---

## JSON 스키마 명세

### `docs/index.json`

```jsonc
{
  "title": "string",
  "version": "string",
  "baseUrl": "string",        // 예: "http://localhost:8000"
  "description": "string",
  "groups": [
    {
      "name": "string",
      "description": "string",
      "endpoints": [
        {
          "id": "string",
          "method": "GET|POST|PUT|PATCH|DELETE",
          "path": "string",
          "summary": "string",
          "file": "string"    // endpoints/ 기준 상대 경로
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
    "pathParams":  [ /* 파라미터 항목 */ ],
    "queryParams": [ /* 파라미터 항목 */ ],
    "headers":     [ /* 파라미터 항목 */ ],
    "body":        [ /* 파라미터 항목 */ ]
  },
  "responses": [
    { "status": 200, "description": "string", "body": {} }
  ],
  "scenarios": [
    {
      "name": "string",
      "description": "string",
      "steps": [
        {
          "actor": "Client|API|DB|External",
          "action": "string",
          "data": {}           // 선택: 다이어그램에 표시할 데이터
        }
      ]
    }
  ]
}
```

**파라미터 항목:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `name` | string | ✓ | 파라미터 이름 |
| `type` | string | ✓ | 타입 (string, integer 등) |
| `required` | boolean | ✓ | 필수 여부 |
| `description` | string | ✓ | 설명 |
| `example` | any | - | 예시 값 |
