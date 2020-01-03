---
layout: module
format: plate article
title:  iBatis support for Aspectran
subheadline: Aspectran Modules - ORM
teaser: iBatis와 연동하기 위한 모듈입니다. Aspectran의 AOP 기능을 통하여 iBatis 트랜잭션(transaction)을 완벽히 처리할 수 있습니다.
category: ORM
download:
  source: https://github.com/aspectran/aspectran-modules/tree/master/aspectran-orm/src/main/java/com/aspectran/support/orm/ibatis
---

## Configuration

```xml
<bean id="sqlMapClientFactory" class="com.aspectran.support.orm.ibatis.SqlMapClientFactoryBean">
    <properties>
        <item name="configLocation" value="/WEB-INF/sqlmap/sql-map-config.xml"/>
    </properties>
</bean>

<bean id="sqlMapClientTxAdvice" class="com.aspectran.support.orm.ibatis.SqlMapClientTransactionAdvice" scope="prototype">
    <constructor>
        <arguments>
            <item><reference bean="sqlMapClientFactory"/></item>
        </arguments>
    </constructor>
</bean>

<bean id="*" class="com.aspectran.example.ibatis.dao.*Dao" mask="com.aspectran.**.*">
    <properties>
        <item name="relevantAspectId" value="sqlmapTxAspect"/>
    </properties>
</bean>

<aspect id="sqlmapTxAspect">
    <description>
        본 Aspect는 sqlMapClient의 Transaction을 시작하고 종료하는 메소드를 자동으로 호출합니다.
        DAO 메소드가 호출되기 전에 자동으로 startTransaction() 메소드를 호출하고,
        Translet 실행 중에 예외가 발생하지 않았다면 commitTransaction() 메소드를 호출합니다.
        마지막으로 자원을 해제하기 위해 endTransaction() 메소드를 호출합니다.
    </description>
    <joinpoint type="translet">
        pointcut: {
            +: /example/**/*@**.dao.*Dao
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
```

## Java Source

***IBatisSampleDao.java***

```java
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
```
