---
layout: module
title:  "MyBatis support for Aspectran"
subheadline: "Aspectran Modules - ORM"
teaser: "MyBatis와 연동하기 위한 모듈입니다. Aspectran의 AOP 기능을 통하여 MyBatis 트랜잭션(transaction)을 완벽히 처리할 수 있습니다."
category: orm
---

## 설정 메타데이터

{% highlight xml %}
<bean id="sqlSessionFactory" class="com.aspectran.support.orm.mybatis.SqlSessionFactoryBean" scope="singleton">
    <property>
        <item name="configLocation" value="/WEB-INF/mybatis/mybatis-configuration.xml"/>
    </property>
</bean>

<bean id="sqlSessionTransactionAdvice" class="com.aspectran.support.orm.ibatis.SqlSessionTransactionAdvice" scope="prototype">
    <constructor>
        <argument>
            <item><reference bean="sqlSessionFactory"/></item>
        </argument>
    </constructor>
</bean>

<aspect id="mybatis">
    <joinpoint scope="translet">
        <pointcut>
            target: {
              +: "/example/**/*@**.mybatis.dao.*Dao"
            }
        </pointcut>
    </joinpoint>
    <advice bean="sqlSessionTransactionAdvice">
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

public class MyBatisSampleDao {

	private static final String MYBATIS_ASPECT_ID = "mybatis";

	public Object selectOne(Translet translet) throws SQLException {
		SqlSession sqlSession = translet.getBeforeAdviceResult(MYBATIS_ASPECT_ID);
		return sqlSession.selectOne("sample.selectOne", translet.getRequestAdapter().getParameterMap());
	}

	public void insertOne(Translet translet) throws SQLException {
		SqlSession sqlSession = translet.getBeforeAdviceResult(MYBATIS_ASPECT_ID);
		sqlSession.insert("sample.insertOne", translet.getRequestAdapter().getParameterMap());
	}

	public void updateOne(Translet translet) throws SQLException {
		SqlSession sqlSession = translet.getBeforeAdviceResult(MYBATIS_ASPECT_ID);
		sqlSession.update("sample.updateOne", translet.getRequestAdapter().getParameterMap());
	}

	public void deleteOne(Translet translet) throws SQLException {
		SqlSession sqlSession = translet.getBeforeAdviceResult(MYBATIS_ASPECT_ID);
		sqlSession.delete("sample.deleteOne", translet.getRequestAdapter().getParameterMap());
	}

}
{% endhighlight %}
