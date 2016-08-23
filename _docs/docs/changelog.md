---
layout: page
format: "plate solid"
title: "Changelog"
meta_title: "Aspectran Changelog"
subheadline: "Aspectran Changelog"
teaser: "History and changelog of Aspectran"
comments: true
---

<div class="callout info radius b30">
  <p>Aspectran의 주요 변경 이력에 대한 정보를 제공합니다.<br/>
  소스 코드에 대한 상세한 변경이력은 GitHub에서 볼 수 있습니다.</p>
  {% include label-link-box label="Aspectran Releases" href="https://github.com/aspectran/aspectran/releases" %}
</div>

2016.8.23. // Version 2.4.1
: * Optimized the Aspectran service control function.
  * Some bugs fixes and code improvements.

2016.8.15. // Version 2.4.0
: New Features
: * Can be added the custom parameters into `<request>` element.
  * Added support for JSONP callbacks.
  * Added support for HTTP Methods overrides.
    - X-Method-Override (Aspectran)
    - X-HTTP-Method (Microsoft)
    - X-HTTP-Method-Override (Google/GData)
    - X-METHOD-OVERRIDE (IBM)

: Changed the element names in XML for configuration files.
: * property ==&gt; properties
  * parameter ==&gt; parameters
  * attribute ==&gt; attributes
  * argument ==&gt; arguments

2016.8.11. // Version 2.3.1
: * Bug fix: The gzip content encoding error has been fixed.

2016.7.29. // Version 2.3.0
: * Improved REST support.
  * Renamed some classes.
  * Many bugfixes and optimizations.
  * Clean up source code and update comments in java code.

2016.7.3. // Version 2.2.1
: * Bug Fixes and Minor Improvements

2016.5.9. // Version 2.2.0
: * Added support for Environment Variables.
  * Improved the Aspectran Profiles.

2016.5.2. // Version 2.1.0
: New Features
: * Added support for configuration profiles.
  * Added new annotations @Profile and @Value.
: Profiles allow for environment-specific bean definitions.  
  Activated with:
: * -Daspectran.profiles.active=dev
  * context.activeProfiles in web.xml
  * @Profile("dev") with @Configuration

2016.3.20. // Version 2.0.0
: Aspectran 2 is designed to run on Java 8 and later.  
  New Features
: * Added support for Annotation-based metadata configuration.
  * Added support for Template engines. (FreeMarker, Pebble)
  * Added support for Internationalization.
  * Added support for Run service as a console application.

2015.12.29. // Version 1.5.0
: * Added support for Session Joinpoint-scope.  
    Advice Action can be executed at the session start and end.
  * Recognizes the APON Object when converting ProcessResult object to JSON or XML string.
  * Updated travis settings
  * Deleted unnecessary files.
  * Removed “Project Specific Settings” files.
  * Clean up source code and update comments in java code.
  * Many bugfixes and optimizations.

2015.11.1. // Version 1.4.0
: * Change package structure for integrating external library.
  * Improved the AspectranClassLoader stability.

2015.10.14. // Version 1.3.1
: * Added a method  to obtain an instance of the bean.
  * Modified the bean class auto-scanning feature.
  * Fixed some bugs.

2015.10.8. // Version 1.3.0
: * Added support for the translet auto-scanning feature.

2015.10.3. // Version 1.2.0
: * Added support for Building RESTful Web Services.

2015.9.30. // Version 1.1.0
: * Added supports for Javassist Proxifier and it is becomes the default bean-proxifier.
  * Overall improvements and bug fixes.

2015.9.8. // Version 1.0.1
: * Modified AOP features.
  * Modified Bean Action features.
  * Fixed some inconsistent variable names.

2015.9.1. // Version 1.0.0
: Initial release of Aspectran! 2008년 봄부터 개발을 시작한 이후로 7년 만에 처음으로 정식 버전을 출시했습니다.
