---
title: P3 React 脚手架
tags: []
categories:
  - React
abbrlink: 3934457119
date: 2021-12-07 05:59:49
---

# 为什么要工程化？

现代的前端项目已经越来越复杂了：

- 不会再是 HTML 中引入几个 CSS 文件，引入几个编写好的 JS 文件或者第三方 JS 文件这么简单了；
- 比如现在，CSS 会可能使用 Less、Sass 等预处理器编写，我们需要将它们转换成普通的 CSS 才能被浏览器解析；
- 比如 JavaScript 代码不再是编写在几个文件中，而是通过模块化的方式，被组成成百上千个文件中，我们需要通过模块化的技术来管理它们之间的互相依赖；
- 比如项目中需要依赖很多的第三方库，如何更好，更有效的管理它们（比如管理它们的依赖，版本升级等）

为了解决上面这些问题，我们需要去学习一些工具：

- 比如 babel、webpack、gulp。配置它们转换规则、打包依赖、热更新等一些内容
- **脚手架的出现，就是为了帮助我们解决这一系列问题的；**

# 安装 `nodejs`

React 脚手架本身需要依赖 nodejs，所以我们需要安装 nodejs 环境（[下载官网](https://nodejs.org/en/download/)）

> 注意：推荐大家下载 LTS(Long-term support) 版本，是长期支持版本，比较稳定。

下载后，傻瓜式安装即可

1. 安装过程中，会自动的配置环境变量；
2. 安装的同时，会帮助我们安装 npm 包管理工具；

> 如果想对 npm 的全局下载做更改，可以查阅[这里](https://note.youdao.com/web/#/file/WEBa83ec839683f782059fd96ed61b193ab/markdown/WEB54476253d9412bc767fe6c016017b5ca/)

# 包管理工具

1. 什么是 `npm`?

- 全称是 Node Package Manager，即“node包管理工具”；
- 作用就是帮助我们管理依赖的工具包（比如 react、react-dom、axios、babel、webpack 等）；

2. 另外还有一个鼎鼎大名的 node 包管理工具 yarn：

- Yarn 是由 Facebook、Google、Exponent 和 Tilde 联合推出的一个新的 JS 包管理工具；
- Yarn 的出现是为了弥补 npm 的一些缺陷而存在；
    - 早期的 npm 存在诸多缺陷，比如安装依赖速度缓慢、版本管理混乱等一系列问题
    - 虽然从 npm5 版本开始，进行了很多的升级和改进，但是依然有很多人喜欢使用 yarn
- React 脚手架默认也是使用 yarn；
- 安装 yarn 也是很简单的：`npm install -g yarn`，就可以在全局安装 yarn 了。

3. 在国内，有可能因为墙的问题，导致某些包无法正常的下载安装，这时我们就可以选择使用 taobao 源；

- 更改源的操作有很多种，这里，我建议在 yarn 中采用 `yrm` 来对源进行统一的管理，在 npm 中也存在类似的管理工具 `nrm`
- 常使用的命令有：
    - 查看所有的源 & 目前使用的源：`yrm ls`
    - 使用某一源：`yrm use <镜像名称，例如：taobao>`

# 通过 `create-react-app` 创建一个 `React` 项目

创建命令：`create-react-app <项目名称>`

> 注意：项目名称只能是英文 & 不允许有大写字母

从项目根目录出发，看目录结构：

```
|- node_modules // 通过 package.json 安装的架包
|- public // 项目的资源文件 & 入口 html 
|- src // 
|- .gitignore // git 的忽略文件
|- package.json // 关于我们整个项目管理的配置文件 & 一些配置信息。
|- README.md // 项目说明 & 自己想写的一些东西
|- yarn.lock // 用来记录我们真实的版本依赖，用来解决版本混乱的问题的（版本号中带有 "^" 说明允许小版本迭代）
```

## 深入了解 `public` 文件夹

> 用来存储我们静态资源的文件夹

在 `public` 文件夹内：

```
|- public
|   |- favicon.ico // 网页中图标文件
|   |- index.html // 入口 html 文件
|   |- logo192.png  // 在 manifest.json 中使用
|   |- logo512.png // 在 manifest.json 中使用
|   |- manifest.json // 和 web app 配置相关
|   |- robots.txt // 指定搜索引擎可以或者无法爬取哪些文件
```

## 深入理解 `src` 文件夹

> 用来编写我们源代码的文件夹

在 `src` 文件夹内：

```
|- src
|   |- App.css // App 组件相关的样式
|   |- App.js // App 组件的代码文件
|   |- App.test.js // App 组件的测试代码文件
|   |- index.css // 全局的样式文件
|   |- index.js // 整个应用程序的入口文件
|   |- logo.svg // 图标文件
|   |- reportWebVitals.js // 默认帮助我们写好的注册 PWA 相关的代码
|   |- setupTests.js // 测试初始化文件
```

# 了解 PWA

整个项目目录结构非常好理解，只是这其中有一个 PWA 相关的概念：

- PWA 全称 Progressive Web App，即渐进式 WEB 应用
- 一个 PWA 应用首先是一个网页，可以通过 Web 技术编写出一个网页应用
- 随后添加 App Manifest 和 Service Worker 来实现 PWA 的安装和离线功能
- 这中 Web 存在的形式，我们也称之为 Web App；

> 要想做到 PWA，我们要有两个文件：manifest & reportWebVitals，通过 reportWebVitals 来做一个配置

## PWA解决了什么问题

- 可以添加至主屏幕，点击主屏幕图标可以实现启动动画以及隐藏地址栏
- 实现离线缓存功能，即使用户手机没有网络，依然可以使用一些离线功能
- 实现了消息推送
- 等一系列类似 Navtive App 相关的功能

# 脚手架中的 webpack

> create-react-app, vue-cli, angular-cli 都是使用 node 编写的，并且都是基于 webpack 的！

- 虽说脚手架是基于 webpack 的，那为什么我们没有在目录结构中看到任何的 webpack 相关内容？
    - 原因是 React 脚手架将 webpack 相关的配置隐藏起来了（Vue Cli3 开始，也将其隐藏了起来）。
- 如果我们希望看到 webpack 配置信息，那应该如何做呢？
    - 我们可以执行一个 package.json 文件中的一个脚本命令：`"eject": "react-script eject"`
    - 该操作是不可逆的，所以在执行过程中会给我们提示；