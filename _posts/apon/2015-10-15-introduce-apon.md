---
layout: page
format: plate article
subheadline: Aspectran Parameter Object Notation
title:  APON을 소개합니다.
teaser: |
  APON(Aspectran Parameter Object Notation)은 Aspectran 내부에서 매개변수를 손쉽게 Object로 변환하기 위한 용도로 개발되었습니다.
  APON은 JSON(JavaScript Object Notation)을 개량했기 때문에 JSON과 비슷한 표기 형식을 가지고 있고, 사람이 읽고 쓰기에 용이하며,
  구조화된 형식의 데이터 교환을 위한 새로운 표기법입니다.
breadcrumb: true
comments: true
categories:
  - apon
tags:
  - APON
sidebar: toc
published: true
---

## APON의 특징

Aspectran은 XML 문서를 APON 문서로 변환해서 사용하는 기능을 내장하고 있습니다.
APON을 이용하면 대량의 XML 문서를 파싱하는데 드는 비용을 줄일 수 있으며, 정확한 데이터를 주고 받을 수 있습니다.

APON은 다음과 같은 특징을 가지고 있습니다.

* 매개변수가 가지고 있는 값(Value)의 Type을 명시할 수 있습니다. Value Type을 명시하지 않으면 `variable` Type이 기본 Type이 됩니다.
* 여러 개의 Name/Value 쌍 또는 배열로 된 여러 값을 구분하기 위해 `,` (comma) 문자를 사용하지 않고 `\n` (개행 문자)를 사용합니다.
* 문자열 표기를 위한 `string` Value Type 외에 `text` Value Type이 추가되었습니다. 긴 문자열을 표기할 때 `text` Value Type은 가독성을 확연히 향상시켜 줍니다.
* 문자열을 큰따옴표(`"`) 또는 작은따옴표(`'`)로 감싸지 않아도 됩니다.
* 데이터의 구조와 값의 Type을 정의할 수 있기 때문에 정확하고 명확한 데이터 전달이 가능합니다.


## APON의 데이터 표기 규칙

* 매개변수의 이름과 값에 해당하는 Name/Value 쌍을 `Parameter`라고 합니다.
  Name 뒤에 콜론(`:`) 문자를 붙여서 Name과 Value를 구분합니다.
* `Parameter`를 여러 개 모아 놓은 것을 `Parameters`라고 합니다.
* `Parameter`는 Name을 부여받고, Value를 가질 수 있습니다.
  Value의 Type에는 `string`, `text`, `int`, `long`, `float`, `double`, `boolean`, `variable`, `parameters`가 있습니다.
  Value는 `null` 값도 가질 수 있습니다.
* Value의 Type을 명시하기 위해서는 Name과 콜론(`:`) 문자 사이에 Value Type을 `( )`(Round Bracket)으로 감싸서 넣으면 됩니다.  
  ex) param1(long): 1234  
  Value Type은 소문자로 표기해야 합니다.
* `Parameter`의 Value Type이 `parameters`이면 `{ }`(Curly Bracket)으로 감싸서 표기합니다.
  Curly Bracket 내에서 각 `Parameter`를 구분하기 위해 콤마(`,`) 문자가 아닌 개행문자(`\n`)를 사용합니다.
* `Parameter`의 값이 Array 형식이면 `[ ]`(Square Bracket)으로 감싸서 표기합니다.
  Square Bracket 내에서 각 Array 요소를 구분하기 위해 콤마(`,`) 문자가 아닌 개행문자(`\n`)를 사용합니다.
