import { FormEvent, useRef, useState } from "react";
import { submitDonation } from "../lib/submitDonation";

const PRESET_AMOUNTS = [
  { label: "월 2만원", value: 20000, desc: "따뜻한 응원" },
  { label: "월 5만원", value: 50000, desc: "꾸준한 동행" },
  { label: "월 10만원", value: 100000, desc: "깊은 나눔" },
] as const;

const STEPS = [
  { num: "01", title: "정보 입력 & 출금 동의", desc: "계좌와 출금일을 남겨 주세요" },
  { num: "02", title: "동문회 확인", desc: "등록 내용을 확인합니다" },
  { num: "03", title: "매월 자동이체", desc: "약정일에 후원금이 이체됩니다" },
] as const;

const BANKS = [
  "KB국민",
  "신한",
  "우리",
  "하나",
  "NH농협",
  "IBK기업",
  "SC제일",
  "한국씨티",
  "카카오뱅크",
  "케이뱅크",
  "토스뱅크",
  "새마을금고",
  "신협",
  "우체국",
  "수협",
  "부산",
  "대구(iM)",
  "경남",
  "광주",
  "전북",
  "제주",
  "산업(KDB)",
] as const;

const WITHDRAW_DAYS = ["5", "10", "15", "20", "25", "말일"] as const;

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function formatAmount(amount: number) {
  return `${amount.toLocaleString("ko-KR")}원`;
}

function OrbitLogoMark() {
  return <span className="orbit-logo-mark" aria-hidden />;
}

