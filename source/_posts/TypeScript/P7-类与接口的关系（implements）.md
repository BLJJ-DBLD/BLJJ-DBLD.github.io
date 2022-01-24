---
title: P7 类与接口的关系（implements）
tags:
  - null
categories:
  - TypeScript
hidden: false
abbrlink: 3958253663
date: 2022-01-23 09:44:42
---

> 接口可以约束类成员有哪些属性与类型，接口也能约束构造函数

## 类继承接口

实现接口的定义：

``` typescript
interface Human {
  name: string
  eat(): void
}
```

> 类继承接口，利用的是 `implements` 关键字

``` typescript
class Asia implements Human {
  name: string
  constructor (name: string) {
    this.name = name
  }
  eat () {}
}
```

## 接口继承接口

> 关键字 `extends`

``` typescript
interface Man {
  run(): void
}

interface Child {
  cry(): void
}

interface Boy extends Man, Child {}

const boy: Boy = {
    run () {},
    cry () {}
}
```

## 接口继承类

> 同样是关键字 `extends`

``` typescript
class Auto {
  state: string
  private state2: number
  constructor (state: string) {
    this.state = state
    this.state2 = 2
  }
}
interface AutoInterface extends Auto {
}
class ~~C~~ implements AutoInterface {
  state: string = '1'
}
// 通过链式编程实现继承 Auto
class Bus extends Auto implements AutoInterface {}
```

错误信息：

Class 'C' incorrectly implements interface 'AutoInterface'.
  Property 'state2' is missing in type 'C' but required in type 'Auto'.

## 总结

接口与类的最终关系

![关系图](image_1.png)