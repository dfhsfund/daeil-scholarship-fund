import { Link } from "react-router-dom";
import { getSheetUrl } from "../lib/submitDonation";

export default function AdminPage() {
  const sheetUrl = getSheetUrl();

  return (
    <div className="admin-page">
      <header className="ph-topbar ph-topbar--admin">
        <Link to="/" className="ph-back-link">
          ← 신청 페이지
        </Link>
        <span className="ph-brand">DAEIL-SCH™ ADMIN</span>
        <span className="ph-topbar-code">SHEET</span>
      </header>

      <main className="admin-main admin-main--narrow">
        <div className="ph-login-sheet">
          <div className="ph-form-sheet-bar">
            <span>ADMIN — RECORDS</span>
            <span>GOOGLE SHEETS</span>
          </div>
          <div className="ph-login-body">
            <p className="ph-index">N.ADM — MANAGEMENT</p>
            <h1 className="ph-section-title">
              | 신청 <span>내역</span> |
            </h1>
            <p className="ph-section-desc">
              신청 내역은 구글 스프레드시트에서 확인합니다. 시트 접근 권한이 있는 위원회 계정으로
              열어 주세요.
            </p>
            {sheetUrl ? (
              <a className="ph-submit ph-admin-sheet-link" href={sheetUrl} target="_blank" rel="noreferrer">
                구글 시트 열기
              </a>
            ) : (
              <p className="ph-admin-loading">시트 URL이 설정되지 않았습니다.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
