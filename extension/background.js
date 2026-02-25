// MD2Word - Background Service Worker
// 管理插件生命周期和消息通信

// 安装时打开侧边栏功能
chrome.runtime.onInstalled.addListener(() => {
  console.log('MD2Word 插件已安装');
});

// 点击插件图标时打开侧边栏
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

// 处理来自content script和sidepanel的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_MESSAGES':
      // 向当前活动标签页的content script请求消息
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'SCAN_MESSAGES' }, (response) => {
            sendResponse(response);
          });
        }
      });
      return true; // 异步响应

    case 'MESSAGES_SCANNED':
      // 转发消息到侧边栏
      chrome.runtime.sendMessage({
        type: 'UPDATE_MESSAGES',
        messages: message.messages,
        platform: message.platform
      });
      break;

    case 'EXPORT_SELECTED':
      // 处理导出请求
      console.log('导出选中的消息:', message.selectedIds);
      break;

    default:
      break;
  }
});

// 监听标签页更新，通知侧边栏刷新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const supportedDomains = [
      'chat.openai.com',
      'chatgpt.com',
      'claude.ai',
      'chat.deepseek.com',
      'tongyi.aliyun.com',
      'yiyan.baidu.com',
      'gemini.google.com',
      'kimi.moonshot.cn',
      'monica.im'
    ];

    const isSupported = supportedDomains.some(domain => tab.url.includes(domain));
    if (isSupported) {
      chrome.runtime.sendMessage({ type: 'TAB_UPDATED', url: tab.url });
    }
  }
});
