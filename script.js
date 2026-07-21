// ===== 곡명 마퀴 (항상 슬라이드) =====
window.addEventListener("load", () => {
  document.querySelectorAll(".marquee").forEach((marquee) => {
    const track = marquee.querySelector(".marquee__track");
    const item = track.querySelector(".marquee__item");

    const clone = item.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    track.appendChild(clone);
    track.classList.add("is-animating");

    const speed = 45; // px/초
    track.style.animationDuration = item.scrollWidth / speed + "s";
  });
});

// ===== 뮤직 플레이어 (재생/일시정지, 무한 반복, 진행바) =====
(() => {
  const audio = document.getElementById("player-audio");
  const playBtn = document.getElementById("playBtn");
  const fill = document.querySelector(".progress__fill");
  const knob = document.querySelector(".progress__knob");
  const progress = document.querySelector(".progress");
  if (!audio || !playBtn) return;

  audio.loop = true;

  playBtn.addEventListener("click", () => {
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  });

  audio.addEventListener("play", () => playBtn.classList.add("is-playing"));
  audio.addEventListener("pause", () => playBtn.classList.remove("is-playing"));

  audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    fill.style.width = pct + "%";
    knob.style.left = pct + "%";
  });

  progress.addEventListener("click", (e) => {
    if (!audio.duration) return;
    const rect = progress.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = Math.max(0, Math.min(1, ratio)) * audio.duration;
  });
})();

