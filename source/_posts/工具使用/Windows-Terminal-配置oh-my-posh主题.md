---
title: Windows Terminal 配置oh-my-posh主题
tags:
  - Windows Terminal 配置
categories:
  - 工具使用
abbrlink: 339853394
date: 2022-01-10 21:38:31
---

# 1. 安装 Window Terminal

> Windows Terminal 需要在 MS store 里面下载，点[这里](https://docs.microsoft.com/zh-cn/windows/terminal/get-started)。
>
> 打不开时，可能需要用到代理 / 翻墙

这其中的终端配置，包含比如[颜色配置](https://docs.microsoft.com/zh-cn/windows/terminal/customize-settings/color-schemes)等。

# 2. 在线安装 oh-my-posh & posh-git

在 Mac/Linux 下有 oh-my-zsh 主题，终于，Windows Terminal 的 PowerShell 也有 oh-my-posh 主题了。有了它，在 window 内咱就是那个最靓的那个仔。

`oh-my-posh` 是一个强大的 powerline 主题，类似于 Linux 下的 `oh-my-zsh`。

相应的 github 官方项目中其实有具体的操作步骤，见：[这里](https://ohmyposh.dev/)。

在这里，我将操作做个整理：

> 以下的对终端内的操作请全部在管理员权限下进行！

1. 将 `CurrentUser` 的 `ExecutionPolicy(执行权限)` 从原来的 `Undefined` 更改成 `RemoteSigned`
- 命令是：`Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`
- 按提示输入 `Y` 即可。
2. 接下来，你需要使用 `PowerShell Gallery` 来安装 `oh-my-posh`。
- 命令有：
1. `Install-Module posh-git -Scope CurrentUser`
2. `Install-Module oh-my-posh -Scope CurrentUser`
- 均按提示输入 `Y` 即可。

> 注意：安装 oh-my-posh 需要进行翻墙，否则无法进行下载安装

3. 都安装好之后，还需要更新配置文件 `$PROFILE`，类似于Linux Bash的.bashrc, 这是全局修改，而不是临时的设置喔~
1. 继续输入：`if (!(Test-Path -Path $PROFILE )) { New-Item -Type File -Path $PROFILE -Force }`
2. 之后再输入：`notepad $PROFILE`，对该文件做修改
3. 对打开的 `$PROFILE` 文件中输入：

```
oh-my-posh init pwsh --config "$env:POSH_THEMES_PATH/jandedobbeleer.omp.json" | Invoke-Expression
```

> 保存后关闭记事本。想获取目前所有的主题列表的命令是：`Get-PoshThemes`。

# 3. 离线安装 oh-my-posh & posh-git

## 1. 下载 nupkg 格式内容

有时在内部环境中，也想使用 `oh-my-posh` 却苦于无法在线安装，这时，就需要我们自己手动去将安装包等内容手动引入内网内。

这两个包需要从 `PowerShell Gallery` 中搜索下载，下载路径：[oh-my-posh](https://www.powershellgallery.com/packages/oh-my-posh) 和 [posh-git](powershellgallery.com/packages/posh-git)

下载下来的是 `nupkg` 格式，按照官方文档进行离线安装，步骤如下：
1. 解锁 NuGet 包文件，打开终端，执行类似如下的命令
`Unblock-File -Path C:\Downloads\xxx.nupkg`
2. 查找默认模块目录
  - 打开 `PowerShell` 执行命令 `$env:PSModulePath` 查看模块所在目录。
  - 按优先级由高到低排序的。
  - 将下载下来的内容均放在高优先级的目录下
3. 把 `nupkg` 文件后缀改为 `zip`，并解压
4. 删除里面与 NuGet 规范相关的文件，包括
  - `_rels`
  - `package`
  - `[Content_Types].xml`
  - `<xxx>.nuspec`
5. 重命名文件夹
  - 文件夹解压后默认为`<xxx>.<version>` 的格式，我们把目录结构改为 `<xxx>/<version>`，并将所有文件移动到版本号文件夹下。

## 2. 配置 PowerShell 与在线安装一致

## 3. 在用户变量内配置 oh-my-posh 环境变量

> 配置环境变量的前提是已经拥有 oh-my-posh 相关的压缩包

1. 配置 `Path` 变量，在其中添加一行
  `C:\Users\<username>\AppData\Local\Programs\oh-my-posh\bin`
  
  这个路径是在线安装的默认路径，我们可以也手动安装到该路径下。

2. 新增新的变量 `POSH_THEMES_PATH`，与主题包路径有关的配置
  `C:\Users\<username>\AppData\Local\Programs\oh-my-posh\themes`

到此全部结束！

参照文章 & GitHub:
1. [Windows Terminal 配置oh-my-posh主题](https://www.misiyu.cn/article/134.html)
2. [Oh my Posh](https://ohmyposh.dev/)
3. [安装和设置 Windows 终端](https://docs.microsoft.com/zh-cn/windows/terminal/get-started)
