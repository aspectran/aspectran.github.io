---
layout: page
format: plate article
subheadline: Aspectran Parameter Object Notation
title:  XML을 APON으로 변환 Sample
teaser: |
  Aspectran은 내부적으로 XML을 APON으로 변환 또는 APON을 XML로 변환해서 사용하는 기능을 가지고 있습니다.
  반복적으로 XML 데이터를 로딩하는 부분을 APON으로 교체하면 서버의 부하를 줄이고, 개발시간을 단축할 수 있습니다.
breadcrumb: true
comments: true
categories:
  - apon
tags:
  - apon
published: true
---

예제로 사용되는 getting-started.xml 파일을 APON 파일로 변환합니다.

### getting-started.xml

{% highlight xml  %}
<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE aspectran PUBLIC "-//aspectran.com//DTD Aspectran 1.0//EN"
                           "http://aspectran.github.io/dtd/aspectran-1.0.dtd">

<aspectran>

    <description>
        Aspectran Tutorial 작성을 위한 Aspectran Configuration입니다.
    </description>

    <!-- 기본 설정 -->
    <settings>
        <setting name="transletNamePattern" value="/example/*"/>
    </settings>

    <bean id="*" class="org.apache.ibatis.exceptions.*Exception" scope="singleton">
        <filter class="com.aspectran.example.common.UserClassScanFilter"/>
    </bean>

    <bean id="*" mask="com.aspectran.example.**.*" class="com.aspectran.example.**.*Action" scope="singleton">
        <description>
            com.aspectran.eaxmple 패키지 하위의 모든 경로에서 클래스 이름이 "Action"으로 끝나는 클래스를 모두 찾아서 Bean으로 등록합니다.
            만약 com.aspectran.example.sample.SampleAction 클래스가 검색되었다면 Mask 패턴 "com.aspectran.example.**.*"에 의해
            최종적으로 Bean ID는 "sample.SampleAction"이 됩니다.
        </description>
        <filter>
            exclude: [
                "com.aspectran.example.common.**.*"
                "com.aspectran.example.sample.**.*"
            ]
        </filter>
    </bean>

    <bean id="advice.*" mask="com.aspectran.example.**.*" class="com.aspectran.example.**.*Advice" scope="singleton">
        <description>
            com.aspectran.eaxmple 패키지 하위의 모든 경로에서 클래스 이름이 "Advice"으로 끝나는 클래스를 모두 찾아서 ID가 "advice."으로 시작하는 Bean으로 등록합니다.
            만약 com.aspectran.example.sample.SampleAction 클래스가 검색되었다면 Mask 패턴 "com.aspectran.example.**.*"에 의해
            최종적으로 Bean ID는 "advice.sample.SampleAction"이 됩니다.
        </description>
        <filter class="com.aspectran.example.common.UserClassScanFilter"/>
    </bean>

    <bean id="sampleBean" class="com.aspectran.example.sample.SampleBean" scope="singleton"/>

    <bean id="multipartRequestWrapperResolver" class="com.aspectran.support.http.multipart.MultipartRequestWrapperResolver" scope="singleton">
        <description>
            multipart/form-data request를 처리하기 위해서 반드시 지정해야 합니다.
        </description>
        <properties>
            <item name="maxRequestSize" value="10M"/>
            <item name="tempDirectoryPath" value="/d:/temp"/>
            <item name="allowedFileExtensions" value=""/>
            <item name="deniedFileExtensions" value=""/>
        </properties>
    </bean>

    <bean id="jspViewDispatcher" class="com.aspectran.web.view.JspViewDispatcher" scope="singleton">
        <description>
            Aspectran의 Translet이 처리한 결과값을 화면에 표현하기 위해 JSP를 이용합니다.
        </description>
        <properties>
            <item name="templateFilePrefix">/WEB-INF/jsp/</item>
            <item name="templateFileSuffix">.jsp</item>
        </properties>
    </bean>

    <aspect id="defaultRequestRule">
        <description>
            요청 정보를 분석하는 단계에서 사용할 기본 환경 변수를 정의합니다.
            multipart/form-data request를 처리하기 위해 multipartRequestWrapperResolver를 지정합니다.
        </description>
        <joinpoint scope="request"/>
        <settings>
            <setting name="characterEncoding" value="utf-8"/>
            <setting name="multipartRequestWrapperResolver" value="multipartRequestWrapperResolver"/>
        </settings>
    </aspect>

    <aspect id="defaultResponseRule">
        <description>
            요청에 대해 응답하는 단계에서 사용할 기본 환경 변수를 정의합니다.
            기본 viewDispatcher를 지정합니다.
        </description>
        <joinpoint scope="response"/>
        <settings>
            <setting name="characterEncoding" value="utf-8"/>
            <setting name="defaultContentType" value="text/html"/>
            <setting name="viewDispatcher" value="jspViewDispatcher"/>
        </settings>
    </aspect>

    <aspect id="defaultExceptionRule">
        <description>
            Translet의 이름이 "/example"로 시작하는 Translet을 실행하는 중에 발생하는 에러 처리 규칙을 정의합니다.
        </description>
        <joinpoint scope="translet">
            <pointcut>
                target: {
                    translet: "/example/*"
                }
            </pointcut>
        </joinpoint>
        <exception>
            <description>
                에러요인과 응답 컨텐츠의 형식에 따라 처리방식을 다르게 정할 수 있습니다.
                exceptionType을 지정하지 않으면 모든 exception에 반응합니다.
            </description>
            <responseByContentType exceptionType="java.lang.reflect.InvocationTargetException">
                <transform type="transform/xml" contentType="text/xml">
                    <echo id="result">
                        <item type="map">
                            <value name="errorCode">E0001</value>
                            <value name="message">error occured.</value>
                        </item>
                    </echo>
                </transform>
                <transform type="transform/json" contentType="application/json">
                    <echo id="result">
                        <item type="map">
                            <value name="errorCode">E0001</value>
                            <value name="message">error occured.</value>
                        </item>
                    </echo>
                </transform>
            </responseByContentType>
        </exception>
    </aspect>

    <aspect id="helloWorldAdvice">
        <description>
            요청 URI가 "/example/"로 시작하고,
            helloworld.HelloWorldAction 빈에서 echo, helloWorld, counting 메쏘드 호출 전 후로 환영인사와 작별인사를 건넵니다.
        </description>
        <joinpoint scope="translet">
            <pointcut>
                target: {
                    +: "/example/**/*@helloworld.HelloWorldAction^echo|helloWorld|counting"
                }
            </pointcut>
        </joinpoint>
        <advice bean="advice.helloworld.HelloWorldAdvice">
            <before>
                <action method="welcome"/>
            </before>
            <after>
                <action method="goodbye"/>
            </after>
        </advice>
    </aspect>

    <aspect id="checkCountRangeAdvice">
        <description>
            요청 URI가 "/example/counting"이고,
            요청 헤더 분석을 완료한 시점에 advice.helloworld.HelloWorldAdvice 빈의 checkCountRange 메쏘드가 실행됩니다.
            checkCountRange 메쏘드는 카운팅할 숫자의 범위가 적합한지 검사합니다.
            만약 적합하지 않을 경우 안전한 값으로 변경합니다.
        </description>
        <joinpoint scope="request">
            <pointcut>
                target: {
                    +: "/example/counting"
                }
            </pointcut>
        </joinpoint>
        <advice bean="advice.helloworld.HelloWorldAdvice">
            <after>
                <action method="checkCountRange"/>
            </after>
        </advice>
    </aspect>

    <translet name="echo">
        <description>
            "Hello, World."라는 문구를 텍스트 형식의 컨텐츠로 응답합니다.
            특정 Action을 실행하지 않아도 간단한 텍스트 기반의 컨텐츠를 생산할 수 있습니다.
        </description>
        <transform type="transform/text" contentType="text/plain">
            <template>
                Hello, World.
            </template>
        </transform>
    </translet>

    <translet name="helloWorld">
        <description>
            helloworld.HelloWorldAction 빈에서 helloWorld 메쏘드를 실행해서 "Hello, World."라는 문구를 텍스트 형식의 컨텐츠로 응답합니다.
        </description>
        <transform type="transform/text" contentType="text/plain">
            <action bean="helloworld.HelloWorldAction" method="helloWorld"/>
        </transform>
    </translet>

    <translet name="counting">
        <description>
            시작 값과 마지막 값을 파라메터로 받아서 숫자를 출력하는 Translet입니다.
            request 영역의 attribute가 생성된 후에 숫자의 범위가 유효한지를 검사하는 checkCountRangeAdvice Aspect가 작동됩니다.
        </description>
        <request>
            <attribute>
                <item name="from"/>
                <item name="to"/>
            </attribute>
        </request>
        <content>
            <action id="count1" bean="helloworld.HelloWorldAction" method="counting">
                <arguments>
                    <item valueType="int">@{from}</item>
                    <item valueType="int">@{to}</item>
                </arguments>
            </action>
        </content>
        <response>
            <transform type="transform/xml"/>
        </response>
    </translet>

    <translet name="*" path="/WEB-INF/jsp/**/*.jsp">
        <description>
            '/WEB-INF/jsp/' 디렉토리 하위 경로에서 모든 JSP 파일을 찾아서 Translet 등록을 자동으로 합니다.
            viewDispatcher는 defaultResponseRule Aspect에서 지정한 jspViewDispatcher를 사용합니다.
            검색된 jsp 파일의 경로는 template 요소의 file 속성 값으로 지정됩니다.
        </description>
        <dispatch>
            <template/>
        </dispatch>
    </translet>

    <!-- RESTful 방식의 Translet을 불러들입니다. -->
    <import file="/WEB-INF/aspectran/config/restful-translets.xml"/>

    <!-- 스케쥴러 환경설정을 불러들입니다. -->
    <import file="/WEB-INF/aspectran/config/example-scheduler.xml"/>