* `Parameter`의 Value Type이 `string`이면 문자열을 큰따옴표(`"`)로 감싸거나, 큰따옴표를 생략할 수도 있습니다.
  큰따옴표로 감싸지 않으면 문자열의 앞뒤에 있는 공백문자는 모두 제거됩니다.
  큰따옴표로 감쌀 경우 큰 따옴표 또는 개행문자를 표현하기 위해 Escape 문자(`\`)를 사용할 수 있습니다.
* `Parameter`의 Value Type이 `text`이면 `( )`(Round Bracket)으로 감싸야 하고, 각 라인의 선두에 파이프 문자(`|`)를 붙여야 합니다.
  라인 수 만큼 파이프 문자(`|`)를 사용하게 되며, 특수 문자를 표현하기 위한 Escape 문자를 전혀 사용하지 않습니다.
* Curly Bracket, Square Bracket, Round Bracket은 모두 Bracket이 시작된 후에 반드시 개행을 해야 하고, Brakcket이 끝난 뒤에도 반드시 개행을 해야 합니다.


## APON의 Value Type

APON의 매개변수(Parameter)는 다음과 같은 Value Type을 가질 수 있습니다.

Value Type  | Java Object Type                        | 사용할 수 있는 값
------------------------------------------------------|-----------------------------------------
string      | java.lang.String                        | Hello, World.
text        | java.lang.String                        | 아래 `text` Value Type 사용 예제 참조
int         | java.lang.Integer                       | 123
long        | java.lang.Long                          | 123L
float       | java.lang.Float                         | 123.0f
double      | java.lang.Double                        | 123.0d
boolean     | java.lang.Boolean                       | true or false
variable    | java.lang.Object                        | 실제 값에 따라 자동으로 Type을 정합니다.
parameters  | com.aspectran.core.util.apon.Parameters | 여러 `Parameter`를 가집니다.
------------------------------------------------------|-----------------------------------------              

### `text` Value Type 사용 예제
{% highlight text  %}
desc: (  
    | 여러 라인으로 구성된 문자열은
    | 괄호로 감싸고 수직문자를 각 라인 앞에 붙입니다.
    | 세 번째 줄입니다.
    | 수직문자가 시작되면 특수문자 사용이 자유로워집니다.
)
{% endhighlight %}


## APON 활용 예제

다음은 Aspectran을 구동하기 위해 필요한 초기화 파라메터입니다.

> `web.xml`에서 초기화 파라메터 `aspectran:config`의 값으로 다음과 같은 긴 문자열을 지정하고 있는데,
> 바로 APON 형식의 문자열입니다.

{% highlight text %}
context: {
    root: /WEB-INF/aspectran/config/getting-started.xml
    encoding: utf-8
    resources: [
        /WEB-INF/aspectran/config
        /WEB-INF/aspectran/classes
        /WEB-INF/aspectran/lib
    ]
    hybridLoad: false
    autoReload: {
        reloadMethod: hard
        observationInterval: 5
        startup: true
    }
}
scheduler: {
    startDelaySeconds: 10
    waitOnShutdown: true
    startup: false
}
{% endhighlight %}


### Parameters 객체 생성

Parameters 객체는 여러 파라메터를 포함하며, 각 파라메터의 속성을 정의하는 역할을 합니다.
위의 APON 형식의 텍스트를 Object로 변환하기 위해 4개의 Parameters 클래스를 작성했습니다.

> 아래 4개의 Parameters 클래스는 [`com.aspectran.core.util.apon.Parameters`](https://github.com/topframe/aspectran/blob/master/src/main/java/com/aspectran/core/util/apon/Parameters.java) 인터페이스의 구현체입니다.


***AspectranConfig.java***

루트 Parameters로써 `context`, `scheduler` Parameter를 가지고 있습니다.

{% highlight java %}
package com.aspectran.core.context.loader.config;

import com.aspectran.core.util.apon.AbstractParameters;
import com.aspectran.core.util.apon.ParameterDefinition;
import com.aspectran.core.util.apon.Parameters;

public class AspectranConfig extends AbstractParameters implements Parameters {

  public static final ParameterDefinition context;
  public static final ParameterDefinition scheduler;

  private static final ParameterDefinition[] parameterDefinitions;

  static {
    context = new ParameterDefinition("context", AspectranContextConfig.class);
    scheduler = new ParameterDefinition("scheduler", AspectranSchedulerConfig.class);

    parameterDefinitions = new ParameterDefinition[] {
        context,
        scheduler
    };
  }

  public AspectranConfig() {
    super(parameterDefinitions);
  }

  public AspectranConfig(String text) {
    super(parameterDefinitions, text);
  }

}
{% endhighlight %}

***AspectranContextConfig.java***

`context` Parameters의 멤버 Parameter로는 `root`, `encoding`, `resources`, `hybridLoad`, `autoReload`가 있습니다.

{% highlight java %}
package com.aspectran.core.context.loader.config;

import com.aspectran.core.util.apon.AbstractParameters;
import com.aspectran.core.util.apon.ParameterDefinition;
import com.aspectran.core.util.apon.ParameterValueType;
import com.aspectran.core.util.apon.Parameters;

public class AspectranContextConfig extends AbstractParameters implements Parameters {

  public static final ParameterDefinition root;
  public static final ParameterDefinition encoding;
  public static final ParameterDefinition resources;
  public static final ParameterDefinition hybridLoad;
  public static final ParameterDefinition autoReload;

  private final static ParameterDefinition[] parameterDefinitions;

  static {
    root = new ParameterDefinition("root", ParameterValueType.STRING);
    encoding = new ParameterDefinition("encoding", ParameterValueType.STRING);
    resources = new ParameterDefinition("resources", ParameterValueType.STRING, true);
    hybridLoad = new ParameterDefinition("hybridLoad", ParameterValueType.BOOLEAN);
    autoReload = new ParameterDefinition("autoReload", AspectranContextAutoReloadConfig.class);

    parameterDefinitions = new ParameterDefinition[] {
        root,
        encoding,
        resources,
        hybridLoad,
        autoReload
    };
  }

  public AspectranContextConfig() {
    super(parameterDefinitions);
  }

  public AspectranContextConfig(String text) {
    super(parameterDefinitions, text);
  }

}
{% endhighlight %}

***AspectranContextAutoReloadConfig.java***

`autoReload` Parameters의 멤버 Parameter로는 `reloadMethod`, `observationInterval`, `startup`이 있습니다.

{% highlight java %}
package com.aspectran.core.context.loader.config;

import com.aspectran.core.util.apon.AbstractParameters;
import com.aspectran.core.util.apon.ParameterDefinition;
import com.aspectran.core.util.apon.ParameterValueType;
import com.aspectran.core.util.apon.Parameters;

public class AspectranContextAutoReloadConfig extends AbstractParameters implements Parameters {

  public static final ParameterDefinition reloadMethod;
  public static final ParameterDefinition observationInterval;
  public static final ParameterDefinition startup;

  private final static ParameterDefinition[] parameterValues;

  static {
    reloadMethod = new ParameterDefinition("reloadMethod", ParameterValueType.STRING);
    observationInterval = new ParameterDefinition("observationInterval", ParameterValueType.INT);
    startup = new ParameterDefinition("startup", ParameterValueType.BOOLEAN);

    parameterValues = new ParameterDefinition[] {
        reloadMethod,
        observationInterval,
        startup
    };
  }

  public AspectranContextAutoReloadConfig() {
    super(parameterValues);
  }

  public AspectranContextAutoReloadConfig(String text) {
    super(parameterValues, text);
  }

}
{% endhighlight %}

***AspectranSchedulerConfig.java***

`scheduler` Parameters의 멤버 Parameter로는 `startDelaySeconds`, `waitOnShutdown`, `startup`이 있습니다.

{% highlight java %}
package com.aspectran.core.context.loader.config;

import com.aspectran.core.util.apon.AbstractParameters;
import com.aspectran.core.util.apon.ParameterDefinition;
import com.aspectran.core.util.apon.ParameterValueType;
import com.aspectran.core.util.apon.Parameters;

public class AspectranSchedulerConfig extends AbstractParameters implements Parameters {

  public static final ParameterDefinition startDelaySeconds;
  public static final ParameterDefinition waitOnShutdown;
  public static final ParameterDefinition startup;

  private final static ParameterDefinition[] parameterDefinitions;

  static {
    startDelaySeconds = new ParameterDefinition("startDelaySeconds", ParameterValueType.INT);
    waitOnShutdown = new ParameterDefinition("waitOnShutdown", ParameterValueType.BOOLEAN);
    startup = new ParameterDefinition("startup", ParameterValueType.BOOLEAN);

    parameterDefinitions = new ParameterDefinition[] {
        startDelaySeconds,
        waitOnShutdown,
        startup
    };
  }

  public AspectranSchedulerConfig() {
    super(parameterDefinitions);
  }

  public AspectranSchedulerConfig(String plaintext) {
    super(parameterDefinitions, plaintext);
  }

}
{% endhighlight %}


### AponWriter 사용 예제

[`AponWriter`](https://github.com/aspectran/aspectran/blob/master/src/main/java/com/aspectran/core/util/apon/AponWriter.java) 클래스를
사용하면 Parameters Object를 APON 형식의 텍스트 문서로 쉽게 변환할 수 있습니다.
APON 형식의 텍스트 문서를 Parameters Object로 변환하고, 다시 Parameters Object를 APON 형식의 문자열로 변환해서 콘솔에 출력하는 예제입니다.

{% highlight java %}
package com.aspectran.core.util.apon;

import java.io.File;
import java.io.FileReader;
import java.io.Reader;
import java.io.StringWriter;
import java.io.Writer;

import com.aspectran.core.context.loader.config.AspectranConfig;

public class AponWriterTest {

  public static void main(String argv[]) {
    try {
      Reader reader = new FileReader(new File(argv[0]));

      Parameters aspectranConfig = new AspectranConfig();

      AponReader aponReader = new AponReader(reader);
      aponReader.read(aspectranConfig);
      aponReader.close();

      System.out.println(aspectranConfig);

      Writer writer = new StringWriter();

      AponWriter aponWriter = new AponWriter(writer);
      aponWriter.write(aspectranConfig);
      aponWriter.close();

      System.out.println(writer.toString());

    } catch(Exception e) {
      e.printStackTrace();
    }
  }

}
{% endhighlight %}


### AponReader 사용 예제

[`AponReader`](https://github.com/aspectran/aspectran/blob/master/src/main/java/com/aspectran/core/util/apon/AponReader.java) 클래스를
사용하면 APON 형식의 텍스트 문서를 Parameters Object로 쉽게 변환할 수 있습니다.

{% highlight java %}
package com.aspectran.core.util.apon;

import java.io.File;
import java.io.FileReader;
import java.io.Reader;

import com.aspectran.core.context.loader.config.AspectranConfig;

public class AponReaderTest {

  public static void main(String argv[]) {
    try {
      Reader fileReader = new FileReader(new File(argv[0]));
      AponReader reader = new AponReader(fileReader);

      try {
        Parameters aspectranConfig = new AspectranConfig();  

        reader.read(aspectranConfig);

        System.out.println(aspectranConfig);
      } finally {
        reader.close();
      }
    } catch(Exception e) {
      e.printStackTrace();
    }
  }

}
{% endhighlight %}


## APON 라이브러리

현재 APON 라이브러는 Aspectran의 공통 유틸 패키지의 일부로 포함되어 있습니다.

APON 패키지: **com.aspectran.core.util.apon**

{% include label-link-box label="Source" href="https://github.com/aspectran/aspectran/tree/master/src/main/java/com/aspectran/core/util/apon" %}
