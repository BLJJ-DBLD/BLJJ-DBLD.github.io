---
title: Vue 进阶篇 - Vue 响应式原理
tags:
  - 深入原理
categories:
  - Vue
hidden: true
abbrlink: 152167171
date: 2022-01-12 15:16:04
---

# Vue 响应式原理

## Vue2.x 原理

> 核心是通过 ES5 的保护对象的 `Object.defineProperty` 中的访问器属性中的 `get` 和 `set` 方法，`data` 中声明的属性都被添加了访问器属性，当读取 `data` 中的数据时自动调用 `get` 方法，当修改 `data` 中的数据时，自动调用 `set` 方法。
> 检测到数据变化时，会通知观察者 `Wather`，观察者 `Wather` 会自动重新 `render` 当前的组件（**子组件不会重新渲染**），生成新的虚拟 DOM 树，Vue 框架会遍历并比较新旧虚拟 DOM 树中每个节点的差别，并记录下来。最后将所有记录的不同点，局部的修改到真实 DOM 树上

![VUE 更新 DOM 过程图](image_1.png)

- 虚拟 DOM（Virtal DOM）:用 js 对象模拟的，保存当前视图内所有的 DOM 节点对象基本描述属性和节点关系的树结构。用 js 对象描述每一个节点，及其父子关系，形成虚拟 DOM 对象树结构。

因为只要在 `data` 中声明的基本数据类型的数据，基本不存在数据不响应问题。所以重点介绍数组和对象在 `vue` 中数据响应问题。

`vue` 可以监听对象属性的修改，但无法监听数组的所有变动及其对象的新增和删除，只能使用数组的变异方法及 `$set` 方法。

``` javascript
var arrayProto = Array.prototype
var arrayMethods = Object.create(arrayProto)
var methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]
methodsToPatch.forEach(function (method) {
  var original = arrayProto[method]
  def(arrayMethods, method, function mutator () {
    var args = [], len = arguments.length
    while (len--) args[len] = argument[len]
    var result = original.apply(this, args)
    var ob = this.__ob__
    var inserted
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args
        break
      case 'splice':
        inserted = args.slice(2)
        break
    }
    if (inserted) {ob.observeArray(inserted)}
    ob.dep.notify()
  })
})
```

> 可以看到，`arrayMethods` 首先继承了 `Array`，然后对数组中所有**能够改变数组自身的方法进行重写（如 `push`、`pop`等）**。重写后的方法会先执行它们本身原有的逻辑，并对能增加数组长度的 3 个方法 `push`、`unshift`、`splice` 方法做判断，获取到插入的值，然后把新添加的值变成一个响应式对象。并且再调用 `ob.dep.notify()` 手动触发依赖通知。这就很好的解释了用 `vm.items.splice(newLength)` 方法可以检测到变化。

总结

`Vue` 采用数据劫持结合发布-订阅模式的方法，通过 `Object.defineProperty` 来劫持各个属性的 `getter`、`setter`。在数据变化时发布消息给订阅者，触发相应的监听回调。

![new MVVM() 所发生的事儿](image_2.png)

- `Observer`: 遍历数据对象，给所有属性上加 `setter` 和 `getter`，监听数据的变化
- `Compile`: 解析模板指令，将模板中的变量替换成数据，然后初始化渲染页面视图，并将每个指令对应的节点绑定更新函数，添加监听数据的订阅者，一旦数据有变动，收到通知，更新视图。

> `Watcher` 订阅者是 `Observer` 和 `Compile` 之间通信的桥梁，主要做的事情有：
> - 在自身实例化时往属性订阅器 `Dep` 里添加自己
> - 待属性变动 `dep.notice()` 通知时，调用自身的 `update()` 方法，并触发 `Compile` 中绑定的回调

那 `Object.defineProperty` 的用法是什么，优缺点是什么？