// ===== 위치/날씨 =====
(() => {
  // 주요 도시 (한글명, 위도, 경도)
  const CITIES = [
    { name: "서울", lat: 37.5665, lon: 126.978 },
    { name: "인천", lat: 37.4563, lon: 126.7052 },
    { name: "수원", lat: 37.2636, lon: 127.0286 },
    { name: "성남", lat: 37.42, lon: 127.1265 },
    { name: "고양", lat: 37.6584, lon: 126.832 },
    { name: "용인", lat: 37.2411, lon: 127.1776 },
    { name: "부천", lat: 37.5034, lon: 126.766 },
    { name: "안산", lat: 37.3219, lon: 126.8309 },
    { name: "안양", lat: 37.3943, lon: 126.9568 },
    { name: "남양주", lat: 37.636, lon: 127.2165 },
    { name: "평택", lat: 36.9921, lon: 127.1129 },
    { name: "의정부", lat: 37.7381, lon: 127.0337 },
    { name: "파주", lat: 37.7599, lon: 126.78 },
    { name: "김포", lat: 37.6152, lon: 126.7156 },
    { name: "춘천", lat: 37.8813, lon: 127.73 },
    { name: "원주", lat: 37.3422, lon: 127.9202 },
    { name: "강릉", lat: 37.7519, lon: 128.8761 },
    { name: "대전", lat: 36.3504, lon: 127.3845 },
    { name: "세종", lat: 36.48, lon: 127.289 },
    { name: "청주", lat: 36.6424, lon: 127.489 },
    { name: "천안", lat: 36.8151, lon: 127.1139 },
    { name: "충주", lat: 36.9911, lon: 127.9259 },
    { name: "전주", lat: 35.8242, lon: 127.148 },
    { name: "군산", lat: 35.9676, lon: 126.7368 },
    { name: "광주", lat: 35.1595, lon: 126.8526 },
    { name: "목포", lat: 34.8118, lon: 126.3922 },
    { name: "여수", lat: 34.7604, lon: 127.6622 },
    { name: "순천", lat: 34.9506, lon: 127.4872 },
    { name: "대구", lat: 35.8714, lon: 128.6014 },
    { name: "포항", lat: 36.019, lon: 129.3435 },
    { name: "경주", lat: 35.8562, lon: 129.2247 },
    { name: "구미", lat: 36.1195, lon: 128.3446 },
    { name: "안동", lat: 36.5684, lon: 128.7294 },
    { name: "울산", lat: 35.5384, lon: 129.3114 },
    { name: "부산", lat: 35.1796, lon: 129.0756 },
    { name: "창원", lat: 35.228, lon: 128.6811 },
    { name: "진주", lat: 35.18, lon: 128.1076 },
    { name: "김해", lat: 35.2286, lon: 128.8894 },
    { name: "제주", lat: 33.4996, lon: 126.5312 },
    { name: "서귀포", lat: 33.2541, lon: 126.56 },
  ];

  // WMO weather_code -> {text, icon}
  function mapWeather(code) {
    const c = Number(code);
    if ([71, 73, 75, 77, 85, 86].includes(c)) return { text: "눈", icon: "snowy" };
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(c)) {
      return { text: c >= 95 ? "뇌우" : "비", icon: "rainy" };
    }
    if (c === 0) return { text: "맑음", icon: "cloudy" };
    if (c === 1) return { text: "구름 조금", icon: "cloudy" };
    if (c === 2) return { text: "구름 많음", icon: "cloudy" };
    if (c === 45 || c === 48) return { text: "안개", icon: "cloudy" };
    return { text: "흐림", icon: "cloudy" }; // 3 및 기본
  }

  // ---- 위치 좌표 얻기 (GPS 우선, 실패 시 IP) ----
  async function ipCoords() {
    try {
      const r = await fetch("https://ipwho.is/");
      const j = await r.json();
      if (j && j.latitude) return { lat: j.latitude, lon: j.longitude };
    } catch (e) {}
    return null;
  }

  function getCoords() {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
          () => ipCoords().then(resolve),
          { timeout: 8000, maximumAge: 600000 }
        );
      } else {
        ipCoords().then(resolve);
      }
    });
  }

  // ---- 위치 칩: 한글 주소 + 현재 온도 ----
  async function fillChip(lat, lon) {
    const addrEl = document.querySelector(".chip__addr");
    const tempEl = document.querySelector(".chip__temp");
    if (!addrEl || !tempEl) return;
    try {
      const [wRes, gRes] = await Promise.all([
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m`),
        fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=ko`),
      ]);
      const w = await wRes.json();
      const g = await gRes.json();
      if (w && w.current && typeof w.current.temperature_2m === "number") {
        tempEl.innerHTML = Math.round(w.current.temperature_2m) + '<span class="chip__unit">°C</span>';
      }
      const parts = [g.principalSubdivision, g.city || g.locality].filter(Boolean);
      if (parts.length) addrEl.textContent = parts.join(" ");
    } catch (e) {}
  }

  // ---- 다른 지역 카드: 가장 가까운 다른 도시 3곳 ----
  async function fillRegions(lat, lon) {
    const cards = document.querySelectorAll(".region-card");
    if (!cards.length) return;

    const cosLat = Math.cos((lat * Math.PI) / 180);
    const picks = CITIES.map((c) => ({
      c,
      d: (c.lat - lat) ** 2 + ((c.lon - lon) * cosLat) ** 2,
    }))
      .sort((a, b) => a.d - b.d)
      .slice(1, 4) // 가장 가까운 1곳(=내 지역) 제외 후 3곳
      .map((x) => x.c);

    // 먼저 도시명 + 기본 아이콘 세팅
    picks.forEach((p, i) => {
      const card = cards[i];
      card.querySelector(".region-card__name span").textContent = p.name;
      card.querySelector(".ricon__art img").src = "cloudy.svg";
    });

    try {
      const lats = picks.map((p) => p.lat).join(",");
      const lons = picks.map((p) => p.lon).join(",");
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,weather_code`
      );
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [data];

      picks.forEach((p, i) => {
        const cur = (arr[i] && arr[i].current) || {};
        const w = mapWeather(cur.weather_code);
        const card = cards[i];
        card.querySelector(".region-card__cond").textContent = w.text;
        if (typeof cur.temperature_2m === "number") {
          card.querySelector(".region-card__temp").innerHTML =
            Math.round(cur.temperature_2m) + '<span class="region-card__unit">°C</span>';
        }
        const ricon = card.querySelector(".ricon");
        ricon.classList.remove("ricon--cloudy", "ricon--rainy", "ricon--snowy");
        ricon.classList.add("ricon--" + w.icon);
        card.querySelector(".ricon__art img").src = w.icon + ".svg";
      });
    } catch (e) {}
  }

  getCoords().then((coords) => {
    if (!coords) return;
    fillChip(coords.lat, coords.lon);
    fillRegions(coords.lat, coords.lon);
  });
})();

// ===== 마지막 섹션 배경: 접속 시간대별 =====
// morning / lunch / evening / night .png 파일이 폴더에 있으면 자동 교체 (없으면 sky.png 유지)
(() => {
  const el = document.querySelector(".bg-regions");
  if (!el) return;
  const h = new Date().getHours();
  let img = "night.png"; // 밤 (21~4시)
  if (h >= 5 && h < 11) img = "morning.png"; // 아침 (5~10시)
  else if (h >= 11 && h < 17) img = "lunch.png"; // 점심 (11~16시)
  else if (h >= 17 && h < 21) img = "evening.png"; // 저녁 (17~20시)

  // 파일이 실제로 있을 때만 배경 교체 (없으면 CSS 기본값 sky.png 유지)
  const probe = new Image();
  probe.onload = () => {
    el.style.backgroundImage = `url("${img}")`;
  };
  probe.src = img;
})();

// ===== 배경 크로스페이드 (스크롤 위치에 비례) =====
(() => {
  const song = document.querySelector(".bg-song");
  const regions = document.querySelector(".bg-regions");
  if (!song || !regions) return;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const update = () => {
    const vh = window.innerHeight || 1;
    const t = window.scrollY / vh; // 0=맑음, 1=노래, 2=다른지역
    // 잎사귀(bg-hero)는 항상 바닥, 위 레이어를 순서대로 페이드인
    song.style.opacity = clamp(t, 0, 1);
    regions.style.opacity = clamp(t - 1, 0, 1);
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
})();

// ===== 스크롤 등장 애니메이션 =====
(() => {
  const sections = document.querySelectorAll(".hero, .song, .regions");
  if (!sections.length) return;

  const reveal = (s) => s.classList.add("in-view");
  const unreveal = (s) => s.classList.remove("in-view");

  // 화면 중앙 밴드(25%~75%)에 걸치면 '보임'으로 판단
  const inBand = (el) => {
    const r = el.getBoundingClientRect();
    return r.top < window.innerHeight * 0.75 && r.bottom > window.innerHeight * 0.25;
  };

  // 첫 페인트 뒤 등장 → 로드 애니메이션 재생 (setTimeout은 백그라운드 탭에서도 동작)
  const revealVisible = () => sections.forEach((s) => inBand(s) && reveal(s));
  setTimeout(revealVisible, 60);
  window.addEventListener("load", () => setTimeout(revealVisible, 60));

  // 스크롤 진입/이탈 감지 (재진입 시 다시 재생)
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.intersectionRatio >= 0.25) reveal(e.target);
          else if (e.intersectionRatio <= 0.1) unreveal(e.target);
        });
      },
      { threshold: [0, 0.1, 0.25, 0.5, 1] }
    );
    sections.forEach((s) => io.observe(s));
  } else {
    // 폴백: 스크롤 이벤트
    const onScroll = () => sections.forEach((s) => (inBand(s) ? reveal(s) : unreveal(s)));
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
  }
})();

