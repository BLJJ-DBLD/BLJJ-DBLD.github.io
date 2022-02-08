---
title: HTTP-进阶篇
tags:
  - null
categories:
  - HTTP
hidden: true
abbrlink: 3929373619
date: 2022-02-07 16:46:17
---

# HTTP 状态码

- 1xx 信息性状态码 websocket upgrade
- 2xx 成功状态
  - 200 服务器已成功处理了请求
  - 204 没有响应体
  - 206 范围请求，暂停继续下载
- 3xx 
  > 服务器会在响应 `Header` 的 `Location` 字段中放上这个不同的 `URI`。浏览器可以使用 `Location` 中的 `URI` 进行自动重定向。
  - 301(永久) 请求的页面已永远跳转到新的 url
  - 302(临时) 允许各种各样的重定向，一般情况下都会实现为到 `GET` 的重定向，但是不能确保 `POST` 会重定向到 `POST`
  - 303(临时) 只允许任意请求到 `GET` 的重定向
  - 304 内容未修改，只返回请求头部信息
  - 307(临时) `307` 和 `302` 一样，除了不允许 `POST` 到 `GET` 的重定向
  - 308(永久) `308` 和 `301` 一样，除了不允许 `POST` 到 `GET` 的重定向
- 4xx 客户端错误状态码
  - 400 客户端参数错误
  - 401 没有登录
  - 403 登录了没权限，比如管理系统
  - 404 页面不存在
  - 405 禁用请求中指定的方法
- 5xx 服务端错误状态码
  - 500 服务器内部错误，无法完成请求
  - 502 错误网关，服务器作为网关或代理出现错误
  - 503 服务不可用，服务器目前无法使用
  - 504 网关超时，网关或代理服务器，未及时获取请求

#### 总结 302、303、307 (临时)重定向

`302` 允许各种各样的重定向，一般情况下都会实现为到 `GET` 的重定向，但是不能确保 `POST` 会重定向为 `POST`；
而 `303` 只允许任意请求到 `GET` 的重定向；
`307` 和 `302` 一样，除了不允许 `POST` 到 `GET` 的重定向。

#### 总结 301、308 (永久)重定向

`308` 的定义实际上和 `301` 是一致的，唯一的区别在于，`308` 状态码不允许浏览器将原本为 `POST` 的请求重定向到 `GET` 请求上。

#### 总结临时重定向与永久重定向对 SEO 的影响

`302` 重定向只是暂时的重定向，搜索引擎会抓取新的内容而保留旧的地址，因为服务器返回 `302`，所以，**搜索搜索引擎认为新的网址是暂时的**。
而 `301` 重定向是永久的重定向，搜索引擎在抓取新的内容的同时 **也将旧的网址替换为了重定向之后的网址**。

# HTTP前生今世

| 协议版本 | 解决核心问题 | 解决方式 |
| :--: | :--: | :--: |
| 0.9 | HTML 文件传输 | 确立了客户端请求、服务端响应的通信流程 |
| 1.0 | 不同类型文件传输 | 设立头部字段 |
| 1.1 | 创建 / 断开 TCP 连接开销大 | 建立长连接进行复用 |
| 2 | 并发数有限 | 二进制分帧 |
| 3 | TCP 丢包阻塞 | 采用 UDP 协议 |

- HTTP 协议始于三十年前蒂姆·伯纳斯 - 李的一篇论文
- HTTP/0.9 是个简单的文本协议，只能获取文本资源；
- HTTP/1.0 确立了大部分现在使用的技术，但它不是正式标准；
- HTTP/1.1 是目前互联网上使用最广泛的协议，功能也非常完善；
- HTTP/2 基于 Google 的 SPDY 协议，注重性能改善，但还未普及；
- HTTP/3 基于 Google 的 QUIC 协议，是将来的发展方向

# HTTP 的优缺点

> 超文本传输协议，HTTP 是一个在计算机世界里专门在两点之间传输文字、图片、音频、视频等超文本数据的约定和规范

特点：
- **灵活可扩展**。一个是语法上只规定了基本格式，空格分隔单词，换行分隔字段等。另外一个就是传输形式上不仅可以传输文本，还可以传输图片、视频等任意数据
- **请求-应答模式**。通常而言，就是一方发送消息，另外一方要接受消息，或者是做出响应等
- **可靠传输**。HTTP 是基于 TCP/IP，因此把这一特性继承下来了。
- **无状态**。这个分场景说明。
  - 是好事儿：无状态会减少网络开销，比如直播行业
  - 是坏事儿：有时需要保存信息，比如购物系统，登录系统

