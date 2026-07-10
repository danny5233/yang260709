import React, { useState, useEffect } from 'react';
import { 
  Lock, Unlock, Copy, ExternalLink, Plus, Trash2, Edit, 
  ChevronRight, CheckCircle2, AlertTriangle, TrendingDown, 
  Users, Activity, X
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { 
  getFirestore, collection, doc, setDoc, getDoc, 
  onSnapshot, updateDoc, addDoc, deleteDoc, increment, query, orderBy 
} from 'firebase/firestore';

// --- Firebase Initialization ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Paths
const getPublicCollection = (colName) => collection(db, 'artifacts', appId, 'public', 'data', colName);
const getPublicDoc = (colName, docId) => doc(db, 'artifacts', appId, 'public', 'data', colName, docId);

// --- Default Data for Initialization ---
const defaultStats = {
  boycottCount: 143399,
  currentSubscribers: 2520000,
  baseSubscribers: 2530000,
  unsubCount: 8216
};

const defaultBrands = [
  { category: '健康/保健', name: 'GREENGOLD 保健食品', status: '已停止合作', appealText: '身為消費者，我拒絕購買任何與爭議網紅合作的產品。請貴品牌慎重評估代言人。', link: '#' },
  { category: '健康/保健', name: 'USTINI 我挺你健康鞋', status: '重新評估中', appealText: '希望貴品牌能聽見消費者的聲音，停止與爭議人物合作。', link: '#' },
  { category: '家電/科技', name: 'SwitchBot 智慧家居', status: '合作中', appealText: '請貴品牌正視代言人帶來的負面影響，我將抵制直到更換代言人。', link: '#' }
];

const defaultControversies = [
  { year: '2024', title: '遭爆下令「嘎家軍」出征酸民', desc: '群組截圖流出，內部下令要求在各大平台對批評者反擊，間接承認網軍。', tag: '出征酸民', link: '#', order: 1 },
  { year: '2024', title: '被罵回嗆「都是中共同路人」', desc: '道歉後拍片反擊，稱批評者都是中共同路人，將爭議政治化。', tag: '政治消費', link: '#', order: 2 },
  { year: '2023', title: '日本「超難吃地雷店」炎上', desc: '公開點名批評日本多家連鎖餐廳，遭日本媒體報導，引發跨國爭議。', tag: '失禮行為', link: '#', order: 3 }
];

const defaultPolls = [
  {
    question: '蔡阿嘎公開道歉了⋯你的立場是？',
    totalVotes: 560,
    options: [
      { id: '1', text: '接受道歉，停止抵制行動', votes: 146 },
      { id: '2', text: '持保留態度，觀察後續品牌是否跟進切割', votes: 148 },
      { id: '3', text: '已不是第一次道歉，堅持抵制直到各品牌發表正式聲明切割', votes: 266 }
    ]
  }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  
  // Data States
  const [stats, setStats] = useState(defaultStats);
  const [brands, setBrands] = useState([]);
  const [controversies, setControversies] = useState([]);
  const [polls, setPolls] = useState([]);
  
  // UI States
  const [toastMessage, setToastMessage] = useState('');
  const [hasVotedBoycott, setHasVotedBoycott] = useState(false);
  const [hasVotedUnsub, setHasVotedUnsub] = useState(false);
  const [votedPolls, setVotedPolls] = useState({}); // { pollId: optionId }

  // 1. Auth Init
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth error:", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // 2. Data Fetching & Initialization
  useEffect(() => {
    if (!user) return;

    const initializeIfEmpty = async () => {
      const statsRef = getPublicDoc('campaign_stats', 'main');
      const statsSnap = await getDoc(statsRef);
      
      if (!statsSnap.exists()) {
        await setDoc(statsRef, defaultStats);
        
        defaultBrands.forEach(b => addDoc(getPublicCollection('brands'), b));
        defaultControversies.forEach(c => addDoc(getPublicCollection('controversies'), c));
        defaultPolls.forEach(p => addDoc(getPublicCollection('polls'), p));
      }
    };

    initializeIfEmpty();

    // Listeners
    const unsubStats = onSnapshot(getPublicDoc('campaign_stats', 'main'), 
      (doc) => { if (doc.exists()) setStats(doc.data()); },
      (err) => console.error(err)
    );

    const unsubBrands = onSnapshot(getPublicCollection('brands'), 
      (snap) => {
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBrands(data);
      },
      (err) => console.error(err)
    );

    const unsubControversies = onSnapshot(getPublicCollection('controversies'), 
      (snap) => {
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        data.sort((a, b) => a.order - b.order); // Client side sort based on order
        setControversies(data);
      },
      (err) => console.error(err)
    );

    const unsubPolls = onSnapshot(getPublicCollection('polls'), 
      (snap) => {
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPolls(data);
      },
      (err) => console.error(err)
    );

    // Check local storage for votes (simple prevention)
    setHasVotedBoycott(localStorage.getItem('votedBoycott') === 'true');
    setHasVotedUnsub(localStorage.getItem('votedUnsub') === 'true');
    const savedPolls = JSON.parse(localStorage.getItem('votedPolls') || '{}');
    setVotedPolls(savedPolls);

    return () => {
      unsubStats(); unsubBrands(); unsubControversies(); unsubPolls();
    };
  }, [user]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const copyToClipboard = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      showToast('訴求文字已複製到剪貼簿！');
    } catch (err) {
      showToast('複製失敗，請手動選取複製。');
    }
    document.body.removeChild(textArea);
  };

  // User Actions
  const handleBoycottVote = async () => {
    if (hasVotedBoycott) {
      showToast('您已經表態過了！');
      return;
    }
    await updateDoc(getPublicDoc('campaign_stats', 'main'), {
      boycottCount: increment(1)
    });
    setHasVotedBoycott(true);
    localStorage.setItem('votedBoycott', 'true');
    showToast('表態成功！感謝您的參與。');
  };

  const handleUnsubVote = async () => {
    if (hasVotedUnsub) {
      showToast('您已經記錄過了！');
      return;
    }
    await updateDoc(getPublicDoc('campaign_stats', 'main'), {
      unsubCount: increment(1)
    });
    setHasVotedUnsub(true);
    localStorage.setItem('votedUnsub', 'true');
    showToast('退訂記錄成功！');
  };

  const handlePollVote = async (pollId, optionId) => {
    if (votedPolls[pollId]) {
      showToast('您已經投過此票了！');
      return;
    }

    const pollRef = getPublicDoc('polls', pollId);
    const poll = polls.find(p => p.id === pollId);
    if (!poll) return;

    const newOptions = poll.options.map(opt => {
      if (opt.id === optionId) return { ...opt, votes: opt.votes + 1 };
      return opt;
    });

    await updateDoc(pollRef, {
      options: newOptions,
      totalVotes: increment(1)
    });

    const newVotedPolls = { ...votedPolls, [pollId]: optionId };
    setVotedPolls(newVotedPolls);
    localStorage.setItem('votedPolls', JSON.stringify(newVotedPolls));
    showToast('投票成功！');
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPassword === 'admin') {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setAdminPassword('');
      showToast('已進入管理員模式');
    } else {
      showToast('密碼錯誤！');
    }
  };

  return (
    <div className="min-h-screen bg-[#141414] text-gray-200 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 border border-orange-500 text-orange-400 px-6 py-3 rounded-full shadow-2xl z-50 flex items-center space-x-2 animate-bounce">
          <CheckCircle2 size={20} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Public Content */}
      {!isAdmin ? (
        <main className="pb-20">
          
          {/* Header/Hero Section */}
          <section className="relative pt-24 pb-16 flex flex-col items-center justify-center text-center px-4 border-b border-gray-800 bg-gradient-to-b from-[#1a1410] to-[#141414]">
            <div className="inline-block bg-orange-600 text-white text-xs px-3 py-1 rounded-full mb-6 font-bold tracking-wider">
              消費者表態
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-white tracking-wide leading-tight">
              我抵制與<br />蔡阿嘎合作品牌 ✊
            </h1>
            <p className="text-sm md:text-base text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed">
              本人宣示，作為消費者，我抵制與蔡阿嘎合作的<br className="hidden md:block"/>品牌，以消費行動表達立場。
            </p>
            <p className="text-xs text-gray-500 max-w-3xl mx-auto mb-12 leading-relaxed px-4">
              {brands.map(b => b.name).join('．')}
            </p>

            <div className="text-center mb-8">
              <div className="text-5xl md:text-7xl font-black text-orange-500 mb-2 drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                {stats.boycottCount.toLocaleString()}
              </div>
              <div className="text-gray-400 text-sm">人已表態</div>
            </div>

            <button 
              onClick={handleBoycottVote}
              disabled={hasVotedBoycott}
              className={`px-12 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                hasVotedBoycott 
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-orange-500 hover:bg-orange-400 text-white hover:scale-105 shadow-[0_0_20px_rgba(249,115,22,0.4)]'
              }`}
            >
              {hasVotedBoycott ? '已表態' : '我要表態 ➔'}
            </button>
          </section>

          {/* Controversies Timeline (Horizontal Scroll) */}
          <section className="py-16 px-4 md:px-8 border-b border-gray-800">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center space-x-2 mb-8">
                <span className="text-2xl">📋</span>
                <h2 className="text-2xl font-bold text-white">蔡阿嘎爭議懶人包</h2>
              </div>
              
              <div className="flex overflow-x-auto space-x-6 pb-8 snap-x scrollbar-hide">
                {controversies.map((item, idx) => (
                  <div key={item.id} className="min-w-[300px] max-w-[300px] bg-[#222] p-6 rounded-2xl snap-start border border-gray-700 hover:border-orange-500/50 transition-colors">
                    <div className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">
                      {item.year}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 leading-snug">{item.title}</h3>
                    <p className="text-gray-400 text-sm mb-6 leading-relaxed line-clamp-4">
                      {item.desc}
                    </p>
                    <div className="flex justify-between items-center mt-auto">
                      <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400">{item.tag}</span>
                      {item.link !== '#' && (
                        <a href={item.link} target="_blank" rel="noreferrer" className="text-orange-500 text-sm hover:underline flex items-center">
                          查看來源 <ExternalLink size={14} className="ml-1"/>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Polls Section */}
          <section className="py-16 px-4 border-b border-gray-800 bg-[#111]">
            <div className="max-w-3xl mx-auto">
              {polls.map(poll => (
                <div key={poll.id} className="mb-16 last:mb-0">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2 flex justify-center items-center gap-2">
                      📊 {poll.question}
                    </h2>
                    <p className="text-sm text-gray-500">每人限投一票，共 {poll.totalVotes} 人參與</p>
                    <div className="inline-flex items-center gap-2 text-yellow-500 text-xs mt-4 bg-yellow-500/10 px-3 py-1.5 rounded-lg border border-yellow-500/20">
                      <AlertTriangle size={14} /> 投票後不可更改，請審慎思考後做出選擇。
                    </div>
                  </div>

                  <div className="space-y-4">
                    {poll.options.map((opt, idx) => {
                      const percent = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                      const isVoted = votedPolls[poll.id] === opt.id;
                      
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handlePollVote(poll.id, opt.id)}
                          disabled={!!votedPolls[poll.id]}
                          className={`w-full text-left p-4 rounded-xl border relative overflow-hidden transition-all duration-300 ${
                            isVoted 
                              ? 'border-orange-500 bg-orange-500/10' 
                              : !!votedPolls[poll.id]
                                ? 'border-gray-800 bg-[#1a1a1a] opacity-50'
                                : 'border-gray-700 bg-[#222] hover:border-gray-500'
                          }`}
                        >
                          {/* Progress bar background for results */}
                          {!!votedPolls[poll.id] && (
                            <div 
                              className="absolute left-0 top-0 bottom-0 bg-orange-500/20 z-0 transition-all duration-1000"
                              style={{ width: `${percent}%` }}
                            />
                          )}
                          
                          <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isVoted ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300'}`}>
                                {idx + 1}
                              </span>
                              <span className={`font-medium ${isVoted ? 'text-orange-400' : 'text-gray-300'}`}>{opt.text}</span>
                            </div>
                            {!!votedPolls[poll.id] && (
                              <div className="text-right">
                                <div className="font-bold text-white">{percent}%</div>
                                <div className="text-xs text-gray-500">{opt.votes} 票</div>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Brands List */}
          <section className="py-16 px-4 border-b border-gray-800">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">🎯 合作品牌名單</h2>
                <p className="text-sm text-gray-400 max-w-2xl mx-auto">
                  以下品牌曾與爭議網紅進行廣告合作或代言，有的是進行式有的是過去式，呼籲所有合作品牌審慎評估代言人效應。<br/>
                  點選品牌後複製訴求 ➔ 貼到品牌臉書官方粉絲頁，讓品牌方聽到消費者的聲音！
                </p>
              </div>

              {/* Group brands by category */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(
                  brands.reduce((acc, brand) => {
                    if (!acc[brand.category]) acc[brand.category] = [];
                    acc[brand.category].push(brand);
                    return acc;
                  }, {})
                ).map(([category, catBrands]) => (
                  <div key={category} className="bg-[#1a1a1a] border border-gray-800 rounded-2xl overflow-hidden">
                    <div className="bg-gray-800/50 p-4 border-b border-gray-800 font-bold text-orange-400 flex items-center gap-2">
                      <span className="text-lg">🏷️</span> {category}
                    </div>
                    <div className="p-4 space-y-6">
                      {catBrands.map(brand => (
                        <div key={brand.id} className="border-b border-gray-800 pb-6 last:border-0 last:pb-0">
                          <h4 className="font-bold text-white text-lg mb-2">{brand.name}</h4>
                          <div className="bg-gray-900 rounded-lg p-3 text-sm text-gray-400 mb-3 border border-gray-800 relative">
                            <span className="absolute -top-2 left-3 bg-gray-700 text-xs px-2 py-0.5 rounded-full text-white">
                              {brand.status}
                            </span>
                            <p className="mt-2">{brand.appealText}</p>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => copyToClipboard(brand.appealText)}
                              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-sm py-2 rounded-lg flex justify-center items-center gap-1 transition-colors"
                            >
                              <Copy size={16} /> 複製訴求
                            </button>
                            <a 
                              href={brand.link} target="_blank" rel="noreferrer"
                              className="flex-1 bg-orange-600 hover:bg-orange-500 text-white text-sm py-2 rounded-lg flex justify-center items-center gap-1 transition-colors"
                            >
                              官方粉專 <ExternalLink size={16} />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Unsubscribe Challenge */}
          <section className="py-20 px-4 bg-gradient-to-b from-[#141414] to-[#0a150a] border-t border-green-900/30">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-block bg-orange-600 text-white text-xs px-3 py-1 rounded-full mb-6 font-bold">
                退訂行動
              </div>
              <h2 className="text-4xl font-extrabold text-white mb-2">蔡阿嘎<br/>退訂挑戰 ✊</h2>
              <p className="text-gray-400 mb-12">退訂他的頻道，讓數字說話。</p>

              <div className="bg-[#1a1a1a] border border-gray-800 rounded-3xl p-8 shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 border-b border-gray-800 pb-8">
                  <div>
                    <div className="text-sm text-gray-500 mb-2">🔴 YouTube 現在訂閱數</div>
                    <div className="text-4xl md:text-5xl font-black text-white">{stats.currentSubscribers.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-2">📉 活動以來已減少訂閱數</div>
                    <div className="text-4xl md:text-5xl font-black text-green-500">
                      {(stats.baseSubscribers - stats.currentSubscribers).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="text-sm text-gray-400 mb-2 flex items-center justify-center gap-2">
                    <Activity size={16} className="text-orange-500"/> 已加入退訂挑戰人數
                  </div>
                  <div className="text-5xl font-black text-orange-500 mb-6">{stats.unsubCount.toLocaleString()}</div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-800 rounded-full h-3 mb-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-orange-600 to-orange-400 h-3 rounded-full transition-all duration-1000" 
                      style={{ width: `${Math.min((stats.unsubCount / 10000) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>當前進度</span>
                    <span>目標 10,000 人 ({Math.round((stats.unsubCount / 10000) * 100)}%)</span>
                  </div>
                </div>

                <button 
                  onClick={handleUnsubVote}
                  disabled={hasVotedUnsub}
                  className={`w-full md:w-auto px-16 py-4 rounded-xl font-bold text-xl transition-all duration-300 ${
                    hasVotedUnsub
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-orange-500 hover:bg-orange-400 text-white hover:scale-105 shadow-[0_0_20px_rgba(249,115,22,0.4)]'
                  }`}
                >
                  {hasVotedUnsub ? '✅ 我退訂了！' : '✊ 我退訂了！'}
                </button>
              </div>
            </div>
          </section>

        </main>
      ) : (
        /* Admin Dashboard */
        <AdminDashboard 
          stats={stats} 
          brands={brands} 
          controversies={controversies} 
          polls={polls}
          onLogout={() => setIsAdmin(false)}
          showToast={showToast}
        />
      )}

      {/* Admin Login Modal/Trigger */}
      {!isAdmin && (
        <>
          <button 
            onClick={() => setShowAdminLogin(true)}
            className="fixed bottom-4 right-4 p-3 bg-gray-800 hover:bg-gray-700 rounded-full text-gray-500 hover:text-white transition-colors border border-gray-700 opacity-50 hover:opacity-100"
            title="後台管理"
          >
            <Lock size={16} />
          </button>

          {showAdminLogin && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
              <form onSubmit={handleAdminLogin} className="bg-[#1a1a1a] p-8 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Lock size={20} className="text-orange-500"/> 管理員登入
                  </h3>
                  <button type="button" onClick={() => setShowAdminLogin(false)} className="text-gray-500 hover:text-white">
                    <X size={20} />
                  </button>
                </div>
                <p className="text-sm text-gray-400 mb-6">請輸入管理員密碼進入後台編輯模式 (提示: admin)</p>
                <input 
                  type="password" 
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-[#222] border border-gray-700 rounded-lg p-3 text-white mb-6 focus:border-orange-500 focus:outline-none"
                  autoFocus
                />
                <button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-lg transition-colors">
                  登入
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// --- Admin Dashboard Component ---
function AdminDashboard({ stats, brands, controversies, polls, onLogout, showToast }) {
  const [activeTab, setActiveTab] = useState('stats');

  const handleUpdateStats = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newStats = {
      boycottCount: Number(formData.get('boycottCount')),
      currentSubscribers: Number(formData.get('currentSubscribers')),
      baseSubscribers: Number(formData.get('baseSubscribers')),
      unsubCount: Number(formData.get('unsubCount')),
    };
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'campaign_stats', 'main'), newStats);
      showToast('數據已更新');
    } catch (err) {
      showToast('更新失敗');
    }
  };

  const handleDelete = async (collectionName, id) => {
    if (confirm('確定要刪除這筆資料嗎？')) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', collectionName, id));
      showToast('已刪除');
    }
  };

  const handleAddBrand = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newBrand = {
      category: formData.get('category'),
      name: formData.get('name'),
      status: formData.get('status'),
      appealText: formData.get('appealText'),
      link: formData.get('link') || '#'
    };
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'brands'), newBrand);
    e.target.reset();
    showToast('品牌已新增');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200">
      {/* Admin Header */}
      <header className="bg-[#1a1a1a] border-b border-gray-800 px-6 py-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="bg-orange-600 p-2 rounded-lg">
            <Unlock size={20} className="text-white"/>
          </div>
          <h1 className="text-xl font-bold text-white">後台管理中心</h1>
        </div>
        <button onClick={onLogout} className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          登出
        </button>
      </header>

      <div className="flex">
        {/* Admin Sidebar */}
        <aside className="w-64 bg-[#111] min-h-[calc(100vh-73px)] border-r border-gray-800 p-4">
          <nav className="space-y-2">
            {[
              { id: 'stats', label: '總體數據設定', icon: Activity },
              { id: 'brands', label: '合作品牌管理', icon: Users },
              { id: 'controversies', label: '爭議懶人包管理', icon: AlertTriangle },
              { id: 'polls', label: '投票調查管理', icon: TrendingDown },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                  activeTab === tab.id ? 'bg-orange-600 text-white font-bold' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Admin Content Area */}
        <main className="flex-1 p-8">
          
          {activeTab === 'stats' && (
            <div className="max-w-2xl bg-[#1a1a1a] border border-gray-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">修改總體數據</h2>
              <form onSubmit={handleUpdateStats} className="space-y-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">總表態人數 (首頁大字)</label>
                  <input name="boycottCount" type="number" defaultValue={stats.boycottCount} className="w-full bg-[#222] border border-gray-700 rounded-lg p-3 text-white" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">活動開始前訂閱數</label>
                    <input name="baseSubscribers" type="number" defaultValue={stats.baseSubscribers} className="w-full bg-[#222] border border-gray-700 rounded-lg p-3 text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">當前即時訂閱數</label>
                    <input name="currentSubscribers" type="number" defaultValue={stats.currentSubscribers} className="w-full bg-[#222] border border-gray-700 rounded-lg p-3 text-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">已參與退訂挑戰人數</label>
                  <input name="unsubCount" type="number" defaultValue={stats.unsubCount} className="w-full bg-[#222] border border-gray-700 rounded-lg p-3 text-white" />
                </div>
                <button type="submit" className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 px-6 rounded-lg">
                  儲存修改
                </button>
              </form>
            </div>
          )}

          {activeTab === 'brands' && (
            <div>
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-6 mb-8">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Plus size={20}/> 新增合作品牌</h3>
                <form onSubmit={handleAddBrand} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input name="name" placeholder="品牌名稱" required className="bg-[#222] border border-gray-700 rounded-lg p-3 text-white" />
                  <select name="category" required className="bg-[#222] border border-gray-700 rounded-lg p-3 text-white">
                    <option value="">選擇分類...</option>
                    <option value="健康/保健">健康/保健</option>
                    <option value="家電/科技">家電/科技</option>
                    <option value="食品/生活">食品/生活</option>
                    <option value="保養/美妝">保養/美妝</option>
                    <option value="其他">其他</option>
                  </select>
                  <input name="status" placeholder="目前狀態 (例: 已停止合作)" required className="bg-[#222] border border-gray-700 rounded-lg p-3 text-white" />
                  <input name="link" placeholder="官方粉專網址 (選填)" className="bg-[#222] border border-gray-700 rounded-lg p-3 text-white" />
                  <textarea name="appealText" placeholder="預設複製的訴求文字" required rows="3" className="md:col-span-2 bg-[#222] border border-gray-700 rounded-lg p-3 text-white"></textarea>
                  <button type="submit" className="md:col-span-2 bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-lg">
                    新增品牌
                  </button>
                </form>
              </div>

              <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-800/50 text-gray-400">
                    <tr>
                      <th className="p-4">分類</th>
                      <th className="p-4">品牌名稱</th>
                      <th className="p-4">狀態</th>
                      <th className="p-4 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brands.map(brand => (
                      <tr key={brand.id} className="border-t border-gray-800 hover:bg-gray-800/30">
                        <td className="p-4">{brand.category}</td>
                        <td className="p-4 font-bold">{brand.name}</td>
                        <td className="p-4"><span className="bg-gray-700 px-2 py-1 rounded text-xs">{brand.status}</span></td>
                        <td className="p-4 text-right">
                          <button onClick={() => handleDelete('brands', brand.id)} className="text-red-400 hover:text-red-300 p-2">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(activeTab === 'controversies' || activeTab === 'polls') && (
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-8 text-center text-gray-400">
              <AlertTriangle size={48} className="mx-auto mb-4 text-yellow-500 opacity-50" />
              <h3 className="text-xl font-bold text-white mb-2">進階模組</h3>
              <p>爭議懶人包與投票調查的後台管理介面結構與品牌管理相似。<br/>為保持系統輕量化，原型展示目前僅開放「總體數據」與「品牌」的完整新增/刪除功能。<br/>(資料皆已真實存於 Firebase，可透過腳本或完整後台擴充。)</p>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
