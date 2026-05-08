/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
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
  Settings2,
  Trash2,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- 类型定义 ---
type Tab = 'messages' | 'contacts' | 'space';

interface Character {
  id: string;
  name: string;
  avatar: string;
  notes: string;
  lastMessage?: string;
  time?: string;
}

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  color: string;
  date?: string;
}

interface Course {
  id: string;
  name: string;
  room: string;
  day: number; // 1-7
  period: number; // 1-8
  color: string;
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
    nickname?: string;
  }
}

interface ApiSettings {
  baseUrl: string;
  apiKey: string;
  model: string;
}

// --- 初始数据与常量 ---
const PRESET_COLORS = ['#18181b', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const PERIOD_TIMES = ['08:00', '09:50', '13:30', '15:20', '18:00', '19:50', '21:00', '22:00'];

// --- 主要组件 ---
export default function App() {
  // 基础状态
  const [activeTab, setActiveTab] = useState<Tab>('messages');
  const [selectedChat, setSelectedChat] = useState<Character | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  
  // 侧边栏子菜单状态
  const [sidebarView, setSidebarView] = useState<'main' | 'settings' | 'beauty' | 'calendar' | 'popup' | 'schedule'>('main');

  // 用户资料状态
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('user_profile');
    return saved ? JSON.parse(saved) : { name: 'User Name', status: 'ID_2026.0508', avatar: '' };
  });

  // 核心数据状态 (带本地持久化)
  const [characters, setCharacters] = useState<Character[]>(() => {
    const saved = localStorage.getItem('app_characters');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: '智能助手', avatar: '', notes: '默认系统助手', lastMessage: '你好！有什么可以帮你的吗？', time: '12:00' }
    ];
  });

  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('app_courses');
    return saved ? JSON.parse(saved) : [];
  });

  const [chatSettings, setChatSettings] = useState<ChatSettings>(() => {
    const saved = localStorage.getItem('chat_settings');
    return saved ? JSON.parse(saved) : {};
  });

  const [posts, setPosts] = useState<{id: string, content: string, date: string, type: 'user' | 'ai'}[]>(() => {
    const saved = localStorage.getItem('app_posts');
    return saved ? JSON.parse(saved) : [
      { id: '1', content: '今天开启我的新计划。', date: '5月8日', type: 'user' }
    ];
  });

  const [todos, setTodos] = useState<TodoItem[]>(() => {
    const saved = localStorage.getItem('app_todos');
    return saved ? JSON.parse(saved) : [];
  });

  const [stickers, setStickers] = useState<Sticker[]>(() => {
    const saved = localStorage.getItem('app_stickers');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: '开心', url: 'https://cdn-icons-png.flaticon.com/512/2590/2590525.png' }
    ];
  });

  const [apiSettings, setApiSettings] = useState<ApiSettings>(() => {
    const saved = localStorage.getItem('api_settings');
    return saved ? JSON.parse(saved) : { baseUrl: 'https://api.openai.com/v1', apiKey: '', model: 'gpt-4o' };
  });

  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [customStyle, setCustomStyle] = useState(() => localStorage.getItem('custom_css') || '');

  const [isChatSettingsOpen, setIsChatSettingsOpen] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);

  // 聊天对话状态
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputMessage, setInputMessage] = useState('');

  // --- 持久化副作用 ---
  useEffect(() => {
    localStorage.setItem('user_profile', JSON.stringify(userProfile));
    localStorage.setItem('api_settings', JSON.stringify(apiSettings));
    localStorage.setItem('app_characters', JSON.stringify(characters));
    localStorage.setItem('app_courses', JSON.stringify(courses));
    localStorage.setItem('app_posts', JSON.stringify(posts));
    localStorage.setItem('chat_settings', JSON.stringify(chatSettings));
    localStorage.setItem('app_todos', JSON.stringify(todos));
    localStorage.setItem('app_stickers', JSON.stringify(stickers));
    localStorage.setItem('custom_css', customStyle);
  }, [userProfile, apiSettings, characters, courses, posts, chatSettings, todos, stickers, customStyle]);

  // --- API 与功能逻辑 ---
  const handleFetchModels = async () => {
    if (!apiSettings.baseUrl || !apiSettings.apiKey) {
      alert('请先填写 Base URL 和 API Key');
      return;
    }
    setIsFetchingModels(true);
    try {
      const resp = await fetch(`${apiSettings.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${apiSettings.apiKey}` }
      });
      const data = await resp.json();
      if (data.data) {
        setAvailableModels(data.data.map((m: any) => m.id));
        alert('成功获取模型列表');
      }
    } catch (e) {
      alert('无法连接到 API 地址，请检查网址和网络。');
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleImportStickers = () => {
    const input = prompt('导入表情包 (格式: 描述:图床URL, 多条请换行)');
    if (!input) return;
    const lines = input.split('\n');
    const newStickers = lines.map(line => {
      const parts = line.split(':');
      if (parts.length >= 2) {
        return { id: Math.random().toString(), name: parts[0].trim(), url: parts.slice(1).join(':').trim() };
      }
      return null;
    }).filter(s => s !== null) as Sticker[];
    setStickers([...stickers, ...newStickers]);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;
    const content = inputMessage;
    const newUserMsg = { role: 'user' as const, content };
    setMessages(prev => [...prev, newUserMsg]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const resp = await fetch(`${apiSettings.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiSettings.apiKey}` },
        body: JSON.stringify({ model: apiSettings.model, messages: [...messages, newUserMsg], temperature: 0.7 })
      });
      const data = await resp.json();
      if (data.choices?.[0]) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.choices[0].message.content }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: '连接接口失败，请检查配置。' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const ImageUploader = ({ onUpload, label }: { onUpload: (url: string) => void, label: string }) => {
    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => onUpload(ev.target?.result as string);
        reader.readAsDataURL(file);
      }
    };
    return (
      <div className="space-y-2">
        <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest pl-1">{label}</span>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="粘贴外链 URL"
            className="flex-1 bg-zinc-50 border-none rounded-xl p-3 text-xs focus:ring-1 focus:ring-zinc-200"
            onBlur={(e) => e.target.value && onUpload(e.target.value)}
          />
          <label className="bg-zinc-900 text-white px-4 py-3 rounded-xl cursor-pointer hover:bg-zinc-700 transition-colors flex items-center justify-center">
            <PlusCircle size={16} />
            <input type="file" className="hidden" accept="image/*" onChange={handleFile} />
          </label>
        </div>
      </div>
    );
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
            <motion.div key="messages" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-2">
              <div className="px-2 py-4 mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-300 border-b border-zinc-50">Active Flows</div>
              {characters.map(char => (
                <div 
                  key={char.id} 
                  onClick={() => setSelectedChat(char)}
                  className="flex items-center gap-4 p-4 hover:bg-zinc-50 rounded-[2rem] transition-all cursor-pointer group active:scale-95"
                >
                  <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center text-white text-xl font-bold overflow-hidden shadow-lg shadow-zinc-100">
                    {char.avatar ? <img src={char.avatar} className="w-full h-full object-cover" /> : char.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-zinc-800 truncate">{chatSettings[char.id]?.nickname || char.name}</span>
                      <span className="text-[10px] text-zinc-300 font-mono">{char.time || '12:00'}</span>
                    </div>
                    <p className="text-xs text-zinc-400 truncate">{char.lastMessage || '待发起的对话...'}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'contacts' && (
            <motion.div key="contacts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6">
              <div className="text-[10px] text-zinc-300 mb-6 font-bold uppercase tracking-widest px-2">Entity Lab</div>
              <button 
                onClick={() => {
                  const name = prompt('输入新角色名称:');
                  if (name) setCharacters([{ id: Date.now().toString(), name, avatar: '', notes: '新加入的角色' }, ...characters]);
                }}
                className="w-full py-5 border border-dashed border-zinc-100 bg-zinc-50/50 rounded-3xl text-zinc-400 font-bold flex items-center justify-center gap-2 hover:bg-white hover:border-zinc-900 hover:text-zinc-900 transition-all mb-8 shadow-sm"
              >
                <Plus size={20} />
                <span>初始化新角色</span>
              </button>
              <div className="space-y-4">
                {characters.map(char => (
                  <div key={char.id} className="flex items-center justify-between p-5 bg-white border border-gray-50 rounded-[2.5rem] hover:shadow-xl hover:shadow-zinc-100 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-zinc-900 text-white flex items-center justify-center text-sm font-bold overflow-hidden">
                        {char.avatar ? <img src={char.avatar} className="w-full h-full object-cover" /> : char.name[0]}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-zinc-800">{char.name}</span>
                        <span className="text-[10px] text-zinc-300 italic truncate w-32">{char.notes}</span>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const newName = prompt('修改名称:', char.name);
                        const newNotes = prompt('修改笔记:', char.notes);
                        if (newName) setCharacters(characters.map(c => c.id === char.id ? { ...c, name: newName, notes: newNotes || '' } : c));
                      }}
                      className="p-3 bg-zinc-50 rounded-xl text-zinc-300 hover:text-zinc-900 transition-colors"
                    >
                      <Settings2 size={16} />
                    </button>
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
                <span className="font-bold text-zinc-900 text-sm tracking-tight">{chatSettings[selectedChat.id]?.nickname || selectedChat.name}</span>
                <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">• 在线</span>
              </div>
              <button 
                onClick={() => setIsChatSettingsOpen(true)}
                className="p-2 hover:bg-gray-50 rounded-full transition-colors text-zinc-400"
              >
                <Settings2 size={20} />
              </button>
            </div>

            <ChatSettingsModal 
              char={selectedChat} 
              settings={chatSettings} 
              setChatSettings={setChatSettings} 
              isOpen={isChatSettingsOpen} 
              onClose={() => setIsChatSettingsOpen(false)}
              ImageUploader={ImageUploader}
            />

            {/* 消息区域 (应用背景图) */}
            <div 
              className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50/50 relative"
              style={chatSettings[selectedChat.id]?.background ? { backgroundImage: `url(${chatSettings[selectedChat.id]?.background})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
            >
              {/* 注入聊天室专用 CSS */}
              {chatSettings[selectedChat.id]?.customCss && (
                <style>{chatSettings[selectedChat.id]?.customCss}</style>
              )}
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-zinc-300">
                  <MessageSquare size={48} className="mb-2 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest">Initialization Ready</p>
                </div>
              )}
              
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                  {msg.role === 'assistant' && (
                    <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-50 overflow-hidden shrink-0 shadow-sm">
                      {chatSettings[selectedChat.id]?.charAvatar || selectedChat.avatar ? (
                        <img src={chatSettings[selectedChat.id]?.charAvatar || selectedChat.avatar} className="w-full h-full object-cover" alt="char" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white">{selectedChat.name[0]}</div>
                      )}
                    </div>
                  )}
                  <div className={`max-w-[75%] p-4 ${msg.role === 'user' ? 'bg-zinc-900 text-white rounded-3xl rounded-tr-sm' : 'bg-white text-zinc-800 border border-gray-100 rounded-3xl rounded-tl-sm shadow-xl shadow-zinc-100/50'} text-sm font-medium leading-relaxed`}>
                    {msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-9 h-9 rounded-xl bg-zinc-100 border border-zinc-50 overflow-hidden shrink-0 shadow-sm">
                      {chatSettings[selectedChat.id]?.userAvatar || userProfile.avatar ? (
                        <img src={chatSettings[selectedChat.id]?.userAvatar || userProfile.avatar} className="w-full h-full object-cover" alt="user" />
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
                      <div className="space-y-6 p-2">
                        <h3 className="font-black text-xs tracking-widest uppercase">API Endpoint Node</h3>
                        <div className="space-y-4">
                          <label className="block">
                            <span className="text-[10px] font-bold text-zinc-300 uppercase pl-1">中转地址 Base URL</span>
                            <input 
                              className="w-full bg-zinc-50 border-none rounded-xl p-4 text-xs mt-1" 
                              value={apiSettings.baseUrl}
                              onChange={e => setApiSettings({...apiSettings, baseUrl: e.target.value})}
                            />
                          </label>
                          <label className="block">
                            <span className="text-[10px] font-bold text-zinc-300 uppercase pl-1">秘钥 Authorization</span>
                            <input 
                              type="password" 
                              className="w-full bg-zinc-50 border-none rounded-xl p-4 text-xs mt-1" 
                              value={apiSettings.apiKey}
                              onChange={e => setApiSettings({...apiSettings, apiKey: e.target.value})}
                            />
                          </label>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <span className="text-[10px] font-bold text-zinc-300 uppercase pl-1">模型部署</span>
                              <select 
                                className="w-full bg-zinc-50 border-none rounded-xl p-4 text-xs mt-1 appearance-none"
                                value={apiSettings.model}
                                onChange={e => setApiSettings({...apiSettings, model: e.target.value})}
                              >
                                <option value="gpt-4o">gpt-4o</option>
                                {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
                              </select>
                            </div>
                            <button 
                              onClick={handleFetchModels}
                              disabled={isFetchingModels}
                              className="mt-5 bg-zinc-900 text-white p-4 rounded-xl active:scale-90 transition-all flex items-center justify-center shrink-0"
                            >
                              <Orbit size={18} className={isFetchingModels ? 'animate-spin' : ''} />
                            </button>
                          </div>
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
                        <div className="grid grid-cols-1 gap-2">
                          <button className="text-xs p-5 bg-zinc-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest active:scale-95 transition-all" onClick={() => alert('样式已保存到元数据')}>Save Metadata</button>
                        </div>
                      </div>
                    )}

                {sidebarView === 'calendar' && (
                  <div className="space-y-6">
                    <h3 className="font-black text-xs tracking-widest uppercase">Plan & Momentum</h3>
                    <div className="bg-zinc-900 rounded-[2.5rem] p-8 text-white aspect-[4/3] flex flex-col justify-between shadow-2xl shadow-zinc-200">
                      <div className="flex justify-between items-start">
                        <span className="text-4xl font-black italic tracking-tighter">08</span>
                        <span className="text-[10px] font-mono tracking-widest opacity-40">MAY / Fri</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-zinc-500">Upcoming Today</p>
                        <p className="text-sm font-medium">{todos.filter(t => !t.completed).length} 件未决事项同步中</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {todos.map(t => (
                        <div key={t.id} className="flex items-center gap-3 p-5 bg-zinc-50 rounded-[2rem] border border-zinc-100/50 group">
                          <button 
                            onClick={() => setTodos(todos.map(i => i.id === t.id ? {...i, completed: !i.completed} : i))}
                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${t.completed ? 'bg-zinc-900 border-zinc-900 shadow-lg' : 'border-zinc-200 hover:border-zinc-400'}`}
                            style={{ backgroundColor: t.completed ? t.color : 'transparent' }}
                          >
                            {t.completed && <Check size={14} className="text-white" />}
                          </button>
                          <span className={`text-xs font-bold transition-all ${t.completed ? 'text-zinc-300 line-through' : 'text-zinc-700'}`}>{t.text}</span>
                          <button onClick={() => setTodos(todos.filter(i => i.id !== t.id))} className="ml-auto opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-red-500 transition-all">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      <input 
                        onKeyDown={(e) => { 
                          if (e.key === 'Enter' && e.currentTarget.value.trim()) { 
                            setTodos([...todos, { id: Date.now().toString(), text: e.currentTarget.value, completed: false, color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)] }]); 
                            e.currentTarget.value = ''; 
                          } 
                        }}
                        className="w-full bg-white border border-zinc-100 rounded-[2rem] p-5 text-[10px] font-black uppercase tracking-widest text-center focus:ring-1 focus:ring-zinc-900 transition-all" 
                        placeholder="+ ADD NEW MOMENTUM" 
                      />
                    </div>
                  </div>
                )}

                    {sidebarView === 'schedule' && (
                      <div className="space-y-6 p-2 pb-20">
                        <h3 className="font-black text-xs tracking-widest uppercase">Weekly Grid System</h3>
                        <div className="grid grid-cols-8 gap-1 bg-zinc-50 p-2 rounded-2xl border border-zinc-100 overflow-hidden">
                          <div className="h-8"></div>
                          {DAYS.map(d => <div key={d} className="text-[8px] font-black text-zinc-300 text-center uppercase">{d[1]}</div>)}
                          
                          {Array.from({ length: 8 }).map((_, pIdx) => (
                            <React.Fragment key={pIdx}>
                              <div className="text-[8px] font-mono text-zinc-300 flex items-center justify-center p-1 border-r border-zinc-100">{pIdx + 1}</div>
                              {Array.from({ length: 7 }).map((_, dIdx) => {
                                const day = dIdx + 1;
                                const period = pIdx + 1;
                                const course = courses.find(c => c.day === day && c.period === period);
                                return (
                                  <div 
                                    key={dIdx} 
                                    onClick={() => {
                                      const name = prompt('课程名称:', course?.name || '');
                                      if (name === null) return;
                                      if (name === '') { setCourses(courses.filter(c => !(c.day === day && c.period === period))); return; }
                                      const color = prompt('输入 Hex 颜色代码:', course?.color || '#18181b');
                                      const room = prompt('教师/地点:', course?.room || '');
                                      const newC = { id: Math.random().toString(), name, day, period, color: color || '#18181b', room: room || '' };
                                      setCourses([...courses.filter(c => !(c.day === day && c.period === period)), newC]);
                                    }}
                                    className="aspect-square rounded-md border border-white/50 transition-all cursor-pointer hover:scale-110 active:scale-95"
                                    style={{ backgroundColor: course ? course.color : '#f4f4f5' }}
                                  />
                                );
                              })}
                            </React.Fragment>
                          ))}
                        </div>
                        <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
                          <p className="text-[10px] font-bold text-zinc-400 mb-2 uppercase">Time Legends</p>
                          <div className="space-y-2">
                             {PERIOD_TIMES.map((t, i) => (
                               <div key={i} className="flex justify-between items-center text-[9px] font-mono border-b border-zinc-100/50 pb-1">
                                 <span className="text-zinc-300">[{i+1}]</span>
                                 <span className="text-zinc-500">{t}</span>
                               </div>
                             ))}
                          </div>
                        </div>
                        <button className="w-full py-4 text-[10px] font-black text-zinc-300 uppercase tracking-widest underline decoration-dashed" onClick={() => confirm('清空所有课服？') && setCourses([])}>reset all data</button>
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

function ChatSettingsModal({ char, settings, setChatSettings, isOpen, onClose, ImageUploader }: any) {
  if (!isOpen || !char) return null;
  const s = settings[char.id] || {};
  const update = (key: string, val: string) => setChatSettings({ ...settings, [char.id]: { ...s, [key]: val } });

  return (
    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="absolute inset-x-0 bottom-0 top-[15%] bg-white z-[100] rounded-t-[3rem] shadow-2xl p-10 flex flex-col pt-16">
      <div className="w-12 h-1 bg-zinc-100 rounded-full mx-auto mb-6 shrink-0" />
      <button onClick={onClose} className="absolute top-10 right-10 p-2 bg-zinc-50 rounded-full text-zinc-400 hover:text-black hover:bg-zinc-100 transition-all"><X size={20}/></button>
      <h3 className="text-xl font-black mb-10 tracking-tighter uppercase">NODE_CALIBRATION: {char.name}</h3>
      <div className="flex-1 overflow-y-auto space-y-8 pb-32">
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest pl-1">联系人昵称 (Nickname)</span>
          <input placeholder="修改备注简称" value={s.nickname || ''} onChange={e => update('nickname', e.target.value)} className="w-full bg-zinc-50 border-none rounded-2xl p-5 text-sm font-bold focus:ring-1 focus:ring-zinc-900" />
        </div>
        <ImageUploader label="节点图标 (Char Avatar)" onUpload={(u:any) => update('charAvatar', u)} />
        <ImageUploader label="对话视角头像 (User Avatar)" onUpload={(u:any) => update('userAvatar', u)} />
        <ImageUploader label="虚拟背景 (Background Layer)" onUpload={(u:any) => update('background', u)} />
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest pl-1">个性化 CSS 注入</span>
          <textarea placeholder="/* 例如修改气泡颜色 */\n.bubble { border: 2px solid #000; }" value={s.customCss || ''} onChange={e => update('customCss', e.target.value)} className="w-full h-32 bg-zinc-50 rounded-2xl p-5 text-xs font-mono border-none focus:ring-1 focus:ring-zinc-900" />
        </div>
      </div>
    </motion.div>
  );
}

// --- 基础组件 ---

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
