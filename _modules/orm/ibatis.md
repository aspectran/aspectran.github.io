---
layout: module
title:  "iBatis support for Aspectran"
subheadline: "Aspectran Modules - ORM"
teaser: "iBatis와 연동하기 위한 모듈입니다. Aspectran의 AOP 기능을 통하여 iBatis 트랜잭션(transaction)을 완벽히 처리할 수 있습니다."
category: orm
---

## Configuration

{% highlight xml %}
<bean id="sqlMapClientFactory" class="com.aspectran.support.orm.ibatis.SqlMapClientFactoryBean" scope="singleton">
    <property>
        <item name="configLocation" value="/WEB-INF/sqlmap/sql-map-config.xml"/>
    </property>
</bean>

<bean id="sqlMapClientTransactionAdvice" class="com.aspectran.support.orm.ibatis.SqlMapClientTransactionAdvice" scope="prototype">
    <constructor>
        <argument>
            <item><reference bean="sqlMapClientFactory"/></item>
        </argument>
    </constructor>
</bean>

<aspect id="sqlmap">
    <joinpoint scope="translet">
        <pointcut>
            target: {
              +: "/example/**/*@**.ibatis.dao.*Dao"
            }
        </pointcut>
    </joinpoint>
    <advice bean="sqlMapClientTransactionAdvice">
        <before>
            <action method="start"/>
        </before>
        <after>
            <action method="commit"/>
        </after>
        <finally>
            <action method="end"/>
        </finally>
      </advice>
</aspect>
{% endhighlight %}

## Java

***IBatisSampleDao.java***

{% highlight java %}
package com.aspectran.example.ibatis.dao;

import java.sql.SQLException;

import com.aspectran.core.activity.Translet;
import com.ibatis.sqlmap.client.SqlMapClient;

public class IBatisSampleDao {

	private static final String SQLMAP_ASPECT_ID = "sqlmap";

	public Object selectOne(Translet translet) throws SQLException {
		SqlMapClient sqlMapClient = translet.getBeforeAdviceResult(SQLMAP_ASPECT_ID);
		return sqlMapClient.queryForObject("sample.selectOne", translet.getRequestAdapter().getParameterMap());
	}

	public void insertOne(Translet translet) throws SQLException {
		SqlMapClient sqlMapClient = translet.getBeforeAdviceResult(SQLMAP_ASPECT_ID);
		sqlMapClient.insert("sample.insertOne", translet.getRequestAdapter().getParameterMap());
	}

	public void updateOne(Translet translet) throws SQLException {
		SqlMapClient sqlMapClient = translet.getBeforeAdviceResult(SQLMAP_ASPECT_ID);
		sqlMapClient.update("sample.updateOne", translet.getRequestAdapter().getParameterMap());
	}

	public void deleteOne(Translet translet) throws SQLException {
		SqlMapClient sqlMapClient = translet.getBeforeAdviceResult(SQLMAP_ASPECT_ID);
		sqlMapClient.delete("sample.deleteOne", translet.getRequestAdapter().getParameterMap());
	}

}
{% endhighlight %}
