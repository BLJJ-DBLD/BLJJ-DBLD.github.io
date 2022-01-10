---
title: NPM 包管理工具
tags:
  - npm
categories:
  - 工具使用
abbrlink: 2246521759
date: 2022-01-10 21:38:31
---

# 1. 两种安装方式

我们都知道，npm的安装方式有两种，分为`全局安装`和`局部安装`。
顾名思义：全局安装就是在任何文件夹都可运行，其实原理也就是写进环境变量，每次在命令行中敲入命令时，根据环境变量的设置寻找对应的可执行程序运行。

``` javascript
npm install -g <package_name>
```

局部安装就是在当前项目中建立包，在当前项目中起作用

``` javascript
npm install <package_name>
```

其中，在当前项目中建立安装的包，还可以根据需要，是放置在 `dependencies` 下，还是放置在 `desDependencies` 下。

命令分别是：

``` javascript
<!-- dependencies -->
npm install <package_name> --save/-S

<!-- desDependencies -->
npm install <package_name> --save-dev/-D
```

# 2. 包的默认安装路径

## 2.1 局部安装

当选择项目局部安装包时，默认的安装路径为项目根目录文件夹 `node_modules`。这个不是主题就不多说了。

## 2.2 全局安装

当选择全局安装时，默认的安装路径为 `C:\Users\xxx\AppData\Roaming\npm`，缓存路径为`C:\Users\xxx\AppData\Roaming\npm_cache`，其中xxx根据自己是自己系统的用户名。由于我已经改了路径，文件夹也删了，所以就不放图了。这里就是强迫症来源了，你让我每次全局安装包的时候都安装到C盘里，那我肯定受不了的，所以开始改。

## 2.3 修改全局包安装路径

### 2.3.1 修改 npm 默认安装路径

其实就很简单，npm给了我们配置的方法，可以通过命令行的方式

``` javascript
npm config set prefix "E:/Developer/nodejs/npm_global"
npm config set cache "E:/Developer/nodejs/npm_cache"
```

当然了，不一定得是这个路径，得是这个文件名，只是我选择了这个路径这个文件名。配置成功后，可以查看一下是否配置成功

``` javascript
npm config ls
```

虽然我们修改了路径，环境变量却还没配置，所以系统找不到可执行程序。

### 2.3.2 修改环境变量

打开环境变量配置：

1. 在系统变量中新增 `NODE_PATH`，变量值为设置的安装路径下的 `node_modules`，如果你是按照我上面的做法做的话，那设置的安装路径：`E:/Developer/nodejs/npm_global/node_modules`
2. 在用户变量的 `path` 中新增一个值：`E:/Developer/nodejs/npm_global`

然后就可以愉快的将全局包不安装在 C 盘了。