function OrbitIllustration() {
  return (
    <svg className="orbit-hero-orbits" viewBox="0 0 480 480" fill="none" aria-hidden>
      <circle cx="230" cy="150" r="110" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <circle cx="330" cy="230" r="150" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <circle cx="150" cy="290" r="70" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <circle cx="230" cy="150" r="5" fill="currentColor" opacity="0.6" />
      <circle cx="380" cy="140" r="5" fill="currentColor" opacity="0.6" />
      <circle cx="410" cy="330" r="5" fill="currentColor" opacity="0.6" />
      <circle cx="120" cy="230" r="5" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

export default function ApplyPage() {
  const formRef = useRef<HTMLElement>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [grade, setGrade] = useState("");
  const [holderName, setHolderName] = useState("");
  const [birth, setBirth] = useState("");
  const [bank, setBank] = useState("");
  const [account, setAccount] = useState("");
  const [withdrawDay, setWithdrawDay] = useState("25");
  const [consent, setConsent] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | "custom">(50000);
  const [customAmount, setCustomAmount] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const resolvedAmount =
    selectedAmount === "custom" ? Number(customAmount.replace(/\D/g, "")) : selectedAmount;

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("이름을 입력해 주세요.");
      return;
    }
    if (!phone.replace(/\D/g, "").match(/^01[0-9]{8,9}$/)) {
      setError("올바른 휴대전화 번호를 입력해 주세요.");
      return;
    }
    if (!grade.trim()) {
      setError("기수를 입력해 주세요.");
      return;
    }
    if (!birth.match(/^\d{6}$/)) {
      setError("생년월일 6자리(예: 900101)를 입력해 주세요.");
      return;
    }
    if (!bank) {
      setError("출금 은행을 선택해 주세요.");
      return;
    }
    if (account.replace(/\D/g, "").length < 8) {
      setError("올바른 계좌번호를 입력해 주세요.");
      return;
    }
    if (!withdrawDay) {
      setError("출금일을 선택해 주세요.");
      return;
    }
    if (!resolvedAmount || resolvedAmount < 1000) {
      setError("후원 금액을 1,000원 이상 입력해 주세요.");
      return;
    }
    if (!consent) {
      setError("자동이체 출금 동의가 필요합니다.");
      return;
    }

    try {
      setSubmitting(true);
      await submitDonation({
        name: name.trim(),
        phone: phone.replace(/\D/g, ""),
        grade: grade.trim(),
        holderName: holderName.trim() || name.trim(),
        birth: birth.trim(),
        bank,
        account: account.replace(/\D/g, ""),
        withdrawDay,
        amount: resolvedAmount,
        consent,
      });
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "신청 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="apply-page">
        <header className="orbit-topbar">
          <span className="orbit-logo">
            <OrbitLogoMark />
            DAEIL·SCH
          </span>
          <span className="orbit-topbar-tag">접수 완료</span>
        </header>
        <div className="orbit-success">
          <div className="orbit-success-mark" aria-hidden>
            ✓
          </div>
          <h1>
            자동이체 신청이
            <br />
            접수되었습니다
          </h1>
          <p className="orbit-success-lead">
            <strong>{name}</strong> 선배님, 소중한 마음에 감사드립니다.
          </p>
          <div className="orbit-summary-card">
            <div className="orbit-summary-row">
              <span>월 후원액</span>
              <span>월 {formatAmount(resolvedAmount)}</span>
            </div>
            <div className="orbit-summary-row">
              <span>출금일</span>
              <span>매월 {withdrawDay === "말일" ? "말일" : `${withdrawDay}일`}</span>
            </div>
            <div className="orbit-summary-row">
              <span>다음 단계</span>
              <span>동문회 확인 후 자동이체 등록</span>
            </div>
          </div>
          <p className="orbit-footnote">
            등록 내용 확인을 위해 동문회에서 연락드릴 수 있습니다. 첫 출금은 등록 완료 후 가장
            가까운 약정일부터 시작됩니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="apply-page">
      <header className="orbit-topbar">
        <span className="orbit-logo">
          <OrbitLogoMark />
          DAEIL·SCH
        </span>
        <span className="orbit-topbar-tag">발전기금 정기후원</span>
      </header>

      <section className="orbit-hero">
        <OrbitIllustration />
        <div className="orbit-hero-inner">
          <span className="orbit-badge">대일외국어고등학교 총동문회</span>
          <h1 className="orbit-hero-title">
            후배들의 내일을
            <br />
            <span className="orbit-highlight">함께</span> 응원합니다
          </h1>
          <p className="orbit-hero-desc">
            발전기금 정기후원은 재학생과 후배들에게 꾸준한 학업 지원을 전하는
            동문회의 나눔 프로그램입니다. 아래에서 자동이체 신청을 바로 진행하실 수 있습니다.
          </p>
          <button type="button" className="orbit-cta" onClick={scrollToForm}>
            정기후원 신청하기
          </button>
          <p className="orbit-hero-note">※ 신청 즉시 결제되지 않으며, 약정일에 이체됩니다</p>
        </div>
      </section>

      <section className="orbit-section">
        <div className="orbit-section-head">
          <span className="orbit-eyebrow">정기후원 프로그램</span>
          <h2>왜, 그리고 어떻게</h2>
        </div>

        <div className="orbit-panel-grid">
          <article className="orbit-panel orbit-panel--mint">
            <h3>왜 정기후원인가요</h3>
            <p>
              한 번의 큰 기부보다, 매달 이어지는 작은 나눔이 후배들에게 더 오래 머무는
              힘이 됩니다. 동문회는 모인 성금을 발전기금 사업에 투명하게 사용합니다.
            </p>
          </article>

          <article className="orbit-panel orbit-panel--dark">
            <h3>참여 진행 절차</h3>
            <ol className="orbit-steps">
              {STEPS.map((step) => (
                <li key={step.num}>
                  <span className="orbit-step-dot">{step.num}</span>
                  <div>
                    <strong>{step.title}</strong>
                    <span className="orbit-step-desc">{step.desc}</span>
                  </div>
                </li>
              ))}
            </ol>
          </article>
        </div>
      </section>

      <section className="orbit-section orbit-section--form" ref={formRef} id="apply-form">
        <div className="orbit-section-head">
          <span className="orbit-eyebrow">신청서 작성</span>
          <h2>정기후원 신청서</h2>
          <p>아래 정보를 입력하시면 동문회 확인 후 자동이체가 등록됩니다.</p>
        </div>

        <div className="orbit-form-card">
          <form className="orbit-form" onSubmit={handleSubmit}>
            <fieldset className="orbit-fieldset">
              <legend>기본 정보</legend>
              <div className="orbit-fields">
                <div className="field orbit-field">
                  <label htmlFor="name">성함</label>
                  <input
                    id="name"
                    type="text"
                    placeholder="홍길동"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />
                </div>
                <div className="field orbit-field">
                  <label htmlFor="phone">연락처</label>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="010-0000-0000"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    autoComplete="tel"
                  />
                </div>
                <div className="field orbit-field">
                  <label htmlFor="grade">기수</label>
                  <input
                    id="grade"
                    type="text"
                    placeholder="예: 45기 또는 2005"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className="orbit-fieldset">
              <legend>자동이체(CMS) 정보</legend>
              <p className="orbit-fieldset-hint">
                후원금 출금 계좌 정보입니다. 예금주 본인 명의 계좌로 입력해 주세요.
              </p>
              <div className="orbit-fields">
                <div className="field orbit-field">
                  <label htmlFor="holderName">예금주명</label>
                  <input
                    id="holderName"
                    type="text"
                    placeholder="신청자와 다를 경우에만 입력"
                    value={holderName}
                    onChange={(e) => setHolderName(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className="field orbit-field">
                  <label htmlFor="birth">예금주 생년월일 (6자리)</label>
                  <input
                    id="birth"
                    type="text"
                    inputMode="numeric"
                    placeholder="예: 900101"
                    value={birth}
                    onChange={(e) => setBirth(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    autoComplete="off"
                  />
                </div>
                <div className="field orbit-field">
                  <label htmlFor="bank">출금 은행</label>
                  <select id="bank" value={bank} onChange={(e) => setBank(e.target.value)}>
                    <option value="">은행 선택</option>
                    {BANKS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field orbit-field">
                  <label htmlFor="account">계좌번호</label>
                  <input
                    id="account"
                    type="text"
                    inputMode="numeric"
                    placeholder="'-' 없이 숫자만"
                    value={account}
                    onChange={(e) => setAccount(e.target.value.replace(/\D/g, "").slice(0, 20))}
                    autoComplete="off"
                  />
                </div>
                <div className="field orbit-field">
                  <label htmlFor="withdrawDay">출금일 (매월)</label>
                  <select
                    id="withdrawDay"
                    value={withdrawDay}
                    onChange={(e) => setWithdrawDay(e.target.value)}
                  >
                    {WITHDRAW_DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d === "말일" ? "말일" : `${d}일`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </fieldset>

            <fieldset className="orbit-fieldset">
              <legend>월 후원 금액 (자동이체 출금액)</legend>
              <p className="orbit-fieldset-hint">선택하신 금액이 매월 약정일에 자동이체됩니다.</p>
              <div className="orbit-amount-grid">
                {PRESET_AMOUNTS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    className={`orbit-amount ${selectedAmount === preset.value ? "active" : ""}`}
                    onClick={() => setSelectedAmount(preset.value)}
                  >
                    <span className="orbit-amount-label">{preset.label}</span>
                    <span className="orbit-amount-desc">{preset.desc}</span>
                  </button>
                ))}
                <button
                  type="button"
                  className={`orbit-amount ${selectedAmount === "custom" ? "active" : ""}`}
                  onClick={() => setSelectedAmount("custom")}
                >
                  <span className="orbit-amount-label">직접 입력</span>
                  <span className="orbit-amount-desc">원하시는 금액</span>
                </button>
              </div>
              {selectedAmount === "custom" && (
                <input
                  className="orbit-custom-input"
                  type="text"
                  inputMode="numeric"
                  placeholder="월 후원 희망 금액 (원)"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value.replace(/\D/g, ""))}
                />
              )}
            </fieldset>

            <label className="orbit-consent">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>
                개인정보 수집·이용 및 자동이체(CMS) 출금에 동의합니다. 수집된 계좌 정보는
                효성CMS를 통한 자동이체 등록·출금 목적으로만 사용됩니다.
              </span>
            </label>

            {error && <p className="error-text">{error}</p>}

            <button className="orbit-submit" type="submit" disabled={submitting}>
              {submitting ? "접수 중..." : "정기후원 신청하기"}
            </button>

            <p className="orbit-footnote">
              제출하시면 자동이체 신청이 접수됩니다. 신청 즉시 결제되지 않으며, 동문회 확인 후
              등록되어 약정일부터 매월 이체됩니다.
            </p>
          </form>
        </div>
      </section>

      <footer className="orbit-footer">
        <span>대일외국어고등학교 총동문회 · 발전기금 사업</span>
        <span className="orbit-footer-sep">·</span>
        <a href="/admin">ADMIN</a>
      </footer>
    </div>
  );
}
