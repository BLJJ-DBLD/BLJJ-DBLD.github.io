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

# 变量提升

> 准确的解释应该是：在生成执行环境时，会有两个阶段。第一个阶段是**创建的阶段**，`JS 解释器` 会找出需要提升的变量和函数，并且给他们提前在内存中开辟好空间，函数的话会将整个函数存入内存中，变量只声明并且赋值为 `undefined`，所以在第二个阶段，也就是**代码执行阶段**，我们可以直接提前使用

在提升的过程中，**相同的函数会覆盖上一个函数，并且`函数优先于变量提升`**

> `var` 会产生很多错误，所以在 ES6 中引入了 `let`。`let` 不能在声明前使用，但是这并不是常说的 `let` 不会提升，`let` 提升了，在第一阶段内存也已经为他开辟好了空间，但是**因为这个声明的特性导致了并不能在声明前使用**

# 执行上下文

当执行 JS 代码时，会产生三种执行上下文：
- 全局执行上下文
- 函数执行上下文
- `eval` 执行上下文

每个执行上下文中都有三个重要的属性：
- 变量对象（`VO`），包含变量、函数声明和函数的形参，该属性只能在全局上下文中访问
- 作用域链（`JS` 采用词法作用域，也就是变量的作用域是在定义时就决定了）
- `this`

代码执行过程:
- 创建 全局上下文 (`global EC`)
- 全局执行上下文 (`caller`) 逐行 自上而下 执行。遇到函数时，函数执行上下文 (`callee`) 被 `push` 到执行栈顶层
- 函数执行上下文被激活，成为 `active EC`, 开始执行函数中的代码，`caller` 被挂起
- 函数执行完后，`callee` 被 `pop` 移除出执行栈，控制权交还全局上下文 (`caller`)，继续执行

# 作用域

- 作用域：作用域是定义变量的区域，它有一套访问变量的规则，这套规则来管理浏览器引擎如何在当前作用域以及嵌套的作用域中根据变量（标识符）进行变量查找
- 作用域链：作用域链的作用是**保证对执行环境有权访问的所有变量和函数的有序访问**，通过作用域链，我们可以访问到外层环境的变量和函数。

作用域可以理解为变量的可访问性，总共分为三种类型，分别为：
- 全局作用域
- 函数作用域
- 块级作用域，`{...}` 所包含的

# 闭包

> 闭包**其实就是一个可以访问其他函数内部变量的函数**。创建闭包的最常见的方式就是在一个函数内创建另一个函数，创建的函数可以访问到上级函数的局部变量。

因为通常情况下，函数内部变量是无法在外部访问的（即全局变量和局部变量的区别），因此使用闭包的作用，就具备实现了能在外部访问某个函数内部变量的功能，让这些内部变量的值始终可以保存在内存中。下面我们通过代码先来看一个简单的例子

``` javascript
function fn1 () {
  var a = 1
  return function fn2 () {
    return ++a
  }
}
var result = fn1()
result()// => 2
```

常用用途：
1. 我们在函数外部能够访问到函数内部的变量。
2. 使已经运行结束的函数上下文中的变量对象继续留在内存中。因为闭包函数保留了这个变量对象的引用，所以这个变量对象不会被回收。

# new 的原理

> `new` 关键词执行后总是会返回一个对象，要么是实例对象，要么是内部 `return` 语句指定的对象。

``` javascript
function Person(name) {
  this.name = name
  return {1: 1}
}
const person = new Person('lucas')
console.log(person)
// {1: 1}
```

`new` 操作符可以帮助我们构建出一个实例，并且绑定上 `this`，内部执行步骤可大概分为以下几步：
1. 创建一个新对象
2. 对象连接到构造函数原型上，并绑定 `this` （`this` 指向新对象）
3. 执行构造函数代码（为这个对象添加属性）
4. 返回新对象

``` javascript
function myNew(fn, ...args) {
  // 1、用 new Object() 的方式新建了一个对象 obj
  // const obj = Object.create(null)
  // 2、给该对象的 __proto__ 赋值为 fn.prototype，即设置原型链
  // obj__proto__ = fn.prototype

  // 总结 1、2 步骤
  // 创建一个空对象，且这个空对象继承构造函数的 prototype 属性
  // 即实现 obj.__proto__ === fn.prototype
  const obj = Object.create(fn.prototype)
  // 3、执行 fn，并将obj作为内部this。使用 apply，改变构造函数 this 的指向到新建的对象，这样 obj 就可以访问到构造函数中的属性
  const res = fn.apply(obj, args)
  // 4、如果 fn 有返回值，则将其作为 new 操作返回内容，否则返回 obj
  return res instanceof Object ? res : obj
}
```

# 原型/原型链

> 1. `__proto__` 和 `constructor` 是对象独有的，`prototype` 是函数独有的。
> 2. 实例通过 `__proto__` 指向原型，通过 `constructor` 指向构造函数。

## 原型

