---
title: P11 TS 对常用的 ES6 模块导入 & CommonJs 模块导入的兼容处理
tags:
  - null
categories:
  - TypeScript
hidden: false
date: 2022-02-25 20:23:13
abbrlink:
---

# TS 对 ES6 & CommonJs 的兼容处理

## 回顾 ES6 & CommonJs 的模块导入方式

### ES6 的方式：

设置导出时：

``` typescript
// 单独导入
export let a = 1

// 批量导入
let b = 2
let c = 3
export {b, c}

// 导出接口
export interface P {
    x: number;
    y: number
}

// 导出函数
export function f () {}

// 导出时，起别名
function g () {}
export {g as G}

// 默认导出，无需函数名，也是顶层导出，只允许存在一个
export default function () {
    console.log("I'm default");
}

// 引入外部模块，再重新导出
export {str as hello} from './b'
```

设置导入时：

``` javascript
import {a, b, c} from './a' // 批量导出
import {P} from './a' // 导出接口
import {f as F} from './a' // 导入时起别名
import * as All from './a' // 导入模块中的所有成员，全都绑定在 All 这个变量上
import myFunction from './a' // 不加 {} ，导出默认<顶层数据>
```

注意的是：

1. 当你使用 `import * as All from './a'` 这句中，顶级 `default` 变量会挂载在 `All.default` 上。

### CommonJs 的方式：

``` typescript
let a = {
    x: 1,
    y: 2
}
// 1. 整体导出
module.exports = a
// 2. 单独每个导出
exports.c = 3
exports.d = 4
```

> 注意： `module.exports` 和 `exports.x` 只能写其中的一类。

## 当需要将 `ES6` 模块的导出到 `CommonJS` 中时

1. 以 `CommonJS` 的方式导入 `ES6` 模块

``` javascript
...
let c3 = require('../ES6/a')
...
console.log(c3()) // 认为它导出的就是顶级对象。但其实是被保存在 default 字段内。
// 输出：
// { a: 1,
//   b: 2,
//   c: 3,
//   f: [Function: f],
//   G: [Function: g],
//   hello: [Getter],
//   default: [Function: default_1] }
```

更改为：`console.log(c3.default())`。这样子做是反人类的，因为得每次自己去输出，而且容易忘记导致错误。

2. `TS` 提供了兼容性的方法

在 `ES6` 模块中，采用 `export = xx` 的方式。且**只能有唯一！**所以如果需要导出多个数据，就得放在一个 `{}` 中。

``` javascript
export = function () {
    console.log("I'm default");
}
```

在 `CommonJS` 中也需要使用到特殊的语法：

``` javascript
...
// 导入方式
import c4 = require('../ES6/d')
// 也允许直接使用 ES6 的方式导入
import c4 from '../ES6/d';
// 这样子， c4 就是设置的顶层对象。
// 使用方式
c4()
...
```

**第二种方式的允许是由条件的**，这个是涉及 `tsconfig.json` 中的配置项 `compilerOptions.esModuleInterop` 。如果这个配置项被关闭了，那就只能采用第一种方案导入 `ES6` 模块中的数据了。