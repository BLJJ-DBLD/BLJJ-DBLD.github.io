---
title: P4 接口（interface）
tags:
  - null
categories:
  - TypeScript
hidden: false
abbrlink: 45186819
date: 2022-01-22 19:55:17
---

# 对象类型接口

> 对象类型接口：接口可以用来约束 **对象，函数，以及类的结构和类型**，这是代码协作的契约，我们一定要遵守，且不可改变。

### 定义类型

``` typescript
// 定义字段类型
interface List {
  id: number
  name: string
}
// 定义接口数据类型
interface Result {
  data: List[]
}
// 输出数据函数
function render(result: Result) {
  result.data.forEach(value => {
    console.log(value.id, value.name);
  })
}
// 假设的接口数据
const result = {
  data: [
    {
      id: 1,
      name: 'A'
    },
    {
      id: 2,
      name: 'B'
    }
  ]
}
render(result)
```

当假设的接口数据字段有超过设定的：

``` typescrript
render({
  data: [
    {
      id: 1,
      name: 'A',
      sex: 'male' // 后端额外给定的数据字段
    },
    {
      id: 2,
      name: 'B'
    }
  ]
}) // 会报错
```

在这种状况下要保证字段类型检查不报错有三种解决方案：
1. 把数据赋值给一个变量，再将变量赋值给 `render` 函数。
  - ts 采用了一种鸭式变形法，当变量中的字段满足字段类型检查时，就认为是允许的，即使字段超出。
2. 采用类型断言
  - 我们知道数据类型是 `Result`。我们明确的告诉编译器，我们知道该数据的类型是确定的，这样编译器就会绕过类型检查。
  ``` typescript
    render({
      data: [
        {
          id: 1,
          name: 'A',
          sex: 'male' // 后端额外给定的数据字段
        },
        {
          id: 2,
          name: 'B'
        }
      ]
    } as Result)
  ```
  或
  ``` typescript
    render(<Result>{
      data: [
        {
          id: 1,
          name: 'A',
          sex: 'male' // 后端额外给定的数据字段
        },
        {
          id: 2,
          name: 'B'
        }
      ]
    })
  ```

> ❗ 更加推荐第一种，第二种在 `react` 中会有歧义。

3. 字符串索引签名：

``` typescript
// 定义字段类型
interface List {
  id: number,
  name: string,
  [x: string]: any // 含义：任意的字符串索引任意的类型数据
}
```

### 可选属性设置

> 假如我们有一个需求是判断数据中是否包含 `age` 属性，包含时才打印

``` javascript
// 输出数据函数
function render(result: Result) {
  result.data.forEach(value => {
    console.log(value.id, value.name);
    if (value.age) {
      console.log(value.age);
    }
  })
}
```

所以我们可以通过设置接口中可选属性，方法就是在键名后面添加 `?` ，如下代码。

``` typescript
// 定义字段类型
interface List {
  id: number,
  name: string,
  age?: number // 可选属性，数据中允许存在 / 不存在。
}

// 假设的接口数据
const result = {
  data: [
    {
      id: 1,
      name: 'A'
    },
    {
      id: 2,
      name: 'B',
      age: 12 // 设置的可选存在属性
    }
  ]
}
```

### 只读属性设置

``` typescript
// 定义字段类型
interface List {
  readonly id: number,
  name: string,
  age?: number // 可选属性，数据中允许存在 / 不存在。
}
```

# 函数类型接口

### 变量定义函数类型

``` typescript
let add: (x: number, y: number) => number;
add = (a, b) => a + b
add(1, 2)
```

### 接口定义函数类型

``` typescript
interface Add {
    (x: number, y: number): number
}
```

### 类型别名 type 关键字

``` typescript
type Add = (x: number, y: number) => number
```

### 利用混合接口来定义类库

``` typescript
interface Lib {
    (x: number, y: number): void,
    version: string,
    doSomething: (x: string, y: string) => string
}
```