这里我们可以来看出三者的关系:
- 实例.__proto__ === 原型对象
- 原型对象.constructor === 构造函数
- 构造函数.prototype === 原型对象

``` javascript
// 这条线其实是是基于原型进行获取的，可以理解成一条基于原型的映射线
// 例如: 
// const o = new Object()
// o.constructor === Object   --> true
// o.__proto__ = null;
// o.constructor === Object   --> false
实例.constructor === 构造函数
```

## 原型链

> **原型链是由原型对象组成**，每个对象都有 `__proto__` 属性，指向了创建该对象的构造函数的原型，`__proto__` 将对象连接起来组成了原型链。是一个用来实现继承和共享属性的有限的对象链。

# 继承

![实现继承的各种方式](image_1.png)

首先先讲一下 `class`，其实在 `JS` 中并不存在，`class` 只是语法糖，本质还是函数

``` javascript
class Person {}
Person instanceof Function // true
```

## 原型链继承

``` javascript
function Super () {
    this.color = ['red', 'green', 'blue']
}

function Sub () {}

Sub.prototype = new Super()

const int1 = new Sub()
const int2 = new Sub()
console.log(int1.__proto__.color === int2.__proto__.color)
```

原型链继承的缺点：
1. 实例之间的引用类型会共享
2. 创建子类实例时，无法向父类构造函数中传递参数

## 借用构造函数继承

``` javascript
function Super (name, age) {
    this.name = name
    this.age = age
    this.color = ['red', 'green', 'blue']
    this.sayHi = function () {
        console.log(this.name + '，你好！')
    }
}
Super.prototype.getAge = function () {
    console.log(this.age + '，要加油啊')
}

function Sub (sex, ...args) {
    Super.apply(this, args)
    this.sex = sex
}

const int1 = new Sub('male', 'bljj-dbld', 26)
const int2 = new Sub('male', 'next-bljj-dbld', 30)
int1.sayHi()
int2.sayHi()
int2.getAge() // Uncaught TypeError: int2.getAge is not a function
```

借用构造函数的缺点就是：方法只能定义在父类构造函数内部，子类实例无法复用父类方法

## 组合继承

> 原型链继承 + 借用构造函数继承

``` javascript
function Super (name, age) {
    this.name = name
    this.age = age
    this.color = ['red', 'green', 'blue']
    this.sayHi = function () {
        console.log(this.name + '，你好！')
    }
}
Super.prototype.getAge = function () {
    console.log(this.age + '，要奔三了呀!')
}

function Sub (name, age, sex) {
    Super.apply(this, arguments)
    this.sex = sex
}
// 继承方法(重写子类原型对象)
//1.通过原型链继承了方法：Sub.prototype.__proto__===Super.prototype
//2.Sub.prototype：{name: undefined, age: undefined, color: Array(3)}
//3.Sub原型对象已经被覆盖，现在只能从原型链上找constructor，指向Super
Sub.prototype = new Super()
// constructor重新指向Sub
Sub.prototype.constructor = Sub
Sub.prototype.getSex = function () {
    console.log(this.sex + '，要加油啊!')
}

const int1 = new Sub('male', 'bljj-dbld', 26)
const int2 = new Sub('male', 'next-bljj-dbld', 30)
console.log(int1);
console.log(int1.constructor);
int1.sayHi()
int1.getSex()
int2.sayHi()
int2.getAge()
```

组合继承的缺点是：对父类构造函数实例化了两次，一次是通过 new 设置原型的时候，另一次是用 apply 执行的时候

## 最终版 寄生组合继承方式

相对于组合继承方式，优化了对 Super.prototype 的指引，不再是 `new Super()`

``` javascript
function Super (name, age) {
    this.name = name
    this.age = age
    this.color = ['red', 'green', 'blue']
    this.sayHi = function () {
        console.log(this.name + '，你好！')
    }
}
Super.prototype.getAge = function () {
    console.log(this.age + '，要奔三了呀!')
}

function Sub (name, age, sex) {
    Super.apply(this, arguments)
    this.sex = sex
}
// 继承方法(重写子类原型对象)
//1.通过原型链继承了方法：Sub.prototype.__proto__===Super.prototype
//2.Sub.prototype：{name: undefined, age: undefined, color: Array(3)}
//3.Sub原型对象已经被覆盖，现在只能从原型链上找constructor，指向Super
- Sub.prototype = new Super()
+ Sub.prototype = Object.create(Super.prototype)
// constructor重新指向Sub
Sub.prototype.constructor = Sub
Sub.prototype.getSex = function () {
    console.log(this.sex + '，要加油啊!')
}

const int1 = new Sub('male', 'bljj-dbld', 26)
const int2 = new Sub('male', 'next-bljj-dbld', 30)
console.log(int1);
console.log(int1.constructor);
int1.sayHi()
int1.getSex()
int2.sayHi()
int2.getAge()
```

实例通过 `Super.apply(this, args)` 拿到 `Super` 中的属性（这些属性属于实例本身，不会被共享）

