---
layout: example
format: plate article
title: RESTful 웹서비스 활용 예제
subheadline: Building a RESTful Web Service
teaser: GET, PUT, POST, DELETE 등과 같은 HTTP 지원 메소드를 사용해서 RESTful 웹서비스를 이용하는 예제 페이지입니다.
outside_heading: true
breadcrumb: true
image:
  thumb: examples/ga-rest-service.png
download:
- label: Front-end
  url: https://github.com/aspectran-guides/ga-rest-service/blob/master/src/main/webapp/ga-rest-service.html
- label: Back-end
  url: https://github.com/aspectran-guides/ga-rest-service
demo: ga-rest-service.html
---

***root-configuration.xml***

{% highlight xml %}
<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran Configuration 3.0//EN"
    "http://aspectran.github.io/dtd/aspectran-3.dtd">

<aspectran>

  <description>
    본 Aspectran Configuration은 Aspectran을 이용해서 RESTful Web Service를 만드는 과정을 안내하기 위한 것입니다.
  </description>

  <!-- 기본 설정 -->
  <settings>
    <setting name="transletNamePattern" value="/ga-rest-service/*"/>
  </settings>

  <bean scan="sample.*Dao">
    <description>
      sample 패키지 하위에 있는 DAO Bean을 찾아서 등록합니다.
    </description>
  </bean>

  <bean scan="sample.*Action">
    <description>
      sample 패키지 하위에 있는 Action Bean을 찾아서 등록합니다.
    </description>
  </bean>

  <bean id="jspViewDispatcher" class="com.aspectran.web.support.view.JspViewDispatcher">
    <description>
      JSP View Dispatcher를 등록합니다.
    </description>
    <properties>
      <item name="prefix">/WEB-INF/jsp/</item>
      <item name="suffix">.jsp</item>
    </properties>
  </bean>

  <aspect id="transletSettings">
    <description>
      요청 정보를 분석 및 응답하는 단계에서 사용할 기본 환경 변수를 정의합니다.
    </description>
    <joinpoint type="translet"/>
    <settings>
      <setting name="characterEncoding" value="utf-8"/>
      <setting name="contentEncoding" value="gzip"/>
      <setting name="viewDispatcher" value="jspViewDispatcher"/>
    </settings>
  </aspect>

  <bean id="corsProcessor" class="com.aspectran.web.support.cors.DefaultCorsProcessor">
    <properties>
      <item name="allowedOrigins" type="set">
        <value>http://www.aspectran.com</value>
        <value>http://backend.aspectran.com</value>
        <value>http://backend2.aspectran.com</value>
      </item>
      <item name="allowedMethods" type="set">
        <value>GET</value>
        <value>POST</value>
        <value>PATCH</value>
        <value>PUT</value>
        <value>DELETE</value>
        <value>HEAD</value>
        <value>OPTIONS</value>
      </item>
      <item name="maxAgeSeconds" value="360" valueType="int"/>
      <item name="exposedHeaders" value="Location"/>
    </properties>
  </bean>

  <aspect id="corsProcessorAspect">
    <joinpoint type="translet">
      methods: [
        GET
        POST
        PATCH
        PUT
        DELETE
      ]
      headers: [
        Origin
      ]
      pointcut: {
        +: /**/*
      }
    </joinpoint>
    <advice bean="corsProcessor">
        <before>
            <action method="processActualRequest"/>
        </before>
    </advice>
    <exception>
      <thrown type="com.aspectran.web.support.cors.CorsException">
        <transform type="transform/text">
          <template engine="builtin">
            @{CORS.HTTP_STATUS_CODE}: @{CORS.HTTP_STATUS_TEXT}
          </template>
        </transform>
      </thrown>
    </exception>
  </aspect>

  <translet name="/**/*" method="OPTIONS">
    <action bean="corsProcessor" method="processPreflightRequest"/>
    <exception>
      <thrown type="com.aspectran.web.support.cors.CorsException">
        <transform type="transform/text">
          <template engine="builtin">
            @{CORS.HTTP_STATUS_CODE}: @{CORS.HTTP_STATUS_TEXT}
          </template>
        </transform>
      </thrown>
    </exception>
  </translet>

  <import file="/WEB-INF/aspectran/config/customers-translets.xml"/>

</aspectran>
{% endhighlight %}

***customers-translets.xml***

{% highlight xml %}
<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran Configuration 3.0//EN"
        "http://aspectran.github.io/dtd/aspectran-3.dtd">