</aspectran>
{% endhighlight %}

### getting-started.xml.apon

{% highlight text  %}
# C:\Projects\topframe\ADE\workspace\aspectran-examples\src\main\webapp\WEB-INF\aspectran\config\getting-started.xml.apon
aspectran: {
    description: (
        |
        |        Aspectran Tutorial 작성을 위한 Aspectran Configuration입니다.
        |    
    )
    setting: {
        transletNamePattern: "/example/*"
    }
    aspect: {
        description: (
            |
            |            요청 정보를 분석하는 단계에서 사용할 기본 환경 변수를 정의합니다.
            |            multipart/form-data request를 처리하기 위해 multipartRequestWrapperResolver를 지정합니다.
            |        
        )
        id: "defaultRequestRule"
        for: "translet"
        joinpoint: {
            scope: "request"
        }
        setting: {
            characterEncoding: "utf-8"
            multipartRequestWrapperResolver: "multipartRequestWrapperResolver"
        }
    }
    aspect: {
        description: (
            |
            |            요청에 대해 응답하는 단계에서 사용할 기본 환경 변수를 정의합니다.
            |            기본 viewDispatcher를 지정합니다.
            |        
        )
        id: "defaultResponseRule"
        for: "translet"
        joinpoint: {
            scope: "response"
        }
        setting: {
            viewDispatcher: "jspViewDispatcher"
            characterEncoding: "utf-8"
            defaultContentType: "text/html"
        }
    }
    aspect: {
        description: (
            |
            |            Translet의 이름이 "/example"로 시작하는 Translet을 실행하는 중에 발생하는 에러 처리 규칙을 정의합니다.
            |        
        )
        id: "defaultExceptionRule"
        for: "translet"
        joinpoint: {
            scope: "translet"
            pointcut: {
                target: {
                    translet: "/example/*"
                }
            }
        }
        exceptionRaised: {
            description: (
                |
                |                에러요인과 응답 컨텐츠의 형식에 따라 처리방식을 다르게 정할 수 있습니다.
                |                exceptionType을 지정하지 않으면 모든 exception에 반응합니다.
                |            
            )
            responseByContentType: {
                exceptionType: "java.lang.reflect.InvocationTargetException"
                transform: {
                    type: "transform/xml"
                    contentType: "text/xml"
                    action: {
                        id: "result"
                        echo: {
                            item: {
                                type: "map"
                                value: {
                                    errorCode: "E0001"
                                    message: "error occured."
                                }
                            }
                        }
                    }
                }
                transform: {
                    type: "transform/json"
                    contentType: "application/json"
                    action: {
                        id: "result"
                        echo: {
                            item: {
                                type: "map"
                                value: {
                                    errorCode: "E0001"
                                    message: "error occured."
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    aspect: {
        description: (
            |
            |            요청 URI가 "/example/"로 시작하고,
            |            helloworld.HelloWorldAction 빈에서 echo, helloWorld, counting 메쏘드 호출 전 후로 환영인사와 작별인사를 건넵니다.
            |        
        )
        id: "helloWorldAdvice"
        for: "translet"
        joinpoint: {
            scope: "translet"
            pointcut: {
                target: {
                    +: "/example/**/*@helloworld.HelloWorldAction^echo|helloWorld|counting"
                }
            }
        }
        advice: {
            bean: "advice.helloworld.HelloWorldAdvice"
            before: {
                action: {
                    method: "welcome"
                }
            }
            after: {
                action: {
                    method: "goodbye"
                }
            }
        }
    }
    aspect: {
        description: (
            |
            |            요청 URI가 "/example/counting"이고,
            |            요청 헤더 분석을 완료한 시점에 advice.helloworld.HelloWorldAdvice 빈의 checkCountRange 메쏘드가 실행됩니다.
            |            checkCountRange 메쏘드는 카운팅할 숫자의 범위가 적합한지 검사합니다.
            |            만약 적합하지 않을 경우 안전한 값으로 변경합니다.
            |        
        )
        id: "checkCountRangeAdvice"
        for: "translet"
        joinpoint: {
            scope: "request"
            pointcut: {
                target: {
                    +: "/example/counting"
                }
            }
        }
        advice: {
            bean: "advice.helloworld.HelloWorldAdvice"
            after: {
                action: {
                    method: "checkCountRange"
                }
            }
        }
    }
    bean: {
        id: "*"
        class: "org.apache.ibatis.exceptions.*Exception"
        scope: "singleton"
        filter: {
            class: "com.aspectran.example.common.UserClassScanFilter"
        }
    }
    bean: {
        description: (
            |
            |            com.aspectran.eaxmple 패키지 하위의 모든 경로에서 클래스 이름이 "Action"으로 끝나는 클래스를 모두 찾아서 Bean으로 등록합니다.
            |            만약 com.aspectran.example.sample.SampleAction 클래스가 검색되었다면 Mask 패턴 "com.aspectran.example.**.*"에 의해
            |            최종적으로 Bean ID는 "sample.SampleAction"이 됩니다.
            |        
        )
        id: "*"
        mask: "com.aspectran.example.**.*"
        class: "com.aspectran.example.**.*Action"
        scope: "singleton"
        filter: {
            exclude: [
                "com.aspectran.example.common.**.*"
                "com.aspectran.example.sample.**.*"
            ]
        }
    }
    bean: {
        description: (
            |
            |            com.aspectran.eaxmple 패키지 하위의 모든 경로에서 클래스 이름이 "Advice"으로 끝나는 클래스를 모두 찾아서 ID가 "advice."으로 시작하는 Bean으로 등록합니다.
            |            만약 com.aspectran.example.sample.SampleAction 클래스가 검색되었다면 Mask 패턴 "com.aspectran.example.**.*"에 의해
            |            최종적으로 Bean ID는 "advice.sample.SampleAction"이 됩니다.
            |        
        )
        id: "advice.*"
        mask: "com.aspectran.example.**.*"
        class: "com.aspectran.example.**.*Advice"
        scope: "singleton"
        filter: {
            class: "com.aspectran.example.common.UserClassScanFilter"
        }
    }
    bean: {
        id: "sampleBean"
        class: "com.aspectran.example.sample.SampleBean"
        scope: "singleton"
    }
    bean: {
        description: (
            |
            |            multipart/form-data request를 처리하기 위해서 반드시 지정해야 합니다.
            |        
        )
        id: "multipartRequestWrapperResolver"
        class: "com.aspectran.support.http.multipart.MultipartRequestWrapperResolver"
        scope: "singleton"
        properties: {
            item: {
                name: "maxRequestSize"
                value: "10M"
            }
            item: {
                name: "tempDirectoryPath"
                value: "/d:/temp"
            }
            item: {
                name: "allowedFileExtensions"
            }
            item: {
                name: "deniedFileExtensions"
            }
        }
    }
    bean: {
        description: (
            |
            |            Aspectran의 Translet이 처리한 결과값을 화면에 표현하기 위해 JSP를 이용합니다.
            |        
        )
        id: "jspViewDispatcher"
        class: "com.aspectran.web.view.JspViewDispatcher"
        scope: "singleton"
        properties: {
            item: {
                name: "templateFilePrefix"
                value: "/WEB-INF/jsp/"
            }
            item: {
                name: "templateFileSuffix"
                value: ".jsp"
            }
        }
    }
    translet: {
        description: (
            |
            |            "Hello, World."라는 문구를 텍스트 형식의 컨텐츠로 응답합니다.
            |            특정 Action을 실행하지 않아도 간단한 텍스트 기반의 컨텐츠를 생산할 수 있습니다.
            |        
        )
        name: "echo"
        transform: {
            type: "transform/text"
            contentType: "text/plain"
            template: {
                content: (
                    |
                    |                Hello, World.
                    |            
                )
            }
        }
    }
    translet: {
        description: (
            |
            |            helloworld.HelloWorldAction 빈에서 helloWorld 메쏘드를 실행해서 "Hello, World."라는 문구를 텍스트 형식의 컨텐츠로 응답합니다.
            |        
        )
        name: "helloWorld"
        transform: {
            type: "transform/text"
            contentType: "text/plain"
            action: {
                bean: "helloworld.HelloWorldAction"
                method: "helloWorld"
            }
        }
    }
    translet: {
        description: (
            |
            |            시작 값과 마지막 값을 파라메터로 받아서 숫자를 출력하는 Translet입니다.
            |            request 영역의 attribute가 생성된 후에 숫자의 범위가 유효한지를 검사하는 checkCountRangeAdvice Aspect가 작동됩니다.
            |        
        )
        name: "counting"
        request: {
            attribute: {
                item: {
                    name: "from"
                }
                item: {
                    name: "to"
                }
            }
        }
        content: {
            action: {
                id: "count1"
                bean: "helloworld.HelloWorldAction"
                method: "counting"
                argument: {
                    item: {
                        value: "@{from}"
                        valueType: "int"
                    }
                    item: {
                        value: "@{to}"
                        valueType: "int"
                    }
                }
            }
        }
        response: {
            transform: {
                type: "transform/xml"
                contentType: "text/xml"
            }
        }
    }
    translet: {
        description: (
            |
            |            '/WEB-INF/jsp/' 디렉토리 하위 경로에서 모든 JSP 파일을 찾아서 Translet 등록을 자동으로 합니다.
            |            viewDispatcher는 defaultResponseRule Aspect에서 지정한 jspViewDispatcher를 사용합니다.
            |            검색된 jsp 파일의 경로는 template 요소의 file 속성 값으로 지정됩니다.
            |        
        )
        name: "*"
        path: "/WEB-INF/jsp/**/*.jsp"
        dispatch: {
            template: {
            }
        }
    }
    import: {
        file: "/WEB-INF/aspectran/config/restful-translets.xml"
    }
    import: {
        file: "/WEB-INF/aspectran/config/example-scheduler.xml"
    }
}
{% endhighlight %}
