---
format: plate solid article
title: Nginx 리버스 프록시 및 클러스터링 가이드
teaser: 이 가이드는 Nginx를 사용하여 Aspectow 애플리케이션을 위한 리버스 프록시 설정, 로드 밸런싱, SSL 적용 및 성능 최적화 방법을 안내합니다.
sidebar: toc
---

Aspectow/Aspectran 기반의 웹 애플리케이션을 실제 운영 환경에 배포할 때는 Nginx와 같은 리버스 프록시 웹 서버를 앞단에 두는 것이 일반적입니다. 이 가이드는 Nginx를 사용하여 Aspectow 애플리케이션을 위한 리버스 프록시 설정, 로드 밸런싱, SSL 적용 및 성능 최적화 방법을 안내합니다.

## 1. 왜 리버스 프록시를 사용해야 하는가?

리버스 프록시를 사용하면 다음과 같은 장점을 얻을 수 있습니다.

- **로드 밸런싱**: 여러 대의 WAS(Web Application Server)로 트래픽을 분산하여 가용성과 확장성을 확보합니다.
- **보안**: SSL/TLS 암호화를 Nginx에서 중앙 관리(SSL Termination)하고, WAS는 내부 네트워크에 안전하게 위치시킬 수 있습니다.
- **성능 최적화**: 정적 리소스(이미지, CSS, JS)를 Nginx가 직접 처리하게 하여 WAS의 부담을 줄이고, 캐싱을 통해 응답 속도를 향상시킬 수 있습니다.
- **유연한 배포**: 컨텍스트 경로를 숨기거나, 여러 도메인을 단일 서버에서 호스팅하는 등 유연한 URL 라우팅이 가능합니다.

## 2. 배포 전략 선택

Nginx를 구성하기 전에, 어떤 배포 전략을 사용할지 결정해야 합니다. 각 전략은 장단점이 있으며, 운영 환경의 요구사항과 리소스에 따라 선택이 달라집니다.

