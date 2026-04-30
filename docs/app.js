/* ===================================================
 * API 문서 뷰어 — app.js
 * 역할: index.json 로드 → 사이드바 렌더링 → 엔드포인트 클릭 시
 *       endpoints/*.json 로드 → 요청/응답 스키마 표시 +
 *       Mermaid 시나리오 다이어그램 + cURL 자동 생성
 * =================================================== */

// ───────── 전역 상태 ─────────
let apiIndex = null;          // index.json 내용
let currentEndpoint = null;   // 현재 선택된 엔드포인트 데이터
let isDark = false;           // 다크 모드 여부

// ───────── 초기화 ─────────
document.addEventListener("DOMContentLoaded", async () => {
  // 저장된 테마 복원
  isDark = localStorage.getItem("theme") === "dark";
  applyTheme();

  await loadIndex();
});

// ───────── index.json 로드 및 사이드바 렌더링 ─────────
async function loadIndex() {
  try {
    const res = await fetch("index.json");
    if (!res.ok) throw new Error(`index.json 로드 실패: ${res.status}`);
    apiIndex = await res.json();
    renderSidebar(apiIndex);
  } catch (e) {
    document.getElementById("sidebar-nav").innerHTML =
      `<div style="padding:16px;color:#f85149;font-size:12px;">index.json 로드 오류: ${e.message}</div>`;
  }
}

function renderSidebar(index) {
  const nav = document.getElementById("sidebar-nav");
  document.getElementById("sidebar-title").textContent = index.title;
  document.getElementById("sidebar-version").textContent = `v${index.version}`;

  nav.innerHTML = index.groups
    .map(
      (group) => `
      <div class="group-label">${group.name}</div>
      ${group.endpoints
        .map(
          (ep) => `
        <div class="endpoint-item"
             data-file="${ep.file}"
             data-id="${ep.id}"
             onclick="loadEndpoint('${ep.file}', '${ep.id}', this)">
          <span class="badge badge-${ep.method}">${ep.method}</span>
          <span class="endpoint-path">${ep.path}</span>
        </div>`
        )
        .join("")}
    `
    )
    .join("");
}

// ───────── 엔드포인트 JSON 로드 및 메인 패널 렌더링 ─────────
async function loadEndpoint(file, id, el) {
  // 활성 항목 표시
  document.querySelectorAll(".endpoint-item").forEach((i) => i.classList.remove("active"));
  el.classList.add("active");

  const main = document.getElementById("main-content");
  main.innerHTML = `<div class="loading">로딩 중…</div>`;

  try {
    const res = await fetch(file);
    if (!res.ok) throw new Error(`${file} 로드 실패: ${res.status}`);
    currentEndpoint = await res.json();
    renderEndpoint(currentEndpoint);
  } catch (e) {
    main.innerHTML = `<div class="error-msg">엔드포인트 데이터 로드 오류: ${e.message}</div>`;
  }
}

function renderEndpoint(ep) {
  const main = document.getElementById("main-content");
  main.innerHTML = `
    ${renderHeader(ep)}
    ${renderRequest(ep.request)}
    ${renderResponses(ep.responses)}
    ${renderCurl(ep)}
    ${renderScenarios(ep.scenarios)}
  `;

  // Mermaid 다이어그램 초기화 (첫 번째 탭)
  renderMermaid(0);
}

// ── 헤더 (메서드 배지 + 경로 + 요약/설명) ──
function renderHeader(ep) {
  return `
    <div class="endpoint-header">
      <div class="endpoint-title">
        <span class="badge badge-${ep.method}">${ep.method}</span>
        <span class="path">${ep.path}</span>
      </div>
      <div class="endpoint-summary">${ep.summary}</div>
      <div class="endpoint-description">${ep.description}</div>
    </div>`;
}

// ── 요청 스키마 섹션 ──
function renderRequest(req) {
  if (!req) return "";
  const parts = [];

  if (req.pathParams?.length) {
    parts.push(renderParamTable("경로 파라미터", req.pathParams));
  }
  if (req.queryParams?.length) {
    parts.push(renderParamTable("쿼리 파라미터", req.queryParams));
  }
  if (req.headers?.length) {
    parts.push(renderParamTable("요청 헤더", req.headers));
  }
  if (req.body?.length) {
    parts.push(renderParamTable("요청 바디", req.body));
  }

  if (!parts.length) return "";

  return `
    <div class="section">
      <div class="section-title">요청</div>
      ${parts.join("")}
    </div>`;
}

