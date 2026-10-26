---
title: Nginx Reverse Proxy and Clustering Guide
subheadline: Aspectow
---

When deploying Aspectow/Aspectran-based web applications to a production environment, it is common to place a reverse proxy web server like Nginx at the front.

This guide provides instructions on how to configure Nginx for reverse proxying, load balancing, SSL application, and performance optimization for Aspectow applications.

## 1. Why Use a Reverse Proxy?

A reverse proxy offers several advantages:

- **Load Balancing**: Distributes traffic across multiple Web Application Servers (WAS) to ensure availability and scalability.
- **Security**: Centralizes SSL/TLS encryption management (SSL Termination) on Nginx, allowing the WAS to be securely located within an internal network.
- **Performance Optimization**: Reduces the load on the WAS by allowing Nginx to handle static resources (images, CSS, JS) directly and improves response times through caching.
- **Flexible Deployment**: Enables flexible URL routing, such as hiding context paths or hosting multiple domains on a single server.

## 2. Choosing a Deployment Strategy

Before configuring Nginx, you need to decide on a deployment strategy. Each strategy has its pros and cons, and the choice depends on your environment's requirements and resources.

#### 1. Single-Instance (Integrated Management) Strategy
This approach involves running multiple applications (contexts) together in a single server instance.
- **Pros**: Saves server resources and allows for centralized management.
- **Suitable for**: Personal projects, demos, or low-spec environments with limited memory or CPU.
- **Guide Section**: [8. Advanced Usage: Multi-Context Routing](#8-advanced-usage-multi-context-routing)

#### 2. Multi-Instance (MSA-Oriented) Strategy
This approach involves deploying each application as an independent server instance and using Nginx to load balance between them.
- **Pros**: Enables independent deployment and scaling for each service, offering high stability and flexibility. It aligns with the fundamental principles of Microservices Architecture (MSA).
- **Suitable for**: Production services that need to handle high traffic and enterprise environments where stability is critical.
- **Guide Section**: [6. Clustering and Load Balancing](#6-clustering-and-load-balancing)

## 3. Basic Reverse Proxy Setup (Single Server)

First, here is a basic reverse proxy setup that connects to a single WAS instance.

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        # WAS server address and port
        proxy_pass http://127.0.0.1:8080;

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
    }
}
```

### Proxy Header Configuration and Defending Against IP Spoofing

Proxy headers must be configured properly so that the WAS accurately recognizes the client's original request details (domain, protocol, and real IP address).

- **`Host $host`**: Forwards the original host domain requested by the client.
- **`X-Forwarded-For $remote_addr`**: Passes the client's actual remote IP address.
- **`X-Forwarded-Proto $scheme`**: Passes the original protocol (`http` or `https`) used by the client. This is essential for the backend to generate secure redirects and absolute URLs.
- **`X-Forwarded-Host $host` / `X-Forwarded-Port $server_port`**: Passes the original host and port number accessed by the client.

#### Why `$remote_addr` is Recommended over `$proxy_add_x_forwarded_for`

In older Nginx templates, `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;` was commonly used by convention. However, in an edge reverse proxy environment where Nginx directly receives external internet traffic, this creates a serious security vulnerability:

1. **Client-Side IP Spoofing**: Malicious scanners or attackers can inject arbitrary headers into their requests, such as `X-Forwarded-For: 127.0.0.1` or internal private network IPs.
2. **Deceptive Header Accumulation**: `$proxy_add_x_forwarded_for` appends the real socket IP after any existing client-supplied header, passing `127.0.0.1, [real_public_ip]` to the backend. If the backend WAS evaluates the first IP in the chain as the client IP, **the attacker can completely bypass IP-whitelist access controls (e.g., admin consoles) with a single forged header**.
3. **Prevention via `$remote_addr`**: In an edge proxy environment, overwriting any incoming header with `$remote_addr` (the actual socket IP observed by Nginx) completely neutralizes header injection attacks.

> 💡 **Note: When Behind Cloudflare, CDNs, or L7 Load Balancers**\
> In a multi-hop architecture where a trusted upstream proxy (CDN/WAF) sits in front of Nginx, Nginx's socket `$remote_addr` will naturally be the upstream proxy's IP.
> In this case, you should use Nginx's `ngx_http_realip_module` to register the trusted proxy CIDR ranges with `set_real_ip_from` and set `real_ip_header CF-Connecting-IP;` (or `X-Forwarded-For`). This restores Nginx's `$remote_addr` variable to the true visitor IP before forwarding `$remote_addr` to the backend.

> 💡 **Note: Concerning the `X-Real-IP` Header**\
> `X-Real-IP` is a non-standard header coined by the Nginx community. Most Java/WAS ecosystems (Aspectran, Undertow, Tomcat, Spring) adhere to the industry standard `X-Forwarded-For`. Passing `X-Forwarded-For $remote_addr;` alone is completely sufficient and eliminates redundant header overhead.

## 4. Core Setting for Aspectran: `X-Forwarded-Path`

If your application is deployed on the WAS with a specific context path like `/myapp`, but you want to access it externally via `your-domain.com/`, you must use the `X-Forwarded-Path` header. This is a unique feature of Aspectran that allows the application to dynamically recognize its context path.

```nginx
location / {
    # Forward to the WAS with the /myapp context path
    proxy_pass http://127.0.0.1:8080/myapp/;

    # Make the Aspectran app recognize the context path as if it were empty
    proxy_set_header X-Forwarded-Path /;

    # Standard proxy headers
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port $server_port;
}
```

## 5. Handling Static Resources

To improve performance, configure Nginx to serve static resources like images, CSS, and JavaScript directly. This significantly reduces the load on the WAS.

```nginx
# For requests to /assets/, find and return files from the actual file system path
location /assets/ {
    # The path where your static resources are located
    root /path/to/your/webapp/static/;

    # Set browser cache duration
    expires 1y;
    access_log off;
    add_header Cache-Control "public";
}
```

## 6. Clustering and Load Balancing

You can group multiple WAS instances using an `upstream` block to set up load balancing.

```nginx
# Define a group of WAS servers for load balancing
upstream backend_servers {
    # Choose an algorithm (default: round-robin)
    # ip_hash; # Hash the client IP to always connect to the same server

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

### Load Balancing Algorithms

The choice of load balancing algorithm is directly related to Aspectran's session clustering settings.

- **round-robin (default)**: Distributes requests to the server group sequentially. This is the most efficient method that ensures high availability, as session information is shared across instances when `clusterEnabled: true` is set in Aspectran's session manager.

- **ip_hash**: A 'Sticky Session' method that sends requests from a specific client IP to the same server every time. If you are not using session clustering (`clusterEnabled: false`), you **must** use this method to maintain session integrity. Otherwise, sessions will be lost when `round-robin` forwards requests to a different server.

> 📌 **Summary**
> - **`clusterEnabled: true` (Recommended):** Use `round-robin`.
> - **`clusterEnabled: false`:** `ip_hash` is mandatory.

## 7. Applying SSL/TLS (HTTPS)

Applying HTTPS for security is essential. You can get free SSL certificates and automate renewals using Let's Encrypt and Certbot.

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    # Certificate paths from Let's Encrypt
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # ... location settings ...
}

