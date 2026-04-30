"""
docs/ 폴더 JSON 스키마 검증 스크립트

검증 항목:
  1. docs/index.json 구조 유효성
  2. index.json에 등록된 file 경로가 실제 존재하는지
  3. 각 endpoints/*.json 구조 유효성
  4. scenarios가 있을 경우 actor 값이 허용 목록 안인지
"""

import json
import sys
from pathlib import Path

import jsonschema
from jsonschema import validate, ValidationError

# ───────── 스키마 정의 ─────────

INDEX_SCHEMA = {
    "type": "object",
    "required": ["title", "version", "baseUrl", "groups"],
    "properties": {
        "title":   {"type": "string", "minLength": 1},
        "version": {"type": "string", "minLength": 1},
        "baseUrl": {"type": "string", "format": "uri"},
        "description": {"type": "string"},
        "groups": {
            "type": "array",
            "minItems": 1,
            "items": {
                "type": "object",
                "required": ["name", "endpoints"],
                "properties": {
                    "name":        {"type": "string"},
                    "description": {"type": "string"},
                    "endpoints": {
                        "type": "array",
                        "minItems": 1,
                        "items": {
                            "type": "object",
                            "required": ["id", "method", "path", "summary", "file"],
                            "properties": {
                                "id":      {"type": "string"},
                                "method":  {"type": "string", "enum": ["GET", "POST", "PUT", "PATCH", "DELETE"]},
                                "path":    {"type": "string"},
                                "summary": {"type": "string"},
                                "file":    {"type": "string"},
                            },
                        },
                    },
                },
            },
        },
    },
}

# 파라미터 항목 공통 스키마
PARAM_ITEM_SCHEMA = {
    "type": "object",
    "required": ["name", "type", "required", "description"],
    "properties": {
        "name":        {"type": "string"},
        "type":        {"type": "string"},
        "required":    {"type": "boolean"},
        "description": {"type": "string"},
        "example":     {},  # 타입 무관
    },
}

STEP_SCHEMA = {
    "type": "object",
    "required": ["actor", "action"],
    "properties": {
        "actor":  {"type": "string", "enum": ["Client", "API", "DB", "External"]},
        "action": {"type": "string"},
        "data":   {"type": "object"},
    },
}

ENDPOINT_SCHEMA = {
    "type": "object",
    "required": ["id", "method", "path", "summary", "description", "responses"],
    "properties": {
        "id":          {"type": "string"},
        "method":      {"type": "string", "enum": ["GET", "POST", "PUT", "PATCH", "DELETE"]},
        "path":        {"type": "string"},
        "summary":     {"type": "string"},
        "description": {"type": "string"},
        "request": {
            "type": "object",
            "properties": {
                "pathParams":  {"type": "array", "items": PARAM_ITEM_SCHEMA},
                "queryParams": {"type": "array", "items": PARAM_ITEM_SCHEMA},
                "headers":     {"type": "array", "items": PARAM_ITEM_SCHEMA},
                "body":        {"type": "array", "items": PARAM_ITEM_SCHEMA},
            },
        },
        "responses": {
            "type": "array",
            "minItems": 1,
            "items": {
                "type": "object",
                "required": ["status", "description", "body"],
                "properties": {
                    "status":      {"type": "integer"},
                    "description": {"type": "string"},
                    "body":        {"type": "object"},
                },
            },
        },
        "scenarios": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["name", "description", "steps"],
                "properties": {
                    "name":        {"type": "string"},
                    "description": {"type": "string"},
                    "steps": {
                        "type": "array",
                        "minItems": 1,
                        "items": STEP_SCHEMA,
                    },
                },
            },
        },
    },
}

# ───────── 검증 로직 ─────────

DOCS_DIR = Path(__file__).parent.parent / "docs"

errors: list[str] = []
warnings: list[str] = []


def check(condition: bool, msg: str) -> bool:
    if not condition:
        errors.append(msg)
    return condition


def validate_schema(data: dict, schema: dict, label: str) -> bool:
    try:
        validate(instance=data, schema=schema)
        return True
    except ValidationError as e:
        errors.append(f"[스키마 오류] {label}: {e.message} (경로: {' > '.join(str(p) for p in e.absolute_path)})")
        return False


def run():
    print("=" * 55)
    print("  API 문서 JSON 스키마 검증")
    print("=" * 55)

    # ── 1. index.json 로드 및 검증 ──
    index_path = DOCS_DIR / "index.json"
    if not check(index_path.exists(), f"index.json 파일 없음: {index_path}"):
        _report_and_exit()

    with index_path.open(encoding="utf-8") as f:
        index = json.load(f)

    print(f"\n[1] index.json 스키마 검증 중…")
    if validate_schema(index, INDEX_SCHEMA, "index.json"):
        print("    ✓ 구조 유효")

    # ── 2. file 경로 존재 여부 확인 ──
    print(f"\n[2] 엔드포인트 파일 존재 여부 확인 중…")
    all_files: list[str] = []
    for group in index.get("groups", []):
        for ep in group.get("endpoints", []):
            file_rel = ep.get("file", "")
            file_path = DOCS_DIR / file_rel
            all_files.append(file_rel)
            if check(file_path.exists(), f"    ✗ 파일 없음: {file_rel}"):
                print(f"    ✓ {file_rel}")

    # ── 3. 각 endpoint JSON 검증 ──
    print(f"\n[3] 각 endpoints/*.json 스키마 검증 중…")
    for file_rel in all_files:
        file_path = DOCS_DIR / file_rel
        if not file_path.exists():
            continue
        with file_path.open(encoding="utf-8") as f:
            ep_data = json.load(f)

        if validate_schema(ep_data, ENDPOINT_SCHEMA, file_rel):
            scenario_count = len(ep_data.get("scenarios", []))
            if scenario_count < 2:
                warnings.append(f"[경고] {file_rel}: 시나리오가 {scenario_count}개입니다 (권장: 2개 이상)")
            print(f"    ✓ {file_rel} (시나리오 {scenario_count}개)")

    # ── 결과 출력 ──
    _report_and_exit()


def _report_and_exit():
    print("\n" + "=" * 55)
    if warnings:
        print("경고:")
        for w in warnings:
            print(f"  ⚠  {w}")

    if errors:
        print(f"\n검증 실패: {len(errors)}개 오류")
        for e in errors:
            print(f"  ✗  {e}")
        sys.exit(1)
    else:
        print("검증 완료: 모든 파일이 유효합니다. ✓")
        sys.exit(0)


if __name__ == "__main__":
    run()
