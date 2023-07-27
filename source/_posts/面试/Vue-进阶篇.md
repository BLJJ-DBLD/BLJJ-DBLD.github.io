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

### 总结

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
- 对于一个对象中，如果新增/删除属性，`Object.definedProperty` 是不能观测到的。但是可以通过 `vue.$set()` 和 `vue.$delete()` 来实现的。

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

## Vue3.x 响应式数据原理

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
  - 拥有 3d 变换的 css 属性
  - video 标签
  - canvas 标签
  - css 的变换属性 will-change


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
- `MutationObserver`： 它会在指定的DOM发生变化时被调用
- `setImmediate`：该方法用来把一些需要长时间运行的操作放在一个回调函数里，在浏览器完成后面的其他语句后，就立刻执行这个回调函数。
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

# vue-router

mode：
- `hash`
  - 模式：在浏览器中符号 `#`，以及 `#` 后面的字符称为 `hash`，用 `window.location.hash` 读取。
  - 特点：`hash` 虽然在 `URL` 中，但是不会被包括在 `HTTP` 请求中；用来指导浏览器动作，对服务端安全无用，`hash` 不会重加载页面。
  - 监听：`hashchange` 事件
- `history`
  - 模式：采用 `HTML5` 的新特性；提供了两个新方法：`pushState()`，`replaceState()` 可以对浏览器历史记录栈进行修改。
  - 监听：`popState` 事件

导航守卫：
- 全局守卫
  - `router.beforeEach`：全局前置守卫，进入路由之前
  - `router.beforeResolve`：全局解析守卫(2.5.0+)在 `beforeRouteEnter` 调用之后调用
  - `router.afterEach`：全局后置守卫，进入路由之后

``` javascript
// main.js 入口文件
import router from './router'; // 引入路由
router.beforeEach((to, from, next) => { 
  next();
});
router.beforeResolve((to, from, next) => {
  next();
});
router.afterEach((to, from) => {
  console.log('afterEach 全局后置钩子');
});
```

- 路由独享守卫

``` javascript
const router = new VueRouter({
  routes: [
    {
      path: '/foo',
      component: Foo,
      beforeEnter: (to, from, next) => { 
        // 参数用法什么的都一样,调用顺序在全局前置守卫后面，所以不会被全局守卫覆盖
        // ...
      }
    }
  ]
})
```

- **路由组件**内的守卫
  - `beforeRouteEnter`：进入路由前，在路由独享守卫之后被调用。**不能获取组件实例 `this`，因为此时实例还未创建。**
  - `beforeRouteUpdate`(2.2)：路由复用同一个组件时，在当前路由改变，但是该组件被复用时调用。**可以访问组件实例 `this`**
  - `beforeRouteLeave`：离开当前路由时，导航离开组件的对应路由时调用，**可以访问组件实例 `this`**

``` javascript
const Foo = {
  template: `...`,
  beforeRouteEnter (to, from, next) {
    // 在渲染该组件的对应路由被 confirm 前调用
    // 不！能！获取组件实例 `this`
    // 因为当守卫执行前，组件实例还没被创建
  },
  beforeRouteUpdate (to, from, next) {
    // 在当前路由改变，但是该组件被复用时调用
    // 举例来说，对于一个带有动态参数的路径 /foo/:id，在 /foo/1 和 /foo/2 之间跳转的时候，
    // 由于会渲染同样的 Foo 组件，因此组件实例会被复用。而这个钩子就会在这个情况下被调用。
    // 可以访问组件实例 `this`
  },
  beforeRouteLeave (to, from, next) {
    // 导航离开该组件的对应路由时调用，我们用它来禁止用户离开
    // 可以访问组件实例 `this`
    // 比如还未保存草稿，或者在用户离开前，
    // 将setInterval销毁，防止离开之后，定时器还在调用。
  }
}
```

## `vue-router` 源码实现

- 作为一个插件存在:实现 `VueRouter` 类和 `install` 方法
- 实现两个全局组件: `router-view` 用于显示匹配组件内容，`router-link` 用于跳转
- 监控 `url` 变化:监听 `hashchange` 或 `popstate` 事件
- 响应最新 `url`:创建一个响应式的属性 `current`，当它改变时获取对应组件并显示

``` javascript
class VueRouter {
  // 核心任务：
  // 1.监听url变化
  constructor(options) {
    this.$options = options;

    // 缓存path和route映射关系
    // 这样找组件更快
    this.routeMap = {}
    this.$options.routes.forEach(route => {
      this.routeMap[route.path] = route
    })

    // 数据响应式
    // 定义一个响应式的current，则如果他变了，那么使用它的组件会rerender
    Vue.util.defineReactive(this, 'current', '')

    // 请确保onHashChange中this指向当前实例
    window.addEventListener('hashchange', this.onHashChange.bind(this))
    window.addEventListener('load', this.onHashChange.bind(this))
  }

  onHashChange() {
    // console.log(window.location.hash);
    this.current = window.location.hash.slice(1) || '/'
  }
}

// 插件需要实现install方法
// 接收一个参数，Vue构造函数，主要用于数据响应式
VueRouter.install = function (_Vue) {
  // 保存Vue构造函数在VueRouter中使用
  Vue = _Vue

  // 任务1：使用混入来做router挂载这件事情
  Vue.mixin({
    beforeCreate() {
      // 只有根实例才有router选项
      if (this.$options.router) {
        Vue.prototype.$router = this.$options.router
      }

    }
  })

  // 任务2：实现两个全局组件
  // router-link: 生成一个a标签，在url后面添加#
  // <a href="#/about">aaaa</a>
  // <router-link to="/about">aaa</router-link>
  Vue.component('router-link', {
    props: {
      to: {
        type: String,
        required: true
      },
    },
    render(h) {
      // h(tag, props, children)
      return h('a',
        { attrs: { href: '#' + this.to } },
        this.$slots.default
      )
      // 使用jsx
      // return <a href={'#'+this.to}>{this.$slots.default}</a>
    }
  })
  Vue.component('router-view', {
    render(h) {
      // 根据current获取组件并render
      // current怎么获取?
      // console.log('render',this.$router.current);
      // 获取要渲染的组件
      let component = null
      const { routeMap, current } = this.$router
      if (routeMap[current]) {
        component = routeMap[current].component
      }
      return h(component)
    }
  })
}

export default VueRouter
```

# Vue3.x 带来了哪些新特性/亮点

## 压缩包体积更小

在 Vue3.x 中，实现了将大多数全局 API 和内部帮助程序移至 ES 模块导出来。这使得现代的打包工具可以静态分析模块依赖性并删除未使用的导出相关的代码。模板编译器还会生成友好的 Tree-shaking 代码，在模板中实际使用了该功能时才导入该功能的帮助程序。
但是，框架的某些部分永远不会被 Tree-shaking，因为它们对于任何类型的应用都是必不可少的。将这些必不可少的部分的度量标准成为基准尺寸。尽管新增了许多新功能，但 Vue3.x 的基准大小压缩后约为 `10kb`，还不到 Vue2.x(约 `22kb`) 的一半

## Object.defineProperty -> Proxy

- `Object.defineProperty` 是一个相对昂贵的操作，因为它直接操作对象的属性，颗粒度比较小。将它替换成 ES6 的 `Proxy`，在目标对象之上架上一层拦截，代理的是对象而不再是对象的属性。这样可以将原本对对象属性的操作变为对整个对象的操作，颗粒度变大。
- `javascript` 引擎在解析的时候希望对象的结构越稳定越好，如果对象一直在变，可优化性降低，`Proxy` 不需要对原始对象做太多操作。

### Proxy 相比于 Object.defineProperty 的优势

`Object.defineProperty` 的问题主要有三个：
1. 不能监听数组的变化
2. 必须遍历对象的每个属性
3. 必须深层遍历嵌套的对象

`Proxy` 在 ES2015(ES6) 规范中被正式加入，它有以下几个特点
1. 针对对象：针对整个对象，而不是对象的某个属性，所以也就不需要对 `keys` 进行遍历
2. 原生支持数组：`Proxy` 不需要对数组的方法进行重载，省去了众多 hack，减少代码量等于减少了维护成本，而且标准就是最好的。

