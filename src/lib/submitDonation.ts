export type DonationInput = {
  name: string;
  phone: string;
  grade: string;
  holderName: string;
  birth: string;
  bank: string;
  account: string;
  withdrawDay: string;
  amount: number;
  consent: boolean;
};

export type Donation = {
  id: number | string;
  name: string;
  phone: string;
  grade: string;
  holderName: string;
  birth: string;
  bank: string;
  account: string;
  withdrawDay: string;
  amount: number;
  consent: boolean;
  createdAt: string;
};

function getSubmitUrl() {
  const url = import.meta.env.VITE_APPS_SCRIPT_URL?.trim();
  if (!url) {
    throw new Error("VITE_APPS_SCRIPT_URL is not configured");
  }
  return url;
}

function formatAmountKo(amount: number) {
  return `${amount.toLocaleString("ko-KR")}원`;
}

function formatWithdrawDayKo(withdrawDay: string) {
  if (!withdrawDay) return "";
  return withdrawDay === "말일" ? "말일" : `${withdrawDay}일`;
}

// 슬랙 알림은 구글 시트 저장(Apps Script)과 별개로 사이트가 웹훅에 직접 쏜다.
// 실패해도 신청 접수 자체는 막지 않는다(fire-and-forget).
function notifySlackDirect(input: DonationInput) {
  const webhookUrl = import.meta.env.VITE_SLACK_WEBHOOK_URL?.trim();
  if (!webhookUrl) return;

  const amount = formatAmountKo(input.amount);
  const payload = {
    text: `[발전기금 정기후원] ${input.name} · 월 ${amount} · ${input.phone}`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "🤝 새 정기후원(자동이체) 신청", emoji: true },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*이름*\n${input.name}` },
          { type: "mrkdwn", text: `*연락처*\n${input.phone}` },
          { type: "mrkdwn", text: `*기수*\n${input.grade}` },
          { type: "mrkdwn", text: `*예금주*\n${input.holderName}` },
          { type: "mrkdwn", text: `*은행*\n${input.bank}` },
          { type: "mrkdwn", text: `*출금일*\n매월 ${formatWithdrawDayKo(input.withdrawDay)}` },
          { type: "mrkdwn", text: `*월 금액*\n월 ${amount}` },
        ],
      },
    ],
  };

  // Slack Incoming Webhook은 JSON 프리플라이트를 처리하지 않으므로
  // text/plain + no-cors 로 보낸다 (응답은 읽지 않음).
  fetch(webhookUrl, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

export async function submitDonation(input: DonationInput) {
  const res = await fetch(getSubmitUrl(), {
    method: "POST",
    mode: "cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      name: input.name,
      phone: input.phone,
      grade: input.grade,
      holderName: input.holderName,
      birth: input.birth,
      bank: input.bank,
      account: input.account,
      withdrawDay: input.withdrawDay,
      amount: input.amount,
      consent: input.consent,
    }),
  });

  const data = (await res.json().catch(() => null)) as
    | { ok: true; id: number }
    | { ok: false; error?: string }
    | null;

  if (!res.ok || !data?.ok) {
    throw new Error(data && "error" in data && data.error ? data.error : "신청 접수에 실패했습니다.");
  }

  notifySlackDirect(input);

  return data;
}

export function getSheetUrl() {
  return import.meta.env.VITE_SHEET_URL?.trim() || "";
}

export async function listDonations(token: string): Promise<Donation[]> {
  const res = await fetch(getSubmitUrl(), {
    method: "POST",
    mode: "cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "list", token }),
  });
  const data = (await res.json().catch(() => null)) as
    | { ok: true; data: Donation[] }
    | { ok: false; error?: string }
    | null;

  if (!res.ok || !data?.ok || !Array.isArray(data.data)) {
    throw new Error(
      data && "error" in data && data.error
        ? data.error
        : "신청 내역을 불러오지 못했습니다. Apps Script가 최신 버전으로 재배포되었는지 확인해 주세요.",
    );
  }

  return data.data;
}

function csvCell(value: string | number) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

// 사이트 표기용 은행명 -> 효성CMS+ 대량등록에서 요구하는 공식 은행명.
// (SBI저축은행 등 효성CMS+ 미지원 은행은 신청 단계에서 이미 제외됨)
const CMS_BANK_NAME: Record<string, string> = {
  "KB국민": "국민은행",
  "신한": "신한은행",
  "우리": "우리은행",
  "하나": "하나은행",
  "NH농협": "농협은행",
  "IBK기업": "기업은행",
  "SC제일": "SC제일은행",
  "한국씨티": "한국씨티은행",
  "카카오뱅크": "카카오뱅크",
  "케이뱅크": "케이뱅크",
  "토스뱅크": "토스뱅크",
  "새마을금고": "새마을금고중앙회",
  "신협": "신협",
  "우체국": "우체국",
  "수협": "수협은행",
  "부산": "부산은행",
  "대구(iM)": "아이엠뱅크",
  "경남": "경남은행",
  "광주": "광주은행",
  "전북": "전북은행",
  "제주": "제주은행",
  "산업(KDB)": "산업은행",
};

function cmsBankName(bank: string) {
  return CMS_BANK_NAME[bank] || bank;
}

// 효성CMS+ 약정일: 2자리, 말일은 "99"
function cmsWithdrawDay(withdrawDay: string) {
  if (!withdrawDay) return "";
  if (withdrawDay === "말일") return "99";
  return withdrawDay.padStart(2, "0");
}

function todayYYYYMMDD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function createdAtToYYYYMMDD(createdAt: string) {
  const digits = createdAt.match(/\d+/g);
  if (!digits || digits.length < 3) return todayYYYYMMDD();
  const [y, m, d] = digits;
  return `${y}${m.padStart(2, "0")}${d.padStart(2, "0")}`;
}

// 효성CMS+ 설정 > 상품 에 이 이름으로 상품이 미리 등록되어 있어야 대량등록이 성공한다.
export const CMS_PRODUCT_NAME = "발전기금정기후원";

/**
 * 효성CMS+ "대량회원등록" 템플릿(A~CC, 81개 컬럼)에 맞춘 CSV 생성.
 * 우리 서비스는 개인 / CMS 계좌이체 / 정기 / 무기한 / 간편동의(휴대전화) 케이스만 다루므로
 * 카드·실시간CMS·휴대전화결제·가상계좌·세금계산서 관련 컬럼은 모두 공란으로 둔다.
 * 계좌번호가 지수 표기로 깨지지 않도록 ="..." 형태로 텍스트를 강제한다.
 */
export function buildCmsUploadCsv(donations: Donation[]) {
  const headers = [
    "회원번호", "회원명", "회원상태", "유선전화", "휴대전화", "회원유형", "이메일", "회원구분",
    "담당관리자", "가입일", "SMS수신여부", "우편번호", "주소", "상세주소", "상품", "계약정보명",
    "청구서 발송수단", "청구 자동생성", "청구서 자동발송", "결제방식", "재결제 자동처리", "약정일",
    "청구서 발송수단 연락처 회원기본정보로 사용", "납부자 휴대전화", "납부자 이메일", "청구시작일",
    "청구종료일", "결제주기", "비정기 결제월", "자동결제 청구서 발송", "대표결제수단",
    "간편동의 요청 방식", "간편동의 요청 휴대전화", "간편동의 요청 휴대전화 회원기본정보로 사용",
    "간편동의 요청 이메일", "간편동의 요청 이메일 회원기본정보로 사용",
    "은행(CMS)", "예금주명(CMS)", "계좌번호(CMS)", "생년월일/사업자번호(CMS)", "동의자료종류(CMS)",
    "은행(실시간CMS)", "예금주명(실시간CMS)", "계좌번호(실시간CMS)", "생년월일/사업자번호(실시간CMS)", "동의자료종류(실시간CMS)",
    "카드번호", "명의자", "생년월일/사업자번호(카드)", "유효기간(월)", "유효기간(년)",
    "명의자명(휴대전화)", "결제번호(휴대전화번호)", "이동통신사", "주민번호 앞 7자리", "동의자료종류(휴대전화)",
    "계좌사용여부", "카드사용여부", "간편결제사용여부",
    "가상계좌 입금 금액체크 여부", "가상계좌 청구서 발송", "가상계좌 은행",
    "대표증빙",
    "현금영수증정보", "발급방식(현금영수증)",
    "회원유형(세금계산서)", "등록번호", "상호", "대표자명", "업태", "종목", "종사업장번호",
    "주소(세금계산서)", "발급유형", "발급대상", "계산서 작성일자", "발급방식(세금계산서)", "담당자이메일",
    "품목명", "품목명 상품명과 동일", "비고",
  ];

  const lines = donations.map((row) => {
    const holderName = row.holderName || row.name;
    const account = row.account ? `="${row.account}"` : "";
    const withdrawDayRaw = cmsWithdrawDay(row.withdrawDay);
    const withdrawDay = withdrawDayRaw ? `="${withdrawDayRaw}"` : "";
    const joinDate = createdAtToYYYYMMDD(row.createdAt);
    const billStart = todayYYYYMMDD();

    const cols: (string | number)[] = [
      "", row.name, "Y", "", row.phone, "개인", "", "",
      "", joinDate, "Y", "", "", "",
      `${CMS_PRODUCT_NAME},1,${row.amount},사용`, CMS_PRODUCT_NAME,
      "휴대전화", "자동", "자동", "자동결제", "자동", withdrawDay,
      "Y", row.phone, "",
      billStart, "99991231", "정기", "", "Y", "CMS",
      "휴대전화", "", "Y", "", "",
      cmsBankName(row.bank), holderName, account, row.birth, "",
      "", "", "", "", "",
      "", "", "", "", "",
      "", "", "", "", "",
      "", "", "",
      "", "", "",
      "미발급",
      "", "",
      "", "", "", "", "", "", "",
      "", "", "", "", "", "",
      "", "", "",
    ];

    return cols.map(csvCell).join(",");
  });

  return "﻿" + [headers.join(","), ...lines].join("\r\n");
}
