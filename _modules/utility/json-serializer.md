---
layout: module
format: article
title:  JSON Serializer
subheadline: Aspectran Modules - Utility
teaser: |
  Java Object를 JSON(JavaScript Object Notation) 형식의 문자열로 변환하는 클래스입니다.
  별도의 JSON 라이브러리를 필요로 하지 않고, 상당히 빠른 속도로 변환을 해 줍니다.
category: Utility
download:
  source: https://github.com/aspectran/aspectran/tree/master/src/main/java/com/aspectran/core/util/json/JsonSerializer.java
---

## Java Source

{% highlight java %}
package com.aspectran.core.util.json;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.aspectran.core.util.apon.Customer;

public class JsonSerializerTest {

  public static void main(String argv[]) {
    try {
      Map<String, Object> map = new LinkedHashMap<String, Object>();
      map.put("message", "Start Testing Now!");
      map.put("one", 1);
      map.put("two", 2);
      map.put("three", 3);
      map.put("four", 4);

      List<Customer> customerList = new ArrayList<Customer>();

      for(int i = 1; i <= 10; i++) {
        Customer customer = new Customer();
        customer.putValue(Customer.id, "guest-" + i);
        customer.putValue(Customer.name, "Guest" + i);
        customer.putValue(Customer.age, 20 + i);
        customer.putValue(Customer.episode, "His individual skills are outstanding.\nI don't know as how he is handsome.");
        customer.putValue(Customer.approved, true);

        customerList.add(customer);
      }			

      map.put("customers", customerList);

      System.out.println(JsonSerializer.serialize(map, true, "  "));

    } catch(Exception e) {
      e.printStackTrace();
    }
  }

}
{% endhighlight %}

## 출력 결과

{% highlight text %}
{
  "message": "Start Testing Now!",
  "one": 1,
  "two": 2,
  "three": 3,
  "four": 4,
  "customers": [
    {
      "id": "guest-1",
      "name": "Guest1",
      "age": 21,
      "epsode": "His individual skills are outstanding.\nI don't know as how he is handsome.",
      "approved": "true"
    },
    {
      "id": "guest-2",
      "name": "Guest2",
      "age": 22,
      "epsode": "His individual skills are outstanding.\nI don't know as how he is handsome.",
      "approved": "true"
    },
    {
      "id": "guest-3",
      "name": "Guest3",
      "age": 23,
      "epsode": "His individual skills are outstanding.\nI don't know as how he is handsome.",
      "approved": "true"
    },
    {
      "id": "guest-4",
      "name": "Guest4",
      "age": 24,
      "epsode": "His individual skills are outstanding.\nI don't know as how he is handsome.",
      "approved": "true"
    },
    {
      "id": "guest-5",
      "name": "Guest5",
      "age": 25,
      "epsode": "His individual skills are outstanding.\nI don't know as how he is handsome.",
      "approved": "true"
    },
    {
      "id": "guest-6",
      "name": "Guest6",
      "age": 26,
      "epsode": "His individual skills are outstanding.\nI don't know as how he is handsome.",
      "approved": "true"
    },
    {
      "id": "guest-7",
      "name": "Guest7",
      "age": 27,
      "epsode": "His individual skills are outstanding.\nI don't know as how he is handsome.",
      "approved": "true"
    },
    {
      "id": "guest-8",
      "name": "Guest8",
      "age": 28,
      "epsode": "His individual skills are outstanding.\nI don't know as how he is handsome.",
      "approved": "true"
    },
    {
      "id": "guest-9",
      "name": "Guest9",
      "age": 29,
      "epsode": "His individual skills are outstanding.\nI don't know as how he is handsome.",
      "approved": "true"
    },
    {
      "id": "guest-10",
      "name": "Guest10",
      "age": 30,
      "epsode": "His individual skills are outstanding.\nI don't know as how he is handsome.",
      "approved": "true"
    }
  ]
}
{% endhighlight %}