缺点：
- **明文传输**。协议里的报文（主要指的是头部）不使用二进制数据，而是文本形式。这让 HTTP 的报文信息暴露给了外界，给攻击者带来了便利。
- **队头阻塞**。当 HTTP 开启长连接时，共用一个 `TCP` 连接，当某个请求时间过长时，其他的请求只能处于阻塞状态，这就是队头阻塞问题。

### HTTP 无状态连接

- `HTTP` 协议对于事务处理没有记忆能力
- 对同一个 `url` 请求没有上下文关系
- 每次的请求都是独立的，它的执行情况和结果与前面的请求和之后的请求是无直接关系的，它不会受前面的请求应答情况直接影响，也不会直接影响后面的请求应答情况
- 服务器中没有保存客户端的状态，客户端必须每次带上自己的状态去请求服务器
- 请求过的资源，下一次会继续进行请求

### HTTP 协议无状态中的 “状态” 到底指的是什么？

- 【状态】 的含义就是：客户端与服务端在某次会话产生的数据
- 那么对应的 【无状态】 就意味着：这些数据不会被保留
- 通过增加 `cookie` 和 `session` 机制，现在的网络请求是有状态的
- 在没有状态的 `HTTP` 协议下，服务器也一定会保留你每次网络请求对数据的修改，但这跟保留每次访问的数据是不一样的，保留的只是会话产生的结果，而没有保留会话。

# HTTP 的请求方式

- `HTTP/1.0` 定义了三种请求方式：`GET`、`POST` 和 `HEAD` 方法
- `HTTP/1.1` 新增了五种请求方法：`OPTIONS`、`PUT`、`DELETE`、`TRACE` 和 `CONNECT`

`HTTP/1.1` 规定了以下请求方法（注意，都是大写）：
- `GET`：请求获取 `Request-URI` 所标识的资源
- `POST`：在 `Request-URI` 所标识的资源后附加新的数据
- `HEAD`：请求获取 `Request-URI` 所标识的资源的响应消息报头
- `PUT`：请求服务器存储一个资源，并用 `Request-URI` 作为其标识（修改数据）
- `DELETE`：请求服务器删除对应标识的资源
- `TRACE`：请求服务器回送收到的请求信息，主要用于测试与诊断
- `CONNECT`：建立连接隧道，用于代理服务器
- `OPTIONS`：列出可对资源实行的请求方式，用来跨域请求

> 从应用场景角度来看，`GET` 多用于无副作用，幂等的场景，例如搜索关键字。`POST` 多用于副作用，不幂等的场景，例如注册

### URI，Request-URI and URL 区分

I know URL is a subset of URI
http://www.example.org:56789/a/b/c.txt?t=win&s=chess#para5 is a URL and also a URI
every address we type in browsers can be called URL
http://www.example.org:56789/ is also a URI
the part: `a/b/c.txt?t=win&s=chess` is request-URI
the part: `para5` does not belong to the request-URI is just a fragment

## OPTIONS 方法有什么用

- `OPTIONS` 请求与 `HEAD` 类似，一般也用于客户端查看服务器的性能
- `OPTIONS` 方法请求服务器会返回该资源所支持的所有 `HTTP` 请求方法，该方法会用 “*” 来代替资源名称，向服务器发送 `OPTIONS` 请求，可以测试服务器功能是否正常
- JS 的 `XMLHttpRequest` 对象进行 CORS 跨域资源共享时，对于**复杂请求**，就是使用 `OPTIONS` 方法发送嗅探请求，以判断是否有对指定资源的访问权限。

### 简单请求和复杂请求

