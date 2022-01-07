---
title: P3 枚举类型（enum）
tags: []
categories:
  - TypeScript
abbrlink: 3958135228
date: 2022-01-07 20:32:16
---

先看下面这段 js 代码：

``` javascript
function initByRole(role) {
    if (role === 1 || role === 2) {
        // do sth
    } else if (role === 3 || role === 4) {
        // do sth
    } else if (role === 5) {
        // do sth
    } else {
        // do sth
    }
}
```

通过阅读上面代码，了解到的问题有二：

1. 可读性差：很难记住数字的含义
2. 可维护性差：硬编码，牵一发动全身

而 TypeScript 中枚举的出现，弥补了这两个缺点。

枚举的定义是：一组有名字的常量集合。比喻的可以理解为是电话本（用户的号码【对应变量内容】可能会发生变化，但是名称【对应变量名】却不会）。

> 注意：枚举成员的值是 **只读类型**

## 数字枚举（存在反向映射）

``` typescript
// 数字枚举
enum Role {
    Reporter = 1, // 特意从数字 1 开始，否则默认数字 0 开始
    Developer, // 后续字段会按照前一个字段默认 +1
    Maintainer,
    Owner,
    Guest
}
```

通过 console.log 可以看出打印看看。

``` typescript
console.log(Role.Reporter) // 输出 1
console.log(Role.Developer) // 输出 2

console.log(Role)// 输出的是一个对象。但是这个对象中的数据远比你认为的要多。
// 输出如下：
{
  1: "Reporter",
  2: "Developer",
  3: "Maintainer",
  4: "Owner",
  5: "Guest",
  Developer: 2,
  Guest: 5,
  Maintainer: 3,
  Owner: 4,
  Reporter: 1
}
```

具体执行的过程 ts -> js 是如何生成的?

