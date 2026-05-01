# apidoc_test

## 구조

```
├── app/main.py          # FastAPI 서버 (Users + Auth)
├── docs/                # API 참고 문서 (JSON, 그냥 열어서 읽기)
│   ├── users-list.json
│   ├── users-create.json
│   ├── users-get.json
│   └── auth-login.json
├── test/test_api.py     # 테스트
└── requirements.txt
```

## 실행

```bash
pip install -r requirements.txt

# 서버
uvicorn app.main:app --reload

# 테스트
pytest test/
```
