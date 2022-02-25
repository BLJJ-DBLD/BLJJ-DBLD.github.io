---
title: P15 配置 tsconfig.json
tags:
  - null
categories:
  - TypeScript
hidden: false
date: 2022-02-25 20:54:57
abbrlink:
---

# 配置 tsconfig.json

## 1. 学习与文件相关的选项

### 1.1 `files` 属性： `[...]`

> 该字段的含义是：编译数组中的 **具体文件**

``` javascript
{
    ...
    "files": [
        "src/a.ts"
    ]
    ...
}
```

随后在控制台中直接输入 `tsc` ，`ts` 就会自动的搜索 `tsconfig.json` 文件。假如该文件内没有内容就会按照默认配置编译，但是现在是编写了 `files` 属性。此时就会按照该属性，只会编译具体的文件。

### 1.2 `include` 属性： `[...]`

> 该字段的含义是：编译数组中包含的 **具体文件夹**

``` javascript
{
    ...
    "include": [
        "src" // 表示 src 文件夹下的所有文件，嵌套文件也算
    ]
    ...
}
```

允许通过使用 通配符 `*` 确定具体文件夹层级：

``` javascript
{
    ...
    "include": [
        "src/*" // 表示 src 文件夹下的一级内部所有文件，嵌套文件夹内部的文件不会被编译。
        "src/*/*" // 表示 src 文件夹下的二级内部所有文件，一级内部的文件 & 再嵌套文件夹内部的文件不会被编译。
    ]
    ...
}
```

### 1.3 `exclude` 属性： `[...]`

> 该属性的含义是：不编译数组中包含的 **具体文件夹**

与 `include` 正好相反

### 1.4 `extends` 属性： `...` 具体的相对路径

> 该属性的含义是：当有多个 `tsconfig.xx.js` 文件时，可以在 `tsconfig.js` 中通过 `extends` 字段导入。同时在 `tsconfig.js` 中允许通过重写相应的属性去覆盖 `extends` 文件内的属性。

``` javascript
{
    "extends": "./tsconfig.base";
    "exclude": []
}
```

### 1.5 `compileOnSave` 属性： `true / false`

> 该属性的含义是：当保存文件的时候让编译器自动编译。

## 2. 学习编译选项（一些常用选项），在 `compilerOptions` 中的一些属性

### 2.1 `compilerOptions.incremental` 属性： `true/false`

> 该属性翻译过来就是 **增量编译**，当第一次编译后会缓存当前的 编译信息，然后在二次编译的时候会根据这个文件做增量的编译，这样就可以增加编译的速度。

当我们通过在终端中使用命令 `tsc` 时，除了会将 `x.ts` 文件编译为 `x.js` 文件外，还会额外的有一个 **编译信息(默认在 tsconfig.tsbuildinfo 文件内)**

### 2.2 `compilerOptions.tsBuildInfoFile` 属性： `相对项目文件夹的路径（类似： "./buildFile"）`

> 这个属性就好理解，就是设置 编译信息 的具体文件名称路径。

如 “./buildFile” 就是指出将 编译信息 放在项目文件夹下的一级目录下的 `buildFile` 文件内

### 2.3 `compilerOptions.diagnostics` 属性： `true / false`

> 该属性的含义是，当运行 `tsc` 命令时会在控制台输出一些信息，其中包括需要编译的总时间。

``` zsh
jamediii  ~/Notes/TypeScript/liangxiao-typescript/08.tsconfig.json 配置   main  tsc
Files:             107
Lines:           50978
Nodes:          214569
Identifiers:     75896
Symbols:         50728
Types:              76
Instantiations:      0
Memory used:    89344K
I/O read:        0.02s
I/O write:       0.00s
Parse time:      0.77s
Bind time:       0.35s
Check time:      0.00s
Emit time:       0.00s
Total time:      1.12s
```

## 3. 工程引用

当我们有一个较大的工程项目，其中包含前端（client 目录） & 后端（server 目录） & 公共函数（common 目录） （在 src/.. 中），有一个 tses 目录与 src 同级。此时我们想通过 tsc 命令进行构建，且在 `tsconfig.json` 中设置输出到 `dist` 文件夹下（`compilerOptions.outDir: './dist`）。

此时，我们会有几个问题：

1. 输出的 前端 & 后端 & 公共函数 会输出在 `dist/.src` 目录下，但我们的目的是想将三个文件夹直接在 `dist` 目录下输出。

> 解决方案是：在根目录下的 `tsconfig.json` 中，`include: ['src']` 指定只构建 `src` 目录下的 ts 文件。

2. 通过上面的操作能解决问题一，但同时也会引发新的问题，就是 `test` 文件将不会在被构建。还有不方便的地方是，我们不能单独去构建 前端应用 或者是 后端应用。


3. 我们也不想把 `test` 文件构建在 `dist` 目录下。

以上问题，并不能通过根目录下的通用 `tsconfig.json` 文件解决的。工程引用就是解决这类问题的。可以灵活的配置输出目录，还能使工程之间产生依赖关系。有利于把一个大的项目拆分成小项目。同时还能利用增量编译提升编译速度。

### 3.1 开发一个简单的工程引用

目录结构：

``` javascript
project
    src
        client
            index.ts
            tsconfig.json // 1
        common
            index.ts
            tsconfig.json // 3
        server
            index.ts
            tsconfig.json // 2
    test
        client.test.ts
        server.test.ts
        tsconfig.json // 4
    tsconfig.json // 通用配置
```

在项目中，有一个通用 `tsconfig.json` 配置。在该 `json` 文件内，除了默认的配置外，还额外的设置： `compilerOptions.composite: true` ，即：工程允许被引用 & 可以进行增量编译。

在 `1` 配置文件内，会继承基础配置文件 && 配置依赖的 `3` 配置文件，并且指定 `compilerOptions.outDir: xxx（相对 project 的路径）` ，具体内容有：

``` javascript
{
    // 配置了继承的基础配置文件
    "extends": "../../tsconfig.json",
    "compilerOptions": {
        // 配置了输出目录
        "outDir": "../../dist/client"
    },
    // 配置所依赖的工程
    "references": [
        {"path": "../common"}
    ]
}
```

> 加入 `references` 所依赖的工程原因是，在 `./src/client/index.ts` 文件内引用了 `./src/common/index.ts` 文件。

在 `2` 配置文件内与 `1` 大差不差：

``` javascript
{
    "extends": "../../tsconfig.json",
    "compilerOptions": {
        "outDir": "../../dist/server"
    },
    "references": [
        {"path": "../common"}
    ]
}
```

通用的 `common` 配置文件内容：

``` javascript
{
    "extends": "../../tsconfig.json",
    "compilerOptions": {
        "outDir": "../../dist/common"
    }
}
```

根据需求的不同，可以对每个独立工程中的 `tsconfig.json` 做独自的配置，并且可以单独的只构建想构建的独立工程。

命令： `tsc --build(允许缩写成 -b) xxx(具体相对路径) --verbose(将构建的信息打印出来)`