---
subheadline: Releases
title:  Aspectran Utils (Legacy) 1.0 정식 출시
categories:
  - news
tags:
  - Release
published: true
---

안녕하세요! Aspectran 프레임워크의 레거시 호환성을 위한 유틸리티 모음, `aspectran-utils-legacy`의 첫 정식 버전인 1.0 출시 소식을 알려드립니다.
<!--more-->

이 모듈은 JDK 1.6부터 최신 JDK 환경에 이르기까지, 다양한 버전의 Java를 사용하는 레거시 시스템과 최신 Aspectran 애플리케이션 서버 간의 원활한 연동을 지원하기 위해 설계되었습니다.

## 주요 특징

- **레거시 시스템 연동 지원**: 구형 시스템과의 API 호출 및 응답 처리를 위한 다양한 유틸리티 클래스를 제공합니다.
- **완벽한 JDK 1.6 호환성**: JDK 1.6 환경에서의 컴파일 및 실행을 보장하여 폭넓은 호환성을 자랑합니다.
- **핵심 유틸리티 포함**: 문자열, 파일, 암호화 등 Aspectran 프레임워크 전반에서 공통적으로 사용되는 핵심 유틸리티 클래스들을 포함하고 있습니다.
- **경량 및 독립성**: 최소한의 의존성으로 설계되어 어떤 프로젝트에도 가볍고 쉽게 추가할 수 있습니다.

## 시작하기

Maven 프로젝트의 `pom.xml`에 다음 의존성을 추가하여 바로 사용을 시작할 수 있습니다.

```xml
<dependency>
    <groupId>com.aspectran</groupId>
    <artifactId>aspectran-utils-legacy</artifactId>
    <version>1.0.0</version>
</dependency>
```

## 상세 가이드

`aspectran-utils-legacy` 모듈을 활용하여 레거시 시스템을 현대적인 Aspectran 애플리케이션과 통합하는 방법에 대한 자세한 내용은 아래의 실용 가이드를 참고해 주세요.

*   **[레거시 시스템과 최신 Aspectran 애플리케이션 서버 연동 가이드](/ko/docs/guides/practical-guide-to-legacy-integration/)**

첫 릴리스에 많은 관심 부탁드립니다. 감사합니다!
