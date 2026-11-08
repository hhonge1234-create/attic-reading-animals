/* Deck runtime: scaling, navigation, per-slide anime.js animations, and a ?check mode for the verify loop. */
(function () {
  'use strict';
  var params = new URLSearchParams(location.search);
  var CHECK = params.has('check');
  var STATIC = CHECK || params.has('static');
  var deck = document.getElementById('deck');
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var cur = -1, running = [], timers = [];
  var A = window.anime;
  if (CHECK) document.body.classList.add('check');

  var TYPES = [
    ['SDEC', '깊은 바다의 고래'], ['SDEN', '밤의 고양이'], ['SDLC', '서재의 올빼미'], ['SDLN', '설계하는 여우'],
    ['SWEC', '숲길의 사슴'], ['SWEN', '물결 타는 수달'], ['SWLC', '호기심 많은 너구리'], ['SWLN', '소식 빠른 앵무새'],
    ['KDEC', '사색하는 곰'], ['KDEN', '마음을 돌보는 판다'], ['KDLC', '느긋한 거북이'], ['KDLN', '집 짓는 비버'],
    ['KWEC', '기억하는 코끼리'], ['KWEN', '산책하는 강아지'], ['KWLC', '영리한 돌고래'], ['KWLN', '모아 두는 다람쥐']
  ];
  var DESC = {"SDEC": "한 번 잠수하면 오래 머무는 독자", "SDEN": "지금 이 시대의 이야기에 마음이 움직이는 독자", "SDLC": "이야기 속 구조와 수수께끼를 즐기는 독자", "SDLN": "치밀하게 짜인 장르 소설에 빠지는 독자", "SWEC": "여러 나라, 여러 시대의 명작을 산책하듯 읽는 독자", "SWEN": "요즘 이야기라면 장르를 가리지 않는 독자", "SWLC": "고전 장르 문학을 두루 섭렵하는 독자", "SWLN": "요즘 장르 소설의 흐름을 빠르게 따라가는 독자", "KDEC": "오래된 생각의 책을 천천히 곱씹는 독자", "KDEN": "인문·심리 에세이로 나를 들여다보는 독자", "KDLC": "한 분야의 원전을 끝까지 읽어 내는 독자", "KDLN": "최신 연구와 데이터로 생각의 집을 짓는 독자", "KWEC": "예술, 역사, 자연을 넘나드는 교양 고전 독자", "KWEN": "다정한 교양서를 여기저기 즐겁게 읽는 독자", "KWLC": "분야를 가로지르는 큰 그림을 좋아하는 독자", "KWLN": "화제의 실용서와 트렌드서를 빠르게 모으는 독자"};
  var EXAMPLE = [['이야기', 64], ['몰입', 87], ['감성', 81], ['고전', 81]]; // from data/model.json
  var SITE_URL = 'https://hhonge1234-create.github.io/attic-reading-animals/';

  // ---------- static content built from data ----------
  document.getElementById('guide16').insertAdjacentHTML('beforeend', TYPES.map(function (t) {
    return '<figure class="g16"><img src="assets/img/' + t[0] + '.jpg" alt="' + t[1] + '"><figcaption>' + t[1] + '<small>' + t[0] + '</small></figcaption></figure>';
  }).join(''));
  document.getElementById('exStats').innerHTML = EXAMPLE.map(function (e) {
    return '<li><span>' + e[0] + '</span><div class="tr"><i style="width:' + e[1] + '%" data-w="' + e[1] + '"></i></div><b data-count="' + e[1] + '">' + e[1] + '%</b></li>';
  }).join('');
  document.getElementById('endRow').innerHTML = TYPES.filter(function (_, i) { return i % 2 === 0; }).map(function (t) {
    return '<img src="assets/img/' + t[0] + '.jpg" alt="' + t[1] + '">';
  }).join('');
  document.getElementById('siteUrl').textContent = SITE_URL.replace('https://', '');
  var motes = document.querySelector('.motes');
  for (var m = 0; m < 26; m++) {
    var d = document.createElement('i');
    d.style.left = (980 + Math.random() * 900) + 'px';
    d.style.top = (120 + Math.random() * 900) + 'px';
    motes.appendChild(d);
  }

  // ---------- live neighbors' shelf (real data from the Google Sheet) ----------
  var SHELF_URL = 'https://script.google.com/macros/s/AKfycbzLpXGOcfBpaXwhViI9_y3U59CfElvhccQbQa8CuvkFa3bhlubiuEY7GSo5jcVDklsf/exec';
  var NAMES = {}; TYPES.forEach(function (t) { NAMES[t[0]] = t[1]; });
  var SPC = ['#C98A7E', '#8FA37A', '#D9B074', '#8AA1B4', '#B49A80', '#CFA0A6'];
  var deckShelf = null, deckShelfFailed = false;
  function escH(x) { return String(x).replace(/[&<>"']/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]; }); }
  function drawDeckShelf(s, animate) {
    if (!s) s = document.querySelector('[data-anim="shelf"]');
    var box = document.getElementById('shShelves'), fb = document.getElementById('shFallback'), stamp = document.getElementById('shelfStamp');
    if (!deckShelf) { if (deckShelfFailed) { fb.hidden = false; stamp.textContent = '연결이 안 되어 서비스 화면으로 대신 보여 드려요'; } return; }
    var d = deckShelf, codes = Object.keys(d.shelves).sort(function (a, b) {
      var n = function (c) { return d.shelves[c].reduce(function (x, y) { return x + y.n; }, 0); }; return n(b) - n(a);
    }).slice(0, 3);
    var t = new Date(); stamp.textContent = (t.getMonth() + 1) + '월 ' + t.getDate() + '일 ' + t.getHours() + ':' + String(t.getMinutes()).padStart(2, '0') + ' 기준';
    document.getElementById('shPeople').textContent = d.people;
    document.getElementById('shBooks').textContent = d.books;
    box.innerHTML = codes.length ? codes.map(function (c) {
      var list = d.shelves[c].slice(0, 9), max = list[0].n;
      return '<div class="mini-shelf"><div class="who"><img src="assets/img/' + c + '.jpg" alt="">' + escH(NAMES[c] || c).split(' ').slice(-1)[0] + '</div><div class="row">' +
        list.map(function (b, i) { return '<div class="dspine" style="height:' + (96 + Math.round(44 * b.n / max)) + 'px;background:' + SPC[i % 6] + '" title="' + escH(b.t) + '"><i>' + b.n + '</i><span>' + escH(b.t) + '</span></div>'; }).join('') + '</div></div>';
    }).join('') : '<p class="sh-count">아직 비어 있어요. 오늘 첫 책을 꽂아 주세요.</p>';
    if (animate && A) {
      run(A({ targets: box.querySelectorAll('.dspine'), scaleY: [0, 1], opacity: [0, 1], duration: 700, delay: A.stagger(60, { start: 900 }), easing: 'easeOutBack' }));
      ['shPeople', 'shBooks'].forEach(function (id) {
        var el = document.getElementById(id), end = Number(el.textContent) || 0, o = { v: 0 };
        run(A({ targets: o, v: end, duration: 1200, delay: 800, easing: 'easeOutExpo', update: function () { el.textContent = Math.round(o.v); } }));
      });
    }
  }
  var shelfReq = (window.fetch ? fetch(SHELF_URL) : Promise.reject()).then(function (r) { return r.json(); }).then(function (d) {
    if (!d || !d.ok) throw 0; deckShelf = d;
  }).catch(function () { deckShelfFailed = true; }).then(function () {
    var s = document.querySelector('[data-anim="shelf"]');
    if (s && s.classList.contains('on')) drawDeckShelf(s, !STATIC); else drawDeckShelf(s, false);
  });
  setTimeout(function () { if (!deckShelf && !deckShelfFailed) { deckShelfFailed = true; drawDeckShelf(null, false); } }, 8000);

  // ---------- scaling ----------
  function fit() {
    var s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    deck.style.transform = 'translate(-50%, -50%) scale(' + s + ')';
  }
  window.addEventListener('resize', fit);
  fit();

  // ---------- helpers ----------
  function fmt(n) { return Math.round(n).toLocaleString('ko-KR'); }
  function counts(slide) {
    var els = slide.querySelectorAll('[data-count]');
    Array.prototype.forEach.call(els, function (el) {
      var end = Number(el.getAttribute('data-count')), suffix = /%$/.test(el.textContent) ? '%' : '';
      var o = { v: 0 };
      run(A({ targets: o, v: end, duration: 1600, delay: 300, easing: 'easeOutExpo', update: function () { el.textContent = fmt(o.v) + suffix; } }));
    });
  }
  function head(slide) {
    return A({ targets: slide.querySelectorAll('.eyebrow, h2'), opacity: [0, 1], translateY: [24, 0], duration: 700, delay: A.stagger(120), easing: 'easeOutCubic' });
  }
  function wipe(slide, dur) {
    return A({ targets: slide.querySelectorAll('.wipe'), scaleX: [1, 0], duration: dur || 1400, delay: 350, easing: 'easeInOutQuad' });
  }
  function run(a) { running.push(a); return a; }
  function every(fn, ms) { timers.push(setInterval(fn, ms)); }

  // ---------- animations per slide ----------
  var ANIM = {
    cover: function (s) {
      run(A({ targets: s.querySelectorAll('.hang'), translateY: [-300, 0], rotate: function (_, i) { return [i % 2 ? 24 : -24, 0]; }, opacity: [0, 1], duration: 1500, delay: A.stagger(160, { start: 200 }), easing: 'easeOutElastic(1, .55)' }));
      run(A({ targets: s.querySelectorAll('.string path'), strokeDashoffset: [A.setDashOffset, 0], duration: 900, easing: 'easeInOutSine' }));
      run(A({ targets: s.querySelectorAll('.cover-text > *'), opacity: [0, 1], translateY: [36, 0], duration: 900, delay: A.stagger(140, { start: 500 }), easing: 'easeOutCubic' }));
      if (!STATIC) {
        run(A({ targets: s.querySelectorAll('.hang'), rotate: [-3, 3], duration: 2600, delay: A.stagger(260, { start: 1900 }), direction: 'alternate', loop: true, easing: 'easeInOutSine' }));
        run(A({ targets: s.querySelectorAll('.motes i'), translateY: function () { return [0, -120 - Math.random() * 160]; }, translateX: function () { return [0, A.random(-40, 40)]; },
          opacity: [{ value: .9, duration: 1200 }, { value: 0, duration: 2600 }], duration: function () { return A.random(3200, 5600); }, delay: A.stagger(180), loop: true, easing: 'easeInOutSine' }));
      }
    },
    problem: function (s) {
      run(head(s));
      run(A({ targets: s.querySelectorAll('.card-p'), opacity: [0, 1], translateY: [90, 0], rotate: function (_, i) { return [[-4, 3, -2][i], 0]; }, duration: 900, delay: A.stagger(220, { start: 500 }), easing: 'easeOutBack' }));
      run(A({ targets: s.querySelector('.answer'), opacity: [0, 1], translateX: [-60, 0], duration: 900, delay: 1500, easing: 'easeOutCubic' }));
    },
    idea: function (s) {
      run(A({ targets: s.querySelectorAll('.col-text > *'), opacity: [0, 1], translateX: [-40, 0], duration: 800, delay: A.stagger(150), easing: 'easeOutCubic' }));
      run(A({ targets: s.querySelector('.video-frame'), opacity: [0, 1], scale: [.94, 1], duration: 900, delay: 300, easing: 'easeOutCubic' }));
    },
    axes: function (s) {
      run(head(s));
      run(A({ targets: s.querySelectorAll('.axis-row'), opacity: [0, 1], translateY: [30, 0], duration: 700, delay: A.stagger(160, { start: 300 }), easing: 'easeOutCubic' }));
      var knobs = s.querySelectorAll('.knob');
      run(A({ targets: knobs, translateX: function (el) { return [0, Number(el.getAttribute('data-to')) * 257]; }, duration: 1300, delay: A.stagger(200, { start: 900 }), easing: 'easeOutElastic(1, .6)' }));
      if (!STATIC) every(function () {
        Array.prototype.forEach.call(knobs, function (k) {
          var to = (Math.random() * 1.6 - .8) * 257;
          A({ targets: k, translateX: to, duration: 1400, easing: 'easeInOutQuad' });
        });
      }, 3200);
    },
    guide: function (s) {
      run(head(s));
      run(A({ targets: s.querySelectorAll('.g-title > *'), opacity: [0, 1], translateY: [24, 0], duration: 700, delay: A.stagger(140), easing: 'easeOutCubic' }));
      run(A({ targets: s.querySelectorAll('.g16'), opacity: [0, 1], scale: [.4, 1], rotate: function (_, i) { return [(i % 2 ? 10 : -10), 0]; },
        duration: 800, delay: A.stagger(70, { start: 400 }), easing: 'easeOutBack' }));
      if (!STATIC) run(A({ targets: s.querySelectorAll('.g16 img'), translateY: [0, -6], duration: 1600, delay: A.stagger(110, { start: 2200 }), direction: 'alternate', loop: true, easing: 'easeInOutSine' }));
    },
    prompt: function (s) {
      run(head(s));
      run(A({ targets: s.querySelector('.pr-card'), opacity: [0, 1], translateY: [40, 0], duration: 700, delay: 200, easing: 'easeOutCubic' }));
      var parts = s.querySelectorAll('[data-type]'), caret = s.querySelector('.caret');
      if (!STATIC) {
        var texts = Array.prototype.map.call(parts, function (p) { return p.getAttribute('data-type'); });
        var total = texts.reduce(function (n, t) { return n + t.length; }, 0), o = { n: 0 };
        Array.prototype.forEach.call(parts, function (p) { p.textContent = ''; });
        run(A({ targets: caret, opacity: [0, 1], duration: 450, direction: 'alternate', loop: true, easing: 'steps(1)' }));
        run(A({ targets: o, n: total, duration: total * 16, delay: 800, easing: 'linear', update: function () {
          var left = Math.round(o.n);
          Array.prototype.forEach.call(parts, function (p, i) { var t = texts[i]; p.textContent = t.slice(0, Math.max(0, left)); left -= t.length; });
        } }));
      }
      run(A({ targets: s.querySelectorAll('.pr-legend p'), opacity: [0, 1], translateX: [-30, 0], duration: 600, delay: A.stagger(250, { start: STATIC ? 0 : 1200 }), easing: 'easeOutCubic' }));
      var t0 = 1600;
      run(A({ targets: s.querySelectorAll('.pr-step, .cand'), opacity: function (el) { return [0, el.classList.contains('cand') && !el.classList.contains('pick') ? .55 : 1]; }, translateY: [30, 0], duration: 700, delay: A.stagger(300, { start: t0 }), easing: 'easeOutCubic' }));
      run(A({ targets: s.querySelector('.cand.pick'), scale: [1, 1.05, 1], duration: 700, delay: t0 + 1300, easing: 'easeInOutSine' }));
      run(A({ targets: s.querySelectorAll('.pr-arrow path'), strokeDashoffset: [A.setDashOffset, 0], duration: 700, delay: t0 + 1900, easing: 'easeInOutSine' }));
      run(A({ targets: s.querySelector('.pr-final'), opacity: [0, 1], translateY: [-160, 0], rotate: [-14, 2], duration: 1400, delay: t0 + 2400, easing: 'easeOutElastic(1, .6)' }));
      run(A({ targets: s.querySelector('.pr-foot'), opacity: [0, 1], duration: 700, delay: t0 + 3000, easing: 'linear' }));
    },
    shelf: function (s) {
      run(head(s));
      run(A({ targets: s.querySelectorAll('.sh-step, .sh-note'), opacity: [0, 1], translateX: [-50, 0], duration: 700, delay: A.stagger(260, { start: 300 }), easing: 'easeOutCubic' }));
      run(A({ targets: s.querySelector('.sh-live'), opacity: [0, 1], translateY: [40, 0], duration: 800, delay: 700, easing: 'easeOutCubic' }));
      drawDeckShelf(s, true);
      if (!STATIC) run(A({ targets: s.querySelector('.live-dot'), boxShadow: ['0 0 0 0 rgba(217, 83, 79, .5)', '0 0 0 14px rgba(217, 83, 79, 0)'], duration: 1400, loop: true, easing: 'easeOutQuad' }));
    },
    doors: function (s) {
      run(head(s));
      run(A({ targets: s.querySelectorAll('.door'), opacity: [0, 1], translateY: [70, 0], rotate: function (_, i) { return [i ? 3 : -3, 0]; }, duration: 900, delay: A.stagger(500, { start: 300 }), easing: 'easeOutBack' }));
      run(A({ targets: s.querySelectorAll('.door-mid path'), strokeDashoffset: [A.setDashOffset, 0], duration: 700, delay: 900, easing: 'easeInOutSine' }));
      run(A({ targets: s.querySelector('.door-mid p'), opacity: [0, 1], duration: 500, delay: 1300, easing: 'linear' }));
      run(A({ targets: s.querySelector('.why'), opacity: [0, 1], translateY: [30, 0], duration: 700, delay: 1700, easing: 'easeOutCubic' }));
    },
    lis: function (s) {
      run(head(s));
      run(A({ targets: s.querySelectorAll('.card-l'), opacity: [0, 1], translateY: [70, 0], duration: 800, delay: A.stagger(170, { start: 300 }), easing: 'easeOutCubic' }));
      run(A({ targets: s.querySelectorAll('.ico *'), strokeDashoffset: [A.setDashOffset, 0], duration: 1200, delay: A.stagger(120, { start: 700 }), easing: 'easeInOutSine' }));
    },
    flow: function (s) {
      run(head(s));
      var tl = run(A.timeline({ easing: 'easeOutCubic' }));
      tl.add({ targets: s.querySelectorAll('.fb.in'), opacity: [0, 1], translateX: [-50, 0], duration: 600, delay: A.stagger(130) }, 300)
        .add({ targets: s.querySelectorAll('.links path:nth-child(-n+3)'), strokeDashoffset: [A.setDashOffset, 0], duration: 700, easing: 'easeInOutSine' })
        .add({ targets: s.querySelectorAll('.fb.core')[0], opacity: [0, 1], scale: [.8, 1], duration: 500, easing: 'easeOutBack' })
        .add({ targets: s.querySelectorAll('.links path:nth-child(4)'), strokeDashoffset: [A.setDashOffset, 0], duration: 400 })
        .add({ targets: s.querySelectorAll('.fb.core')[1], opacity: [0, 1], scale: [.8, 1], duration: 500, easing: 'easeOutBack' })
        .add({ targets: s.querySelectorAll('.links path:nth-child(n+5)'), strokeDashoffset: [A.setDashOffset, 0], duration: 700, delay: A.stagger(60), easing: 'easeInOutSine' })
        .add({ targets: s.querySelectorAll('.fb.out'), opacity: [0, 1], translateX: [40, 0], duration: 500, delay: A.stagger(90) }, '-=500');
    },
    heat: function (s) {
      run(A({ targets: s.querySelectorAll('.col-text > *'), opacity: [0, 1], translateY: [24, 0], duration: 700, delay: A.stagger(140), easing: 'easeOutCubic' }));
      run(wipe(s, 1800));
    },
    curves: function (s) {
      run(head(s));
      run(A({ targets: s.querySelectorAll('.chart-card'), opacity: [0, 1], translateY: [60, 0], duration: 900, delay: A.stagger(300, { start: 300 }), easing: 'easeOutCubic' }));
      run(A({ targets: s.querySelectorAll('.chart-card img'), opacity: [0, 1], duration: 1200, delay: A.stagger(300, { start: 800 }), easing: 'linear' }));
    },
    example: function (s) {
      run(A({ targets: s.querySelectorAll('.col-text > *'), opacity: [0, 1], translateX: [40, 0], duration: 700, delay: A.stagger(150, { start: 200 }), easing: 'easeOutCubic' }));
      run(A({ targets: s.querySelector('.whale'), scale: [.6, 1], rotate: [-6, 0], duration: 900, delay: 700, easing: 'easeOutBack' }));
      run(A({ targets: s.querySelectorAll('.stats .tr i'), width: function (el) { return ['0%', el.getAttribute('data-w') + '%']; }, duration: 1500, delay: A.stagger(200, { start: 1100 }), easing: 'easeOutQuart' }));
      Array.prototype.forEach.call(s.querySelectorAll('.stats b'), function (el, i) {
        var o = { v: 0 }, end = Number(el.getAttribute('data-count'));
        run(A({ targets: o, v: end, duration: 1500, delay: 1100 + i * 200, easing: 'easeOutQuart', update: function () { el.textContent = Math.round(o.v) + '%'; } }));
      });
    },
    sim: function (s) {
      run(head(s));
      counts(s);
      run(wipe(s, 2000));
      run(A({ targets: s.querySelectorAll('.sim-side .note'), opacity: [0, 1], translateX: [50, 0], duration: 800, delay: A.stagger(500, { start: 1600 }), easing: 'easeOutCubic' }));
    },
    screens: function (s) {
      run(head(s));
      var shots = s.querySelectorAll('.shot'), items = s.querySelectorAll('.shot-list li'), k = 0;
      function show(n) {
        Array.prototype.forEach.call(shots, function (el, i) { el.classList.toggle('on', i === n); });
        Array.prototype.forEach.call(items, function (el, i) { el.classList.toggle('on', i === n); });
        A({ targets: shots[n], opacity: [0, 1], scale: [1.03, 1], duration: 700, easing: 'easeOutCubic' });
      }
      show(0);
      run(A({ targets: items, opacity: [0, 1], translateX: [40, 0], duration: 600, delay: A.stagger(120, { start: 300 }), easing: 'easeOutCubic' }));
      if (!STATIC) every(function () { k = (k + 1) % shots.length; show(k); }, 2800);
    },
    timeline: function (s) {
      run(head(s));
      run(wipe(s, 2600));
      counts(s);
      run(A({ targets: s.querySelectorAll('.kpi, .tools'), opacity: [0, 1], translateY: [30, 0], duration: 700, delay: A.stagger(150, { start: 1600 }), easing: 'easeOutCubic' }));
    },
    data: function (s) {
      run(head(s));
      run(A({ targets: s.querySelectorAll('.probe tr'), opacity: [0, 1], translateX: [-40, 0], duration: 600, delay: A.stagger(220, { start: 300 }), easing: 'easeOutCubic' }));
      run(A({ targets: s.querySelectorAll('.probe td.bad, .probe td.mid'), scale: [1.4, 1], duration: 600, delay: A.stagger(220, { start: 600 }), easing: 'easeOutBack' }));
      run(A({ targets: s.querySelectorAll('.sol'), opacity: [0, 1], translateX: [80, 0], duration: 900, delay: A.stagger(400, { start: 1700 }), easing: 'easeOutCubic' }));
    },
    fixes: function (s) {
      run(head(s));
      run(A({ targets: s.querySelectorAll('.flip'), opacity: [0, 1], translateY: [60, 0], duration: 700, delay: A.stagger(150, { start: 300 }), easing: 'easeOutCubic' }));
      run(A({ targets: s.querySelectorAll('.flip'), rotateY: [0, 180], duration: 1100, delay: A.stagger(550, { start: 1700 }), easing: 'easeInOutBack' }));
    },
    arch: function (s) {
      run(head(s));
      run(A({ targets: s.querySelectorAll('.ab'), opacity: [0, 1], scale: [.7, 1], duration: 700, delay: A.stagger(220, { start: 300 }), easing: 'easeOutBack' }));
      run(A({ targets: s.querySelectorAll('.arch-lines path'), opacity: [0, 1], strokeDashoffset: [200, 0], duration: 1200, delay: A.stagger(200, { start: 900 }), easing: 'easeOutQuad' }));
      if (!STATIC) run(A({ targets: s.querySelectorAll('.arch-lines path'), strokeDashoffset: [0, -40], duration: 900, loop: true, easing: 'linear', delay: 2400 }));
      run(A({ targets: s.querySelectorAll('.chips-row span'), opacity: [0, 1], translateY: [20, 0], duration: 500, delay: A.stagger(120, { start: 1800 }), easing: 'easeOutCubic' }));
    },
    service: function (s) {
      run(head(s));
      run(A({ targets: s.querySelectorAll('.stage-c'), opacity: [0, 1], translateX: [-80, 0], duration: 800, delay: A.stagger(350, { start: 300 }), easing: 'easeOutCubic' }));
      run(A({ targets: s.querySelectorAll('.stage-c li'), opacity: [0, 1], duration: 400, delay: A.stagger(90, { start: 900 }), easing: 'linear' }));
      run(A({ targets: s.querySelector('.limits'), opacity: [0, 1], duration: 700, delay: 2300, easing: 'linear' }));
    },
    value: function (s) {
      run(head(s));
      run(A({ targets: s.querySelectorAll('.card-v'), opacity: [0, 1], translateY: [80, 0], duration: 800, delay: A.stagger(200, { start: 300 }), easing: 'easeOutBack' }));
      run(A({ targets: s.querySelector('.lucky-band'), opacity: [0, 1], duration: 600, delay: 1200, easing: 'linear' }));
      counts(s);
    },
    ending: function (s) {
      run(A({ targets: s.querySelectorAll('.end-text > *'), opacity: [0, 1], translateY: [40, 0], duration: 900, delay: A.stagger(200, { start: 200 }), easing: 'easeOutCubic' }));
      run(A({ targets: s.querySelector('.qr'), opacity: [0, 1], scale: [.6, 1], rotate: [-8, 2], duration: 1000, delay: 900, easing: 'easeOutBack' }));
      run(A({ targets: s.querySelectorAll('.end-row img'), opacity: [0, 1], translateY: [80, 0], duration: 800, delay: A.stagger(90, { start: 1200 }), easing: 'easeOutBack' }));
      if (!STATIC) run(A({ targets: s.querySelectorAll('.end-row img'), translateY: [0, -14], duration: 700, delay: A.stagger(120, { start: 2600 }), direction: 'alternate', loop: true, easing: 'easeInOutSine' }));
    }
  };

  // ---------- navigation ----------
  function stopAll() {
    running.forEach(function (a) { try { a.pause(); } catch (e) {} });
    running = [];
    timers.forEach(clearInterval); timers = [];
  }
  function go(i) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    if (i === cur && !CHECK) return;
    stopAll();
    if (cur >= 0) {
      slides[cur].classList.remove('on');
      Array.prototype.forEach.call(slides[cur].querySelectorAll('video'), function (v) { v.pause(); });
    }
    cur = i;
    var s = slides[i];
    s.classList.add('on');
    var fn = ANIM[s.getAttribute('data-anim')];
    if (fn && A) fn(s);
    if (STATIC) running.forEach(function (a) { a.seek(a.duration); });
    Array.prototype.forEach.call(s.querySelectorAll('video[data-play]'), function (v) {
      if (STATIC) return; // poster shows the final frame
      try { v.currentTime = 0; } catch (e) {}
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    });
    document.getElementById('bar').style.width = ((i + 1) / slides.length * 100) + '%';
    document.getElementById('pageNo').textContent = (i + 1) + ' / ' + slides.length;
    if (!CHECK) { try { history.replaceState(null, '', location.pathname + location.search + '#' + (i + 1)); } catch (e) {} }
  }
  document.addEventListener('keydown', function (e) {
    if (['ArrowRight', 'PageDown', ' ', 'Enter'].indexOf(e.key) >= 0) { e.preventDefault(); go(cur + 1); }
    else if (['ArrowLeft', 'PageUp', 'Backspace'].indexOf(e.key) >= 0) { e.preventDefault(); go(cur - 1); }
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(slides.length - 1);
    else if (e.key === 'f' && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(function () {});
  });
  document.addEventListener('click', function (e) {
    if (e.target.closest('a')) return;
    if (e.clientX < window.innerWidth / 3) go(cur - 1); else go(cur + 1);
  });
  var tx = null;
  document.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (tx === null) return; var dx = e.changedTouches[0].clientX - tx; tx = null;
    if (Math.abs(dx) > 50) go(cur + (dx < 0 ? 1 : -1));
  });
  window.addEventListener('hashchange', function () { var n = parseInt(location.hash.slice(1), 10); if (n) go(n - 1); });

  // ---------- verify mode ----------
  function check() {
    var dr = deck.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight;
    var fitOk = Math.abs(dr.left - (vw - dr.width) / 2) < 2 && Math.abs(dr.top - (vh - dr.height) / 2) < 2 && dr.width <= vw + 1 && dr.height <= vh + 1;
    var report = { slides: [], errors: window.__errors || [], viewport: [vw, vh], deck: [Math.round(dr.left), Math.round(dr.top), Math.round(dr.width), Math.round(dr.height)], fit: fitOk };
    slides.forEach(function (s, i) {
      go(i);
      var box = s.getBoundingClientRect(), scale = box.width / 1920, issues = [];
      Array.prototype.forEach.call(s.querySelectorAll('*'), function (el) {
        if (el.closest('.bleed, .motes, svg, .wipe') || el.matches('.bleed, .motes, .wipe, i, br, source')) return;
        var st = getComputedStyle(el);
        if (st.display === 'none' || st.visibility === 'hidden') return;
        var r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        var o = { l: (r.left - box.left) / scale, t: (r.top - box.top) / scale, r: (r.right - box.left) / scale, b: (r.bottom - box.top) / scale };
        if (o.l < -2 || o.t < -2 || o.r > 1922 || o.b > 1082) issues.push({ kind: 'outside-slide', el: desc(el), box: round(o) });
        else if (!el.closest('.cover, .ending, .guide-one') && (o.l < 60 || o.r > 1860 || o.b > 1040)) issues.push({ kind: 'outside-margin', el: desc(el), box: round(o) });
        if (/^(H1|H2|H3|P|LI|TD|TH|FIGCAPTION)$/.test(el.tagName) || el.matches('.fb, .ab')) {
          if (el.scrollWidth > el.clientWidth + 2) issues.push({ kind: 'text-overflow-x', el: desc(el), sw: el.scrollWidth, cw: el.clientWidth });
          if (el.scrollHeight > el.clientHeight + 2 && st.overflow !== 'visible') issues.push({ kind: 'text-overflow-y', el: desc(el) });
        }
        if (el.tagName === 'IMG' && (!el.complete || el.naturalWidth === 0)) issues.push({ kind: 'image-missing', el: el.getAttribute('src') });
        if (el.tagName === 'VIDEO' && (el.error || el.readyState === 0)) issues.push({ kind: 'video-not-loaded', el: el.getAttribute('src'), state: el.readyState, err: el.error && el.error.code });
      });
      // card-level clipping: children taller than a fixed-height parent
      Array.prototype.forEach.call(s.querySelectorAll('.flip .face, .shot-main, .video-frame, .card-p, .card-l, .card-v, .stage-c, .note, .sol, .g-title'), function (el) {
        if (el.scrollHeight > el.clientHeight + 2) issues.push({ kind: 'box-overflow', el: desc(el), sh: el.scrollHeight, ch: el.clientHeight });
      });
      report.slides.push({ n: i + 1, anim: s.getAttribute('data-anim'), issues: issues });
    });
    var pre = document.getElementById('report');
    pre.hidden = false;
    pre.textContent = JSON.stringify(report);
    document.title = 'CHECK_DONE';
  }
  function desc(el) { return el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : '') + ' "' + (el.textContent || '').trim().slice(0, 24) + '"'; }
  function round(o) { return { l: Math.round(o.l), t: Math.round(o.t), r: Math.round(o.r), b: Math.round(o.b) }; }

  var start = parseInt(location.hash.slice(1), 10);
  go(start ? start - 1 : 0);
  if (CHECK) {
    var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.all([ready, shelfReq]).then(function () { setTimeout(check, 1500); });
  }
})();
