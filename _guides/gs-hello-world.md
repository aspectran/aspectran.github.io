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
asciinema: 198434
---

## Getting Started

There are two ways to print the string "Hello, World!".

1. Output the string "Hello, World!" by written Java code
2. Output the string "Hello, World!" without writing Java code

This section describes how to output the "Hello, World!" without writing Java code.

## Configuration Settings

The simplest configuration for outputting the string "Hello World" can be written as:

[***gs-hello-world-master/app/config/root-config.xml***](https://github.com/aspectran/gs-hello-world/blob/master/app/config/root-config.xml)

{% highlight xml %}
<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran Configuration 5.0//EN"
                           "http://aspectran.github.io/dtd/aspectran-5.dtd">

<aspectran>

    <description style="apon">
        |
        |   {{"{{bold"}}}}--- The simplest Hello World application created with Aspectran ---{{"{{bold:off"}}}}
        |
        |{{"{{underline"}}}}Commands that can run examples:{{"{{underline:off"}}}}
        |   {{"{{green"}}}}hello{{"{{fg:off"}}}} - It prints the phrase "Hello World!" to your console.
        |   {{"{{green"}}}}hello2{{"{{fg:off"}}}} - It prints the phrase "Hello World!" to your console with ANSI escape codes.
        |
    </description>

    <translet name="hello">
        <description style="apon">
            |
            |   The phrase "Hello, World!" will be printed on your console.
            |-----------------------------------------------------------------
        </description>
        <transform type="transform/text" contentType="text/plain">
            <template style="apon">
                |
                |   Hello, World!
                |
            </template>
        </transform>
    </translet>

    <translet name="hello2">
        <description style="apon">
            |
            |   The phrase "Hello, World!" will be printed on your console with ANSI escape codes.
            |----------------------------------------------------------------------------------------
        </description>
        <transform type="transform/text" contentType="text/plain">
            <template style="apon">
                |
                |   {{"{{bg:green"}}}}                         {{"{{off"}}}}
                |   {{"{{bg:green"}}}}   {{"{{magenta,bg:white"}}}}                   {{"{{bg:blue"}}}}   {{"{{off"}}}}
                |   {{"{{bg:green"}}}}   {{"{{RED,bg:white"}}}}   Hello, World!   {{"{{bg:blue"}}}}   {{"{{off"}}}}
                |   {{"{{bg:green"}}}}   {{"{{magenta,bg:white"}}}}                   {{"{{bg:blue"}}}}   {{"{{off"}}}}
                |   {{"{{magenta,bg:blue"}}}}                         {{"{{off"}}}}
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

## How To Run

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