优点：
- 可以检测对象中数据发生的修改
缺点：
- 对于复杂的对象，层级很深的话，需要去做深度监听（即递归到底）
- 对于一个对象中，如果新增/删除属性，`Object.definedProperty` 是不能观测到的。但是可以通过 `vue.set()` 和 `vue.delete()` 来实现的。

``` javascript
// 模拟 Vue 中 data 实现
let data = {
  msg: 'hello'
}
// 模拟 Vue 的实例
let vm = {}
// 数据劫持：当访问或者设置 vm 中的成员的时候，可以设置一些干预操作
// defineProperty 有三个参数：param1：对象；param2：为vm对象添加的属性；param3：属性描述符
Object.defineProperty(vm, 'msg', {
  // 可枚举（可遍历）
  enumerable: true,
  // 可配置（可以使用 delete 删除，可以通过 defineProperty 重新定义）
  configurable: true,
  // 访问器，当获取值得时候执行
  get () {
    console.log('get', data.msg)
    return data.msg
  },
  set (newVal) {
    console.log('set', newVal)
    if (newVal === data.msg) {
      return;
    }
    data.msg = newVal
    // 数据变更，更新 DOM 的值
    document.getElementById('#app').textContent = data.msg
  }
})

// 测试：当 vm.msg 改变时，视图中的数据随之改变
vm.msg = 'Hello World'
console.log(vm.msg) // 'Hello World'
```

## Vue3.x响应式数据原理

`Vue3.x` 改用 `Proxy` 代替 `Object.defineProperty`。因为 `Proxy` 可以直接监听 **对象和数组** 的变化，并且有多达 13 种拦截方法。并且作为新标准将受到浏览器厂商重点持续的性能优化。

常见的几种拦截方法有：

- handler.get(): 属性读取操作的捕捉器。
- handler.set(): 属性设置操作的捕捉器。
- handler.deleteProperty(): delete 操作符的捕捉器。
...等 [其他拦截器](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy)

> Q: `Proxy` 只会代理对象的第一层，那 `Vue3.x` 是如何处理的呢？
>
> A: 判断当前 `Reflect.get` 的返回值是否为 `object`，如果是则通过 `reactive` 方法做代理，这样子就实现了深度监听。

> Q: 监测数组的时候可能触发多次 `get/set`，那如何防止触发多次呢？
>
> A: 
>
> 1. 判断 `key` 是否为当前被代理对象 `target` 自身属性；
> 2. 判断旧值与新值是否相等
>
> 只有满足以上两个条件之一时，才有可能执行trigger

``` javascript
// 模拟 Vue 中的 data 选项 
let data = {
  msg: 'hello',
  count: 0 
}
// 模拟 Vue 实例
let vm = new Proxy(data, {
  // 当访问 vm 的成员会执行
  get (target, key) {
    console.log('get, key: ', key, target[key])
    return target[key]
  },
  // 当设置 vm 的成员会执行
  set (target, key, newValue) {
    console.log('set, key: ', key, newValue)
    if (target[key] === newValue) {
      return
    }
    target[key] = newValue
    document.querySelector('#app').textContent = target[key]
  }
})

// 测试
vm.msg = 'Hello World'
console.log(vm.msg)
```

## 总结

![数据监听-发布订阅模式](image_2.png)

- Vue
  - 记录传入的选项，设置 `$data/$el`
  - 把 `data` 的成员注入到 `Vue` 实例
  - 负责调用 `Observer` 实现数据响应式处理(数据劫持)
  - 负责调用 `Compiler` 编译指令/插值表达式等
- Observer
  - 数据劫持
  - 负责把 `data` 中的成员转换成 `getter/setter`
  - 负责把多层属性转换成 `getter/setter`
  - 如果给属性赋值为新对象，把新对象的成员设置为 `getter/setter`
  - 添加 `Dep` 和 `Watcher` 的依赖关系
  - 数据变化发送通知
