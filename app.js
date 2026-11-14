(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const byId = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
  const NUT = Object.fromEntries(NUTRIENTS.map(n => [n[0], n]));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const unit = s => esc(s).replace(/ug/g, "㎍");
  const shortName = p => p.name.replace(" 멀티비타민", "").replace(" 종합비타민미네랄", "");

  $("#version").textContent = `💊 ${CONFIG.version}`;

  /* ---------- STEP 1 체크리스트 ---------- */
  const CHECKS = [
    ["편식이 심해요", [4]],
    ["식사량이 적어요", [3]],
    ["쉽게 피곤해해요", [3, 6]],
    ["감기 후 입맛과 컨디션이 떨어졌어요", [9, 3]],
    ["기관생활 시작하면서 잔병치레가 많아졌어요", [0, 5]],
  ];
  const checked = new Set();
  $("#checklist").innerHTML = CHECKS.map((c, i) =>
    `<button class="check" aria-pressed="false" data-i="${i}"><span class="box">✓</span>${c[0]}</button>`).join("");
  $("#checklist").addEventListener("click", e => {
    const b = e.target.closest(".check"); if (!b) return;
    const i = +b.dataset.i;
    checked.has(i) ? checked.delete(i) : checked.add(i);
    b.setAttribute("aria-pressed", checked.has(i));
    const sits = [...new Set([...checked].flatMap(i => CHECKS[i][1]))];
    const r = $("#checkResult");
    if (!sits.length) { r.hidden = true; return; }
    r.hidden = false;
    r.innerHTML = `<p>👇 이 상황부터 먼저 보세요</p><div class="chips">${sits.map(s =>
      `<button class="chip go" data-sit="${s}">${SITUATIONS[s].icon} ${SITUATIONS[s].title}</button>`).join("")}</div>`;
  });
  $("#checkResult").addEventListener("click", e => {
    const b = e.target.closest("[data-sit]"); if (!b) return;
    selectSit(+b.dataset.sit);
    goPanel();
  });
  function goPanel() {
    const panel = $("#sitPanel");
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
    panel.classList.remove("flash"); void panel.offsetWidth; panel.classList.add("flash");
  }

  /* ---------- STEP 2 상황별 ---------- */
  $("#sitGrid").innerHTML = SITUATIONS.map((s, i) =>
    `<button class="sit" role="tab" aria-selected="false" data-i="${i}"><span class="ic">${s.icon}</span>${s.title}</button>`).join("");
  function selectSit(i) {
    $$(".sit").forEach(b => b.setAttribute("aria-selected", +b.dataset.i === i));
    const s = SITUATIONS[i];
    $("#sitPanel").innerHTML = `<div class="sit-card">
      <h3>${s.icon} ${s.title}</h3>
      ${s.order ? `<span class="sit-order">💡 ${s.order}</span>` : ""}
      <div class="minis">${s.picks.map(id => {
        const p = byId[id];
        return `<button class="mini" data-open="${id}"><img src="${p.img}" alt="" loading="lazy">${shortName(p)}<small>${p.type}</small></button>`;
      }).join("")}</div>
      <div class="why"><h4>왜 이 제품인가요?</h4><ul>${s.why.map(w => `<li>${unit(w)}</li>`).join("")}</ul></div>
      ${s.caution ? `<div class="caution"><h4>⚠️ 주의할 점</h4>${unit(s.caution)}</div>` : ""}
    </div>`;
  }
  $("#sitGrid").addEventListener("click", e => {
    const b = e.target.closest(".sit"); if (!b) return;
    selectSit(+b.dataset.i);
    goPanel();
  });
  selectSit(0);

  /* ---------- 제품 목록 + 필터 ---------- */
  const F = { group: "all", age: "all", form: "all", q: "" };
  const FG = [["all", "전체"], ["hf", "건강기능식품"], ["otc", "일반의약품"], ["add", "추가 5종 NEW"]];
  const FA = [["all", "전 연령"], ["u12", "돌 전부터 가능"], ["12m", "12개월~"], ["3y", "만 3세~"]];
  const FF = [["all", "모든 제형"], ["분말", "분말"], ["액상", "액상"], ["젤리스틱", "젤리스틱"], ["츄어블", "츄어블"]];
  const ROWS = [[$("#fGroup"), FG, "group"], [$("#fAge"), FA, "age"], [$("#fForm"), FF, "form"]];
  ROWS.forEach(([el, list, key]) => {
    el.addEventListener("click", e => {
      const b = e.target.closest(".chip"); if (!b || b.disabled) return;
      F[key] = b.dataset.v;
      renderGrid();
    });
  });
  $("#q").addEventListener("input", e => { F.q = e.target.value.trim(); renderGrid(); });

  const ageOk = (p, a) => a === "all" || (a === "u12" ? p.age === "u12" : a === "12m" ? p.age !== "3y" : true);
  const haystack = p => [p.name, p.type, p.tagline, p.flavor, p.form, ...(p.points || []), ...(p.focus || []), ...(p.sub || []), ...(p.extraMain || []),
    ...Object.keys(p.n).map(k => NUT[k][1] + " " + NUT[k][2])].join(" ").toLowerCase();
  const match = (p, f) => (f.group === "all" || p.group === f.group) && ageOk(p, f.age) &&
    (f.form === "all" || p.form === f.form) && (!f.q || haystack(p).includes(f.q.toLowerCase()));

  function renderChips() {
    ROWS.forEach(([el, list, key]) => {
      el.innerHTML = list.map(([v, t]) => {
        const n = PRODUCTS.filter(p => match(p, { ...F, [key]: v })).length;
        const on = F[key] === v;
        return `<button class="chip" aria-pressed="${on}" data-v="${v}" ${!n && !on ? "disabled" : ""}>${t} <span class="n">${n}</span></button>`;
      }).join("");
    });
    const active = F.group !== "all" || F.age !== "all" || F.form !== "all" || F.q;
    $("#fReset").hidden = !active;
  }
  function resetFilters() {
    F.group = F.age = F.form = "all"; F.q = ""; $("#q").value = "";
    renderGrid();
  }
  $("#fReset").addEventListener("click", resetFilters);

  function renderGrid() {
    renderChips();
    const list = PRODUCTS.filter(p => match(p, F));
    $("#count").textContent = `${list.length}개 제품`;
    $("#grid").innerHTML = list.length ? list.map(p => `
      <div class="card" role="button" tabindex="0" data-open="${p.id}">
        ${p.pick ? `<span class="ribbon">약사아빠 PICK</span>` : p.isNew ? `<span class="ribbon new">NEW</span>` : ""}
        <button class="cmp-add ${cmpSel.includes(p.id) ? "on" : ""}" data-cmp="${p.id}">${cmpSel.includes(p.id) ? "✓비교" : "＋비교"}</button>
        <div class="card-img"><img src="${p.img}" alt="${esc(p.name)}" loading="lazy"></div>
        <div class="card-body">
          <span class="card-type">${p.emoji} ${p.type}</span>
          <span class="card-name">${esc(p.name)}</span>
          <span class="card-meta">${p.basis} ${p.form} · ${p.flavor}</span>
          <div class="tags"><span class="tag ${p.group}">${GROUPS[p.group].name}</span><span class="tag">${p.ageText.split(" / ")[0]}</span>${p.china ? `<span class="tag warn">중국산 원료</span>` : ""}</div>
        </div>
      </div>`).join("") : `<p class="empty">조건에 맞는 제품이 없어요 🥲<br><button class="btn ghost" data-reset style="margin:12px 0">조건 초기화하기</button><br>여기 없는 제품은 <a href="#contact">상담</a> 주시면 봐드릴게요</p>`;
    const rb = $("#grid [data-reset]"); if (rb) rb.addEventListener("click", resetFilters);
  }

  /* ---------- 상세 시트 ---------- */
  const sheet = $("#sheet");
  let lastFocus = null;
  function openProduct(id) {
    const p = byId[id]; if (!p) return;
    lastFocus = document.activeElement;
    const rows = NUTRIENTS.filter(n => p.n[n[0]]).map(n => `<tr><td>${n[1]}${n[2] ? ` <small>(${n[2]})</small>` : ""}</td><td>${unit(p.n[n[0]])}</td></tr>`).join("");
    const extra = (p.extraMain || []).map(x => `<tr><td>${unit(x.replace(/ [\d.]+(mg|ug).*$/, ""))}</td><td>${unit((x.match(/[\d.]+(mg|ug).*$/) || [""])[0])}</td></tr>`).join("");
    $("#sheetContent").innerHTML = `
      <div class="d-head"><img src="${p.img}" alt="">
        <div><span class="tag ${p.group}">${GROUPS[p.group].name}</span>
        <h3 id="sheetTitle">${esc(p.name)}</h3><span class="card-type">${p.emoji} ${p.type}</span></div></div>
      <p class="d-tagline">${esc(p.tagline)}</p>
      <div class="d-box"><ul>${p.points.map(x => `<li>${unit(x)}</li>`).join("")}</ul></div>
      ${p.focus ? `<div class="d-box"><h4>🔸 눈여겨볼 성분${p.focusTitle ? ` · ${esc(p.focusTitle)}` : ""}</h4><div class="d-focus">${p.focus.map(x => `<span>${unit(x)}</span>`).join("")}</div></div>` : ""}
      <div class="d-box"><h4>💡 이런 아이에게 잘 맞아요</h4><ul>${p.goodFor.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
      ${p.warn ? `<div class="caution"><h4>⚠️ 주의할 점</h4>${unit(p.warn)}</div>` : ""}
      <div class="d-meta" style="margin:12px 0 10px">
        <div><small>기준량</small>${p.basis} (${p.form})</div>
        <div><small>맛</small>${p.flavor}</div>
        <div><small>복용 연령</small>${esc(p.ageText)}</div>
        <div><small>당함량</small>${p.sugar || "표기 없음"}</div>
      </div>
      <div class="d-box"><h4>주원료 함량 (${p.basis} 기준)</h4><table class="ntable">${rows}${extra}</table></div>
      ${p.sub && p.sub.length ? `<div class="d-box"><h4>부원료 · 기타</h4><div class="d-focus">${p.sub.map(x => `<span>${unit(x)}</span>`).join("")}</div></div>` : ""}
      <p class="small" style="color:var(--ink2)">${GROUPS[p.group].note}${p.china ? " · 중국산 원료 포함" : ""}</p>
      <div class="d-actions">
        <button class="btn ghost" data-cmp="${p.id}">${cmpSel.includes(p.id) ? "비교에서 빼기" : "＋ 비교에 담기"}</button>
        <a class="btn primary" href="${CONFIG.kakaoConsult}" target="_blank" rel="noopener">이 제품 상담하기</a>
      </div>`;
    sheet.hidden = false;
    document.body.style.overflow = "hidden";
    history.replaceState(null, "", "#p-" + id);
    $(".sheet-x").focus();
  }
  function closeSheet() {
    if (sheet.hidden) return;
    sheet.hidden = true;
    document.body.style.overflow = "";
    history.replaceState(null, "", location.pathname + location.search);
    if (lastFocus) lastFocus.focus();
  }
  sheet.addEventListener("click", e => { if (e.target.closest("[data-close]")) closeSheet(); });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeSheet();
    if ((e.key === "Enter" || e.key === " ") && e.target.matches(".card")) { e.preventDefault(); openProduct(e.target.dataset.open); }
  });

  /* ---------- 비교 ---------- */
  let cmpSel = ["immunepapa", "kidsten"];
  function toggleCmp(id) {
    if (cmpSel.includes(id)) cmpSel = cmpSel.filter(x => x !== id);
    else { if (cmpSel.length >= 3) { toast("비교는 3개까지 담을 수 있어요"); return; } cmpSel.push(id); toast(`${shortName(byId[id])} 비교에 담았어요`); }
    renderCmp(); renderGrid();
    if (!sheet.hidden) openProduct(location.hash.slice(3));
  }
  function renderCmp() {
    $("#cmpPick").innerHTML = PRODUCTS.map(p => `<button class="chip" aria-pressed="${cmpSel.includes(p.id)}" data-cmp="${p.id}">${shortName(p)}</button>`).join("");
    const ps = cmpSel.map(id => byId[id]);
    if (!ps.length) { $("#cmp").innerHTML = `<p class="cmp-empty">비교할 제품을 골라주세요</p>`; return; }
    const row = (label, fn) => `<tr><td>${label}</td>${ps.map(p => fn(p)).join("")}</tr>`;
    let body = row("구분", p => `<td><span class="tag ${p.group}">${GROUPS[p.group].name}</span></td>`)
      + row("기준량", p => `<td>${p.basis} ${p.form}</td>`)
      + row("연령", p => `<td>${esc(p.ageText.split(" / ")[0])}</td>`)
      + row("당함량", p => `<td>${p.sugar || "-"}</td>`);
    NUTRIENTS.forEach(([k, name]) => {
      if (!ps.some(p => p.n[k])) return;
      const vals = ps.map(p => parseVal(p.n[k]));
      const units = vals.filter(Boolean).map(v => v.u);
      const sameUnit = units.every(u => u === units[0]);
      const max = sameUnit && ps.length > 1 ? Math.max(...vals.map(v => v ? v.v : 0)) : null;
      body += `<tr><td>${name}</td>${ps.map((p, i) => p.n[k]
        ? `<td class="${max && vals[i].v === max ? "top" : ""}">${unit(p.n[k])}</td>` : `<td class="no">-</td>`).join("")}</tr>`;
    });
    body += row("기타", p => `<td style="font-size:12.5px">${[...(p.extraMain || []), ...(p.sub || [])].map(unit).join("<br>") || "-"}</td>`);
    $("#cmp").innerHTML = `<table style="min-width:${80 + ps.length * 115}px"><thead><tr><th>성분</th>${ps.map(p => `<th><button class="link-btn" data-open="${p.id}">${shortName(p)}</button></th>`).join("")}</tr></thead><tbody>${body}</tbody></table>${new Set(ps.map(p => p.basis)).size > 1 ? `<p class="rank-none" style="padding:0 12px 12px">※ 제품마다 성분표 기준량(1포·2포 등)이 달라요. 실제 복용량은 연령별 용량에 따라 달라지니 참고용으로 봐주세요</p>` : ""}`;
  }

  /* ---------- 성분 순위 ---------- */
  const RANK_KEYS = ["Zn", "Fe", "D", "A", "C", "B9", "Mg", "K", "Ca", "B1", "B2", "B6", "B12", "Se", "E"];
  let rankKey = "Zn";
  function parseVal(s) {
    if (!s) return null;
    const m = String(s).match(/([\d.]+)\s*(mg|ug|IU|g)/);
    return m ? { v: parseFloat(m[1]), u: m[2] } : null;
  }
  $("#nutPick").innerHTML = RANK_KEYS.map(k => `<button class="chip" aria-pressed="${k === rankKey}" data-k="${k}">${NUT[k][1].replace("비타민 ", "비타민")}</button>`).join("");
  $("#nutPick").addEventListener("click", e => {
    const b = e.target.closest(".chip"); if (!b) return;
    rankKey = b.dataset.k;
    $$("#nutPick .chip").forEach(c => c.setAttribute("aria-pressed", c === b));
    renderRank();
  });
  function renderRank() {
    const k = rankKey;
    const items = PRODUCTS.map(p => ({ p, val: parseVal(p.n[k]) })).filter(x => x.val);
    const unitCount = {}; items.forEach(x => unitCount[x.val.u] = (unitCount[x.val.u] || 0) + 1);
    const main = Object.keys(unitCount).sort((a, b) => unitCount[b] - unitCount[a])[0];
    const ok = items.filter(x => x.val.u === main).sort((a, b) => b.val.v - a.val.v);
    const odd = items.filter(x => x.val.u !== main);
    const none = PRODUCTS.filter(p => !p.n[k]);
    const max = ok.length ? ok[0].val.v : 1;
    $("#rank").innerHTML = `<div class="rank-h"><b>${NUT[k][1]}${NUT[k][2] ? ` <small>(${NUT[k][2]})</small>` : ""}</b><small>성분표 기준량(1포·2포 등) 기준</small></div>
      ${ok.map(({ p, val }) => {
        const w = Math.max(3, val.v / max * 100);
        return `<button class="bar-row" data-open="${p.id}"><span class="bar-name">${shortName(p)}</span>
          <span class="bar-track"><span class="bar-fill ${p.group}" style="width:${w}%; display:block"></span>
          <span class="bar-val ${w < 34 ? "out" : ""}" style="${w < 34 ? `left:calc(${w}% + 6px)` : ""}">${unit(p.n[k])}</span></span></button>`;
      }).join("")}
      ${odd.length ? `<p class="rank-none">단위가 달라 따로 표기: ${odd.map(x => `${shortName(x.p)} ${unit(x.p.n[k])}`).join(", ")}</p>` : ""}
      ${none.length ? `<p class="rank-none">안 들어 있음: ${none.map(shortName).join(", ")}</p>` : ""}
      <div class="legend"><span><i style="background:var(--green)"></i>건강기능식품</span><span><i style="background:var(--coral)"></i>일반의약품</span><span><i style="background:var(--blue)"></i>추가 5종</span></div>`;
  }

  /* ---------- 공동구매 ---------- */
  function renderGB() {
    const now = new Date(), s = new Date(CONFIG.groupBuyStart), e = new Date(CONFIG.groupBuyEnd);
    const md = d => `${d.getMonth() + 1}월 ${d.getDate()}일(${"일월화수목금토"[d.getDay()]})`;
    const dday = Math.ceil((e - now) / 86400000);
    const state = now < s ? "오픈 예정" : now <= e ? (dday <= 1 ? "오늘 마감!" : `진행중 · 마감 D-${dday - 1}`) : "마감";
    const btn = `<a class="btn" href="${CONFIG.groupBuyLink}" target="_blank" rel="noopener">이뮨파파 구매하러 가기 →</a>`;
    $("#gb").innerHTML = `<span class="state">${state}</span>
      <h3>📅 ${CONFIG.groupBuyRound} 공동구매 · 이뮨파파</h3>
      <p><b>${md(s)} ~ ${md(e)}</b></p>
      <p>🎁 선착순, 구매인증 이벤트도 놓치지 마세요^^</p>
      ${btn}
      <div class="gb-next"><b>🦴 칼마디케이투부스터</b> · 11월 23일부터 오픈 예정<br><span>이뮨파파랑 궁합 좋은 성장 필수 영양제예요^^</span></div>`;
  }

  /* ---------- 상담/링크 ---------- */
  const cb = [];
  cb.push(`<a class="cbtn kakao" href="${CONFIG.kakaoConsult}" target="_blank" rel="noopener"><span class="ci">💬</span><span><b>카카오톡 1:1 상담</b><small>먹이는 제품, 아이 상태 편하게 물어보세요</small></span></a>`);
  if (CONFIG.kakaoGroup) cb.push(`<a class="cbtn" href="${CONFIG.kakaoGroup}" target="_blank" rel="noopener"><span class="ci">👨‍👩‍👧</span><span><b>카카오톡 단체방 들어오기</b><small>공동구매·업데이트 소식 제일 먼저 받기</small></span></a>`);
  cb.push(`<a class="cbtn" href="${CONFIG.instagram}" target="_blank" rel="noopener"><span class="ci">📷</span><span><b>인스타그램 @yak.filter</b><small>영양제 정보 꾸준히 올리고 있어요</small></span></a>`);
  $("#contactBtns").innerHTML = cb.join("");
  $("#dockConsult").href = CONFIG.kakaoConsult;

  /* ---------- 공유 ---------- */
  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(() => t.hidden = true, 1800);
  }

  /* ---------- 공통 클릭 ---------- */
  document.addEventListener("click", e => {
    const c = e.target.closest("[data-cmp]");
    if (c) { e.stopPropagation(); toggleCmp(c.dataset.cmp); return; }
    const o = e.target.closest("[data-open]");
    if (o) openProduct(o.dataset.open);
  });

  /* ---------- 상단 탭 활성화 ---------- */
  const tabs = $$(".tabs a");
  const io = new IntersectionObserver(ents => {
    ents.forEach(en => {
      if (!en.isIntersecting) return;
      tabs.forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#" + en.target.id));
      // 상단 탭만 가로로 이동 (scrollIntoView는 페이지 스크롤을 끊어서 사용하지 않음)
      const on = $(".tabs a.on"), box = $(".tabs-inner");
      if (on) box.scrollTo({ left: on.offsetLeft - box.clientWidth / 2 + on.offsetWidth / 2, behavior: "smooth" });
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("main .section").forEach(s => io.observe(s));

  renderGrid(); renderCmp(); renderRank(); renderGB();
  if (location.hash.startsWith("#p-")) openProduct(location.hash.slice(3));
})();
