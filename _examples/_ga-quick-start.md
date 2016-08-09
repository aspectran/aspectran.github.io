---
layout: example
title: "Aspectran Hello World Example"
subheadline: "Running the \"Hello World\" application"
teaser: "\"Hello, World!\" 문자열을 출력하는 웹 응용프로그램의 예제 소스 코드와 실행 결과 화면을 직접 보실 수 있습니다."
article_heading: true
breadcrumb: true
image:
  thumb: "examples/ga-quick-start.png"
download:
- label: "ga-quick-start"
  url: https://github.com/aspectran-guides/ga-quick-start
---

다음 링크는 "Hello, World!" 문자열을 출력하는 웹 응용프로그램의 설정 파일입니다.
"Hello, World!" 문자열을 출력하는 다양한 방식을 설명하기 위해 다소 긴 내용으로 작성이 되었습니다.
{% include label-link-box label="root-configuration.xml" href="https://github.com/aspectran-guides/ga-quick-start/blob/master/src/main/webapp/WEB-INF/aspectran/config/root-configuration.xml" %}

반면 "Hello, World!" 문자열을 출력하는 가장 단순한 설정 파일은 다음과 같이 작성될 수 있습니다.
자바 소스 코드를 작성할 필요가 없습니다.
{% highlight xml %}
<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran Configuration 2.0//EN"
    "http://aspectran.github.io/dtd/aspectran-2.0.dtd">

<aspectran>

    <translet name="/simple/helloWorld">
        <transform type="transform/text" contentType="text/plain">
            <template>Hello, World!</template>
        </transform>
    </translet>

</aspectran>
{% endhighlight xml %}

지금부터 3가지 방식으로 "Hello, World!" 문자열을 출력하는
