---
title: Webpack-进阶篇
tags:
  - 深入原理
categories:
  - Webpack
hidden: true
abbrlink: 3630678149
date: 2022-02-28 20:11:56
---

## webpack 工作流程

> Webpack 是一种模块打包工具，可以将各类型的资源，例如图片、CSS、JS 等，转译组合为 JS 格式的 `bundle` 文件

webpack 构建的核心任务是完成内容转化和资源合并。主要包含以下 3 个阶段：
1. 初始化阶段
  - 初始化参数：从配置文件、配置对象和 Shell 参数中读取并与默认参数进行合并，组合成最终使用的参数
  - 创建编译对象：用上一步得到的参数创建 Compiler 对象
  - 初始化编译环境：包括注入内置插件、注册各种模块工厂、初始化 RuleSet 集合、加载配置的插件等。
2. 构建阶段
  - 开始编译：执行 Compiler 对象的 run 方法，创建 Compilation 对象
  - 确认编译入口：进入 entryOption 阶段，读取配置的 Entries，递归遍历所有的入口文件，调用 Compilation.addEntry 将入口文件转换为 Dependency 对象。
  - 编译模块（make）：调用 normalModule 中的 build 开启构建，从 entry 文件开始，调用 loader 对模块进行转译处理，然后调用 JS 解释器（[acorn](https://www.npmjs.com/package/acorn)）将内容转化为 AST 对象，然后递归分析依赖，依次处理全部文件。
  - 完成模板编译：在上一步处理好所有模块后，得到模块编译产物和依赖关系图
3. 生成阶段
  - 输出资源（seal）：依据入口和模块之间的依赖关系，组装成多个包含多个模块的 Chunk，再把每个 Chunk 转换成一个 Assets 加入到输出列表，这步是可以修改输出内容的最后机会
  - 写入文件系统（emitAssets）：确定好输出内容后，根据配置的 output 将内容写入文件系统。

## Webpack 热更新原理

#### Q: 什么是热更新（Hot-Module-Replacement/HMR）

A: 当代码文件修改并保存之后，webpack 通过 watch 监听到文件的变化，会对代码文件重新打包生成两种模块补丁文件（manifast 和 updated chunk），将结果存储在内存文件系统中，通过 websocket 通信机制将重新打包的模块发送到浏览器端，如果是替换旧的模块，浏览器不需要刷新页面就可以实现应用的更新。

不刷新页面的好处是：可以保存应用当前的状态。

### 相关的中间件

1. webpack-dev-middleware
  - 本质上是一个容器，将 webpack 处理后的文件传递给服务器。
2. webpack-hot-middleware
  - 核心是给 webpack 提高服务端和客户端之间的通信机制，内部使用 EventSocurce 实现。
3. webpack-dev-server
  - 内置了 webpack-dev-middleware 和 express 服务器，利用 webpack-dev-middleware 提供文件的监听和编译，利用 express 提供 http 服务，底层利用 websocket 代替 EventSource 实现了 webpack-hot-middleware 提供的客户端和服务器之间的通信机制。

### 实现原理

![热更新流程图](image_01.png)

- Webpack Compile：将 JS 源代码编译成 bundle.js
- HMR Server：用来将热更新的文件输出给 HMR Runtime
- Bundle Server：静态资源文件服务器，提供文件访问路径
- HMR Runtime：socket 服务器，会被注入到浏览器，更新文件的变化
- bundle.js：构建输出的文件
- 在 HMR Runtime 和 HMR Server 之间建立 websocket，即图上4号线，用于实时更新文件变化

1. 启动阶段为上图： 1 - 2 - A - B

在编写未经过 webpack 打包的源代码后，Webpack Compile 将源代码和 HMR Runtime 一起编译成 bundle.js 文件，传输给 Bundle Server 静态资源服务器

2. 更新阶段为上图： 1 - 2 - 3 - 4

当某一个文件或者模块发生变化时，webpack 监听到文件变化对文件重新编译打包，编译生成唯一的 hash 值，这个 hash 值用来作为下一次热更新的标识

根据变化的内容生成两个补丁文件：manifest(包含了 hash 和 chundId，用来说明变化的内容)和 chunk.js 模块

由于 socket 服务器在 HMR Runtime 和 HMR Server 之间建立 websocket 链接，当文件发生改动的时候，服务端会向浏览器推送一条消息，消息包含文件改动后生成的 hash 值，如下图的 h 属性，作为下一次热更新的标识。

![HMR Server 主动推送的 manifast 文件](image_02.png)

在浏览器接受到这条消息之前，浏览器已经在上一次 socket 消息中已经记住了此时的hash 标识，这时候我们会创建一个 ajax 去服务端请求获取到变化内容的 manifest 文件

mainfest 文件包含重新 build 生成的 hash 值，以及变化的模块，对应上图的 c 属性

浏览器根据 manifest 文件获取模块变化的内容，从而触发 render 流程，实现局部模块更新

![更新文件](image_03.png)