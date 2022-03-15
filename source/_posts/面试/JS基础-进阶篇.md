---
title: JS基础-进阶篇
tags:
  - 深入原理
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
> 2. 实例通过 `__proto__` 指向原型，原型通过 `constructor` 指向构造函数。

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

[这里写的特别的棒(๑•̀ㅂ•́)و✧](http://www.dennisgo.cn/Articles/JavaScript/Promise.html)

# async/await

> `Generator` 函数的语法糖。有更好的语义、更好的适用性、返回值是 `Promise`。

- `await` 相比直接使用 `Promise` 来说：
  - 优势在于处理 `then` 调用链，能够更清晰准确的写出代码。
  - 缺点在于滥用 `await` 可能会导致性能问题，因为 `await` 会阻塞代码，也许之后的异步代码并不依赖前者，但仍需要等待前者完成，导致代码失去了并发性，此时更应该使用 `Promise.all`

``` javascript
async function asyncFn () {
  console.log(1)
  // await xx ==> promise.resolve(()=>{ xx })
  // console.log(2) 放到 promise.resolve 或立即执行
  await setTimeout(() => {
    console.log(2)
  })
  // 相当于把 console.log(3) 放到了 promise.resolve(()=>{console.log(2)}).then(()=>{
  //   console.log(3)
  // })
  // 微任务谁先注册谁先执行
  console.log(3)
}
asyncFn()// 1 -> 4 -> 3 -> 2
console.log(4)
```

# 事件循环

![事件循环](image_3.png)

- 默认代码从上到下执行，执行环境通过script来执行（宏任务）
- 在代码执行过程中，调用定时器 promise click事件...不会立即执行，需要等待当前代码全部执行完毕
- 给异步方法划分队列，分别存放到微任务（立即存放）和宏任务（时间到了或事情发生了才存放）到队列中
- script执行完毕后，会清空所有的微任务
- **微任务执行完毕后，会渲染页面（不是每次都调用）**
- 再去宏任务队列中看有没有到达时间的，拿出来其中一个执行
- 执行完毕后，按照上述步骤不停的循环

``` javascript
// script.js
document.body.style.background = 'red'
console.log(1)
Promise.resolve().then(() => {
  console.log(2)
  document.body.style.background = 'yellow'
})
console.log(3)
```

上面代码会输出：`1 -> 3 -> 2 -> 背景变成黄色`

``` javascript
document.body.style.background = 'red'
console.log(1)
setTimeout(() => {
  console.log(2)
  document.body.style.background = 'yellow'
})
console.log(3)
```

上面代码会输出：`1 -> 3 -> 背景变成红色 -> 2 -> 背景变成黄色`

综合题目

``` javascript
console.log(1)

async function asyncFunc(){
  console.log(2)
  await setTimeout(() => {
    console.log(3)
  }, 0)
  console.log(4)
}

setTimeout(()=>{console.log(5)})

const promise = new Promise((resolve,reject)=>{
  console.log(6)
  resolve(7)
})

promise.then(d=>{console.log(d)})

asyncFunc()

console.log(8)

// 1 -> 6 -> 2 -> 8 -> 7 -> 4 - 5 -> 3
```

## 浏览器事件循环

> 涉及面试题：异步代码执行顺序？解释一下什么是 `Event Loop` ？

#### Q: 解释一下什么是 `Event Loop`

A:
- 同步和异步任务分别进入不同的执行"场所"，同步的进入主线程，异步的进入 Event Table 并注册函数。
- 当指定的事情完成时，Event Table 会将这个函数移入 Event Queue。
- 主线程内的任务执行完毕为空，会去 Event Queue 读取对应的函数，进入主线程执行。
- 上述过程会不断重复，也就是常说的 Event Loop(事件循环)。

![事件执行机制](image_4.png)

#### Q: 主线程执行栈何时为空呢？

A: JS 引擎存在监控(`monitoring process`)进程，会持续不断的检查主线程执行栈是否为空，一旦为空，就会去 `Event Queue` 中检查是否有等待被调用的函数

### 总结性回答

- 首先 js 是单线程运行的，在代码执行的时候，通过将不同函数的执行上下文压入执行栈中来保证代码的有序执行
- 在执行同步代码的时候，如果遇到了异步事件，js 引擎并不会一直等待其返回结果，而是会将这个事件挂起，继续执行执行栈中的其他任务
- 当同步事件执行完毕后，再将异步事件对应的回调加入到与当前执行栈中不同的另一个任务队列中等待执行
- 任务队列可以分为宏任务对列和微任务对列，当当前执行栈中的事件执行完毕后，js 引擎首先会判断微任务对列中是否有任务可以执行，如果有就将微任务队首的事件压入栈中执行。
- 当微任务对列中的任务都执行完成后再去判断下一次宏任务对列中的任务。

### 宏任务/微任务

微任务
- `process.nextTick`
- `promise.then`
- `Object.observe`
- `MutationObserver`

宏任务
- `script`
- `setTimeout`
- `setInterval`
- `setImmediate`
- `I/O` 网络请求完成、文件读取完成事件
- `UI rendering`
- 用户交互事件（比如鼠标点击、滚动页面、放大缩小等）

> 一次 `Eventloop` 循环会处理一个宏任务和所有这次循环中产生的微任务

## Node.js 中的事件循环

![Node.js 事件循环](image_5.png)

- 每次执行一个宏任务后会清空微任务（执行顺序和浏览器一致，在 node11 版本以上）
- `process.nextTick` node 中的微任务，当前执行栈的底部，优先级比 `promise` 要高

整个流程分为六个阶段，当这六个阶段执行完一次之后，才可以算得上执行了一次 Eventloop 的循环过程。我们来分别看下这六个阶段都做了哪些事情：
- **Timers 阶段**：这个阶段执行 `setTimeout` 和 `setInterval` 的回调函数，简单理解就是由这两个函数启动的回调函数
- **I/O callbacks 阶段**：这个阶段主要执行系统级别的回调函数，比如 TCP 连接失败的回调
- **idle, prepare 阶段**：仅系统内部使用，只需要知道有这 2 个阶段就可以
- **poll 阶段**：这个阶段重要且复杂，几乎所有 `I/O` 相关的回调都在这个阶段执行（除了 `setTimeout`、`setInterval`、`setImmediate` 以及一些因 `exception` 意外关闭产生的回调）。`检索新的 I/O 事件，执行与 I/O 相关的回调`，其他情况 Node.js 将在适当的时候在此阻塞。这也是最复杂的一个阶段，所有的事件循环以及回调处理都在这个阶段执行。这个阶段的主要流程如下图所示。

![poll 阶段流程](image_6.png)

- **check 阶段**：`setImmediate` 回调函数在这里执行，`setImmediate` 并不是立马执行，而是当事件循环 `poll 中没有新的事件处理时执行该部分`

``` javascript
const fs = require('fs');
setTimeout(() => { // 新的事件循环的起点
    console.log('1'); 
}, 0);
setImmediate(() => {
    console.log('setImmediate 1');
});
/// fs.readFile 将会在 poll 阶段执行
fs.readFile('./test.conf', {encoding: 'utf-8'}, (err, data) => {
    if (err) throw err;
    console.log('read file success');
});
/// 该部分将会在首次事件循环中执行
Promise.resolve().then(()=>{
    console.log('poll callback');
});
// 首次事件循环执行
console.log('2');
```

在这一代码中有一个非常奇特的地方，就是 `setImmediate` 会在 `setTimeout` 之后输出。有以下几点原因：
- `setTimeout` 如果不设置时间或者设置时间为 0，则会默认为 **1ms**
- 主线程执行完成后，超过 1ms 时，会将 `setTimeout` 回调函数逻辑插入到待执行回调函数 `poll` 队列中
- 由于当前 `poll` 队列存在可执行回调函数，因此需要先执行完，待完全执行完成后，才会执行 `check: setImmediate`。

> 因此：先执行回调函数，再执行 `setImmediate`

- **close callbacks 阶段**：执行一些关闭的回调函数，如 `socket.on('close', ...)`

> 除了把 EventLoop 的宏任务细分到不同阶段外。node 还引入了一个新的任务队列 `Process.nextTick`
> 可以认为，`Process.nextTick` 会在上述各个阶段结束时，在**进入下一个阶段之前立即执行**（优先级甚至超过 `microtask` 队列）

#### Q: 事件循环的主要包含微任务和宏任务。具体是怎么进行循环的呢

A:
![Node.js 事件循环图解](image_7.png)

- **微任务**：在 Node.js 中微任务包含 2 种。**微任务在事件循环中优先级是最高的**，因此在同一个事件循环中有其他任务存在时，优先执行微任务队列。并且 `process.nextTick` 的优先级高于 `Promise`
  - `process.nextTick`
  - `Promise`
- **宏任务**：在 Node.js 中宏任务包含 4 种。宏任务在微任务执行后执行，因此在同一个事件循环周期内，优先将微任务队列清空，再执行宏任务队列
  - `setTimeout`
  - `setInterval`
  - `setImmediate`
  - `I/O`

从事件循环图中，有一个核心的主线程，它的执行阶段主要处理三个核心逻辑：
- 同步代码
- 将异步任务插入到微任务队列中或者宏任务队列中
- 执行微任务或者宏任务的回调函数。在主线程处理回调函数的同时，也需要判断是否插入微任务和宏任务。根据优先级，先判断微任务队列是否存在任务，存在则先执行微任务，不存在则判断在宏任务队列中是否有任务，有则执行。

``` javascript
const fs = require('fs');
// 首次事件循环执行
console.log('start');
/// 将会在新的事件循环中的阶段执行
fs.readFile('./test.conf', {encoding: 'utf-8'}, (err, data) => {
    if (err) throw err;
    console.log('read file success');
});
setTimeout(() => { // 新的事件循环的起点
    console.log('setTimeout'); 
}, 0);
/// 该部分将会在首次事件循环中执行
Promise.resolve().then(()=>{
    console.log('Promise callback');
});
/// 执行 process.nextTick
process.nextTick(() => {
    console.log('nextTick callback');
});
// 首次事件循环执行
console.log('end');

// start -> end -> nextTick callback -> Promise callback -> setTimeout -> read file success
```

> 当微任务和宏任务又产生新的微任务和宏任务时，又应该如何处理呢？如下代码所示：

``` javascript
const fs = require('fs');
setTimeout(() => { // 新的事件循环的起点
    console.log('1'); 
    fs.readFile('./config/test.conf', {encoding: 'utf-8'}, (err, data) => {
        if (err) throw err;
        console.log('read file sync success');
    });
}, 0);
/// 回调将会在新的事件循环之前
fs.readFile('./config/test.conf', {encoding: 'utf-8'}, (err, data) => {
    if (err) throw err;
    console.log('read file success');
});
/// 该部分将会在首次事件循环中执行
Promise.resolve().then(()=>{
    console.log('poll callback');
});
// 首次事件循环执行
console.log('2');

// 2 -> poll callback -> 1 -> read file success -> read file sync success
```

Node.js 和浏览器端宏任务有一个很重要的不同点是，浏览器端任务队列每轮事件循环仅出对一个回调函数接着去执行微任务队列；而 Node.js 端只要轮到执行某个宏任务队列，则会执行完队列中所有的当前任务，但是当前轮次新添加到队尾的任务则会等到下一次轮次才会执行。

``` javascript
setTimeout(() => {
    console.log('setTimeout');
}, 0)
setImmediate(() => {
    console.log('setImmediate');
})
// 这里可能会输出 setTimeout，setImmediate
// 可能也会相反的输出，这取决于性能
// 因为可能进入 event loop 用了不到 1 毫秒，这时候会执行 setImmediate
// 否则会执行 setTimeout
```

> 上面介绍的都是 `macrotask` 的执行情况，`microtask` 会在以上每个阶段完成后立即执行

``` javascript
setTimeout(()=>{
    console.log('timer1')

    Promise.resolve().then(function() {
        console.log('promise1')
    })
}, 0)

setTimeout(()=>{
    console.log('timer2')

    Promise.resolve().then(function() {
        console.log('promise2')
    })
}, 0)
// 以上代码在浏览器和 node 中打印情况是不同的
// 浏览器中一定打印 timer1, promise1, timer2, promise2
// node 中可能打印 timer1, timer2, promise1, promise2
// 也可能打印 timer1, promise1, timer2, promise2
```

> Node.js 中的 `process.nextTick` 会先于其他 `microtask` 执行

``` javascript
setTimeout(() => {
 console.log("timer1");

 Promise.resolve().then(function() {
   console.log("promise1");
 });
}, 0);

// poll阶段执行
fs.readFile('./test',()=>{
  // 在poll阶段里面 如果有setImmediate优先执行，setTimeout处于事件循环顶端 poll下面就是setImmediate
  setTimeout(()=>console.log('setTimeout'),0)
  setImmediate(()=>console.log('setImmediate'),0)
})

process.nextTick(() => {
 console.log("nextTick");
});

// nextTick -> timer1 -> promise1 -> setImmediate -> setTimeout
```

#### Q: 谁来启动这个循环过程，循环条件是什么？

> 当 Node.js 启动后，会初始化事件循环，处理已提供的输入脚本，它可能会先调用一些异步的 API、调度定时器，或者 `process.nextTick()`，然后再开始处理事件循环。因此可以这样理解，Node.js 进程启动后，就发起了一个新的事件循环，也就是事件循环的起点。

A: 
总结来说，Node.js 事件循环的发起点有 4 个：
- Node.js 启动后
- `setTimeout` 回调函数
- `setInterval` 回调函数
- 也可能是一次 `I/O` 后的回调函数

#### Q: Node.js 是单线程的还是多线程的？

- **主线程是单线程执行的**
- 但是 Node.js 存在多线程执行，多线程包括 **`setTimeout` 和异步 `I/O` 事件**，并且还存在其他线程，包括垃圾回收、内存优化等

## Event Loop 对渲染的影响

- 想必你之前在业务开发中也遇到过 `requestIdlecallback` 和 `requestAnimationFrame`，这两个函数在我们之前的内容中没有讲过，但是当你开始考虑它们在 `Event Loop` 的生命周期的哪一步触发，或者这两个方法的回调会在微任务队列还是宏任务队列执行的时候，才发现好像没有想象中那么简单。**这两个方法其实也并不属于 JS 的原生方法，而是浏览器宿主环境提供的方法**，因为它们牵扯到另一个问题：渲染。
- 我们知道浏览器作为一个复杂的应用是多线程工作的，除了运行 JS 的线程外，还有渲染线程、定时器触发线程、HTTP 请求线程，等等。JS 线程可以读取并且修改 DOM，而渲染线程也需要读取 DOM，这是一个典型的多线程竞争临界资源的问题。所以浏览器就把这两个线程设计成互斥的，即同时只能有一个线程在执行
- 渲染原本就不应该出现在 `Event Loop` 相关的知识体系里，但是因为 `Event Loop` 显然是在讨论 JS 如何运行的问题，而渲染则是浏览器另外一个线程的工作。但是 `requestAnimationFrame` 的出现却把这两件事情给关联起来
- 通过调用 `requestAnimationFrame` 我们可以在下次渲染之前执行回调函数。那下次渲染具体是哪个时间点呢？渲染和 `Event Loop` 有什么关系呢？
  - 简单来说，就是在每一次 `Event Loop` 的末尾，判断当前页面是否处于渲染时机，就是重新渲染
- 有屏幕的硬件限制，比如 60Hz 刷新率，简而言之就是 1 秒刷新了 60 次，**16.6ms 刷新一次**。这个时候浏览器的渲染间隔时间就没必要小于 16.6ms，因为就算渲染了屏幕上也看不到。当然浏览器也不能保证一定会每 16.6ms 会渲染一次，因为还会受到处理器的性能、JavaScript 执行效率等其他因素影响。
- 回到 `requestAnimationFrame`，这个 API 保证在下次浏览器渲染之前一定会被调用，实际上我们完全可以把它看成是一个高级版的 `setInterval`。它们都是在一段时间后执行回调，但是前者的间隔时间是由浏览器自己不断调整的，而后者只能由用户指定。这样的特性也决定了 `requestAnimationFrame` 更适合用来做针对每一帧来修改的动画效果
- 当然 `requestAnimationFrame` 不是 `Event Loop` 里的宏任务，或者说它并不在 `Event Loop` 的生命周期里，只是浏览器又开放的一个在渲染之前发生的新的 hook。另外需要注意的是微任务的认知概念也需要更新，在执行 animation callback 时也有可能产生微任务（比如 promise 的 callback），会放到 animation queue 处理完后再执行。所以微任务并不是像之前说的那样在每一轮 Eventloop 后处理，而是在 JS 的函数调用栈清空后处理

但是 `requestIdlecallback` 却是一个更好理解的概念。当宏任务队列中没有任务可以处理时，浏览器可能存在“空闲状态”。这段空闲时间可以被 `requestIdlecallback` 利用起来执行一些优先级不高、不必立即执行的任务，如下图所示：

![浏览器 UI 线程](image_8.png)

# 垃圾回收

#### Q: 什么是内存泄漏

A: 内存泄漏，在某些情况下，**不再使用到的变量所占用内存没有及时释放，导致程序运行中，内存越占越大**，极端情况下可以导致系统崩溃，服务器宕机。

#### Q: 如何避免内存泄漏

A:
- 尽可能少的创建全局变量
- 手动清除定时器
- 少用闭包
- 清除 DOM 引用
- 弱引用
  - 例如：`WeakMap` 和 `WeakSet`，其键名所引用的对象均是 `弱引用`。
    - `弱引用` 是指垃圾回收的过程中不会将键名对该对象的引用考虑进去，只要键名所引用的对象没有其他的引用了，垃圾回收机制就会释放该对象所占用的内存。

---

针对 JavaScript 的垃圾回收机制有以下两种方法（常用）：**标记清除，引用计数**

## V8 的垃圾回收机制

V8 的垃圾回收策略主要是基于`分代式垃圾回收机制`，其根据**对象的存活时间**将内存的垃圾回收进行不同的分代，然后对不同的分代采用不同的垃圾回收算法

V8 的内存结构主要由以下几个部分组成：
- `新生代(new_space)`：大多数对象开始都会被分配到这里，这个区域相对较小，但是垃圾回收特别频繁，该区域被分为两半，一半用来分配内存，另一半用于在垃圾回收时**将需要保留的对象复制过来**
- `老生代(old_space)`：新生代中的对象在存活一段时间后就会被转移到老生代内存区，相对于新生代，老生代内存区域的垃圾回收频率较低。
  - 老生代又分为 `老生代指针区` 和 `老生代数据区`，前者包含大多数可能存在指向其他对象的指针对象，后者只保留原始数据对象，这些对象没有指向其他对象的指针。
- `大对象区(large_object_space)`：存放体积超越其他区域大小的对象，每个对象都会有自己的内存，**垃圾回收不会移动大对象区**。
- `代码区(code_space)`：代码对象，会被分配在这里，**唯一拥有执行权限的内存区域**。
- `map区(map_space)`：存放Cell和Map，每个区域都是存放相同大小的元素，结构简单。

### 新生代

在 V8 引擎的内存结构中，新生代主要存放存活时间较短的对象。新生代内存是由两个 `semispace(半空间)` 构成的，内存最大值在 64 位和 32 位系统上分别为 `32MB` 和 `16MB`，在新生代的垃圾回收过程中主要采用了 `Scavenge` 算法。

`Scavenge` 算法是一种典型的牺牲空间换取时间的算法，在新生代内存中，大部分对象的生命周期较短，在时间效率上表现可观，所以比较适合这种算法。

> 在 `Scavenge` 算法具体实现中，主要采用了 `Cheney` 算法，它将新生代内存一分为二，每一部分的空间称为 `semispance`，其中处于激活状态的区域称为 `From` 空间，未激活的区域称为 `To` 空间，始终只有一个处于使用状态，另一个处于闲置状态。程序中被声明的对象首先会被分配到 `From` 空间，当进行垃圾回收时，如果 `From` 空间中还有存活对象，就会被复制到 `To` 空间进行保存，非存活的对象则会被自动回收。当复制完成后，`From` 空间和 `To` 空间完成一次角色互换，`To` 空间会变为新的 `From` 空间，原来的 `From` 空间则变成 `To` 空间。

### 对象晋升

当一个对象经过多次复制之后依然存活，那么它会被认为是一个生命周期较长的对象，在下一次进行垃圾回收时，该对象会被直接转移到老生代中，这种对象从新生代转移到老生代的过程我们称为 `晋升`。

> 对象的晋升条件主要有以下两条：
> 1. 对象是否经历过一次 `Scavenge` 算法
> 2. `To` 空间的内存占比是否已经超过 `25%`

#### Q: 如何判断该对象是否经历过一次 `Scavenge` 算法

A: 在将对象从 `From` 空间复制到 `To` 空间之前，会先检查该对象的内存地址来判断是否已经经历过一次 `Scavenge` 算法，如果地址已经发生变动则会将该对象转移到老生代中，不会再复制到 `To` 空间。

如果对象没有经历过 `Scavenge` 算法，会被复制到 `To` 空间，但如果此时 `To` 空间内存占比超过 `25%`，则该对象依旧会被转移到老生代中。

#### Q: 为什么会有 25% 内存限制

A: 因为 `To` 空间在经历过一次 `Scavenge` 算法后会和 `From` 空间完成角色互换，会变成 `From` 空间，后续的内存分配都是在 `From` 空间中进行的，如果内存使用过高甚至溢出，则会影响后续对象的分配，因此超过这个限制之后对象会被直接转移到老生代来进行管理。

### 老生代

在老生代中，因为管理着大量的存活对象，所以不适用 `Scavenge` 算法，因为明显会浪费一半的内存。而是采用新的算法 `Mark-Sweep(标记清除)` 和 `Mark-Compact(标记整理)` 来进行管理。

#### Q: 为什么不使用 `引用计数法`

A:
- 引用计数算法原理比较简单，就是看对象是否还有其他引用指向它，如果没有指向该对象的引用，则该对象会被视为垃圾并被垃圾回收器回收。
- 但是一旦我们碰到 `循环引用` 的场景，就会出现问题
``` javascript
function fn () {
  let a = {}
  let b = {}
  a.a1 = b
  b.b1 = a
}
fn()
```
- 像上面这个例子，两个变量均存在指向自身的引用，因为无法被回收而导致内存泄漏

因此为了避免循环引用而导致的内存泄漏问题，截至2012年所有现代浏览器均放弃了这种算法，转而采用新的 `Mark-Sweep(标记清除)` 和 `Mark-Compact(标记整理)` 算法。在上面的循环引用例子中，因为变量 `a` 和变量 `b` 无法从 `window` 全局对象访问到，因此无法对其进行标记，所以最终会被回收

两种算法在老生代中分饰不同角色：
- `Mark-Sweep(标记清除)`：分为 `标记` 和 `清除` 两个阶段。标记阶段会遍历堆中的所有对象，然后标记活着的对象，在清除阶段中，会将未标记的死亡对象进行清除。
  - 具体步骤如下：
    - 垃圾回收器会在内部构建一个 `根列表` ，用于从根节点出发寻找那些可以被访问到的变量。比如在 JavaScript 中，`window` 全局对象可以看成一个根节点。
    - 然后，垃圾回收器从所有根节点出发，遍历所有可访问到的子节点，将其标记为活动的，根节点不能到达的地方即为非活动的，将会被视为垃圾。
    - 最后，垃圾回收器将会释放所有非活动的内存块，并将其归还给操作系统
  - 以下几种情况都可以作为根节点：
    - 全局对象
    - 本地函数的局部变量和参数
    - 当前嵌套调用链上的其他函数的变量和参数
- `Mark-Sweep(标记整理)`：因为我们清理的对象的内存地址可能不是连续的，所以会出现内存碎片的问题，导致后面如果需要分配一个大的对象而空闲内存不足分配的情况。`Mark-Sweep(标记整理)` 就是为了解决这种内存碎片化问题。会将活动的对象往堆内存的一端进行移动，移动完成后再清除掉边界外的全部内存。

整个过程可以用如下流程图表示：
1. 假设老生代中有 A、B、C、D 四个对象
2. 在垃圾回收的 `标记` 阶段，将对象 A 和对象 C 标记为活动的
3. 在垃圾回收的 `整理` 阶段，将活动的对象往堆内存的一端移动
4. 在垃圾回收的 `清除` 阶段，将活动对象外的内存全部回收

#### Q: 垃圾回收机制的优化

A: 
- 由于JS的单线程机制，**垃圾回收的过程会阻碍主线程同步任务的执行**，待执行完垃圾回收后才会再次恢复执行主任务的逻辑，这种行为被称为 `全停顿(stop-the-world)`。在标记阶段同样会阻碍主线程的执行，一般来说，老生代会保存大量存活的对象，如果在标记阶段将整个堆内存遍历一遍，那么势必会造成严重的卡顿。
- 因此，为了减少垃圾回收带来的停顿时间，V8引擎又引入了 `Incremental Marking(增量标记)` 的概念，即将原本需要一次性遍历堆内存的操作改为增量标记的方式，先标记堆内存中的一部分对象，然后暂停，将执行权重新交给JS主线程，待主线程任务执行完毕后再从原来暂停标记的地方继续标记，直到标记完整个堆内存。这个理念其实有点像 `React` 框架中的 `Fiber` 架构，只有在浏览器的空闲时间才会去遍历 `Fiber Tree` 执行对应的任务，否则延迟执行，尽可能少地影响主线程的任务，避免应用卡顿，提升应用性能。
- 得益于增量标记的好处，V8 引擎后续继续引入了 `延迟清理(lazy sweeping)` 和 `增量式整理(incremental compaction)`，让清理和整理的过程也变成增量式的。同时为了 **充分利用多核CPU的性能**，也将引入 `并行标记` 和 `并行清理`，进一步地减少垃圾回收对主线程的影响，为应用提升更多的性能。

# 深浅拷贝

## 浅拷贝

> 自己创建一个新的对象，来接受你要重新复制或引用的对象值。如果对象属性是基本的数据类型，复制的就是基本类型的值给新对象；但如果属性是引用数据类型，**复制的就是内存中的地址**，如果其中一个对象改变了这个内存中的地址，肯定会影响到另一个对象。

#### 方法一：object.assign()

> `object.assign` 是 ES6 中 `object` 的一个方法，该方法可以用于 JS 对象的合并等多个用途，`其中一个用途就是可以进行浅拷贝`。该方法的第一个参数是拷贝的目标对象，后面的参数是拷贝的来源对象（也可以是多个来源）。

``` javascript
object.assign 的语法为：Object.assign(target, ...sources)
```

示例代码如下：

``` javascript
let target = {}
let source = {a: 1, b: {a: 2}}
Object.assign(target, source)
console.log(target) // {a: 1, b: {a: 2}}
```

> 但是使用 `Object.assgin 方法有几点需要注意：
> 1. 它不会拷贝对象的继承属性；
> 2. 它不会拷贝对象的不可枚举的属性；
> 3. 可以拷贝 `Symbol` 类型的属性；

``` javascript
let obj1 = {
    a: {b: 1},
    d: Symbol(3)
}

Object.defineProperty(obj1, 'e', {
    value: '不可配置数据',
    enumerable: false,
    configurable: true
})

let target = {}

Object.assign(target, obj1)

console.log({obj1});
console.log({target});
```

![Object.assgin 浅拷贝](image_9.png)

#### 方法二：扩展运算符方式

> 扩展运算符展现的与 `Object.assgin` 一致。

#### 方法三：concat 拷贝数组

> 数组的 `concat` 方法其实也是浅拷贝，所以连接一个含有引用类型的数组时，需要注意修改原数组中的元素的属性，因为它会影响拷贝之后连接的数组。不过 `concat` 只能用于数组的浅拷贝，使用场景比较局限。代码如下所示。

``` javascript
let arr = [1, 2, 3]
let newArr = arr.concat()
newArr[1] = 100
console.log({arr}) // [ 1, 2, 3 ]
console.log({newArr}) // [ 1, 100, 3 ]
```

#### 方法四：slice 拷贝数组

> `slice` 方法也比较有局限性，因为 `它仅仅针对数组类型`。`slice方法会返回一个新的数组对象`，这一对象由该方法的前两个参数来决定原数组截取的开始和结束时间，是不会影响和改变原始数组的。

`slice 的语法为：arr.slice(begin, end);`

``` javascript
let arr = [1, 2, {val: 4}];
let newArr = arr.slice();
newArr[2].val = 1000;
console.log(arr);  //[ 1, 2, { val: 1000 } ]
```

> 从上面的代码中可以看出，这就是`浅拷贝的限制所在了——它只能拷贝一层对象`。如果存在对象的嵌套，那么浅拷贝将无能为力。因此深拷贝就是为了解决这个问题而生的，它能解决多层对象嵌套问题，彻底实现拷贝

#### 手工实现一个浅拷贝

根据以上对浅拷贝的理解，如果让你自己实现一个浅拷贝，大致的思路分为两点：
- 对基础类型做一个最基本的一个拷贝；
- 对引用类型开辟一个新的存储，并且拷贝一层对象属性。

``` javascript
function shallowClone (target) {
    if (typeof target === 'object' && target !== null) {
        const cloneTarget = Array.isArray(target) ? [] : {}
        for (let key in target) {
            if (target.hasOwnProperty(key)) {
                cloneTarget[key] = target[key];
            }
        }
        return cloneTarget
    }
    return target;
}
```

## 深拷贝

`浅拷贝只是创建了一个新的对象，复制了原有对象的基本类型的值，而引用数据类型只拷贝了一层属性，再深层的还是无法进行拷贝`。深拷贝则不同，对于复杂引用数据类型，其在堆内存中完全开辟了一块内存地址，并将原有的对象完全复制过来存放。

这两个对象是相互独立、不受影响的，彻底实现了内存上的分离。总的来说，`深拷贝的原理可以总结如下`：

> 将一个对象从内存中完整地拷贝出来一份给目标对象，并从堆内存中开辟一个全新的空间存放新对象，且新对象的修改并不会改变原对象，二者实现真正的分离。

#### 方法一：JSON.parse(JSON.stringify(target))

> `JSON.stringify()` 是目前开发过程中最简单的深拷贝方法，其实就是把一个对象序列化成为 `JSON` 的字符串，并将对象里面的内容转换成字符串，最后再用 `JSON.parse()` 的方法将 `JSON` 字符串生成一个新的对象

``` javascript
let a = {
    age: 1,
    jobs: {
        first: 'FE'
    }
}
let b = JSON.parse(JSON.stringify(a))
a.jobs.first = 'native'
console.log(b.jobs.first) // FE
```

**但是该方法也是有局限性的：**
- 会忽略 `undefined`，`Symbol`
- 不能序列化函数
- 无法拷贝不可枚举的对象
- 无法拷贝对象的原型链
- 拷贝 `RegExp` 引用类型会变成空对象
- 拷贝 `Date` 引用类型会变成字符串
- 对象中含有 `NaN`，`Infinity` 以及 `-Infinity`，会序列化成 `null`
- 不能解决循环引用的对象，**JSON.stringify 方法会抛错**
  - 反过来思考，遇到循环引用的对象可以用该方法来被包裹 `try catch` 修改

``` javascript
function Obj() { 
  this.func = function () { alert(1) }; 
  this.obj = {a:1};
  this.arr = [1,2,3];
  this.und = undefined; 
  this.reg = /123/; 
  this.date = new Date(0); 
  this.NaN = NaN;
  this.infinity = Infinity;
  this.sym = Symbol(1);
} 
let obj1 = new Obj();
Object.defineProperty(obj1,'innumerable',{ 
  enumerable:false,
  value:'innumerable'
});
console.log('obj1',obj1);
let str = JSON.stringify(obj1);
let obj2 = JSON.parse(str);
console.log('obj2',obj2);
```

![JSON.parse(JSON.stringify())](image_10.png)

#### 方法二：基础版（手写递归实现）

``` javascript
/**
 * @param {Object} target;
 * @returns {any}
 */

function deepClone (target) {
    if (typeof target === 'object' && target !== null) {
        let cloneTarget = null
        if (target instanceof Array) {
            cloneTarget = []
        } else {
            cloneTarget = {}
        }
        for (let prop in target) {
            if (target.hasOwnProperty(prop)) {
                cloneTarget[prop] = typeof target[prop] === 'object' ? deepClone(target[prop]) : target[prop];
            }
        }
        return cloneTarget
    } else {
        return target;
    }
}
// 测试
// 下面是验证代码
let obj = {
    num: 0,
    str: '',
    boolean: true,
    unf: undefined,
    nul: null,
    obj: { name: '我是一个对象', id: 1 },
    arr: [0, 1, 2],
    func: function () { console.log('我是一个函数') },
    date: new Date(0),
    reg: new RegExp('/我是一个正则/ig'),
    [Symbol('1')]: 1,
};
Object.defineProperty(obj, 'innumerable', {
    enumerable: false, value: '不可枚举属性' }
);
let obj1 = deepClone(obj)
console.log({obj});
console.log({obj1});
```

![基础版遍历](image_11.png)

虽然利用递归能实现一个深拷贝，但是同上面的 `JSON.stringify` 一样，还是有一些问题没有完全解决，例如：
- 这个深拷贝函数无法复制不可枚举的属性及 `Symbol` 类型
- 这种方法不能够对 `Date、RegExp、Error` 这样的引用类型正确拷贝

#### 方法三：改进版（改进后递归实现54）

要清楚改进版得先清楚下面几个方法以及作用：
- `Object.getPrototypeOf`：返回指定对象的原型（内部[[Prototype]]属性的值）。
- `Reflect.ownKeys`（不支持 IE）：返回一个由目标对象自身的属性键组成的数组。
- `Object.getOwnPropertyDescriptors`（不支持 IE）：获取一个对象的所有自身属性的描述符。
- `WeakMap`（不支持 IE）：作为检测循环引用很有帮助，如果存在循环，则引用直接返回 `WeakMap` 存储的值

``` javascript
let isComplexDataType = obj => (typeof obj === 'object' || typeof obj === 'function') && (obj !== null)

function deepClone (target, map = new WeakMap()) {
    if (target instanceof Date) {
        return new Date(target)
    }
    if (target instanceof RegExp) {
        return new RegExp(target)
    }
    if (map.has(target)) {
        return map.get(target)
    }
    // Object.getPrototypeOf: 返回指定对象的原型（内部[[Prototype]]属性的值）
    // Object.getOwnPropertyDescriptors: 获取一个对象的所有自身属性的描述符。
    let cloneTarget = Object.create(Object.getPrototypeOf(target), Object.getOwnPropertyDescriptors(target))
    // 继承原型链
    map.set(target, cloneTarget)
    // Reflect.ownKeys 返回一个由目标对象自身的属性键组成的数组。
    for (let prop of Reflect.ownKeys(target)) {
        cloneTarget[prop] = (isComplexDataType(target[prop]) && typeof target[prop] !== 'function') ? deepClone(target[prop], map) : target[prop]
    }
    return cloneTarget
}

// 下面是验证代码
let obj = {
  num: 0,
  str: '',
  boolean: true,
  unf: undefined,
  nul: null,
  obj: { name: '我是一个对象', id: 1 },
  arr: [0, 1, 2],
  func: function () { console.log('我是一个函数') },
  date: new Date(0),
  reg: new RegExp('/我是一个正则/ig'),
  [Symbol('1')]: 1,
};
Object.defineProperty(obj, 'innumerable', {
  enumerable: false, value: '不可枚举属性' }
);
obj = Object.create(obj, Object.getOwnPropertyDescriptors(obj))
obj.loop = obj    // 设置loop成循环引用的属性
let cloneObj = deepClone(obj)
cloneObj.arr.push(4)
console.log('obj', obj)
console.log('cloneObj', cloneObj)
```

![改进版深拷贝](image_12.png)