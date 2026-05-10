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
  Check,
  Download,
  UploadCloud,
  HardDrive,
  Heart,
  MessageCircle,
  Share2,
  Camera,
  Quote,
  ArrowLeft,
  ArrowRight,
  Edit3,
  Edit,
  ChevronDown,
  Zap,
  Sparkles,
  RotateCw,
  Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- 类型定义 ---
type Tab = 'messages' | 'contacts' | 'space';

interface Message {
  id: string;
  charId: string; // 每条消息必须属于一个角色
  role: 'user' | 'assistant';
  content: string;
  time: string;
  isEdited?: boolean;
  type?: 'text' | 'voice' | 'transfer';
  transferData?: {
    amount: string;
    remark: string;
  };
  postForward?: Post;
}

interface BeautyPreset {
  id: string;
  name: string;
  css: string;
}

interface Character {
  id: string;
  name: string;
  avatar: string;
  notes: string;
  lastMessage?: string;
  time?: string;
  gender?: string;
  birthday?: string;
  personality?: string;
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

interface PostComment {
  id: string;
  username: string;
  content: string;
  likes: number;
  isLiked?: boolean;
  replyTo?: string;
  time: string;
}

interface Post {
  id: string;
  content: string;
  image?: string;
  isTextImage?: boolean;
  date: string;
  type: 'user' | 'ai';
  likes: number;
  isLiked?: boolean;
  comments: PostComment[];
}

interface UserProfile {
  name: string;
  username: string;
  signature: string;
  avatar: string;
  background: string;
  status: string;
}

interface WorldBookPreset {
  id: string;
  name: string;
  content: string;
  isActive: boolean;
}

interface ChatSettings {
  [chatId: string]: {
    charAvatar?: string;
    userAvatar?: string;
    background?: string;
    customCss?: string;
    nickname?: string;
    avatarSize?: number;
    bubblePadding?: number;
    bubbleWidth?: number;
    fontSize?: number;
    frostedGlass?: boolean;
    userBubbleColor?: string;
    charBubbleColor?: string;
  }
}

interface ApiSettings {
  baseUrl: string;
  apiKey: string;
  model: string;
}

interface ApiPreset {
  id: string;
  name: string;
  config: ApiSettings;
}

// --- 初始数据与常量 ---
const PRESET_COLORS = ['#18181b', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const PERIOD_TIMES = ['08:00', '09:50', '13:30', '15:20', '18:00', '19:50', '21:00', '22:00'];

// --- 主要组件 ---
export default function App() {
  // 基础状态
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const saved = localStorage.getItem('last_active_tab');
    return (saved as Tab) || 'messages';
  });
  const [selectedChat, setSelectedChat] = useState<Character | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  
  // 侧边栏子菜单状态
  const [sidebarView, setSidebarView] = useState<'main' | 'settings' | 'beauty' | 'calendar' | 'popup' | 'schedule' | 'worldbook'>('main');

  // 辅助函数：安全地从 localStorage 解析 JSON
  const getSafeStorage = (key: string, defaultValue: any) => {
    try {
      const saved = localStorage.getItem(key);
      if (!saved || saved === 'undefined') return defaultValue;
      return JSON.parse(saved);
    } catch (e) {
      return defaultValue;
    }
  };

  // 用户资料状态
  const [userProfile, setUserProfile] = useState(() => 
    getSafeStorage('user_profile', { 
      name: 'User Name', 
      username: '@user_id',
      signature: 'Stay curious, keep cookie.',
      status: 'ID_2026.0508', 
      avatar: '',
      background: '' 
    })
  );

  // 世界书状态
  const [worldBooks, setWorldBooks] = useState<WorldBookPreset[]>(() => 
    getSafeStorage('app_world_books', [
      { id: '1', name: '全域背景', content: '这是一个充满奇幻与科技交织的世界...', isActive: false }
    ])
  );

  // 核心数据状态 (带本地持久化)
  const [characters, setCharacters] = useState<Character[]>(() => {
    const data = getSafeStorage('app_characters', [
      { id: '1', name: '智能助手', avatar: '', notes: '默认系统助手', lastMessage: '你好！有什么可以帮你的吗？', time: '12:00' }
    ]);
    const seen = new Set();
    return data.filter((item: any) => item.id && !seen.has(item.id) && seen.add(item.id));
  });

  const [courses, setCourses] = useState<Course[]>(() => {
    const data = getSafeStorage('app_courses', []);
    const seen = new Set();
    return data.filter((item: any) => item.id && !seen.has(item.id) && seen.add(item.id));
  });

  const [chatSettings, setChatSettings] = useState<ChatSettings>(() => 
    getSafeStorage('chat_settings', {})
  );

  const [posts, setPosts] = useState<Post[]>(() => {
    const data = getSafeStorage('app_posts', [
      { 
        id: '1', 
        content: '今天开启我的新计划。', 
        date: '5月8日', 
        type: 'user',
        likes: 0,
        isLiked: false,
        comments: [] 
      }
    ]);
    const seen = new Set();
    return data.filter((item: any) => item.id && !seen.has(item.id) && seen.add(item.id));
  });

  const [todos, setTodos] = useState<TodoItem[]>(() => {
    const data = getSafeStorage('app_todos', []);
    const seen = new Set();
    return data.filter((item: any) => item.id && !seen.has(item.id) && seen.add(item.id));
  });

  const [stickers, setStickers] = useState<Sticker[]>(() => {
    const data = getSafeStorage('app_stickers', [
      { id: '1', name: '开心', url: 'https://cdn-icons-png.flaticon.com/512/2590/2590525.png' }
    ]);
    const seen = new Set();
    return data.filter((item: any) => item.id && !seen.has(item.id) && seen.add(item.id));
  });

  const [apiSettings, setApiSettings] = useState<ApiSettings>(() => 
    getSafeStorage('api_settings', { baseUrl: 'https://api.openai.com/v1', apiKey: '', model: 'gpt-4o' })
  );

  const [apiPresets, setApiPresets] = useState<ApiPreset[]>(() => {
    const data = getSafeStorage('api_presets', []);
    const seen = new Set();
    return data.filter((item: any) => item.id && !seen.has(item.id) && seen.add(item.id));
  });
  
  const [todoColors, setTodoColors] = useState<string[]>(() => 
    getSafeStorage('todo_colors', ['#18181b', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'])
  );

  const [availableModels, setAvailableModels] = useState<string[]>(() => {
    const data = getSafeStorage('app_available_models', []);
    return Array.from(new Set(data.filter(i => !!i)));
  });
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [customStyle, setCustomStyle] = useState(() => localStorage.getItem('custom_css') || '');

  const [isChatSettingsOpen, setIsChatSettingsOpen] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
  const [postToForward, setPostToForward] = useState<Post | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(() => localStorage.getItem('selected_post_id'));
  const [postDetailReturnChatId, setPostDetailReturnChatId] = useState<string | null>(null);
  const [postActionTarget, setPostActionTarget] = useState<{ type: 'post' | 'comment', id: string, parentId?: string, content: string } | null>(null);

  // --- 返回键/手势接管逻辑 ---
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      // 优先级：弹窗 > 详情页 > 聊天窗口 > 侧边栏
      if (isCreatePostModalOpen) {
        setIsCreatePostModalOpen(false);
        return;
      }
      if (isForwardModalOpen) {
        setIsForwardModalOpen(false);
        return;
      }
      if (postActionTarget) {
        setPostActionTarget(null);
        return;
      }
      if (selectedPostId) {
        if (postDetailReturnChatId) {
          setActiveTab('messages');
          const char = characters.find(c => c.id === postDetailReturnChatId);
          if (char) setSelectedChat(char);
          setPostDetailReturnChatId(null);
        }
        setSelectedPostId(null);
        localStorage.removeItem('selected_post_id');
        return;
      }
      if (selectedChat) {
        setSelectedChat(null);
        return;
      }
      if (isSidebarOpen) {
        setIsSidebarOpen(false);
        return;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [
    isCreatePostModalOpen, 
    isForwardModalOpen, 
    postActionTarget, 
    selectedPostId, 
    selectedChat, 
    isSidebarOpen, 
    postDetailReturnChatId, 
    characters
  ]);

  // 当进入「深层」UI 时，向历史记录推送一个状态
  useEffect(() => {
    const hasActiveLayer = isCreatePostModalOpen || isForwardModalOpen || postActionTarget || selectedPostId || selectedChat || isSidebarOpen;
    if (hasActiveLayer) {
      // 防止重复推送
      if (window.history.state !== 'active-layer') {
        window.history.pushState('active-layer', '');
      }
    }
  }, [isCreatePostModalOpen, isForwardModalOpen, postActionTarget, selectedPostId, selectedChat, isSidebarOpen]);

  // 消息与美化增强状态
  const [messages, setMessages] = useState<Message[]>(() => {
    const data = getSafeStorage('app_messages', []);
    const seen = new Set();
    // 过滤重复并确保数据完整性
    return data.filter((item: any) => item.id && !seen.has(item.id) && seen.add(item.id));
  });

  const chatMessages = selectedChat ? messages.filter(m => m.charId === selectedChat.id) : [];
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [quotedMessage, setQuotedMessage] = useState<Message | null>(null);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, msgId: string } | null>(null);
  const menuTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 自动滚动到底部
  const scrollToBottom = (instant = false) => {
    messagesEndRef.current?.scrollIntoView({ behavior: instant ? 'auto' : 'smooth' });
  };

  useEffect(() => {
    if (selectedChat) {
      // 首次进入聊天或收到消息时立即跳转
      scrollToBottom(true);
    }
  }, [selectedChat, messages]);

  // 消息菜单自动消失逻辑
  useEffect(() => {
    if (contextMenu) {
      if (menuTimerRef.current) clearTimeout(menuTimerRef.current);
      menuTimerRef.current = setTimeout(() => {
        setContextMenu(null);
      }, 4000);
    }
    return () => {
      if (menuTimerRef.current) clearTimeout(menuTimerRef.current);
    };
  }, [contextMenu]);

  const [beautyPresets, setBeautyPresets] = useState<BeautyPreset[]>(() => 
    getSafeStorage('beauty_presets', [{ id: 'default', name: '默认黑白', css: '' }])
  );

  const [isAddCharModalOpen, setIsAddCharModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferState, setTransferState] = useState({ amount: '', remark: '' });
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isStickerPickerOpen, setIsStickerPickerOpen] = useState(false);
  const [isPopupEnabled, setIsPopupEnabled] = useState(() => localStorage.getItem('popup_enabled') === 'true');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // --- 下拉刷新模拟状态 ---
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const isAtTop = useRef(true);

