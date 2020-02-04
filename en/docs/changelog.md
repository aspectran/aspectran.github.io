---
layout: page
format: plate solid
title: Changelog
meta_title: Aspectran Changelog
subheadline: Aspectran Changelog
teaser: History and changelog of Aspectran
comments: true
breadcrumb: true
permalink: /en/docs/changelog/
---

<div class="callout info radius b30">
  <p>Provides information on Aspectran's major change history.<br/>
  Detailed history of source code changes can be viewed on GitHub.</p>
  {% include label-link-box label="Aspectran Releases" href="https://github.com/aspectran/aspectran/releases" %}
</div>

2017.5.31. // Version 4.1.0
: *There have been a lot of changes in version 4.1.0. We will notify you of the changes as soon as they are finalized.*

2017.4.23. // Version 4.0.0
: *There have been a lot of changes in version 4.0.0. We will notify you of the changes as soon as they are finalized.*

2017.1.31. // Version 3.3.0
: New Features
: - Added the ability to specify exposable `translet` for Web, Console and Scheduler services.

2017.1.31. // Version 3.2.0
: New Features
: - Added ability to create derived AspectranService instances sharing the same context.
  - Added a factory bean to return base path.
: Changes
: - Improved dynamic method invocation
  - Improved ActivityContext initialization
  - Changed the method of creating a bean with factory patterns.
  - Renamed `applicationBasePath` to `basePath`.
  - Renamed class AspectranServiceControllerListener to AspectranServiceLifeCycleListener.
  - Renamed attribute `offerBean` to `factoryBean`, and the `offerMethod` attribute has been removed.
  - The servlet context initialization parameter `defaultServletName` has been moved to AspectranWebConfig.

2016.11.7. // Version 3.1.0
: Changes
: * Improved AOP features

2016.9.26. // Version 3.0.0
: New Features
: * Added support for the ability to run Aspectran inside other applications.
: Changes
: * Significantly improved reliability internally

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
: Changes
: * Changed element names in XML for configuration files.
    - property ==&gt; properties
    - parameter ==&gt; parameters
    - attribute ==&gt; attributes
    - argument ==&gt; arguments

2016.8.11. // Version 2.3.1
: * Bug fix: The gzip content encoding error has been fixed.

2016.7.29. // Version 2.3.0
: * Improved REST support.
  * Renamed some classes.
  * Many bugfixes and optimizations.
  * Source code cleanup and comments updated.

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
  * Added support for the ability to run Aspectran as a standalone application in the console.

2015.12.29. // Version 1.5.0
: * Added support for Session Joinpoint-scope.  
    Advice Action can be executed at the session start and end.
  * Recognizes the APON Object when converting ProcessResult object to JSON or XML string.
  * Updated travis settings.
  * Deleted unnecessary files.
  * Removed “Project Specific Settings” files.
  * Source code cleanup and comments updated.
  * Many bugfixes and optimizations.

2015.11.1. // Version 1.4.0
: * Changed package structure for integrating external library.
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