在日常的开发中，经常会遇到跨域资源共享，或者进行跨域接口访问的情况。跨域资源共享（[CORS](https://developer.mozilla.org/zh-CN/docs/Glossary/CORS)）机制允许 Web 应用服务器进行跨域访问控制。

> 跨域资源共享标准新增了一组 `HTTP` 首部字段，允许服务器声明哪些源站通过浏览器有权限访问哪些资源。另外，规范要求，对那些可能对服务器数据产生副作用的 `HTTP` 请求方法（特别是 `GET` 以外的 `HTTP` 请求，或者**搭配某些 `MIME 类型` 的 `POST` 请求**），浏览器必须首先使用 `OPTIONS` 方法发起一个 `预检请求（preflight request）`，从而获知服务端是否允许该跨域请求。服务器确认允许之后，才发起实际的 `HTTP` 请求。在预检请求的返回中，服务器端也可以通知客户端，是否需要携带身份凭证（包括 `Cookies` 和 `HTTP` 认证相关数据）。

在涉及到 `CORS` 的请求中，我们会把请求分为 **简单请求** 和 **复杂请求**

#### 简单请求

满足以下条件的请求即为简单请求：
- 请求方法：`GET`、`POST`、`HEAD`
- 除了以下的请求头字段之外，没有自定义的请求头
  - Accept
  - Accept-Language
  - Content-Language
  - Content-Type
  - DPR
  - Downlink
  - Save-Data
  - Viewport-Width
  - Width
- `Content-Type` 的值只有以下三种(`Content-Type` 一般是指在 `POST` 请求中，`GET` 请求中设置没有实际意义)
  - text/plain
  - multipart/form-data
  - application/x-www-form-urlencoded

#### 复杂请求

非简单请求即为复杂请求。复杂请求我们也可以称之为在实际进行请求之前，需要发起预检请求的请求。

#### 简单请求与复杂请求的跨域设置

针对简单请求，在进行 `CORS` 设置的时候，我们只需要设置

``` http
Access-Control-Allow-Origin: *
// 如果只是针对某一个请求源进行设置的话，可以设置为具体的值
Access-Control-Allow-Origin: http://www.yourwebsite.com
```

针对复杂请求，我们需要设置不同的响应头。因为在预检请求的时候会携带相应的请求头信息

``` http
Access-Control-Request-Method: POST
Access-Control-Request-Headers: X-CUSTOMER-HEADER, Content-Type
```

相应的响应头信息为：

``` http
Access-Control-Allow-Origin: http://foo.example
Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Allow-Headers: X-PINGOTHER, Content-Type
// 设置max age，浏览器端会进行缓存。没有过期之前真对同一个请求只会发送一次预检请求
Access-Control-Max-Age: 86400
```

如果发送的预检请求被进行了重定向，那大多数的浏览器都不支持对预检请求的重定向。我们可以通过先发送一个简单请求的方式，获取到重定向的url XHR.responseURL，然后再去请求这个url。

#### 附带身份凭证的请求

一般而言，对于跨域 `XMLHttpRequest` 或 `Fetch` 请求，浏览器不会发送身份凭证信息。如果要发送凭证信息，需要设置 `XMLHttpRequest` 的某个特殊标志位。
如果在发送请求的时候，给 `xhr` 设置了 `withCredentials` 为 true，从而向服务器发送 `Cookies`，如果服务端需要想客户端也发送 `Cookies` 的情况，需要服务器端也返回 `Access-Control-Allow-Credentials: true` 响应头信息。

对于附带身份凭证的请求，服务器不得设置 `Access-Control-Allow-Origin` 的值为“*”。

这是因为请求的首部中携带了 `Cookie` 信息，如果 `Access-Control-Allow-Origin` 的值为“*”，请求将会失败。而将 `Access-Control-Allow-Origin` 的值设置为 http://foo.example（请求源），则请求将成功执行。

## GET 和 POST 的区别

本质上，只是语义上的区别，`GET` 用于获取资源，`POST` 用于提交资源

具体差别
- 从缓存角度，`GET` 请求后浏览器会主动缓存，`POST` 默认情况下不能。
- 从参数角度，`GET` 请求内容一般放在 `URL` 中，因此不安全；`POST` 请求内容放在请求体中，相对而言较为安全，但是抓包情况下都是一样的。
- 从编码角度，`GET` 请求只能进行 URL 编码，只能接受 ASCII 码；而 `POST` 支持更多的编码类型且不对数据类型限制
- `GET` 请求幂等，`POST` 请求不幂等。
  - 幂等：指发送 M 和 N 次请求（两者不相同且都大于1），服务器上资源的状态一致
- `GET` 请求会一次性发送请求报文，`POST` 请求通常分为两个 `TCP` 数据包，首先发送 `header` 部分，如果服务器响应 100(comtinue)，然后发送 `body` 部分

# 队头阻塞问题

