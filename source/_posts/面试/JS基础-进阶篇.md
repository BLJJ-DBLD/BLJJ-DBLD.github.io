---
title: JS基础-进阶篇
tags:
  - null
categories:
  - JavaScript
hidden: true
abbrlink: 3980559252
date: 2022-02-14 15:59:11
---

# 类型及检测方式

`typeof`：
  - 直接在计算机底层基于数据类型的值（**二进制**）进行检测
  - `typeof null === 'object'` 的原因是对象存在计算机中，都是以 `000` 开始的二进制存储，而 `null` 在计算机中是 `全0` 存储，所以检测出来的结果是对象
  - `typeof` 普通对象/数组对象/正则对象/日期对象 都是 `object` 
  - `typeof isFunction === 'function'` 的原因是 typeof 操作符在判断 Object 时，如果内部实现了 `[[Call]]` 方法，就返回 function。函数是“可调用对象”
  - `typeof NaN === 'number'`

`instanceof`：
  - 检测当前实例是否属于这个类的
  - 底层机制：只要当前类出现在实例的原型上，结果都是 `true`
  - 不能检测基本数据类型

`constructor`：
  - 支持基本类型
  - `constructor` 可以随便更改，所以不准确
  ``` javascript
    function Fn() {}
    Fn.prototype = new Array()
    var f = new Fn()
    console.log(f.constructor === Fn) // false
    console.log(f.constructor === Array) // true
  ```

`Object.prototype.toString.call()`
  - 返回当前实例所属类信息

判断 `Target` 的类型，单单用 `typeof` 并无法完全满足，这其实并不是 bug，本质原因是 JS 的万物皆对象的理论。因此要真正完美判断时，我们需要区分对待：

- 基本类型(`string / number / boolean / undefined`) + `function`: - 直接使用 `typeof` 即可
- 其余引用类型(`Array / Date / RegExp Error`): 调用 `toString` 后根据 `[object XXX]` 进行判断