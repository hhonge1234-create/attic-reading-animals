/**
 * 다락방 이웃들의 책장 — Google Apps Script 웹 앱
 *
 * POST: {code: "SDEC", books: [{t: "데미안", a: "헤르만 헤세"}, ...]}
 *       → 'books' 시트에 책 한 권당 한 줄씩 저장 (이름·이메일 등 개인정보는 받지 않음)
 * GET:  → 동물 코드별로 많이 꽂힌 책 12권씩, 참여 인원과 전체 권수
 *
 * 부적절한 책 제목은 시트에서 그 줄을 지우면 1분 안에 사이트에서도 사라집니다.
 */
const SHEET_NAME = 'books';
const CODE_RE = /^[SK][DW][EL][CN]$/;
const MAX_BOOKS = 15;

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(['저장 시각', '동물 코드', '도서명', '저자', '정규화 제목', '제출 번호']);
    sh.setFrozenRows(1);
  }
  return sh;
}

function clean_(s, max) {
  return String(s == null ? '' : s)
    .replace(/[\u0000-\u001f\u007f<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function norm_(s) {
  return String(s).toLowerCase().replace(/[\s『』「」<>《》()\[\],.·:!?'"‘’“”\-]/g, '');
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: 'bad_json' });
  }
  const code = String(body.code || '');
  if (!CODE_RE.test(code)) return json_({ ok: false, error: 'bad_code' });
  const books = (Array.isArray(body.books) ? body.books : [])
    .slice(0, MAX_BOOKS)
    .map(function (b) { return { t: clean_(b && b.t, 80), a: clean_(b && b.a, 40) }; })
    .filter(function (b) { return b.t.length > 0; });
  if (!books.length) return json_({ ok: false, error: 'no_books' });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = sheet_();
    const now = new Date();
    const sid = Utilities.getUuid().slice(0, 8);
    const rows = books.map(function (b) { return [now, code, b.t, b.a, norm_(b.t), sid]; });
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  } finally {
    lock.releaseLock();
  }
  CacheService.getScriptCache().remove('shelf');
  return json_({ ok: true, added: books.length });
}

function doGet() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get('shelf');
  if (hit) return ContentService.createTextOutput(hit).setMimeType(ContentService.MimeType.JSON);

  const sh = sheet_();
  const n = sh.getLastRow() - 1;
  const byCode = {};
  const people = {};
  let total = 0;
  if (n > 0) {
    sh.getRange(2, 1, n, 6).getValues().forEach(function (r) {
      const code = String(r[1]);
      const t = clean_(r[2], 80);
      const a = clean_(r[3], 40);
      if (!CODE_RE.test(code) || !t) return;
      const key = String(r[4] || norm_(t));
      total++;
      people[String(r[5])] = 1;
      const shelf = byCode[code] || (byCode[code] = {});
      const book = shelf[key] || (shelf[key] = { t: t, a: a, n: 0 });
      book.n++;
      if (!book.a && a) book.a = a;
    });
  }
  const out = { ok: true, people: Object.keys(people).length, books: total, shelves: {} };
  Object.keys(byCode).forEach(function (code) {
    out.shelves[code] = Object.keys(byCode[code])
      .map(function (k) { return byCode[code][k]; })
      .sort(function (x, y) { return y.n - x.n; })
      .slice(0, 12);
  });
  const text = JSON.stringify(out);
  cache.put('shelf', text, 60);
  return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.JSON);
}
