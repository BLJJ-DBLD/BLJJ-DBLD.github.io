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

# 数据类型转换

## 转 Boolean

在条件判断时，除了 undefined，null，false，NaN，''，0，-0，其他所有值都转为 true，包括所有对象

## 对象转原始类型

> 对象在转换类型的时候，会调用内置的 `[[ToPrimitive]]` 函数，对于该函数来说，算法逻辑一般来说如下

- 如果已经是原始类型了，那就不需要转换了
- 调用 `x.valueOf()`，如果转换为基础类型，就返回转换的值
- 调用 `x.toString()`，如果转换为基础类型，就返回转换的值
- 如果都没有返回原始类型，就会报错。

当然你也可以重写 `Symbol.toPrimitive`，该方法在转原始类型时调用优先级最高。

``` javascript
let a = {
  valueOf () {
    return 0
  },
  toString () {
    return 1
  },
  [Symbol.toPrimitive] () {
    return 2
  }
}
console.log(1 + a) // 3
```

## 四则运算

- 运算中其中一方为字符串，那么就会把另一方也转换为字符串
- 如果一方不是字符串或者数字，那么会将它转换为数字或者字符串

> 另外对于加法还需要注意这个表达式 `'a' + + 'b'`：输出 'aNaN'

因为 `+ 'b'` 等于 `NaN`，所以结果为 "aNaN"，你可能也会在一些代码中看到过 `+ '1'` 的形式来快速获取 `number` 类型。

> 对于除了加法的运算符来说，只要其中一方是数字，那么另一方就会被转为数字

### 比较运算符

- 如果是对象，就通过 `[[toPrimitive]]` 转换对象
- 如果是字符串，就通过 `unicode` 字符索引来比较

## 强制类型转换

> 强制类型转换方式包括 `Number()`、`parseInt()`、`parseFloat()`、`toString()`、`String()`、`Boolean()`，这几种方法都比较类似

其他都好思考，就一些特别的注意：
- `Number(null)` 返回 `0`，`Number(undefined)` 返回 `NaN`
- `parseInt(null / undefined)` 返回 `NaN`
- `Object` 的转换规则是
  - 如果部署了 `[[toPrimitive]]` 方法，优先调用再返回；
  - 调用 `valueOf()`，如果转换为基础类型，则返回；
  - 调用 `toString()`，如果转换为基础类型，则返回；
  - 如果都没有返回基础类型，会报错。
- `==` 的隐式类型转换规则
  - `null` 只会与 `undefined` 相等。`null, undefined` 不等于 `0`

#### Q: 偏门问题：满足 a == 1 && a == 2 && a == 3

A: `Object` 的转换规则 结合 `==` 的隐式类型转换规则
``` javascript
let a = {
  value: 0,
  [Symbol.toPrimitive] () {
    this.value++;
    return this.value;
  }
}
console.log(a == 1 && a == 2 && a == 3) // true
```

# This

> 归纳：
> 1. `new` 的方式优先级最高，接下来是 `bind` 这些函数，然后是 `obj.foo()` 这种调用方式，最后是 `foo` 这种调用方式，同时，**箭头函数的 this 一旦被绑定，就不会再被任何方式所改变**。
> 2. 箭头函数没有 `this`, `arguments`, `super` 等，这些只依赖包含箭头函数最接近的函数

#### Q: 下面这个问题输出什么

``` javascript
let a = {}
let fn = function () {console.log(this)}
fn.bind().bind(a)() // 输出：？
```
如果你认为输出结果是 a，那么你就错了，其实我们可以把上述代码转换成另一种形式

``` javascript
var fn2 = function fn1 () {
  return function () {
    return fn.call()
  }.call(a)
}
```

A: 所以不管我们给函数 `bind` 几次，**fn 中的 this 永远由第一次 bind 决定**，所以结果永远是 window。