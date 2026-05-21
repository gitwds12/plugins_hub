# Cat Break Reminder

一个 Manifest V3 浏览器扩展：每隔一段时间在网页右下角弹出一只 CSS 小猫，提醒你休息、喝水、看看远处。

## 功能

- 周期性休息提醒
- 当前页面一键叫出猫猫
- “我休息啦”和“稍后提醒”操作
- 可配置提醒间隔、稍后提醒时间、勿扰时段
- 不依赖后端，设置保存在浏览器 `chrome.storage.sync`

## 安装到 Chrome / Edge

1. 打开浏览器扩展管理页：
   - Chrome：`chrome://extensions`
   - Edge：`edge://extensions`
2. 打开右上角的“开发者模式”。
3. 点击“加载已解压的扩展程序”。
4. 选择这个文件夹：`cat-break-reminder`。
5. 安装后点击浏览器工具栏里的扩展图标，可以打开快速面板；点击“设置”可以调整提醒间隔。

## 本地开发

修改代码后，在扩展管理页点击本插件卡片上的“重新加载”即可生效。已经打开的网页可能需要刷新一次，content script 才会重新注入。

## 文件说明

- `manifest.json`：扩展声明
- `background.js`：定时提醒、稍后提醒、消息分发
- `contentScript.js`：在网页中注入猫咪弹窗
- `cat.css`：网页猫咪弹窗样式
- `popup.html` / `popup.js`：工具栏快速面板
- `options.html` / `options.js`：设置页
- `ui.css`：面板和设置页样式