除了上述两点之外，`Proxy` 还拥有以下优势：
1. `Proxy` 的第二个参数有 13 种拦截方法，这比起 `Object.defineProperty` 要更加丰富
2. `Proxy` 作为新标准受到浏览器厂商的重点关注和性能优化，相比之下 `Object.defineProperty` 是一个已有的老方法。

## Virtual DOM 重构

> vdom 的本质是一个抽象层，用 javascript 描述界面渲染成什么样子。React 用 jsx，没办法检测出可以优化的动态代码，所以做时间分片。Vue 中足够快的话可以不用时间分片
> React 做时间分片的原因是：当 js 线程占着主线程时，渲染线程就无法工作，如果时间超过 16ms 就会给用户卡顿的感觉，所以采用时间分片，这也是为什么 React15 -> React16 会将原来的 `Stack Reconciler` 重构为 `Fiber Reconciler`

### 传统 vdom 的性能瓶颈

- 虽然 Vue 能够保证触发更新的组件最小化，但在单个组件内部依然需要便利该组件的整个 vdom 树。
- 因此，传统的 vdom 的性能跟模板的大小正相关，跟动态节点的数量无关。在一些组件整个模板内只有少量动态节点的情况下，这些遍历都是性能的浪费。
- JSX 和手写的 render function 是完全动态的，过度的灵活性导致运行时可以用于优化的信息不足

### Q: 那为什么不直接抛弃 vdom 呢?

A:
1. 高级场景下手写 `render function` 获得更强的表达力
2. 生成的代码更简洁
3. 兼容 Vue2.x

> 虚拟 DOM(`Virtual DOM`)（简称：vdom） 本质上是 JS 和 DOM 之间的一个映射缓存，它在形态上表现为一个能够描述 DOM 结构及其属性信息的 JS 对象

就 vdom 而言，需要把握住两个点：
1. vdom 是 JS 对象
2. vdom 是真实 DOM 的描述

#### vdom 如何解决问题

![Virtual DOM 的作用](image_7.png)

> 注意图中的绿色加粗 **<font color=#30C7A1>模板</font>**，这是因为 vdom 在实现上并不总是借助模板。比如 React 就使用了 JSX，JSX 本质不是模板，而是一种使用体验和模板相似的 JS 语法糖。

区别就在于多出了一层 vdom 作为缓冲层。这个缓冲层带来的利好是：当 DOM 操作（渲染更新）比较频繁时，它会先将前后两次的 vdom 树进行对比，定位出具体需要更新的部分，生成一个“补丁集”，最后只把“补丁”打在需要更新的那部分真实 DOM 上，实现精准的“差量更新”。这个过程对应的 vdom 工作流如下图所示：

![vdom 工作流程](image_8.png)

> 注：图中的 `diff` 和 `patch` 其实都是函数名，这些函数取材于一个独立的 vdom 库

#### 选用 vdom，真的是为了更好的性能吗？

