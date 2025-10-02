---
subheadline: Releases
title: Aspectran에서 Hibernate 7.0.1+ ClassCastException 해결하기
teaser: Aspectran 프레임워크에서 Hibernate 7.0.1+ 통합 시 발생하는 ClassLoader 문제 해결 방법
categories:
  - news
tags:
  - Aspectran
  - Hibernate
  - JPA
  - ClassLoader
published: false
---

## 문제 상황

[Aspectran PetClinic 데모](https://github.com/aspectran/petclinic)를 Hibernate 7.0.9.Final에서 7.1.2.Final로 업그레이드하는 과정에서 다음과 같은 오류가 발생했습니다:

```
java.lang.ClassCastException: class app.petclinic.owner.Owner cannot be cast to
class app.petclinic.owner.Owner (app.petclinic.owner.Owner is in unnamed module
of loader 'app'; app.petclinic.owner.Owner is in unnamed module of loader 'root')
at app.petclinic.owner.OwnerDao.findById(OwnerDao.java:100)
```

동일한 클래스를 자기 자신에게 캐스팅할 수 없다는 오류입니다. 이는 **ClassLoader 불일치** 문제를 나타내며, JVM이 서로 다른 ClassLoader로 로드된 동일한 클래스의 두 버전을 보고 있다는 의미입니다.

## 근본 원인

**Hibernate 7.0.1+ 버전부터는 Thread Context ClassLoader를 자동으로 감지하지 않습니다.**

- ✅ **Hibernate 7.0.9.Final**: Context ClassLoader를 자동으로 사용
- ❌ **Hibernate 7.0.1+**: 명시적인 ClassLoader 설정 필요

이는 마이너 버전 업데이트에서 발생한 호환성을 깨는 변경사항이며, 적절한 ClassLoader 관리가 중요한 프레임워크 통합에 영향을 미칩니다.

## 해결 방법

Aspectran은 `ActivityContext`를 통해 자체적으로 관리하는 ClassLoader를 제공합니다. 이를 Hibernate에 명시적으로 전달해야 합니다:

### 수정 전 (7.0.1+에서 오류 발생)

```
java
@Component
@Bean(lazyDestroy = true)
public class DefaultEntityManagerFactory extends EntityManagerFactoryBean {

    @Override
    protected void preConfigure(PersistenceConfiguration configuration) {
        configuration.provider(HibernatePersistenceProvider.class.getName());
        configuration.transactionType(PersistenceUnitTransactionType.RESOURCE_LOCAL);
        configuration.property(JdbcSettings.JAKARTA_NON_JTA_DATASOURCE, dataSource);
        // ClassLoader 설정 누락!
    }
}
```

### 수정 후 (해결됨)

```
java
@Component
@Bean(lazyDestroy = true)
public class DefaultEntityManagerFactory extends EntityManagerFactoryBean {

    @Override
    protected void preConfigure(PersistenceConfiguration configuration) {
        configuration.provider(HibernatePersistenceProvider.class.getName());
        configuration.transactionType(PersistenceUnitTransactionType.RESOURCE_LOCAL);
        configuration.property(JdbcSettings.JAKARTA_NON_JTA_DATASOURCE, dataSource);

        // ✅ 수정: Aspectran의 ClassLoader 제공
        configuration.property(
            EnvironmentSettings.CLASSLOADERS,
            getActivityContext().getClassLoader()
        );
    }
}
```

## 왜 Aspectran의 ClassLoader를 사용해야 하나요?

`Thread.currentThread().getContextClassLoader()` 대신 `getActivityContext().getClassLoader()`를 사용하면 다음과 같은 이점이 있습니다:

1. **프레임워크 일관성**: 모든 Aspectran 빈, 리소스, 엔티티가 동일한 ClassLoader를 사용
2. **적절한 격리**: Aspectran의 모듈식 아키텍처에서 올바르게 작동
3. **핫 리로딩 지원**: Aspectran의 리소스 리로딩 메커니즘과 호환

## 전체 구현

```java
package app.petclinic.common.db;

import com.aspectran.core.component.bean.annotation.Autowired;
import com.aspectran.core.component.bean.annotation.Bean;
import com.aspectran.core.component.bean.annotation.Component;
import com.aspectran.jpa.EntityManagerFactoryBean;
import jakarta.persistence.PersistenceConfiguration;
import jakarta.persistence.PersistenceUnitTransactionType;
import org.hibernate.cfg.EnvironmentSettings;
import org.hibernate.cfg.JdbcSettings;
import org.hibernate.jpa.HibernatePersistenceProvider;

import javax.sql.DataSource;

@Component
@Bean(lazyDestroy = true)
public class DefaultEntityManagerFactory extends EntityManagerFactoryBean {

    private final DataSource dataSource;

    @Autowired
    public DefaultEntityManagerFactory(DataSource dataSource) {
        super("petclinic");
        this.dataSource = dataSource;
    }

    @Override
    protected void preConfigure(PersistenceConfiguration configuration) {
        super.preConfigure(configuration);
        configuration.provider(HibernatePersistenceProvider.class.getName());
        configuration.transactionType(PersistenceUnitTransactionType.RESOURCE_LOCAL);
        configuration.property(JdbcSettings.JAKARTA_NON_JTA_DATASOURCE, dataSource);

        // Hibernate 7.0.1+ 호환성을 위한 필수 설정
        configuration.property(
            EnvironmentSettings.CLASSLOADERS,
            getActivityContext().getClassLoader()
        );
    }
}
```

## 테스트된 버전

- ✅ Aspectran 9.0.2
- ✅ Hibernate 7.0.9.Final - 7.1.2.Final
- ✅ Jakarta EE 10
- ✅ Java 21

## 참고 자료

- [Aspectran PetClinic 데모](https://github.com/aspectran/aspectran-petclinic)
- [Hibernate ORM 7.1 문서](https://docs.jboss.org/hibernate/orm/7.1/)
- [Aspectran 프레임워크](https://aspectran.com/)
