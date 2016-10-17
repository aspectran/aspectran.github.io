---
layout: module
format: article
title:  iBatis support for Aspectran
subheadline: Aspectran Modules - ORM
teaser: iBatis와 연동하기 위한 모듈입니다. Aspectran의 AOP 기능을 통하여 iBatis 트랜잭션(transaction)을 완벽히 처리할 수 있습니다.
category: ORM
download:
  source: https://github.com/aspectran/aspectran-modules/tree/master/aspectran-orm/src/main/java/com/aspectran/support/orm/ibatis
---

## Configuration

{% highlight xml %}
<bean id="sqlMapClientFactory" class="com.aspectran.support.orm.ibatis.SqlMapClientFactoryBean">
    <property>
        <item name="configLocation" value="/WEB-INF/sqlmap/sql-map-config.xml"/>
    </property>
</bean>

<bean id="sqlMapClientTxAdvice" class="com.aspectran.support.orm.ibatis.SqlMapClientTransactionAdvice" scope="prototype">
    <constructor>
        <arguments>
            <item><reference bean="sqlMapClientFactory"/></item>
        </arguments>
    </constructor>
</bean>

<bean id="*" class="com.aspectran.example.ibatis.dao.*Dao" mask="com.aspectran.**.*">
    <property>
        <item name="revelentAspectId" value="sqlmapTxAspect"/>
    </property>
</bean>

<aspect id="sqlmapTxAspect">
    <joinpoint target="translet">
        pointcut: {
            +: "/example/**/*@**.dao.*Dao"
        }
    </joinpoint>
    <advice bean="sqlMapClientTxAdvice">
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

## Java Source

***IBatisSampleDao.java***

{% highlight java %}
package com.aspectran.example.ibatis.dao;

import java.sql.SQLException;

import com.aspectran.core.activity.Translet;
import com.aspectran.support.orm.ibatis.IBatisDaoSupport;
import com.ibatis.sqlmap.client.SqlMapClient;

public class IBatisSampleDao extends IBatisDaoSupport {

    public Object selectOne(Translet translet) throws SQLException {
        SqlMapClient sqlMapClient = getSqlMapClient(translet);
        return sqlMapClient.queryForObject("sample.selectOne", translet.getParameterMap());
    }

    public void insertOne(Translet translet) throws SQLException {
        SqlMapClient sqlMapClient = getSqlMapClient(translet);
        sqlMapClient.insert("sample.insertOne", translet.getParameterMap());
    }

    public void updateOne(Translet translet) throws SQLException {
        SqlMapClient sqlMapClient = getSqlMapClient(translet);
        sqlMapClient.update("sample.updateOne", translet.getParameterMap());
    }

    public void deleteOne(Translet translet) throws SQLException {
        SqlMapClient sqlMapClient = getSqlMapClient(translet);
        sqlMapClient.delete("sample.deleteOne", translet.getParameterMap());
    }

}
{% endhighlight %}
