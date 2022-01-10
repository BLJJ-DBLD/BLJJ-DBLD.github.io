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

# 2. 安装 oh-my-posh

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
Import-Module posh-git
Import-Module oh-my-posh
Set-PoshPrompt -Theme <theme 名称> // 这个是新版本 v3 中的命令，在 v2 版本下是：Set-Theme <theme 名称>
```

> 保存后关闭记事本。想获取目前所有的主题列表的命令是：`Get-PoshThemes`。

参照文章 & GitHub:
1. [Windows Terminal 配置oh-my-posh主题](https://www.misiyu.cn/article/134.html)
2. [Oh my Posh](https://ohmyposh.dev/)
3. [安装和设置 Windows 终端](https://docs.microsoft.com/zh-cn/windows/terminal/get-started)