子类通过 `Object.create`，让子类的原型对象的隐式原型（`__proto__`）指向父类的原型对象，完成方法的继承（可复用）

# 事件机制

> 事件流是一个事件沿着特定数据结构传播的过程。冒泡和捕获是事件流在 DOM 中两种不同的传播方法

事件流有三个阶段
- 事件捕获阶段
- 事件目标阶段
- 事件冒泡阶段

![事件触发流程](image_2.png)

## 事件对象

IE 属性

| 属性 | 描述 | 标准属性 |
|:--:|:--:|:--:|
| cancelBubble | 如果事件句柄想阻止事件传播到包容对象，必须把该属性设置为 `true` | `stopPropagation()` |
| keyCode | 对于 `keypress` 事件，该属性声明了被敲击的键生成的 `unicode` 字符码。对于 `keydown` 和 `keyup` 事件，它指定了被敲击的键的虚拟键盘码。 | |
| offsetX、offsetY | 发生事件的地点在事件源的坐标系中的 x 坐标和 y 坐标 | |
| returnValue | 如果设置了该属性，它的值比事件句柄的返回值优先级高。把这个值设置为 `false`，可以取消发生事件的源元素的默认动作。 | `preventDefault()` |
| srcElement | 对于生成事件的 `window` 对象、`document` 对象或 `Element` 对象的引用 | `target` |
| x、y | 事件发生的位置的 x 坐标和 y 坐标，它们相当于用 CSS 动态定位的最内层包含元素 | |

## 事件流阻止

- `event.preventDefault() / event.returnValue = false`：取消事件对象的默认
- `event.stopPropagation()/ event.cancelBubble = true`：阻止事件冒泡
  - `event.stopPropagation()` 对 IE9 以下的浏览器无效
  - `event.stopPropagation()` 不但能阻止事件冒泡也能阻止事件捕获
- `event.stopImmediatePropagation`：同样也能实现阻止事件，但是还能阻止该事件目标执行别的注册事件
``` javascript
node.addEventListener('click',(event) =>{
	event.stopImmediatePropagation()
	console.log('冒泡')
},false);
// 点击 node 只会执行上面的函数，该函数不会执行
node.addEventListener('click',(event) => {
	console.log('捕获 ')
},true)
```

## 事件注册

通常我们使用 `addEventListener` 注册事件，该函数的第三个参数可以是布尔值/对象。
``` javascript
target.addEventListener(type, listener, options);
target.addEventListener(type, listener, useCapture);
```
- `options`:
  - `capture`:  Boolean，表示 listener 会在该类型的**事件捕获阶段传播到该 EventTarget 时触发**。
  - `once`:  Boolean，表示 listener 在添加之后最多只调用一次。如果是 true， listener 会在其被调用之后自动移除。
  - `passive`: 设置为true时，表示 listener 永远不会调用 preventDefault()。如果 listener 仍然调用了这个函数，客户端将会忽略它并抛出一个控制台警告。
    - 使用 passive 改善的滚屏性能

# 模块化

理解：
- 我对模块的理解是，一个模块是实现一个特定功能的一组方法。在最开始的时候，js 只实现一些简单的功能，所以并没有模块的概念，但随着程序越来越复杂，代码的模块化开发变得越来越重要。
- 由于函数具有独立作用域的特点，最原始的写法是使用函数来作为模块，几个函数作为一个模块，但是这种方式容易造成全局变量的污染，并且模块间没有联系。
- 后面提出了对象写法，通过将函数作为一个对象的方法来实现，这样解决了直接使用函数作为模块的一些缺点，但是这种办法会暴露所有的所有的模块成员，外部代码可以修改内部属性的值。
- 现在最常用的是立即执行函数的写法，通过利用闭包来实现模块私有作用域的建立，同时不会对全局作用域造成污染。

# Promise

我们自己要写一个Promise，肯定需要知道有哪些工作需要做，我们先从Promise的使用来窥探下需要做啥:

> 新建 `Promise` 需要使用 `new关键字`，那他肯定是作为面向对象的方式调用的，`Promise` 是一个类。
> 我们 `new Promise(fn)` 的时候需要传一个函数进去，说明 `Promise` 的参数是一个函数
> 构造函数传进去的 `fn` 会收到 `resolve` 和 `reject` 两个函数，用来表示 `Promise` 成功和失败，说明构造函数里面还需要 `resolve` 和 `reject` 这两个函数，这两个函数的作用是改变 `Promise` 的状态。
> 根据规范，`promise` 有 `pending`，`fulfilled`，`rejected` 三个状态，初始状态为 `pending`，调用 `resolve` 会将其改为`fulfilled` ，调用 `reject` 会改为 `rejected`。
> `promise` 实例对象建好后可以调用 `then` 方法，而且是可以链式调用 `then` 方法，说明 `then` 是一个实例方法。链式调用的实现这篇有详细解释，我这里不再赘述。简单的说就是 `then` 方法也必须返回一个带 `then` 方法的对象，可以是 `this` 或者新的 `promise` 实例。

## 构造函数

