/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Users, 
  Orbit, 
  Settings, 
  Palette, 
  Calendar as CalendarIcon, 
  Bell, 
  User, 
  ChevronRight,
  Plus,
  Send,
  MoreVertical,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- 类型定义 ---
type Tab = 'messages' | 'contacts' | 'space';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  color: string; // 预设颜色
}

interface ApiSettings {
  baseUrl: string;
  apiKey: string;
  model: string;
}

// --- 初始数据与常量 ---
const PRESET_COLORS = ['#000000', '#666666', '#AAAAAA', '#FF0000', '#0000FF'];

// --- 主要组件 ---
export default function App() {
  // 基础状态
  const [activeTab, setActiveTab] = useState<Tab>('messages');
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  
  // 侧边栏子菜单状态
  const [sidebarView, setSidebarView] = useState<'main' | 'settings' | 'beauty' | 'calendar' | 'popup'>('main');

  // 聊天对话状态
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputMessage, setInputMessage] = useState('');

  // 持久化设置状态 (结合本地存储增强，防止解析错误或 iframe 权限限制)
  const [apiSettings, setApiSettings] = useState<ApiSettings>(() => {
    const defaultSettings = {
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      model: 'gpt-4o'
    };
    try {
      const saved = localStorage.getItem('api_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.baseUrl && parsed.apiKey) return parsed;
      }
    } catch (e) {
      console.warn('LocalStorage access blocked or failed:', e);
    }
    return defaultSettings;
  });

  // 保存设置到本地
  useEffect(() => {
    try {
      localStorage.setItem('api_settings', JSON.stringify(apiSettings));
    } catch (e) {
      console.warn('LocalStorage save blocked:', e);
    }
  }, [apiSettings]);

  // --- API 对接核心函数 ---
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;

    // 1. 添加用户消息到 UI
    const newUserMsg = { role: 'user' as const, content: inputMessage };
    setMessages(prev => [...prev, newUserMsg]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // 2. 发起 API 请求
      const response = await fetch(`${apiSettings.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiSettings.apiKey}`
        },
        body: JSON.stringify({
          model: apiSettings.model,
          messages: [...messages, newUserMsg],
          temperature: 0.7
        })
      });

      const data = await response.json();
      
      if (data.choices && data.choices[0]) {
        const aiMsg = { 
          role: 'assistant' as const, 
          content: data.choices[0].message.content 
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        throw new Error(data.error?.message || 'API 返回异常');
      }
    } catch (err) {
      console.error('API Error:', err);
      // 发生错误时，给一个友好的模拟提示
      const errorMsg = { 
        role: 'assistant' as const, 
        content: `Error: ${err instanceof Error ? err.message : '连接接口失败，请检查设置中的秘钥或网址是否正确。'}` 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };
  const [customStyle, setCustomStyle] = useState('');
  const [currentStylePreset, setCurrentStylePreset] = useState('default');
  const [todos, setTodos] = useState<TodoItem[]>([
    { id: '1', text: '完善消息模块', completed: false, color: '#000000' },
    { id: '2', text: '添加角色编辑功能', completed: false, color: '#666666' }
  ]);

  // 应用自定义样式
  useEffect(() => {
    const styleId = 'custom-user-style';
    let styleTag = document.getElementById(styleId);
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }
    styleTag.innerHTML = customStyle;
  }, [customStyle]);

  // --- 模拟操作函数 ---
  const toggleTodo = (id: string) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const addTodo = (text: string) => {
    setTodos([...todos, { id: Date.now().toString(), text, completed: false, color: '#000000' }]);
  };

  return (
    <div className="flex flex-col h-screen bg-white text-black font-sans overflow-hidden">
      {/* 全局注入背景 (针对某些预设) */}
      <div className="fixed inset-0 pointer-events-none z-[-1] bg-white transition-colors duration-500" />

      {/* 顶部栏 */}
      <header className="flex items-center justify-between px-4 pt-12 pb-4 border-b-2 border-black sticky top-0 bg-white z-10">
        <button 
          onClick={() => {
            setIsSidebarOpen(true);
            setSidebarView('main');
          }}
          className="w-10 h-10 border-2 border-black bg-gray-100 flex items-center justify-center overflow-hidden hover:translate-x-1 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
        >
          <div className="bg-black w-full h-full flex items-center justify-center">
            <User className="text-white w-6 h-6" />
          </div>
        </button>
        <h1 className="text-xl font-black tracking-tighter uppercase">
          {activeTab === 'messages' && 'MESSAGES'}
          {activeTab === 'contacts' && 'CONTACTS'}
          {activeTab === 'space' && 'SPACE'}
        </h1>
        <div className="w-10" /> {/* 占位符保持居中 */}
      </header>

      {/* 主体内容区域 */}
      <main className="flex-1 overflow-y-auto pb-24">
        <AnimatePresence mode="wait">
          {activeTab === 'messages' && (
            <motion.div 
              key="messages"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 space-y-4"
            >
              <div className="text-[10px] text-gray-400 mb-6 font-mono uppercase tracking-widest">Recent Chats</div>
              {/* 模拟对话列表 */}
              {[1, 2, 3].map(i => (
                <div 
                  key={i} 
                  onClick={() => setSelectedChat(`角色 ${i}`)}
                  className="flex items-center gap-4 p-4 border-2 border-black bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 transition-all cursor-pointer group active:translate-x-0 active:translate-y-0 active:shadow-none"
                >
                  <div className="w-14 h-14 border-2 border-black bg-black flex items-center justify-center text-xl font-bold text-white">R{i}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-black text-sm truncate uppercase tracking-tighter">示例角色 {i}</span>
                      <span className="text-[10px] text-gray-400 font-mono">12:3{i}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate tracking-tight font-medium">你好！我们可以开始对话吗？这是一条模拟预览消息...</p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'contacts' && (
            <motion.div 
              key="contacts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4"
            >
              <div className="text-[10px] text-gray-400 mb-6 font-mono uppercase tracking-widest">Characters</div>
              <button 
                className="w-full py-4 border-2 border-dashed border-black bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-black hover:text-white transition-all mb-4"
              >
                <Plus size={20} />
                <span>添加新角色</span>
              </button>
              <div className="space-y-4">
                {['助手', '代码专家', '文学家'].map(name => (
                  <div key={name} className="flex items-center justify-between p-4 border-2 border-black bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 border-2 border-black bg-black text-white flex items-center justify-center text-sm font-bold">{name[0]}</div>
                      <span className="font-black uppercase tracking-tighter">{name}</span>
                    </div>
                    <ChevronRight size={18} className="text-black" />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'space' && (
            <motion.div 
              key="space"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-8 flex flex-col items-center justify-center h-full text-center"
            >
              <Orbit size={48} className="text-black mb-4 animate-pulse" />
              <h2 className="text-xl font-bold mb-2">空间模块</h2>
              <p className="text-gray-400 text-sm">这里可以放置动态、发现或社区内容</p>
              <div className="mt-8 grid grid-cols-2 gap-4 w-full">
                <div className="aspect-square bg-gray-100 rounded-2xl animate-pulse"></div>
                <div className="aspect-square bg-gray-100 rounded-2xl animate-pulse"></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 底部导航栏 */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t-2 border-black px-6 flex items-center justify-around pb-4 z-20">
        <NavButton active={activeTab === 'messages'} icon={MessageSquare} label="消息" onClick={() => setActiveTab('messages')} />
        <NavButton active={activeTab === 'contacts'} icon={Users} label="联系人" onClick={() => setActiveTab('contacts')} />
        <NavButton active={activeTab === 'space'} icon={Orbit} label="空间" onClick={() => setActiveTab('space')} />
      </nav>

      {/* 侧边栏系统 */}
      <AnimatePresence>
        {selectedChat && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-white z-[60] flex flex-col pt-12"
          >
            {/* 聊天顶部 */}
            <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-white">
              <button onClick={() => setSelectedChat(null)} className="p-2 border-2 border-black bg-white hover:bg-black hover:text-white transition-colors">
                <ChevronRight size={24} className="rotate-180" />
              </button>
              <div className="flex flex-col items-center">
                <span className="font-black uppercase tracking-tighter text-sm">{selectedChat}</span>
                <span className="text-[10px] text-green-500 font-bold flex items-center gap-1">• ONLINE</span>
              </div>
              <button className="p-2 border-2 border-black bg-white hover:bg-black hover:text-white transition-colors">
                <MoreVertical size={20} />
              </button>
            </div>

            {/* 消息区域 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full opacity-20 grayscale">
                  <MessageSquare size={48} className="mb-2" />
                  <p className="text-xs font-black uppercase">Start a new conversation</p>
                </div>
              )}
              
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 border-2 border-black ${msg.role === 'user' ? 'bg-black text-white' : 'bg-white text-black'} text-sm font-medium leading-relaxed shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="p-4 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex gap-1">
                    <span className="w-1 h-1 bg-black rounded-full animate-bounce"></span>
                    <span className="w-1 h-1 bg-black rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1 h-1 bg-black rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}
            </div>

            {/* 输入栏 */}
            <div className="p-6 pb-12 flex items-center gap-3 bg-white border-t-2 border-black">
              <div className="flex-1 border-2 border-black bg-white flex items-center px-4 py-1">
                <input 
                  type="text" 
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={isTyping ? "正在思考..." : "发送消息..."} 
                  className="bg-transparent border-none flex-1 py-3 text-sm focus:ring-0 font-medium" 
                />
                <Plus size={18} className="text-black ml-2 cursor-pointer" />
              </div>
              <button 
                onClick={handleSendMessage}
                disabled={isTyping}
                className="w-12 h-12 bg-black border-2 border-black flex items-center justify-center text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[85%] max-w-sm bg-white z-50 flex flex-col border-r-2 border-black shadow-2xl overflow-hidden"
            >
              {/* 侧边栏头部 - 个人资料区域 */}
              <div className="p-8 pb-4 pt-16 border-b-2 border-black bg-gray-50">
                <button 
                  onClick={() => setIsProfileEditing(!isProfileEditing)}
                  className="w-20 h-20 border-2 border-black bg-black flex items-center justify-center mb-4 transition-all hover:rotate-6 hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  <User size={40} className="text-white" />
                </button>
                <h2 className="text-2xl font-black uppercase tracking-tighter">User Name</h2>
                <p className="text-gray-400 text-xs font-mono mt-1">SYSTEM_ID: 20260508</p>

                {isProfileEditing && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-4 p-4 border-2 border-black bg-white space-y-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <input type="text" placeholder="修改昵称" className="w-full bg-gray-50 border-2 border-black p-2 text-sm focus:ring-0" />
                    <button className="w-full bg-black text-white text-xs py-3 font-bold uppercase tracking-widest active:translate-x-1 active:translate-y-1 active:shadow-none transition-all">保存修改</button>
                  </motion.div>
                )}
              </div>

              {/* 侧边栏菜单切换容器 */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {sidebarView === 'main' ? (
                  <div className="space-y-2">
                    <SidebarItem icon={Settings} label="设置" onClick={() => setSidebarView('settings')} />
                    <SidebarItem icon={Palette} label="美化" onClick={() => setSidebarView('beauty')} />
                    <SidebarItem icon={CalendarIcon} label="日历" onClick={() => setSidebarView('calendar')} />
                    <SidebarItem icon={Bell} label="后台弹窗" onClick={() => setSidebarView('popup')} />
                  </div>
                ) : (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <button 
                      onClick={() => setSidebarView('main')}
                      className="flex items-center gap-2 text-sm text-gray-400 mb-6 hover:text-black"
                    >
                      <X size={14} /> 返回主菜单
                    </button>
                    
                    {/* 子功能界面 */}
                    {sidebarView === 'settings' && (
                      <div className="space-y-4 p-2">
                        <h3 className="font-bold flex items-center gap-2"><Settings size={18}/> API 设置</h3>
                        <div className="space-y-3">
                          <label className="block">
                            <span className="text-xs text-gray-400">中转网址 (Base URL)</span>
                            <input 
                              className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm mt-1" 
                              value={apiSettings.baseUrl}
                              onChange={e => setApiSettings({...apiSettings, baseUrl: e.target.value})}
                            />
                          </label>
                          <label className="block">
                            <span className="text-xs text-gray-400">API 秘钥 (Key)</span>
                            <input 
                              type="password" 
                              className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm mt-1" 
                              placeholder="sk-..."
                              value={apiSettings.apiKey}
                              onChange={e => setApiSettings({...apiSettings, apiKey: e.target.value})}
                            />
                          </label>
                          <label className="block">
                            <span className="text-xs text-gray-400">模型选择</span>
                            <input 
                              className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm mt-1" 
                              value={apiSettings.model}
                              onChange={e => setApiSettings({...apiSettings, model: e.target.value})}
                            />
                          </label>
                        </div>
                      </div>
                    )}

                    {sidebarView === 'beauty' && (
                      <div className="space-y-4 p-2">
                        <h3 className="font-bold flex items-center gap-2"><Palette size={18}/> 界面美化</h3>
                        <textarea 
                          className="w-full h-40 bg-gray-50 border-none rounded-xl p-3 text-xs font-mono"
                          placeholder="/* 输入全局CSS代码 */"
                          value={customStyle}
                          onChange={(e) => setCustomStyle(e.target.value)}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <button className="text-xs p-3 bg-black text-white rounded-xl">保存当前预设</button>
                          <select 
                            className="text-xs p-3 bg-gray-50 rounded-xl"
                            onChange={(e) => setCurrentStylePreset(e.target.value)}
                          >
                            <option value="default">默认黑白</option>
                            <option value="soft">柔和模式</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {sidebarView === 'calendar' && (
                      <div className="space-y-4 p-2">
                        <h3 className="font-bold flex items-center gap-2"><CalendarIcon size={18}/> 待办事项</h3>
                        <div className="space-y-2">
                          {todos.map(todo => (
                            <div key={todo.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                              <button 
                                onClick={() => toggleTodo(todo.id)}
                                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors`}
                                style={{ borderColor: todo.color, backgroundColor: todo.completed ? todo.color : 'transparent' }}
                              >
                                {todo.completed && <X size={12} className="text-white" />}
                              </button>
                              <span className={`text-sm ${todo.completed ? 'line-through text-gray-300' : ''}`}>{todo.text}</span>
                            </div>
                          ))}
                        </div>
                        <div className="pt-4 border-t border-gray-100">
                          <input 
                            className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm mb-2" 
                            placeholder="新增待办..."
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                addTodo(e.currentTarget.value);
                                e.currentTarget.value = '';
                              }
                            }}
                          />
                          <div className="flex gap-2 justify-center">
                            {PRESET_COLORS.map(c => (
                              <div key={c} className="w-6 h-6 rounded-full cursor-pointer hover:scale-110" style={{ backgroundColor: c }} />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {sidebarView === 'popup' && (
                      <div className="space-y-4 p-2">
                        <h3 className="font-bold flex items-center gap-2"><Bell size={18}/> 模拟弹窗</h3>
                        <p className="text-xs text-gray-400">在此处可以测试和配置系统的推送提醒效果。</p>
                        <button 
                          onClick={() => alert('这是一个模拟后台弹窗的效果！')}
                          className="w-full py-3 bg-black text-white rounded-2xl text-sm"
                        >
                          立即触发测试弹窗
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
              
              <div className="p-8 text-[10px] text-gray-300 font-mono">
                VERSION 1.0.0-FRAMEWORK
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- 辅助组件 ---

function NavButton({ active, icon: Icon, label, onClick }: { active: boolean, icon: any, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 transition-all ${active ? 'text-black scale-110' : 'text-gray-300 hover:text-gray-500'}`}
    >
      <Icon size={24} strokeWidth={active ? 2.5 : 2} />
      <span className="text-[10px] font-medium tracking-wider uppercase">{label}</span>
      {active && (
        <motion.div 
          layoutId="nav-indicator" 
          className="w-1 h-1 bg-black rounded-full mt-1" 
        />
      )}
    </button>
  );
}

function SidebarItem({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 border-2 border-black bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 transition-all group active:translate-x-0 active:translate-y-0 active:shadow-none mt-2"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 border-2 border-black bg-gray-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
          <Icon size={20} />
        </div>
        <span className="font-black uppercase tracking-tighter text-sm">{label}</span>
      </div>
      <ChevronRight size={16} className="text-black" />
    </button>
  );
}
