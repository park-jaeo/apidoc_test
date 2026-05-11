// 사이드바 네비게이션 구조 정의
const NAV = [
  {
    section: "소개",
    items: [
      { id: "introduction", label: "프로젝트 개요" },
      { id: "quickstart",   label: "빠른 시작" },
    ],
  },
  {
    section: "API 명세",
    items: [
      {
        label: "Users",
        children: [
          { id: "users-list",   label: "목록 조회" },
          { id: "users-create", label: "사용자 생성" },
          { id: "users-get",    label: "단일 조회" },
        ],
      },
      {
        label: "Auth",
        children: [
          { id: "auth-login", label: "로그인" },
        ],
      },
    ],
  },
  {
    section: "예시",
    items: [
      { id: "image-example", label: "이미지 삽입 예시" },
    ],
  },
];

// ── 사이드바 빌드 ──
function buildSidebar() {
  const sidebar = document.getElementById("sidebar");
  let html = "";

  NAV.forEach((group, gi) => {
    if (gi > 0) html += `<div class="sidebar-divider"></div>`;
    html += `<div class="sidebar-section">`;
    html += `<div class="sidebar-section-label">${group.section}</div>`;

    group.items.forEach((item) => {
      if (item.children) {
        // 그룹 부모 (클릭 불가, 레이블 역할)
        html += `<div class="nav-item group">${item.label}</div>`;
        item.children.forEach((child) => {
          html += `<a class="nav-item child" data-target="${child.id}">${child.label}</a>`;
        });
      } else {
        html += `<a class="nav-item" data-target="${item.id}">${item.label}</a>`;
      }
    });

    html += `</div>`;
  });

  sidebar.innerHTML = html;

  // 클릭 이벤트
  sidebar.querySelectorAll(".nav-item[data-target]").forEach((el) => {
    el.addEventListener("click", () => navigate(el.dataset.target));
  });
}

// ── 페이지 전환 ──
function navigate(id) {
  // 페이지
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
  const target = document.getElementById(id);
  if (target) target.classList.add("active");

  // 사이드바 활성 표시
  document.querySelectorAll(".nav-item[data-target]").forEach((el) => {
    el.classList.toggle("active", el.dataset.target === id);
  });

  // URL 해시 동기화 (파일 접근 시에도 동작)
  history.replaceState(null, "", `#${id}`);
  window.scrollTo(0, 0);
}

// ── 테마 토글 ──
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.dataset.theme === "dark";
  html.dataset.theme = isDark ? "light" : "dark";
  document.getElementById("theme-btn").textContent = isDark ? "🌙" : "☀";
  localStorage.setItem("theme", html.dataset.theme);
}

// ── 초기화 ──
document.addEventListener("DOMContentLoaded", () => {
  // 저장된 테마 복원
  const saved = localStorage.getItem("theme") || "dark";
  document.documentElement.dataset.theme = saved;
  document.getElementById("theme-btn").textContent = saved === "dark" ? "☀" : "🌙";

  buildSidebar();

  // URL 해시 기반 초기 페이지, 없으면 introduction
  const initial = location.hash.replace("#", "") || "introduction";
  navigate(initial);
});