- Compiler
  - 负责编译模板，解析指令/插值表达式
  - 负责页面的首次渲染过程
  - 当数据变化后重新渲染
- Dep
  - 收集依赖，添加订阅者(`watcher`)
  - 通知所有订阅者
- Watcher
  - 自身实例化的时候往 `dep` 对象中添加自己
  - 当数据变化 `dep` 通知所有的 `Watcher` 实例更新视图

# 发布/订阅模式和观察者模式

## 发布/订阅模式

- 发布者
- 信号中心
- 订阅者

> 我们假定，存在一个“信号中心”，某个任务执行完成，就向信号中心“发布（publish）”一个信号，其他任务可以向信号中心“订阅（subscribe）”这个信号，从而知道自己什么时候开始执行。这就叫做“发布/订阅模式（publish-subscribe pattern）”

Vue 的自定义事件

``` javascript
// eventBus.js
// 事件中心
let eventHub = new Vue()

// ComponentA.vue
// 发布者
addTodo: function () {
  // 发布消息(事件)
  eventHub.$emit('add-todo', { text: this.newTodoText }) 
  this.newTodoText = ''
}
// ComponentB.vue
// 订阅者
created: function () {
  // 订阅消息(事件)
  eventHub.$on('add-todo', this.addTodo)
}
```

模拟 Vue 自定义事件的实现

``` javascript
// 实现 EventEmitter
class EventEmitter {
    constructor () {
        // { eventType: [ handler1, handler2 ] }
        this.subs = {}
    }
    $on (eventType, fn) {
        this.subs[eventType] = this.subs[eventType] || []
        this.subs[eventType].push(fn)
    }
    $emit (eventType, data) {
        if (this.subs[eventType]) {
            this.subs[eventType].forEach(fn => {
                fn(data)
            })
        }
    }
    $off (eventType, fn) {
        if (this.subs[eventType]) {
            if (fn) {
                const findIndex = this.subs[eventType].findIndex
                if (findIndex !== -1) {
                    this.subs[eventType].splice(findIndex, 1)
                }
            } else {
                delete this.subs[eventType]
            }
        }
    }
}
```

## 观察者模式

- 观察者（订阅者）：`Wather`
	- `update()`：当事件发生时，具体要做的事情
- 目标（发布者）：`Dep`
	- `subs` 数组：存储所有的观察者
	- `addSub()`：添加观察者
	- `notify()`：当事件发生时，调用所有的观察者的 `update()` 方法
- 没有事件中心

``` javascript
// 目标（发布者）
// Dependency
class Dep {
	constructor () {
		this.subs = []
	}
	// 添加观察者
	addSub (sub) {
		if (sub && sub.update) {
			this.subs.push(sub)
		}
	}
	// 通知所有观察者
	notify () {
		this.subs.forEach(sub => sub.update())
	}
}

// 观察者（订阅者）
class Watcher {
	update () {
		console.log('update')
	}
}

// 测试
let dep = new Dep()
let watcher = new Watcher()
dep.addSub(watcher) 
dep.notify()
```

## 总结

- **观察者模式** 是具体目标调度，如当事件触发，`Dep` 就会去调用观察者的方法，所以观察者模式的 *订阅者* 和 *发布者* 之间是存在依赖的
- **发布/订阅模式** 是由统一调度中心调用，因此发布者和订阅者不需要知道对方的存在

![两种模式的区别](image_3.png)

# 为什么使用 Virtual DOM