# HTTP -> HTTPS redirection
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}
```

## 8. Advanced Usage: Multi-Context Routing

You can run multiple independent web applications (contexts) in a single Aspectow server instance and route them to different domains via Nginx.

#### Use Case

This approach is very useful in resource-constrained environments, such as when a server has less than 1GB of memory, making it difficult to run multiple JVM instances. Instead of launching each application as a separate server instance, you can run multiple contexts (`examples`, `jpetstore`, `petclinic`, etc.) together in a single instance to use resources efficiently.

#### Nginx Configuration Example

This example routes `jpetstore.your-domain.com` to the `/jpetstore` context and `petclinic.your-domain.com` to the `/petclinic` context.

```nginx
# Points to a single Aspectow instance
upstream single_aspectow_instance {
    server 127.0.0.1:8080;
}

# Server block for jpetstore.your-domain.com
server {
    listen 443 ssl;
    server_name jpetstore.your-domain.com;

    # ... SSL settings ...

    location / {
        proxy_pass http://single_aspectow_instance/jpetstore/;
        proxy_set_header X-Forwarded-Path /;
        # ... other headers ...
    }
}

# Server block for petclinic.your-domain.com
server {
    listen 443 ssl;
    server_name petclinic.your-domain.com;

    # ... SSL settings ...

    location / {
        proxy_pass http://single_aspectow_instance/petclinic/;
        proxy_set_header X-Forwarded-Path /;
        # ... other headers ...
    }
}
```

> 💡 **Note: Considerations for MSA Environments**\
> This configuration, as shown in [aspectow-demo](https://github.com/aspectran/aspectow-demo), is a practical example for resource-constrained environments.
> In a real enterprise environment aiming for a Microservices Architecture (MSA), the standard principle is to configure each service (context) as a separate instance to be deployed, scaled, and managed independently.

## 9. Complete Configuration Example

Below is a real-world configuration example for the `jpetstore.aspectran.com` domain.

- **Requirements**:
    - Load balance between two WAS instances (`10.0.0.2`, `10.0.0.3`).
    - The application is deployed on the WAS with the `/jpetstore` context path.
    - The service is accessible externally as `https://jpetstore.aspectran.com` (no context path).
    - Apply HTTPS and handle static resources.

```nginx
# 1. Define the WAS server group
upstream backend-jpetstore {
    # ip_hash; # Use for sticky sessions if needed
    server 10.0.0.2:8080;
    server 10.0.0.3:8080;
}

# 2. Main server (HTTPS)
server {
    listen 443 ssl;
    server_name jpetstore.aspectran.com;

    # SSL certificate settings (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/jpetstore.aspectran.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/jpetstore.aspectran.com/privkey.pem;

    # Handle basic dynamic requests
    location / {
        # Forward to upstream and add the /jpetstore context path
        proxy_pass          http://backend-jpetstore/jpetstore/;
        proxy_http_version  1.1;

        # Core header for Aspectran
        proxy_set_header    X-Forwarded-Path    /;

        # Standard proxy headers (overwriting with $remote_addr to prevent IP spoofing)
        proxy_set_header    Host                $host;
        proxy_set_header    X-Forwarded-For     $remote_addr;
        proxy_set_header    X-Forwarded-Proto   $scheme;
        proxy_set_header    X-Forwarded-Host    $host;
        proxy_set_header    X-Forwarded-Port    $server_port;
    }

    # Example of handling static resources directly
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

# 3. Redirect HTTP to HTTPS
server {
    listen 80;
    server_name jpetstore.aspectran.com;
    return 301 https://$host$request_uri;
}
```
