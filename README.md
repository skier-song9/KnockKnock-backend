# knockknock-backend

KnockKnock iOS 앱을 지원하는 Node.js + TypeScript 백엔드 서버다.

## 요구 사항

- Node.js 20+
- Redis 7+

## 실행

```bash
cp .env.example .env
# .env에 TRANSIT_API_KEY 설정

docker-compose up -d redis
npm install
npm run dev
```

기본 포트는 `3000`이고, Redis 기본 주소는 `redis://localhost:6379`다.

## 테스트

```bash
npm test
```

## 환경 변수

- `PORT`
- `REDIS_URL`
- `TRANSIT_API_KEY`
