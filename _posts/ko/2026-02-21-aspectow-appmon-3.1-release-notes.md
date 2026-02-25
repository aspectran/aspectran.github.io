---
subheadline: Releases
title: "Aspectow AppMon 3.1 출시 노트"
categories:
  - news
tags:
  - Release
published: true
---

이번 릴리스는 네이티브 날짜/시간 처리를 통한 데이터베이스 성능 향상, 집계 쿼리 최적화, 그리고 차트 엔진 리팩토링을 통한 프론트엔드 유지보수성 강화에 집중한 업데이트입니다.
<!--more-->

### 🚀 개선 사항

*   **네이티브 날짜/시간 지원**: `datetime` 컬럼 타입을 기존 `varchar(12)`에서 네이티브 날짜 타입(`DATETIME`, `TIMESTAMP`, `DATE`)으로 전환했습니다. Java 모델 또한 `LocalDateTime`을 사용하여 문자열 변환 오버헤드를 제거하고 데이터 정밀도를 높였습니다.
*   **사전 집계(Pre-aggregation) 도입을 통한 성능 극대화**: 시간(`hourly`) 및 일(`daily`) 단위의 요약 테이블을 도입하여 이벤트 카운트를 미리 집계하도록 개선했습니다. 이를 통해 수백만 건의 원본 데이터가 쌓인 환경에서도 복잡한 그룹화 연산 없이 대시보드 차트를 즉각적으로 조회할 수 있습니다.
*   **차트 컴포넌트 독립화**: `DashboardViewer`에서 차트 렌더링 및 관리 로직을 추출하여 별도의 `dashboard-chart.js`로 분리했습니다. 이를 통해 코드의 모듈성을 높이고 데이터 수신과 시각화 간의 역할을 명확히 했습니다.
