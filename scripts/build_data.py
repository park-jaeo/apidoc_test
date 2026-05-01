"""
docs/index.json + endpoints/*.json → docs/data.js 번들링

file:// 직접 실행 시 fetch()가 차단되므로,
모든 JSON을 window.API_DATA JS 변수로 묶어 data.js를 생성합니다.
JSON 파일 수정 후 반드시 이 스크립트를 다시 실행하세요.
"""

import json
from pathlib import Path

DOCS_DIR = Path(__file__).parent.parent / "docs"
OUTPUT = DOCS_DIR / "data.js"


def build():
    # index.json 로드
    index_path = DOCS_DIR / "index.json"
    if not index_path.exists():
        print(f"오류: {index_path} 파일이 없습니다.")
        raise SystemExit(1)

    with index_path.open(encoding="utf-8") as f:
        index = json.load(f)

    # index.json에 등록된 엔드포인트 파일 로드
    endpoints: dict[str, dict] = {}
    missing: list[str] = []

    for group in index.get("groups", []):
        for ep in group.get("endpoints", []):
            file_rel = ep["file"]
            file_path = DOCS_DIR / file_rel
            if file_path.exists():
                with file_path.open(encoding="utf-8") as f:
                    endpoints[file_rel] = json.load(f)
            else:
                missing.append(file_rel)

    if missing:
        for m in missing:
            print(f"  경고: 파일 없음 → {m}")

    # data.js 생성
    payload = json.dumps({"index": index, "endpoints": endpoints},
                         ensure_ascii=False, indent=2)

    OUTPUT.write_text(
        f"// 자동 생성 파일 — scripts/build_data.py 실행으로 갱신\n"
        f"// JSON 파일 수정 후 반드시 다시 실행하세요: python scripts/build_data.py\n"
        f"window.API_DATA = {payload};\n",
        encoding="utf-8",
    )

    print(f"생성 완료: {OUTPUT.relative_to(OUTPUT.parent.parent)}")
    print(f"  엔드포인트 {len(endpoints)}개 포함")


if __name__ == "__main__":
    build()
