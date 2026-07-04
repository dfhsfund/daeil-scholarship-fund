# 대일외고 장학금 정기후원 신청

정적 사이트(GitHub Pages) + Google Apps Script(시트·슬랙 연동)

- 신청: `/`
- 관리(시트 링크): `/admin`

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