<aspectran>

    <description>
      본 Aspectran Configuration은 RESTful Web Service를 만드는 과정을 안내하기 위한 것입니다.
    </description>

    <translet name="echo/${msg}" method="ALL">
      <description>
        요청 URI로부터 ${msg} 부분을 msg 파라메터로 받아서
        텍스트 문서 형식으로 응답을 처리합니다.
      </description>
      <transform type="transform/text">
        <template>
          Message: ${msg}
        </template>
      </transform>
    </translet>

    <translet name="index">
      <dispatch name="customers"/>
    </translet>

    <translet name="customers" method="GET">
      <description>
        전체 고객 목록을 조회합니다.
      </description>
      <action id="customers" bean="class:sample.CustomerAction" method="getCustomerList"/>
      <transform type="transform/json" pretty="true"/>
    </translet>

    <translet name="customers/${id:guest}" method="GET">
      <description>
        id를 파라메터로 받아서 해당 id를 가진 고객의 상세정보를 조회합니다.
        고객번호를 지정하지 않으면 고객번호가 "guest"인 고객의 상세정보를 조회합니다.
      </description>
      <action id="customer" bean="class:sample.CustomerAction" method="getCustomer"/>
      <transform type="transform/json" pretty="true"/>
    </translet>

    <translet name="customers" method="POST">
      <description>
        고객정보를 등록합니다.
      </description>
      <action bean="class:sample.CustomerAction" method="insertCustomer"/>
      <transform type="transform/json" pretty="true"/>
    </translet>

    <translet name="customers/${id}" method="PUT">
      <description>
        고객정보를 수정합니다.
      </description>
      <action bean="class:sample.CustomerAction" method="updateCustomer"/>
      <transform type="transform/json" pretty="true"/>
    </translet>

    <translet name="customers/${id}/approve/${approved}" method="PUT">
      <description>
        id를 파라메터로 받아서 해당 id를 가진 고객에 대해 승인처리를 합니다.
        "${approved}"는 승인여부에 해당하는 값을 지정합니다. (true or false)
      </description>
      <action id="result" bean="class:sample.CustomerAction" method="approve"/>
      <transform type="transform/json" pretty="true"/>
    </translet>

    <translet name="customers/${id}/approve" method="GET">
      <description>
        id를 파라메터로 받아서 해당 id를 가진 고객에 대하여 승인여부를 조회합니다.
      </description>
      <action id="result" bean="class:sample.CustomerAction" method="isApproved"/>
      <transform type="transform/json" pretty="true"/>
    </translet>

    <translet name="customers/${id}" method="DELETE">
      <description>
        id를 파라메터로 받아서 해당 id를 가진 고객의 정보를 삭제합니다.
      </description>
      <action id="result" bean="class:sample.CustomerAction" method="deleteCustomer"/>
      <transform type="transform/json" pretty="true"/>
    </translet>

</aspectran>
{% endhighlight %}

***Customer.java***

{% highlight java %}
package sample;

import com.aspectran.core.util.apon.AbstractParameters;
import com.aspectran.core.util.apon.ParameterDefinition;
import com.aspectran.core.util.apon.ParameterValueType;

/**
 * 고객정보 레코드를 정의합니다.
 * APON의 Parameters 객체를 활용합니다.
 */
public class Customer extends AbstractParameters {

  /** 고객번호 */
  public static final ParameterDefinition id;

  /** 이름 */
  public static final ParameterDefinition name;

  /** 나이 */
  public static final ParameterDefinition age;

  /** 승인 여부 */
  public static final ParameterDefinition approved;

  private static final ParameterDefinition[] parameterDefinitions;

