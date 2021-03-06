---
layout: module
format: plate article
title:  APON
subheadline: Aspectran Modules - Utility
teaser: |
  APON(Aspectran Parameters Object Notation)은 Aspectran 내부에서 매개변수를 손쉽게 Object로 변환하기 위한 용도로 개발되었습니다.
  APON은 JSON(JavaScript Object Notation)을 개량했기 때문에 JSON과 비슷한 표기 형식을 가지고 있고, 사람이 읽고 쓰기에 용이하며,
  구조화된 형식의 데이터 교환을 위한 새로운 표기법입니다.
category: Utility
download:
  source: https://github.com/aspectran/aspectran/tree/master/src/main/java/com/aspectran/core/util/apon
---

APON에 대한 자세한 내용은 다음 페이지를 참고하세요.

{% include label-link-box label="APON을 소개합니다." href="/blog/apon/introduce-apon/" %}

- - -

## Parameters 객체 활용

- APON 라이브러리를 이용하면 여러 개의 매개변수를 구조화된 하나의 Object로 만들 수 있습니다.
- 구조화된 하나의 Object를 Parameters라고 합니다.
- APON 표기법을 따르는 텍스트 형식의 문자열 데이터를 Parameters Obejct로 변환하기 위해 AponWriter 클래스를 사용합니다.
- Parameters Obejct를 APON 표기법에 따라 텍스트 형식의 문자열로 변환하기 위해 AponReader 클래스를 사용합니다.

Parameters 인터페이스를 구현한 Curtomer 클래스를 예로 들어 설명합니다.
Customer 클래스는 간단한 고객정보 관련 필드를 몇 개 가지고 있습니다.


### Customer 클래스 작성

Parameters 인터페이스를 구현하였습니다.

***Customer.java***

```java
package hello;

import com.aspectran.core.util.apon.AbstractParameters;
import com.aspectran.core.util.apon.ParameterDefinition;
import com.aspectran.core.util.apon.ParameterValueType;
import com.aspectran.core.util.apon.Parameters;

public class Customer extends AbstractParameters implements Parameters {

  /** 고객번호 */
  public static final ParameterDefinition id;

  /** 이름 */
  public static final ParameterDefinition name;

  /** 나이 */
  public static final ParameterDefinition age;

  /** 에피소드 */
  public static final ParameterDefinition episode;

  /** 승인 여부 */
  public static final ParameterDefinition approved;

  private static final ParameterDefinition[] parameterDefinitions;

  static {
    id = new ParameterDefinition("id", ParameterValueType.STRING);
    name = new ParameterDefinition("name", ParameterValueType.STRING);
    age = new ParameterDefinition("age", ParameterValueType.INT);
    episode = new ParameterDefinition("episode", ParameterValueType.TEXT);
    approved = new ParameterDefinition("approved", ParameterValueType.BOOLEAN);

    parameterDefinitions = new ParameterDefinition[] {
        id,
        name,
        age,
        episode,
        approved
    };
  }

  /**
   * Instantiates a new customer.
   */
  public Customer() {
    super(parameterDefinitions);
  }

  /**
   * Instantiates a new customer.
   *
   * @param text the Text string of APON format
   */
  public Customer(String text) {
    super(parameterDefinitions, text);
  }

}
```


### Customer 객체 생성

```java
Customer customer = new Customer();
customer.putValue(Customer.id, "guest");
customer.putValue(Customer.name, "Guest");
customer.putValue(Customer.age, 20);
customer.putValue(Customer.episode, "His individual skills are outstanding.\nI don't know as how he is handsome.");
customer.putValue(Customer.approved, false);
```


### Customer 객체의 필드 참조

```java
String id = customer.getString(Customer.id);
String name = customer.getString(Customer.name);
Integer age = customer.getInt(Customer.age);
String episode = customer.getString(Customer.episode);
Boolean approved = customer.getBoolean(Customer.approved);
```


### APON 형식의 텍스트 문자열로 변환

```java
String text = AponReader.read(customer);
System.out.println(text);
```

결과:
```text
id: "guest"
name: "Guest"
age: 20
episode: (
  |His individual skills are outstanding.
  |I don't know as how he is handsome.
)
approved: false
```


### APON 형식의 텍스트 문자열을 Parameters Object로 변환

```java
Customer customer2 = new Customer();
AponWriter.write(text, customer2);
```


### 상호 변환 테스트

```java
package com.aspectran.core.util.apon;

public class AponWriterTest {

  public static void main(String argv[]) {
    try {
      Customer customer = new Customer();
      customer.putValue(Customer.id, "guest");
      customer.putValue(Customer.name, "Guest");
      customer.putValue(Customer.age, 20);
      customer.putValue(Customer.episode, "His individual skills are outstanding.\nI don't know as how he is handsome.");
      customer.putValue(Customer.approved, false);

      String text = AponReader.read(customer);

      Customer customer2 = new Customer();
      customer2 = AponWriter.write(text, customer2);

      String text2 = AponReader.read(customer2);

      System.out.println("---------------------------------------------------");
      System.out.print(text);
      System.out.println("---------------------------------------------------");
      System.out.print(text2);
      System.out.println("---------------------------------------------------");
    } catch(Exception e) {
      e.printStackTrace();
    }
  }

}
```

결과:
```text
---------------------------------------------------
id: "guest"
name: "Guest"
age: 20
epsode: (
  |His individual skills are outstanding.
  |I don't know as how he is handsome.
)
approved: false
---------------------------------------------------
id: "guest"
name: "Guest"
age: 20
epsode: (
  |His individual skills are outstanding.
  |I don't know as how he is handsome.
)
approved: false
---------------------------------------------------
```
