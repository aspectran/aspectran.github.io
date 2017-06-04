---
layout: guide
format: plate article
title: Aspectran Hello World Example
subheadline: Getting Started
teaser: Let's create a Hello World application with Aspectran.
outside_heading: true
breadcrumb: true
image:
  thumb: examples/gs-hello-world.png
download:
- label: Repository
  url: https://github.com/aspectran/gs-hello-world
- label: "Download ZIP"
  url: https://github.com/aspectran/gs-hello-world/archive/master.zip
asciinema: 109020
---

## 시작하기

간단하게 "Hello, World!" 문자열을 출력하는 방법은 두 가지가 있습니다.

* Java 코드를 작성해서 "Hello, World!" 문자열을 출력하는 방법
* Java 코드를 작성하지 않고 "Hello, World!" 문자열을 출력하는 방법

여기서는 Java 코드를 작성하지 않고 "Hello, World!" 문자열을 출력하는 방법에 대해 설명합니다.

## 설정 구성

"Hello, World!" 문자열을 출력하는 가장 간단한 설정 구성은 다음과 같이 작성될 수 있습니다.   

[***gs-hello-world-master/app/config/hello-world-config.xml***](https://github.com/aspectran/gs-hello-world/blob/master/app/config/hello-world-config.xml)

{% highlight xml %}
<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran Configuration 4.0//EN"
                           "http://aspectran.github.io/dtd/aspectran-4.dtd">

<aspectran>

    <description style="apon">
        |
        |   --- The simplest Hello World application created with Aspectran ---
        |
        |Built-in commands for this console application:
        |   description on - Display a description of the command.
        |   description off - Do not display the description of the command.
        |   restart - Restart this console application.
        |   quit - Exit from this console application.
        |
        |Commands that can run the examples:
        |   hello - It prints the words "Hello, World!" to the console.
        |
    </description>

    <translet name="hello">
        <description style="apon">
            |
            |   It prints the words "Hello World" to the console.
            |
        </description>
        <transform type="transform/text" contentType="text/plain">
            <template style="apon">
                |
                |   Hello, World!
                |
            </template>
        </transform>
    </translet>

</aspectran>
{% endhighlight xml %}

> "hello"라는 이름을 가진 `translet`이 하나 정의되어 있는 것을 볼 수 있습니다.  
> 그 `translet` 안에는 텍스트 형식으로 변환하는 역할을 할 것으로 보이는 `transform`이 정의되어 있고,  
> `transform` 안에는 "Hello, World!" 문자열을 가진 `template`이 정의되어 있습니다.

우리는 "hello"라는 이름을 가진 `translet`을 실행해야 함을 직감할 수 있습니다.
명령어 "hello"를 실행하면 `translet`은 지정한 형식으로 가공된 데이터를 반환하는 역할을 합니다.

## 실행 방법

위와 같이 작성된 설정 구성을 다음과 같은 실행 환경에서 실행할 수 있습니다.

* 콘솔에서 Java 어플리케이션으로 실행
* 웹 어플리케이션에서 서블릿으로 실행
* 다른 Java 어플리케이션에 내장되어 실행

여기서는 가장 간단한 방법이라고 생각되는 콘솔 환경에서 실행해 보겠습니다.

먼저 다음 링크를 통하여 ZIP 파일을 내려받은 후 적당한 경로에 압축을 풀어 주세요.
{% include label-link-box label="Download ZIP" href="https://github.com/aspectran/gs-hello-world/archive/master.zip" %}

본 Hello World 어플리케이션은 Windows, Unix/Linux 및 Mac OS의 콘솔 환경에서 실행이 가능합니다.  
콘솔을 열고 다음 절차를 수행하세요.

1. `gs-hello-world-master/app` 경로로 이동하세요.
2. `run.sh` 파일을 실행하세요. (Windows 환경에서는 `run.bat` 파일을 실행하세요.)
3. 정상적으로 실행이 되면 `gs-hello-world>` 프롬프트가 나옵니다.
4. 프롬프트에서 명령어 `hello`를 입력하면 "Hello, World!" 문자열이 출력됩니다.
5. 명령어 `quit`를 입력하면 프로그램을 종료할 수 있습니다.

> 실행이 안 될 경우 다음 두 가지 사항에 대해 점검해 보세요.  
> - java 명령어를 실행할 수 있도록 환경변수가 설정되어 있는지 확인하세요.  
> - Aspectran은 Java 8 이상을 필요로 합니다.
