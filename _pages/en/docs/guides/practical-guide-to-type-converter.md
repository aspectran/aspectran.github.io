---
title: Practical Guide to Custom Type Converters
subheadline: Practical Guides
---

# Practical Guide to Custom Type Converters

Aspectran provides a powerful `TypeConverter` interface that allows you to convert incoming request parameters (which are always strings) into any custom object type you need. This guide will walk you through how to create, register, and use your own custom `TypeConverter`.

Let's say you want to handle `yyyy-MM` formatted strings as `java.time.YearMonth` objects in your action methods.

## 1. Create a Custom TypeConverter

First, create a class that implements the `TypeConverter<T>` interface. The generic type `T` should be the target type you want to convert to, which is `YearMonth` in our case.

**`YearMonthConverter.java`**
```java
package com.example.converter;

import com.aspectran.core.activity.Activity;
import com.aspectran.core.context.converter.TypeConverter;

import java.lang.annotation.Annotation;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;

public class YearMonthConverter implements TypeConverter<YearMonth> {

    @Override
    public YearMonth convert(String value, Annotation[] annotations, Activity activity) {
        if (value == null) {
            return null;
        }
        try {
            // The core conversion logic
            return YearMonth.parse(value);
        } catch (DateTimeParseException e) {
            // It's good practice to re-throw a specific exception if conversion fails,
            // but for simplicity, we'll return null here.
            return null;
        }
    }

}
```

## 2. Register Your Custom Converter

For Aspectran to recognize your new converter, you need to register it with the `TypeConverterRegistry` when the application starts. The easiest way to do this is to use the `@Component` and `@Initialize` annotations.

Simply add the annotations to your initializer class. Aspectran's component scanner will automatically detect it, create it as a singleton bean, and run the `initialize()` method upon startup.

**`CustomConverterInitializer.java`**
```java
package com.example.app;

import com.aspectran.core.component.bean.annotation.Component;
import com.aspectran.core.component.bean.annotation.Initialize;
import com.aspectran.core.context.converter.TypeConverterRegistry;
import com.example.converter.YearMonthConverter;

import java.time.YearMonth;

@Component
public class CustomConverterInitializer {

    @Initialize
    public void initialize() {
        // Register YearMonthConverter for the YearMonth class
        TypeConverterRegistry.register(YearMonth.class, new YearMonthConverter());
    }

}
```

Make sure that the package (`com.example.app` in this case) is included in the component scan paths in your main Aspectran configuration.

## 3. Use it in Your Action Methods

That's it! Now you can use `YearMonth` directly as a parameter in your annotated action methods. Aspectran will automatically find and use your `YearMonthConverter` to perform the conversion.

**`MyActivity.java`**
```java
package com.example.activity;

import com.aspectran.core.component.bean.annotation.Component;
import com.aspectran.core.component.bean.annotation.Request;
import com.aspectran.core.component.bean.annotation.Param;

import java.time.YearMonth;

@Component
public class MyActivity {

    @Request("/reports/monthly")
    public String getMonthlyReport(@Param("month") YearMonth month) {
        // If the request is /reports/monthly?month=2025-10,
        // the 'month' parameter will be a YearMonth object with the value 2025-10.
        return "Report for " + month.toString();
    }

}
```

By following these steps, you can easily extend Aspectran's data binding capabilities to support any custom types your application requires, making your code cleaner and more type-safe.
