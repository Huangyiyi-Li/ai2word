// MD2Word - Side Panel 交互逻辑
console.log('%c[MD2Word Sidepanel] 侧边栏脚本已加载', 'color: green; font-weight: bold; font-size: 14px;');

// 状态管理
const state = {
    messages: [],
    selectedIds: new Set(),
    platform: null,
    isManualMode: false
};

// DOM 元素
const elements = {
    platformStatus: document.getElementById('platformStatus'),
    messageList: document.getElementById('messageList'),
    selectedCount: document.getElementById('selectedCount'),
    exportBtn: document.getElementById('exportBtn'),
    refreshBtn: document.getElementById('refreshBtn'),
    selectAllBtn: document.getElementById('selectAllBtn'),
    selectAssistantBtn: document.getElementById('selectAssistantBtn'),
    switchModeBtn: document.getElementById('switchModeBtn'),
    manualMode: document.getElementById('manualMode'),
    manualInput: document.getElementById('manualInput'),
    manualExportBtn: document.getElementById('manualExportBtn'),
    backToListBtn: document.getElementById('backToListBtn')
};

// 初始化
function init() {
    console.log('%c[MD2Word Sidepanel] init() 初始化开始', 'color: blue; font-weight: bold;');
    bindEvents();
    requestMessages();
}

// 绑定事件
function bindEvents() {
    elements.refreshBtn.addEventListener('click', requestMessages);
    elements.selectAllBtn.addEventListener('click', selectAll);
    elements.selectAssistantBtn.addEventListener('click', selectAssistantOnly);
    elements.exportBtn.addEventListener('click', exportSelected);
    elements.switchModeBtn.addEventListener('click', toggleManualMode);
    elements.backToListBtn.addEventListener('click', toggleManualMode);
    elements.manualExportBtn.addEventListener('click', exportManual);

    // 监听来自background的消息
    chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'UPDATE_MESSAGES') {
            updateMessages(message.messages, message.platform);
        } else if (message.type === 'TAB_UPDATED') {
            requestMessages();
        }
    });
}

// 请求扫描消息
function requestMessages() {
    updateStatus('scanning', '正在扫描...');

    chrome.runtime.sendMessage({ type: 'GET_MESSAGES' }, (response) => {
        if (chrome.runtime.lastError) {
            updateStatus('error', '无法连接到页面');
            return;
        }
        if (response && response.success) {
            updateMessages(response.messages, response.platform);
        } else {
            updateStatus('error', response?.error || '未检测到AI对话');
        }
    });
}

// 更新消息列表
function updateMessages(messages, platform) {
    state.messages = messages;
    state.platform = platform;
    state.selectedIds.clear();

    updateStatus('connected', `已连接: ${platform}`);
    renderMessages();
    updateUI();
}

// 更新状态显示
function updateStatus(type, text) {
    const dot = elements.platformStatus.querySelector('.status-dot');
    const textEl = elements.platformStatus.querySelector('.status-text');

    dot.classList.remove('connected', 'error');
    if (type === 'connected') {
        dot.classList.add('connected');
    } else if (type === 'error') {
        dot.classList.add('error');
    }

    textEl.textContent = text;
}

