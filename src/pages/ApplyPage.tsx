import { FormEvent, useRef, useState } from "react";
import { submitDonation } from "../lib/submitDonation";

const PRESET_AMOUNTS = [
  { label: "월 2만원", value: 20000, desc: "따뜻한 응원" },
  { label: "월 5만원", value: 50000, desc: "꾸준한 동행" },
  { label: "월 10만원", value: 100000, desc: "깊은 나눔" },
] as const;

const STEPS = [
  { num: "01", title: "참여 의사 전달", desc: "간단한 정보를 남겨 주세요" },
  { num: "02", title: "개별 안내 연락", desc: "동문회에서 연락드립니다" },
  { num: "03", title: "자동이체 등록", desc: "안내에 따라 별도 진행" },
] as const;

const META = [
  { key: "ORG", value: "대일외고 총동문회" },
  { key: "TYPE", value: "장학금 정기후원" },
  { key: "YEAR", value: "2025" },
  { key: "STATUS", value: "접수 중" },
] as const;

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function formatAmount(amount: number) {
  return `${amount.toLocaleString("ko-KR")}원`;
}

export default function ApplyPage() {
  const formRef = useRef<HTMLElement>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [grade, setGrade] = useState("");
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
    if (!resolvedAmount || resolvedAmount < 1000) {
      setError("희망 후원 금액을 1,000원 이상 입력해 주세요.");
      return;
    }

    try {
      setSubmitting(true);
      await submitDonation({
        name: name.trim(),
        phone: phone.replace(/\D/g, ""),
        grade: grade.trim(),
        amount: resolvedAmount,
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
        <header className="ph-topbar">
          <span className="ph-brand">DAEIL-SCH™</span>
          <span className="ph-topbar-code">CONFIRMED</span>
        </header>
        <div className="ph-success">
          <p className="ph-index">N.04 — COMPLETE</p>
          <div className="ph-success-mark" aria-hidden>
            ✓
          </div>
          <h1>
            참여 신청이
            <br />
            접수되었습니다
          </h1>
          <p className="ph-success-lead">
            <strong>{name}</strong> 선배님, 소중한 마음에 감사드립니다.
          </p>
          <div className="ph-spec-sheet">
            <div className="ph-spec-row">
              <span className="ph-spec-key">AMOUNT</span>
              <span className="ph-spec-val">월 {formatAmount(resolvedAmount)}</span>
            </div>
            <div className="ph-spec-row">
              <span className="ph-spec-key">NEXT</span>
              <span className="ph-spec-val">동문회에서 안내 연락을 드립니다</span>
            </div>
          </div>
          <p className="ph-footnote">
            이 페이지에서 결제나 자동이체가 진행되지 않습니다. 등록 절차는 별도 안내에 따라
            진행됩니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="apply-page">
      <header className="ph-topbar">
        <span className="ph-brand">DAEIL-SCH™</span>
        <span className="ph-topbar-code">SCHOLARSHIP PROGRAM</span>
      </header>

      <section className="ph-hero">
        <div className="ph-hero-frame" aria-hidden />
        <div className="ph-hero-layout">
          <aside className="ph-hero-meta">
            {META.map((item) => (
              <div key={item.key} className="ph-meta-row">
                <span className="ph-meta-key">{item.key}</span>
                <span className="ph-meta-sep">|</span>
                <span className="ph-meta-val">{item.value}</span>
              </div>
            ))}
          </aside>

          <div className="ph-hero-main">
            <p className="ph-index">N.01 — KEY VISUAL</p>
            <div className="ph-title-grid">
              <span className="ph-module">후배들의</span>
              <span className="ph-module">내일을</span>
              <span className="ph-module ph-module--invert">함께</span>
              <span className="ph-module ph-module--wide">응원합니다</span>
            </div>
            <p className="ph-hero-desc">
              장학금 정기후원은 재학생과 후배들에게 꾸준한 학업 지원을 전하는
              동문회의 나눔 프로그램입니다. 부담 없이 참여 의사만 먼저 전해 주세요.
            </p>
            <button type="button" className="ph-cta" onClick={scrollToForm}>
              <span className="ph-cta-label">APPLY</span>
              <span className="ph-cta-text">참여 신청하기</span>
              <span className="ph-cta-arrow">→</span>
            </button>
            <p className="ph-disclaimer">※ 이 페이지에서 즉시 결제되지 않습니다</p>
          </div>
        </div>
      </section>

      <section className="ph-section">
        <div className="ph-section-head">
          <p className="ph-index">N.02 — PROGRAM</p>
          <h2 className="ph-section-title">
            | 정기후원 <span>프로그램</span> |
          </h2>
        </div>

        <div className="ph-panel-grid">
          <article className="ph-panel">
            <header className="ph-panel-head">
              <span className="ph-panel-num">A</span>
              <h3>왜 정기후원인가요</h3>
            </header>
            <p>
              한 번의 큰 기부보다, 매달 이어지는 작은 나눔이 후배들에게 더 오래 머무는
              힘이 됩니다. 동문회는 모인 성금을 장학 사업에 투명하게 사용합니다.
            </p>
          </article>

          <article className="ph-panel ph-panel--dark">
            <header className="ph-panel-head">
              <span className="ph-panel-num">B</span>
              <h3>참여 진행 절차</h3>
            </header>
            <ol className="ph-steps">
              {STEPS.map((step) => (
                <li key={step.num}>
                  <span className="ph-step-num">{step.num}</span>
                  <div>
                    <strong>{step.title}</strong>
                    <span>{step.desc}</span>
                  </div>
                </li>
              ))}
            </ol>
          </article>
        </div>
      </section>

      <section className="ph-section ph-section--form" ref={formRef} id="apply-form">
        <div className="ph-section-head">
          <p className="ph-index">N.03 — APPLICATION</p>
          <h2 className="ph-section-title">
            | 참여 <span>신청서</span> |
          </h2>
          <p className="ph-section-desc">아래 정보를 남겨 주시면, 담당자가 순차적으로 연락드립니다.</p>
        </div>

        <div className="ph-form-sheet">
          <div className="ph-form-sheet-bar">
            <span>FORM — STEP 01</span>
            <span>REV. 2025</span>
          </div>

          <form className="ph-form" onSubmit={handleSubmit}>
            <fieldset className="ph-fieldset">
              <legend>
                <span className="ph-legend-num">01</span>
                기본 정보
              </legend>
              <div className="ph-fields">
                <div className="field ph-field">
                  <label htmlFor="name">
                    <span className="ph-field-code">NM</span> 성함
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder="홍길동"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />
                </div>
                <div className="field ph-field">
                  <label htmlFor="phone">
                    <span className="ph-field-code">TEL</span> 연락처
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="010-0000-0000"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    autoComplete="tel"
                  />
                </div>
                <div className="field ph-field">
                  <label htmlFor="grade">
                    <span className="ph-field-code">GR</span> 기수
                  </label>
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

            <fieldset className="ph-fieldset">
              <legend>
                <span className="ph-legend-num">02</span>
                희망 후원 금액 (월)
              </legend>
              <p className="ph-fieldset-hint">
                금액은 참고용이며, 실제 이체는 안내 후 진행됩니다.
              </p>
              <div className="ph-amount-grid">
                {PRESET_AMOUNTS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    className={`ph-amount ${selectedAmount === preset.value ? "active" : ""}`}
                    onClick={() => setSelectedAmount(preset.value)}
                  >
                    <span className="ph-amount-label">{preset.label}</span>
                    <span className="ph-amount-desc">{preset.desc}</span>
                  </button>
                ))}
                <button
                  type="button"
                  className={`ph-amount ph-amount--custom ${selectedAmount === "custom" ? "active" : ""}`}
                  onClick={() => setSelectedAmount("custom")}
                >
                  <span className="ph-amount-label">직접 입력</span>
                  <span className="ph-amount-desc">원하시는 금액</span>
                </button>
              </div>
              {selectedAmount === "custom" && (
                <input
                  className="ph-custom-input"
                  type="text"
                  inputMode="numeric"
                  placeholder="월 후원 희망 금액 (원)"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value.replace(/\D/g, ""))}
                />
              )}
            </fieldset>

            {error && <p className="error-text ph-error">{error}</p>}

            <button className="ph-submit" type="submit" disabled={submitting}>
              {submitting ? "접수 중..." : "참여 신청 접수하기"}
            </button>

            <p className="ph-footnote">
              제출하시면 참여 의사가 접수됩니다. 계좌 자동이체는 이 화면에서 처리되지 않으며,
              이후 개별 안내를 통해 진행됩니다.
            </p>
          </form>
        </div>
      </section>

      <footer className="ph-footer">
        <span>대일외국어고등학교 총동문회 · 장학금 사업</span>
        <span className="ph-footer-sep">|</span>
        <a href="/admin">ADMIN</a>
      </footer>
    </div>
  );
}
