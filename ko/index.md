---
#
# Use the widgets beneath and the content will be
# inserted automagically in the webpage. To make
# this work, you have to use › layout: frontpage
#
lang: ko
layout: frontpage
format: frontpage
widget0:
  title: Aspectran은 엔터프라이즈급 자바 웹 응용 프로그램을 구축하기 위한 가볍고 확장 가능한 프레임워크입니다.
  url: /info/
  text: |
    POJO 방식의 경량 프레임워크<br/>
    제어 반전(IoC) 및 의존성 주입(DI) 지원<br/>
    관점 지향 프로그래밍(AOP) 지원<br/>
    RESTful 웹서비스 구축 환경 지원
  image: header_aspectran_thumb.png
widget1:
  title: Aspectran
  url: '/aspectran/'
  image: header_gettingstarted_thumb.jpg
  text: |
    Aspectran은 고성능 Java 애플리케이션을 구축하기 위한 경량 프레임워크로써, 직관적이고 유연한 개발 환경을 제공합니다. 
widget2:
  title: Aspectow
  url: /aspectow/
  image: header_guides_thumb.jpg
  text: |
    Aspectow는 올인원 웹어플리케이션 서버로써, Aspectran을 기반으로 만들졌습니다. 
widget3:
  title: 사용 가이드
  url: /guides/
  image: header_documentation_thumb.jpg
  text: |
    Aspectran을 배우고 시작하는 데 도움이 되는 몇 가지 관련 문서와 사용 예제를 제공합니다.
widget4:
  title: 프로젝트
  url: /projects/
  image: header_modules_thumb.jpg
  text: |
    Aspectran을 기반으로 유용한 애플리케이션을 개발하고 있습니다.
projects:
  - subheadline: Aspectran 사용의 실제 사례
    title: Log Relayer
    description: Log Relayer는 서버에 기록되는 최신 로그들을 웹 소켓 엔드 포인트를 통해 웹 브라우저로 보낼 수 있으며, 실시간으로 여러 서버의 로그들을 관찰할 수 있는 통합뷰를 제공합니다.
    thumb_img: examples/pr-log-relayer.png
    url: https://log-relayer.aspectran.com
    repo: https://github.com/aspectran/log-relayer
  - subheadline: Aspectran 사용의 실제 사례
    title: Aspectran Demo Site
    description: 이 사이트는 권장 모범 사례에 따라 Aspectran 응용 프로그램을 개발하는 방법을 보여주기 위해 만든 참조 응용 프로그램 모음입니다.
    thumb_img: examples/pr-demo-site.png
    url: https://demo.aspectran.com
    repo: https://github.com/aspectran/demo-app
  - subheadline: Aspectran 사용의 실제 사례
    title: JPetStore Demo
    description: JPetStore는 MyBatis 3, Aspectran 6 위에 구축된 완전한 웹 애플리케이션입니다.
    thumb_img: examples/pr-jpetstore.png
    url: https://jpetstore.aspectran.com
    repo: https://github.com/aspectran/aspectran-jpetstore
  - subheadline: TTS (텍스트 음성 변환)
    title: Skylark Terminal
    description: Skylark은 모든 텍스트를 음성으로 변환하는 텍스트 음성 변환 프로그램입니다.
    thumb_img: examples/pr-skylark.png
    url: https://skylark.aspectran.com
    repo: https://github.com/aspectran/skylark
permalink: /
---
{% comment %}
<div id="videoModal" class="reveal-modal large" data-reveal="">
  <div class="flex-video widescreen vimeo" style="display: block;">
    <iframe width="1280" height="720" src="" frameborder="0" allowfullscreen></iframe>
  </div>
  <a class="close-reveal-modal">&#215;</a>
</div>
{% endcomment %}