通过在 TypeScript 官网中的执行，可以从 [这里](https://www.typescriptlang.org/play?#code/KYOwrgtgBASg9gG2FA3gKCp2wAOcBOALsPlALxQCMANFAPR1SCeToPCGgc3KAOpoOraVUgAPqBpzUAw-4DIVQJhKgDbzAJdHcoABn4CMWACLAAbsARwcJWgyiA4FUC3fl0Ct1oCx5QJDGgc0dAskqAAOUBUcuelQA1JWWYAsgEMASxBCQJA9bygAeQB3MPxqCIBxMGAAZ0I0AF8gA) 看出它的执行代码。

在这里，我也把转移后的代码复制在下面：

``` javascript
"use strict";
// 数字枚举
var Role;
(function (Role) {
    Role[Role["Reporter"] = 1] = "Reporter";
    Role[Role["Developer"] = 2] = "Developer";
    Role[Role["Maintainer"] = 3] = "Maintainer";
    Role[Role["Owner"] = 4] = "Owner";
    Role[Role["Guest"] = 5] = "Guest";
})(Role || (Role = {}));
```

拆解后阅读起来会方便很多，通过拆解第一行：

``` javascript
Role["Reporter"] = 1
Role[1] = "Reporter"
// 输出 Role
{
    1: "Reporter",
    "Reporter": 1
}
```

解读就是：在内层中，枚举的成员被当作了 key ，枚举的值被当作了 value 。之后在外一层中，枚举的值被当作了 key ，枚举的成员又被当作了 value 。这种方式叫做 [反向映射（来源百度百科）](https://baike.baidu.com/item/%E5%8F%8D%E5%90%91%E6%98%A0%E5%B0%84/20835372?fr=aladdin)。

## 字符串枚举

``` typescript
// 字符串枚举
enum Message {
  Success = '恭喜你，你成功',
  Fail = '抱歉，失败了'
}
```

在官网编译后：

``` javascript
"use strict";
var Message;
(function (Message) {
    Message["Success"] = "\u606D\u559C\u4F60\uFF0C\u4F60\u6210\u529F";
    Message["Fail"] = "\u62B1\u6B49\uFF0C\u5931\u8D25\u4E86";
})(Message || (Message = {}));
```

> 可以看出，在字符串枚举中，不存在反向映射。

## 异构枚举（不推荐使用，容易混淆）

``` typescript
// 异构枚举
enum Answer {
  N,
  Y = 'yes'
}
```

编译后：

``` javascript
// 异构枚举
"use strict";
// 异构枚举
var Answer;
(function (Answer) {
    Answer[Answer["N"] = 0] = "N";
    Answer["Y"] = "yes";
})(Answer || (Answer = {}));
```

## 枚举成员

``` typescript
// 枚举成员
enum Char {
  // const
  a, // 
  b = Char.a,
  c = 1 + 3,
  // computed
  d = Math.random(),
  e = '123'.length
}
```

编译后：

``` javascript
"use strict";
// 枚举成员
var Char;
(function (Char) {
    // const
    Char[Char["a"] = 0] = "a";
    Char[Char["b"] = 0] = "b";
    Char[Char["c"] = 4] = "c";
    // computed
    Char[Char["d"] = Math.random()] = "d";
    Char[Char["e"] = '123'.length] = "e";
})(Char || (Char = {}));
```

可以看出被分为了两类，分别是：**常量枚举成员**，**要被计算的枚举成员**

1. 常量(const)枚举成员

``` javascript
Char[Char["a"] = 0] = "a";
Char[Char["b"] = 0] = "b";
Char[Char["c"] = 4] = "c";
```

> 可以看出，常量枚举成员都是在编译时就设置好了的。

2. 计算(computed)枚举成员

``` javascript
Char[Char["d"] = Math.random()] = "d";
Char[Char["e"] = '123'.length] = "e";
```

> 计算枚举成员：需要被计算的枚举成员，非常量的表达式。这类枚举成员的值不会在编译阶段执行，而会被保留到程序的执行阶段。
>❗注意：在计算枚举成员后面的枚举成员，**不能出现没有初始值的情况**。[举个错误栗子🌰](https://www.typescriptlang.org/zh/play?#code/PTAEizzQ+OUBCNA0VBYAUAUwHYFcC2oDCALAQwCdQBvJUUEUAYwHtUBnAFwtAIBoqw2AjUALy5CRAHSc2NQaACMoANSgAzBzbV6mAA7pmyACZs90gLIFmeUUQKo9dTAAoAlKsSVk0gOQyATEo+iAGzQAc3MXSmpAc79AW79aBhY2ADMkAF8gA)，主要看错误提示：`Enum member must have initializer.`。虽然会抛错，但是 typescript 依然会将这段代码编译。
> 如果想在发生编译错误时不生成 js 文件，可以在 typescript.json 中将 `"noEmitHelpers": true`。其他的配置项内容可以 [点这里](tslang.cn/docs/handbook/compiler-options.html)

下面是常数项和计算所得项的完整定义，引用自 [TypeScript 入门教程](https://ts.xcatliu.com/advanced/enum.html#%E5%B8%B8%E6%95%B0%E9%A1%B9%E5%92%8C%E8%AE%A1%E7%AE%97%E6%89%80%E5%BE%97%E9%A1%B9)

- 不具有初始化函数并且之前的枚举成员是常数。在这种情况下，当前枚举成员的值为上一个枚举成员的值加 1。但第一个枚举元素是个例外。如果它没有初始化方法，那么它的初始值为 0。
- 枚举成员使用常数枚举表达式初始化。常数枚举表达式是 TypeScript 表达式的子集，它可以在编译阶段求值。当一个表达式满足下面条件之一时，它就是一个常数枚举表达式：
    - 数字字面量
    - 引用之前定义的常数枚举成员（可以是在不同的枚举类型中定义的）如果这个成员是在同一个枚举类型中定义的，可以使用非限定名来引用
    - 带括号的常数枚举表达式
    - +, -, ~ 一元运算符应用于常数枚举表达式
    - +, -, *, /, %, <<, >>, >>>, &, |, ^ 二元运算符，常数枚举表达式做为其一个操作对象。若常数枚举表达式求值后为 NaN 或 Infinity，则会在编译阶段报错

## 常量枚举

源 ts 代码：

``` typescript
// 常量枚举
const enum Month {
  Jan,
  Fed,
  Mar
}
```

编译输出 js 后：

``` javascript
"use strict";
```

> 是的，你没有看错。常量枚举就是有这么个特性：会在编译阶段被移除

当时它存在不是没有意义的，**当我们不需要对象，但是需要对象的值的时候，就可以使用常量枚举**。而且会减少我们编译环境下的代码。

当我们只要输出枚举 Month 的值：

``` typescript
// 常量枚举
const enum Month {
  Jan,
  Fed,
  Mar
}
const month = [Month.Jan, Month.Fed, Month.Mar]
```

编译后：

``` javascript
"use strict";
const month = [0 /* Jan */, 1 /* Fed */, 2 /* Mar */];
```

## 解决问题

还记得首页的题目吗？改成使用枚举的方式。

``` typescript
enum argumentsRole {
  a = 1,
  b,
  c,
  d,
  e
}
function initByRole (role: argumentsRole) {
  if (role === 1 || role === 2) {
    // do sth
  } else if (role === 3 || role === 4) {
    // do sth
  } else if (role === 5) {
    // do sth
  } else {
    // do sth
  }
}
const a: argumentsRole = argumentsRole.c
initByRole(a)
```

在转译成 javascript

``` javascript
"use strict";
var argumentsRole;
(function (argumentsRole) {
    argumentsRole[argumentsRole["a"] = 1] = "a";
    argumentsRole[argumentsRole["b"] = 2] = "b";
    argumentsRole[argumentsRole["c"] = 3] = "c";
    argumentsRole[argumentsRole["d"] = 4] = "d";
    argumentsRole[argumentsRole["e"] = 5] = "e";
})(argumentsRole || (argumentsRole = {}));
function initByRole(role) {
    if (role === 1 || role === 2) {
        // do sth
    }
    else if (role === 3 || role === 4) {
        // do sth
    }
    else if (role === 5) {
        // do sth
    }
    else {
        // do sth
    }
}
const a = argumentsRole.c;
initByRole(a);
```

---

> TypeScript 的枚举类型的概念 [来源于 C#](https://docs.microsoft.com/zh-cn/dotnet/csharp/language-reference/builtin-types/enum)。

参考

- [枚举](https://ts.xcatliu.com/advanced/enum.html)
- [C# 枚举](https://docs.microsoft.com/zh-cn/dotnet/csharp/language-reference/builtin-types/enum)
- [TypeScript 编译选项](https://www.tslang.cn/docs/handbook/compiler-options.html)