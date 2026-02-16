---
title: "APON.js 소개 및 사용법"
teaser: APON.js는 Aspectran의 APON(Aspectran Parameters Object Notation) 포맷을 JavaScript 환경에서 네이티브하게 다룰 수 있게 해주는 경량 라이브러리입니다.
---

Aspectran 프레임워크에서 설정 파일 작성을 위해 탄생한 APON(Aspectran Parameters Object Notation)의 편리함과 가독성을 이제 JavaScript 세상에서도 만나보실 수 있습니다.

## APON.js란 무엇인가요?

APON.js는 APON 포맷을 JavaScript 환경에서 네이티브하게 다룰 수 있게 해주는 경량, 무의존성(Zero-dependency) 라이브러리입니다. 이제 여러분은 웹 브라우저나 Node.js 프로젝트에서 `JSON.parse()`나 `JSON.stringify()`를 사용하듯 자연스럽게 APON을 다룰 수 있습니다.

## ✨ 핵심 기능

*   **`APON.parse(text)`**: APON 형식의 문자열을 표준 JavaScript 객체로 변환합니다. 중첩 객체, 배열, 주석, 여러 줄 텍스트 등 APON의 모든 문법을 정확하게 해석합니다.
*   **`APON.stringify(object)`**: JavaScript 객체를 깔끔하고 읽기 쉬운 APON 문자열로 변환합니다. 들여쓰기와 따옴표 처리는 라이브러리가 알아서 처리해 줍니다.
*   **무의존성 (Zero-Dependency)**: 외부 라이브러리 없이 순수 JavaScript로만 작성되어, 프로젝트에 부담을 주지 않고 가볍게 추가할 수 있습니다.
*   **다양한 환경 지원**: 최신 웹 브라우저와 Node.js 환경 모두에서 완벽하게 동작합니다.

## 🚀 시작하기

npm을 통해 지금 바로 `apon.js`를 설치할 수 있습니다.

```bash
npm install apon
```

### 간단한 사용 예제

```javascript
const APON = require('apon');

// 1. APON 문자열 파싱하기
const aponText = `
  # 애플리케이션 설정
  appName: APON.js Demo
  version: 1.0.0
  debugMode: true
`;
const config = APON.parse(aponText);

console.log(config.appName); // "APON.js Demo"

// 2. JavaScript 객체를 APON 문자열로 변환하기
const dbConfig = {
  database: {
    host: "localhost",
    port: 5432,
    users: ["admin", "readonly"]
  }
};
const newAponText = APON.stringify(dbConfig);

console.log(newAponText);
/*
database: {
  host: localhost
  port: 5432
  users: [
    admin
    readonly
  ]
}
*/
```

## 🌐 라이브 데모

말로만 듣는 것보다 직접 경험해보는 것이 가장 좋겠죠? 아래 링크에서 `apon.js`의 모든 기능을 즉시 테스트해볼 수 있습니다.

**[APON.js 인터랙티브 데모 바로가기](https://aspectran.github.io/apon.js/)**

---

* **GitHub 저장소**: [https://github.com/aspectran/apon.js](https://github.com/aspectran/apon.js)
