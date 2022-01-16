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

此时，我们就对 `Object.defineProperty` 有了一个基本的使用了。当 `data` 中有多个属性时，我们可以对 `data` 的属性做遍历添加监听器。

``` javascript
// 模拟 Vue 实例中 data 属性
let data = {
    msg: 'hello',
    name: '布利啾啾 DBLD',
    list: [],
    obj: {
        msg: 'hello'
    }
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

我在控制台输入 `vm.obj.msg = '你好'` 时，并不能监听到属性的变化。这是因为我们只监听了 `obj` 属性，却未对其内部属性做监听器。这里就得递归遍历这类属性，进行深度监听了，所以需要将添加监听器的过程封装到函数中。

``` javascript
// 模拟 Vue 实例中 data 属性
let data = {
    msg: 'hello',
    name: '布利啾啾 DBLD',
    list: [],
    obj: {
        msg: 'hello'
    }
}

// 模拟 Vue 实例中的 vm 对象
let vm = {}

function defineProperty (target, data) {
    Object.keys(data).forEach(key => {
        if (typeof data[key] === 'object') {
            // [object xxx]
            if (Object.prototype.toString.call(data[key]).slice(8, -1) === 'Object') {
                target[key] = {}
                defineProperty(target[key], data[key])
            }
        } else {
            Object.defineProperty(target, key, {
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
        }
    })
}

defineProperty(vm, data)

```

这样，当我们更改更深层次对象的数据时，也能够监听到

![监听更深层次的数据](image_2.png)

仔细看过 `data` 变量中的属性，就会发现我们一直未对 `list` 属性做操作，并不是忘记了。具体缘由，前头已经说明白了，对于数组的监听，采用的并不是 `Object.defineProperty` 方法，而是对数组的一些方法做变异改造并监听。
因此，当判断到属性的值是数组时，就需要将该属性的原型对象指向这个变异对象，以实现对该属性变化的监听。

``` javascript
...

function defineProperty (target, data) {
    Object.keys(data).forEach(key => {
        if (typeof data[key] === 'object') {
            // [object xxx]
            if (Object.prototype.toString.call(data[key]).slice(8, -1) === 'Object') {
                target[key] = {}
                defineProperty(target[key], data[key])
            }
            if (Object.prototype.toString.call(data[key]).slice(8, -1) === 'Array') {
                target[key] = []
                // 手动将数组的原型链指向新的原型对象
                addArrayLisen(target[key])
            }
        } else {
            Object.defineProperty(target, key, {
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
        }
    })
}

function addArrayLisen (target) {
    const oldArrayMethods = Array.prototype
    const methods = [
        'push',
        'pop',
        'unshift',
        'shift',
        'splice',
        'sort',
        'reverse'
    ]
    const arrayMethods = Object.create({}, oldArrayMethods)
    methods.forEach((methodKey) => {
        arrayMethods[methodKey] = function (...args) {
            console.log(`监听 ${methodKey}`)
            const result = oldArrayMethods[methodKey].apply(this, args)
            return result
        }
    })
    target.__proto__ = arrayMethods
}
...
```

此时，当对数组属性操作时，就能简单的监听到它的变化了

![监听数组属性变化](image_3.png)

数组属性内部不但可以添加基本类型数据也能够添加 `object` 类型数据，因此，当通过 `push`、`unshift`、`splice` 添加内容时，还需要再对加入的数据也做深度监听。

``` javascript
function addArrayLisen (target) {
    const oldArrayMethods = Array.prototype
    const methods = [
        'push',
        'pop',
        'unshift',
        'shift',
        'splice',
        'sort',
        'reverse'
    ]
    const arrayMethods = Object.create({}, oldArrayMethods)
    methods.forEach((methodKey) => {
        arrayMethods[methodKey] = function (...args) {
            console.log(`监听 ${methodKey}`)
            const result = oldArrayMethods[methodKey].apply(this, args)
            switch (methodKey) {
                case 'push':
                case 'unshift':
                    inserted = args;
                    break;
                case 'splice': // 3个  新增的属性 splice 有删除 新增的的功能 arr.splice(0,1,{name:1})
                    inserted = args.slice(2)
                default:
                    break;
            }
            if (inserted) defineProperty(target, inserted); // 将新增属性继续观测
            return result
        }
    })
    target.__proto__ = arrayMethods
}
```

这样子，当内部加入的是 `object` 类型时，也能够对其做到监听啦。
至此，就对 Vue2.x 中使用 `Object.defineProperty` 有了一个简单的理解了。

## Vue3.x 使用的 `Proxy`

在学习使用前，先看一下 `Proxy` 的兼容性，点 [这里](https://caniuse.com/?search=Proxy)，可以知道， `Proxy` 有严重的兼容性问题，并且不支持 `polyfill`。

> 不支持 `polyfill` 的原因是 `Babel` 的 `transpiled` 和 `polyfilled` 都没办法支持 `Proxy` 的功能特性。
> 即: 由于 ES5 的限制，Proxy 功能特性无法用 ES5的语法写出来

`Proxy` 翻译成中文过来是 *代理* 的意思，那啥叫代理呢？可以理解为在对象之前设置一个“拦截”，当该对象被访问的时候，都必须经过这层拦截。意味着你可以在这层拦截中进行各种操作。比如你可以在这层拦截中对原对象进行处理，返回你想返回的数据结构。

MDN上的解释为：Proxy 对象用于定义基本操作的自定义行为（如属性查找，赋值，枚举，函数调用，甚至另一个代理等）。

我们还是一步一步的来实现监听吧，一口也吃不成一个胖子！

在使用 `Proxy` 前，再多提一嘴 `Reflect`，一般他俩是配套使用的。

> 那 `Reflect` 是啥呢？推荐点 [这里](https://www.zhangxinxu.com/wordpress/2021/07/js-proxy-reflect/) 看一下，我觉得讲 `Reflect` 挺有趣的~

回归正题，让我们用 `Proxy` 来实现对对象的拦截吧

``` javascript
// 模拟 Vue 实例中 data 属性
let data = {
    msg: 'hello',
    name: '布利啾啾 DBLD',
    list: [],
    obj: {
        msg: 'hello'
    }
}

// 模拟 vm 实例对象
const vm = new Proxy(data, {
    set (target, propKey, value) {
        console.log(`监听到 ${propKey} 的变化，值是 ${value}`)
        Reflect.set(target, propKey, value)
    },
    get (target, propKey) {
        console.log(`监听到 ${propKey} 的获取，值是 ${target[propKey]}`)
        return Reflect.get(target, propKey)
    }
})
```

![采用 Proxy 拦截对象](image_4.png)

从上图，能够看到对基本类型的属性的监听是很简单的，但是像 `list`, `obj` 这类，无法做到监听内部的变化。所以依旧需要将进行封装。

``` javascript
// 模拟 Vue 实例中 data 属性
let data = {
    msg: 'hello',
    name: '布利啾啾 DBLD',
    list: [],
    obj: {
        msg: 'hello'
    }
}

// 模拟 Vue 实例中的 vm 对象
let vm = null

function reactive (target = {}) {
    // 对基本数据类型做直接返回。
    if (typeof target !== 'object' || target == null) {
        return target
    }
    return observer = new Proxy(target, {
        set (target, propKey, value) {
            // 判断是否是新增属性
            const ownKeys = Reflect.ownKeys(target)
            if (ownKeys.includes(propKey)) {
                console.log('已有的 key:', propKey) //监听
            } else {
                console.log('新增的 key:', propKey)
            }
            // 重复的数据不处理
            const oldVal = target[propKey]
            if (value === oldVal) {
                return true
            }
            // 注意！需要将 set 的值返回出去以做判断是否设置成功
            const result = Reflect.set(target, propKey, value)
            return result
        },
        get (target, propKey) {
            // 只监听 处理本身（非原型）的属性 ,如 push()
            const ownKeys = Reflect.ownKeys(target)
            if (ownKeys.includes(propKey)) {
                console.log('get:', propKey) //监听
            }
            // return Reflect.get(target, propKey)
            const result = Reflect.get(target, propKey)
            return reactive(result) //递归get处理 实现深度监听
        }
    })
}

vm = reactive(data)
```

![通过 Proxy 递归属性](image_5.png)

在上图中，可以看到通过对 `get` 方法内对获取到的值做递归操作，不管是新增属性还是旧属性，都能够做监听。但不止是监听新增属性，还能够通过 `handler.deleteProperty` 方法监听对属性的删除操作。

``` javascript
// 模拟 Vue 实例中 data 属性
let data = {
    msg: 'hello',
    name: '布利啾啾 DBLD',
    list: [],
    obj: {
        msg: 'hello'
    }
}

// 模拟 Vue 实例中的 vm 对象
let vm = null

function reactive (target = {}) {
    // 对基本数据类型做直接返回。
    if (typeof target !== 'object' || target == null) {
        return target
    }
    return observer = new Proxy(target, {
        deleteProperty (target, propKey) {
            const result = Reflect.deleteProperty(target, key)
            console.log('delete property', key) //delete property name
            console.log('result', result) //result true
            return result //是否删除成功
        }
    })
}

vm = reactive(data)
```

![拦截删除操作](image_6.png)

## 总结比较

vue3.x 基于 `Proxy` 实现响应式
vue2.x 基于 `Oject.defineProperty` 实现响应式

相较于 `Oject.defineProperty`，`Proxy` 实现响应式：
- 深度监听，性能更好
- 可监听新增删除的属性
- 可监听数组变化
- 规避 `Object.defineProperty` 的问题

但是有得必有失：
- `Proxy` 无法兼容所有浏览器，无法 `polyfill`