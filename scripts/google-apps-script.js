/**
 * 대일외고 총동문회 발전기금 정기후원 — Google 시트 연동
 *
 * 슬랙 알림은 이 스크립트를 거치지 않는다. 사이트(프론트)가 VITE_SLACK_WEBHOOK_URL로 직접 보낸다
 * (src/lib/submitDonation.ts의 notifySlackDirect 참고).
 *
 * 설정:
 * 1. 스프레드시트 첫 행(헤더):
 *    ID | 이름 | 연락처 | 기수 | 예금주명 | 생년월일 | 은행 | 계좌번호 | 출금일 | 신청금액 | 동의 | 신청일시
 * 2. 이 코드를 Apps Script에 붙여넣기
 * 3. 프로젝트 설정 → 스크립트 속성:
 *    ADMIN_TOKEN = (관리자 조회용 비밀번호 — 설정 시 /admin 에서 동일 값 입력 필요)
 * 4. 배포 → 새 배포 → 웹 앱
 *    - 실행: 나 / 액세스: 모든 사용자
 * 5. 배포 URL을 프론트 .env 의 VITE_APPS_SCRIPT_URL 에 넣기
 *
 * ※ 계좌번호·생년월일 등 금융 개인정보가 저장됩니다. ADMIN_TOKEN 을 반드시 설정하고,
 *    스프레드시트 공유 범위를 담당자로 제한하세요.
 */

var COL_COUNT = 12;

function doGet() {
  return jsonResponse({ ok: true, message: "대일외고 총동문회 발전기금 시트 연동 웹앱이 동작 중입니다." });
}

function tokenOk_(data) {
  var need = PropertiesService.getScriptProperties().getProperty("ADMIN_TOKEN");
  if (!need) return true;
  return String(data.token || "") === need;
}

function listRows_(sheet) {
  var lastRow = sheet.getLastRow();
  var rows = [];

  if (lastRow > 1) {
    var values = sheet.getRange(2, 1, lastRow - 1, COL_COUNT).getValues();
    values.forEach(function (r, i) {
      var name = String(r[1] || "").trim();
      if (!name) return;
      rows.push({
        id: r[0] || i + 2,
        name: name,
        phone: String(r[2] || ""),
        grade: String(r[3] || ""),
        holderName: String(r[4] || ""),
        birth: String(r[5] || ""),
        bank: String(r[6] || ""),
        account: String(r[7] || ""),
        withdrawDay: String(r[8] || ""),
        amount: Number(r[9]) || 0,
        consent: r[10] === true || String(r[10] || "").indexOf("동의") !== -1,
        createdAt: r[11] instanceof Date ? formatKst(r[11]) : String(r[11] || ""),
      });
    });
  }

  return rows;
}

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    var data = JSON.parse(e.postData.contents);

    if (data.action === "list") {
      if (!tokenOk_(data)) return jsonResponse({ ok: false, error: "관리자 인증이 필요합니다." });
      return jsonResponse({ ok: true, data: listRows_(sheet) });
    }

    if (data.action === "clear") {
      if (!tokenOk_(data)) return jsonResponse({ ok: false, error: "관리자 인증이 필요합니다." });
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.deleteRows(2, lastRow - 1);
      }
      return jsonResponse({ ok: true, cleared: true });
    }

    var name = String(data.name || "").trim();
    var phone = String(data.phone || "").replace(/\D/g, "");
    var grade = String(data.grade || "").trim();
    var holderName = String(data.holderName || "").trim() || name;
    var birth = String(data.birth || "").replace(/\D/g, "");
    var bank = String(data.bank || "").trim();
    var account = String(data.account || "").replace(/\D/g, "");
    var withdrawDay = String(data.withdrawDay || "").trim();
    var amount = Number(data.amount);
    var consent = data.consent === true;

    if (!name) return jsonResponse({ ok: false, error: "이름이 필요합니다." });
    if (!/^01[0-9]{8,9}$/.test(phone)) {
      return jsonResponse({ ok: false, error: "올바른 연락처가 필요합니다." });
    }
    if (!grade) return jsonResponse({ ok: false, error: "기수가 필요합니다." });
    if (!/^\d{6}$/.test(birth)) {
      return jsonResponse({ ok: false, error: "생년월일 6자리가 필요합니다." });
    }
    if (!bank) return jsonResponse({ ok: false, error: "은행이 필요합니다." });
    if (account.length < 8) {
      return jsonResponse({ ok: false, error: "올바른 계좌번호가 필요합니다." });
    }
    if (!withdrawDay) return jsonResponse({ ok: false, error: "출금일이 필요합니다." });
    if (!amount || amount < 1000) {
      return jsonResponse({ ok: false, error: "금액이 올바르지 않습니다." });
    }
    if (!consent) return jsonResponse({ ok: false, error: "자동이체 출금 동의가 필요합니다." });

    var createdAt = formatKstNow();
    var id = sheet.getLastRow();

    sheet.appendRow([
      id,
      name,
      formatPhone(phone),
      grade,
      holderName,
      "'" + birth,
      bank,
      "'" + account,
      withdrawDay,
      amount,
      consent ? "동의" : "",
      createdAt,
    ]);

    return jsonResponse({ ok: true, id: id });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function formatPhone(phone) {
  if (phone.length === 11) {
    return phone.slice(0, 3) + "-" + phone.slice(3, 7) + "-" + phone.slice(7);
  }
  if (phone.length === 10) {
    return phone.slice(0, 3) + "-" + phone.slice(3, 6) + "-" + phone.slice(6);
  }
  return phone;
}

function formatKst(date) {
  return Utilities.formatDate(date, "Asia/Seoul", "yyyy. MM. dd. HH:mm:ss");
}

function formatKstNow() {
  return formatKst(new Date());
}

