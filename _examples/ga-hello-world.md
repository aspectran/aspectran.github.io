---
layout: example
format: article
title: "Aspectran - Hello World Example"
subheadline: "Running the \"Hello World\" application"
teaser: "Aspectran으로 만드는 가장 간단한 Hello World 프로그램에 대해 소개합니다."
article_heading: true
breadcrumb: true
image:
  thumb: "examples/ga-hello-world.png"
download:
- label: "ga-hello-world"
  url: https://github.com/aspectran-guides/ga-hello-world
---

## Aspectran으로 만드는 가장 간단한 Hello World 프로그램

### 설정 구성 파일 작성

"Hello, World!" 문자열을 출력하는 가장 간단한 설정 구성은 다음과 같이 작성될 수 있습니다.   
자바 소스 코드를 작성하지 않고 "Hello, World!" 문자열만 출력하는 Translet을 한 개만 정의했습니다.

{% highlight xml %}
<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran Configuration 2.0//EN"
    "http://aspectran.github.io/dtd/aspectran-2.0.dtd">

<aspectran>

    <translet name="helloWorld">
        <transform type="transform/text" contentType="text/plain">
            <template>Hello, World!</template>
        </transform>
    </translet>

</aspectran>
{% endhighlight xml %}

### 실행화면

위 설정 구성으로 콘솔 환경에서 실행하면 다음과 같은 화면을 볼 수 있습니다.
![실행 화면]({{ site.baseurl}}/images/examples/ga-hello-world.png)

### 프로젝트 내려받기

다음 경로에서 프로젝트 내려받을 수 있습니다.
{% include label-link-box label="ga-hello-world" href="https://github.com/aspectran-guides/ga-hello-world" %}

### 실행 방법

Windows, Unix/Linux 및 Mac OS의 콘솔 환경에서 실행이 가능합니다.

1. ga-hello-world/app 경로에서 run.sh 또는 run.bat 파일을 실행하세요.
2. 실행이 되면 Aspectran> 프롬프트가 나옵니다.
3. 프롬프트에서 명령어 "helloWorld"를 입력하면 "Hello, World!" 문자열이 출력됩니다.
4. 명령어 "quit"를 입력하면 프로그램을 종료할 수 있습니다.

> 실행이 안 될 경우 다음 2가지 사항에 대해 점검해 보세요.  
> - java 명령어를 실행할 수 있도록 환경변수가 설정되어 있는지 확인하세요.  
> - Aspectran은 Java 8 이상을 필요로 합니다.
