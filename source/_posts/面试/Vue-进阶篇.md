---
title: Vue 进阶篇
tags:
  - 深入原理
categories:
  - Vue
hidden: true
date: 2022-01-12 15:16:04
abbrlink:
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

`Vue` 采用数据劫持结合发布-订阅模式的方法，通过 `Object.defineProperty` 来劫持各个属性的 `getter`、`setter`。在数据变化时发布消息给订阅者，触发相应的监听回调