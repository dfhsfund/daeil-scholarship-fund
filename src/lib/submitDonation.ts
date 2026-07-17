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

// 효성CMS+ 대량등록 CSV는 EUC-KR(CP949)만 인식한다(UTF-8로 올리면 "등록할 데이터가 없습니다"로 실패).
// 브라우저는 EUC-KR 인코딩(문자열 -> 바이트)을 기본 제공하지 않으므로,
// 디코딩은 되는 TextDecoder를 모든 2바이트 조합에 돌려 역방향 매핑 테이블을 만들어 쓴다.
let eucKrEncodeTable: Map<string, Uint8Array> | null = null;

function getEucKrEncodeTable() {
  if (eucKrEncodeTable) return eucKrEncodeTable;

  const decoder = new TextDecoder("euc-kr");
  const table = new Map<string, Uint8Array>();
  for (let b = 0; b <= 0x7f; b++) {
    table.set(String.fromCharCode(b), new Uint8Array([b]));
  }
  for (let lead = 0x81; lead <= 0xfe; lead++) {
    for (let trail = 0x41; trail <= 0xfe; trail++) {
      if (trail === 0x7f) continue;
      const bytes = new Uint8Array([lead, trail]);
      const decoded = decoder.decode(bytes);
      if (decoded.length === 1 && decoded.charCodeAt(0) !== 0xfffd && !table.has(decoded)) {
        table.set(decoded, bytes);
      }
    }
  }

  eucKrEncodeTable = table;
  return table;
}

function encodeEucKr(text: string) {
  const table = getEucKrEncodeTable();
  const bytes: number[] = [];
  for (const ch of text) {
    const mapped = table.get(ch);
    if (mapped) {
      bytes.push(...mapped);
    } else {
      bytes.push(0x3f); // '?' — EUC-KR로 표현 불가한 문자(사실상 발생 안 함)
    }
  }
  return Uint8Array.from(bytes);
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
 * 공식 샘플 파일(대량회원등록샘플.csv)과 행 단위로 대조해 인코딩(EUC-KR)·개행(LF)·
 * 헤더 2줄(그룹 라벨 + 실제 컬럼명) 구조·값 포맷(="..." 없이 평문)을 그대로 맞췄다.
 * (헤더가 1줄뿐이면 CMS+가 실제 데이터 행까지 헤더로 인식해 "등록할 데이터가 없습니다" 오류가 난다.)
 * EUC-KR 바이트 배열을 그대로 반환한다.
 */
export function buildCmsUploadCsv(donations: Donation[]) {
  // 공식 샘플 1행: 컬럼을 그룹으로 묶는 라벨 행 (대부분 공란, 그룹 시작 컬럼에만 값)
  const groupLabels = [
    "기본정보", "", "", "", "", "", "", "", "", "", "", "", "", "",
    "계약정보", "",
    "결제정보 및 청구정보", "", "", "", "", "", "", "", "", "", "", "", "",
    "자동결제 공통정보", "", "", "", "", "", "",
    "자동결제CMS", "", "", "", "",
    "자동결제 실시간CMS", "", "", "", "",
    "자동결제 카드", "", "", "", "",
    "자동결제 휴대전화", "", "", "", "",
    "납부자결제", "", "",
    "가상계좌 ", "", "",
    "대표증빙",
    "현금영수증", "",
    "세금계산서", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "",
  ];

  // 공식 샘플 2행: 실제 컬럼명 (샘플 파일 원문 그대로 — 위치로 매칭되므로 동일 텍스트 사용)
  const headers = [
    "회원번호", "회원명", "회원상태(사용:Y, 중지:N)", "유선전화", "휴대전화", "회원유형", "이메일",
    "회원구분", "담당관리자(아이디)", "가입일", "SMS수신여부", "우편번호", "주소", "상세주소",
    "상품", "계약정보명", "청구서 발송수단", "청구 자동생성", "청구서 자동발송", "결제방식",
    "재결제 자동처리", "약정일(자동결제-약정일, 납부자결제-납부시작일, 말일인 경우 99 입력)",
    "청구서 발송수단 연락처 회원기본정보로 사용(Y/N)", "납부자 휴대전화", "납부자 이메일",
    "청구시작일", "청구종료일", "결제주기", "비정기 결제월", "자동결제 청구서 발송(Y/N)",
    "대표결제수단", "간편동의 요청방식(휴대전화 / 이메일)", "간편동의 요청 휴대전화",
    "간편동의 요청 휴대전화 회원기본정보로 사용(Y/N)", "간편동의 요청 이메일",
    "간편동의 요청 이메일 회원기본정보로 사용(Y/N)",
    "은행", "예금주명", "계좌번호", "생년월일/사업자번호", "동의자료종류",
    "은행", "예금주명", "계좌번호", "생년월일/사업자번호", "동의자료종류",
    "카드번호", "명의자", "생년월일/사업자번호", "유효기간(월)", "유효기간(년)",
    "명의자", "결제번호(휴대전화번호)", "이동통신사", "주민번호 앞 7자리(생년월일+성별)", "동의자료종류",
    "계좌사용여부(Y/N)", "카드사용여부(Y/N)", "간편결제사용여부(Y/N)",
    "가상계좌 입금 금액체크 여부", "가상계좌 청구서 발송", "가상계좌 은행",
    "대표증빙유형",
    "현금영수증정보(휴대전화 또는 카드번호)", "현금영수증정보(발급방식)",
    "회원유형", "등록번호(사업자번호,주민등록번호)", "상호", "대표자명", "업태", "종목", "종사업장번호",
    "주소", "발급유형", "발급대상", "계산서 작성일자", "발급방식", "담당자이메일",
    "품목명", "품목명 상품명과 동일(Y/N)", "비고",
  ];

  const lines = donations.map((row) => {
    const holderName = row.holderName || row.name;
    const account = row.account || "";
    const withdrawDay = cmsWithdrawDay(row.withdrawDay);
    const joinDate = createdAtToYYYYMMDD(row.createdAt);
    const billStart = todayYYYYMMDD();

    const cols: (string | number)[] = [
      String(row.id), row.name, "Y", "", row.phone, "개인", "", "정기후원회원",
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

  const text = [groupLabels.join(","), headers.join(","), ...lines].join("\n") + "\n";
  return encodeEucKr(text);
}
