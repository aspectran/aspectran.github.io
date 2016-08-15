---
layout: page
sidebar: right
title: "Changelog"
meta_title: "Aspectran Changelog"
subheadline: "Aspectran Changelog"
teaser: "History and changelog of Aspectran"
comments: true
---

<div class="callout info radius b30">
  <p>Aspectran의 주요 변경 이력에 대한 정보를 제공합니다.<br/>
  소스 코드에 대한 상세한 변경이력은 GitHub에서 볼 수 있습니다.</p>
  {% include label-link-box label="GitHub Releases" href="https://github.com/aspectran/aspectran/releases" %}
</div>

2016.8.15. // Version 2.4.0
: New Features
: * Can be added the custom parameters into &lt;request&gt; element.
: Changed the name of some elements in DTD
: * property ==&gt; properties
  * parameter ==&gt; parameters
  * attribute ==&gt; attributes
  * argument ==&gt; arguments

2016.8.11. // Version 2.3.1
: Bug fix: The gzip content encoding error has been fixed.

2016.7.29. // Version 2.3.0
: * Improved REST support.
  * Renamed some classes.
  * Many bugfixes and optimizations.
  * Clean up source code and update comments in java code.

2016.7.3. // Version 2.2.1
: Bug Fixes and Minor Improvements

2016.5.9. // Version 2.2.0
: * Adds support for Environment Variables
  * Aspectran Profiles Improvements

2016.5.2. // Version 2.1.0
: New Features
: * Adds support for configuration profiles
  * Adds Annotation @Profile and @Value
: Profiles allow for environment-specific bean definitions.  
  Activated with:
: * -Daspectran.profiles.active=dev
  * context.activeProfiles in web.xml
  * @Profile("dev") with @Configuration

2016.3.20. // Version 2.0.0
: Aspectran 2 is designed to run on Java 8 and later.  
  New Features
: * Support for Annotation-based metadata configuration.
  * Support for Template engines. (FreeMarker, Pebble)
  * Support for Internationalization.
  * Support for Run service as a console application.

2015.12.29. // Version 1.5.0
: * Adds the session joinpoint-scope.  
    Advice Action can be executed at the session start and end.
  * Recognizes the APON Object when converting ProcessResult object to JSON or XML string.
  * Updated travis settings
  * Deleted unnecessary files.
  * Removed “Project Specific Settings” files.
  * Clean up source code and update comments in java code.
  * Many bugfixes and optimizations.

2015.11.1. // Version 1.4.0
: 외부 라이브러리 연동 정책이 수정됨에 따라 패키지 구조가 변경되었습니다.

2015.10.14. // Version 1.3.1
: Bean을 얻을 수 있는 메쏘드를 추가하고, Bean 자동 스캔 시 Bean ID 부여 규칙을 수정했습니다.

2015.10.8. // Version 1.3.0
: Bean 일괄 등록시에 필터링 기능을 추가하고, Translet을 일괄 등록할 수 있는 기능을 추가했습니다.

2015.10.3. // Version 1.2.0
: RESTful 웹서비스 구축 환경을 지원합니다.

2015.9.30. // Version 1.1.0
: BCI 지원 라이브러리 Javassist를 추가로 도입하고, 기본 Bean Proxifier로 지정하였습니다.

2015.9.8. // Version 1.0.1
: AOP 관련 기능을 대폭 수정했습니다.

2015.9.1. // Version 1.0.0
: Initial release of Aspectran! 2008년 봄부터 개발을 시작한 이후로 7년 만에 처음으로 정식 버전을 출시했습니다.