#### 1. 단일 인스턴스 (통합 관리) 전략
하나의 서버 인스턴스에서 여러 애플리케이션(컨텍스트)을 함께 실행하는 방식입니다.
- **장점**: 서버 리소스를 아낄 수 있으며, 관리가 단일 지점에서 이루어집니다.
- **적합한 환경**: 개인 프로젝트, 데모, 또는 메모리나 CPU가 제한적인 저사양 환경.
- **가이드 섹션**: [8. 고급 활용: 다중 컨텍스트 라우팅](#8-고급-활용-다중-컨텍스트-라우팅)

#### 2. 다중 인스턴스 (MSA 지향) 전략
각 애플리케이션을 독립된 서버 인스턴스로 배포하고, Nginx가 이들을 묶어 로드 밸런싱하는 방식입니다.
- **장점**: 서비스별 독립적인 배포와 확장이 가능하여 안정성과 유연성이 높습니다. 마이크로서비스 아키텍처(MSA)의 기본 원칙에 부합합니다.
- **적합한 환경**: 높은 트래픽을 처리해야 하는 상용 서비스, 안정성이 중요한 기업 환경.
- **가이드 섹션**: [6. 클러스터링과 로드 밸런싱](#6-클러스터링과-로드-밸런싱)

## 3. 기본 리버스 프록시 설정 (단일 서버)

가장 먼저, 단일 WAS 인스턴스에 연결하는 간단한 리버스 프록시 설정입니다.

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        # WAS 서버 주소와 포트
        proxy_pass http://127.0.0.1:8080;

        # 표준 프록시 헤더 설정
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 4. Aspectran을 위한 핵심 설정: `X-Forwarded-Path`

만약 WAS에 애플리케이션이 `/myapp`과 같은 특정 컨텍스트 경로로 배포되었지만, 외부에서는 `your-domain.com/`으로 접근하게 하고 싶다면 `X-Forwarded-Path` 헤더를 사용해야 합니다. 이는 Aspectran의 고유 기능으로, 애플리케이션이 자신의 컨텍스트 경로를 동적으로 인식하게 해줍니다.

```nginx
location / {
    # WAS에는 /myapp 컨텍스트 경로를 붙여서 전달
    proxy_pass http://127.0.0.1:8080/myapp/;

    # Aspectran 앱에게는 컨텍스트 경로가 없는 것처럼 인식시킴
    proxy_set_header X-Forwarded-Path /;

    # --- 기타 표준 헤더 ---
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## 5. 정적 리소스 처리

성능 향상을 위해 이미지, CSS, JavaScript와 같은 정적 리소스는 Nginx가 직접 처리하도록 설정합니다. 이렇게 하면 WAS의 부하가 크게 줄어듭니다.

```nginx
# /assets/ 경로의 요청은 실제 파일 시스템 경로에서 찾아 반환
location /assets/ {
    # 실제 정적 리소스가 위치한 경로
    root /path/to/your/webapp/static/;

    # 브라우저 캐시 기간 설정
    expires 1y;
    access_log off;
    add_header Cache-Control "public";
}
```

## 6. 클러스터링과 로드 밸런싱

`upstream` 블록을 사용하여 여러 대의 WAS를 하나의 그룹으로 묶고, 로드 밸런싱을 설정할 수 있습니다.

```nginx
# 로드 밸런싱할 WAS 서버 그룹 정의
upstream backend_servers {
    # 알고리즘 선택 (기본값: round-robin)
    # ip_hash; # 클라이언트 IP를 해시하여 항상 같은 서버로 연결

    server 10.0.0.2:8080;
    server 10.0.0.3:8080;
}

server {
    # ...
    location / {
        proxy_pass http://backend_servers/myapp/;
        proxy_set_header X-Forwarded-Path /;
        # ...
    }
}
```

### 로드 밸런싱 알고리즘

로드 밸런싱 알고리즘 선택은 Aspectran의 세션 클러스터링 설정과 직접적인 관련이 있습니다.

- **round-robin (기본)**: 요청을 서버 그룹에 순서대로 분배합니다. Aspectran의 세션 관리자 설정에서 `clusterEnabled: true`로 지정하면 세션 정보가 인스턴스 간에 공유되므로, 이 방식이 가장 효율적이고 높은 가용성을 보장합니다.

- **ip_hash**: 클라이언트의 IP 주소를 기반으로 특정 서버에만 요청을 보내는 'Sticky Session' 방식입니다. 만약 `clusterEnabled: false`로 세션 클러스터링을 사용하지 않는다면, 세션 유지를 위해 반드시 이 방식을 사용해야 합니다. 그렇지 않으면 `round-robin`으로 요청이 다른 서버에 전달될 때 세션을 잃게 됩니다.

> **요약:**
> - **`clusterEnabled: true` (권장):** `round-robin` 사용.
> - **`clusterEnabled: false`:** `ip_hash` 사용 필수.

## 7. SSL/TLS 적용 (HTTPS)

보안을 위해 HTTPS를 적용하는 것은 필수입니다. Let's Encrypt와 Certbot을 사용하면 무료로 SSL 인증서를 발급받고 자동으로 갱신할 수 있습니다.

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    # Let's Encrypt로 발급받은 인증서 경로
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # ... location 설정 ...
}

# HTTP -> HTTPS 리디렉션
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}
```

## 8. 고급 활용: 다중 컨텍스트 라우팅

하나의 Aspectow 서버 인스턴스에서 여러 개의 독립된 웹 애플리케이션(컨텍스트)을 운영하고, Nginx를 통해 각기 다른 도메인으로 라우팅할 수 있습니다.

#### 사용 사례

이 방식은 서버의 메모리가 1GB 미만으로 제한되는 등, 여러 개의 JVM 인스턴스를 실행하기 어려운 환경에서 매우 유용합니다. 각 애플리케이션을 별도의 서버 인스턴스로 띄우는 대신, 단일 인스턴스 내에서 여러 컨텍스트(`demo`, `jpetstore`, `petclinic` 등)를 함께 실행하여 리소스를 효율적으로 사용할 수 있습니다.

#### Nginx 설정 예시

`jpetstore.your-domain.com`은 `/jpetstore` 컨텍스트로, `petclinic.your-domain.com`은 `/petclinic` 컨텍스트로 라우팅하는 예시입니다.

```nginx
# 단일 Aspectow 인스턴스를 가리킴
upstream single_aspectow_instance {
    server 127.0.0.1:8080;
}

# jpetstore.your-domain.com 서버 블록
server {
    listen 443 ssl;
    server_name jpetstore.your-domain.com;

    # ... SSL 설정 ...

    location / {
        proxy_pass http://single_aspectow_instance/jpetstore/;
        proxy_set_header X-Forwarded-Path /;
        # ... 기타 헤더 ...
    }
}

# petclinic.your-domain.com 서버 블록
server {
    listen 443 ssl;
    server_name petclinic.your-domain.com;

    # ... SSL 설정 ...

    location / {
        proxy_pass http://single_aspectow_instance/petclinic/;
        proxy_set_header X-Forwarded-Path /;
        # ... 기타 헤더 ...
    }
}
```

> **참고: MSA 환경에서의 고려사항**
>
> `aspectow-demo`에서 보여주는 이 구성은 리소스 제약 환경을 위한 실용적인 예시입니다.
> 실제 엔터프라이즈 환경에서 마이크로서비스 아키텍처(MSA)를 지향한다면, 각 서비스(컨텍스트)는 독립적으로 배포, 확장, 관리될 수 있도록 별도의 인스턴스로 구성하는 것이 일반적인 원칙입니다.

## 9. 전체 설정 예시

아래는 `jpetstore.aspectran.com` 도메인에 대한 실제 운영 설정 예시입니다.

- **요구사항**:
    - 2대의 WAS(`10.0.0.2`, `10.0.0.3`)로 로드 밸런싱
    - WAS에는 `/jpetstore` 컨텍스트로 배포되어 있음
    - 외부에는 `https://jpetstore.aspectran.com`으로 서비스 (컨텍스트 경로 없음)
    - HTTPS 적용 및 정적 리소스 처리

```nginx
# 1. WAS 서버 그룹 정의
upstream backend-jpetstore {
    # ip_hash; # 필요시 Sticky Session 사용
    server 10.0.0.2:8080;
    server 10.0.0.3:8080;
}

# 2. 메인 서버 (HTTPS)
server {
    listen 443 ssl;
    server_name jpetstore.aspectran.com;

    # SSL 인증서 설정 (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/jpetstore.aspectran.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/jpetstore.aspectran.com/privkey.pem;

    # 기본 동적 요청 처리
    location / {
        # upstream으로 요청 전달 및 /jpetstore 컨텍스트 경로 추가
        proxy_pass          http://backend-jpetstore/jpetstore/;
        proxy_http_version  1.1;

        # Aspectran을 위한 핵심 헤더
        proxy_set_header    X-Forwarded-Path    /;

        # 표준 프록시 헤더
        proxy_set_header    Host                $host;
        proxy_set_header    X-Real-IP           $remote_addr;
        proxy_set_header    X-Forwarded-For     $proxy_add_x_forwarded_for;
        proxy_set_header    X-Forwarded-Proto   $scheme;
    }

    # 정적 리소스 직접 처리 예시
    location = /favicon.ico {
        alias  /home/aspectran/aspectow-demo/app/webapps/jpetstore/favicon.ico;
        access_log     off;
        log_not_found  off;
    }

    location /assets/ {
        root  /home/aspectran/aspectow-demo/app/webapps/jpetstore/;
        expires 1y;
        access_log off;
        add_header Cache-Control "public";
    }
}

# 3. HTTP를 HTTPS로 리디렉션
server {
    listen 80;
    server_name jpetstore.aspectran.com;
    return 301 https://$host$request_uri;
}
```