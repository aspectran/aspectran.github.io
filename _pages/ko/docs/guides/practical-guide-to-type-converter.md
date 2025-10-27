---
title: 커스텀 TypeConverter 실용 가이드
subheadline: 실용 가이드
---

Aspectran은 요청 파라미터(항상 문자열)를 필요한 모든 커스텀 객체 타입으로 변환할 수 있게 해주는 강력한 `TypeConverter` 인터페이스를 제공합니다. 이 가이드에서는 자신만의 커스텀 `TypeConverter`를 만들고, 등록하고, 사용하는 방법을 안내합니다.

`yyyy-MM` 형식의 문자열을 액션 메소드에서 `java.time.YearMonth` 객체로 다루고 싶다고 가정해 보겠습니다.

## 1. 커스텀 TypeConverter 만들기

먼저, `TypeConverter<T>` 인터페이스를 구현하는 클래스를 만듭니다. 제네릭 타입 `T`는 변환하려는 대상 타입이어야 하며, 여기서는 `YearMonth`입니다.

**`YearMonthConverter.java`**
```java
package com.example.converter;

import com.aspectran.core.component.converter.TypeConverter;

import java.time.YearMonth;
import java.time.format.DateTimeParseException;

public class YearMonthConverter implements TypeConverter<YearMonth> {

    @Override
    public YearMonth convert(String src) {
        if (src == null) {
            return null;
        }
        try {
            // 핵심 변환 로직
            return YearMonth.parse(src);
        } catch (DateTimeParseException e) {
            // 변환 실패 시 특정 예외를 다시 던지는 것이 좋지만,
            // 여기서는 간단하게 null을 반환합니다.
            return null;
        }
    }

}
```

## 2. 커스텀 컨버터 등록하기

Aspectran이 새로운 컨버터를 인식하게 하려면 등록 과정이 필요합니다. 권장하는 방법은 `TypeConverterRegistrationBean`을 상속받는 설정 컴포넌트를 만드는 것입니다.

`TypeConverterRegistrationBean`을 상속하면, 여러분의 컴포넌트는 자동으로 `ActivityContextAware`가 되어 변환기를 등록할 수 있는 기능을 갖게 됩니다. 그 다음, `@Initialize` 애너테이션이 붙은 메소드 안에서 상속받은 `register()` 메소드를 호출하여 커스텀 변환기를 등록할 수 있습니다.

**`ConverterConfiguration.java`**
```java
package com.example.config;

import com.aspectran.core.component.bean.annotation.Component;
import com.aspectran.core.component.bean.annotation.Initialize;
import com.aspectran.core.component.converter.TypeConverterRegistrationBean;
import com.example.converter.YearMonthConverter;

import java.time.YearMonth;

@Component
public class ConverterConfiguration extends TypeConverterRegistrationBean {

    @Initialize
    public void registerConverters() {
        // 'register' 메소드는 TypeConverterRegistrationBean으로부터 상속받았습니다.
        register(YearMonth.class, new YearMonthConverter());
    }

}
```

이때, 해당 패키지(`com.example.config`)가 메인 Aspectran 설정의 컴포넌트 스캔 경로에 포함되어 있는지 확인해야 합니다.


## 3. 액션 메소드에서 사용하기

이제 모든 준비가 끝났습니다! 이제 애너테이션 기반 액션 메소드에서 `YearMonth`를 파라미터로 직접 사용할 수 있습니다. Aspectran은 자동으로 `YearMonthConverter`를 찾아 변환을 수행합니다.

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
        // 요청이 /reports/monthly?month=2025-10 이라면,
        // 'month' 파라미터는 2025-10 값을 가진 YearMonth 객체가 됩니다.
        return "월간 보고서: " + month.toString();
    }

}
```

이 단계를 따르면, 애플리케이션에 필요한 모든 커스텀 타입을 지원하도록 Aspectran의 데이터 바인딩 기능을 쉽게 확장하여 코드를 더 깔끔하고 타입-세이프하게 만들 수 있습니다.
