---
title: 对 Vue2.x 和 Vue3.x 的监听实现与理解
tags:
  - 监听原理实现与理解
categories:
  - Vue
hidden: false
abbrlink: 1747204526
date: 2022-01-13 13:51:28
---

在 `Vue2.x`，`Vue3.x` 中对数据的监听方式已经是老生常谈了，不外乎就是对 `Object.defineProperty` 以及 `Proxy` 的了解。虽然能够在 MDN 中能够看到相关的详细信息，但是总归感觉是行走在浮冰之上。还是得将自己的理解描述成文字记录下来靠谱👍。

## 使用 `Object.defineProperty` 实现监听（Vue2.x）

先总结一下 `Object.defineProperty` 的监听缺点：无法监听属性的添加或者移除；无法监听数组索引直接赋值；无法监听修改数组的长度。

- 监听对象属性的添加或者移除： `vue` 提供了 `set`、`delete` 方法
- 监听数组内容、长度的更改：修改数组的继承关系，重写方法，在重写方法内部进行拦截调用

> 但是不要有一种 `Object.defineProperty` 无法监听数组变化的误区。`Object.defineProperty` 可以对数组做监听，只是这么做会对性能有很大影响：
> 1. 当给数组某一项赋值的时候，会依次读取数组的所有值
> 2. 数组长度不确定，无法提前打上 `setter/getter`。

在文件夹内创建两个文件：

```
根目录
  |- index.html
  |- index.js
```

index.html 中对 index.js 做引入，并且创建标签 `<h2/>`

``` html
...
<h2 id="app"></>

<script src="./index.js"></script>
...
```

接下来，就是 `Object.defineProperty` 的操作秀了。

``` javascript
// index.js
// 模拟 Vue 实例中 data 属性
let data = {
    msg: 'hello',
    list: []
}

// 模拟 Vue 实例中的 vm 对象
let vm = {}

Object.defineProperty(vm, 'msg', {
    enumerable: true,
    configurable: true,
    get () {
        console.log('获取绑定数据', data.msg);
        return data.msg
    },
    set (newVal) {
        console.log('更新绑定数据', newVal);
        if (newVal === data.msg) {
            return;
        }
        data.msg = newVal
        document.getElementById('app').textContent = newVal
    }
})
```

这样子，在 index.html 中， F12 打开控制台，输入 `vm.msg = 'hello world'` 就能看到效果了。

![绑定属性值是基本类型](image_1.png)

此时，我们就对 `Object.defineProperty` 有了一个基本的使用了。当 `data` 中有多个属性时，我们可以将 `Object.defineProperty` 封装到一个函数中，对 `data` 的属性做遍历添加监听器。

``` javascript
// 模拟 Vue 实例中 data 属性
let data = {
    msg: 'hello',
    name: '布利啾啾 DBLD',
    list: []
}

// 模拟 Vue 实例中的 vm 对象
let vm = {}

// 遍历监听 data 中的自身属性，为每个属性添加监听器
Object.keys(data).forEach(key => {
    Object.defineProperty(vm, key, {
        enumerable: true,
        configurable: true,
        get () {
            console.log('获取绑定数据', data[key]);
            return data[key]
        },
        set (newVal) {
            console.log('更新绑定数据', newVal);
            if (newVal === data[key]) {
                return;
            }
            data[key] = newVal
            document.getElementById('app').textContent = newVal
        }
    })
})
```

我在控制台输入 `vm.list.push('hello')` 时，并不能监听到 `list` 属性的变化。
此时，`data` 中的属性值都是基本类型，但如果是 `object` 类型呢？此时就得递归遍历这类属性，进行深度监听了，所以需要将添加监听器的过程封装起来。