[更详细的信息在这里](http://interview.poetries.top/principle-docs/react/15-%E7%9C%9F%E6%AD%A3%E7%90%86%E8%A7%A3%E8%99%9A%E6%8B%9FDOM.html#%E5%BF%AB%E9%80%9F%E6%90%9E%E5%AE%9A%E8%99%9A%E6%8B%9F-dom-%E7%9A%84%E4%B8%A4%E4%B8%AA-%E5%A4%A7%E9%97%AE%E9%A2%98)

以下只是对信息的摘取

> 在整个 DOM 操作的演化过程中，主要矛盾并不在于性能，而在于开发者写得爽不爽，在于研发体验/研发效率。`虚拟 DOM 不是别的，正是前端开发们为了追求更好的研发体验和研发效率而创造出来的高阶产物`。

vdom 并不一定会带来更好的性能，`vdom 的优越之处在于，它能够在提供更爽、更高效的研发模式（也就是函数式的 UI 编程方式）的同时，仍然保持一个还不错的性能`

总归 **虚拟 DOM 的价值不在性能，而在别处**

虚拟 DOM 解决的关键问题有以下两个：
1. **研发体验/研发效率的问题**：虚拟 DOM 的出现，为数据驱动视图这一思想提供了高度可用的载体，使得前端开发能够基于函数式 UI 的编程方式实现高效的声明式编程。
2. **跨平台的问题**：虚拟 DOM 是对真实渲染内容的一层抽象。若没有这一层抽象，那么视图层将和渲染平台紧密耦合在一起，为了描述同样的视图内容，你可能要分别在 Web 端和 Native 端写完全不同的两套甚至多套代码。

除了差量更新以外，“批量更新”也是 vdom 在性能方面所做的一个重要努力：“批量更新”在通用虚拟 DOM 库里是由 `batch` 函数来处理的。在差量更新速度非常快的情况下（比如极短的时间里多次操作同一个 DOM），用户实际上只能看到最后一次更新的效果。这种场景下，前面几次的更新动作虽然意义不大，但都会触发重渲染流程，带来大量不必要的高耗能操作

这时就需要请 `batch` 来帮忙了，`batch` 的作用是缓冲每次生成的补丁集，它会把收集到的多个补丁集暂存到队列中，再将最终的结果交给渲染函数，最终实现集中化的 DOM 批量更新

## diff 算法的优化

Vue2.x 中的 vdom 是全量的对比（每个节点不论写死还是动态的都会一层一层比较，这就浪费了大部分时间在对比静态节点上）

Vue3.x 新增了动态标记（`patch flag`），与上次虚拟节点对比时，只对比带有 `patch flag` 的节点（动态数据所在的节点）；并可通过 `flag` 信息知道当前节点要对比的具体内容。

vue 的特点是底层为 Virtual DOM，上层包含有大量静态信息的模版。为了兼容手写 `render function`，最大化利用模版静态信息，vue3.x 采用了**动静结合的解决方案**，将 vdom 的操作颗粒度变小，每次触发更新不再以组件为单位进行遍历，主要更改如下

- Vue3.x 提出动静结合的 `DOM diff` 思想，动静结合的 `DOM diff` 其实是在**预编译阶段进行了优化**。之所以能够做到预编译优化，是因为 `Vue core` 可以静态分析 `template`，在解析模版时，整个 `parse` 的过程是利用正则表达式顺序解析模板，当解析到开始标签、闭合标签和文本的时候都会分别执行对应的回调函数，来达到构造 `AST` 树的目的。
- 借助预编译过程，Vue 可以做到的预编译优化就很强大了。比如在预编译时标记出模版中可能变化的组件节点，再次进行渲染前 `diff` 时就可以跳过“永远不会变化的节点”，而只需要对比“可能会变化的动态节点”。**这也就是动静结合的 `DOM diff` 将 `diff` 成本与模版大小正相关优化到与动态节点正相关的理论依据**。

### Q: 预编译是什么

A:
对于 Vue 组件来说，模板编译只会在组件实例化的时候编译一次，生成渲染函数之后在也不会进行编译。因此，编译对组件的 runtime 是一种性能损耗。

而模板编译的目的仅仅是将 `template` 转化为 `render function`，这个过程，正好可以在项目构建的过程中完成，这样可以让实际组件在 runtime 时直接跳过模板渲染，进而提升性能，这个在**项目构建的编译 `template` 的过程，就是预编译**。

## update 性能提高

### hoistStatic 静态提升

Vue2.x 无论元素是否参与更新，每次都会重新创建然后再渲染
Vue3.x 对于不参与更新的元素，会进行静态提升，只会被创建一次，在渲染时直接复用即可

例如：下面我们利用 Vue3.x Template Explorer 来直观感受一下：

``` html
<div>
    <div>共创1</div>
    <div>共创2</div>
    <div>{{name}}</div>
</div>
```

静态提升前

``` javascript
export function render(...) {
    return (
        _openBlock(),
        _createBlock('div', null, [
            _createVNode('div', null, '共创1'),
            _createVNode('div', null, '共创2'),
            _createVNode(
                'div',
                null,
                _toDisplayString(_ctx.name),
                1 /* TEXT */
            ),
        ])
    )
}
```

静态提升之后

``` javascript
const _hoisted_1 = /*#__PURE__*/ _createVNode(
    'div',
    null,
    '共创1',
    -1 /* HOISTED */
)
const _hoisted_2 = /*#__PURE__*/ _createVNode(
    'div',
    null,
    '共创2',
    -1 /* HOISTED */
)

export function render(...) {
    return (
        _openBlock(),
        _createBlock('div', null, [
            _hoisted_1,
            _hoisted_2,
            _createVNode(
                'div',
                null,
                _toDisplayString(_ctx.name),
                1 /* TEXT */
            ),
        ])
    )
}
```

从以上代码中我们可以看出，`_hoisted_1` 和 `_hoisted_2` 两个方法被提升到了渲染函数 `render` 之外，也就是我们说的静态提升。通过静态提升可以避免每次渲染的时候都要重新创建这些对象，从而大大提高了渲染效率。

### cacheHandlers 事件侦听器缓存

Vue2.x 中，绑定事件每次触发都要重新生成全新的 function 去更新，cacheHandlers 是 Vue3.x 中提供的事件缓存对象，当 cacheHandlers 开启，会自动生成一个内联函数，同时生成一个静态节点。当事件再次触发时，只需从缓存中调用即可，无需再次更新。
默认情况下onClick会被视为动态绑定，所以每次都会追踪它的变化，但是同一个函数没必要追踪变化，直接缓存起来复用即可。

例如：下面我们同样是通过 Vue 3 Template Explorer，来看一下事件监听器缓存的作用：

``` html
<div>
    <div @click="todo">做点有趣的事</div>
</div>
```

该段 html 经过编译后变成我们下面的结构(未开启事件监听缓存)：

``` javascript
export function render(...) {
    return (_openBlock(),_createBlock('div', null, [
            _createVNode('div',{ onClick: _ctx.todo}, '做点有趣的事', 8 /* PROPS */,
                ['onClick']),
        ])
    )
}
```

当我们开启事件监听器缓存后：

``` javascript
export function render(...) {
    return (_openBlock(),_createBlock('div', null, [
            _createVNode('div',{
                    onClick:    //开启监听后
                        _cache[1] || (_cache[1] = (...args) =>_ctx.todo(...args)),
                },'做点有趣的事'),
        ])
    )
}
```

我们可以对比开启事件监听缓存前后的代码，转换之后的代码, 大家可能还看不懂, 但是不要紧，我们只需要观察有没有静态标记即可，在 Vue3.x 的 diff 算法中, 只有有静态标记的才会进行比较, 才会进行追踪。

### SSR 渲染

Vue2.x 中也是有 SSR 渲染的，但是 Vue3.x 中的 SSR 渲染相对于 Vue2 来说，性能方面也有对应的提升。

当存在大量静态内容时，这些内容会被当作纯字符串推进一个 buffer 里面，即使存在动态的绑定，会通过模版插值潜入进去。这样会比通过虚拟 dmo 来渲染的快上很多。

当静态内容大到一个量级的时候，会用_createStaticVNode 方法在客户端去生成一个 static node，这些静态 node，会被直接 innerHtml，就不需要再创建对象，然后根据对象渲染。

## 按需编译，体积比 Vue2.x 更小（Tree-shaking support）

在 Vue 3 中，通过**将大多数全局 API 和内部帮助程序移至 ES 模块导出来**，实现了这一目标。这使现代的打包工具可以静态分析模块依赖性并删除未使用的导出相关的代码。模板编译器还会生成友好的 Tree-shaking 代码，在模板中实际使用了该功能时才导入该功能的帮助程序。
框架的某些部分永远不会 Tree-shaking，因为它们对于任何类型的应用都是必不可少的。我们将这些必不可少的部分的度量标准称为基准尺寸。尽管增加了许多新功能，但 Vue 3 的基准大小压缩后约为 10 KB，还不到 Vue 2 (运行时大小压缩为 23 KB) 的一半。

## Compostion API: 组合API/注入API

> Vue2.x 中，我们一般会采用 mixin 来复用逻辑代码，用倒是挺好用的，不过也存在一些问题：**例如代码来源不清晰、方法属性等冲突**。基于此在 Vue3.x 中引入了 Composition API（组合API），**使用纯函数分隔复用代码**。和 React 中的 hooks 的概念很相似。

优点：
- 更好的逻辑复用和代码组织
- 更好的类型推导

``` html
<template>
    <div>X: {{ x }}</div>
    <div>Y: {{ y }}</div>
</template>

<script>
import { defineComponent, onMounted, onUnmounted, ref } from "vue";

const useMouseMove = () => {
    const x = ref(0);
    const y = ref(0);

    function move(e) {
        x.value = e.clientX;
        y.value = e.clientY;
    }

    onMounted(() => {
        window.addEventListener("mousemove", move);
    });

    onUnmounted(() => {
        window.removeEventListener("mousemove", move);
    });

    return { x, y };
};

export default defineComponent({
    setup() {
        const { x, y } = useMouseMove();

        return { x, y };
    }
});
</script>
```

compositon api 提供了以下几个函数：
- `setup`
- `ref`
- `reactive`
- `watchEffect`
- `watch`
- `computed`
- `toRefs`
- 生命周期的 `hooks`

### 都说 Composition API 与 React Hook 很像，说说区别

从 `React Hook` 的实现角度看，`React Hook` 是根据 `useState` 调用的顺序来确定下一次重渲染时的 `state` 是来源于哪个 `useState`，所以出现了以下限制

- 不能在循环、条件、嵌套函数中调用Hook
- 必须确保总是在你的 React 函数的顶层调用 Hook
- `useEffect、useMemo` 等函数必须手动确定依赖关系

而 `Composition API` 是基于 Vue 的响应式系统实现的，与 `React Hook` 的相比

- 声明在 `setup` 函数内，一次组件实例化只调用一次 `setup`，而 `React Hook` 每次重渲染都需要调用 Hook，使得 React 的 GC 比 Vue 更有压力，性能也相对于 Vue 来说也较慢。
- `Compositon API` 的调用不需要顾虑调用顺序，也可以在循环、条件、嵌套函数中使用
- 响应式系统自动实现了依赖收集，进而组件的部分的性能优化由 Vue 内部自己完成，而 `React Hook` 需要手动传入依赖，而且必须必须保证依赖的顺序，让 `useEffect、useMemo` 等函数正确的捕获依赖变量，否则会由于依赖不正确使得组件性能下降。

> 虽然 `Compositon API` 看起来比 `React Hook` 好用，但是其设计思想也是借鉴 `React Hook` 的。

##  新增的三个组件 Fragment、Teleport、Suspense

### Fragment

> 在书写 Vue2 时，由于组件必须只有一个根节点，很多时候会添加一些没有意义的节点用于包裹。 `Fragment` 组件就是用于解决这个问题的（这和 React 中的 `Fragment` 组件是一样的）。

这意味着现在可以这样写组件了。

``` html
/* App.vue */
<template>
  <header>...</header>
  <main v-bind="$attrs">...</main>
  <footer>...</footer>
</template>

<script>
export default {};
</script>
```

或者这样子写

``` javascript
// app.js
import { defineComponent, h, Fragment } from 'vue';

export default defineComponent({
    render() {
        return h(Fragment, {}, [
            h('header', {}, ['...']),
            h('main', {}, ['...']),
            h('footer', {}, ['...']),
        ]);
    }
});
```

### Teleport

> `Teleport` 其实就是 React 中的 `Portal`。`Portal` 提供了一种将子节点渲染到存在于父组件以外的 DOM 节点的优秀的方案。

一个 `portal` 的典型用例是当父组件有 `overflow: hidden` 或 `z-index` 样式时，但你需要子组件能够在视觉上“跳出”其容器。例如，对话框、悬浮卡以及提示框。

``` html
/* App.vue */
<template>
    <div>123</div>
    <Teleport to="#container">
        Teleport
    </Teleport>
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({
    setup() {}
});
</script>

/* index.html */
<div id="app"></div>
<div id="container"></div>
```

![Teleport 示例](image_9.png)

### Suspense

> `Suspense` 让你的组件在渲染之前进行“等待”，并在等待时显示 `fallback` 的内容。这和React中的Supense是一样的。

``` html
// App.vue
<template>
    <Suspense>
        <template #default>
            <AsyncComponent />
        </template>
        <template #fallback>
            Loading...
        </template>
    </Suspense>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import AsyncComponent from './AsyncComponent.vue';

export default defineComponent({
    name: "App",
    
    components: {
        AsyncComponent
    }
});
</script>

// AsyncComponent.vue
<template>
    <div>Async Component</div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

const sleep = () => {
    return new Promise(resolve => setTimeout(resolve, 1000));
};

export default defineComponent({
    async setup() {
        await sleep();
    }
});
</script>
```


# computed 及 watch 的理解

## computed 的实现原理

> `computed` 本质是一个惰性求值的观察者 `computed watcher`。其内部通过 `this.dirty` 属性标记计算属性是否需要重新求值。

当 `computed` 的依赖状态发生改变时,就会通知这个惰性的 `watcher`，`computed watcher` 通过 `this.dep.subs.length` 判断有没有订阅者
- 有的话，会重新计算，然后对比新旧值，如果变化了，会重新渲染。 (Vue 想确保不仅仅是计算属性依赖的值发生变化，而是当计算属性最终计算的值发生变化时才会触发渲染 `watcher` 重新渲染，本质上是一种优化。)
- 没有的话，仅仅把 `this.dirty = true` (当计算属性依赖于其他数据时，属性并不会立即重新计算，只有之后其他地方需要读取属性的时候，它才会真正计算，即具备 `lazy`（懒计算）特性。)

## watch 的理解

`watch` 没有缓存性，更多的是观察的作用，可以监听某些数据执行回调。当我们需要深度监听对象中的属性时，可以打开 `deep:true` 选项，这样便会对对象中的每一项进行监听。**这样会带来性能问题，优化的话可以使用字符串形式监听**。

> 注意：`Watcher`: 观察者对象，实例分为 `渲染 watcher`(render watcher)，`计算属性 watcher`(computed watcher)，`侦听器 watcher`(user watcher)三种。

# Vue 渲染过程

![Vue 渲染过程](image_10.png)

调用 `compile` 函数，生成 `render 函数字符串`，编译过程如下：
- `parse` 使用大量的正则表达式对 `template` 字符串进行解析，将标签、指令、属性等转化为抽象语法树 AST。`模板 -> AST （最消耗性能）`
- `optimize` 遍历 AST，找到其中的一些动态节点并进行标记，方便在页面重渲染的时候进行 diff 比较时，直接跳过这一些静态节点，**优化 runtime 的性能**
- `generate` 将最终的 AST 转化为 `render 函数字符串`

调用 `new Watcher` 函数，监听数据的变化，当数据发生变化时，Render 函数执行生成 vnode 对象
调用 `patch` 方法，对比新旧 vnode 对象，通过 DOM diff 算法，添加、修改、删除真正的 DOM 元素

# keep-alive 实现原理

> `keep-alive` 组件接受三个参数：`include`，`exclude`，`max`

- `include`：指定需要缓存的 `组件 name` 集合，参数格式支持 `String, RegExp, Array`。当为字符串时，多个组件名称以逗号隔开
- `exclude`：指定不需要缓存的 `组件 name` 集合，参数格式与 `include` 一致
- `max`：指定最多可缓存组件的数量，超出上限使用 [LRU的策略](https://baike.baidu.com/item/LRU) 置换缓存数据。，参数格式支持 `String, Number`

## 原理

`keep-alive` 实例会缓存对应组件的 `VNode`，如果命中缓存，直接从缓存对象中返回对应的 `VNode`

`LRU(Last recently used)` 算法根据数据的历史访问记录来进行淘汰数据，其核心思想是“如果数据最近被访问过，那么将来被访问的几率更高”。（墨菲定律：越担心的事情越会发生）

# 为什么访问 data 属性不需要带 data

> vue 中访问属性代理 `this.data.xxx` 转换 `this.xxx` 的实现

``` javascript
/** 将 某一个对象的属性 访问 映射到 对象的某一个属性成员上 */
function proxy (target, prop, key) {
  Object.defineProperty(target, key, {
    enumerable: true,
    configurable: true,
    get () {
      return target[prop][key];
    },
    set (newVal) {
      target[prop][key] = newVal;
    }
  })
}
```

# 23.3 - 23.5 面试笔记

## 说说 SPA 的理解，以及它的优缺点

概括性回答：SPA(single-page-application) 仅在 Web 页面初始化时加载相应的 HTML、Javascript、CSS。一旦页面加载完成，SPA 不会因为用户的操作而进行页面的重新加载或跳转；取而代之的是利用路由机制实现 HTML 的内容变换，UI 和用户交互，避免页面的重新加载。

优点：
1. 用户体验较好，内容的改变不需要重新加载整个页面，避免了不必要的跳转和重复渲染
2. 前后端分离，架构清晰，前端进行交互逻辑，后端负责数据处理。

缺点：
1. 初次加载耗时多
2. 前进后退路由管理：由于单页面应用在一个页面中显示所有内容，所以不能进行浏览器的前进后退功能。
3. 不利于 SEO

## v-show 和 v-if 的区别

v-if 是真正的条件渲染，也是惰性的；如果在初始化渲染时条件为假，则什么也不做，直到条件变为真，才会开始渲染条件块

v-show 是基于 CSS 的 display 属性进行切换。

所以，v-if 适合运行时很少改变条件，不需要频繁切换条件的场景；v-show 适合非常频繁切换条件的场景

## Vue 父子组件生命周期执行顺序

正常的一个初始化生命周期顺序：
beforeCreat -> created -> beforeMount -> mounted

更新过程：
beforeUpdate -> updated

销毁过程：
beforeDestroy -> destroyed

在父子生命周期内：
初始化时：会在父组件的 beforeMount 后内判断之后执行正常的一个组件的生命周期。

更新过程：会在父组件的 beforeUpdate 后插入

销毁过程：会在父组件的 beforeDestory 后插入

## 生命周期有哪些

- beforeCreate 初始化 vue 实例，进行数据观测。执行时组件实例还未创建，通常用于插件开发中执行一些初始化任务
- created 组件初始化完毕，可以访问各种数据，获取接口数据等
- beforeMount 此阶段 vm.el 虽已完成 DOM 初始化，但并未挂载在 el 选项上
- mounted 实例已经挂载完成，可以进行一些 DOM 操作

## 在哪个生命周期内调用异步请求？

在 created 之后，组件内的 data 及其他属性已经初始化完成且允许被访问，可以将服务端返回的数据进行赋值。所以推荐在 created 钩子函数中调用异步请求，优点是：

1. 能更快的获取到服务端数据，减少页面 loading 时间
2. ssr 不支持 beforeMount、mounted 钩子函数，所以在 created 中有助于一致性。

## 🌟🌟🌟 Vue 的生命周期钩子是如何实现的

本质上只是一些回调函数，当创建组件实例的过程中会调用对应的钩子方法；内部会对钩子函数进行处理，将钩子函数维护成数组的形式

核心实现：Vue 的生命周期钩子是利用发布订阅模式，先把用户传入的生命周期钩子订阅好（内部采用数组的方式存储）然后在创建实例的过程中会一次执行对应的钩子方法（发布）

## keep-alive 的了解

keep-alive 是 Vue 内置的一个组件，可以保存被包含的组件的状态，避免重新渲染，有以下特点：

1. 一般是结合路由和动态组件一起使用，用于缓存组件
2. 提供了 include 和 exclude 和 max 属性，两者都支持字符串或正则表达式，include 表示匹配的组件会缓存，exclude 表示匹配的组件不会被缓存。其中 exclude 的优先级高于 include。max 表示最多可以缓存多少个组件
3. 对应两个钩子函数 activated 和 deactivated，当组件首次或再次激活时，会触发 activated，当组件被移除时，触发 deactivated

- 首次进入组件时：beforeRouteEnter > beforeCreate > created > mounted > activated > ... ... > beforeRouteLeave > deactivated
- 再次进入组件时：beforeRouteEnter > activated > ... ... > beforeRouteLeave > deactivated

原理：keep-alive 是一个通用组件，内部定义了一个 map，缓存创建过的组件实例，它返回的渲染函数内部会查找内嵌的 component 组件对应的 vnode，如果该组件在 map 中存在就直接返回它。由于 component 的 is 属性是一个响应式数据，因此只要它变化，keep-alive 的 render 函数就会重新执行

## 为什么组件中的 data 是一个函数

因为组件是用来复用的，而 JS 中对象是引用关系，如果组件中 data 是一个对象，那么这样作用域没有隔离，子组件中的 data 属性值会相互影响。而 new Vue 的实例是不会被复用的，所以不存在引用对象的问题

## v-model 的原理

v-model 本质上是一种 v-on，v-bind 的语法糖。其内部为不同的输入元素使用不同的属性并抛出不同的事件：

1. text 和 textarea 元素使用 value 属性 & input 事件
2. checkbox 和 radio 使用 checked 属性 & change 事件
3. select 将 value 作为 prop 并将 change 作为事件

## Vue 组件间通行有哪几种方式？

组件间的通信主要指的有以下 3 类：父子间，隔代间，兄弟间

1. props / $emits 适合父子间通信
2. ref 与 $parent / $children 适合父子间通信
3. provide / inject 适合隔代组件通信
4. EventBus（$emit / $on / $off） 都适合
    这种方法通过一个空的 vue 实例作为中央事件中心，用它来触发事件和监听事件，从而实现任何组件间的通信
5. vuex 是都适合
    vuex 是一种状态管理模式，vuex 的状态存储是响应式的，当 vue 组件从 stroe 中读取状态的时候，若 store 状态改变了，那相应的组件也会得到更新

## Vue SSR

一般的 SPA 应用，需要等待所有 js 文件下载完成后，才开始进行页面的渲染，这就导致首屏加载时间长。而 SSR 是在服务端形成 HTML 片段直接返回给客户端

优点：
1. 更好的 SEO：因为 SSR 是直接由服务端返回已经渲染好的页面，所以搜索引擎爬取工具可以抓取到页面的具体内容
2. 更快的首屏渲染：SSR 是直接由服务端渲染好页面直接返回显示，无需等待加载 JS 文件

缺点：
1. 更多的开发限制：例如服务端渲染只支持 beforeCreate 和 created 这两个钩子函数，还会导致一些外部扩展库需要特殊处理，才能在服务端渲染应用程序。与 SPA 不同，服务端渲染应用程序，需要处于 Node.js server 运行环境
2. 更多的服务器负载：在 Node.js 中渲染完整的应用程序，显然比仅提供静态文件的 server 负载更多。

## 🌟🌟🌟 vue-router 的路由模式

vue-router 有三种路由模式：hash、history、abstract

hash：使用 URL hash 值来作路由。支持所有浏览器，包括不支持 HTML5 History Api 的浏览器；

1. URL 中 hash 只是客户端的一种状态，当向服务器发送请求时，hash 部分不会被发送
2. hash 值的改变，都会在浏览器的访问历史中增加一条记录，因此我们可以通过浏览器的回退、前进来控制 hash 的改变
3. 可以通过 a 标签改变 hash，亦或通过 js 来对 location.hash 进行赋值来改变 URL 的 hash 值
4. 通过 hashchange 事件来监听 hash 值的变化，从而改变页面的内容

缺点：SEO 不友好

history：HTML5  提供了 History API 来实现 URL 的变化，其中涉及的 API 有：history.pushState() 和 history.replaceState() 在不刷新页面的情况下，操作浏览器的历史记录。并且我们可以使用 popstate 事件来监听 URL 的变化，从而改变页面的内容。

1. pushState、replaceState 来操作浏览器历史记录
2. 使用 popstate 事件监听 URL 的变化
3. history.pushState 和 history.replaceState 并不会触发 popstate 事件，只是往浏览器的历史记录内添加一条或者修改。

缺点：IE8 不支持，因为没有这类 API

abstract：支持所有 JavaScript 运行环境，如 Node.js 服务器端。如果发现没有浏览器的 API，路由会自动强制进入这个模式。

缺点：没有 URL，只对单机有效，前面两种都是把路径存储到 URL 上面，这个前端一般放在 localstorage 里面

> 注意：v4 之前叫做 abstract history，之后叫做 Memory History

## 🌟🌟🌟 vue-router 有哪几种守卫

1. 全局守卫
    - router.beforeEach 全局前置守卫 进入路由之前
    - router.beforeResolve 全局解析守卫(2.5.0+) 在beforeRouteEnter调用之后调用
    - router.afterEach 全局后置钩子 进入路由之后
2. 路由守卫
    - beforeEnter
3. 组件守卫
    - beforeRouteEnter 进入路由前, 在路由独享守卫后调用 不能 获取组件实例 this，组件实例还没被创建
    - beforeRouteUpdate (2.2) 路由复用同一个组件时, 在当前路由改变，但是该组件被复用时调用 可以访问组件实例 this
    - beforeRouteLeave 离开当前路由时, 导航离开该组件的对应路由时调用，可以访问组件实例 this

## router-link 和 router-view 是如何起作用的

首先，router-link 起导航的作用，router-view 起内容渲染的作用。
使用 router-link 默认生成 a 标签，设置 to 属性定义跳转 path，router-view 是显示组件的占位组件，可以嵌套，对应路由配置的嵌套关系，配合 name 可以显示具名组件。
router-link 组件内部根据 custom 属性判断如何渲染最终生成节点，内部提供导航方法 navigate，用户点击之后实际调用的是该方法，此方法最终会修改响应式的路由变量，然后重新去 routes 匹配出数组结果，router-view 则根据其所处深度 deep 在匹配数组结果中找到对应的路由并获取组件，最终将其渲染出来。

## 怎么实现路由懒加载

- 当打包构建应用时，JavaScript 包会变得非常大，影响页面加载。利用路由懒加载我们能把不同路由对应的组件分割成不同的代码块，然后当路由被访问的时候才加载对应组件，这样会更加高效，是一种优化手段
- 一般来说，对所有的路由都使用 **动态导入** 是个好主意
- 给 component 选项配置一个返回 Promise 组件的函数就可以定义懒加载路由。例如：{ path: '/users/:id', component: () => import('./views/UserDetails') }
- 结合注释 () => import(/* webpackChunkName: "group-user" */ './UserDetails.vue') 可以做 webpack 代码分块

## 🌟🌟🌟 Vue 中如何进行依赖收集

1. 每个属性都有自己的 Dep 属性，存放他所依赖的 watcher，当属性变化之后会通知自己对应的 watcher 去更新
2. 默认会在初始化时调用 render 函数，此时会触发属性依赖收集 dep.depend
3. 当属性发生修改时会通过自己的 dep 去触发通知到依赖的 watcher 去更新

## Vue 实例挂载的过程发生了什么

1. 挂在过程发生在 app.mount() 过程，这个过程做了两件事：初始化 和 建立更新机制
2. 初始化会创建组件实例，初始化组件状态，创建各种响应式数据
3. 建立更新机制会立即执行一次组件更新函数，这会首次执行组件渲染函数并执行 patch 将前面获得 vnode 转换为 dom；同时首次执行渲染函数会创建它内部响应式数据之间和组件更新函数之间的依赖关系，这使得以后数据变化时会执行对应的更新函数

## 🌟🌟🌟 Vue 响应式原理

Vue2.x

整体思路：数据劫持 + 观察者模式
对象内部通过 defineReactive 方法，使用 Object.defineProperty 来劫持各个属性的 getter，setter，数组通过重写数组的 7 个方法（push、pop、splice、unshift、shift、sort、revers）来实现的，当页面使用了对应属性时，每个属性都拥有自己的 dep 属性，存放他所依赖的 watcher，当属性变化后通知自己对应的 watcher 去更新

## 🌟🌟🌟 Vue 编译过程

Vue 编译模版分为三个阶段：parse、optimize、generator，最终生成 render function

1. 解析阶段（Parsing Stage）：Vue 首先会通过正则表达式对模板进行解析，然后生成一个抽象语法树（AST）。在这个阶段，Vue 会忽略所有的指令和插值，并且只关注 HTML 标签、属性和文本节点等基础的结构。
2. 静态标记阶段（Static Marker）：Vue 会遍历 AST 并且记录所有静态节点，即不包含变量或表达式的节点，例如纯文本、固定标签等。这个阶段是针对优化性能而设计的，以避免在每次重新渲染时都进行一遍比较。
3. 优化阶段（Optimization）：这个阶段是对模板进行分析并应用各种优化策略的阶段。主要的优化有静态节点提升、事件侦听器缓存、条件渲染的静态节点提升等。目的是尽可能地减少渲染函数的执行时间，提高渲染性能。
4. 代码生成阶段（Codegen）：最后，Vue 将优化后的 AST 转换为可执行的、平台无关的渲染函数，并且将其编译为 JavaScript 代码。这个渲染函数最终会被注入到 Vue 实例中，在组件实例化时动态执行，从而生成虚拟 DOM 并完成组件的渲染。

## 🌟🌟🌟 Vue 响应式过程

初始化时：
当 render function 被渲染的时候，因为会读取所需对象的值，所以会触发 getter 函数的【依赖收集】，【依赖收集】的目的是将观察者 watcher 对象存放到当前闭包中的订阅者 Dep 的 sub 中。

数据变更时：
在修改对象的值的时候，会触发对应的 setter，setter 通知之前【依赖收集】得到的 Dep 中的 watcher 需要重新渲染视图，这时 watcher 会开始调用它们的 uodate 来更新视图，在这中间还有 patch 的过程以及使用队列来异步更新的策略。

## 🌟🌟🌟 使用 Virtual DOM 的原因

优点：
1. 保证了性能的下限：保证我们不需要手动进行 DOM 操作，也依旧有不错的性能。
2. 无需手动操作 DOM：极大的提高了我们的开发效率
3. 实现跨平台：虚拟 DOM 本质上是 Javascript 对象，而 DOM 与平台强相关，相比之下，虚拟 DOM 可以进行更方便的跨平台操作，如服务端渲染，weex 开发等
缺点：
1. 无法进行极致优化
2. 首次渲染大量 DOM 时，由于多了一层虚拟 DOM 计算，会比 innerHTML 插入慢。


## Vue 是如何实现数据双向绑定的？

Vue 数据双向绑定主要是指：数据变化更新视图，视图变化更新数据

Vue 主要通过 4 个步骤来实现数据双向绑定
1. 实现一个监听器 Observer：对数据对象进行深度遍历，Object.defineProperty() 对对象的属性上添加 setter 和 getter，当给这个对象的某个属性赋值时，就会触发 setter，就能监听到数据变化。
2. 实现一个解析器 Compile：解析 Vue 模版指令，将模版中的变量都替换成数据，然后初始化渲染页面视图，并将每个指令对应的节点绑定更新函数，添加监听数据的订阅者，一旦数据有变化，收到通知，调用更新函数进行数据更新
3. 实现一个订阅者 Watcher：Watcher 订阅者是 Observer 和 Compile 之间通信的桥梁，主要的任务是订阅 Observer 中的属性值变化的消息，当收到属性变化的消息时，触发解析器 Compile 中对应的更新函数
4. 实现一个订阅器 Dep：订阅器采用 发布-订阅 设计模式，用来收集订阅者 Watcher，对监听器 Observer 和订阅者 Watcher 进行统一管理

## Vue 如何实现对对象和数组的监听

对象的监听：是通过递归遍历对象，从而达到利用 Object.defineProperty() 对对象进行监听。
数组的监听：借助 Object.definePrototype(),  对这些可以改变数组的方法（pop、shift、unshift、splice、sort、reverse 、push）进行修改与加工，即创建一个拦截器

## 🌟🌟🌟 Proxy 与 Object.defineProperty 优劣对比

Proxy 的优势：
1. 能直接监听对象本身而非属性
2. 能直接监听数组的变化
3. 有 13 中拦截器
4. 是返回一个新的对象，可以只操作新的对象达到目的，而 Object.defineProperty 只能遍历对象属性
5. 做为新标准被浏览器厂商重点持续的性能优化

Object.defineProperty 的优势：
1. 有较好的兼容性，因为 Proxy 不能做到完全的 polyfill（由于它会修改 JavaScript 的一些底层代码的执行方式，所以它是无法被完全 polyfill 的。）

问题是：
1. 无法监听数组的变化，只能将 push、pop、shift、unshift、splice、sort、reverse 这些方法重写来实现监听数组变化。
2. 必须遍历对象的每个属性
3. 必须深层遍历嵌套的对象

## 🌟🌟🌟 Vue.$set 的原理

实现原理：
1. 如果目标是数组，就直接使用数组的 splice 方法来触发响应式
2. 如果目标是对象，会通过调用 defineReactive 方法进行响应式处理

## 🌟🌟🌟 Vue.mixin 的使用场景和原理

场景：在日常开发中，会遇到不同的组件经常使用一些相同的代码或相似的代码，这些代码的功能相对独立，可以通过 mixin 功能进行抽离

原理：类似对象的继承，当组件初始化时会调用 mergeOption 方法进行合并。

策略模式：当组件和混入对象含有同名选项时，这些选项将以恰当的方式进行“合并”；如果混入的数据和本身组件的数据冲突，会以组件的数据为准

缺点：命名冲突、依赖来源，数据来源不明等问题。并且 mixin 的数据是不会被共享的。

## 🌟🌟🌟 Vue.use 的原理

> Vue.use 是用来使用插件的，我们可以在插件中扩展全局组件、指令、原型方法等

原理：利用闭包缓存一系列插件，当是新的插件的时，调用插件的 install 方法，然后直接让函数执行，最后将其缓存。

## 🌟🌟🌟 nextTick 在哪里使用？原理是什么？

为什么有 nextTick：Vue 有个异步更新策略，意思是如果数据变化，Vue 不会立刻更新 DOM，而是开启一个队列，把组件更新函数保存在队列中，在同一事件循环中发生的所有数据变更会异步的批量更新。这一策略导致我们对数据的修改不会立刻体现在 DOM 上，此时如果想要获取更新后的 DOM 状态，就需要使用 nextTick 在修改数据之后立即使用这个方法，获取更新后的 DOM。

使用场景：nextTick 中的回调是在下次 DOM 更新循环结束之后执行延迟回调，用于获得更新后的 DOM。

主要思路：采用微任务优先的方式调用异步方法去执行 nextTick 包装的方法

原理：根据执行环境分别尝试采用
1. 先采用 Promise
2. Promise 不支持，在采用 MutationObserver（它会在指定的 DOM 发生变化时被调用）
3. MutationObserver 不支持，再采用 setImmediate
4. 如果以上都不行则采用 setTimeout
5. 最后执行 flushCallbacks，把 callbacks 里面的数据依次执行

## 🌟🌟🌟 computed 和 watch 的区别

使用场景：当页面中有某些数据依赖其他数据进行变动的时候，可以使用计算属性 computed；watch 用于观察和监听页面上的 vue 实例，如果要在数据变化的同时进行异步操作或者是比较大的开销，那么 watch 为最佳选择。

computed 本质是一个具备缓存的 watcher，依赖的属性变化就会更新视图。适用于计算比较消耗性能的计算场景。

watch 没有缓存性，更多的是观察的作用，可以监听某些数据执行回调。

computed 不会立即执行，内部通过 defineProperty 进行定义。并且通过 dirty 属性来检测依赖的数据是否发生变化。watch 则是立即执行将老值保存在 watcher 上，当数据更新时重新计算新值，将新值和老值传递到回调函数中

vue3 中 watch 选项发生了一些变化，例如不再能侦测一个点操作符之外的字符串形式的表达式；reactivity API 中新出现了 watch、watchEffect 可以完全替代目前的 watch 选项，且功能更加强大。

## Vue3 中的 watch 和 watchEffect 区别

- watch 是惰性执行，也就是只有监听的值发生变化的时候才会执行，但是 watchEffect 不同，每次代码加载都会被执行一次。
- watch 需要传递监听的对象，watchEffect 不需要
- watch 只能监听响应式数据：ref 定义的属性和 reactive 定义的对象，如果直接监听 reactive 定义对象中的属性是不允许的（会报警告），除非使用函数转换一下。其实就是官网上说的监听一个 getter
- watchEffect 如果直接监听 reactive 定义的对象是不起作用的。只能监听对象中的属性，才会在属性变化时再次触发

## 🌟🌟🌟 Vue2 和 Vue3 的 diff 算法有什么区别

> Vue 的 diff 算法是平级比较，不考虑跨级比较的情况。内部采用 **深度递归的方式 + 双指针** 的方式进行比较

比较过程
1. 先比较是否是相同节点
2. 相同节点比较属性,并复用老节点
3. 比较儿子节点，考虑老节点和新节点儿子的情况
4. 优化比较：头头、尾尾、头尾、尾头
5. 比对查找进行复用

Vue3中采用 **最长递增子序列** 实现 diff 算法：总的来说是使用 贪心算法 + 二分法查找

## 🌟🌟🌟 diff 优化

vue 和 react 将 diff 算法优化到 O(n) 的时间复杂度，基于了以下三个前提策略：

- 只对同级元素进行比较。Web UI 中 DOM 节点跨层级的移动操作特别少，可以忽略不计，如果出现跨层级的 dom 节点更新，则不进行复用。
- 两个不同类型的组件会产生两棵不同的树形结构。
- 对同一层级的子节点，开发者可以通过 key 来确定哪些子元素可以在不同渲染中保持稳定。

## Vue 中 Computed 的实现 和 Watch 的原理

Computed 的实现：建立与其他属性的联系，属性改变后，通知计算属性重新计算，当数据没有变化时，不会触发更新。

实现如下：
1. 初始化 data，使用 Object.defineProperty 把每个属性全部转化为 getter/setter
2. 初始化 Computed，遍历 Computed 里的每个属性，每个 Computed 属性都是一个 Watch 实例。每个属性提供的函数作为属性的 getter，使用 Object.defineProperty 转化。
3. 在 getter 中收集依赖，当依赖变化时，触发属性重新计算
4. 当出现 Computed 嵌套关系时，先进行其他的依赖收集

Watch 的原理：本质是为每一个监听的属性 setter 创建一个 watcher，当监听的属性更新时，调用传入的回调函数。

- deep：深度监听对象，为对象的每个属性创建一个 watcher。引入 deep 能够更好的解决监听对象的问题，同时引入了判断机制，确保在多个属性更新时只触发一次回调函数，避免性能浪费。
- immediate：在初始化时直接调用回调函数，可以在 create 阶段手动用回调函数实现相同的效果

Q：Watch deep:true 是如何监听数组对象的

A：当监听的是数组对象时，会对数组对象的每一项进行求值，此时会将当前 watcher 存入到对应的属性依赖中，这样当数组中对象发生变化时也能通知数据更新

## 谈一谈组件化的理解

- 组件化能大幅度提高开发效率
- 常用的组件化技术：属性、自定义事件、插槽等
- 降低更新频率：只重新渲染变化的组件
- 组件的特点有：高内聚、低耦合、单向数据流

## 函数式组件的优势和原理

优势：由于函数式组件不需要实例化，无状态，没有生命周期，所以渲染性能要好于普通组件；函数式组件结构简单，代码结构更清晰。

使用场景：作为一个容器组件使用。
- 比如 router-view ，高阶组件

## Vue 中 .sync 和 v-model 的区别

.sync 的作用
- .sync 可以实现父子组件之间的双向绑定，并且实现子组件同步修改父组件的值，相比较 v-model，一个组件上可以有多个 .sync 修饰符

相同点：都是一种语法糖，可以实现父子组件中数据的双向通信

不同点：
- 格式不同：v-model="num"；:num.sync="num"
- 语法糖不同：v-model：@input + value；:num.sync：@update:num
- v-model 只能用一次，.sync 可以有多个

## 什么是作用域插槽

``` js
<app>
    <div slot="a">xxxx</div>
    <div slot="b">xxxx</div>
</app> 

slot name="a" 
slot name="b"
```

普通插槽
- 创建组件虚拟节点时，会将组件儿子的虚拟节点保存起来，当初始化组件时，通过插槽属性将儿子进行分类 {a:[vnode],b[vnode]}
- 渲染组件时会拿对应的 slot 属性的节点进行替换操作。（插槽的作用域为父组件）

作用域插槽
- 作用域插槽在解析的时候不会对组件的儿子节点，会解析成函数，当子组件渲染时，会调用此函数进行渲染（插槽的作用域为子组件）

## Vuex 是什么？怎么使用？哪些功能场景使用它？

Q：是什么？

A：
给定义：Vuex 是专门为 vue 应用开发的 **状态管理模式 + 库**。它采用集中式存储，管理应用的所有组件的状态，并以相应的规则保证状态以一种可以预测的方式发生变化。
必要性阐述：我们希望以一种简单的“单向数据流”的方式管理应用，即 状态 -> 视图 -> 操作单向循环 的方式。这样做我们的代码将变得更结构化且易维护。
何时使用：当我们要构建一个中大型应用时，Vuex 基本是标配

Q：缺点有哪些

A：刷新浏览器，vuex 中的 state 会重新变为初始状态。解决方案-插件：vuex-persistedstate

## action 和 mutation 的区别是什么？为什么要区分它们？

区别：
- action 中处理异步，mutation 不可以
- mutation 做原子操作
- action 可以整合多个 mutation 的集合
- mutation 是同步更新数据(内部会进行是否为异步方式更新数据的检测) $watch 严格模式下会报错
- action 异步操作，可以获取数据后调佣 mutation 提交最终数据

区分的原因：
- 流程顺序：“相应视图—>修改 State”拆分成两部分，视图触发 Action，Action 再触发 Mutation`。
- 角色不同，二者有不同的限制：Mutation：必须同步执行。Action：可以异步，但不能直接操作 State。基于角色的不同：
    Mutation：专注于修改State，理论上是修改State的唯一途径。Action：业务代码、异步请求

## 怎么监听 vuex 数据的变化

自然可以在组件内进行 watch，另外 vuex 也提供了订阅的API：store.subscribe()

区别：
- 因为 state 是响应式数据，所以可以使用 watch。 watch 简单好用，且能获取到变化前后的
- subscribe 方法会被所有 commit 行为触发，因此还需要判断 mutation.type，用起来略繁琐，所以一般用于 vuex 插件中，一般用在 vuex 数据的需要缓存时的统一处理。

## Vuex 的缺点有什么

vuex 利用响应式，使用起来已经相当方便快捷了，但是在使用过程中感觉模块这边过于复杂了，用的时候容易出错，需要进场查阅文档。
比如访问 state 时要带上模块 key，内嵌模块的话这个 key 会很长，需要配合 mapState 使用，加不加 namespace 区别也很大，getters，mutations，actions 默认都是全局，加上之后必须字符串类型的 path 匹配。对 ts 的支持也不友好，在使用模块时没有代码提示。
虽然有一定的解决方案，但又需要学一套新东西，增加了学习成本。pinia 的体验会好很多。

## Pinia 是什么？有什么优点？

Q：pinia 是什么

A：在Vue3中，可以使用传统的 Vuex 来实现状态管理，也可以使用最新的 pinia 来实现状态管理，我们来看看官网如何解释 pinia 的：Pinia 是 Vue 的存储库，它允许您跨组件/页面共享状态。
实际上，pinia 就是 Vuex 的升级版，官网也说过，为了尊重原作者，所以取名 pinia，而没有取名 Vuex，所以大家可以直接将 pinia 比作为 Vue3 的 Vuex

Q：为什么使用 pinia

A：
1. vue2、vue3 都支持
2. pinia 中只有 state、getter、action，抛弃了 mutation。
3. pinia 中的 action 支持同步和异步
4. 良好的 ts 支持
5. 无需创建各个模块嵌套，在 Vuex 中如果数据过多，我们通常分模块管理。而 pinia 中每个 store 都是独立的，互不影响。
6. 体积非常小，只有 1kb 左右
7. 支持插件扩展自身功能
8. 支持服务端渲染

## Vue 内置的修饰符有哪些

表单修饰符：
- .lazy：在 input 标签内，光标离开标签的时候，才会给 value 赋值，也就是在 change 事件后才进行数据同步
- .trim：移出左右的空格
- .number: 输入值转为数值类型，如果无法被 parseFloat 解析，则返回原来的值

事件修饰符：
- .stop：阻止事件冒泡
- .prevent：阻止默认事件
- .capture：使用事件捕获模式
- .self：只在 event.target 是当前自身元素时才触发处理函数
- .once：绑定事件只触发一次
- .passive：告诉浏览器不想阻止默认事件
- .native: 让组件变得像 html 内置标签那样监听跟元素的原生事件，否则只能监听组件的自定义事件。

v-bind 修饰符：
- .sync：对 props 进行一个双向绑定

## Vue 的内置指令

- v-once：定义它的元素或组件只渲染一次，之后将被视作静态内容
- v-clock：是解决屏幕闪动的好方法。但在大型、工程化的项目中（webpack、vue-router）只有一个空的 div 元素，元素中的内容是通过路由挂载来实现的，这时我们就不需要用到 v-cloak 指令咯。
- v-bind：绑定属性
- v-on：监听 DOM 事件
- v-html：赋值变量 innerHTML，需要注意防止 XXS
- v-text：更新元素的 textContent
- v-model：在普通标签/组件上，是 value & input 的语法糖
- v-if/v-else-if/v-else
- v-show
- v-for
- v-pre：跳过这个元素及其子元素的编译过程，用来加快编译

## 自定义指令及其原理

Vue 有一组默认的指令，比如 v-model，v-for

使用自定义指令分为定义、注册和使用三步：
1. 定义分为两种方式：对象和函数形式，前者类似组件定义，有各种生命周期；后者只会在 mounted 和 updated 时执行
2. 注册：分为全局注册（app.directive()）和局部注册({directives: {}})
3. 使用：在注册名称的前面加上 v- 即可

在 vue3 中，钩子的名称与组件一致方便记忆。在 setup 中以 v 开头的都可以被用作一个自定义指令。

## 🌟🌟🌟 Vue3 对 Vue2 的优势

1. 性能更好

两方面：
    1. 使用 Proxy 代替 Object.defineProperty
        - 针对 对象 本身进行拦截
        - 多达 13 中拦截器
        - 能对 数组 进行拦截
        - 性能更强，被更多浏览器厂商关注
    2. Virtual DOM diff 优化。Vue3 采用 **动静结合的解决方式**
        - 在**预编译阶段进行了优化**。之所以能够做到预编译优化，是因为 `Vue core` 可以静态分析 `template`，在解析模版时，整个 `parse` 的过程是利用正则表达式顺序解析模板，当解析到开始标签、闭合标签和文本的时候都会分别执行对应的回调函数，来达到构造 `AST` 树的目的。
        - 借助预编译过程，可以在预编译时标记出模版中可能变化的组件节点，再次进行渲染前 `diff` 时就可以跳过“永远不会变化的节点”，而只需要对比 `可能会变化的动态节点`。**这也就是动静结合的 `DOM diff` 将 `diff` 成本与模版大小正相关优化到与动态节点正相关的理论依据**。
    3. hoistStatic 静态提升（典型的拿空间换时间的优化策略）：对不参与更新的元素，会做静态提升，只会被创建一次，之后会在每次渲染时候被不停的复用。免去了重复的创建操作，优化了运行时候的内存占用。
    4. 事件监听缓存
        - 默认情况下 onClick 会被视为动态绑定，所以每次都会追踪它的变化，但是同一个函数没必要追踪变化，直接缓存起来复用即可。
    5. SSR 渲染优化
        - 当静态内容大到一个量级的时候，会直接去生成一个 static node，会被直接 innerHtml，就不需要再创建对象，然后根据对象渲染。即使存在动态的绑定，会通过模版插值潜入进去。这样会比通过虚拟 dmo 来渲染的快上很多。

2. 按需编译，体积更小

vue3 中实现了将大多数全局 API 和内部帮助程序移至 ES 模块导出来。这使得现代的打包工具可以静态分析模块依赖性并删除未使用的导出相关的代码。

3. 引入 Composition API 实现更好的代码组织，更好的逻辑抽离。

compositon api 提供了以下几个函数：
- `ref`
- `reactive`
- `watchEffect`
- `watch`
- `computed`
- `toRefs`：将 reactive 内部属性转换为 Ref 对象
- 生命周期的 `hooks`
    - 没有 created 之前的生命周期了，用成了 setup。后续的其他生命周期加了个 on 前缀

4. 更好的 TS 支持

5. 新增组件
    - Fragment
    - Teleport（to 属性就是目标位置）：组件的逻辑位置写模板代码，然后在 Vue 应用范围之外渲染它
    - Suspense

## 🌟🌟🌟 Composition API 和 React Hooks 的对比

Composition API 的 setup (相当于created、beforeCreate的合集)只会调用一次，而 React Hooks 函数在渲染过程中会被多次调用
Composition API 无需使用 useMemo、useCallback 避免子组件重复渲染，因为 setup 只会调用一次，在 setup 闭包中缓存了变量
Composition API 无需顾虑调用顺序，而 React Hooks 需要保证 hooks 的顺序一致（比如不能放在循环、判断里面）
Composition API的 ref、reactive 比 useState 难理解

## ref 和 reactive 的异同

定义上：ref 通常用于处理单值的响应式，reactive 用于处理对象类型的数据响应式。
返回上：
ref 返回响应式 Ref 对象，需要加上 .value 才能访问其值。ref 可以接收复杂类型，但内部依然是 reactive 实现响应。
reactive 内部使用 Proxy 代理对象进行拦截来实现响应式操作。使用展开运算符(...)展开 reactive 返回的响应式对象会使其失去响应性，可以结合 toRefs() 将值转换为 Ref 对象之后再展开。

## 为什么需要 toRef 和 toRefs

初衷：不丢失响应式的情况下，把对象数据 分解/扩散
前端：针对的是响应式对象（reactive封装的）非普通对象
注意：不创造响应式，而是延续响应式

``` js
function useFeatureX() {
    const state = reactive({
        x: 1,
        y: 2
    })

    return toRefs(state)
}

// 使用时
// 解构不丢失响应式
const { x, y } = useFeatureX()
```

## Vue 为什么没有类似于 React 中 shouldComponentUpdate 的生命周期

> 根本原因是 Vue 和 React 的变化侦测方式不同

当 React 知道发生变化后，会使用 Virtual Dom Diff 进行差异检测，但是很多组件实际上是肯定不会发生变化的，这个时候需要 shouldComponentUpdate 进行手动操作来减少 diff，从而提高程序整体的性能。

Vue 在一开始就知道那个组件发生了变化，不需要手动控制 diff，而组件内部采用的 diff 方式实际上是可以引入类似于shouldComponentUpdate 相关生命周期的，但是通常合理大小的组件不会有过量的 diff，手动优化的价值有限，因此目前Vue并没有考虑引入 shouldComponentUpdate 这种手动优化的生命周期

## vue-loader 是什么？有什么作用

- vue-loader 是用于处理单文件组件的 webpack loader
- webpack 打包时，会以 loader 的方式调用 vue-loader

## Vue 中常见的性能优化

代码：
- 使用 v-show 复用 DOM：避免重复创建组件
- 合理使用路由懒加载、异步组件，有效拆分 App 尺寸，访问时才异步加载
- keep-alive 缓存页面：避免重复创建组件实例，且能保留缓存组件状态
- v-once 和 v-memo：不再变化的数据使用 v-once，按条件跳过更新时使用 v-memo
- 长列表性能优化：如果是大数据长列表，可采用虚拟滚动，只渲染少部分区域的内容
- 组件销毁后把全局变量和事件销毁：Vue 组件销毁时，会自动解绑它的全部指令及事件监听器，但是仅限于组件本身的事件
- 图片懒加载
- 第三方插件按需引入：（babel-plugin-component）像 element-plus 这样的第三方组件库可以按需引入避免体积太大

用户体验：
- app-skeleton 骨架屏

SEO 优化
- 预渲染插件 prerender-spa-plugin
- 服务端渲染 ssr

打包优化
- Webpack 对图片进行压缩
- 减少 ES6 转为 ES5 的冗余代码
    - babel-plugin-transform-runtime 插件就是用来实现这个作用的，将相关辅助函数进行替换成导入语句，从而减小 babel 编译出来的代码的文件大小。
- 使用 cdn 的方式加载第三方模块
- 多线程打包 happypack
- splitChunks 抽离公共文件
- 优化 SourceMap
    - 开发环境推荐：cheap-module-eval-source-map；生产环境推荐：cheap-module-source-map
- 构建结果输出分析，利用 webpack-bundle-analyzer 可视化分析工具

基础 web 技术优化
- 服务端 gzip 压缩
- 浏览器缓存
- CDN 的使用
- 使用 Chrome Performance 查找性能瓶颈
