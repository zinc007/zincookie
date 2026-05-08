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
  X,
  Smile,
  CreditCard,
  Mic,
  Image as ImageIcon,
  BookOpen,
  PlusCircle,
  Settings2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- 类型定义 ---
type Tab = 'messages' | 'contacts' | 'space';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  color: string;
  date?: string; // YYYY-MM-DD
}

interface Course {
  id: string;
  name: string;
  room: string;
  day: number; // 0-6 (Sun-Sat)
  time: string;
}

interface Sticker {
  id: string;
  name: string;
  url: string;
}

interface ChatSettings {
  [chatId: string]: {
    charAvatar?: string;
    userAvatar?: string;
    background?: string;
    customCss?: string;
  }
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
  const [sidebarView, setSidebarView] = useState<'main' | 'settings' | 'beauty' | 'calendar' | 'popup' | 'schedule'>('main');

  // 用户资料状态
  const [userProfile, setUserProfile] = useState({
    name: 'User Name',
    status: 'ID_2026.0508',
    avatar: '' // URL or empty for default
  });

  // 聊天室设置
  const [chatSettings, setChatSettings] = useState<ChatSettings>({});
  const [isChatSettingsOpen, setIsChatSettingsOpen] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);

  // 课表状态
  const [courses, setCourses] = useState<Course[]>([
    { id: '1', name: '高等数学', room: '101', day: 1, time: '08:00' },
    { id: '2', name: '大学物理', room: '202', day: 3, time: '14:00' }
  ]);

  // 表情包预览数据
  const [stickers] = useState<Sticker[]>([
    { id: '1', name: '开心', url: 'https://cdn-icons-png.flaticon.com/512/2590/2590525.png' },
    { id: '2', name: '点赞', url: 'https://cdn-icons-png.flaticon.com/512/1791/1791330.png' }
  ]);

  // 空间动态
  const [posts, setPosts] = useState<{id: string, content: string, date: string, type: 'user' | 'ai'}[]>([
    { id: '1', content: '今天的天气真不错！', date: '5月8日', type: 'user' },
    { id: '2', content: 'AI 自动生成的动态：生活总是充满希望。', date: '5月8日', type: 'ai' }
  ]);

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
      <header className="flex items-center justify-between px-6 pt-12 pb-4 border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <button 
          onClick={() => {
            setIsSidebarOpen(true);
            setSidebarView('main');
          }}
          className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden hover:bg-gray-100 transition-all shadow-sm group"
        >
          <div className="bg-zinc-900 w-full h-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <User className="text-white w-5 h-5" />
          </div>
        </button>
        <h1 className="text-lg font-bold tracking-tight text-zinc-800">
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
                  className="flex items-center gap-4 p-4 bg-white hover:bg-gray-50 rounded-3xl transition-all cursor-pointer group active:scale-95"
                >
                  <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center text-xl font-bold text-white shadow-xl shadow-zinc-200">R{i}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-zinc-900 truncate tracking-tight">示例角色 {i}</span>
                      <span className="text-[10px] text-zinc-300 font-mono">12:3{i}</span>
                    </div>
                    <p className="text-xs text-zinc-400 truncate tracking-tight">你好！我们可以开始对话吗？这是一条模拟预览消息...</p>
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
                className="w-full py-4 border border-dashed border-zinc-200 bg-zinc-50 rounded-2xl text-zinc-500 font-bold flex items-center justify-center gap-2 hover:bg-white hover:border-zinc-900 hover:text-zinc-900 transition-all mb-4"
              >
                <Plus size={20} />
                <span>添加新角色</span>
              </button>
              <div className="space-y-4">
                {['助手', '代码专家', '文学家'].map(name => (
                  <div key={name} className="flex items-center justify-between p-4 bg-white border border-gray-50 rounded-2xl hover:shadow-lg hover:shadow-gray-100 transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center text-sm font-bold">{name[0]}</div>
                      <span className="font-bold text-zinc-800">{name}</span>
                    </div>
                    <ChevronRight size={18} className="text-zinc-300" />
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
              className="p-6 space-y-6"
            >
              <div className="flex justify-between items-center bg-white p-4 rounded-3xl shadow-sm border border-gray-50">
                <span className="font-bold text-zinc-800">所有动态</span>
                <button 
                  onClick={() => {
                    const content = prompt('发布新动态：');
                    if (content) setPosts([{ id: Date.now().toString(), content, date: '刚刚', type: 'user' }, ...posts]);
                  }}
                  className="bg-zinc-900 text-white text-xs px-4 py-2 rounded-xl font-bold"
                >
                  发布
                </button>
              </div>

              {posts.map(post => (
                <div key={post.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-50 group">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl ${post.type === 'ai' ? 'bg-indigo-500' : 'bg-zinc-900'} flex items-center justify-center text-white text-xs font-bold`}>
                      {post.type === 'ai' ? 'AI' : 'ME'}
                    </div>
                    <div>
                      <div className="font-bold text-sm">{post.type === 'ai' ? '智能助手' : userProfile.name}</div>
                      <div className="text-[10px] text-zinc-300 font-mono italic">{post.date}</div>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-600 leading-relaxed">{post.content}</p>
                </div>
              ))}
              
              <button 
                onClick={() => setPosts([{ id: Date.now().toString(), content: 'AI 自动发现：这是一个美好的瞬间。', date: '刚刚', type: 'ai' }, ...posts])}
                className="w-full py-4 border border-dashed border-indigo-200 text-indigo-500 bg-indigo-50/30 rounded-2xl text-xs font-bold"
              >
                + 让 AI 发布动态
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 底部导航栏 */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-xl border-t border-gray-50 px-6 flex items-center justify-around pb-4 z-20">
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
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-md">
              <button onClick={() => setSelectedChat(null)} className="p-2 hover:bg-gray-50 rounded-full transition-colors text-zinc-400">
                <ChevronRight size={24} className="rotate-180" />
              </button>
              <div className="flex flex-col items-center">
                <span className="font-bold text-zinc-900 text-sm tracking-tight">{selectedChat}</span>
                <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">• 在线</span>
              </div>
              <button 
                onClick={() => setIsChatSettingsOpen(true)}
                className="p-2 hover:bg-gray-50 rounded-full transition-colors text-zinc-400"
              >
                <Settings2 size={20} />
              </button>
            </div>

            {/* 聊天设置模态窗 */}
            <AnimatePresence>
              {isChatSettingsOpen && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute inset-0 bg-white/95 backdrop-blur-md z-[70] p-10 flex flex-col pt-24"
                >
                  <button onClick={() => setIsChatSettingsOpen(false)} className="absolute top-12 right-10 p-2 bg-zinc-100 rounded-full">
                    <X size={20} />
                  </button>
                  <h3 className="text-xl font-black mb-8">CHAT SETTINGS</h3>
                  <div className="space-y-6 overflow-y-auto pr-2">
                    <label className="block">
                      <span className="text-xs font-bold text-zinc-400 uppercase">角色头像 URL</span>
                      <input 
                        className="w-full bg-zinc-50 rounded-2xl p-4 text-sm mt-1 focus:ring-1 focus:ring-zinc-900 border-none"
                        value={chatSettings[selectedChat!]?.charAvatar || ''}
                        onChange={(e) => setChatSettings({ ...chatSettings, [selectedChat!]: { ...chatSettings[selectedChat!], charAvatar: e.target.value } })}
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold text-zinc-400 uppercase">我的头像 (仅此聊天)</span>
                      <input 
                        className="w-full bg-zinc-50 rounded-2xl p-4 text-sm mt-1 focus:ring-1 focus:ring-zinc-900 border-none"
                        value={chatSettings[selectedChat!]?.userAvatar || ''}
                        onChange={(e) => setChatSettings({ ...chatSettings, [selectedChat!]: { ...chatSettings[selectedChat!], userAvatar: e.target.value } })}
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold text-zinc-400 uppercase">背景图片 URL</span>
                      <input 
                        className="w-full bg-zinc-50 rounded-2xl p-4 text-sm mt-1 focus:ring-1 focus:ring-zinc-900 border-none"
                        value={chatSettings[selectedChat!]?.background || ''}
                        onChange={(e) => setChatSettings({ ...chatSettings, [selectedChat!]: { ...chatSettings[selectedChat!], background: e.target.value } })}
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold text-zinc-400 uppercase">个性化 CSS 美化</span>
                      <textarea 
                        className="w-full h-32 bg-zinc-50 rounded-2xl p-4 text-xs font-mono mt-1 focus:ring-1 focus:ring-zinc-900 border-none"
                        value={chatSettings[selectedChat!]?.customCss || ''}
                        onChange={(e) => setChatSettings({ ...chatSettings, [selectedChat!]: { ...chatSettings[selectedChat!], customCss: e.target.value } })}
                        placeholder=".bubble { border-radius: 0; }"
                      />
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 消息区域 (应用背景图) */}
            <div 
              className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50/50 relative"
              style={chatSettings[selectedChat!]?.background ? { backgroundImage: `url(${chatSettings[selectedChat!]?.background})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
            >
              {/* 注入聊天室专用 CSS */}
              {chatSettings[selectedChat!]?.customCss && (
                <style>{chatSettings[selectedChat!]?.customCss}</style>
              )}
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-zinc-300">
                  <MessageSquare size={48} className="mb-2 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest">Start conversation</p>
                </div>
              )}
              
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 flex-shrink-0 overflow-hidden shadow-sm">
                      {chatSettings[selectedChat!]?.charAvatar ? (
                        <img src={chatSettings[selectedChat!]?.charAvatar} className="w-full h-full object-cover" alt="char" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white">{selectedChat![0]}</div>
                      )}
                    </div>
                  )}
                  <div className={`max-w-[75%] p-4 ${msg.role === 'user' ? 'bg-zinc-900 text-white rounded-3xl rounded-tr-sm' : 'bg-white text-zinc-800 border border-gray-100 rounded-3xl rounded-tl-sm'} text-sm font-medium leading-relaxed shadow-sm`}>
                    {msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 flex-shrink-0 overflow-hidden shadow-sm">
                      {chatSettings[selectedChat!]?.userAvatar || userProfile.avatar ? (
                        <img src={chatSettings[selectedChat!]?.userAvatar || userProfile.avatar} className="w-full h-full object-cover" alt="user" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User size={14} className="text-zinc-400" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm flex gap-1">
                    <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}
            </div>

            {/* 输入栏 */}
            <div className="p-6 pb-12 flex flex-col gap-3 bg-white">
              {isPlusMenuOpen && (
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="grid grid-cols-4 gap-4 p-6 bg-zinc-50 rounded-[2rem] border border-gray-100"
                >
                  <PlusMenuItem icon={CreditCard} label="转账" onClick={() => alert('模拟转账系统已启动')} />
                  <PlusMenuItem icon={Mic} label="语音" onClick={() => setMessages([...messages, { role: 'user', content: '🎤 语音 0:05' }])} />
                  <PlusMenuItem icon={Smile} label="表情" onClick={() => alert('在这里选择表情包')} />
                  <PlusMenuItem icon={ImageIcon} label="图库" onClick={() => alert('从本地选择图片')} />
                </motion.div>
              )}

              <div className="flex items-center gap-3">
                <div className="flex-1 bg-zinc-50 border border-gray-100 rounded-2xl flex items-center px-4 py-1">
                  <input 
                    type="text" 
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={isTyping ? "正在思考..." : "发送消息..."} 
                    className="bg-transparent border-none flex-1 py-3 text-sm focus:ring-0 font-medium text-zinc-900" 
                  />
                  <PlusCircle 
                    size={22} 
                    className={`ml-2 cursor-pointer transition-transform ${isPlusMenuOpen ? 'rotate-45 text-zinc-900' : 'text-zinc-300 hover:text-zinc-500'}`} 
                    onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                  />
                </div>
                <button 
                  onClick={handleSendMessage}
                  disabled={isTyping}
                  className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-white shadow-lg active:scale-95 transition-all disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
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
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-[85%] max-w-sm bg-white z-50 flex flex-col shadow-2xl rounded-r-[3rem] overflow-hidden"
            >
              {/* 侧边栏头部 - 个人资料区域 */}
              <div className="p-10 pb-6 pt-20 bg-zinc-50/50">
                <button 
                  onClick={() => setIsProfileEditing(!isProfileEditing)}
                  className="w-20 h-20 rounded-[2rem] bg-zinc-900 flex items-center justify-center mb-6 transition-all hover:scale-105 shadow-xl shadow-zinc-200 overflow-hidden"
                >
                  {userProfile.avatar ? (
                    <img src={userProfile.avatar} className="w-full h-full object-cover" alt="avatar" />
                  ) : (
                    <User size={40} className="text-white" />
                  )}
                </button>
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold tracking-tight text-zinc-900">{userProfile.name}</h2>
                  <input 
                    type="text" 
                    value={userProfile.status}
                    onChange={(e) => setUserProfile({ ...userProfile, status: e.target.value })}
                    className="bg-transparent border-none p-0 text-zinc-400 text-xs font-mono uppercase tracking-widest focus:ring-0 w-full"
                  />
                </div>

                {isProfileEditing && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-6 p-4 bg-white border border-gray-100 rounded-3xl space-y-3 shadow-lg shadow-gray-100"
                  >
                    <label className="block">
                      <span className="text-[10px] font-bold text-zinc-300 uppercase pl-1">昵称</span>
                      <input 
                        type="text" 
                        value={userProfile.name}
                        onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                        className="w-full bg-zinc-50 border-none rounded-2xl p-3 text-sm focus:ring-1 focus:ring-zinc-200 mt-1" 
                      />
                    </label>
                    <label className="block">
                      <span className="text-[10px] font-bold text-zinc-300 uppercase pl-1">头像 URL</span>
                      <input 
                        type="text" 
                        placeholder="本地路径或图床链接"
                        value={userProfile.avatar}
                        onChange={(e) => setUserProfile({ ...userProfile, avatar: e.target.value })}
                        className="w-full bg-zinc-50 border-none rounded-2xl p-3 text-sm focus:ring-1 focus:ring-zinc-200 mt-1" 
                      />
                    </label>
                    <button 
                      onClick={() => setIsProfileEditing(false)}
                      className="w-full bg-zinc-900 text-white text-xs py-4 rounded-2xl font-bold uppercase tracking-widest active:scale-95 transition-all"
                    >
                      完成设置
                    </button>
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
                    <SidebarItem icon={BookOpen} label="课表" onClick={() => setSidebarView('schedule')} />
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
                      <div className="space-y-6 p-2">
                        <h3 className="font-bold flex items-center gap-2"><CalendarIcon size={18}/> 智能日历 & 待办</h3>
                        
                        {/* 简易月历视图 */}
                        <div className="bg-zinc-50 rounded-3xl p-4 border border-zinc-100">
                          <div className="flex justify-between items-center mb-4 px-2">
                            <span className="text-xs font-black uppercase">2026 MAY</span>
                            <div className="flex gap-2">
                              <span className="w-1 h-1 bg-zinc-300 rounded-full"></span>
                              <span className="w-1 h-1 bg-zinc-300 rounded-full"></span>
                            </div>
                          </div>
                          <div className="grid grid-cols-7 gap-1 text-center">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                              <div key={d} className="text-[8px] font-bold text-zinc-300">{d}</div>
                            ))}
                            {Array.from({ length: 31 }).map((_, i) => (
                              <div 
                                key={i} 
                                className={`aspect-square flex items-center justify-center text-[10px] rounded-lg transition-colors cursor-pointer ${i + 1 === 8 ? 'bg-zinc-900 text-white font-bold' : 'hover:bg-zinc-200'}`}
                              >
                                {i + 1}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          {todos.map(todo => (
                            <div key={todo.id} className="flex items-center gap-3 p-3 bg-white border border-zinc-50 rounded-xl shadow-sm">
                              <button 
                                onClick={() => toggleTodo(todo.id)}
                                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors`}
                                style={{ borderColor: todo.color, backgroundColor: todo.completed ? todo.color : 'transparent' }}
                              >
                                {todo.completed && <X size={12} className="text-white" />}
                              </button>
                              <span className={`text-sm font-medium ${todo.completed ? 'line-through text-zinc-200' : 'text-zinc-700'}`}>{todo.text}</span>
                            </div>
                          ))}
                        </div>
                        <div className="pt-4 border-t border-gray-100">
                          <input 
                            className="w-full bg-zinc-50 border-none rounded-xl p-4 text-sm mb-3 focus:ring-1 focus:ring-zinc-200" 
                            placeholder="新增待办..."
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                addTodo(e.currentTarget.value);
                                e.currentTarget.value = '';
                              }
                            }}
                          />
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex gap-2 flex-wrap justify-center">
                              {PRESET_COLORS.map(c => (
                                <div key={c} className="w-6 h-6 rounded-full cursor-pointer hover:scale-125 transition-transform" style={{ backgroundColor: c }} />
                              ))}
                            </div>
                            <input 
                              type="color" 
                              className="w-8 h-8 rounded-full border-none p-0 bg-transparent cursor-pointer"
                              onChange={(e) => console.log('Selected color:', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {sidebarView === 'schedule' && (
                      <div className="space-y-6 p-2">
                        <h3 className="font-bold flex items-center gap-2"><BookOpen size={18}/> 每周课表</h3>
                        <div className="space-y-3">
                          {['周一', '周二', '周三', '周四', '周五'].map((day, i) => (
                            <div key={day} className="bg-zinc-50 rounded-[2rem] p-5 border border-zinc-100">
                              <div className="text-[10px] font-black uppercase text-zinc-300 mb-3 tracking-widest">{day}</div>
                              {courses.filter(c => c.day === i + 1).length > 0 ? (
                                courses.filter(c => c.day === i + 1).map(c => (
                                  <div key={c.id} className="flex justify-between items-center py-2 border-b border-zinc-100 last:border-none">
                                    <div>
                                      <div className="text-sm font-bold text-zinc-800">{c.name}</div>
                                      <div className="text-[10px] text-zinc-400">@{c.room}</div>
                                    </div>
                                    <div className="text-[10px] font-mono text-zinc-400">{c.time}</div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-[10px] text-zinc-200 italic">No classes scheduled</div>
                              )}
                            </div>
                          ))}
                        </div>
                        <button className="w-full py-4 border-2 border-dashed border-zinc-200 text-zinc-300 rounded-2xl text-xs font-bold hover:border-zinc-900 hover:text-zinc-900 transition-all">
                          + 编辑或导入课表
                        </button>
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
      className="w-full flex items-center justify-between p-4 bg-white border border-transparent hover:border-zinc-50 hover:bg-zinc-50/50 rounded-2xl transition-all group active:scale-95 mt-1"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-all">
          <Icon size={20} />
        </div>
        <span className="font-bold text-sm text-zinc-700">{label}</span>
      </div>
      <ChevronRight size={16} className="text-zinc-300" />
    </button>
  );
}

function PlusMenuItem({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 group active:scale-90 transition-transform"
    >
      <div className="w-12 h-12 bg-white rounded-2xl border border-gray-100 flex items-center justify-center text-zinc-400 group-hover:text-zinc-900 group-hover:shadow-sm transition-all">
        <Icon size={20} />
      </div>
      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{label}</span>
    </button>
  );
}
