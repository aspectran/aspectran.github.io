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
asciinema: 219202
---

## Getting Started

There are two ways to print the string "Hello, World!".

1. Prints out the string "Hello, World!" by written Java code
2. Prints out the string "Hello, World!" without writing Java code

This section describes how to output the "Hello, World!" without writing Java code.

## Configuration Settings

The simplest configuration for outputting the string "Hello World" can be written as:

[***gs-hello-world/app/config/app-config.xml***](https://github.com/aspectran/gs-hello-world/blob/master/app/config/app-config.xml)

{% highlight xml %}
<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran Configuration 6.0//EN"
        "http://aspectran.github.io/dtd/aspectran-6.dtd">
<aspectran>

    <description style="apon">
        |
        |   {{bold}}--- The simplest Hello World application created with Aspectran ---{{bold:off}}
        |
        |{{underline}}Commands that can run examples:{{underline:off}}
        |   {{green}}hello{{fg:reset}} - "Hello, World!" will be printed on your console.
        |   {{green}}hello2{{fg:reset}} - "Hello, World!" with ANSI escape codes will be printed on your console.
        |
    </description>

    <translet name="hello">
        <description style="apon">
            |
            |   "Hello, World!" will be printed on your console.
        </description>
        <transform type="transform/text">
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
            |   "Hello, World!" with ANSI escape codes will be printed
            |   on your console.
        </description>
        <transform type="transform/text">
            <template style="apon">
                |
                |   {{bg:green}}                         {{reset}}
                |   {{bg:green}}   {{magenta,bg:white}}                   {{bg:blue}}   {{reset}}
                |   {{bg:green}}   {{RED,bg:white}}   Hello, World!   {{bg:blue}}   {{reset}}
                |   {{bg:green}}   {{magenta,bg:white}}                   {{bg:blue}}   {{reset}}
                |   {{magenta,bg:blue}}                         {{reset}}
                |
            </template>
        </transform>
    </translet>

</aspectran>
{% endhighlight xml %}

> "hello"라는 이름을 가진 `translet` 요소가 정의되어 있는 것을 볼 수 있습니다.  
> `translet` 요소는 텍스트 형식으로 변환하는 역할을 하는 것으로 보이는 `transform` 요소를 포함하고 있습니다.  
> `transform` 안에 `template` 요소는 "Hello, World!" 문자열을 가지고 있습니다.

## How To Run

우리는 "hello" 또는 "hello2"라는 이름을 가진 `translet`을 실행해야 합니다.

*Aspectran*은 다음과 같은 구동환경을 지원합니다.
* 콘솔 환경에서 Java 어플리케이션으로 실행
* 웹 컨테이너 안에서 서블릿으로 실행
* 다른 Java 어플리케이션에 내장되어 실행

여기서는 콘솔 환경에서 *Aspectran Shell*을 통하여 실행해 보겠습니다.

먼저 다음 링크를 통하여 ZIP 파일을 내려받은 후 적당한 경로에 압축을 풀어 주세요.
{% include label-link-box label="Download ZIP" href="https://github.com/aspectran/gs-hello-world/archive/master.zip" %}

본 Hello World 어플리케이션은 Windows, Unix/Linux 및 Mac OS의 콘솔 환경에서 실행이 가능합니다.  
콘솔을 열고 다음 절차를 수행하세요.

1. `gs-hello-world-master/app/bin` 경로로 이동하세요.
2. `shell.sh`를 실행하세요. (Windows 환경에서는 `shell.bat`를 실행하세요.)
3. 정상적으로 실행이 되면 `gs-hello-world>` 프롬프트가 나옵니다.
4. 프롬프트에서 명령어 `hello` 또는 `hello2`를 입력하면 "Hello, World!" 문자열이 출력됩니다.
5. 명령어 `quit`를 입력하면 프로그램을 종료할 수 있습니다.

> 실행이 안 될 경우 다음 두 가지 사항에 대해 점검해 보세요.  
> - java 명령어를 실행할 수 있도록 환경변수가 설정되어 있는지 확인하세요.  
> - Aspectran은 Java 8 이상을 필요로 합니다.
