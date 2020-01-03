---
layout: module
format: plate article
title:  MyBatis support for Aspectran
subheadline: Aspectran Modules - ORM
teaser: MyBatis와 연동하기 위한 모듈입니다. Aspectran의 AOP 기능을 활용하면 MyBatis 트랜잭션(transaction)을 완벽히 처리할 수 있습니다.
category: ORM
download:
  source: https://github.com/aspectran/aspectran-modules/tree/master/aspectran-orm/src/main/java/com/aspectran/support/orm/mybatis
---

## Configuration

```xml
<bean id="sqlSessionFactory" class="com.aspectran.support.orm.mybatis.SqlSessionFactoryBean">
    <properties>
        <item name="configLocation" value="/WEB-INF/mybatis/mybatis-configuration.xml"/>
    </properties>
</bean>

<bean id="sqlSessionTxAdvice" class="com.aspectran.support.orm.ibatis.SqlSessionTransactionAdvice" scope="prototype">
    <constructor>
        <arguments>
            <item><reference bean="sqlSessionFactory"/></item>
        </arguments>
    </constructor>
</bean>

<bean id="*" class="com.aspectran.example.mybatis.dao.*Dao" mask="com.aspectran.**.*">
    <properties>
        <item name="relevantAspectId" value="mybatisTxAspect"/>
    </properties>
</bean>

<aspect id="mybatisTxAspect">
    <description>
        본 Aspect는 SqlSession을 열고 닫는 메소드를 자동으로 호출합니다.
        DAO 메소드가 호출되기 전에 자동으로 open() 메소드를 호출하여 SqlSession을 열고,
        Translet 실행 중에 예외가 발생하지 않았다면 commit() 메소드를 호출합니다.
        마지막으로 자원을 해제하기 위해 close() 메소드를 호출합니다.
    </description>
    <joinpoint type="translet">
        pointcut: {
            +: /example/**/*@**.dao.*Dao
        }
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
```

## Java Source

***MyBatisSampleDao.java***

```java
package com.aspectran.example.mybatis;

import java.sql.SQLException;

import org.apache.ibatis.session.SqlSession;

import com.aspectran.core.activity.Translet;
import com.aspectran.support.orm.mybatis.MyBatisDaoSupport;

public class MyBatisSampleDao extends MyBatisDaoSupport {

    public Object selectOne(Translet translet) throws SQLException {
        SqlSession sqlSession = getSqlSession(translet);
        return sqlSession.selectOne("sample.selectOne", translet.getParameterMap());
    }

    public void insertOne(Translet translet) throws SQLException {
        SqlSession sqlSession = getSqlSession(translet);
        sqlSession.insert("sample.insertOne", translet.getParameterMap());
    }

    public void updateOne(Translet translet) throws SQLException {
        SqlSession sqlSession = getSqlSession(translet);
        sqlSession.update("sample.updateOne", translet.getParameterMap());
    }

    public void deleteOne(Translet translet) throws SQLException {
        SqlSession sqlSession = getSqlSession(translet);
        sqlSession.delete("sample.deleteOne", translet.getParameterMap());
    }

}
```
