# GitHub Pages 배포 가이드

## 1. GitHub 저장소 만들기

1. https://github.com/new 접속
2. 저장소 이름 예: `daeil-scholarship-fund`
3. Organization이 `dfhsfund`이면: `dfhsfund/daeil-scholarship-fund`
4. **Public** 저장소 생성

생성 후 주소 예:
`https://github.com/dfhsfund/daeil-scholarship-fund`

## 2. 코드 올리기 (최초 1회)

프로젝트 폴더에서:

```bash
git init
git add .
git commit -m "Migrate to GitHub Pages + Apps Script"
git branch -M main
git remote add origin https://github.com/dfhsfund/daeil-scholarship-fund.git
git push -u origin main
```

## 3. GitHub Secrets 설정

저장소 → **Settings → Secrets and variables → Actions → New repository secret**

| Secret | 값 |
|---|---|
| `VITE_APPS_SCRIPT_URL` | Google Apps Script 웹앱 배포 URL |
| `VITE_SHEET_URL` | 구글 시트 URL |
| `VITE_SITE_URL` | `https://fund.dflhs.or.kr` (도메인 연결 후) |

## 4. GitHub Pages 켜기

저장소 → **Settings → Pages**

- **Source:** GitHub Actions
- (배포 후) **Custom domain:** `fund.dflhs.or.kr`

## 5. 가비아 DNS

| 호스트 | 타입 | 값 |
|---|---|---|
| `fund` | CNAME | `dfhsfund.github.io` |

※ GitHub org/username이 다르면 해당 `*.github.io`로 설정

## 6. Apps Script 업데이트

`scripts/google-apps-script.js` 내용을 시트 Apps Script에 붙여넣고:

1. **프로젝트 설정 → 스크립트 속성** → `SLACK_WEBHOOK_URL` 추가
2. **배포 → 새 배포** (웹 앱, 모든 사용자)
3. URL을 GitHub Secret `VITE_APPS_SCRIPT_URL`에 등록

## 7. 배포 확인

`main` 브랜치에 push하면 Actions가 자동 배포합니다.

- 임시: `https://dfhsfund.github.io/daeil-scholarship-fund/`
- 커스텀: `https://fund.dflhs.or.kr`
