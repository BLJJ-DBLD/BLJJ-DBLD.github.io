---
title: 在 input 中实现 vue 中的依赖收集与响应
tags:
  - null
categories:
  - null
hidden: true
abbrlink: 3665502492
date: 2022-01-16 19:01:51
---

先学习的 [这里的](https://segmentfault.com/a/1190000018115762)

---

## 开始

声明一个对象 `data`，可以视作 vue 中的 `data`

``` javascript
let data = {
    r: 0,
    g: 0,
    b: 0
}
```

## 添加 Observer 

作用在于将参数对象的属性变为响应式，只要对象的属性被读取或者被修改都能观察到。然后新建一个 `Observer` 实例，将 `data` 作为参数扔进去。这里的 `proxyData` 是将 `data` 的属性代理到以 `data` 为参数的 `Observer` 实例上去。

``` javascript
class Observer {
    constructor (obj) {
        this.walk(obj)
    }

    walk (obj) {
        Object.keys(obj).forEach(prop => {
            // 对实例绑定数据
            this[prop] = obj[prop]
            // 对 data 属性做响应式拦截
            this.proxyData(obj, prop)
            // 对 vm 属性做定义反应式
            this.defineReactive(this, prop, obj[prop])
        })
    }

    proxyData (obj, prop) {
        const _this = this
        Object.defineProperty(obj, prop, {
            get () {
                return _this[prop]
            },
            set (newVal) {
                _this[prop] = newVal
            }
        })
    }

    defineReactive (obj, prop, value) {
        Object.defineProperty(obj, prop, {
            get () {
                console.log(`${prop} - 被读取！`)
                return value
            },
            set (newVal) {
                if (newVal === value) return
                value = newVal
                console.log(`${prop} - 被读取！`)
            }
        })
    }
}
```

## 添加 Watcher

`Watcher` 有点像 vue 中的 `computed`，实际上就是定义一个计算属性，这个计算属性依赖于前面 `data` 中的某些属性，由他们计算而得。

``` javascript
class Watcher {
    constructor (obj, prop, computed) {
        this.getVal(obj, prop, computed)
    }

    getVal (obj, prop, computed) {
        Object.defineProperty(obj, prop, {
            get () {
                console.log(`computed属性 - ${prop}被读取！`)
                return computed()
            },
            set () {
                console.error('该值不允许被修改')
            }
        })
    }
}
```

看起来没什么问题，所依赖的属性如果变了，计算属性只要再被查看（get方法）一次就可以更新了。但 vue 中的视图渲染是实时的，视图层依赖于数据层，数据变化了，视图层也会跟着变化，不需要手动更新。类比到这个例子就是计算属性如何才能在其所依赖的属性发生变化时被通知从而触发应有的事件？

**这时我们先给Watcher加多一个callback，用于处理当依赖的数据被修改时，我这个计算属性该怎么响应**

比如当依赖被修改时，我们就把这个计算属性的值打印出来

``` javascript
class Watcher {
    constructor (obj, prop, computed, callback) {
        this.getVal(obj, prop, computed, callback)
    }

    getVal (obj, prop, computed, callback) {
        Object.defineProperty(obj, prop, {
            get () {
                console.log(`computed属性 - ${prop}被读取！`)
                return computed()
            },
            set () {
                console.error('该值不允许被修改')
            }
        })
    }
}

new Watcher(vm, 'rgb', () => {
    return `rgb(${vm.r}, ${vm.g}, ${vm.b})`
}, () => {
    console.log(`获取 ${vm.rgb} !`)
})
```

## 添加 Dep

`Dep` 的用处在于当某一个属性（以下称‘自己’）被依赖了，将依赖自己的粉丝（们）--也就是 `Watcher(s)`，收集起来，假如自己发生了变化，能够及时通知粉丝们。

``` javascript
class Dep {
	constructor () {
		this.deps = []
	}
	getDeps () {
		// 当没有回调 || 已经存在回调时跳出
		if (Dep.target || this.deps.includes(Dep.target)) return false
		this.deps.push(Dep.target)
		console.log('依赖添加', Dep.target)
	}
	notify () {
		this.deps.forEach(dep => {
			dep()
		})
	}
}
```

这里的 `Dep.target` 就是前面所说的 `callback` 方法了。这时我们改一下 `Watcher` 中的 `getVal`

``` javascript
class Watcher {
    constructor (obj, prop, computed, callback) {
        this.getVal(obj, prop, computed, callback)
    }

    getVal (obj, prop, computed, callback) {
        Object.defineProperty(obj, prop, {
            get () {
				Dep.target = callback
                console.log(`computed属性 - ${prop}被读取！`)
                return computed()
            },
            set () {
                console.error('该值不允许被修改')
            }
        })
    }
}
```

在计算属性被查看时，将 `callback` 赋值给 `Dep.target`，接下来就会调用其所依赖属性的 `getter`，我们只要在`getter` 里把 `callback` 给收集起来就行了。接下来修改依赖属性的 `getter` 方法。

``` javascript
defineReactive(obj, prop, val) {
	const dep = new Dep()
	Object.defineProperty(obj, prop, {
		get() {
			console.log(`${prop} - 被读取！`)
			dep.getDeps() // 收集 Wather
			return val
		},
		set(newVal) {
			if (newVal == val) return
			val = newVal
			console.log(`${prop} - 被修改！`)
			dep.notify()  // 运行所有 callback
		}
	})
}
```