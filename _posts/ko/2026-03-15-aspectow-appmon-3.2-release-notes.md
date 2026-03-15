---
subheadline: Releases
title: "Aspectow AppMon 3.2 출시 노트"
categories:
  - news
tags:
  - Release
published: true
---

이번 릴리스는 PostgreSQL 지원 및 영속성 레이어의 유연성 강화, 차트 데이터의 정확성 확보를 위한 집계 방식 개선, 그리고 프로젝트 정체성 강화를 위한 설정 구조 및 운영 스크립트 전면 개편에 집중한 업데이트입니다.
<!--more-->

### ✨ 새로운 기능

*   **PostgreSQL 지원 및 최적화**: PostgreSQL 환경(예: Supabase)을 위한 표준 스키마(`appmon-schema-postgresql.sql`)를 추가하고, `date_trunc` 및 `ON CONFLICT` 등 PostgreSQL에 최적화된 쿼리를 통해 효율적인 시계열 데이터 처리와 원자적 업서트(Upsert)를 구현했습니다.
*   **영속성 아키텍처 확장성 강화**: `EventCountMapper`를 빈(Bean) 오버라이딩이 가능하도록 리팩토링하여, 핵심 라이브러리 수정 없이도 외부 프로젝트에서 커스텀 영속성 로직을 자유롭게 제공할 수 있도록 개선했습니다.

### 🚀 개선 사항

*   **차트 데이터 집계 정확도 향상**: 일간 집계 테이블(`appmon_event_count_daily`)을 제거하고 모든 차트(일간/월간/연간)가 시간별 데이터를 기반으로 집계되도록 변경했습니다. 또한 사용자 로컬 시간대(`zoneOffset`)를 집계 로직에 적용하여 시간대 경계에 따른 데이터 불일치 문제를 근본적으로 해결했습니다.
*   **설정 구조 및 네이밍 규칙 개편**: 설정 리소스 디렉토리를 `context`에서 `config`로 변경하고, Spring 스타일의 `*-context.xml` 파일명을 `database.xml`, `scheduler.xml` 등 간결한 기능 중심 이름으로 전환하여 Aspectran의 규칙 기반 정체성을 강화했습니다.
*   **운영 스크립트 최적화 및 통합**: `systemctl` 연동을 위한 통합 서비스 관리 스크립트(`service.sh`)를 추가하고 중복된 스크립트를 정리했습니다. 또한 프로세스 관리 로직을 정교화하고 디버그 모드(`--debug`)를 도입하여 일반 실행 시의 콘솔 노이즈를 최소화했습니다.
*   **의존성 라이브러리 업데이트**: 빌드 및 테스트 환경의 안정성을 위해 `maven-resources-plugin`(3.5.0), `maven-surefire-plugin`(3.5.5), `maven-bundle-plugin`(6.0.2) 등 주요 플러그인 버전을 업데이트했습니다.
