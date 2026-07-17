# 대일외고 총동문회 발전기금 정기후원 신청

정적 사이트(GitHub Pages) + Google Apps Script(시트 연동). 슬랙 알림은 Apps Script를 거치지 않고
사이트가 신청 접수 성공 직후 Incoming Webhook으로 직접 보냅니다 (`VITE_SLACK_WEBHOOK_URL`).

- 신청: `/` — 이름·연락처·기수 + 자동이체(CMS) 계좌 정보·출금 동의 수집
- 관리: `/admin` — 신청 내역 조회 + **효성CMS+ 대량등록용 CSV 내보내기** (비밀번호 필요)

## 효성CMS+ 연동

- 신청서에서 예금주·생년월일(6자리)·은행·계좌번호·출금일·출금 동의를 받아 구글 시트에 저장합니다.
- `/admin` 의 **효성CMS+ CSV 내보내기** 버튼으로 효성CMS+ "대량회원등록" 공식 템플릿(A~CC, 81컬럼) 형식의
  CSV를 바로 받습니다 (`src/lib/submitDonation.ts`의 `buildCmsUploadCsv`).
  개인 / CMS 계좌이체 / 정기 / 무기한 / 간편동의(휴대전화) 케이스만 채우고 나머지 컬럼은 공란입니다.
- 업로드 전 효성CMS+ `설정 > 상품`에 상품명 `발전기금정기후원`(`CMS_PRODUCT_NAME`)이 미리 등록되어 있어야
  합니다. 이름이 하나라도 다르면 업로드가 전건 실패합니다.
- 시트 헤더(1행):
  `ID | 이름 | 연락처 | 기수 | 예금주명 | 생년월일 | 은행 | 계좌번호 | 출금일 | 신청금액 | 동의 | 신청일시`

> 계좌·생년월일 등 금융 개인정보가 저장됩니다. Apps Script 스크립트 속성 `ADMIN_TOKEN` 을 반드시
> 설정하고, 구글 시트 공유 범위를 담당자로 제한하세요.

## 로컬 개발

```bash
cp .env.example .env
bun install
bun run dev
```

## 배포

`main` 브랜치 push → GitHub Actions → Pages

커스텀 도메인: `fund.dflhs.or.kr`

자세한 설정: [DEPLOY-GITHUB.md](./DEPLOY-GITHUB.md)
