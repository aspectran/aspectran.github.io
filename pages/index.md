---
#
# Use the widgets beneath and the content will be
# inserted automagically in the webpage. To make
# this work, you have to use › layout: frontpage
#
layout: frontpage
format: frontpage
header:
  slide_images:
    - header_examples.jpg
    - header_documentation.jpg
    - header_modules.jpg
    - header_gettingstarted.jpg
    - header_blog.jpg
    - header_search.jpg
    - header_contact.jpg
widget1:
  title: Aspectran은 엔터프라이즈급 자바 웹 응용 프로그램을 구축하기 위한 가볍고 확장 가능한 프레임워크입니다.
  url: /info/
  text: |
    POJO 방식의 경량 프레임워크<br/>
    제어 반전(IoC) 및 의존성 주입(DI) 지원<br/>
    관점 지향 프로그래밍(AOP) 지원<br/>
    RESTful 웹서비스 구축 환경 지원
  image: header_aspectran_thumb.png
widget2:
  title: Getting Started
  url: '/getting-started/'
  image: header_gettingstarted_thumb.jpg
  text: |
    Overview<br/>
    Quick Start Guide<br/>
    Download
widget3:
  title: Documentation
  url: /docs/
  image: header_documentation_thumb.jpg
  text: |
    User Guides<br/>
    Java API Reference<br/>
    FAQs &amp; Changelog
widget4:
  title: Modules
  url: /modules/
  image: header_modules_thumb.jpg
  text: |
    외부 라이브러리 연동에 필요한 자바 소스 패키지와 설정 메타데이터를 모듈 형태로 제공합니다.
permalink: /index.html
---
{% comment %}
<div id="videoModal" class="reveal-modal large" data-reveal="">
  <div class="flex-video widescreen vimeo" style="display: block;">
    <iframe width="1280" height="720" src="" frameborder="0" allowfullscreen></iframe>
  </div>
  <a class="close-reveal-modal">&#215;</a>
</div>
{% endcomment %}