function renderParamTable(title, params) {
  const rows = params
    .map(
      (p) => `
      <tr>
        <td><span class="param-name">${p.name}</span></td>
        <td><span class="param-type">${p.type}</span></td>
        <td>${
          p.required
            ? '<span class="badge-required">필수</span>'
            : '<span class="badge-optional">선택</span>'
        }</td>
        <td>${p.description}</td>
        <td><code>${p.example !== undefined ? JSON.stringify(p.example) : "-"}</code></td>
      </tr>`
    )
    .join("");

  return `
    <p style="font-size:12px;font-weight:600;margin:12px 0 6px;color:var(--text-secondary);">${title}</p>
    <table class="param-table">
      <thead>
        <tr>
          <th>이름</th><th>타입</th><th>필수 여부</th><th>설명</th><th>예시</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ── 응답 섹션 ──
function renderResponses(responses) {
  if (!responses?.length) return "";

  const items = responses
    .map((r) => {
      const cls =
        r.status < 300 ? "status-2xx" : r.status < 500 ? "status-4xx" : "status-5xx";
      const bodyJson = JSON.stringify(r.body, null, 2);
      return `
        <div class="response-item">
          <div class="response-header" onclick="toggleResponse(this)">
            <span class="status-badge ${cls}">${r.status}</span>
            <span class="response-desc">${r.description}</span>
            <span>▾</span>
          </div>
          <div class="response-body" style="display:none;">
            <pre>${escapeHtml(bodyJson)}</pre>
          </div>
        </div>`;
    })
    .join("");

  return `
    <div class="section">
      <div class="section-title">응답</div>
      ${items}
    </div>`;
}

function toggleResponse(header) {
  const body = header.nextElementSibling;
  const arrow = header.lastElementChild;
  const isOpen = body.style.display !== "none";
  body.style.display = isOpen ? "none" : "block";
  arrow.textContent = isOpen ? "▾" : "▴";
}

// ── cURL 자동 생성 ──
function renderCurl(ep) {
  const curl = buildCurl(ep);
  return `
    <div class="section">
      <div class="section-title">cURL 예시</div>
      <div class="curl-wrapper">
        <button class="copy-btn" onclick="copyCurl(this)">복사</button>
        <pre id="curl-code">${escapeHtml(curl)}</pre>
      </div>
    </div>`;
}

function buildCurl(ep) {
  const baseUrl = apiIndex?.baseUrl ?? "http://localhost:8000";
  let path = ep.path;

  // 경로 파라미터를 예시 값으로 치환
  if (ep.request?.pathParams) {
    for (const p of ep.request.pathParams) {
      path = path.replace(`{${p.name}}`, p.example ?? `<${p.name}>`);
    }
  }

  // 쿼리 파라미터 (required만)
  const qp = ep.request?.queryParams?.filter((p) => p.required) ?? [];
  if (qp.length) {
    const qs = qp.map((p) => `${p.name}=${encodeURIComponent(p.example ?? "")}`).join("&");
    path += `?${qs}`;
  }

  const lines = [`curl -X ${ep.method} "${baseUrl}${path}" \\`];

  // 헤더
  for (const h of ep.request?.headers ?? []) {
    lines.push(`  -H "${h.name}: ${h.example}" \\`);
  }

  // 바디
  if (ep.request?.body?.length) {
    const bodyObj = {};
    for (const b of ep.request.body) {
      bodyObj[b.name] = b.example;
    }
    lines.push(`  -H "Content-Type: application/json" \\`);
    lines.push(`  -d '${JSON.stringify(bodyObj, null, 2)}'`);
  } else {
    // 마지막 줄에서 불필요한 역슬래시 제거
    lines[lines.length - 1] = lines[lines.length - 1].replace(/ \\$/, "");
  }

  return lines.join("\n");
}

function copyCurl(btn) {
  const code = document.getElementById("curl-code").textContent;
  navigator.clipboard.writeText(code).then(() => {
    btn.textContent = "복사됨!";
    btn.classList.add("copied");
    setTimeout(() => {
      btn.textContent = "복사";
      btn.classList.remove("copied");
    }, 1800);
  });
}

// ── 시나리오 탭 + Mermaid 다이어그램 ──
function renderScenarios(scenarios) {
  if (!scenarios?.length) return "";

  const tabs = scenarios
    .map(
      (s, i) =>
        `<button class="tab-btn ${i === 0 ? "active" : ""}"
                 onclick="switchTab(${i})">${s.name}</button>`
    )
    .join("");

  const panels = scenarios
    .map(
      (s, i) => `
      <div class="scenario-panel ${i === 0 ? "active" : ""}" id="scenario-panel-${i}">
        <div class="scenario-desc">${s.description}</div>
        <div class="mermaid-container" id="mermaid-wrap-${i}">
          <div class="loading">다이어그램 렌더링 중…</div>
        </div>
      </div>`
    )
    .join("");

  return `
    <div class="section">
      <div class="section-title">시나리오</div>
      <div class="tabs">${tabs}</div>
      ${panels}
    </div>`;
}

function switchTab(index) {
  // 탭 버튼 활성화
  document.querySelectorAll(".tab-btn").forEach((b, i) =>
    b.classList.toggle("active", i === index)
  );
  // 패널 전환
  document.querySelectorAll(".scenario-panel").forEach((p, i) =>
    p.classList.toggle("active", i === index)
  );
  // 해당 탭 다이어그램 렌더링 (아직 렌더링 안 된 경우)
  renderMermaid(index);
}

// 시나리오 steps → Mermaid sequenceDiagram 텍스트 변환
function buildMermaid(steps) {
  // 등장 액터 순서대로 유니크하게 수집
  const actors = [...new Set(steps.map((s) => s.actor))];
  const actorAliases = {
    Client: "클라이언트",
    API: "API 서버",
    DB: "데이터베이스",
    External: "외부 서비스",
  };

  const participants = actors
    .map((a) => `  participant ${a} as ${actorAliases[a] ?? a}`)
    .join("\n");

  // steps를 화살표로 변환: 각 step은 이전 actor → 현재 actor 로 메시지
  const arrows = [];
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const prevActor = i === 0 ? step.actor : steps[i - 1].actor;
    const label = step.data
      ? `${step.action}<br/>${JSON.stringify(step.data)
          .replace(/"/g, "")
          .replace(/,/g, ", ")
          .slice(0, 60)}`
      : step.action;

    arrows.push(`  ${prevActor}->>${step.actor}: ${label}`);
  }

  return `sequenceDiagram\n${participants}\n${arrows.join("\n")}`;
}

// 렌더링된 패널 추적 (중복 렌더 방지)
const renderedPanels = new Set();

async function renderMermaid(index) {
  if (renderedPanels.has(index)) return;
  if (!currentEndpoint?.scenarios?.[index]) return;

  const wrap = document.getElementById(`mermaid-wrap-${index}`);
  if (!wrap) return;

  const steps = currentEndpoint.scenarios[index].steps;
  const definition = buildMermaid(steps);

  try {
    // mermaid.render() API를 통해 SVG 생성
    const id = `mermaid-svg-${index}-${Date.now()}`;
    const { svg } = await mermaid.render(id, definition);
    wrap.innerHTML = svg;
    renderedPanels.add(index);
  } catch (e) {
    wrap.innerHTML = `<pre style="text-align:left;font-size:11px;">${escapeHtml(definition)}</pre>
      <div class="error-msg" style="margin-top:8px;">다이어그램 렌더링 실패: ${e.message}</div>`;
  }
}

// ───────── 다크 모드 ─────────
function toggleTheme() {
  isDark = !isDark;
  applyTheme();
}

function applyTheme() {
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  const btn = document.getElementById("theme-btn");
  if (btn) btn.textContent = isDark ? "☀ 라이트 모드" : "☾ 다크 모드";

  // Mermaid 테마 재설정 (페이지 로드 후 최초 1회만 init 하므로 여기서 재설정)
  if (typeof mermaid !== "undefined") {
    mermaid.initialize({ startOnLoad: false, theme: isDark ? "dark" : "default" });
    // 이미 렌더링된 패널 초기화 (테마 변경 시 재렌더)
    renderedPanels.clear();
    if (currentEndpoint) {
      // 현재 활성 탭 인덱스 찾기
      const activePanel = document.querySelector(".scenario-panel.active");
      if (activePanel) {
        const idx = parseInt(activePanel.id.split("-").pop(), 10);
        const wrap = document.getElementById(`mermaid-wrap-${idx}`);
        if (wrap) {
          wrap.innerHTML = `<div class="loading">다이어그램 재렌더링 중…</div>`;
          renderMermaid(idx);
        }
      }
    }
  }
}

// ───────── 유틸 ─────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
