/**
 * 대일외고 장학금 정기후원 — Google 시트 + Slack 연동
 *
 * 설정:
 * 1. 스프레드시트 첫 행: ID | 이름 | 연락처 | 기수 | 신청금액 | 신청일시
 * 2. 이 코드를 Apps Script에 붙여넣기
 * 3. 프로젝트 설정 → 스크립트 속성:
 *    SLACK_WEBHOOK_URL = (슬랙 Incoming Webhook URL)
 * 4. 배포 → 새 배포 → 웹 앱
 *    - 실행: 나 / 액세스: 모든 사용자
 * 5. 배포 URL을 프론트 .env 의 VITE_APPS_SCRIPT_URL 에 넣기
 */

function doGet() {
  return ContentService.createTextOutput(
    JSON.stringify({ ok: true, message: "대일외고 장학금 시트 연동 웹앱이 동작 중입니다." }),
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    const data = JSON.parse(e.postData.contents);

    if (data.action === "clear") {
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.deleteRows(2, lastRow - 1);
      }
      return jsonResponse({ ok: true, cleared: true });
    }

    const name = String(data.name || "").trim();
    const phone = String(data.phone || "").replace(/\D/g, "");
    const grade = String(data.grade || "").trim();
    const amount = Number(data.amount);

    if (!name) return jsonResponse({ ok: false, error: "이름이 필요합니다." });
    if (!/^01[0-9]{8,9}$/.test(phone)) {
      return jsonResponse({ ok: false, error: "올바른 연락처가 필요합니다." });
    }
    if (!grade) return jsonResponse({ ok: false, error: "기수가 필요합니다." });
    if (!amount || amount < 1000) {
      return jsonResponse({ ok: false, error: "금액이 올바르지 않습니다." });
    }

    const createdAt = formatKstNow();
    const id = sheet.getLastRow();

    sheet.appendRow([id, name, formatPhone(phone), grade, amount, createdAt]);

    notifySlack_({
      id: id,
      name: name,
      phone: phone,
      grade: grade,
      amount: amount,
      createdAt: createdAt,
    });

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

function formatKstNow() {
  return Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy. MM. dd. HH:mm:ss");
}

function formatAmount(amount) {
  return Number(amount).toLocaleString("ko-KR") + "원";
}

function notifySlack_(row) {
  const webhookUrl = PropertiesService.getScriptProperties().getProperty("SLACK_WEBHOOK_URL");
  if (!webhookUrl) return;

  const phone = formatPhone(row.phone);
  const amount = formatAmount(row.amount);

  const payload = {
    text: "[장학금 정기후원] " + row.name + " · 월 " + amount + " · " + phone,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "🎓 새 정기후원 신청", emoji: true },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: "*이름*\n" + row.name },
          { type: "mrkdwn", text: "*연락처*\n" + phone },
          { type: "mrkdwn", text: "*기수*\n" + row.grade },
          { type: "mrkdwn", text: "*희망 금액*\n월 " + amount },
        ],
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "신청 #" + row.id + " · " + row.createdAt,
          },
        ],
      },
    ],
  };

  UrlFetchApp.fetch(webhookUrl, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });
}
