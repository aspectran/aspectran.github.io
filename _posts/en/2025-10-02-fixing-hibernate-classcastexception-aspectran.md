---
subheadline: Releases
title: Fixing ClassCastException in Hibernate 7.0.1+ with Aspectran
teaser: How to resolve ClassLoader issues when integrating Hibernate 7.0.1+ with the Aspectran Framework
categories:
  - news
tags:
  - Aspectran
  - Hibernate
  - JPA
  - ClassLoader
published: true
---

## The Problem

While upgrading the [Aspectran PetClinic Demo](https://github.com/aspectran/petclinic) from Hibernate 7.0.0.Final to 7.1.2.Final, we encountered this error:

```
java.lang.ClassCastException: class app.petclinic.owner.Owner cannot be cast to
class app.petclinic.owner.Owner (app.petclinic.owner.Owner is in unnamed module
of loader 'app'; app.petclinic.owner.Owner is in unnamed module of loader 'root')
at app.petclinic.owner.OwnerDao.findById(OwnerDao.java:100)
```

The same class cannot be cast to itself? This indicates a **ClassLoader mismatch** - the JVM sees two versions of the same class loaded by different ClassLoaders.

## Root Cause

**Hibernate 7.0.1+ no longer automatically detects the Thread Context ClassLoader.**

- ✅ **Hibernate 7.0.0.Final**: Automatically uses Context ClassLoader
- ❌ **Hibernate 7.0.1+**: Requires explicit ClassLoader configuration

This is a breaking change in a minor version update, and it affects framework integrations where proper ClassLoader management is crucial.

## The Solution

Aspectran provides its own managed ClassLoader through `ActivityContext`. We need to explicitly pass this to Hibernate:

### Before (Broken in 7.0.1+)

```java
@Component
@Bean(lazyDestroy = true)
public class DefaultEntityManagerFactory extends EntityManagerFactoryBean {

    @Override
    protected void preConfigure(PersistenceConfiguration configuration) {
        configuration.provider(HibernatePersistenceProvider.class.getName());
        configuration.transactionType(PersistenceUnitTransactionType.RESOURCE_LOCAL);
        configuration.property(JdbcSettings.JAKARTA_NON_JTA_DATASOURCE, dataSource);
        // Missing ClassLoader configuration!
    }
}
```

### After (Fixed)

```java
@Component
@Bean(lazyDestroy = true)
public class DefaultEntityManagerFactory extends EntityManagerFactoryBean {

    @Override
    protected void preConfigure(PersistenceConfiguration configuration) {
        configuration.provider(HibernatePersistenceProvider.class.getName());
        configuration.transactionType(PersistenceUnitTransactionType.RESOURCE_LOCAL);
        configuration.property(JdbcSettings.JAKARTA_NON_JTA_DATASOURCE, dataSource);

        // ✅ The fix: Provide Aspectran's ClassLoader
        configuration.property(
            EnvironmentSettings.CLASSLOADERS,
            getActivityContext().getClassLoader()
        );
    }
}
```

## Why Aspectran's ClassLoader?

Using `getActivityContext().getClassLoader()` instead of `Thread.currentThread().getContextClassLoader()` provides:

1. **Framework Consistency**: All Aspectran beans, resources, and entities use the same ClassLoader
2. **Proper Isolation**: Works correctly in Aspectran's modular architecture
3. **Hot Reloading Support**: Compatible with Aspectran's resource reloading mechanisms

## Complete Implementation

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

        // Essential for Hibernate 7.0.1+ compatibility with Aspectran
        configuration.property(
            EnvironmentSettings.CLASSLOADERS,
            getActivityContext().getClassLoader()
        );
    }
}
```

## Tested Versions

- ✅ Aspectran 9.0.2
- ✅ Hibernate 7.0.0.Final - 7.1.2.Final
- ✅ Jakarta EE 10
- ✅ Java 21

## References

- [Aspectran PetClinic Demo](https://github.com/aspectran/petclinic)
- [Hibernate ORM 7.1 Documentation](https://docs.jboss.org/hibernate/orm/7.1/)
- [Aspectran Framework](https://aspectran.com/)
