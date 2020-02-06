---
layout: example
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
category: examples
---

## Getting Started

There are two ways to print "Hello, World!".

1. Prints out the string "Hello, World!" by written Java code
2. Prints out the string "Hello, World!" without writing Java code

This section describes how to print "Hello, World" without writing Java code.

## Configuration Settings

The simplest configuration for printing "Hello World!" can be written as:

[***gs-hello-world/app/config/app-config.xml***](https://github.com/aspectran/gs-hello-world/blob/master/app/config/app-config.xml)

```xml
<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran Configuration 6.0//EN"
        "https://aspectran.github.io/dtd/aspectran-6.dtd">
<aspectran>

    <description style="apon">
        |
        |   {{bold}}--- Aspectran Hello World Example ---{{bold:off}}
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
```

> - You can see that the `translet` element with the name "hello" is defined.
> - The `translet` element contains a `transform` element that appears to be responsible for converting to text format.
> - The `template` element in `transform` has the string "Hello, World!".

## How To Run

We need to run `translet` with the name "hello" or "hello2".

*Aspectran* supports the following operating environments.
* Run as a Java application in the console environment
* Run as a servlet inside a web container
* Embedded in other Java applications

Here we will run it through *Aspectran Shell* in the console environment.

First, download the ZIP file through the following link and extract it to the appropriate path.
{% include label-link-box label="Download ZIP" href="https://github.com/aspectran/gs-hello-world/archive/master.zip" %}

This Hello World application can be run in a console environment on Windows, Unix/Linux and Mac OS.  
Open the console and perform the following steps.

1. Go to the path `gs-hello-world-master/app/bin`.
2. Run `shell.sh`. (On Windows, run `shell.bat`.)
3. The `gs-hello-world>` prompt will be displayed if it runs normally.
4. At the prompt, type the command `hello` or` hello2` and the string "Hello, World!" will be displayed.
5. You can quit the program by typing the command `quit`.

> If it does not work, check the following two points.  
> - Make sure the environment variable is set so that the java command can be executed.  
> - Aspectran requires Java 8 or higher.