  static {
    id = new ParameterDefinition("id", ParameterValueType.INT);
    name = new ParameterDefinition("name", ParameterValueType.STRING);
    age = new ParameterDefinition("age", ParameterValueType.INT);
    approved = new ParameterDefinition("approved", ParameterValueType.BOOLEAN);

    parameterDefinitions = new ParameterDefinition[] {
      id,
      name,
      age,
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
{% endhighlight %}

***CustomerDao.java***

{% highlight java %}
package sample;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentSkipListMap;
import java.util.concurrent.atomic.AtomicInteger;

import com.aspectran.core.util.logging.Log;
import com.aspectran.core.util.logging.LogFactory;

/**
 * 고객 정보 DAO
 */
public class CustomerDao {

  private final Log log = LogFactory.getLog(CustomerDao.class);

  private final Map<Integer, Customer> customerMap;

  private static final AtomicInteger counter = new AtomicInteger();

  public CustomerDao() {
    // 10명의 고객을 미리 생성합니다.
    customerMap = new ConcurrentSkipListMap<Integer, Customer>();

    for(int i = 1; i <= 10; i++) {
      Customer customer = new Customer();
      customer.putValue(Customer.id, i);
      customer.putValue(Customer.name, "Guest - " + i);
      customer.putValue(Customer.age, i + 20);
      customer.putValue(Customer.approved, true);

      customerMap.put(i, customer);
    }

    counter.set(customerMap.size() + 1);
  }

  public Customer getCustomer(int id) {
    log.info(id + "번 고객의 상세정보를 조회합니다.");

    Customer customer = customerMap.get(id);

    return customer;

  }

  public boolean isCustomer(int id) {
    if(customerMap.containsKey(id)) {
      log.info(id + "번 고객은 등록되어 있습니다.");
      return true;
    } else {
      log.info(id + "번 고객은 등록되어 있지 않습니다.");
      return false;
    }
  }

  public List<Customer> getCustomerList() {
    log.info("전체 고객 목록을 조회합니다.");

    List<Customer> customerList = new ArrayList<Customer>(customerMap.values());

    log.info(customerList.size() + "명의 고객이 조회되었습니다.");

    return customerList;
  }

  public int insertCustomer(Customer customer) {
    int id = counter.incrementAndGet();
    customer.putValue(Customer.id, id);

    customerMap.put(id, customer);

    log.info(id + "번 고객이 등록되었습니다.");

    return id;
  }

  public synchronized boolean updateCustomer(Customer customer) {
    int id = customer.getInt(Customer.id);

    if(customerMap.containsKey(id)) {
      log.info(id + "번 고객의 정보를 수정합니다.");
      customerMap.put(id, customer);
      return true;
    }

    return false;
  }

  public synchronized boolean deleteCustomer(int id) {
    if(customerMap.containsKey(id)) {
      log.info(id + "번 고객의 정보를 삭제합니다.");
      customerMap.remove(id);
      return true;
    }

    return false;
  }

  public boolean approve(int id, boolean approved) {
    Customer customer = customerMap.get(id);

    if(customer != null) {
      log.info(id + "번 고객에 대해 승인처리를 합니다. (승인여부: " + approved + ")");
      customer.putValue(Customer.approved, approved);
      return true;
    }

    return false;
  }

  public boolean isApproved(int id) {
    Customer customer = customerMap.get(id);

    if(customer != null) {
      log.info(id + "번 고객에 대해 승인여부를 조회합니다.");
      return customer.getBoolean(Customer.approved);
    }

    return false;
  }

}
{% endhighlight %}

***CustomerAction.java***

{% highlight java %}
package sample;

import java.util.List;

import com.aspectran.core.activity.Translet;
import com.aspectran.core.context.bean.annotation.Autowired;
import com.aspectran.web.support.http.HttpStatusSetter;

public class CustomerAction {

  @Autowired
  private CustomerDao dao;

  public List<Customer> getCustomerList(Translet translet) {
    return dao.getCustomerList();
  }

  public Customer getCustomer(Translet translet) {
    int id = Integer.parseInt(translet.getParameter("id"));

    Customer customer = dao.getCustomer(id);

    if(customer == null) {
      HttpStatusSetter.notFound(translet);
      return null;
    }

    return customer;
  }

  public Customer insertCustomer(Translet translet) {
    String name = translet.getParameter("name");
    int age = Integer.valueOf(translet.getParameter("age"));
    boolean approved = "Y".equals(translet.getParameter("approved"));

    Customer customer = new Customer();
    customer.putValue(Customer.name, name);
    customer.putValue(Customer.age, age);
    customer.putValue(Customer.approved, approved);

    int id = dao.insertCustomer(customer);

    String resourceUri = translet.getName() + "/" + id;
    HttpStatusSetter.created(translet, resourceUri);

    return customer;
  }

  public Customer updateCustomer(Translet translet) {
    int id = Integer.parseInt(translet.getParameter("id"));
    String name = translet.getParameter("name");
    int age = Integer.valueOf(translet.getParameter("age"));
    boolean approved = "Y".equals(translet.getParameter("approved"));

    Customer customer = new Customer();
    customer.putValue(Customer.id, id);
    customer.putValue(Customer.name, name);
    customer.putValue(Customer.age, age);
    customer.putValue(Customer.approved, approved);

    boolean updated = dao.updateCustomer(customer);

    if(!updated) {
      HttpStatusSetter.notFound(translet);
      return null;
    }

    return customer;
  }

  public boolean deleteCustomer(Translet translet) {
    int id = Integer.parseInt(translet.getParameter("id"));

    boolean deleted = dao.deleteCustomer(id);

    if(!deleted) {
      HttpStatusSetter.notFound(translet);
      return false;
    }

    return true;
  }

  public boolean approve(Translet translet) {
    int id = Integer.parseInt(translet.getParameter("id"));
    boolean approved = Boolean.parseBoolean(translet.getParameter("approved"));

    boolean updated = dao.approve(id, approved);

    if(!updated) {
      HttpStatusSetter.notFound(translet);
      return false;
    }

    return true;
  }

  public boolean isApproved(Translet translet) {
    int id = Integer.parseInt(translet.getParameter("id"));
    return dao.isApproved(id);
  }

}
{% endhighlight %}