- 手动操作 `DOM` 比较麻烦，还需要考虑浏览器兼容性问题，虽然有 `jQuery` 等库简化 `DOM` 操作，但是随着项目的复杂 DOM 操作复杂提升
- 为了简化 `DOM` 的复杂操作于是出现了各种 `MVVM` 框架，`MVVM` 框架解决的是视图与状态的同步问题
- 为了简化视图的操作，我们使用了模板引擎，但是模板引擎没有解决跟踪状态变化的问题，于是 `Virtual DOM` 出现
- `Virtual DOM` 的好处是当状态改变时不需要立即更新 `DOM`，只需要创建一个虚拟树来描述 `DOM`，`Virtual DOM` 内部将弄清楚如何有效（`diff`）的更新 `DOM`
- 虚拟 `DOM` 可以维护程序的状态，跟踪上一次的状态
- 通过比较前后两次状态的差异更新真实 `DOM`

## 虚拟 DOM 的作用

- 维护视图和状态的关系
- 复杂视图情况下提升渲染性能
- 除了渲染 `DOM` 外，还可以实现 `SSR(Nuxt.js)`、原生应用（`Wexx/React Native`）、小程序（`mpvue/uni-app`）等

![Virtual DOM](image_4.png)

## VDOM：三个部分

- 虚拟节点类：将真实 `DOM` 节点用 `js` 对象的形式进行展示，并提供 `render` 方法，将虚拟节点渲染成真实 `DOM`
- 节点 `diff` 比较：对虚拟节点进行 `js` 层面的计算，并将不同的操作都记录到 `patch` 对象
- `re-render`：解析 `patch` 对象，进行 `re-render`

### 节点 `diff` 比较详细过程：

- 同级比较，再比较子节点
- 先判断一方有子节点一方没有子节点的情况(如果新的 `children` 没有子节点，将旧的子节点移除)
- 比较都有子节点的情况(**核心 `Diff`**)

正常 `Diff` 两个树的时间复杂度是 `O(n^3)`，但实际情况下我们很少会进行跨层级的移动 `DOM`，所以 Vue 将 `Diff` 进行了优化，从 `O(n^3) -> O(n)`，只有当新旧 `children` 都为多个子节点时才需要用 **核心 `Diff`** 算法进行同层级比较。

Vue2.x 的 **核心 `Diff`** 算法采用的了两端比较的算法，同时从新旧 `children` 的两端开始进行比较，借助 `key` 值找到可复用的节点，再进行相关操作。相比 React 的 `diff` 算法，同样情况下可以减少移动节点次数，减少不必要的性能损耗，更加的优雅。

Vue3.x 在创建 `VNode` 时就确定其类型，以及在 `mount/patch` 的过程中采用位运算来判断一个 `VNode` 的类型，在这个基础之上再配合 **核心 `Diff`** 算法，使得性能上较 Vue2.x 有了提升

####  `key` 属性的作用

- 新旧 `children` 中的节点只有顺序是不同的时候，最佳的操作应该是通过移动元素的位置来达到更新的目的
- 需要在新旧 `children` 的节点中保存映射关系，以便能够在旧 `children` 的节点中找到可复用的节点。`key` 也就是`children` 中节点的唯一标识

### 补充1：VDOM 的必要性

- **创建真实 `DOM` 的代价高**：真实 `DOM` 节点 `node` 实现的属性很多，而 `vnode` 仅仅实现一些必要的属性，相比较，创建一个 `vnode` 的成本比较低
- **触发多次浏览器重绘及回流**：使用 `vnode`，相当于加了一个缓冲，让一次数据的变动所带来的所有 `node` 变化，现在 `vnode` 中进行修改，然后 `diff` 之后对所有产生差异的节点集中一次对	`DOM tree` 进行修改，以减少浏览器的重绘与回流

#### 重绘（Repaint）与回流（Reflow）

- **重绘**：是当节点需要更改外观而不影响布局的，比如改变 `color` 就叫做重绘
- **回流**：是布局或者几何属性需要改变就称为回流

> 回流必定会发生重绘，重绘不一定引发回流。回流所需的成本比重绘高得多，改变深层次的节点很可能导致父节点的一系列回流。

**很多人不知道的是，重绘和回流其实和 `Event loop` 有关**