  const handleTouchStart = (e: React.TouchEvent) => {
    const scrollEl = e.currentTarget as HTMLElement;
    isAtTop.current = scrollEl.scrollTop === 0;
    if (isAtTop.current) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isAtTop.current && startY.current > 0) {
      const delta = e.touches[0].clientY - startY.current;
      if (delta > 0) {
        setPullDistance(Math.min(delta * 0.5, 80));
      }
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 60) {
      setIsRefreshing(true);
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      }, 1500);
    } else {
      setPullDistance(0);
    }
    startY.current = 0;
  };

  // 课表/日历辅助逻辑
  const [currentDate, setCurrentDate] = useState(new Date());

  // --- 持久化副作用 ---
  useEffect(() => {
    try {
      localStorage.setItem('user_profile', JSON.stringify(userProfile));
      localStorage.setItem('api_settings', JSON.stringify(apiSettings));
      localStorage.setItem('app_characters', JSON.stringify(characters));
      localStorage.setItem('app_courses', JSON.stringify(courses));
      localStorage.setItem('app_posts', JSON.stringify(posts));
      localStorage.setItem('chat_settings', JSON.stringify(chatSettings));
      localStorage.setItem('app_todos', JSON.stringify(todos));
      localStorage.setItem('app_stickers', JSON.stringify(stickers));
      localStorage.setItem('custom_css', customStyle);
      localStorage.setItem('beauty_presets', JSON.stringify(beautyPresets));
      localStorage.setItem('app_messages', JSON.stringify(messages));
      localStorage.setItem('todo_colors', JSON.stringify(todoColors));
      localStorage.setItem('api_presets', JSON.stringify(apiPresets));
      localStorage.setItem('app_available_models', JSON.stringify(availableModels));
      localStorage.setItem('app_world_books', JSON.stringify(worldBooks));
      localStorage.setItem('last_active_tab', activeTab);
      localStorage.setItem('popup_enabled', isPopupEnabled ? 'true' : 'false');
      if (selectedPostId) localStorage.setItem('selected_post_id', selectedPostId);
      else localStorage.removeItem('selected_post_id');
    } catch (e) {
      if (e instanceof Error && e.name === 'QuotaExceededError') {
        console.warn('Storage quota exceeded, failed to save some data.');
      }
    }
  }, [userProfile, apiSettings, characters, courses, posts, chatSettings, todos, stickers, customStyle, beautyPresets, messages, availableModels, apiPresets, activeTab, selectedPostId]);

  const handleClearCache = async () => {
    if (!confirm('确定要清除所有本地数据吗？这将包括消息记录、角色设置和美容预设。')) return;
    localStorage.clear();
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    window.location.reload();
  };

  const handleExportData = () => {
    const data = {
      user_profile: userProfile,
      api_settings: apiSettings,
      app_characters: characters,
      app_courses: courses,
      app_posts: posts,
      chat_settings: chatSettings,
      app_todos: todos,
      app_stickers: stickers,
      custom_css: customStyle,
      beauty_presets: beautyPresets,
      app_messages: messages
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cookie-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.user_profile) setUserProfile(data.user_profile);
        if (data.api_settings) setApiSettings(data.api_settings);
        if (data.app_characters) setCharacters(data.app_characters);
        if (data.app_courses) setCourses(data.app_courses);
        if (data.app_posts) setPosts(data.app_posts);
        if (data.chat_settings) setChatSettings(data.chat_settings);
        if (data.app_todos) setTodos(data.app_todos);
        if (data.app_stickers) setStickers(data.app_stickers);
        if (data.custom_css) setCustomStyle(data.custom_css);
        if (data.beauty_presets) setBeautyPresets(data.beauty_presets);
        if (data.app_messages) setMessages(data.app_messages);
        alert('导入成功，请刷新页面以确保所有样式生效。');
      } catch (err) {
        alert('导入失败，文件格式不正确。');
      }
    };
    reader.readAsText(file);
  };

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
        const uniqueModels = Array.from(new Set(data.data.map((m: any) => m.id).filter((id: any) => !!id))) as string[];
        setAvailableModels(uniqueModels);
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
        return { id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`, name: parts[0].trim(), url: parts.slice(1).join(':').trim() };
      }
      return null;
    }).filter(s => s !== null) as Sticker[];
    setStickers([...stickers, ...newStickers]);
  };

  const summarizeMemory = async (char: Character, history: any[]) => {
    try {
      if (!apiSettings.baseUrl || !apiSettings.apiKey) return;
      const recentHistory = history.slice(-20).map(m => `${m.role}: ${m.content}`).join('\n');
      const summarizePrompt = `你现在是一个用于总结角色记忆的辅助AI。\n请总结以下聊天记录中，提取出新的、重要的人物关系、事件、用户特征和角色特征。将这些信息合并为一段简洁精炼的记忆。\n\n【注意】\n直接返回总结后的文本，不要输出多余解释。\n如果没有实质性进展，则返回"NO_UPDATE"。\n\n【聊天记录】\n${recentHistory}`;
      
      const resp = await fetch(`${apiSettings.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiSettings.apiKey}` },
        body: JSON.stringify({ 
          model: apiSettings.model, 
          messages: [{ role: 'system', content: summarizePrompt }], 
          temperature: 0.3 
        })
      });
      const data = await resp.json();
      if (data.choices?.[0]?.message?.content) {
        const summary = data.choices[0].message.content.trim();
        if (summary && summary !== 'NO_UPDATE') {
          // 如果原来的设定里没有包含这段总结，就追加进去
          setCharacters(prev => prev.map(c => {
            if (c.id === char.id) {
              const oldNotes = c.notes || '';
              // 简单防重：如果不包含则追加
              if (!oldNotes.includes(summary)) {
                const newNotes = oldNotes ? `${oldNotes}\n\n【记忆片段】\n${summary}` : `【记忆片段】\n${summary}`;
                return { ...c, notes: newNotes };
              }
            }
            return c;
          }));
          // 追加系统通知
          setMessages(prev => [...prev, {
            id: `system-memory-${Date.now()}`,
            charId: char.id,
            role: 'system',
            content: `💡 记忆模块：已自动总结并更新角色设定。`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
        }
      }
    } catch (e) {
      console.error('Failed to summarize memory:', e);
    }
  };

  const handleSendMessage = async (triggerAi: boolean = false) => {
    if (!selectedChat || isTyping) return;
    
    const trimmedInput = inputMessage.trim();
    // 如果没有输入且不触发 AI，则直接返回
    if (!trimmedInput && !triggerAi) return;

    const content = trimmedInput;
    const msgType = isVoiceMode ? 'voice' : 'text';
    
    // 如果有输入，先发送消息
    if (content) {
      if (editingMessageId) {
        setMessages(prev => prev.map(m => m.id === editingMessageId ? { ...m, content, isEdited: true } : m));
        setEditingMessageId(null);
        setInputMessage('');
        return;
      }

      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newUserMsg: Message = { 
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`, 
        charId: selectedChat.id,
        role: 'user', 
        content: quotedMessage ? `> ${quotedMessage.content}\n\n${content}` : content, 
        time,
        type: msgType
      };
      
      setMessages(prev => [...prev, newUserMsg]);
      setInputMessage('');
      setQuotedMessage(null);
      setIsVoiceMode(false);
    }

    if (!triggerAi) return;
    
    // 获取最新的角色数据（以防在联系人界面修改了设定）
    const latestChar = characters.find(c => c.id === selectedChat.id) || selectedChat;

    // 检查 API 配置
    if (!apiSettings.baseUrl || !apiSettings.apiKey) {
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        charId: latestChar.id,
        role: 'assistant',
        content: "请先配置api",
        time,
        type: 'text'
      };
      setMessages(prev => [...prev, errorMsg]);
      return;
    }

    setIsTyping(true);
    const activeWorldBook = worldBooks.find(wb => wb.isActive);
    // 角色设定取 char.notes
    const systemPrompt = `你是 ${latestChar.name}。${latestChar.notes || ''}${activeWorldBook ? `\n\n【世界背景/世界书】\n${activeWorldBook.content}` : ''}
【系统提示】你可以根据语意使用 "|||" 分隔符来实现分句发送，从而形成多个气泡。例如："今天天气真好|||太阳很明媚|||风也不大"。请根据语意自然分句或分段使用这个功能，不要输出多余解释。`;
    
    // 获取当前聊天历史
    const currentChatHistory = messages.filter(m => m.charId === latestChar.id);
    
    // 如果立刻刚才发了消息，消息还没进 messages state (异步)，所以这里我们要手动补齐历史
    const latestHistory = content 
      ? [...currentChatHistory, { role: 'user', content } as Message]
      : currentChatHistory;

    try {
      const resp = await fetch(`${apiSettings.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiSettings.apiKey}` },
        body: JSON.stringify({ 
          model: apiSettings.model, 
          messages: [
            { role: 'system', content: systemPrompt },
            ...latestHistory.slice(-10).map(m => ({ role: m.role, content: m.content }))
          ], 
          temperature: 0.7 
        })
      });
      const data = await resp.json();
      if (data.choices?.[0]?.message?.content) {
        const fullContent = data.choices[0].message.content;
        
        // 解析多气泡格式: 使用 ||| 作为分隔符
        const parts = fullContent.split('|||').map((s: string) => s.trim()).filter(Boolean);
        
        // 先关闭初次 loading 状态
        setIsTyping(false);

        if (parts.length > 1) {
          // 如果符合多气泡格式，则顺序发送
          const sendPartsSequential = async () => {
            for (let i = 0; i < parts.length; i++) {
              if (i > 0) {
                setIsTyping(true);
                // 模拟处理/打字延迟
                await new Promise(r => setTimeout(r, 1000 + Math.random() * 500));
                setIsTyping(false);
              }
              
              const newMsg: Message = {
                id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
                charId: selectedChat.id,
                role: 'assistant',
                content: parts[i],
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              };
              
              setMessages(prev => [...prev, newMsg]);
              
              // 如果开启后台弹窗，发送通知
              if (isPopupEnabled && Notification.permission === 'granted') {
                 new Notification(selectedChat.name, {
                   body: newMsg.content,
                   icon: selectedChat.avatar || 'https://via.placeholder.com/100'
                 });
              }
            }
          };
          await sendPartsSequential();
        } else {
          // 普通单气泡格式
          const newMsg: Message = { 
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`, 
            charId: selectedChat.id,
            role: 'assistant', 
            content: parts[0] || fullContent,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, newMsg]);

          // 如果开启后台弹窗，发送通知
          if (isPopupEnabled && Notification.permission === 'granted') {
             new Notification(selectedChat.name, {
               body: newMsg.content,
               icon: selectedChat.avatar || 'https://via.placeholder.com/100'
             });
          }
        }
        
        // 记忆模块检查：检查是否需要进行总结
        const summaryInterval = chatSettings[latestChar.id]?.summaryInterval;
        if (summaryInterval && summaryInterval > 0) {
          // 当前历史长度（包含新回复）
          const updatedHistory = [...latestHistory, { role: 'assistant', content: fullContent }];
          const userMsgCount = updatedHistory.filter(m => m.role === 'user').length;
          
          if (userMsgCount > 0 && userMsgCount % summaryInterval === 0) {
            // 触发总结
            setTimeout(() => summarizeMemory(latestChar, updatedHistory), 1000);
          }
        }
      }
    } catch (e) {
      setMessages(prev => [...prev, { 
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`, 
        charId: selectedChat.id,
        role: 'assistant', 
        content: '连接接口失败，请检查配置。',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white text-black font-sans overflow-hidden">
      {/* 全局注入背景 (针对某些预设) */}
      <div className="fixed inset-0 pointer-events-none z-[-1] bg-white transition-colors duration-500" />

      {/* 顶部栏 */}
      <header className="flex items-center justify-between px-6 pt-4 pb-2 border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-10 transition-all">
        <button 
          onClick={() => {
            setIsSidebarOpen(true);
            setSidebarView('main');
          }}
          className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden hover:bg-gray-100 transition-all group"
        >
          {userProfile.avatar ? (
            <img src={userProfile.avatar} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
          ) : (
            <div className="bg-zinc-900 w-full h-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <User className="text-white w-5 h-5" />
            </div>
          )}
        </button>
        <h1 className="text-lg font-bold tracking-tight text-zinc-800">
          {activeTab === 'messages' && 'MESSAGES'}
          {activeTab === 'contacts' && 'CONTACTS'}
          {activeTab === 'space' && 'SPACE'}
        </h1>
        {activeTab === 'contacts' ? (
          <button 
            onClick={() => setIsAddCharModalOpen(true)}
            className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-white hover:bg-zinc-800 transition-all active:scale-95"
          >
            <Plus size={20} />
          </button>
        ) : (
          <div className="w-10" />
        )}
      </header>

      {/* 主体内容区域 */}
      <main 
        className="flex-1 overflow-y-auto pb-24 relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 下拉刷新提示器 */}
        <div 
          className="absolute left-0 right-0 flex justify-center pointer-events-none transition-all"
          style={{ height: pullDistance, top: 0, opacity: pullDistance / 60 }}
        >
          <div className="flex flex-col items-center justify-center gap-1 mt-4">
            <RotateCw size={16} className={`text-zinc-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-300">
              {isRefreshing ? 'Refreshing' : pullDistance > 60 ? 'Release to Refresh' : 'Pull to Refresh'}
            </span>
          </div>
        </div>

        <motion.div
           animate={{ y: isRefreshing ? 60 : pullDistance }}
           transition={{ type: 'spring', damping: 20, stiffness: 200 }}
           className="h-full"
        >
          <AnimatePresence mode="wait">
            {activeTab === 'messages' && (
            <motion.div key="messages" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-2">
              <div className="px-2 py-4 mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-300 border-b border-zinc-50">Active Flows</div>
              {characters.map(char => (
                <div 
                  key={char.id} 
                  onClick={() => setSelectedChat(char)}
                  onPointerDown={(e) => {
                    const timer = setTimeout(() => {
                      if (confirm(`确定要移除与 ${char.name} 的对话记录吗？`)) {
                        setCharacters(prev => prev.filter(c => c.id !== char.id));
                      }
                    }, 800);
                    e.currentTarget.addEventListener('pointerup', () => clearTimeout(timer), { once: true });
                    e.currentTarget.addEventListener('pointermove', () => clearTimeout(timer), { once: true });
                  }}
                  className="flex items-center gap-3 pl-2 pr-4 py-4 hover:bg-zinc-50 rounded-[2rem] transition-all cursor-pointer group active:scale-95 touch-none"
                >
                  <div className="w-10 h-10 rounded-2xl bg-zinc-900 flex items-center justify-center text-white text-lg font-bold overflow-hidden">
                    {char.avatar ? <img src={char.avatar} className="w-full h-full object-cover" /> : char.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-zinc-800 truncate">{chatSettings[char.id]?.nickname || char.name}</span>
                      <span className="text-[10px] text-zinc-500 font-mono font-bold">
                        {messages.filter(m => m.charId === char.id).slice(-1)[0]?.time || '12:00'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 truncate opacity-80">
                      {(() => {
                        const charMsgs = messages.filter(m => m.charId === char.id);
                        if (charMsgs.length === 0) return '待发起的对话...';
                        const lastMsg = charMsgs[charMsgs.length - 1];
                        if (lastMsg.type === 'voice') return '[语音消息]';
                        if (lastMsg.type === 'transfer') return '[转账消息]';
                        if (lastMsg.postForward) return '[转发帖子]';
                        return lastMsg.content;
                      })()}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'contacts' && (
            <motion.div key="contacts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6">
              <div className="text-[10px] text-zinc-300 mb-6 font-bold uppercase tracking-widest px-2">Entity Lab</div>
              <div className="space-y-4">
                {characters.map(char => (
                  <div key={char.id} className="flex items-center justify-between p-5 bg-white border border-gray-50 rounded-[2.5rem] transition-all cursor-pointer group">
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col pb-20 bg-white"
            >
              {/* 背景区域 */}
              <div className="relative h-[33vh] w-full bg-zinc-100 group">
                {userProfile.background ? (
                  <img src={userProfile.background} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-300 bg-zinc-50 font-black uppercase tracking-widest text-4xl opacity-10">
                    Cookie Space
                  </div>
                )}
                
                {/* 背景切换 */}
                <button 
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e: any) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setUserProfile({ ...userProfile, background: ev.target?.result as string });
                        };
                        reader.readAsDataURL(file);
                      }
                    };
                    input.click();
                  }}
                  className="absolute top-4 left-4 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-all opacity-0 group-hover:opacity-100"
                >
                  <Camera size={16} />
                </button>

                {/* 发布按钮 */}
                <button 
                  onClick={() => setIsCreatePostModalOpen(true)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all"
                >
                  <Plus size={24} />
                </button>

                {/* 用户头像 */}
                <div className="absolute -bottom-8 right-8 z-10">
                  <div 
                    onClick={() => {
                      const url = prompt('头像 URL:', userProfile.avatar);
                      if (url !== null) setUserProfile({ ...userProfile, avatar: url });
                    }}
                    className="w-24 h-24 rounded-[1.8rem] border-[6px] border-white bg-zinc-900 overflow-hidden cursor-pointer active:scale-95 transition-all"
                  >
                    {userProfile.avatar ? (
                      <img src={userProfile.avatar} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><User className="text-white" size={40} /></div>
                    )}
                  </div>
                </div>
              </div>

              {/* 用户资料 (头像下方, 右对齐) */}
              <div className="px-8 pt-10 pb-4 text-right flex flex-col items-end">
                <span 
                  onClick={() => {
                    const newName = prompt('修改网名:', userProfile.name);
                    if (newName !== null) setUserProfile({ ...userProfile, name: newName });
                  }}
                  className="text-xl font-bold text-zinc-900 leading-none cursor-pointer hover:opacity-70 transition-opacity"
                >
                  {userProfile.name}
                </span>
                <p 
                  onClick={() => {
                    const newSig = prompt('修改个性签名:', userProfile.signature);
                    if (newSig !== null) setUserProfile({ ...userProfile, signature: newSig });
                  }}
                  className="text-[10px] text-zinc-400 mt-2 italic max-w-[70%] cursor-pointer hover:opacity-70 transition-opacity"
                >
                  {userProfile.signature}
                </p>
              </div>

              {/* 帖子列表 */}
              <div className="mt-4 px-6 divide-y divide-zinc-100 pb-20">
                {posts.map(post => (
                    <PostCard 
                      key={post.id} 
                      post={post} 
                      userProfile={userProfile} 
                      characters={characters}
                      onLike={() => {
                        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 } : p));
                      }}
                      onComment={(content) => {
                        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const newComment = { id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`, username: userProfile.name, content, likes: 0, time };
                        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, comments: [...p.comments, newComment] } : p));
                      }}
                      onForward={() => {
                        setPostToForward(post);
                        setIsForwardModalOpen(true);
                      }}
                      onClick={() => setSelectedPostId(post.id)}
                      onLongPress={() => setPostActionTarget({ type: 'post', id: post.id, content: post.content })}
                    />
                ))}
              </div>

              <div className="p-10 text-center opacity-20 filter grayscale">
                <p className="text-[9px] font-black uppercase tracking-[0.5em]">--- End of Space ---</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </motion.div>

        <AnimatePresence mode="wait">
          {selectedPostId && (
            <motion.div
              key="global-detail"
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-0 z-[100] bg-white flex flex-col"
            >
              <PostDetailView 
                post={posts.find(p => p.id === selectedPostId) || (messages || []).find(m => m.postForward?.id === selectedPostId)?.postForward}
                onBack={() => {
                  if (postDetailReturnChatId) {
                    setActiveTab('messages');
                    const char = characters.find(c => c.id === postDetailReturnChatId);
                    if (char) setSelectedChat(char);
                    setPostDetailReturnChatId(null);
                  }
                  setSelectedPostId(null);
                  localStorage.removeItem('selected_post_id');
                }}
                userProfile={userProfile}
                characters={characters}
                onLikePost={() => {
                  setPosts(prev => prev.map(p => p.id === selectedPostId ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 } : p));
                }}
                onAddComment={(content, replyTo) => {
                  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const newComment = { id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`, username: userProfile.name, content, likes: 0, replyTo, time };
                  setPosts(prev => {
                    const exists = prev.some(p => p.id === selectedPostId);
                    if (!exists) {
                      const forwardPost = messages.find(m => m.postForward?.id === selectedPostId)?.postForward;
                      if (forwardPost) return [{ ...forwardPost, comments: [newComment] }, ...prev];
                    }
                    return prev.map(p => p.id === selectedPostId ? { ...p, comments: [...(p.comments || []), newComment] } : p);
                  });
                }}
                onLikeComment={(commentId) => {
                  setPosts(prev => prev.map(p => p.id === selectedPostId ? {
                    ...p,
                    comments: (p.comments || []).map(c => c.id === commentId ? { ...c, isLiked: !c.isLiked, likes: c.isLiked ? c.likes - 1 : c.likes + 1 } : c)
                  } : p));
                }}
                onCommentLongPress={(id, content) => setPostActionTarget({ type: 'comment', id, parentId: selectedPostId!, content })}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Install Prompt for PWA */}
      <AnimatePresence>
        {showInstallPrompt && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 left-4 right-4 bg-zinc-900 text-white p-4 rounded-3xl shadow-2xl z-50 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M256 80L310.5 190.5L431.5 208L344 293.5L364.5 414L256 357L147.5 414L168 293.5L80.5 208L201.5 190.5L256 80Z" fill="black"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm">将 Cookie 添加到主屏幕</span>
                <span className="text-xs text-zinc-400">体验完整的沉浸式应用</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowInstallPrompt(false)}
                className="p-2 text-zinc-400 hover:text-white"
              >
                取消
              </button>
              <button 
                onClick={async () => {
                  if (deferredPrompt) {
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    if (outcome === 'accepted') {
                      setDeferredPrompt(null);
                      setShowInstallPrompt(false);
                    }
                  }
                }}
                className="bg-white text-zinc-900 px-4 py-2 rounded-xl text-xs font-bold"
              >
                安装
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              className="fixed inset-0 bg-white z-[60] flex flex-col pt-[env(safe-area-inset-top)]"
            >
              {/* 聊天顶栏 - 固定在 flex-col 顶部 */}
              {!isChatSettingsOpen && (
                <div className="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-gray-100 z-[110] flex items-center justify-between px-6 pt-[env(safe-area-inset-top)]">
                  <button onClick={() => setSelectedChat(null)} className="p-2 hover:bg-gray-50 rounded-full transition-colors text-zinc-400 -ml-2">
                    <ArrowLeft size={20} />
                  </button>
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-zinc-900 text-sm tracking-tight">{chatSettings[selectedChat.id]?.nickname || selectedChat.name}</span>
                    <span className="text-[9px] text-emerald-500 font-black flex items-center gap-1 uppercase tracking-widest">• Online</span>
                  </div>
                  <button 
                    onClick={() => setIsChatSettingsOpen(true)}
                    className="p-2 hover:bg-gray-50 rounded-full transition-colors text-zinc-400 -mr-2"
                  >
                    <Settings2 size={20} />
                  </button>
                </div>
              )}

              <ChatSettingsModal 
                char={selectedChat} 
                settings={chatSettings} 
                setChatSettings={setChatSettings} 
                isOpen={isChatSettingsOpen} 
                onClose={() => setIsChatSettingsOpen(false)}
                ImageUploader={ImageUploader}
                setCharacters={setCharacters}
              />

              {/* 消息区域 */}
              <div 
                className="flex-1 overflow-y-auto px-3 pb-10 pt-[calc(4rem+env(safe-area-inset-top))] space-y-6 bg-zinc-50/50 relative"
                style={{
                  backgroundImage: chatSettings[selectedChat.id]?.background ? `url(${chatSettings[selectedChat.id]?.background})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              onClick={() => {
                setContextMenu(null);
                if (!isMultiSelectMode) setSelectedMessageIds([]);
              }}
            >
              {/* 消息长按菜单 */}
              <AnimatePresence>
                {contextMenu && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="fixed z-[120] bg-zinc-100 text-zinc-900 rounded-2xl py-2 w-32 border border-zinc-200"
                    style={{ left: contextMenu.x, top: Math.min(contextMenu.y, window.innerHeight - 200) }}
                  >
                    <ContextItem label="撤回" onClick={() => {
                      setMessages(messages.filter(m => m.id !== contextMenu.msgId));
                      setContextMenu(null);
                    }} />
                    <ContextItem label="编辑" onClick={() => {
                      const msg = messages.find(m => m.id === contextMenu.msgId);
                      if (msg) {
                        setEditingMessageId(msg.id);
                        setInputMessage(msg.content);
                      }
                      setContextMenu(null);
                    }} />
                    <ContextItem label="多选" onClick={() => {
                      setIsMultiSelectMode(true);
                      setSelectedMessageIds([contextMenu.msgId]);
                      setContextMenu(null);
                    }} />
                    <ContextItem label="引用" onClick={() => {
                      const msg = messages.find(m => m.id === contextMenu.msgId);
                      if (msg) setQuotedMessage(msg);
                      setContextMenu(null);
                    }} />
                    <div className="border-t border-zinc-200 my-1" />
                    <ContextItem label="删除" color="text-red-500" onClick={() => {
                      setMessages(messages.filter(m => m.id !== contextMenu.msgId));
                      setContextMenu(null);
                    }} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 注入聊天室专用 CSS */}
              {chatSettings[selectedChat.id]?.customCss && (
                <style>{chatSettings[selectedChat.id]?.customCss}</style>
              )}
              {chatMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-zinc-300">
                  <MessageSquare size={48} className="mb-2 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest">Initialization Ready</p>
                </div>
              )}
              
              {chatMessages.map((msg, index) => {
                const settings = chatSettings[selectedChat.id] || {};
                const bubbleStyle = {
                  fontSize: settings.fontSize ? `${settings.fontSize}px` : undefined,
                  padding: settings.bubblePadding ? `${settings.bubblePadding}px` : undefined,
                  maxWidth: settings.bubbleWidth ? `${settings.bubbleWidth}%` : '85%',
                  backgroundColor: msg.role === 'user' ? settings.userBubbleColor : settings.charBubbleColor,
                  color: (msg.role === 'user' && settings.userBubbleColor) || (msg.role === 'assistant' && settings.charBubbleColor) ? 'white' : undefined
                };

                const glassClass = settings.frostedGlass ? 'backdrop-blur-md bg-opacity-70' : '';

                if (msg.role === 'system') {
                  return (
                    <motion.div 
                      key={msg.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-center my-4 pointer-events-none"
                    >
                      <div className="bg-zinc-200/50 text-zinc-500 px-4 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase backdrop-blur-md">
                        {msg.content}
                      </div>
                    </motion.div>
                  );
                }

                return (
                  <motion.div 
                    key={msg.id} 
                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} ${msg.postForward ? 'items-start' : 'items-end'} gap-2 group relative`}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({ x: e.clientX, y: e.clientY, msgId: msg.id });
                    }}
                    onPointerDown={(e) => {
                      const timer = setTimeout(() => {
                        setContextMenu({ x: e.clientX, y: e.clientY, msgId: msg.id });
                      }, 3000);
                      
                      const cancel = () => {
                        clearTimeout(timer);
                        window.removeEventListener('pointerup', cancel);
                        window.removeEventListener('pointermove', cancel);
                      };
                      
                      window.addEventListener('pointerup', cancel, { once: true });
                      window.addEventListener('pointermove', (ev) => {
                        // 如果移动距离超过阈值，取消长按
                        const dist = Math.sqrt(Math.pow(ev.clientX - e.clientX, 2) + Math.pow(ev.clientY - e.clientY, 2));
                        if (dist > 10) cancel();
                      });
                    }}
                  >
                    {isMultiSelectMode && (
                      <div 
                        onClick={() => setSelectedMessageIds(prev => prev.includes(msg.id) ? prev.filter(id => id !== msg.id) : [...prev, msg.id])}
                        className={`w-5 h-5 rounded-full border flex items-center justify-center cursor-pointer mb-2 transition-all ${selectedMessageIds.includes(msg.id) ? 'bg-zinc-900 border-zinc-900' : 'border-zinc-300'}`}
                      >
                        {selectedMessageIds.includes(msg.id) && <Check size={10} className="text-white" />}
                      </div>
                    )}

                    {msg.role === 'assistant' && (
                      <div 
                        className="rounded-xl bg-zinc-900 border border-zinc-50 overflow-hidden shrink-0"
                        style={{ width: settings.avatarSize || 36, height: settings.avatarSize || 36 }}
                      >
                        {settings.charAvatar || selectedChat.avatar ? (
                          <img src={settings.charAvatar || selectedChat.avatar} className="w-full h-full object-cover" alt="char" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white">{selectedChat.name[0]}</div>
                        )}
                      </div>
                    )}

                    {msg.type === 'voice' ? (
                      <VoiceBubble 
                        role={msg.role} 
                        duration={Math.min((msg.content || '').length * 0.5, 60).toFixed(0)} 
                        style={bubbleStyle}
                        glassClass={glassClass}
                        transcribedText={msg.content}
                        avatar={(
                          <div 
                            className={`rounded-xl bg-zinc-900 border border-zinc-50 overflow-hidden shrink-0 ${msg.role === 'user' ? 'ml-2' : 'mr-2'}`}
                            style={{ width: settings.avatarSize || 36, height: settings.avatarSize || 36 }}
                          >
                            {msg.role === 'assistant' ? (
                              (settings.charAvatar || selectedChat.avatar ? <img src={settings.charAvatar || selectedChat.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white">{selectedChat.name[0]}</div>)
                            ) : (
                              (settings.userAvatar || userProfile.avatar ? <img src={settings.userAvatar || userProfile.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><User size={14} className="text-zinc-400" /></div>)
                            )}
                          </div>
                        )}
                      />
                    ) : msg.type === 'transfer' ? (
                      <TransferCard 
                        role={msg.role}
                        amount={msg.transferData?.amount || '0.00'}
                        remark={msg.transferData?.remark || '无备注'}
                        style={bubbleStyle}
                        glassClass={glassClass}
                      />
                    ) : (
                      <div 
                        className={msg.postForward ? "w-full flex" : `relative p-4 ${msg.role === 'user' ? (settings.userBubbleColor ? '' : 'bg-zinc-900 text-white') : (settings.charBubbleColor ? '' : 'bg-white text-zinc-800 border border-gray-100')} rounded-3xl ${msg.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'} font-medium leading-relaxed ${glassClass} overflow-hidden`}
                        style={msg.postForward ? {} : bubbleStyle}
                      >
                        {msg.postForward ? (
                          <div 
                            onClick={() => {
                              setPostDetailReturnChatId(selectedChat!.id);
                              setSelectedPostId(msg.postForward!.id);
                            }}
                            className={`w-4/5 aspect-[4/2] bg-white border border-zinc-100 rounded-2xl p-4 flex flex-col justify-between cursor-pointer hover:bg-zinc-50 transition-all active:scale-[0.98] relative ${msg.role === 'user' ? 'ml-auto' : 'mr-auto'}`}
                          >
                            <div className="flex items-center gap-2 border-b border-zinc-50 pb-2">
                              <div className="w-5 h-5 rounded-md bg-zinc-900 flex items-center justify-center text-[8px] font-black text-white shrink-0">
                                {msg.postForward.type === 'ai' ? 'AI' : (userProfile.avatar ? <img src={userProfile.avatar} className="w-full h-full object-cover rounded-md" /> : 'M')}
                              </div>
                              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter truncate">
                                {msg.postForward.type === 'ai' ? (characters[0]?.name || '助手') : userProfile.name}
                              </span>
                            </div>
                            
                            <div className="flex-1 py-2 overflow-hidden">
                              <p className="text-[11px] text-zinc-600 leading-snug line-clamp-2 italic">
                                {msg.postForward.content}
                              </p>
                            </div>

                            <div className="flex items-center justify-between mt-1 pt-2 border-t border-zinc-50/50">
                              <span className="text-[8px] text-zinc-300 font-black uppercase tracking-widest">Discovery Card</span>
                              <ArrowRight size={10} className="text-zinc-300" />
                            </div>
                          </div>
                        ) : (
                          msg.content
                        )}
                        {msg.isEdited && !msg.postForward && <span className="absolute -bottom-4 right-2 text-[8px] text-zinc-400 opacity-50 italic">已编辑</span>}
                      </div>
                    )}

                    {msg.role === 'user' && msg.type !== 'voice' && (
                      <div 
                        className="rounded-xl bg-zinc-100 border border-zinc-50 overflow-hidden shrink-0"
                        style={{ width: settings.avatarSize || 36, height: settings.avatarSize || 36 }}
                      >
                        {settings.userAvatar || userProfile.avatar ? (
                          <img src={settings.userAvatar || userProfile.avatar} className="w-full h-full object-cover" alt="user" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User size={14} className="text-zinc-400" />
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="p-4 bg-white border border-gray-100 rounded-2xl flex gap-1">
                    <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}
            </div>

            {/* 输入栏 */}
            <div className="p-4 flex flex-col gap-3 bg-white relative">
              {/* 引用/编辑预览区域 */}
              <AnimatePresence>
                {(quotedMessage || editingMessageId || isMultiSelectMode) && (
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    className="absolute bottom-full left-6 right-6 mb-2 p-4 bg-zinc-900 text-white rounded-2xl flex items-center justify-between"
                  >
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-[10px] font-black uppercase tracking-tighter opacity-50">
                        {isMultiSelectMode ? `已选择 ${selectedMessageIds.length} 条消息` : editingMessageId ? '正在编辑...' : '引用消息'}
                      </span>
                      {!isMultiSelectMode && <span className="text-xs truncate italic">{editingMessageId ? messages.find(m => m.id === editingMessageId)?.content : quotedMessage?.content}</span>}
                    </div>
                    <div className="flex gap-2">
                       {isMultiSelectMode && (
                         <button onClick={() => {
                           setMessages(messages.filter(m => !selectedMessageIds.includes(m.id)));
                           setIsMultiSelectMode(false);
                           setSelectedMessageIds([]);
                         }} className="p-2 bg-red-500 rounded-lg"><Trash2 size={14}/></button>
                       )}
                       <button onClick={() => {
                        setQuotedMessage(null);
                        setEditingMessageId(null);
                        setIsMultiSelectMode(false);
                        setSelectedMessageIds([]);
                        if (editingMessageId) setInputMessage('');
                      }} className="p-2 bg-zinc-800 rounded-lg"><X size={14}/></button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="flex items-end gap-3">
                <button 
                  onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                  className={`mb-1 p-2 hover:bg-zinc-50 rounded-xl transition-all ${isPlusMenuOpen ? 'rotate-45 text-zinc-900' : 'text-zinc-400'}`}
                >
                  <Plus size={22} />
                </button>
                <div className="flex-1 bg-zinc-50 rounded-2xl px-4 py-2 min-h-[44px] flex items-center border border-zinc-100">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (inputMessage.trim()) {
                          handleSendMessage(false); // 回车仅发送不触发回复
                          setInputMessage('');
                        }
                      }
                    }}
                    placeholder="Type a message..."
                    className="w-full bg-transparent border-none focus:ring-0 text-sm resize-none py-1 custom-scrollbar"
                    rows={Math.min(inputMessage.split('\n').length, 5)}
                  />
                  <button onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)} className="p-2 text-zinc-400 hover:text-zinc-600"><Smile size={18} /></button>
                </div>
                <button 
                  onClick={() => handleSendMessage(true)}
                  className="mb-1 w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center text-white active:scale-90 transition-all shrink-0"
                >
                  <Sparkles size={18} />
                </button>
              </div>
              {isPlusMenuOpen && (
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="grid grid-cols-4 gap-4 p-6 bg-zinc-50 rounded-[2rem] border border-gray-100"
                >
                  <PlusMenuItem icon={CreditCard} label="转账" onClick={() => setIsTransferModalOpen(true)} />
                  <PlusMenuItem icon={Mic} label="语音" onClick={() => setIsVoiceMode(!isVoiceMode)} />
                  <PlusMenuItem icon={Smile} label="表情" onClick={() => alert('在这里选择表情包')} />
                  <PlusMenuItem icon={ImageIcon} label="图库" onClick={() => alert('从本地选择图片')} />
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        <AddCharacterModal 
          isOpen={isAddCharModalOpen} 
          onClose={() => setIsAddCharModalOpen(false)}
          onSave={(char: Character) => {
            setCharacters(prev => [char, ...prev]);
            setIsAddCharModalOpen(false);
          }}
          ImageUploader={ImageUploader}
        />

        <TransferModal 
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          onConfirm={(amount: string, remark: string) => {
            if (!selectedChat) return;
            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const transferMsg: Message = {
              id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
              charId: selectedChat.id,
              role: 'user',
              content: `转账: ${amount}`,
              time,
              type: 'transfer',
              transferData: { amount, remark }
            };
            setMessages(prev => [...prev, transferMsg]);
            setIsTransferModalOpen(false);
            setTransferState({ amount: '', remark: '' });
          }}
          state={transferState}
          setState={setTransferState}
        />

        <CreatePostModal 
          isOpen={isCreatePostModalOpen}
          onClose={() => setIsCreatePostModalOpen(false)}
          onConfirm={(content: string, image: string, isTextImage: boolean, time: string) => {
            const newPost: Post = {
              id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
              content,
              image,
              isTextImage, // 设置文字图片标记
              date: time,  // 使用 HH:mm 格式
              type: 'user',
              likes: 0,
              isLiked: false,
              comments: []
            };
            setPosts(prev => [newPost, ...prev]);
          }}
        />

        <ForwardModal 
          isOpen={isForwardModalOpen}
          onClose={() => setIsForwardModalOpen(false)}
          characters={characters}
          post={postToForward}
          onForward={(charId: string) => {
            if (!postToForward) return;
            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const forwardMsg: Message = {
              id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
              charId,
              role: 'user',
              content: `[转发动态]\n${postToForward.content}${postToForward.image ? '\n(图片/文字视效)' : ''}`,
              time,
              type: 'text',
              postForward: postToForward // 带上转发元数据
            };
            setMessages(prev => [...prev, forwardMsg]);
            setIsForwardModalOpen(false);
            setPostToForward(null);
            alert('已转发到聊天窗口');
          }}
        />

        {/* 帖子/评论管理弹窗 */}
        {postActionTarget && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setPostActionTarget(null)} />
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white w-full max-w-xs rounded-[2.5rem] p-8 space-y-4 relative">
              <h3 className="text-xs font-black uppercase tracking-widest text-center text-zinc-300">Management</h3>
              <button 
                onClick={() => {
                  const newContent = prompt('修改内容:', postActionTarget.content);
                  if (newContent) {
                    if (postActionTarget.type === 'post') {
                      setPosts(prev => prev.map(p => p.id === postActionTarget.id ? { ...p, content: newContent } : p));
                    } else {
                      setPosts(prev => prev.map(p => p.id === postActionTarget.parentId ? {
                        ...p,
                        comments: p.comments.map(c => c.id === postActionTarget.id ? { ...c, content: newContent } : c)
                      } : p));
                    }
                  }
                  setPostActionTarget(null);
                }}
                className="w-full py-4 bg-zinc-50 rounded-2xl font-bold flex items-center justify-center gap-2"
              >
                <Edit3 size={16} /> 编辑
              </button>
              <button 
                onClick={() => {
                  if (confirm('确定删除吗？')) {
                    if (postActionTarget.type === 'post') {
                      setPosts(prev => prev.filter(p => p.id !== postActionTarget.id));
                      if (selectedPostId === postActionTarget.id) setSelectedPostId(null);
                    } else {
                      setPosts(prev => prev.map(p => p.id === postActionTarget.parentId ? {
                        ...p,
                        comments: p.comments.filter(c => c.id !== postActionTarget.id)
                      } : p));
                    }
                  }
                  setPostActionTarget(null);
                }}
                className="w-full py-4 bg-red-50 text-red-500 rounded-2xl font-bold flex items-center justify-center gap-2"
              >
                <Trash2 size={16} /> 删除
              </button>
            </motion.div>
          </div>
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
              className="fixed top-0 left-0 bottom-0 w-[85%] max-w-sm bg-white z-50 flex flex-col rounded-r-[3rem] overflow-hidden"
            >
              {/* 侧边栏头部 - 个人资料区域 */}
              <div className="p-10 pb-6 pt-20 bg-zinc-50/50">
                <button 
                  onClick={() => setIsProfileEditing(!isProfileEditing)}
                  className="w-20 h-20 rounded-[2rem] bg-zinc-900 flex items-center justify-center mb-6 transition-all hover:scale-105 overflow-hidden"
                >
                  {userProfile.avatar ? (
                    <img src={userProfile.avatar} className="w-full h-full object-cover" alt="avatar" />
                  ) : (
                    <User size={40} className="text-white" />
                  )}
                </button>
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold tracking-tight text-zinc-900">{userProfile.name}</h2>
                  <div className="flex flex-col">
                    <span className="text-zinc-400 text-[10px] font-mono uppercase tracking-widest leading-none mb-1">{userProfile.username}</span>
                    <span className="text-zinc-300 text-[9px] italic truncate max-w-[200px]">{userProfile.signature}</span>
                  </div>
                </div>

                {isProfileEditing && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-6 p-4 bg-white border border-gray-100 rounded-3xl space-y-6"
                  >
                    <div className="space-y-4">
                      <label className="block">
                        <span className="text-[10px] font-bold text-zinc-300 uppercase pl-1">用户昵称</span>
                        <input 
                          type="text" 
                          value={userProfile.name}
                          onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                          className="w-full bg-zinc-50 border-none rounded-2xl p-4 text-sm focus:ring-1 focus:ring-zinc-200 mt-1" 
                        />
                      </label>
                      
                      <label className="block">
                        <span className="text-[10px] font-bold text-zinc-300 uppercase pl-1">用户名 ID</span>
                        <input 
                          type="text" 
                          value={userProfile.username}
                          onChange={(e) => setUserProfile({ ...userProfile, username: e.target.value })}
                          className="w-full bg-zinc-50 border-none rounded-2xl p-4 text-sm focus:ring-1 focus:ring-zinc-200 mt-1" 
                        />
                      </label>

                      <label className="block">
                        <span className="text-[10px] font-bold text-zinc-300 uppercase pl-1">个性签名</span>
                        <input 
                          type="text" 
                          value={userProfile.signature}
                          onChange={(e) => setUserProfile({ ...userProfile, signature: e.target.value })}
                          className="w-full bg-zinc-50 border-none rounded-2xl p-4 text-sm focus:ring-1 focus:ring-zinc-200 mt-1" 
                        />
                      </label>
                    </div>
                    
                    <div className="space-y-4">
                      <ImageUploader 
                        label="更换头像" 
                        onUpload={(url: string) => setUserProfile({ ...userProfile, avatar: url })} 
                      />
                      
                      <ImageUploader 
                        label="更换空间背景" 
                        onUpload={(url: string) => setUserProfile({ ...userProfile, background: url })} 
                      />
                    </div>

                    <button 
                      onClick={() => setIsProfileEditing(false)}
                      className="w-full bg-zinc-900 text-white text-xs py-5 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all"
                    >
                      Update Identity
                    </button>
                  </motion.div>
                )}
              </div>

              {/* 侧边栏菜单切换容器 */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {sidebarView === 'main' ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest px-2">Navigation</span>
                      </div>
                      <SidebarItem icon={RotateCw} label="刷新页面" onClick={() => window.location.reload()} />
                      <SidebarItem icon={BookOpen} label="世界书" onClick={() => setSidebarView('worldbook')} />
                      <SidebarItem icon={Settings} label="设置" onClick={() => setSidebarView('settings')} />
                      <SidebarItem icon={Zap} label="后台弹窗" onClick={() => setSidebarView('popup')} />
                      <SidebarItem icon={Palette} label="美化" onClick={() => setSidebarView('beauty')} />
                      <SidebarItem icon={CalendarIcon} label="日历" onClick={() => setSidebarView('calendar')} />
                      <SidebarItem icon={BookOpen} label="课表" onClick={() => setSidebarView('schedule')} />
                      <SidebarItem icon={Smile} label="表情包" onClick={() => setSidebarView('stickers')} />
                    </div>
                    <div className="mt-12 pt-8 border-t border-zinc-100 px-2 space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Backup Node</span>
                        <span className="px-2 py-0.5 bg-zinc-100 text-zinc-400 text-[8px] font-bold rounded-md">LOCAL_DISK</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pb-8">
                        <button 
                          onClick={handleExportData}
                          className="flex flex-col items-center justify-center gap-2 p-4 bg-zinc-50 rounded-2xl hover:bg-zinc-100 transition-all group"
                        >
                          <Download size={20} className="text-zinc-400 group-hover:text-zinc-900" />
                          <span className="text-[10px] font-bold text-zinc-400 group-hover:text-zinc-900">备份导出</span>
                        </button>
                        <label className="flex flex-col items-center justify-center gap-2 p-4 bg-zinc-50 rounded-2xl hover:bg-zinc-100 transition-all group cursor-pointer">
                          <UploadCloud size={20} className="text-zinc-400 group-hover:text-zinc-900" />
                          <span className="text-[10px] font-bold text-zinc-400 group-hover:text-zinc-900">数据恢复</span>
                          <input type="file" className="hidden" accept=".json" onChange={handleImportData} />
                        </label>
                      </div>
                      <button 
                        onClick={handleClearCache}
                        className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-all font-bold text-[10px] uppercase tracking-widest mt-4"
                      >
                        <Trash2 size={16} />
                        清除站点缓存 (WIPE)
                      </button>
                    </div>
                  </>
                ) : (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <button 
                      onClick={() => setSidebarView('main')}
                      className="flex items-center gap-2 text-sm text-gray-400 mb-6 hover:text-black"
                    >
                      <X size={14} /> 返回主菜单
                    </button>
                    
                    {/* 子功能界面 */}
                    {sidebarView === 'worldbook' && (
                       <div className="space-y-6 p-2">
                        <div className="flex justify-between items-center px-4">
                          <h3 className="text-xl font-black tracking-tighter uppercase">World Book</h3>
                          <button onClick={() => {
                            const name = prompt('世界书预设名称:');
                             if (name) setWorldBooks([...worldBooks, { id: Date.now().toString(), name, content: '', isActive: false }]);
                          }} className="p-2 bg-zinc-900 text-white rounded-xl"><Plus size={16}/></button>
                        </div>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto px-2">
                          {worldBooks.length === 0 && <p className="text-xs text-zinc-300 text-center py-10">暂无预设，点击右上角添加</p>}
                          {worldBooks.map(wb => (
                            <div key={wb.id} className={`p-4 rounded-3xl border ${wb.isActive ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-100 bg-white'} transition-all`}>
                               <div className="flex justify-between items-center mb-3">
                                 <input 
                                   className="font-bold text-sm bg-transparent border-none p-0 focus:ring-0" 
                                   value={wb.name} 
                                   onChange={(e) => setWorldBooks(worldBooks.map(item => item.id === wb.id ? { ...item, name: e.target.value } : item))}
                                 />
                                 <div className="flex gap-2">
                                   <button 
                                     onClick={() => setWorldBooks(worldBooks.map(item => ({ ...item, isActive: item.id === wb.id ? !item.isActive : false })))}
                                     className={`p-2 rounded-lg ${wb.isActive ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400'}`}
                                   >
                                     <Check size={12}/>
                                   </button>
                                   <button 
                                     onClick={() => {
                                       if(confirm('删除这个世界书预设？')) setWorldBooks(worldBooks.filter(item => item.id !== wb.id));
                                     }}
                                     className="p-2 bg-red-50 text-red-500 rounded-lg"
                                   >
                                     <Trash2 size={12}/>
                                   </button>
                                 </div>
                               </div>
                               <textarea 
                                 className="w-full h-32 bg-white border border-zinc-100 rounded-2xl p-3 text-xs resize-none"
                                 placeholder="填入影响 AI 人设或世界观的内容..."
                                 value={wb.content}
                                 onChange={(e) => setWorldBooks(worldBooks.map(item => item.id === wb.id ? { ...item, content: e.target.value } : item))}
                               />
                            </div>
                          ))}
                        </div>
                       </div>
                    )}

                    {sidebarView === 'popup' && (
                      <div className="space-y-8 p-2">
                        <div className="p-8 bg-zinc-900 rounded-[2.5rem] text-white space-y-6 relative overflow-hidden">
                          <div className="relative z-10">
                            <h3 className="text-xl font-black italic tracking-tighter mb-2">SYSTEM POPUP</h3>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
                              Enable background notifications and simulate system alerts for proactive engagement.
                            </p>
                          </div>
                          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                        </div>

                        <div className="bg-white border border-zinc-100 rounded-[2rem] p-6 space-y-6">
                           <div className="flex items-center justify-between">
                              <div className="flex flex-col">
                                <span className="text-sm font-black uppercase">开启浏览器弹窗</span>
                                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">System Notification</span>
                              </div>
                              <button 
                                onClick={() => {
                                  if (!isPopupEnabled) {
                                    if (window.self !== window.top) {
                                      alert("系统提示：当前应用处于预览模式中，浏览器安全策略限制了真实的通知弹窗（Notification API在跨域iframe中不可用）。\n\n请在右上方点击「Open App」或在新标签页中打开本应用，以获得真实的系统推送权限！");
                                    }
                                    Notification.requestPermission().then(permission => {
                                      if (permission === 'granted') {
                                        setIsPopupEnabled(true);
                                      } else {
                                        alert('请在浏览器设置中允许通知权限。');
                                      }
                                    });
                                  } else {
                                    setIsPopupEnabled(false);
                                  }
                                }}
                                className={`w-14 h-8 rounded-full transition-all flex items-center px-1 ${isPopupEnabled ? 'bg-zinc-900' : 'bg-zinc-200'}`}
                              >
                                <motion.div 
                                  animate={{ x: isPopupEnabled ? 24 : 0 }}
                                  className="w-6 h-6 bg-white rounded-full"
                                />
                              </button>
                           </div>

                           <div className="p-4 bg-zinc-50 rounded-2xl space-y-3">
                             <p className="text-[10px] text-zinc-400 font-bold uppercase">Actions</p>
                             <button 
                               onClick={() => {
                                 if (isPopupEnabled && Notification.permission === 'granted') {
                                   new Notification('通知测试', {
                                     body: '你好！这是来自浏览器的真实通知弹窗。',
                                     icon: userProfile.avatar || 'https://via.placeholder.com/100'
                                   });
                                 } else {
                                   if (window.self !== window.top) {
                                     alert("要在预览模式下看到真实的浏览器通知，请点击右上角「在新标签页中打开」！");
                                   } else {
                                     alert('请先开启开关并授予权限。');
                                   }
                                 }
                               }}
                               className="w-full py-4 bg-white border border-zinc-200 rounded-2xl flex items-center justify-center gap-3 transition-colors active:scale-95"
                             >
                                <Bell size={18} className="text-zinc-400" />
                                <span className="text-xs font-black uppercase tracking-widest text-zinc-600">测试真实弹窗</span>
                             </button>
                           </div>
                        </div>

                        <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100">
                          <p className="text-[10px] text-amber-700 font-bold leading-relaxed">
                            注意: 如果是在浏览器环境，请确保已授予通知权限。当前为模拟环境，将以应用内浮窗或系统弹窗形式呈现。
                          </p>
                        </div>
                      </div>
                    )}
                    {sidebarView === 'settings' && (
                      <div className="space-y-6 p-2">
                        <h3 className="font-black text-xs tracking-widest uppercase">API Endpoint Node</h3>
                        <div className="space-y-4">
                          <label className="block">
                            <span className="text-[10px] font-bold text-zinc-300 uppercase pl-1">配置名称 (Preset Name)</span>
                            <div className="flex gap-2 mt-1">
                              <input 
                                className="flex-1 bg-zinc-50 border-none rounded-xl p-4 text-xs" 
                                placeholder="未命名配置"
                                id="api-preset-name"
                              />
                              <button 
                                onClick={() => {
                                  const el = document.getElementById('api-preset-name') as HTMLInputElement;
                                  const name = el.value || '未命名配置';
                                  setApiPresets(prev => [...prev, { id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`, name, config: { ...apiSettings } }]);
                                  el.value = '';
                                  alert('配置已保存');
                                }}
                                className="bg-zinc-900 text-white px-4 rounded-xl text-[10px] font-black uppercase tracking-widest"
                              >
                                Save
                              </button>
                            </div>
                          </label>

                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {apiPresets.map(p => (
                              <div key={p.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition-all group">
                                <div className="flex-1 cursor-pointer" onClick={() => setApiSettings(p.config)}>
                                  <span className="text-xs font-bold text-zinc-700">{p.name}</span>
                                  <div className="text-[8px] text-zinc-300 truncate w-32">{p.config.baseUrl}</div>
                                </div>
                                <button onClick={() => setApiPresets(apiPresets.filter(i => i.id !== p.id))} className="text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1">
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            ))}
                          </div>

                          <div className="border-t border-zinc-100 pt-4" />

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
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-zinc-300 uppercase pl-1">模型部署 (Model Select)</span>
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <select 
                                  className="w-full bg-zinc-50 border-none rounded-xl p-4 text-xs appearance-none"
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
                                className="bg-zinc-900 text-white p-4 rounded-xl active:scale-90 transition-all flex items-center justify-center shrink-0"
                              >
                                <Orbit size={18} className={isFetchingModels ? 'animate-spin' : ''} />
                              </button>
                            </div>
                            <button 
                              onClick={() => {
                                const name = prompt('为当前选中的模型和地址保存一个新的配置名称:', `配置-${apiSettings.model}`);
                                if (name) {
                                  setApiPresets(prev => [...prev, { id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`, name, config: { ...apiSettings } }]);
                                  alert(`已保存配置: ${name}`);
                                }
                              }}
                              className="w-full mt-2 py-3 bg-zinc-50 text-zinc-400 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:text-zinc-900 transition-all active:scale-95 border border-dashed border-zinc-200"
                            >
                              + 保存为新预设 (Save as Preset)
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {sidebarView === 'beauty' && (
                      <div className="space-y-4 p-2">
                        <h3 className="font-bold flex items-center gap-2 tracking-widest text-xs uppercase"><Palette size={18}/> Beauty Laboratory</h3>
                        <textarea 
                          className="w-full h-48 bg-zinc-50 border-none rounded-2xl p-4 text-xs font-mono focus:ring-1 focus:ring-zinc-900"
                          placeholder="/* 注入全局 CSS 样式 */"
                          value={customStyle}
                          onChange={(e) => setCustomStyle(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button 
                            className="flex-1 text-[10px] p-4 bg-zinc-900 text-white rounded-xl font-black uppercase tracking-widest active:scale-95 transition-all"
                            onClick={() => {
                              const name = prompt('为当前预设命名:');
                              if (name) {
                                setBeautyPresets(prev => [...prev, { id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`, name, css: customStyle }]);
                              }
                            }}
                          >
                            Save Preset
                          </button>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                           {beautyPresets.map(p => (
                             <div key={p.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition-colors group">
                               <div 
                                 className="flex-1 cursor-pointer"
                                 onClick={() => setCustomStyle(p.css)}
                               >
                                 <span className="text-xs font-bold text-zinc-700">{p.name}</span>
                               </div>
                               {p.id !== 'default' && (
                                 <button onClick={() => setBeautyPresets(beautyPresets.filter(i => i.id !== p.id))} className="text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                   <Trash2 size={12} />
                                 </button>
                               )}
                             </div>
                           ))}
                        </div>
                      </div>
                    )}

                {sidebarView === 'calendar' && (
                  <div className="space-y-6 pb-20">
                    <div className="flex justify-between items-center px-2">
                      <h3 className="font-black text-xs tracking-widest uppercase">Temporal Grid</h3>
                      <div className="flex gap-2 items-center">
                        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="p-1 hover:bg-zinc-100 rounded-lg"><ChevronRight size={14} className="rotate-180 text-zinc-300" /></button>
                        <span className="text-[10px] font-black">{currentDate.getFullYear()} {currentDate.getMonth() + 1}M</span>
                        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="p-1 hover:bg-zinc-100 rounded-lg"><ChevronRight size={14} className="text-zinc-300" /></button>
                      </div>
                    </div>

                    {/* 经典月历视图 */}
                    <div className="bg-zinc-50 rounded-3xl p-4 border border-zinc-100">
                      <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                          <div key={d} className="text-[8px] font-bold text-zinc-300">{d}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {(() => {
                          const year = currentDate.getFullYear();
                          const month = currentDate.getMonth();
                          const firstDay = new Date(year, month, 1).getDay();
                          const daysInMonth = new Date(year, month + 1, 0).getDate();
                          const cells = [];
                          for (let i = 0; i < firstDay; i++) cells.push(<div key={`empty-${i}`} />);
                          for (let d = 1; d <= daysInMonth; d++) {
                            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                            const dayTodos = todos.filter(t => t.date === dateStr);
                            cells.push(
                              <div 
                                key={d} 
                                onClick={() => {
                                  const text = prompt(`${dateStr} 的新待办:`);
                                  if (text) setTodos(prev => [...prev, { id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`, text, completed: false, color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)], date: dateStr }]);
                                }}
                                className={`aspect-square flex flex-col items-center justify-center text-[10px] rounded-xl transition-all cursor-pointer relative group ${new Date().toDateString() === new Date(year, month, d).toDateString() ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-200'}`}
                              >
                                <span className="z-1">{d}</span>
                                {dayTodos.length > 0 && (
                                  <div className="flex gap-0.5 mt-0.5">
                                    {dayTodos.slice(0, 3).map(t => <div key={t.id} className="w-1 h-1 rounded-full" style={{ backgroundColor: t.color }} />)}
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return cells;
                        })()}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest px-2">Current Plans</p>
                      {todos.length === 0 && <div className="text-center py-10 text-zinc-200 text-xs italic">No agendas created...</div>}
                      {todos.map(t => (
                        <div key={t.id} className="flex items-center gap-3 p-4 bg-zinc-50 rounded-[2rem] border border-zinc-100 group">
                          <button 
                            onClick={() => setTodos(todos.map(i => i.id === t.id ? {...i, completed: !i.completed} : i))}
                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${t.completed ? 'bg-zinc-900 border-zinc-900' : 'border-zinc-200'}`}
                            style={{ backgroundColor: t.completed ? t.color : 'transparent' }}
                          >
                            {t.completed && <Check size={14} className="text-white" />}
                          </button>
                          <div className="flex flex-col">
                            <span className={`text-xs font-bold ${t.completed ? 'text-zinc-300 line-through' : 'text-zinc-800'}`}>{t.text}</span>
                            {t.date && <span className="text-[8px] font-mono text-zinc-300">{t.date}</span>}
                          </div>
                          <button onClick={() => setTodos(todos.filter(i => i.id !== t.id))} className="ml-auto opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-red-500 transition-all">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-2 p-4 bg-zinc-50 rounded-3xl">
                      {todoColors.map((c, idx) => (
                        <div key={idx} className="aspect-square rounded-full cursor-pointer hover:scale-125 transition-all border-2 border-white" style={{ backgroundColor: c }} onClick={() => {
                          const hex = prompt('自定义颜色 (HEX):', c);
                          if (hex && hex.startsWith('#')) {
                            setTodoColors(prev => prev.map((old, i) => i === idx ? hex : old));
                          }
                        }} />
                      ))}
                      <button 
                        onClick={() => {
                           const hex = prompt('添加新颜色 (HEX):', '#000000');
                           if (hex && hex.startsWith('#')) setTodoColors([...todoColors, hex]);
                        }}
                        className="aspect-square rounded-full border-2 border-dashed border-zinc-200 flex items-center justify-center text-zinc-300 hover:border-zinc-400 hover:text-zinc-500 transition-all"
                      >
                        <Plus size={12} />
                      </button>
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
                                      const newC = { id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`, name, day, period, color: color || '#18181b', room: room || '' };
                                      setCourses(prev => [...prev.filter(c => !(c.day === day && c.period === period)), newC]);
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

                    {sidebarView === 'stickers' && (
                      <div className="space-y-6 p-2 pb-20">
                        <div className="flex justify-between items-center">
                          <h3 className="font-black text-xs tracking-widest uppercase">Sticker Hub</h3>
                          <button onClick={handleImportStickers} className="p-2 bg-zinc-900 text-white rounded-xl active:scale-90 transition-all">
                             <PlusCircle size={16} />
                          </button>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                           {stickers.map(s => (
                             <div key={s.id} className="aspect-square bg-zinc-50 rounded-xl overflow-hidden border border-zinc-100 flex items-center justify-center relative group">
                               <img src={s.url} className="w-[80%] h-[80%] object-contain" alt={s.name} />
                               <button onClick={() => setStickers(stickers.filter(i => i.id !== s.id))} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white">
                                 <X size={16} />
                               </button>
                             </div>
                           ))}
                        </div>
                        <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                          <p className="text-[10px] font-bold text-zinc-300 uppercase leading-relaxed">
                            💡 提示：点击右上角 "+" 导入格式为 "描述:链接" 的表情包。
                          </p>
                        </div>
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

function ChatSettingsModal({ char, settings, setChatSettings, isOpen, onClose, ImageUploader, setCharacters }: any) {
  const [localSettings, setLocalSettings] = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>(['char', 'aesthetics']);

  useEffect(() => {
    if (isOpen) {
      const currentSettings = settings[char.id] || {};
      setLocalSettings({
        avatarSize: 36,
        bubblePadding: 16,
        bubbleWidth: 75,
        fontSize: 14,
        ...currentSettings,
        prompt: char.notes // 将 Character 的 notes 同步到 prompt 以便编辑
      });
    }
  }, [isOpen, char, settings]);

  if (!isOpen || !char || !localSettings) return null;

  const handleSave = () => {
    try {
      // 保存聊天窗口美化设定
      setChatSettings((prev: any) => ({ ...prev, [char.id]: localSettings }));
      
      // 同步更新 Character 列表中的 avatar 和 notes (角色设定)
      setCharacters((prev: Character[]) => prev.map(c => 
        c.id === char.id 
          ? { ...c, avatar: localSettings.charAvatar || c.avatar, notes: localSettings.prompt || c.notes } 
          : c
      ));
      
      onClose();
    } catch (e) {
      alert('保存失败：存储空间不足。');
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="absolute inset-0 bg-white z-[100] flex flex-col pt-12">
      <div className="flex justify-between items-center px-8 mb-6">
        <h3 className="text-xl font-black tracking-tighter uppercase">Settings</h3>
        <button onClick={onClose} className="p-2 bg-zinc-50 rounded-full text-zinc-400"><X size={20}/></button>
      </div>
      
      <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-24 custom-scrollbar">
        {/* 角色设置 */}
        <div className="border border-zinc-100 rounded-[2rem] overflow-hidden bg-white">
          <button 
            onClick={() => toggleSection('char')}
            className="w-full px-6 py-5 flex items-center justify-between hover:bg-zinc-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <User size={18} className="text-zinc-400" />
              <span className="text-sm font-black uppercase tracking-wider">角色设置</span>
            </div>
            {expandedSections.includes('char') ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          
          {expandedSections.includes('char') && (
            <div className="px-6 pb-6 space-y-6 pt-2 animate-in slide-in-from-top-4">
              <div className="space-y-2">
                <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest pl-1">联系人昵称</span>
                <input 
                  placeholder="修改备注简称" 
                  value={localSettings.nickname || ''} 
                  onChange={e => setLocalSettings({...localSettings, nickname: e.target.value})} 
                  className="w-full bg-zinc-50 border-none rounded-2xl p-4 text-xs font-bold focus:ring-1 focus:ring-zinc-900" 
                />
              </div>
              <ImageUploader label="节点图标 (Char Avatar)" onUpload={(u:any) => setLocalSettings({...localSettings, charAvatar: u})} />
              <ImageUploader label="我的专属头像 (Local User Avatar)" onUpload={(u:any) => setLocalSettings({...localSettings, userAvatar: u})} />
              
              <div className="space-y-2">
                <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest pl-1">角色设定 (Prompt)</span>
                <textarea 
                  placeholder="在此输入角色的性格、语言风格、背景故事等设定。示例：你是一个傲娇的猫娘，说话喜欢带'喵'..." 
                  value={localSettings.prompt || ''} 
                  onChange={e => setLocalSettings({...localSettings, prompt: e.target.value})} 
                  className="w-full h-32 bg-zinc-50 rounded-2xl p-4 text-xs font-medium border-none focus:ring-1 focus:ring-zinc-900 leading-relaxed" 
                />
              </div>
            </div>
          )}
        </div>

        {/* 聊天功能 */}
        <div className="border border-zinc-100 rounded-[2rem] overflow-hidden bg-white">
          <button 
            onClick={() => toggleSection('functions')}
            className="w-full px-6 py-5 flex items-center justify-between hover:bg-zinc-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Zap size={18} className="text-zinc-400" />
              <span className="text-sm font-black uppercase tracking-wider">聊天功能</span>
            </div>
            {expandedSections.includes('functions') ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          
          {expandedSections.includes('functions') && (
            <div className="px-6 pb-6 space-y-8 pt-2 animate-in slide-in-from-top-4">
              <div className="space-y-4">
                <span className="text-[10px] font-black text-zinc-800 uppercase tracking-widest pl-1">角色单次回复对话条数</span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] text-zinc-400 font-bold ml-1">最少 (Min)</span>
                    <input 
                      type="number" 
                      value={localSettings.minResponses || 1} 
                      onChange={e => setLocalSettings({...localSettings, minResponses: parseInt(e.target.value) || 1})}
                      className="w-full bg-zinc-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 focus:ring-zinc-900" 
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-zinc-400 font-bold ml-1">最多 (Max)</span>
                    <input 
                      type="number" 
                      value={localSettings.maxResponses || 1} 
                      onChange={e => setLocalSettings({...localSettings, maxResponses: parseInt(e.target.value) || 1})}
                      className="w-full bg-zinc-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 focus:ring-zinc-900" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t border-zinc-50 pt-4">
                <div className="flex items-center justify-between px-1 mb-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-zinc-800 uppercase tracking-widest flex items-center gap-1"><Brain size={12}/>记忆模块 (Memory)</span>
                    <p className="text-[9px] text-zinc-400 mt-1">设为留空或0则关闭自动总结</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-zinc-400">每发生</span>
                  <input 
                    type="number" 
                    placeholder="不限"
                    value={localSettings.summaryInterval || ''} 
                    onChange={e => setLocalSettings({...localSettings, summaryInterval: e.target.value ? parseInt(e.target.value) : ''})}
                    className="flex-1 bg-zinc-50 border-none rounded-xl p-2 text-xs font-bold text-center focus:ring-1 focus:ring-zinc-900" 
                  />
                  <span className="text-[10px] font-bold text-zinc-400">条消息总结一次并保存为角色记忆</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 窗口美化 */}
        <div className="border border-zinc-100 rounded-[2rem] overflow-hidden bg-white">
          <button 
            onClick={() => toggleSection('aesthetics')}
            className="w-full px-6 py-5 flex items-center justify-between hover:bg-zinc-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Palette size={18} className="text-zinc-400" />
              <span className="text-sm font-black uppercase tracking-wider">窗口美化</span>
            </div>
            {expandedSections.includes('aesthetics') ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          
          {expandedSections.includes('aesthetics') && (
            <div className="px-6 pb-6 space-y-8 pt-2 animate-in slide-in-from-top-4">
              <ImageUploader label="聊天背景 (Background)" onUpload={(u:any) => setLocalSettings({...localSettings, background: u})} />
              
              <div className="grid grid-cols-2 gap-6">
                <SettingSlider label="头像大小" value={localSettings.avatarSize || 36} min={24} max={64} onChange={(v:any) => setLocalSettings({...localSettings, avatarSize: v})} />
                <SettingSlider label="气泡间距" value={localSettings.bubblePadding || 16} min={8} max={32} onChange={(v:any) => setLocalSettings({...localSettings, bubblePadding: v})} />
                <SettingSlider label="气泡宽度" value={localSettings.bubbleWidth || 75} min={40} max={95} onChange={(v:any) => setLocalSettings({...localSettings, bubbleWidth: v})} />
                <SettingSlider label="字体大小" value={localSettings.fontSize || 14} min={10} max={22} onChange={(v:any) => setLocalSettings({...localSettings, fontSize: v})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-zinc-300 uppercase pl-1">我方气泡</span>
                  <input type="color" value={localSettings.userBubbleColor || '#18181b'} onChange={e => setLocalSettings({...localSettings, userBubbleColor: e.target.value})} className="w-full h-10 rounded-xl cursor-pointer bg-zinc-50 p-1" />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-zinc-300 uppercase pl-1">对方气泡</span>
                  <input type="color" value={localSettings.charBubbleColor || '#ffffff'} onChange={e => setLocalSettings({...localSettings, charBubbleColor: e.target.value})} className="w-full h-10 rounded-xl cursor-pointer bg-zinc-50 p-1" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-black text-zinc-800 uppercase tracking-widest">角色主动消息 (间隔/min)</span>
                  <input 
                    type="number" 
                    value={localSettings.proactiveInterval || 0} 
                    onChange={e => setLocalSettings({...localSettings, proactiveInterval: parseInt(e.target.value) || 0})}
                    className="w-20 bg-zinc-50 border-none rounded-xl p-2 text-xs font-mono font-bold text-right focus:ring-1 focus:ring-zinc-900" 
                  />
                </div>
                <p className="text-[9px] text-zinc-300 italic px-1">设置为 0 则关闭主动消息功能</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-black text-zinc-800 uppercase tracking-widest">后台消息 (间隔/min)</span>
                  <input 
                    type="number" 
                    value={localSettings.backgroundInterval || 0} 
                    onChange={e => setLocalSettings({...localSettings, backgroundInterval: parseInt(e.target.value) || 0})}
                    className="w-20 bg-zinc-50 border-none rounded-xl p-2 text-xs font-mono font-bold text-right focus:ring-1 focus:ring-zinc-900" 
                  />
                </div>
                <p className="text-[9px] text-zinc-300 italic px-1">界面在后台时模拟角色发送的消息间隔</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-8 border-t border-zinc-50 bg-white sticky bottom-0">
        <button 
          onClick={handleSave}
          className="w-full bg-zinc-900 text-white font-black uppercase tracking-widest py-5 rounded-[2rem] active:scale-95 transition-all"
        >
          Save Configurations
        </button>
      </div>
    </motion.div>
  );
}

function SettingSlider({ label, value, min, max, onChange }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-[10px] font-bold text-zinc-300 uppercase px-1">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={e => onChange(parseInt(e.target.value))} className="w-full h-1 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-zinc-900" />
    </div>
  );
}

function AddCharacterModal({ isOpen, onClose, onSave, ImageUploader }: any) {
  const [formData, setFormData] = useState({
    name: '',
    avatar: '',
    gender: '保密',
    birthday: '',
    notes: ''
  });

  if (!isOpen) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={onClose} />
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white w-full max-w-md rounded-[3rem] relative overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-8 border-b border-gray-100 flex justify-between items-center shrink-0">
          <h3 className="text-xl font-black tracking-tighter uppercase">Initialize Entity</h3>
          <button onClick={onClose} className="p-2 bg-zinc-50 rounded-full text-zinc-400"><X size={20}/></button>
        </div>
        
        <div className="p-8 overflow-y-auto space-y-6">
          <ImageUploader label="角色头像" onUpload={(u:any) => setFormData({...formData, avatar: u})} />
          
          <div className="space-y-4">
            <label className="block">
              <span className="text-[10px] font-bold text-zinc-300 uppercase pl-1">真名 / 代号</span>
              <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-zinc-50 border-none rounded-2xl p-4 text-sm mt-1 focus:ring-1 focus:ring-zinc-900" />
            </label>
            
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="text-[10px] font-bold text-zinc-300 uppercase pl-1">性别</span>
                <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full bg-zinc-50 border-none rounded-2xl p-4 text-sm mt-1 appearance-none">
                  <option>男</option>
                  <option>女</option>
                  <option>保密</option>
                  <option>非二元</option>
                </select>
              </label>
              <label className="block">
                <span className="text-[10px] font-bold text-zinc-300 uppercase pl-1">生日</span>
                <input type="date" value={formData.birthday} onChange={e => setFormData({...formData, birthday: e.target.value})} className="w-full bg-zinc-50 border-none rounded-2xl p-4 text-sm mt-1" />
              </label>
            </div>
 
            <label className="block">
              <span className="text-[10px] font-bold text-zinc-300 uppercase pl-1">角色设定 (Notes/Prompt)</span>
              <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-zinc-50 border-none rounded-2xl p-4 text-sm mt-1 h-28" placeholder="在此输入角色的性格、语言风格、背景故事等设定..." />
            </label>
          </div>
        </div>

        <div className="p-8 border-t border-gray-100 shrink-0">
          <button 
            onClick={() => onSave({ ...formData, id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}` })}
            disabled={!formData.name}
            className="w-full bg-zinc-900 text-white font-black uppercase tracking-widest py-5 rounded-3xl active:scale-95 transition-all disabled:opacity-50"
          >
            Create Entity
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
function VoiceBubble({ role, duration, style, glassClass, transcribedText, avatar }: any) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showTranscription, setShowTranscription] = useState(false);
  
  return (
    <div className={`flex items-start gap-2 ${role === 'user' ? 'flex-row-reverse' : 'flex-row'} max-w-[85%]`}>
      {avatar}
      <div className={`flex flex-col gap-1 ${role === 'user' ? 'items-end' : 'items-start'} max-w-full`}>
        <div 
          onClick={() => {
            setIsAnimating(true);
            setShowTranscription(!showTranscription);
            setTimeout(() => setIsAnimating(false), 2000);
          }}
          className={`relative cursor-pointer min-w-[120px] p-4 flex items-center gap-3 active:scale-95 transition-all ${role === 'user' ? (style.backgroundColor ? '' : 'bg-zinc-900 text-white') : (style.backgroundColor ? '' : 'bg-white text-zinc-800 border border-gray-100')} rounded-3xl ${role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'} ${glassClass}`}
          style={style}
        >
          <Mic size={16} className={isAnimating ? 'animate-pulse' : ''} />
          <div className="flex gap-0.5 items-end h-4 flex-1">
            {[...Array(12)].map((_, i) => (
              <motion.div 
                key={i}
                animate={{ height: isAnimating ? [4, Math.random() * 16 + 4, 4] : (Math.random() * 8 + 4) }}
                transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.05 }}
                className={`w-1 rounded-full ${role === 'user' ? 'bg-white/40' : 'bg-zinc-200'}`}
              />
            ))}
          </div>
          <span className="text-[10px] font-bold font-mono opacity-60">{duration}"</span>
        </div>
        <AnimatePresence>
          {showTranscription && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`text-[10px] p-2 rounded-xl bg-white/50 border border-zinc-100 text-zinc-400 italic mt-1 max-w-full break-words`}
            >
              {transcribedText}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TransferModal({ isOpen, onClose, onConfirm, state, setState }: any) {
  if (!isOpen) return null;
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
    >
      <div className="absolute inset-0" onClick={onClose} />
      <motion.div 
        initial={{ scale: 0.9, y: 20 }} 
        animate={{ scale: 1, y: 0 }} 
        className="bg-white w-full max-w-sm rounded-[2.5rem] relative p-8 space-y-6"
      >
        <h3 className="text-lg font-black tracking-tighter uppercase text-center">Initiate Transfer</h3>
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-300 uppercase pl-1">转账金额 (Amount)</span>
            <input 
              type="number" 
              placeholder="0.00" 
              value={state.amount}
              onChange={e => setState({ ...state, amount: e.target.value })}
              className="w-full bg-zinc-50 border-none rounded-2xl p-5 text-2xl font-black focus:ring-1 focus:ring-zinc-900"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-300 uppercase pl-1">备注 (Remark)</span>
            <input 
              type="text" 
              placeholder="输入转账备注..." 
              value={state.remark}
              onChange={e => setState({ ...state, remark: e.target.value })}
              className="w-full bg-zinc-50 border-none rounded-2xl p-4 text-sm focus:ring-1 focus:ring-zinc-900"
            />
          </div>
        </div>
        <button 
          onClick={() => onConfirm(state.amount, state.remark)}
          disabled={!state.amount}
          className="w-full bg-zinc-900 text-white font-black uppercase tracking-widest py-5 rounded-2xl active:scale-95 transition-all disabled:opacity-50"
        >
          Confirm Transfer
        </button>
      </motion.div>
    </motion.div>
  );
}

function TransferCard({ role, amount, remark, style, glassClass }: any) {
  return (
    <div 
      className={`min-w-[180px] rounded-2xl overflow-hidden flex flex-col ${role === 'user' ? 'bg-orange-500' : 'bg-orange-400'} text-white transition-all active:scale-[0.98] ${glassClass}`}
      style={{ ...style, backgroundColor: undefined, padding: 0 }}
    >
      <div className="p-4 flex items-center gap-3 border-b border-white/10">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
          <CreditCard size={16} />
        </div>
        <div className="flex flex-col">
          <span className="text-[14px] font-black leading-none">¥ {amount}</span>
          <span className="text-[8px] opacity-70 uppercase tracking-widest mt-1">Chat Transfer</span>
        </div>
      </div>
      <div className="px-4 py-2 bg-black/5 flex items-center justify-between">
        <span className="text-[10px] truncate max-w-[120px] opacity-90">{remark || '给你的小红包'}</span>
        <Check size={10} className="opacity-40" />
      </div>
    </div>
  );
}

function PostCard({ post, userProfile, characters, onLike, onComment, onForward, onClick, onLongPress }: any) {
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  
  // 处理长按逻辑
  const timerRef = React.useRef<any>(null);
  const handleTouchStart = () => {
    timerRef.current = setTimeout(onLongPress, 800);
  };
  const handleTouchEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  return (
    <div 
      className="py-10 group animate-in fade-in slide-in-from-bottom-4 duration-500"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-2xl ${post.type === 'ai' ? 'bg-indigo-500' : 'bg-zinc-900'} flex-shrink-0 flex items-center justify-center text-white text-xs font-bold overflow-hidden`}>
          {post.type === 'ai' ? (
            (characters[0]?.avatar ? <img src={characters[0].avatar} className="w-full h-full object-cover" /> : 'AI')
          ) : (
            (userProfile.avatar ? <img src={userProfile.avatar} className="w-full h-full object-cover" /> : 'ME')
          )}
        </div>
        <div className="flex-1 space-y-4">
          <div className="flex justify-between items-baseline" onClick={onClick}>
            <span className="text-sm font-black text-zinc-900">
              {post.type === 'ai' ? (characters[0]?.name || '智能助手') : userProfile.name}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono italic">{post.date}</span>
          </div>
          
          <div onClick={onClick}>
            <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap">{post.content}</p>
          </div>
          
          {post.image && (
            <div onClick={onClick} className="rounded-3xl overflow-hidden border border-zinc-50 relative group">
              {post.isTextImage ? (
                <div className="w-full h-48 bg-zinc-900 flex items-center justify-center p-8 text-center bg-gradient-to-br from-zinc-800 to-black">
                  <span className="text-white font-black text-lg tracking-tighter opacity-80 leading-tight">
                    {post.image}
                  </span>
                  <div className="absolute top-4 right-4 opacity-20"><Quote size={32} className="text-white" /></div>
                </div>
              ) : (
                <img src={post.image} className="w-full max-h-96 object-cover" />
              )}
            </div>
          )}

          <div className="flex items-center gap-6 pt-2">
            <button 
              onClick={onLike}
              className={`flex items-center gap-1.5 transition-all active:scale-90 ${post.isLiked ? 'text-red-500' : 'text-zinc-300 hover:text-zinc-500'}`}
            >
              <Heart size={16} fill={post.isLiked ? 'currentColor' : 'none'} />
              <span className="text-[10px] font-black">{post.likes || ''}</span>
            </button>
            <button 
              onClick={() => {
                if (onClick) onClick();
                else setShowComments(!showComments);
              }}
              className="flex items-center gap-1.5 text-zinc-300 hover:text-zinc-500 transition-all active:scale-90"
            >
              <MessageCircle size={16} />
              <span className="text-[10px] font-black">{post.comments?.length || ''}</span>
            </button>
            <button 
              onClick={onForward}
              className="flex items-center gap-1.5 text-zinc-300 hover:text-zinc-500 transition-all active:scale-90"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PostDetailView({ post, onBack, userProfile, characters, onLikePost, onAddComment, onLikeComment, onCommentLongPress }: any) {
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);

  if (!post) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex flex-col h-full bg-white"
    >
      <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-zinc-50">
        <button onClick={onBack} className="p-2 -ml-2 text-zinc-400 hover:text-zinc-900 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300 pr-8">Discovery Detail</span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-24 custom-scrollbar">
        <PostCard 
          post={post} 
          userProfile={userProfile} 
          characters={characters} 
          onLike={onLikePost}
          onForward={() => alert('详情页转发暂未开放')}
        />

        <div className="mt-4 pb-4 border-b border-zinc-50">
          <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Comments ({(post.comments || []).length})</span>
        </div>

        <div className="space-y-8 mt-8 pb-10 px-0.5">
          {(post.comments || []).map((comment: any) => (
            <div 
              key={comment.id} 
              className={`group animate-in fade-in ${comment.replyTo ? 'ml-8 pl-4 border-l-2 border-zinc-50' : ''}`}
              onContextMenu={(e) => { e.preventDefault(); onCommentLongPress(comment.id, comment.content); }}
              onTouchStart={() => { (window as any).commentTimer = setTimeout(() => onCommentLongPress(comment.id, comment.content), 800); }}
              onTouchEnd={() => { clearTimeout((window as any).commentTimer); }}
            >
              <div className="flex gap-3">
                <div className={`${comment.replyTo ? 'w-8 h-8' : 'w-10 h-10'} rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0 text-[10px] font-black overflow-hidden border border-zinc-50`}>
                  {comment.username === userProfile.name ? (
                    userProfile.avatar ? <img src={userProfile.avatar} className="w-full h-full object-cover" /> : userProfile.name[0]
                  ) : (
                    characters.find((c: any) => c.name === comment.username)?.avatar ? 
                    <img src={characters.find((c: any) => c.name === comment.username)?.avatar} className="w-full h-full object-cover" /> : 
                    comment.username[0]
                  )}
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className={`${comment.replyTo ? 'text-[11px]' : 'text-xs'} font-black text-zinc-900`}>
                      {comment.username}
                      {comment.replyTo && <span className="ml-2 text-zinc-300 font-medium">replied</span>}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-zinc-500 font-mono italic">{comment.time}</span>
                      <button 
                        onClick={() => onLikeComment(comment.id)}
                        className={`flex items-center gap-1 transition-all ${comment.isLiked ? 'text-red-500' : 'text-zinc-300 hover:text-zinc-500'}`}
                      >
                        <Heart size={comment.replyTo ? 10 : 12} fill={comment.isLiked ? 'currentColor' : 'none'} />
                        <span className="text-[9px] font-bold">{comment.likes || ''}</span>
                      </button>
                    </div>
                  </div>
                  
                  <p className={`${comment.replyTo ? 'text-xs' : 'text-sm'} text-zinc-600 leading-relaxed bg-white`}>
                    {comment.content}
                  </p>
                  
                  <div className="pt-1 flex items-center gap-4">
                    <button 
                      onClick={() => {
                        setReplyTo(comment.username);
                        const el = document.getElementById('detail-comment-input');
                        el?.focus();
                      }}
                      className="text-[10px] font-black text-zinc-300 uppercase tracking-widest hover:text-zinc-900 transition-colors"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {(post.comments || []).length === 0 && (
            <div className="text-center py-20 text-[10px] font-black text-zinc-200 uppercase tracking-widest">No discovery reflections yet</div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/90 backdrop-blur-xl border-t border-zinc-50 z-30">

        <div className="flex flex-col gap-2">
          {replyTo && (
            <div className="flex items-center justify-between px-3 py-1 bg-zinc-50 rounded-lg">
              <span className="text-[9px] font-bold text-zinc-400">回复 @{replyTo}</span>
              <button onClick={() => setReplyTo(null)} className="text-zinc-400"><X size={12} /></button>
            </div>
          )}
          <div className="flex gap-2">
            <input 
              id="detail-comment-input"
              className="flex-1 bg-zinc-50 border-none rounded-2xl px-5 py-4 text-xs focus:ring-1 focus:ring-zinc-900 placeholder:text-zinc-200" 
              placeholder="添加独到见解..." 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && commentText.trim()) {
                  onAddComment(commentText, replyTo || undefined);
                  setCommentText('');
                  setReplyTo(null);
                }
              }}
            />
            <button 
              onClick={() => {
                if (commentText.trim()) {
                  onAddComment(commentText, replyTo || undefined);
                  setCommentText('');
                  setReplyTo(null);
                }
              }}
              className="bg-zinc-900 text-white p-4 rounded-2xl active:scale-95 transition-all"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CreatePostModal({ isOpen, onClose, onConfirm }: any) {
  const [content, setContent] = useState('');
  const [image, setImage] = useState('');
  const [useTextImage, setUseTextImage] = useState(false);

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
    >
      <div className="absolute inset-0" onClick={onClose} />
      <motion.div 
        initial={{ scale: 0.9, y: 20 }} 
        animate={{ scale: 1, y: 0 }} 
        className="bg-white w-full max-w-sm rounded-[2.5rem] relative p-8 flex flex-col gap-6"
      >
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-black tracking-tighter uppercase">New Discovery</h3>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <textarea 
          placeholder="分享你的瞬间..." 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-32 bg-zinc-50 border-none rounded-2xl p-4 text-sm focus:ring-1 focus:ring-zinc-900 resize-none"
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <ImageIcon size={14} className="text-zinc-400" />
              <span className="text-[10px] font-bold text-zinc-300 uppercase">
                {useTextImage ? '文字描述 (Text Image)' : '图片展示 (Image URL)'}
              </span>
            </div>
            <button 
              onClick={() => setUseTextImage(!useTextImage)}
              className="text-[9px] font-black text-zinc-400 underline decoration-dashed transition-all hover:text-zinc-900"
            >
              {useTextImage ? '切换 URL' : '切换文字构图'}
            </button>
          </div>
          <input 
            type="text" 
            placeholder={useTextImage ? "输入需要排版的文字内容..." : "粘贴图片链接..."}
            value={image}
            onChange={(e) => setImage(e.target.value)}
            className="w-full bg-zinc-50 border-none rounded-xl p-4 text-xs focus:ring-1 focus:ring-zinc-900" 
          />
        </div>

        <button 
          onClick={() => {
            if (content.trim()) {
              const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              onConfirm(content, image, useTextImage, time);
              setContent('');
              setImage('');
              onClose();
            }
          }}
          className="w-full bg-zinc-900 text-white font-black uppercase tracking-widest py-5 rounded-2xl active:scale-95 transition-all"
        >
          Publish Moment
        </button>
      </motion.div>
    </motion.div>
  );
}

function ForwardModal({ isOpen, onClose, characters, post, onForward }: any) {
  if (!isOpen || !post) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
    >
      <div className="absolute inset-0" onClick={onClose} />
      <motion.div 
        initial={{ scale: 0.9, y: 20 }} 
        animate={{ scale: 1, y: 0 }} 
        className="bg-white w-full max-w-sm rounded-[2.5rem] relative p-8 space-y-6"
      >
        <h3 className="text-lg font-black tracking-tighter uppercase text-center">Forward Discovery</h3>
        <div className="max-h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {characters.map((char: any) => (
            <button 
              key={char.id}
              onClick={() => onForward(char.id)}
              className="w-full flex items-center gap-4 p-4 hover:bg-zinc-50 rounded-2xl transition-all active:scale-95"
            >
              <div className="w-10 h-10 rounded-xl bg-zinc-900 overflow-hidden shrink-0">
                {char.avatar ? <img src={char.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white text-xs">{char.name[0]}</div>}
              </div>
              <span className="text-sm font-black text-zinc-900">{char.name}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// --- 基础组件 ---

function ContextItem({ label, onClick, color = 'text-zinc-900' }: { label: string, onClick: () => void, color?: string }) {
  return (
    <button onClick={onClick} className={`w-full px-4 py-2 text-left text-xs font-bold hover:bg-zinc-200 transition-colors ${color}`}>
      {label}
    </button>
  );
}

function ImageUploader({ onUpload, label }: { onUpload: (url: string) => void, label: string }) {
  const [isUploading, setIsUploading] = useState(false);
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = (ev) => {
        onUpload(ev.target?.result as string);
        setIsUploading(false);
      };
      reader.onerror = () => {
        alert('文件读取失败');
        setIsUploading(false);
      };
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
        <label className="bg-zinc-900 text-white px-4 py-3 rounded-xl cursor-pointer hover:bg-zinc-700 transition-colors flex items-center justify-center min-w-[3rem]">
          {isUploading ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <PlusCircle size={16} />}
          <input type="file" className="hidden" accept="image/*" onChange={handleFile} />
        </label>
      </div>
    </div>
  );
}

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
      <div className="w-12 h-12 bg-white rounded-2xl border border-gray-100 flex items-center justify-center text-zinc-400 group-hover:text-zinc-900 transition-all">
        <Icon size={20} />
      </div>
      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{label}</span>
    </button>
  );
}
