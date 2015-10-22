---
#
# Use the widgets beneath and the content will be
# inserted automagically in the webpage. To make
# this work, you have to use › layout: frontpage
#
layout: frontpage
header:
  image_slide:
    - header_gettingstarted.jpg
    - header_documentation.jpg
    - header_downloads.jpg
    - header_blog.jpg
    - header_search.jpg
    - header_contact.jpg
widget1:
  title: "About Aspectran"
  url: '/info/'
  text: 'POJO 방식의 경량 프레임워크<br/>제어 반전(IoC) 지원<br/>의존성 주입(DI) 지원<br/>관점 지향 프로그래밍(AOP) 지원<br/>RESTful 웹서비스 구축 환경 지원'
  image: header_aspectran_thumb.png
widget2:
    title: "Getting Started"
    url: '/getting-started/'
    image: header_gettingstarted_thumb.jpg
    text: 'Quick Start<br/>Aspectran Tutorial<br/>Running the Examples'
widget3:
    title: "Documentation"
    url: '/documentation/'
    image: header_documentation_thumb.jpg
    text: 'Developers Guides<br/>Java API Docs<br/>FAQs<br/>Changelog &amp; Roadmap'
widget4:
  title: "Downloads"
  url: '/downloads/'
  image: header_downloads_thumb.jpg
  text: 'Aspectran은 Apache 2.0 License에 의거하여 무료로 제공되는 오픈소스입니다. 소스코드는 <a href="https://github.com/topframe/aspectran">GitHub</a>에서 다운로드 할 수 있습니다.'
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
