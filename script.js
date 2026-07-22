// ===== 날씨별 컨텐츠 (타이틀/서브타이틀/곡명) =====
const WEATHER = {
  clear: {
    title: "오늘 하늘은 눈부시게 맑아요.<br>산책을 다녀오는 건 어떨까요?",
    subtitle: "햇살 가득한 날엔 경쾌하고 밝은 곡으로!<br>창문 열고 볼륨을 살짝 높여보세요.",
    song: "romeo n juliet (feat. 유라(youra)) - 죠지, 유라",
  },
  cloudy: {
    title: "구름이 하늘을 살포시 덮었어요.<br>차분하게 하루를 보내보는 건 어때요?",
    subtitle: "잔잔한 하늘엔 포근한 멜로디가 어울려요.<br>따뜻한 차 한 잔과 함께 들어보세요.",
    song: "Alone (Feat. 쏠 (SOLE), 다운 (Dvwn)) - Cosmic Boy",
  },
  rainy: {
    title: "창밖으로 빗방울이 떨어지고 있어요.<br>오늘은 안에서 여유를 즐겨봐요.",
    subtitle: "빗소리엔 감성적인 곡이 제격이에요.<br>빗방울 리듬에 마음을 맡겨보세요.",
    song: "아무도 그대를 바라지 않는 - 알레프",
  },
  snowy: {
    title: "하얀 눈이 소복이 내리고 있어요.<br>따뜻하게 입고 눈길을 걸어볼까요?",
    subtitle: "새하얀 겨울엔 포근한 노래 한 곡.<br>창가에 앉아 눈 오는 풍경을 즐겨요.",
    song: "~할때만 (Feat.JUNNY) - dress, Raf Sandou, JUNNY",
  },
};

// WMO weather_code -> {text, icon(=clear/cloudy/rainy/snowy)}
function mapWeather(code) {
  const c = Number(code);
  if ([71, 73, 75, 77, 85, 86].includes(c)) return { text: "눈", icon: "snowy" };
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(c)) {
    return { text: c >= 95 ? "뇌우" : "비", icon: "rainy" };
  }
  if (c === 0 || c === 1) return { text: "맑음", icon: "clear" };
  if (c === 2) return { text: "구름 조금", icon: "cloudy" };
  if (c === 45 || c === 48) return { text: "안개", icon: "cloudy" };
  return { text: "흐림", icon: "cloudy" }; // 3 및 기본
}

// ===== 곡명 마퀴 =====
function initMarquee(text) {
  const marquee = document.querySelector(".marquee");
  if (!marquee) return;
  const track = marquee.querySelector(".marquee__track");
  const prev = track.querySelector(".marquee__item");
  const content = text != null ? text : prev ? prev.textContent : "";

  track.innerHTML = "";
  const item = document.createElement("span");
  item.className = "marquee__item";
  item.textContent = content;
  track.appendChild(item);
  const clone = item.cloneNode(true);
  clone.setAttribute("aria-hidden", "true");
  track.appendChild(clone);

  track.classList.add("is-animating");
  const speed = 45; // px/초
  track.style.animationDuration = item.scrollWidth / speed + "s";
}
window.addEventListener("load", () => initMarquee());

// ===== 자동재생 (막히면 첫 사용자 상호작용 때 재생) =====
let _autoplayArmed = false;
function tryAutoplay() {
  const audio = document.getElementById("player-audio");
  if (!audio) return;
  audio.play().catch(() => {
    // 브라우저 자동재생 차단 → 첫 클릭/스크롤/키 입력 때 재생
    if (_autoplayArmed) return;
    _autoplayArmed = true;
    const events = ["pointerdown", "keydown", "touchstart", "scroll", "click"];
    const start = (e) => {
      // 재생 버튼은 자체 핸들러가 처리 (토글 충돌 방지)
      if (e && e.target && e.target.closest && e.target.closest("#playBtn")) return;
      audio.play().catch(() => {});
    };
    events.forEach((ev) => window.addEventListener(ev, start, { passive: true }));
    audio.addEventListener(
      "play",
      () => events.forEach((ev) => window.removeEventListener(ev, start)),
      { once: true }
    );
  });
}

// ===== 히어로/음악을 날씨에 맞게 적용 =====
function applyHeroWeather(cond) {
  if (!WEATHER[cond]) cond = "clear";
  const w = WEATHER[cond];

  const bgHero = document.querySelector(".bg-hero");
  if (bgHero) bgHero.style.backgroundImage = `url("assets/weather%20background/${cond}_background.png")`;

  const tp = document.querySelector(".card--title p");
  const sp = document.querySelector(".card--subtitle p");
  if (tp) tp.innerHTML = w.title;
  if (sp) sp.innerHTML = w.subtitle;

  const ricon = document.querySelector(".weather-icon .ricon");
  if (ricon) {
    ricon.className = "ricon ricon--hero ricon--" + cond;
    const img = ricon.querySelector(".ricon__art img");
    if (img) img.src = `assets/svg/${cond}.svg`;
  }

  const albumImg = document.querySelector(".song__album img");
  if (albumImg) albumImg.src = `assets/album/${cond}_album.png`;
  const bgSong = document.querySelector(".bg-song");
  if (bgSong) bgSong.style.backgroundImage = `url("assets/album/${cond}_album.png")`;

  // 노래 섹션 곡명도 플레이어와 동일하게
  const metaP = document.querySelector(".song__meta p");
  if (metaP) metaP.textContent = w.song;

  const audio = document.getElementById("player-audio");
  if (audio) {
    const src = audio.querySelector("source");
    if (src) src.src = `assets/song/${cond}_song.mp3`;
    audio.load(); // 곡 파일이 없으면 재생만 안 될 뿐 나머지는 정상
  }

  initMarquee(w.song);
  tryAutoplay(); // 최종 곡 세팅 후 자동재생 시도
}

