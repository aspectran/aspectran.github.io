---
layout: module
title:  "MyBatis support for Aspectran"
subheadline: "Aspectran Modules - ORM"
teaser: "MyBatis와 연동하기 위한 모듈입니다. Aspectran의 AOP 기능을 통하여 MyBatis 트랜잭션(transaction)을 완벽히 처리할 수 있습니다."
category: orm
---

## Configuration

{% highlight xml %}
<bean id="sqlSessionFactory" class="com.aspectran.support.orm.mybatis.SqlSessionFactoryBean" scope="singleton">
    <property>
        <item name="configLocation" value="/WEB-INF/mybatis/mybatis-configuration.xml"/>
    </property>
</bean>

<bean id="sqlSessionTxAdvice" class="com.aspectran.support.orm.ibatis.SqlSessionTransactionAdvice" scope="prototype">
    <constructor>
        <argument>
            <item><reference bean="sqlSessionFactory"/></item>
        </argument>
    </constructor>
</bean>

<bean id="*" class="com.aspectran.example.mybatis.dao.*Dao" scope="singleton">
  <property>
    <item name="revelentAspectId" value="sqlmapTxAspect"/>
  </property>
</bean>

<aspect id="mybatisTxAspect"">
    <joinpoint scope="translet">
        <pointcut>
            target: {
              +: "/example/**/*@**.mybatis.dao.*Dao"
            }
        </pointcut>
    </joinpoint>
    <advice bean="sqlSessionTxAdvice">
        <before>
            <action method="open"/>
        </before>
        <after>
            <action method="commit"/>
        </after>
        <finally>
            <action method="close"/>
        </finally>
      </advice>
</aspect>
{% endhighlight %}

## Java

***MyBatisSampleDao.java***

{% highlight java %}
package com.aspectran.example.mybatis;

import java.sql.SQLException;

import org.apache.ibatis.session.SqlSession;

import com.aspectran.core.activity.Translet;
import com.aspectran.support.orm.mybatis.MyBatisDaoSupport;

public class MyBatisSampleDao extends MyBatisDaoSupport {

  public Object selectOne(Translet translet) throws SQLException {
    SqlSession sqlSession = getSqlSession(translet);
    return sqlSession.selectOne("sample.selectOne", translet.getRequestAdapter().getParameterMap());
  }

  public void insertOne(Translet translet) throws SQLException {
    SqlSession sqlSession = getSqlSession(translet);
    sqlSession.insert("sample.insertOne", translet.getRequestAdapter().getParameterMap());
  }

  public void updateOne(Translet translet) throws SQLException {
    SqlSession sqlSession = getSqlSession(translet);
    sqlSession.update("sample.updateOne", translet.getRequestAdapter().getParameterMap());
  }

  public void deleteOne(Translet translet) throws SQLException {
    SqlSession sqlSession = getSqlSession(translet);
    sqlSession.delete("sample.deleteOne", translet.getRequestAdapter().getParameterMap());
  }

}
{% endhighlight %}
