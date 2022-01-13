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

Vue3.x响应式数据原理

`Vue3.x` 改用 `Proxy` 代替 `Object.defineProperty`。因为 `Proxy` 可以直接监听 **对象和数组** 的变化，并且有多达 13 种拦截方法。并且作为新标准将受到浏览器厂商重点持续的性能优化。

常见的几种拦截方法有：

- handler.get(): 属性读取操作的捕捉器。
- handler.set(): 属性设置操作的捕捉器。
- handler.deleteProperty(): delete 操作符的捕捉器。
...等 [其他拦截器](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy)

Q: `Proxy` 只会代理对象的第一层，那 `Vue3.x` 是如何处理的呢？

A: 判断当前 `Reflect.get` 的返回值是否为 `object`，如果是则通过 `reactive` 方法做代理，这样子就实现了深度监听。
