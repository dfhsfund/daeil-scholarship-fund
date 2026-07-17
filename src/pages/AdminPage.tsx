import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CMS_PRODUCT_NAME, Donation, buildCmsUploadCsv, getSheetUrl, listDonations } from "../lib/submitDonation";

const TOKEN_KEY = "daeil_admin_token";

function formatAmount(amount: number) {
  return `${amount.toLocaleString("ko-KR")}원`;
}

function maskAccount(account: string) {
  if (!account) return "";
  if (account.length <= 6) return account;
  return `${account.slice(0, 3)}****${account.slice(-3)}`;
}

function formatWithdrawDay(withdrawDay: string) {
  if (!withdrawDay) return "-";
  return withdrawDay === "말일" ? "말일" : `${withdrawDay}일`;
}

function computeStats(donations: Donation[]) {
  const byAmount = { amount20000: 0, amount50000: 0, amount100000: 0, other: 0 };
  let totalMonthlyAmount = 0;

  for (const row of donations) {
    totalMonthlyAmount += row.amount;
    if (row.amount === 20000) byAmount.amount20000 += 1;
    else if (row.amount === 50000) byAmount.amount50000 += 1;
    else if (row.amount === 100000) byAmount.amount100000 += 1;
    else byAmount.other += 1;
  }

  return { totalCount: donations.length, totalMonthlyAmount, byAmount };
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function AdminPage() {
  const sheetUrl = getSheetUrl();
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) || "");
  const [pwInput, setPwInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(Boolean(sessionStorage.getItem(TOKEN_KEY)));
  const [error, setError] = useState("");

  function load(currentToken: string) {
    setLoading(true);
    setError("");
    listDonations(currentToken)
      .then((data) => {
        setDonations([...data].reverse());
        setAuthed(true);
        sessionStorage.setItem(TOKEN_KEY, currentToken);
      })
      .catch((err) => {
        setAuthed(false);
        sessionStorage.removeItem(TOKEN_KEY);
        setError(err instanceof Error ? err.message : "신청 내역을 불러오지 못했습니다.");
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (token) load(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLogin(e: FormEvent) {
    e.preventDefault();
    const next = pwInput.trim();
    if (!next) return;
    setToken(next);
    load(next);
  }

  function handleExport() {
    if (donations.length === 0) return;
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const rows = [...donations].reverse();
    downloadCsv(`효성CMS_대량등록_${stamp}.csv`, buildCmsUploadCsv(rows));
  }

  const stats = computeStats(donations);

  if (!authed) {
    return (
      <div className="orbit-admin-page">
        <header className="orbit-topbar orbit-topbar--admin">
          <Link to="/" className="orbit-back-link">
            ← 신청 페이지
          </Link>
          <span className="orbit-logo">
            <span className="orbit-logo-mark" aria-hidden />
            DAEIL·SCH
          </span>
          <span className="orbit-topbar-tag">ADMIN</span>
        </header>

        <main className="orbit-admin-main">
          <div className="orbit-admin-card">
            <h1>관리자 인증</h1>
            <p>후원자 계좌 정보가 포함되어 있어 비밀번호가 필요합니다.</p>
            <form onSubmit={handleLogin}>
              <div className="field">
                <input
                  type="password"
                  placeholder="관리자 비밀번호"
                  value={pwInput}
                  onChange={(e) => setPwInput(e.target.value)}
                  autoFocus
                />
              </div>
              {error && <p className="error-text">{error}</p>}
              <button className="orbit-submit" type="submit" disabled={loading}>
                {loading ? "확인 중..." : "확인"}
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="orbit-admin-page">
      <header className="orbit-topbar orbit-topbar--admin">
        <Link to="/" className="orbit-back-link">
          ← 신청 페이지
        </Link>
        <span className="orbit-logo">
          <span className="orbit-logo-mark" aria-hidden />
          DAEIL·SCH
        </span>
        <span className="orbit-topbar-tag">ADMIN</span>
      </header>

      <main className="orbit-admin-main orbit-admin-main--wide">
        <div className="orbit-admin-toolbar">
          <div>
            <span className="orbit-eyebrow">관리</span>
            <h1>신청 내역</h1>
          </div>
          <div className="orbit-admin-actions">
            <button
              type="button"
              className="orbit-cta orbit-cta--small"
              onClick={handleExport}
              disabled={donations.length === 0}
            >
              효성CMS+ CSV 내보내기
            </button>
            {sheetUrl && (
              <a
                className="orbit-cta orbit-cta--small orbit-cta--ghost"
                href={sheetUrl}
                target="_blank"
                rel="noreferrer"
              >
                구글 시트에서 열기
              </a>
            )}
          </div>
        </div>

        <p className="orbit-admin-hint">
          효성CMS+ 업로드 전 <b>설정 &gt; 상품</b>에 <code>{CMS_PRODUCT_NAME}</code> 상품이
          등록되어 있어야 합니다. (상품명이 다르면 대량등록이 실패합니다)
        </p>

        {error && <p className="error-text">{error}</p>}

        {loading ? (
          <p className="orbit-admin-loading">신청 내역을 불러오는 중...</p>
        ) : (
          <>
            <div className="orbit-stat-grid">
              <div className="orbit-stat-card">
                <span className="orbit-stat-key">총 신청자 수</span>
                <span className="orbit-stat-val">{stats.totalCount}명</span>
              </div>
              <div className="orbit-stat-card orbit-stat-card--dark">
                <span className="orbit-stat-key">예상 월 후원금 합계</span>
                <span className="orbit-stat-val">{formatAmount(stats.totalMonthlyAmount)}</span>
              </div>
              <div className="orbit-stat-card">
                <span className="orbit-stat-key">2만 / 5만 / 10만원</span>
                <span className="orbit-stat-val orbit-stat-val--sm">
                  {stats.byAmount.amount20000} / {stats.byAmount.amount50000} /{" "}
                  {stats.byAmount.amount100000}
                </span>
                <span className="orbit-stat-sub">기타 {stats.byAmount.other}명</span>
              </div>
            </div>

            <div className="orbit-table-wrap">
              {donations.length === 0 ? (
                <p className="orbit-admin-loading">아직 신청 내역이 없습니다.</p>
              ) : (
                <table className="orbit-table">
                  <thead>
                    <tr>
                      <th>이름</th>
                      <th>연락처</th>
                      <th>기수</th>
                      <th>예금주</th>
                      <th>생년월일</th>
                      <th>은행</th>
                      <th>계좌번호</th>
                      <th>출금일</th>
                      <th>월 금액</th>
                      <th>동의</th>
                      <th>신청일시</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donations.map((row) => (
                      <tr key={row.id}>
                        <td>{row.name}</td>
                        <td>{row.phone}</td>
                        <td>{row.grade}</td>
                        <td>{row.holderName}</td>
                        <td>{row.birth}</td>
                        <td>{row.bank}</td>
                        <td>{maskAccount(row.account)}</td>
                        <td>{formatWithdrawDay(row.withdrawDay)}</td>
                        <td>{formatAmount(row.amount)}</td>
                        <td>{row.consent ? "○" : "-"}</td>
                        <td>{row.createdAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
