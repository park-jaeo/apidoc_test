// 자동 생성 파일 — scripts/build_data.py 실행으로 갱신
// JSON 파일 수정 후 반드시 다시 실행하세요: python scripts/build_data.py
window.API_DATA = {
  "index": {
    "title": "Sample Users API",
    "version": "1.0.0",
    "description": "사용자 관리 및 인증을 위한 REST API 명세",
    "baseUrl": "http://localhost:8000",
    "groups": [
      {
        "name": "Users",
        "description": "사용자 리소스 CRUD 엔드포인트",
        "endpoints": [
          {
            "id": "users-list",
            "method": "GET",
            "path": "/users",
            "summary": "전체 사용자 목록 조회",
            "file": "endpoints/users-list.json"
          },
          {
            "id": "users-create",
            "method": "POST",
            "path": "/users",
            "summary": "새 사용자 생성",
            "file": "endpoints/users-create.json"
          },
          {
            "id": "users-get",
            "method": "GET",
            "path": "/users/{id}",
            "summary": "특정 사용자 조회",
            "file": "endpoints/users-get.json"
          }
        ]
      },
      {
        "name": "Auth",
        "description": "인증 및 토큰 발급 엔드포인트",
        "endpoints": [
          {
            "id": "auth-login",
            "method": "POST",
            "path": "/auth/login",
            "summary": "로그인 및 JWT 토큰 발급",
            "file": "endpoints/auth-login.json"
          }
        ]
      }
    ]
  },
  "endpoints": {
    "endpoints/users-list.json": {
      "id": "users-list",
      "method": "GET",
      "path": "/users",
      "summary": "전체 사용자 목록 조회",
      "description": "등록된 모든 사용자를 페이지네이션 없이 반환합니다. 인증 토큰이 필요합니다.",
      "request": {
        "headers": [
          {
            "name": "Authorization",
            "type": "string",
            "required": true,
            "description": "Bearer 토큰",
            "example": "Bearer eyJhbGciOiJIUzI1NiJ9..."
          }
        ],
        "queryParams": [
          {
            "name": "role",
            "type": "string",
            "required": false,
            "description": "역할로 필터링 (admin | user)",
            "example": "admin"
          }
        ]
      },
      "responses": [
        {
          "status": 200,
          "description": "사용자 목록 반환 성공",
          "body": {
            "users": [
              {
                "id": 1,
                "name": "Alice",
                "email": "alice@example.com",
                "role": "admin"
              },
              {
                "id": 2,
                "name": "Bob",
                "email": "bob@example.com",
                "role": "user"
              }
            ],
            "total": 2
          }
        },
        {
          "status": 401,
          "description": "인증 토큰 없거나 유효하지 않음",
          "body": {
            "error": "Unauthorized",
            "message": "유효한 Bearer 토큰이 필요합니다."
          }
        }
      ],
      "scenarios": [
        {
          "name": "정상: 인증된 사용자가 목록 조회",
          "description": "유효한 JWT 토큰을 가진 클라이언트가 사용자 목록을 성공적으로 가져오는 시나리오",
          "steps": [
            {
              "actor": "Client",
              "action": "GET /users 요청 (Authorization 헤더 포함)",
              "data": {
                "Authorization": "Bearer <valid_token>"
              }
            },
            {
              "actor": "API",
              "action": "토큰 유효성 검증"
            },
            {
              "actor": "DB",
              "action": "users 테이블 전체 조회"
            },
            {
              "actor": "API",
              "action": "200 OK + 사용자 목록 반환",
              "data": {
                "total": 2
              }
            },
            {
              "actor": "Client",
              "action": "응답 수신 및 목록 렌더링"
            }
          ]
        },
        {
          "name": "실패: 토큰 없이 요청",
          "description": "Authorization 헤더 없이 요청했을 때 401을 반환하는 시나리오",
          "steps": [
            {
              "actor": "Client",
              "action": "GET /users 요청 (헤더 없음)"
            },
            {
              "actor": "API",
              "action": "Authorization 헤더 부재 확인"
            },
            {
              "actor": "API",
              "action": "401 Unauthorized 반환",
              "data": {
                "error": "Unauthorized"
              }
            },
            {
              "actor": "Client",
              "action": "오류 처리 및 로그인 페이지로 리다이렉트"
            }
          ]
        }
      ]
    },
    "endpoints/users-create.json": {
      "id": "users-create",
      "method": "POST",
      "path": "/users",
      "summary": "새 사용자 생성",
      "description": "이름, 이메일, 비밀번호를 입력받아 새 사용자를 등록합니다. 이메일 중복 시 409를 반환합니다.",
      "request": {
        "headers": [
          {
            "name": "Content-Type",
            "type": "string",
            "required": true,
            "description": "요청 바디 형식",
            "example": "application/json"
          }
        ],
        "body": [
          {
            "name": "name",
            "type": "string",
            "required": true,
            "description": "사용자 이름 (2~50자)",
            "example": "Charlie"
          },
          {
            "name": "email",
            "type": "string",
            "required": true,
            "description": "이메일 주소 (유일해야 함)",
            "example": "charlie@example.com"
          },
          {
            "name": "password",
            "type": "string",
            "required": true,
            "description": "비밀번호 (8자 이상)",
            "example": "securePass123"
          },
          {
            "name": "role",
            "type": "string",
            "required": false,
            "description": "역할 (admin | user, 기본값: user)",
            "example": "user"
          }
        ]
      },
      "responses": [
        {
          "status": 201,
          "description": "사용자 생성 성공",
          "body": {
            "id": 3,
            "name": "Charlie",
            "email": "charlie@example.com",
            "role": "user"
          }
        },
        {
          "status": 409,
          "description": "이메일 중복",
          "body": {
            "error": "Conflict",
            "message": "이미 사용 중인 이메일입니다."
          }
        },
        {
          "status": 422,
          "description": "요청 바디 유효성 검사 실패",
          "body": {
            "error": "Unprocessable Entity",
            "detail": [
              {
                "field": "email",
                "message": "올바른 이메일 형식이 아닙니다."
              }
            ]
          }
        }
      ],
      "scenarios": [
        {
          "name": "정상: 새 사용자 등록 성공",
          "description": "유효한 정보로 사용자를 생성하는 정상 시나리오",
          "steps": [
            {
              "actor": "Client",
              "action": "POST /users 요청 (name, email, password 포함)",
              "data": {
                "name": "Charlie",
                "email": "charlie@example.com",
                "password": "securePass123"
              }
            },
            {
              "actor": "API",
              "action": "요청 바디 유효성 검사 통과"
            },
            {
              "actor": "DB",
              "action": "이메일 중복 여부 조회"
            },
            {
              "actor": "DB",
              "action": "중복 없음 확인 후 신규 레코드 삽입"
            },
            {
              "actor": "API",
              "action": "201 Created + 생성된 사용자 정보 반환"
            },
            {
              "actor": "Client",
              "action": "응답 수신 (id, name, email, role)"
            }
          ]
        },
        {
          "name": "실패: 이미 존재하는 이메일로 가입 시도",
          "description": "중복 이메일로 가입 시 409 Conflict를 반환하는 시나리오",
          "steps": [
            {
              "actor": "Client",
              "action": "POST /users 요청",
              "data": {
                "email": "alice@example.com"
              }
            },
            {
              "actor": "API",
              "action": "요청 바디 유효성 검사 통과"
            },
            {
              "actor": "DB",
              "action": "이메일 중복 여부 조회"
            },
            {
              "actor": "DB",
              "action": "동일 이메일 레코드 발견"
            },
            {
              "actor": "API",
              "action": "409 Conflict 반환",
              "data": {
                "message": "이미 사용 중인 이메일입니다."
              }
            },
            {
              "actor": "Client",
              "action": "오류 메시지 표시"
            }
          ]
        },
        {
          "name": "실패: 잘못된 이메일 형식",
          "description": "이메일 형식이 맞지 않을 때 422를 반환하는 시나리오",
          "steps": [
            {
              "actor": "Client",
              "action": "POST /users 요청",
              "data": {
                "email": "not-an-email"
              }
            },
            {
              "actor": "API",
              "action": "Pydantic 유효성 검사 실패 감지"
            },
            {
              "actor": "API",
              "action": "422 Unprocessable Entity 반환",
              "data": {
                "field": "email",
                "message": "올바른 이메일 형식이 아닙니다."
              }
            },
            {
              "actor": "Client",
              "action": "필드별 오류 메시지 표시"
            }
          ]
        }
      ]
    },
    "endpoints/users-get.json": {
      "id": "users-get",
      "method": "GET",
      "path": "/users/{id}",
      "summary": "특정 사용자 조회",
      "description": "경로 파라미터로 지정한 ID에 해당하는 사용자 정보를 반환합니다.",
      "request": {
        "pathParams": [
          {
            "name": "id",
            "type": "integer",
            "required": true,
            "description": "사용자 고유 ID",
            "example": 1
          }
        ],
        "headers": [
          {
            "name": "Authorization",
            "type": "string",
            "required": true,
            "description": "Bearer 토큰",
            "example": "Bearer eyJhbGciOiJIUzI1NiJ9..."
          }
        ]
      },
      "responses": [
        {
          "status": 200,
          "description": "사용자 정보 반환 성공",
          "body": {
            "id": 1,
            "name": "Alice",
            "email": "alice@example.com",
            "role": "admin"
          }
        },
        {
          "status": 404,
          "description": "해당 ID의 사용자 없음",
          "body": {
            "error": "Not Found",
            "message": "ID 99에 해당하는 사용자를 찾을 수 없습니다."
          }
        },
        {
          "status": 401,
          "description": "인증 실패",
          "body": {
            "error": "Unauthorized",
            "message": "유효한 Bearer 토큰이 필요합니다."
          }
        }
      ],
      "scenarios": [
        {
          "name": "정상: 존재하는 사용자 조회",
          "description": "유효한 ID로 사용자를 성공적으로 조회하는 시나리오",
          "steps": [
            {
              "actor": "Client",
              "action": "GET /users/1 요청 (Authorization 헤더 포함)"
            },
            {
              "actor": "API",
              "action": "토큰 유효성 검증 통과"
            },
            {
              "actor": "DB",
              "action": "id=1 인 사용자 레코드 조회"
            },
            {
              "actor": "DB",
              "action": "레코드 반환"
            },
            {
              "actor": "API",
              "action": "200 OK + 사용자 정보 반환",
              "data": {
                "id": 1,
                "name": "Alice",
                "role": "admin"
              }
            },
            {
              "actor": "Client",
              "action": "사용자 상세 화면 렌더링"
            }
          ]
        },
        {
          "name": "실패: 존재하지 않는 ID 조회",
          "description": "없는 사용자 ID로 요청 시 404를 반환하는 시나리오",
          "steps": [
            {
              "actor": "Client",
              "action": "GET /users/99 요청"
            },
            {
              "actor": "API",
              "action": "토큰 유효성 검증 통과"
            },
            {
              "actor": "DB",
              "action": "id=99 인 사용자 레코드 조회"
            },
            {
              "actor": "DB",
              "action": "레코드 없음 (null 반환)"
            },
            {
              "actor": "API",
              "action": "404 Not Found 반환",
              "data": {
                "message": "ID 99에 해당하는 사용자를 찾을 수 없습니다."
              }
            },
            {
              "actor": "Client",
              "action": "404 페이지 또는 오류 토스트 표시"
            }
          ]
        }
      ]
    },
    "endpoints/auth-login.json": {
      "id": "auth-login",
      "method": "POST",
      "path": "/auth/login",
      "summary": "로그인 및 JWT 토큰 발급",
      "description": "이메일과 비밀번호로 인증하여 JWT 액세스 토큰을 발급받습니다. 토큰 유효기간은 1시간입니다.",
      "request": {
        "headers": [
          {
            "name": "Content-Type",
            "type": "string",
            "required": true,
            "description": "요청 바디 형식",
            "example": "application/json"
          }
        ],
        "body": [
          {
            "name": "email",
            "type": "string",
            "required": true,
            "description": "등록된 사용자 이메일",
            "example": "alice@example.com"
          },
          {
            "name": "password",
            "type": "string",
            "required": true,
            "description": "사용자 비밀번호",
            "example": "securePass123"
          }
        ]
      },
      "responses": [
        {
          "status": 200,
          "description": "로그인 성공, JWT 토큰 반환",
          "body": {
            "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "token_type": "bearer",
            "expires_in": 3600
          }
        },
        {
          "status": 401,
          "description": "이메일 또는 비밀번호 불일치",
          "body": {
            "error": "Unauthorized",
            "message": "이메일 또는 비밀번호가 올바르지 않습니다."
          }
        },
        {
          "status": 422,
          "description": "요청 바디 누락 또는 형식 오류",
          "body": {
            "error": "Unprocessable Entity",
            "detail": [
              {
                "field": "password",
                "message": "필수 항목입니다."
              }
            ]
          }
        }
      ],
      "scenarios": [
        {
          "name": "정상: 올바른 자격증명으로 로그인",
          "description": "등록된 이메일과 비밀번호로 로그인하여 JWT를 받는 시나리오",
          "steps": [
            {
              "actor": "Client",
              "action": "POST /auth/login 요청",
              "data": {
                "email": "alice@example.com",
                "password": "securePass123"
              }
            },
            {
              "actor": "API",
              "action": "요청 바디 유효성 검사 통과"
            },
            {
              "actor": "DB",
              "action": "이메일로 사용자 조회"
            },
            {
              "actor": "DB",
              "action": "사용자 레코드 반환"
            },
            {
              "actor": "API",
              "action": "비밀번호 해시 비교 (bcrypt verify)"
            },
            {
              "actor": "API",
              "action": "JWT 토큰 생성 (HS256, 1시간 만료)"
            },
            {
              "actor": "API",
              "action": "200 OK + access_token 반환"
            },
            {
              "actor": "Client",
              "action": "토큰을 로컬 스토리지에 저장 후 메인 페이지 이동"
            }
          ]
        },
        {
          "name": "실패: 틀린 비밀번호로 로그인 시도",
          "description": "비밀번호가 맞지 않을 때 401을 반환하는 시나리오",
          "steps": [
            {
              "actor": "Client",
              "action": "POST /auth/login 요청",
              "data": {
                "email": "alice@example.com",
                "password": "wrongPassword"
              }
            },
            {
              "actor": "API",
              "action": "요청 바디 유효성 검사 통과"
            },
            {
              "actor": "DB",
              "action": "이메일로 사용자 조회 후 레코드 반환"
            },
            {
              "actor": "API",
              "action": "비밀번호 해시 비교 실패"
            },
            {
              "actor": "API",
              "action": "401 Unauthorized 반환",
              "data": {
                "message": "이메일 또는 비밀번호가 올바르지 않습니다."
              }
            },
            {
              "actor": "Client",
              "action": "오류 메시지 표시 및 폼 리셋"
            }
          ]
        },
        {
          "name": "실패: 존재하지 않는 이메일로 로그인",
          "description": "가입되지 않은 이메일로 로그인 시 401을 반환하는 시나리오",
          "steps": [
            {
              "actor": "Client",
              "action": "POST /auth/login 요청",
              "data": {
                "email": "unknown@example.com"
              }
            },
            {
              "actor": "API",
              "action": "요청 바디 유효성 검사 통과"
            },
            {
              "actor": "DB",
              "action": "이메일로 사용자 조회"
            },
            {
              "actor": "DB",
              "action": "레코드 없음 (null 반환)"
            },
            {
              "actor": "API",
              "action": "401 Unauthorized 반환 (보안상 이메일 존재 여부 노출 안 함)"
            },
            {
              "actor": "Client",
              "action": "오류 메시지 표시"
            }
          ]
        }
      ]
    }
  }
};
