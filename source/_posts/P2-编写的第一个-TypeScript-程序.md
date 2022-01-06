---
title: P2 编写的第一个 TypeScript 程序
tags: []
categories:
  - TypeScript
date: 2022-01-05 21:48:08
abbrlink:
---

# 编写的第一个 TypeScript 程序

## 安装 TypeScript

TypeScript 的命令行工具安装方法：

```
npm install typescript --global
```

以上命令会在全局环境下安装 `tsc` 命令，安装完成后，我们就可以在任意地方去执行 `tsc` 命令了。

## 编写 TypeScript 文件

在 `index.ts` 内复制以下内容：

``` typescript
let hello: string = 'Hello TypeScript'
```

然后在当前文件夹内终端中输入：

```
tsc index.ts
```

这时候会生成一个编译好的文件 `index.js` 在当前文件夹内：

``` javascript
let hello = 'Hello TypeScript'
```

当然也可以前往 [TypeScript 官网](https://www.typescriptlang.org/play) 去查看生成的 js 文件

## 配置本地构建工具（Webpack）来实现自动化

在当前文件夹终端内初始化输入：

```
npm init // 创建 package.json
tsc --init // 创建 typescript.json
```

加入构建工具分别有：

- webpack
- webpack-cli
- webpack-dev-server

```
npm install webpack webpack-cli webpack-dev-server --save-dev
```

在文件夹内创建 `build` 文件夹以作 webpack配置文件夹

```
build
|- webpack.base.config.js // 公共配置
|- webpack.config.js // 配置入口文件
|- webpack.dev.config.js // 开发环境配置
|- webpack.pro.config.js // 生产环境配置
```

### 公共配置（webpack.base.config.js）

``` javascript
const HtmlWebpackPlugin = require('html-webpack-plugin')
module.exports = {
  // 入口文件
  entry: './src/index.ts',
  output: {
    filename: 'app.js'
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx']
  },
  module: {
    rules: [
      {
        test: /\.ts(x)?$/i,
        use: [{
          loader: 'ts-loader'
        }],
        exclude: /node_modules/
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      // 模板 html
      template: './src/tpl/index.html'
    })
  ]
}
```
安装必要插件与扩展

1. ts-loader

```
npm install tsc-loader typescript --save-dev
```

> 需要注意是：在安装 `tsc-loader` 时，需要同时再安装一次 `typescript` 。

2. html-webpack-plugin

```
npm install html-webpack-plugin --save-dev
```

> HtmlWebpackPlugin 的作用：当使用 `webpack` 打包时，创建一个 `html` 文件，并把 `webpack` 打包后的静态文件自动插入到这个 `html` 文件当中。更加详细的内容点击 [这里](https://www.webpackjs.com/plugins/html-webpack-plugin/)

### 开发环境（webpack.dev.config.js）

```
module.exports = {
  devtool: 'cheap-module-eval-source-map'
}
```

上面这行代码看似很长，其实是可以拆分理解的。

看似配置项很多， 其实只是五个关键字 `eval`，`source-map`，`cheap`，`module`，`inline` 的任意组合。这五个关键字每一项都代表一个特性， 这五种特性可以任意组合。它们分别代表以下五种特性（单独看特性说明有点不明所以）：

- eval：使用 `eval` 包裹模块代码。
- source-map：产生 `.map` 文件。
- cheap：不包含列信息，也不包含 `loader` 和 `sourcemap`
- module：包含 `loader` 的 `sourcemap` （比如 `tsc to js`， `babel` 的 `sourcemap`）
- inline：将 `.map` 文件作为 `DataURI` 嵌入，不单独生成 `.map` 文件（这个配置项比较少见）

> 相关详细内容，可以查阅 [这里](https://segmentfault.com/a/1190000008315937)。

### 生产环境（webpack.pro.config.js）

```
const {CleanWebpackPlugin} = require('clean-webpack-plugin')
module.exports = {
  plugin: [
    new CleanWebpackPlugin()
  ]
}
```

> `CleanWebpackPlugin` 插件的作用是：成功构建后清空目录。因为为了避免缓存，我们一般会在文件后加入 `hash` 。这样多次后，就会产生很多无用的文件。因此通过这个插件就可以帮助我们清空目录，避免无效文件存在。

### 入口文件（webpack.config.js）

```
const {merge} = require('webpack-merge')
const baseConfig = require('./webpack.base.config')
const devConfig = require('./webpack.dev.config')
const proConfig = require('./webpack.pro.config')
let config = process.env.NODE_ENV === 'development' ? devConfig : proConfig
module.exports = merge(baseConfig, config)
```

根据环境的不同，配置不同的 `webpack` 文件

### 配置 package.json

``` json
...
"scripts": {
  "start": "webpack-dev-server --mode=development --config ./build/webpack.config.js",
  "build": "webpack --mode=production --config ./build/webpack.config.js"
}
...
```

- `webpack-dev-server` 的部分功能克服了 `webpack` 编译的两个问题：
  - 原始文件做出改动后，`webpack-dev-server` 就会实时编译，做到热更新。但是最后的编译文件并没有输出到指定的目标文件夹中，而是都**保存在内存中**。因此在使用 `webpack-dev-server` 开发的时候并不能看到编译后的文件
- `--mode=development`：配置当前的运行环境
- `--config ./build/webpack.config.js`：指定 `webpack` 的配置文件地址