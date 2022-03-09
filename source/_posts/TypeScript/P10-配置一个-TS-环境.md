---
title: P10 配置一个 TS 环境
tags:
  - null
categories:
  - TypeScript
hidden: false
abbrlink: 3722639142
date: 2022-02-25 20:11:19
---
# 配置 TS 运行环境

## 1. 创建一个 `npm` 项目

``` javascript
npm init -y // -y 是全使用默认配置，生成 package.json 文件
```

## 2. 创建 `TS` 配置文件

``` javascript
tsc --init // 生成默认的 tsconfig.json 配置文件
```

如果报错 `tsc` 不存在时，必须通过 `npm` 在该项目中安装 `typescript` ，全局安装的好处是，在何处都能使用 `tsc` 命令，但是该项目中安装 `typescript` 是不可或缺的。

安装命令：

``` javascript
npm install typescript -D
npm install typescript -g
```

## 3. 让这个项目跑起来！

### 3.1 安装 `webpack` 工具

1. 安装三个包： `webpack webpack-cli webpack-dev-server`

> 命令： `npm i webpack webpack-cli webpack-dev-server -D`

2. 根据 开发 / 生产 两个环境，配置不同的 `webpack` 配置文件。配置文件放置在 `./build` 文件夹下。
1. `webpack.config.js`：是所有文件的入口。
2. `webpack.base.js`：是 开发 / 生产 环境的公共配置文件。
3. `webpack.dev.js`：开发环境配置文件。
4. `webpack.pro.js`：生产环境配置文件。

### 3.2 对各个 `webpack` 配置文件的简单配置与解释

1. `webpack.base.js`：公共环境配置文件
1. 利用 `module.rules` ,这些规则能够修改模块的创建方式。 这些规则能够对模块(module)应用 loader，或者修改解析器(parser)。[*外链](https://webpack.docschina.org/configuration/module/#modulerules)
2. 在 `plugins` 中添加 `html-webpack-plugin` 插件，`HtmlWebpackPlugin` 简化了 `HTML` 文件的创建，以便为你的 `webpack` 包提供服务。[*外链](https://www.webpackjs.com/plugins/html-webpack-plugin/)

``` javascript
const HtmlWebpackPlugin = require('html-webpack-plugin')
module.exports = {
    // 配置入口文件
    entry: './src/index.ts',
    output: {
        // 配置输出文件名，输出目录使用的是默认的： dist 目录
        filename: 'app.js'
    },
    resolve: {
        // 指定的三个扩展名
        extensions: ['.js', '.ts', '.tsx']
    },
    module: {
        // 根据具体的规则解析文件
        rules: [
             {
                // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
                test: /\.tsx?$/,
                loader: "ts-loader",
                exclude: /node_module/
            }
        ]
    },
    plugins: [
        // 通过模板，帮助我们生成网站的首页，而且帮助我们把输出文件自动的嵌入到这个 index.html 文件中
        new HtmlWebpackPlugin({
            template: './src/tpl/index.html' // 指定具体的模板 html 文件
        })
    ]
}
```

2. `webpack.dev.js`：开发环境的配置文件

``` javascript
module.exports = {
    devtool: 'eval-cheap-module-source-map' // 一般推荐的配置
}
```

拆解 `devtool` 中的字符含义：

> eval 打包后的模块都使用 eval() 执行，行映射可能不准；不产生独立的 map 文件
> cheap map 映射只显示行不显示列，忽略源自 loader 的 source map
> inline 映射文件以 base64 格式编码，加在 bundle 文件最后，不产生独立的 map 文件
> module 增加对 loader source map 和第三方模块的映射

3. `webpack.pro.js`：生产环境的配置文件

``` javascript
const {CleanWebpackPlugin} = require('clean-webpack-plugin')

module.exports = {
    plugins: [
        new CleanWebpackPlugin()
    ]
}
```

`CleanWebpackPlugin` 的作用是，在成功构建以后，帮助我们清空构建目录，因为有的时候为了避免缓存，我们需要在文件后加入 `hash` 。这样再多次构建后就会产生很多无用的旧构建文件，通过这个插件就能自动的帮我们清空这些目录。

4. `webapck.config.js`：配置文件的入口文件

``` javascript
const {merge} = require('webpack-merge')
const base = require('./webpack.base')
const dev = require('./webpack.dev')
const pro = require('./webpack.pro')
const config = process.NODE_ENV === 'development' ? dev : pro

module.exports = merge(base, config)
```

`WebpackMerge` 的作用就是将多个配置文件合并为一个配置文件。

### 3.3 配置 `package.json` 文件

修改内容有：

``` javascript
{
    ...
    // 指定入口文件
    "main": "./src/index.ts",
    "scripts": {
        // 编写运行命令
        "serve": "webpack-dev-server --mode=develop ./"
        "test": "echo \"Error: no test specified\" && exit 1"
    }
    ...
}
```

## 4. 爬出来的坑

### 4.1 `webpack-cli, webpack-dev-server` 的升级导致命令的修改

目前采用的版本号：

``` javascript
"webpack": "^5.18.0",
"webpack-cli": "^4.4.0",
"webpack-dev-server": "^3.11.2",
```

命令的改变是：

``` javascript
// package.json
{
    ...
    "script": {
        "serve": "webpack serve --mode=development --config ./build/webpack.config.js"
    }
    ...
}
```

> `webpack-cli v4` 自带了 `@webpack-cli/serve` 的开箱即用支持，这意味着你可以使用 `webpack serve` 来调用 `webpack-dev-server` 命令。[外链](https://github.com/webpack/webpack-dev-server/issues/2759)