// URL 로 강제 지정 (?cloudy / #rainy / /snowy 등) — 디버그용
function forcedWeather() {
  const s = (location.pathname + location.search + location.hash).toLowerCase();
  return ["snowy", "rainy", "cloudy", "clear"].find((k) => s.includes(k)) || null;
}

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
  const FORCED = forcedWeather();
  // 강제 지정이 있으면 즉시 적용 (내 위치 날씨보다 우선)
  if (FORCED) applyHeroWeather(FORCED);

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

  // 위치 칩(주소+온도) + 내 위치 날씨로 히어로 적용
  async function fillChip(lat, lon) {
    const addrEl = document.querySelector(".chip__addr");
    const tempEl = document.querySelector(".chip__temp");
    try {
      const [wRes, gRes] = await Promise.all([
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`),
        fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=ko`),
      ]);
      const w = await wRes.json();
      const g = await gRes.json();

      if (tempEl && w && w.current && typeof w.current.temperature_2m === "number") {
        tempEl.innerHTML = Math.round(w.current.temperature_2m) + '<span class="chip__unit">°C</span>';
      }
      if (addrEl) {
        // 행정구역 레벨 4(시/도) + 6(시/군/구). 광역시 중복(대전광역시 대전광역시) 방지
        const admin = (g.localityInfo && g.localityInfo.administrative) || [];
        const atLevel = (lvl) => {
          const e = admin.find((a) => a.adminLevel === lvl);
          return e ? e.name : "";
        };
        const prov = atLevel(4) || g.principalSubdivision || "";
        let dist = atLevel(6) || (g.city !== prov ? g.city : "") || g.locality || "";
        const parts = [prov];
        if (dist && dist !== prov) parts.push(dist);
        const addr = parts.filter(Boolean).join(" ");
        if (addr) addrEl.textContent = addr;
      }
      // 내 위치 날씨 → 히어로/음악 (URL 강제 지정이 없을 때만)
      if (!FORCED && w && w.current && w.current.weather_code != null) {
        applyHeroWeather(mapWeather(w.current.weather_code).icon);
      }
    } catch (e) {}
  }

  // 가장 가까운 다른 도시 3곳
  async function fillRegions(lat, lon) {
    const cards = document.querySelectorAll(".region-card");
    if (!cards.length) return;

    const cosLat = Math.cos((lat * Math.PI) / 180);
    const picks = CITIES.map((c) => ({
      c,
      d: (c.lat - lat) ** 2 + ((c.lon - lon) * cosLat) ** 2,
    }))
      .sort((a, b) => a.d - b.d)
      .slice(1, 4)
      .map((x) => x.c);

    picks.forEach((p, i) => {
      const card = cards[i];
      card.querySelector(".region-card__name span").textContent = p.name;
      card.querySelector(".ricon__art img").src = "assets/svg/clear.svg";
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
        ricon.classList.remove("ricon--clear", "ricon--cloudy", "ricon--rainy", "ricon--snowy");
        ricon.classList.add("ricon--" + w.icon);
        card.querySelector(".ricon__art img").src = `assets/svg/${w.icon}.svg`;
      });
    } catch (e) {}
  }

  getCoords().then((coords) => {
    if (!coords) {
      if (!FORCED) applyHeroWeather("clear");
      return;
    }
    fillChip(coords.lat, coords.lon);
    fillRegions(coords.lat, coords.lon);
  });
})();

// ===== 마지막 섹션 배경: 접속 시간대별 =====
(() => {
  const el = document.querySelector(".bg-regions");
  if (!el) return;
  const h = new Date().getHours();
  let name = "night"; // 밤 (21~4시)
  if (h >= 5 && h < 11) name = "morning"; // 아침 (5~10시)
  else if (h >= 11 && h < 17) name = "lunch"; // 점심 (11~16시)
  else if (h >= 17 && h < 21) name = "evening"; // 저녁 (17~20시)

  const img = `assets/time%20background/${name}.png`;
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

  const inBand = (el) => {
    const r = el.getBoundingClientRect();
    return r.top < window.innerHeight * 0.75 && r.bottom > window.innerHeight * 0.25;
  };

  const revealVisible = () => sections.forEach((s) => inBand(s) && reveal(s));
  setTimeout(revealVisible, 60);
  window.addEventListener("load", () => setTimeout(revealVisible, 60));

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
    const onScroll = () => sections.forEach((s) => (inBand(s) ? reveal(s) : unreveal(s)));
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
  }
})();