// 渲染消息列表
function renderMessages() {
    if (state.messages.length === 0) {
        elements.messageList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">💬</div>
        <p>未检测到对话消息</p>
        <p class="empty-hint">请确保页面已加载完成</p>
      </div>
    `;
        return;
    }

    elements.messageList.innerHTML = state.messages.map((msg, index) => `
    <div class="message-card ${msg.role} ${state.selectedIds.has(msg.id) ? 'selected' : ''}" 
         data-id="${msg.id}" 
         data-index="${index}">
      <div class="message-header">
        <span class="message-role">
          <span class="role-icon">${msg.role === 'user' ? '👤' : '🤖'}</span>
          ${msg.role === 'user' ? '用户' : 'AI'}
        </span>
        <input type="checkbox" class="message-checkbox" 
               ${state.selectedIds.has(msg.id) ? 'checked' : ''}>
      </div>
      <div class="message-content">${escapeHtml(msg.textContent)}</div>
    </div>
  `).join('');

    // 绑定点击事件
    elements.messageList.querySelectorAll('.message-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('message-checkbox')) {
                return; // 让checkbox自己处理
            }
            toggleSelect(card.dataset.id);
        });

        card.querySelector('.message-checkbox').addEventListener('change', (e) => {
            toggleSelect(card.dataset.id);
        });
    });
}

// 切换选中状态
function toggleSelect(id) {
    if (state.selectedIds.has(id)) {
        state.selectedIds.delete(id);
    } else {
        state.selectedIds.add(id);
    }
    renderMessages();
    updateUI();
}

// 全选
function selectAll() {
    if (state.selectedIds.size === state.messages.length) {
        state.selectedIds.clear();
    } else {
        state.messages.forEach(msg => state.selectedIds.add(msg.id));
    }
    renderMessages();
    updateUI();
}

// 仅选AI回复
function selectAssistantOnly() {
    state.selectedIds.clear();
    state.messages
        .filter(msg => msg.role === 'assistant')
        .forEach(msg => state.selectedIds.add(msg.id));
    renderMessages();
    updateUI();
}

// 更新UI状态
function updateUI() {
    elements.selectedCount.textContent = `已选: ${state.selectedIds.size}`;
    elements.exportBtn.disabled = state.selectedIds.size === 0;
}

// 导出选中的消息
async function exportSelected() {
    const selectedMessages = state.messages.filter(msg => state.selectedIds.has(msg.id));

    if (selectedMessages.length === 0) {
        alert('请先选择要导出的消息');
        return;
    }

    elements.exportBtn.disabled = true;
    elements.exportBtn.innerHTML = '<div class="spinner"></div> 处理中...';

    try {
        console.log('%c[MD2Word Sidepanel] 开始导出', 'color: orange; font-weight: bold; font-size: 14px;');
        console.log('[MD2Word Sidepanel] 选中消息数:', selectedMessages.length);

        // 合并消息内容
        const content = selectedMessages.map(msg => {
            const roleLabel = msg.role === 'user' ? '**用户:**' : '**AI:**';
            return `${roleLabel}\n\n${msg.content}`;
        }).join('\n\n---\n\n');

        console.log('[MD2Word Sidepanel] 合并后内容前500字符:', content.substring(0, 500));
        console.log('[MD2Word Sidepanel] 准备调用 convertAndDownload...');

        // 检查 convertAndDownload 是否存在
        if (typeof window.convertAndDownload !== 'function') {
            console.error('[MD2Word Sidepanel] ❌ convertAndDownload 函数不存在!');
            console.log('[MD2Word Sidepanel] window.convertAndDownload =', window.convertAndDownload);
            throw new Error('convertAndDownload 函数未加载');
        }

        await convertAndDownload(content, `${state.platform || 'AI'}_对话_${formatDate()}.docx`);
        console.log('%c[MD2Word Sidepanel] 导出完成!', 'color: green; font-weight: bold;');
    } catch (error) {
        console.error('导出失败:', error);
        alert('导出失败: ' + error.message);
    } finally {
        elements.exportBtn.disabled = false;
        elements.exportBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7,10 12,15 17,10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      <span>导出 Word</span>
    `;
        updateUI();
    }
}

// 切换手动模式
function toggleManualMode() {
    state.isManualMode = !state.isManualMode;
    elements.manualMode.classList.toggle('hidden', !state.isManualMode);
    elements.switchModeBtn.style.display = state.isManualMode ? 'none' : 'flex';
}

// 手动导出
async function exportManual() {
    const content = elements.manualInput.value.trim();

    if (!content) {
        alert('请输入或粘贴 Markdown 内容');
        return;
    }

    elements.manualExportBtn.disabled = true;
    elements.manualExportBtn.textContent = '处理中...';

    try {
        await convertAndDownload(content, `MD2Word_${formatDate()}.docx`);
    } catch (error) {
        console.error('导出失败:', error);
        alert('导出失败: ' + error.message);
    } finally {
        elements.manualExportBtn.disabled = false;
        elements.manualExportBtn.textContent = '导出 Word';
    }
}

// 辅助函数
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate() {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
}

// 启动
init();