- 当 `Event loop` 执行完 `Microtasks` 后，会判断 `document` 是否需要更新，因为浏览器是 `60Hz` 的刷新率，每 `16ms` 才会更新一次。
- 然后判断是否有 `resize` 或者 `scroll`，有的话就会触发事件，所以 `resize` 和 `scroll` 事件也是至少 `16ms` 才会触发一次，并且自带节流功能
- 判断是否触发了 `media query`
- 更新动画并且发送事件
- 判断是否有全屏操作事件
- 执行 [`requestAnimationFrame`](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/requestAnimationFrame) 回调
- 执行 [`IntersectionObserver`](https://developer.mozilla.org/zh-CN/docs/Web/API/IntersectionObserver) 回调，该方法用于判断元素是否可见，可以用于懒加载上，但是兼容性不好
- 更新界面

以上就是一帧中可能会做的事情。如果在一帧中有空闲时间，就会去执行 [`requestIdleCallback`](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/requestIdleCallback) 回调

所以以下几个动作可能会导致性能问题：
- 改变 `window` 大小
- 改变字体
- 添加或删除样式
- 文字改变
- 定位或者浮动
- 盒模型

常见的引起重绘的属性

- color
- border-style
- border-radius
- background
- background-image
- background-position
- background-repeat
- background-size
- outline
- outline-color
- outline-style
- outline-width
- box-shadow
- visibility
- text-decoration

常见引起回流属性和方法

- 添加或者删除可见的 `DOM` 元素；
- 元素尺寸改变——边距、填充、边框、宽度和高度
- 内容变化，比如用户在 `input` 框中输入文字
- 浏览器窗口尺寸改变——`resize` 事件发生时
- 计算 `offsetWidth` 和 `offsetHeight` 属性
- 设置 `style` 属性的值

减少重绘和回流
- 使用 `translate` 代替 `top`
- 使用 `visibility` 代替 `display: none`，前者只会引起重绘，后者会引发回流（改变了布局）
- 不要使用 `table` 布局，可能因为一个很小的改动会造成整个 `table` 的重新布局
- 动画实现的速度的选择，动画速度越快，回流次数越多。也可以选择使用 `requestAnimationFrame`
- `CSS` 选择符是从右往左匹配查找，避免 `DOM` 层级过深
- 将频繁运行的动画变为图层，图层能够阻止该节点回流影响别的元素。比如对于 `video` 标签，浏览器会自动将该节点变为图层。


### 补充2：vue 为什么采用 vdom ？

> 引入 `Virtual DOM` 在性能方面的考量仅仅是一方面。

vue 之所以引入 `Virtual DOM`，更重要的原因是为了解耦 `HTML` 依赖，这带来了两个非常重要的好处：

1. 不再依赖 `HTML` 解析器进行模板解析，可以进行更多的 `AOT` 工作提高运行时效率：通过模板 `AOT` 编译，Vue 的运行时体积可以进一步压缩，运行时效率	可以进一步提升。
2. 可以渲染到 `DOM` 以外的平台，实现 `SSR`，同时渲染这些高级特性，`weex` 等框架应用的就是这一特性。

综上，`Virtual DOM` 在性能上的收益并不是最主要的，更重要的是它使得 `vue` 具备了现代框架应有的高级特性。

# Vue 和 React 的技术选型

相同点：
1. 数据驱动页面，提供响应式的视图组件
2. 都有 `Virtual DOM`，组件化开发，实现了 `props` 传参进行父子组件之间传递数据，都实现了 `WebComponents` 规范
3. 数据流动单向，都支持服务器的渲染 `SSR`
4. 都有支持 `Native` 的方法，React 有 `React native`，Vue 有 `Weex`

不同点：
1. 数据绑定：
	- Vue 实现了双向的数据绑定
	- React 数据流动是单向的
2. 数据渲染：
	- 大规模的数据渲染时，React 更快
3. 使用场景：
	- React 配合 Redux 架构适合大规模多人协作复杂项目，Vue 更适合小快项目
4. 开发风格：
	- React 推荐做法 jsx + inline style 把 html 和 css 都写在 js 中
	- Vue 采用 webpack + vue-loader 单文件组件格式。


## 为什么 React 比 Vue 更适合大型应用？

1. 大型项目的庞大带来的是代码优化以及性能优化。
- React 提倡的更细粒度的封装，带来的组件的复用性提高。
- 更高自由度的编写（几乎无 `api`）可以为手动优化性能带来更大的便利性

2. React 社区的活跃性
- 这点会反复提及，因为这点更加重要
- 社区提供了多样性的解决方案和更多的选择，这对于一个大型项目（大量的坑）来说也是至关重要的

> 但是这些问题，经过时间的沉淀，Vue 终会解决，并且现在也不差。

# nextTick

> nextTick 可以让我们在下次 `DOM` 更新循环结束后执行延迟回调，用于获得更新后得 `DOM`

`nextTick` 主要使用了 宏任务 和 微任务。根据执行环境分别尝试采用。
- `Promise`
- `MutationObserver`
- `setImmediate`
- 如果以上都不行则采用 `setTimeout`

> 定义了一个异步方法，多次调用 `nextTick` 会将方法存入队列中，通过这个异步方法清空当前队列

## Event Loop

### JS 中的 Event Loop

> 总所周知 `JS` 是门非阻塞单线程语言，因为在最初 `JS` 就是为了和浏览器交互而诞生的。如果 `JS` 是门多线程的语言，我们在多线程中处理 `DOM` 就可能发生问题（一个线程中新加节点，另一个线程中删除节点）

`JS` 在执行的过程中会产生执行环境，这些执行环境会被顺序的加入到执行栈中。如果遇到异步的代码，会被挂起并加入到 `Task`（有多种 `task`） 队列中。一旦执行栈为空，`Event Loop` 就会从 `Task` 队列中拿出需要执行的代码并放入执行栈中执行，所以本质上来说 `JS` 中的异步还是同步行为

> 不同的任务源会被分配到不同的 `Task` 队列中，任务源可以分为 微任务（`microtask`） 和 宏任务（`macrotask`）。在 `ES6` 规范中，`microtask` 称为 `jobs`，`macrotask` 称为 `task`

简单的例子

``` javascript
console.log('script start');

setTimeout(function() {
  console.log('setTimeout');
}, 0);

new Promise((resolve) => {
    console.log('Promise')
    resolve()
}).then(function() {
  console.log('promise1');
}).then(function() {
  console.log('promise2');
});

console.log('script end');

// script start -> Promise -> script end -> promise1 -> promise2 -> setTimeout
```

![JS 执行过程](image_5.png)

微任务：
- `process.nextTick`
- `promise`
- `Object.observe`
- `MutationObserver`

宏任务：
- `script`
- `setTimeout`
- `setInterval`
- `setImmediate`
- `I/O`
- `UI rendering`

> 宏任务中包括了 `script`，浏览器会先执行一个宏任务，接下来有异步代码的话就先执行微任务。

#### 正确的一次 `Event Loop` 顺序是这样的

- 执行同步代码，这属于宏任务
- 执行栈为空，查询是否有微任务需要执行
- 执行所有微任务
- 必要的话渲染 UI
- 然后开始下一轮 `Event Loop`，执行宏任务中的异步代码

> 通过上述的 `Event Loop` 顺序可知，如果宏任务中的异步代码有大量的计算并且需要操作 DOM 的话，为了更快的响应界面响应，我们可以把操作 `DOM` 放入微任务中

### Node 中的 Event Loop

`Node` 中的 `Evenet Loop` 和浏览器的不同。而是分为  **6个阶段**，它们会按照顺序反复运行

``` bash
   ┌───────────────────────┐
┌─>│        timers         │
│  └──────────┬────────────┘
│  ┌──────────┴────────────┐
│  │     I/O callbacks     │
│  └──────────┬────────────┘
│  ┌──────────┴────────────┐
│  │     idle, prepare     │
│  └──────────┬────────────┘      ┌───────────────┐
│  ┌──────────┴────────────┐      │   incoming:   │
│  │         poll          │<──connections───     │
│  └──────────┬────────────┘      │   data, etc.  │
│  ┌──────────┴────────────┐      └───────────────┘
│  │        check          │
│  └──────────┬────────────┘
│  ┌──────────┴────────────┐
└──┤    close callbacks    │
   └───────────────────────┘
```



timers
- `timers` 阶段会执行 `setTimeout` 和 `setInterval`
- 一个 `timer` 指定的时间并不是准确时间，而是在达到这个时间后尽快执行回调，可能会因为系统正在执行别的事务而延迟

I/O
- `I/O` 阶段会执行除了 `close` 事件、定时器和 `setImmediate` 的回调

poll
- `poll` 阶段很重要，这一阶段中，系统会做两件事
	- 执行到点的定时器
	- 执行 `poll` 队列中的事件
- 并且当 `poll` 中没有定时器的情况下，会发生以下两件事
	1. 如果 `poll` 队列不为空，会遍历回调队列并同步执行，直到队列为空或者系统限制
	2. 如果 `poll` 队列为空，会有两件事发生
		- 如果有 `setImmediate` 需要执行，`poll` 阶段会停止并且进入到 `check` 阶段执行 `setImmediate`
		- 如果没有 `setImmediate` 需要执行，会等待回调被加入到队列中并立即执行回调
		- 如果有别的定时器需要被执行，会回到 `timer` 阶段执行回调。

check
- `check` 阶段执行 `setImmediate`

close callbacks
- `close callbacks` 阶段执行 `close` 事件
- 并且在 `NodeJS` 中，有些情况下的定时器执行顺序是随机的

``` javascript
setTimeout(() => {
    console.log('setTimeout');
}, 0);
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

`NodeJS` 中的 `process.nextTick` 会先于其他 `microtask` 执行

``` javascript
setTimeout(() => {
 console.log("timer1");

 Promise.resolve().then(function() {
   console.log("promise1");
 });
}, 0);

process.nextTick(() => {
 console.log("nextTick");
});
// nextTick, timer1, promise1
```

# 生命周期

![Vue 生命周期解释图](image_6.png)

文字解释版：

*init*：
- `initLifecycle/Event`，往 `vm` 上挂载各种属性
- `callHook: beforeCreated`: 实例刚创建
- `initInjection/initState`: 初始化注入和 `data` 响应性
- `created`: 创建完成，属性已经绑定， 但还未生成真实 `dom`
- 进行元素的挂载： `$el / vm.$mount()`
- 是否有 `template`: 解析成 `render function`
  - `*.vue` 文件: `vue-loader` 会将 `<template>` 编译成 `render function`
- `beforeMount`: 模板编译/挂载之前
- 执行 `render function`，生成真实的 `dom`，并替换到 `dom tree` 中
- `mounted`: 组件已挂载

*update*：
- 执行 `diff` 算法，比对改变是否需要触发 UI 更新
- `flushScheduleQueue`
- `watcher.before`: 触发 `beforeUpdate` 钩子 - `watcher.run()`: 执行 `watcher` 中的 `notify`，通知所有依赖项更新 UI
- 触发 `updated` 钩子: 组件已更新
- `actived / deactivated(keep-alive)`: 不销毁，缓存，组件激活与失活
- `destroy`
  - `beforeDestroy`: 销毁开始
  - 销毁自身且递归销毁子组件以及事件监听
    - `remove()`: 删除节点
    - `watcher.teardown()`: 清空依赖
    - `vm.$off()`: 解绑监听
- `destroyed`: 完成后触发钩子