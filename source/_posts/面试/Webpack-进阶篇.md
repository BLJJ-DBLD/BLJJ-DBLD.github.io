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

## Webpack 工作流程

> Webpack 是一种模块打包工具，可以将各类型的资源，例如图片、CSS、JS 等，转译组合为 JS 格式的 `bundle` 文件

webpack 构建的核心任务是完成内容转化和资源合并。主要包含以下 3 个阶段：
1. 初始化阶段
  - 初始化参数：从配置文件、配置对象和 Shell 参数中读取并与默认参数进行合并，组合成最终使用的参数
  - 创建编译对象：用上一步得到的参数创建 Compiler 对象
  - 初始化编译环境：包括注入内置插件、注册各种模块工厂、初始化 RuleSet 集合、加载配置的插件等。
2. 构建阶段
  - 开始编译：执行 Compiler 对象的 run 方法，创建 Compilation 对象
  - 确认编译入口：进入 entryOption 阶段，读取配置的 Entries，递归遍历所有的入口文件，调用 Compilation.addEntry 将入口文件转换为 Dependency 对象。
  - 编译模块（make）：调用 normalModule 中的 build 开启构建，从 entry 文件开始，**调用 loader 对模块进行转译处理**，然后调用 JS 解释器（[acorn](https://www.npmjs.com/package/acorn)）将内容转化为 AST 对象，然后递归分析依赖，依次处理全部文件。
  - 完成模板编译：在上一步处理好所有模块后，得到模块编译产物和依赖关系图
3. 生成阶段
  - 输出资源（seal）：依据入口和模块之间的依赖关系，组装成多个包含多个模块的 Chunk，再把每个 Chunk 转换成一个 Assets 加入到输出列表，这步是可以修改输出内容的最后机会
  - 写入文件系统（emitAssets）：确定好输出内容后，根据配置的 output 将内容写入文件系统。

## Webpack 编译提效

[编译提效](https://learn.lianglianglee.com/%E4%B8%93%E6%A0%8F/%E5%89%8D%E7%AB%AF%E5%B7%A5%E7%A8%8B%E5%8C%96%E7%B2%BE%E8%AE%B2-%E5%AE%8C/11%20%20%E7%BC%96%E8%AF%91%E6%8F%90%E6%95%88%EF%BC%9A%E5%A6%82%E4%BD%95%E4%B8%BA%20Webpack%20%E7%BC%96%E8%AF%91%E9%98%B6%E6%AE%B5%E6%8F%90%E9%80%9F%EF%BC%9F.md)

---

磨刀不误砍柴工，**使用 `speed-measure-plugin` 和 `webpack-bundle-analyzer` 统计编辑阶段耗时和分析产物内容。**

1. 减少执行编译的模块。
  - `IgnorePlugin`：在构建模块时直接剔除那些被排除的模块，从而提升构建模块的速度，并减少产物体积
    - 典型的例子是 `moment` 这个包，一般情况下在构建时会自动引入其 locale 目录下的多国语言包
  - `按需引入类库模块`
    - 典型例子是 `lodash` 依赖包。通常在项目里我们只用到了少数几个 lodash 的方法，但是构建时却发现构建时引入了整个依赖包
  - `DllPlugin`
    - 核心思想是将项目依赖的框架等模块单独构建打包，与普通构建流程区分开。
    - 区别在于：
      1. externals 更简单，而 DllPlugin 需要独立的配置文件
      2. DllPlugin 包含了依赖包的独立构建流程，而 externals 配置中不包含依赖框架的生成方式，通常使用已传入 CDN 的依赖包。
      3. externals 配置的依赖包需要单独指定依赖模块的加载方式：全局对象、CommonJS、AMD 等。
      4. 在引用依赖包的子模块时，DllPlugin 无须更改，而 externals 则会将子模块打入项目包中。
2. 提升单个模块构建的速度。
  - `include/exclude`
    - include 的用途是只对符合条件的模块使用指定 Loader 进行转换处理。而 exclude 则相反，不对特定条件的模块使用该 Loader（例如不使用 babel-loader 处理 node_modules 中的模块）
3. 并行构建以提升总体效率。
  - `HappyPack 与 thread-loader`
    - **开启多进程的方式加速编译**。HappyPack 诞生较早，而 thread-loader 参照它的效果实现了更符合 Webpack 中 Loader 的编写方式。
  - `parallel-webpack`
    - 在执行多个子配置对象的数组的配置构建时，默认串行执行，而通过 parallel-webpack，就能实现相关配置的并行处理。

## Webpack 打包提效

1. 面向 JS 的压缩工具
  - Webpack 4 中内置了 `TerserWebpackPlugin` 作为默认的 JS 压缩工具，之前的版本则需要在项目配置中单独引入，早期主要使用的是 UglifyJSWebpackPlugin。这两个 Webpack 插件内部的压缩功能分别基于 Terser 和 UglifyJS。
2. 面向 CSS 的压缩工具
  - `OptimizeCSSAssetsPlugin`（在 Create-React-App 中使用）
  - `OptimizeCSSNanoPlugin`（在 VUE-CLI 中使用）
  - `CSSMinimizerWebpackPlugin`（2020 年 Webpack 社区新发布的 CSS 压缩插件）
  - 都默认基于 `cssnano` 实现，因此在压缩质量方面没有什么差别。
  - 在压缩效率方面，首先值得一提的是最新发布的 CSSMinimizerWebpackPlugin，**它支持缓存和多进程**，这是另外两个工具不具备的。
3. Split Chunks（分包）：利于缓存命中、有利于运行时的持久化文件缓存等
  ``` javascript
  // ./webpack.split.config.js
  optimization: {
    ...
    splitChunks: {
      chunks: 'all'
    }
  }
  ```
  - [SplitChunks实战演示](https://juejin.cn/post/6992887038093557796#heading-7)
  - `chunks: 'initial'`：默认会将所有依赖进行分包处理，从而减少重复引入相同模块的情况
  - `chunks: 'all'`：与 `initial` 基本类似，但区别是对于两个入口文件引入相同模块，`initial` 会打包成两份，`all` 的话只会有一份，所以通常情况下，`all` 优先于 `initial`
  - `chunks: 'async'`：对于动态加载的模块，会将该模块单独打包。
4. Tree Shaking（摇树）：指在构建打包过程中，移除那些引入但未被使用的无效代码
  - 首先，只有 ES6 类型的模块才能进行 Tree Shaking。因为 ES6 模块的依赖关系是确定的，因此可以**进行不依赖运行时的静态分析**，而 CommonJS 类型的模块则不能。
  - 在 Webpack 配置的加载器规则和优化配置项中，分别有 rule.sideEffects（默认为 false）和 optimization.sideEffects（默认为 true）选项，前者指代在要处理的模块中是否有副作用，后者指代在优化过程中是否遵循依赖模块的副作用描述。**尤其前者，常用于对 CSS 文件模块开启副作用模式，以防止被移除。**

## Webpack 热更新原理

#### Q: 什么是热更新（Hot-Module-Replacement/HMR）

A: 当代码文件修改并保存之后，webpack 通过 watch 监听到文件的变化，会对代码文件重新打包生成两种模块补丁文件（`manifast` 和 `update chunk`），将结果存储在内存文件系统中，通过 `websocket` 通信机制将重新打包的模块发送到浏览器端，如果是替换旧的模块，浏览器不需要刷新页面就可以实现应用的更新。

不刷新页面的好处是：可以保存应用当前的状态。

### 相关的中间件

1. webpack-dev-middleware
  - 本质上是一个容器，将 webpack 处理后的文件传递给服务器。
2. webpack-hot-middleware
  - 核心是给 webpack 提供服务端和客户端之间的通信机制，内部使用 EventSocurce 实现。
3. webpack-dev-server
  - 内置了 webpack-dev-middleware 和 express 服务器，利用 webpack-dev-middleware 提供文件的监听和编译，利用 express 提供 http 服务，底层利用 websocket 实现了客户端和服务器之间的通信机制。

### 实现原理

![热更新流程图](image_01.png)

- `Webpack Compile`：将 JS 源代码编译成 bundle.js
- `HMR Server`：用来将热更新的文件输出给 HMR Runtime
- `Bundle Server`：静态资源文件服务器，提供文件访问路径
- `HMR Runtime`：socket 服务器，会被注入到浏览器，更新文件的变化
- `bundle.js`：构建输出的文件
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

## Webpack loader / plugins 执行时机

> `loader` 就是模块转换化。不同的文件，需要不同的 loader 来处理。
> `plugin` 是插件，可以参与到整个 webpack 打包的流程中，不同的插件，可以做不同的事件。

- 通过链式调用，按顺序串起一个个 Loader；
- 通过事件流机制，让 Plugin 可以插入到整个生产过程中的每个步骤中；

### loader

> loader 其实是一个函数，对匹配到的内容进行转换，将转换后的结果返回。会在**编译模块阶段**。根据入口文件的依赖，调用所有配置的 loader 进行转换。

常见的 loader

样式类的 loader：
  - `css-loader`：解释 @import 和 url() 并解析它们。
  - `style-loader`：将 CSS 注入 DOM。
  - `less-loader / sass-laoder`：将 Less / Sass 编译为 CSS。
  - `postcss-loader`：自动添加 CSS 前缀的功能，为了兼容各个浏览器。

文件类的 loader：
  - `url-loader`：将文件转换为 base64 URI 的 webpack 加载器。
  - `file-loader`：将文件上的 import/require() 解析为 url 并将文件发送到输出目录。

编译类的 loader：
  - `babel-loader`,
  - `ts-loader`等

校验测试类 loader：
  - `eslint-loader`,
  - `jslint-loader`等

### plugin

> plugin 是一个插件，这个插件也就是一个类，基于事件流框架 Tapable 实现。在 webpack 的构建流程中在**初始化参数后，就会加载所有的 plugin 插件**，创建插件的实例。

> 1. 调用插件 `apply` 函数传入 `compiler` 对象
> 2. 通过 `compiler` 对象监听事件

常见的 plugin

- `html-webpack-plugin`：会在打包后自动生成一个 html 文件，并且会将打包后的 js 文件引入到html 文件内。
- `optimize-css-assets-webpack-plugin`：对 CSS 代码进行压缩。
- `mini-css-extract-plugin`：将写入 style 标签内的 CSS 抽离成一个用 link 导入生成的 CSS 文件
- `webpack-parallel-uglify-plugin`：开启多进程执行代码压缩，提高打包的速度。
- `clean-webpack-plugin`：每次打包前都将旧生成的文件删除。

## 介绍一下 webpack scope hosting

> 作用域提升，将分散的模块划分到同一个作用域中，避免了代码的重复引入，有效减少打包后的代码体积和运行时的内存损耗；

在 webpack4 中使用 scope hoisting，需要添加 `ModuleConcatenationPlugin[直译：MaqiuCancatNaShenPlugin]`（模块关联）插件：

- 代码量明显减少
- 减少多个函数后内存占用减少
- 运行速度也会得到提升

**但是，在你使用非 ES6 模块或使用异步 import() 时，模块依然会拆分开**

## Babel 原理

babel 的编译过程分为三个阶段：`parsing、transforming、generating`，以 ES6 编译为 ES5 作为例子：

1. ES6 代码输入；
2. 进行解析得到 AST；
3. plugin 用 `babel-traverse` 对 AST 树进行遍历编译，得到新的 AST树；
4. 用 `babel-generator` 通过 AST 树生成 ES5 代码。

- `babel-polyfill`：JS 标准新增的原生对象和 API 的 shim，实现上仅仅是 core-js 和 regenerator-runtime 两个包的封装
- `babel-runtime`：功能类似 babel-polyfill，一般用于 library 或 plugin 中，**因为它不会污染全局作用域**