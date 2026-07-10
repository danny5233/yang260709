"use client";
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
  onSnapshot, updateDoc, addDoc, deleteDoc, increment 
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

// =========================================================================
// ✏️ [可更改區塊] --- 以下為預設資料 (Default Data) ---
// 說明：當資料庫為空時（第一次載入網頁），系統會將以下資料寫入資料庫中。
// 如果你想更改初始的預設值，請修改以下內容：
// =========================================================================

// 📌 1. 總體數據預設值
const defaultStats = {
  boycottCount: 143399,       // 首頁大字：已表態的總人數
  currentSubscribers: 2520000, // 蔡阿嘎當前的訂閱數 (顯示於底部退訂挑戰區)
  baseSubscribers: 2530000,   // 活動開始前的訂閱數 (用來計算減少了多少人)
  unsubCount: 8216            // 已點擊「我退訂了」按鈕的人數
};

// 📌 2. 合作品牌清單
// 欄位說明：
// category: 分類標籤 (例如：'健康/保健', '家電/科技')
// name: 品牌名稱
// status: 品牌目前狀態 (例如：'已停止合作', '重新評估中', '合作中')
// appealText: 點擊「複製訴求」按鈕時，要複製給使用者的文字內容
// link: 「官方粉專」按鈕要連往的網址， '#' 代表無網址
const defaultBrands = [
  { category: '健康/保健', name: 'GREENGOLD 保健食品', status: '已停止合作', appealText: '身為消費者，我拒絕購買任何與爭議網紅合作的產品。請貴品牌慎重評估代言人。', link: '#' },
  { category: '健康/保健', name: 'USTINI 我挺你健康鞋', status: '重新評估中', appealText: '希望貴品牌能聽見消費者的聲音，停止與爭議人物合作。', link: '#' },
  { category: '家電/科技', name: 'SwitchBot 智慧家居', status: '合作中', appealText: '請貴品牌正視代言人帶來的負面影響，我將抵制直到更換代言人。', link: '#' },
  { category: '家電/科技', name: 'Jacfit 智慧運動墊', status: '合作中', appealText: '身為消費者，我拒絕購買任何與爭議網紅合作的產品。', link: '#' },
  { category: '食品/生活', name: '農純鄉', status: '已停止合作', appealText: '感謝品牌聽見消費者的聲音。', link: '#' }
];

// 📌 3. 爭議懶人包 (時間軸卡片)
// 欄位說明：
// year: 左上角的年份或日期標籤
// title: 爭議事件的標題
// desc: 爭議事件的詳細描述
// tag: 左下角的灰底分類標籤
// link: 「查看來源」按鈕的網址， '#' 代表無網址隱藏按鈕
// order: 排序順序，數字越小排越前面
const defaultControversies = [
  { year: '2026', title: '遭爆下令「嘎家軍」出征酸民', desc: '群組截圖流出，「嘎哥護衛軍 GArmy」成員逾 9,900 人，內部下令要求在各大平台對批評者反擊，間接承認網軍。', tag: '出征酸民', link: '#', order: 1 },
  { year: '2026', title: '被罵回嗆「都是中共同路人」', desc: '道歉後再拍片反擊，稱轉傳日媒報導的人都是「中共同路人」，並將批評與政治掛鉤。', tag: '政治消費', link: '#', order: 2 },
  { year: '2026', title: 'AI 對決日本街頭畫家', desc: '在日本請街頭畫家為兒子繪製肖像，卻將手繪作品與 AI 生成圖並排讓粉絲投票比較，遭日媒指控「對日本畫家太失禮」。', tag: '不尊重創作者', link: '#', order: 3 },
  { year: '2023', title: '日本「超難吃地雷店」炎上', desc: '公開點名批評日本多家連鎖餐廳，遭日本媒體報導，引發跨國爭議。', tag: '失禮行為', link: '#', order: 4 }
];

// 📌 4. 意見調查投票系統
// 欄位說明：
// question: 投票的主要問題標題
// totalVotes: 目前的總投票數 (系統會自動累加，但可以設定初始值)
// options: 投票選項列表
//   - id: 選項的唯一編號 (請用 '1', '2', '3' 依序編號)
//   - text: 選項的文字內容
//   - votes: 該選項目前的得票數 (系統會自動累加)
const defaultPolls = [
  {
    question: '蔡阿嘎公開道歉了⋯你的立場是？',
    totalVotes: 560,
    options: [
      { id: '1', text: '接受道歉，停止抵制行動', votes: 146 },
      { id: '2', text: '持保留態度，觀察後續品牌是否跟進切割', votes: 148 },
      { id: '3', text: '已不是第一次道歉，一直重複相同戲碼，堅持抵制直到各品牌發表正式聲明切割', votes: 266 }
    ]
  }
];
// =========================================================================
// ✏️ [可更改區塊結束]
// =========================================================================

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
  const [votedPolls, setVotedPolls] = useState({});

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
      
      // 如果資料庫是空的，把上面註解區塊的資料寫進去
      if (!statsSnap.exists()) {
        await setDoc(statsRef, defaultStats);
        defaultBrands.forEach(b => addDoc(getPublicCollection('brands'), b));
        defaultControversies.forEach(c => addDoc(getPublicCollection('controversies'), c));
        defaultPolls.forEach(p => addDoc(getPublicCollection('polls'), p));
      }
    };

    initializeIfEmpty();

    // 監聽即時數據
    const unsubStats = onSnapshot(getPublicDoc('campaign_stats', 'main'), 
      (doc) => { if (doc.exists()) setStats(doc.data()); }
    );
    const unsubBrands = onSnapshot(getPublicCollection('brands'), 
      (snap) => setBrands(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );
    const unsubControversies = onSnapshot(getPublicCollection('controversies'), 
      (snap) => {
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        data.sort((a, b) => a.order - b.order); // 依照 order 排序
        setControversies(data);
      }
    );
    const unsubPolls = onSnapshot(getPublicCollection('polls'), 
      (snap) => setPolls(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );

    // 從瀏覽器記憶中讀取是否投過票
    setHasVotedBoycott(localStorage.getItem('votedBoycott') === 'true');
    setHasVotedUnsub(localStorage.getItem('votedUnsub') === 'true');
    setVotedPolls(JSON.parse(localStorage.getItem('votedPolls') || '{}'));

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

  const handleBoycottVote = async () => {
    if (hasVotedBoycott) return showToast('您已經表態過了！');
    await updateDoc(getPublicDoc('campaign_stats', 'main'), { boycottCount: increment(1) });
    setHasVotedBoycott(true);
    localStorage.setItem('votedBoycott', 'true');
    showToast('表態成功！感謝您的參與。');
  };

  const handleUnsubVote = async () => {
    if (hasVotedUnsub) return showToast('您已經記錄過了！');
    await updateDoc(getPublicDoc('campaign_stats', 'main'), { unsubCount: increment(1) });
    setHasVotedUnsub(true);
    localStorage.setItem('votedUnsub', 'true');
    showToast('退訂記錄成功！');
  };

  const handlePollVote = async (pollId, optionId) => {
    if (votedPolls[pollId]) return showToast('您已經投過此票了！');
    const pollRef = getPublicDoc('polls', pollId);
    const poll = polls.find(p => p.id === pollId);
    if (!poll) return;

    const newOptions = poll.options.map(opt => 
      opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
    );

    await updateDoc(pollRef, { options: newOptions, totalVotes: increment(1) });
    const newVotedPolls = { ...votedPolls, [pollId]: optionId };
    setVotedPolls(newVotedPolls);
    localStorage.setItem('votedPolls', JSON.stringify(newVotedPolls));
    showToast('投票成功！');
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPassword === 'admin') { // 這裡可以更改後台登入密碼
      setIsAdmin(true);
      setShowAdminLogin(false);
      setAdminPassword('');
      showToast('已進入管理員模式');
    } else {
      showToast('密碼錯誤！');
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] text-gray-200 font-sans">
      {/* 提示訊息 */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 border border-orange-500 text-orange-400 px-6 py-3 rounded-full shadow-2xl z-50 flex items-center space-x-2 animate-bounce">
          <CheckCircle2 size={20} />
          <span>{toastMessage}</span>
        </div>
      )}

      {!isAdmin ? (
        <main className="pb-20">
          
          {/* 1. 首頁表態區 */}
          <section className="relative pt-24 pb-16 flex flex-col items-center justify-center text-center px-4 border-b border-gray-800 bg-gradient-to-b from-[#1e130c] to-[#111111]">
            <div className="inline-block bg-orange-600 text-white text-xs px-4 py-1.5 rounded-full mb-6 font-bold tracking-wider">
              消費者表態
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-6 text-white tracking-wide leading-tight">
              我抵制與<br />蔡阿嘎合作品牌 ✊
            </h1>
            <p className="text-sm md:text-base text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed">
              本人宣示，作為消費者，我抵制與蔡阿嘎合作的品牌，以消費行動表達立場。
            </p>
            <p className="text-xs text-gray-500 max-w-3xl mx-auto mb-12 leading-relaxed px-4">
              {brands.map(b => b.name).join('．')}
            </p>

            <div className="text-center mb-8">
              <div className="text-6xl md:text-8xl font-black text-orange-500 mb-2 drop-shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                {stats.boycottCount.toLocaleString()}
              </div>
              <div className="text-gray-400 text-sm tracking-widest">人已表態</div>
            </div>

            <button 
              onClick={handleBoycottVote}
              disabled={hasVotedBoycott}
              className={`px-12 py-4 rounded-full font-bold text-lg transition-all duration-300 ${
                hasVotedBoycott 
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                : 'bg-orange-500 hover:bg-orange-400 text-white hover:scale-105 shadow-[0_0_30px_rgba(249,115,22,0.3)]'
              }`}
            >
              {hasVotedBoycott ? '已表態' : '我要表態 ➔'}
            </button>
          </section>

          {/* 2. 懶人包卡片區 */}
          <section className="py-16 px-4 md:px-8 border-b border-gray-800">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center space-x-3 mb-8">
                <span className="text-2xl">📋</span>
                <h2 className="text-2xl font-bold text-white">蔡阿嘎爭議懶人包</h2>
                <span className="text-sm text-gray-500 ml-auto">往右滑動查看更多 ➔</span>
              </div>
              
              <div className="flex overflow-x-auto space-x-6 pb-8 snap-x scrollbar-hide">
                {controversies.map((item) => (
                  <div key={item.id} className="min-w-[320px] max-w-[320px] bg-[#1a1a1a] p-6 rounded-2xl snap-start border border-gray-800 hover:border-orange-500/30 transition-all flex flex-col h-full">
                    <div className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-4 w-max">
                      {item.year}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 leading-snug">{item.title}</h3>
                    <p className="text-gray-400 text-sm mb-6 leading-relaxed flex-grow">
                      {item.desc}
                    </p>
                    <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-800">
                      <span className="text-xs bg-gray-800 px-3 py-1.5 rounded-md text-gray-400">{item.tag}</span>
                      {item.link !== '#' && (
                        <a href={item.link} target="_blank" rel="noreferrer" className="text-orange-500 text-sm hover:text-orange-400 flex items-center">
                          查看來源 <ExternalLink size={14} className="ml-1"/>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 3. 投票調查區 */}
          <section className="py-16 px-4 border-b border-gray-800 bg-[#0a0a0a]">
            <div className="max-w-4xl mx-auto">
              {polls.map(poll => (
                <div key={poll.id} className="mb-16 last:mb-0">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">📊 {poll.question}</h2>
                    <p className="text-sm text-gray-500 mb-4">每人限投一票</p>
                    <div className="inline-flex items-center gap-2 text-yellow-600 text-xs bg-yellow-900/20 px-3 py-1.5 rounded-lg border border-yellow-900/50">
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
                          className={`w-full text-left p-5 rounded-2xl border relative overflow-hidden transition-all duration-300 ${
                            isVoted 
                              ? 'border-orange-500 bg-orange-900/20' 
                              : !!votedPolls[poll.id]
                                ? 'border-gray-800 bg-[#111] opacity-60'
                                : 'border-gray-700 bg-[#1a1a1a] hover:border-gray-500'
                          }`}
                        >
                          {!!votedPolls[poll.id] && (
                            <div 
                              className="absolute left-0 top-0 bottom-0 bg-orange-600/20 z-0 transition-all duration-1000"
                              style={{ width: `${percent}%` }}
                            />
                          )}
                          <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1 pr-4">
                              <span className={`min-w-[32px] h-8 rounded-full flex items-center justify-center font-bold text-sm ${isVoted ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400'}`}>
                                {idx + 1}
                              </span>
                              <span className={`font-medium leading-relaxed ${isVoted ? 'text-orange-100' : 'text-gray-300'}`}>{opt.text}</span>
                            </div>
                            {!!votedPolls[poll.id] && (
                              <div className="text-right pl-4 border-l border-gray-700">
                                <div className="font-black text-xl text-white">{percent}%</div>
                                <div className="text-xs text-gray-500 mt-1">{opt.votes} 票</div>
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

          {/* 4. 合作品牌區 */}
          <section className="py-20 px-4 border-b border-gray-800">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-white mb-4">🎯 合作品牌名單</h2>
                <p className="text-sm text-gray-400 max-w-2xl mx-auto leading-relaxed">
                  以下品牌曾與爭議網紅進行廣告合作或代言，有的是進行式有的是過去式，呼籲所有合作品牌審慎評估代言人效應。<br/><br/>
                  <span className="text-orange-400 font-bold">點選品牌後複製訴求 ➔ 貼到品牌臉書官方粉絲頁，讓品牌方聽到消費者的聲音！</span>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(
                  brands.reduce((acc, brand) => {
                    if (!acc[brand.category]) acc[brand.category] = [];
                    acc[brand.category].push(brand);
                    return acc;
                  }, {})
                ).map(([category, catBrands]) => (
                  <div key={category} className="bg-[#151515] border border-gray-800 rounded-3xl overflow-hidden">
                    <div className="bg-gray-900/50 p-5 border-b border-gray-800 font-bold text-orange-400 flex items-center gap-2">
                      <span className="text-xl">📌</span> {category}
                    </div>
                    <div className="p-5 space-y-6">
                      {catBrands.map(brand => (
                        <div key={brand.id} className="border-b border-gray-800 pb-6 last:border-0 last:pb-0">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-bold text-white text-lg">{brand.name}</h4>
                            <span className="bg-gray-800 border border-gray-700 text-xs px-2 py-1 rounded text-gray-300 whitespace-nowrap">
                              {brand.status}
                            </span>
                          </div>
                          <div className="bg-black/30 rounded-xl p-4 text-sm text-gray-400 mb-4 border border-gray-800">
                            {brand.appealText}
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => copyToClipboard(brand.appealText)}
                              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-sm py-2.5 rounded-lg flex justify-center items-center gap-1 transition-colors font-medium"
                            >
                              <Copy size={16} /> 複製訴求
                            </button>
                            <a 
                              href={brand.link} target="_blank" rel="noreferrer"
                              className="flex-1 bg-orange-600 hover:bg-orange-500 text-white text-sm py-2.5 rounded-lg flex justify-center items-center gap-1 transition-colors font-medium"
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

          {/* 5. 退訂挑戰區 */}
          <section className="py-24 px-4 bg-gradient-to-b from-[#111111] to-[#0a100a] border-t border-green-900/20">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <div className="inline-block bg-orange-600 text-white text-xs px-4 py-1.5 rounded-full mb-6 font-bold tracking-widest">
                  退訂行動
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white mb-4">蔡阿嘎 退訂挑戰 ✊</h2>
                <p className="text-gray-400">退訂他的頻道，讓數字說話。</p>
              </div>

              <div className="bg-[#161616] border border-gray-800 rounded-[2rem] p-8 md:p-12 shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12 border-b border-gray-800 pb-12">
                  <div className="text-center">
                    <div className="text-sm text-gray-500 mb-3 font-medium">🔴 YouTube 現在訂閱數</div>
                    <div className="text-5xl md:text-6xl font-black text-white tracking-tighter">
                      {stats.currentSubscribers.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500 mb-3 font-medium">📉 活動以來已減少訂閱數</div>
                    <div className="text-5xl md:text-6xl font-black text-green-500 tracking-tighter drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                      {(stats.baseSubscribers - stats.currentSubscribers).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="max-w-2xl mx-auto text-center">
                  <div className="text-sm text-gray-400 mb-4 flex items-center justify-center gap-2 font-medium">
                    <Activity size={18} className="text-orange-500"/> 已加入退訂挑戰
                  </div>
                  <div className="text-6xl font-black text-orange-500 mb-8 drop-shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                    {stats.unsubCount.toLocaleString()}
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-10">
                    <div className="w-full bg-gray-900 rounded-full h-4 mb-3 overflow-hidden border border-gray-800">
                      <div 
                        className="bg-gradient-to-r from-orange-600 to-orange-400 h-full rounded-full transition-all duration-1000 relative" 
                        style={{ width: `${Math.min((stats.unsubCount / 10000) * 100, 100)}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 w-full animate-pulse"></div>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500 font-medium">
                      <span>當前進度</span>
                      <span>目標 10,000 人 ({Math.round((stats.unsubCount / 10000) * 100)}%)</span>
                    </div>
                  </div>

                  <button 
                    onClick={handleUnsubVote}
                    disabled={hasVotedUnsub}
                    className={`w-full py-5 rounded-2xl font-bold text-2xl transition-all duration-300 ${
                      hasVotedUnsub
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                      : 'bg-orange-500 hover:bg-orange-400 text-white hover:scale-105 hover:-translate-y-1 shadow-[0_10px_40px_rgba(249,115,22,0.3)]'
                    }`}
                  >
                    {hasVotedUnsub ? '✅ 已打卡退訂！' : '✊ 我退訂了！'}
                  </button>
                </div>
              </div>
            </div>
          </section>

        </main>
      ) : (
        <AdminDashboard 
          stats={stats} 
          brands={brands} 
          controversies={controversies} 
          polls={polls}
          onLogout={() => setIsAdmin(false)}
          showToast={showToast}
        />
      )}

      {/* Admin Login Modal (鎖頭) */}
      {!isAdmin && (
        <>
          <button 
            onClick={() => setShowAdminLogin(true)}
            className="fixed bottom-6 right-6 p-4 bg-gray-900 hover:bg-gray-800 rounded-full text-gray-600 hover:text-white transition-all duration-300 border border-gray-800 shadow-xl opacity-30 hover:opacity-100 z-40"
            title="後台管理"
          >
            <Lock size={20} />
          </button>

          {showAdminLogin && (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-md px-4">
              <form onSubmit={handleAdminLogin} className="bg-[#161616] p-8 rounded-3xl border border-gray-800 w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Lock size={24} className="text-orange-500"/> 管理員登入
                  </h3>
                  <button type="button" onClick={() => setShowAdminLogin(false)} className="text-gray-500 hover:text-white bg-gray-800 p-2 rounded-full">
                    <X size={20} />
                  </button>
                </div>
                <p className="text-sm text-gray-400 mb-6 bg-gray-900 p-4 rounded-xl border border-gray-800">
                  請輸入管理員密碼進入後台編輯模式<br/>
                  (預設密碼: <span className="text-white font-bold">admin</span>)
                </p>
                <input 
                  type="password" 
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="請輸入密碼"
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-xl p-4 text-white mb-6 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                  autoFocus
                />
                <button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-xl transition-colors text-lg">
                  登入後台
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// --- 後台管理中心 Component ---
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
      showToast('數據已更新至前台！');
    } catch (err) {
      showToast('更新失敗');
    }
  };

  const handleDelete = async (collectionName, id) => {
    if (confirm('確定要刪除這筆資料嗎？前台會同步消失喔！')) {
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
    showToast('品牌已新增，前台已同步！');
  };

  return (
    <div className="min-h-screen bg-[#000] text-gray-200 flex flex-col">
      {/* Admin Header */}
      <header className="bg-[#111] border-b border-gray-800 px-6 py-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="bg-orange-600 p-2.5 rounded-xl">
            <Unlock size={20} className="text-white"/>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-tight">後台管理中心</h1>
            <span className="text-xs text-orange-500">已連線至 Firebase</span>
          </div>
        </div>
        <button onClick={onLogout} className="bg-gray-800 hover:bg-gray-700 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
          離開後台
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Admin Sidebar */}
        <aside className="w-64 bg-[#0a0a0a] border-r border-gray-800 p-4 overflow-y-auto hidden md:block">
          <nav className="space-y-2">
            {[
              { id: 'stats', label: '大數字修改', icon: Activity },
              { id: 'brands', label: '合作品牌管理', icon: Users },
              { id: 'controversies', label: '爭議懶人包 (開發中)', icon: AlertTriangle },
              { id: 'polls', label: '投票調查 (開發中)', icon: TrendingDown },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all ${
                  activeTab === tab.id ? 'bg-orange-600/10 text-orange-500 font-bold border border-orange-500/20' : 'text-gray-400 hover:bg-gray-900 hover:text-white border border-transparent'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Admin Content Area */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-[#111]">
          
          {activeTab === 'stats' && (
            <div className="max-w-2xl bg-[#1a1a1a] border border-gray-800 rounded-3xl p-8 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Activity className="text-orange-500"/> 修改前台顯示數字
              </h2>
              <form onSubmit={handleUpdateStats} className="space-y-6">
                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                  <label className="block text-sm font-medium text-gray-400 mb-2">首頁大字：總表態人數</label>
                  <input name="boycottCount" type="number" defaultValue={stats.boycottCount} className="w-full bg-[#000] border border-gray-700 rounded-lg p-3 text-white text-xl font-bold focus:border-orange-500 outline-none" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                    <label className="block text-sm font-medium text-gray-400 mb-2">活動開始前訂閱數 (基準值)</label>
                    <input name="baseSubscribers" type="number" defaultValue={stats.baseSubscribers} className="w-full bg-[#000] border border-gray-700 rounded-lg p-3 text-white focus:border-orange-500 outline-none" />
                  </div>
                  <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                    <label className="block text-sm font-medium text-gray-400 mb-2">當前即時訂閱數</label>
                    <input name="currentSubscribers" type="number" defaultValue={stats.currentSubscribers} className="w-full bg-[#000] border border-gray-700 rounded-lg p-3 text-white focus:border-orange-500 outline-none" />
                  </div>
                </div>

                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                  <label className="block text-sm font-medium text-gray-400 mb-2">已參與退訂挑戰人數</label>
                  <input name="unsubCount" type="number" defaultValue={stats.unsubCount} className="w-full bg-[#000] border border-gray-700 rounded-lg p-3 text-white focus:border-orange-500 outline-none" />
                </div>

                <button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-xl text-lg transition-colors shadow-lg">
                  儲存並同步至前台
                </button>
              </form>
            </div>
          )}

          {activeTab === 'brands' && (
            <div className="max-w-5xl">
              {/* 新增品牌區塊 */}
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-3xl p-8 mb-8 shadow-xl">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Plus size={20} className="text-orange-500"/> 新增合作品牌
                </h3>
                <form onSubmit={handleAddBrand} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-xs text-gray-500 mb-1">品牌名稱</label>
                    <input name="name" required className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-orange-500" />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-xs text-gray-500 mb-1">分類</label>
                    <select name="category" required className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-orange-500">
                      <option value="">選擇分類...</option>
                      <option value="健康/保健">健康/保健</option>
                      <option value="家電/科技">家電/科技</option>
                      <option value="食品/生活">食品/生活</option>
                      <option value="保養/美妝">保養/美妝</option>
                      <option value="其他">其他</option>
                    </select>
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-xs text-gray-500 mb-1">狀態標籤</label>
                    <input name="status" placeholder="例: 已停止合作" required className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-orange-500" />
                  </div>
                  
                  <div className="md:col-span-3">
                    <label className="block text-xs text-gray-500 mb-1">預設複製訴求文字</label>
                    <textarea name="appealText" required rows="2" className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-orange-500"></textarea>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">官方粉專網址 (無則留空)</label>
                    <input name="link" placeholder="https://" className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-orange-500" />
                  </div>
                  <div className="md:col-span-1 flex items-end">
                    <button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-lg transition-colors">
                      + 確定新增
                    </button>
                  </div>
                </form>
              </div>

              {/* 品牌列表區塊 */}
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="p-6 border-b border-gray-800 bg-gray-900/50">
                  <h3 className="font-bold text-white">現有品牌列表</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-gray-500 bg-[#0a0a0a]">
                      <tr>
                        <th className="p-4 font-medium">分類</th>
                        <th className="p-4 font-medium">品牌名稱</th>
                        <th className="p-4 font-medium">狀態</th>
                        <th className="p-4 font-medium text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {brands.map(brand => (
                        <tr key={brand.id} className="hover:bg-gray-800/20 transition-colors">
                          <td className="p-4 text-gray-400">{brand.category}</td>
                          <td className="p-4 font-bold text-gray-200">{brand.name}</td>
                          <td className="p-4">
                            <span className="bg-gray-800 border border-gray-700 px-2.5 py-1 rounded-md text-xs text-gray-300">
                              {brand.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button onClick={() => handleDelete('brands', brand.id)} className="text-red-400 hover:text-red-300 bg-red-400/10 hover:bg-red-400/20 p-2 rounded-lg transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {(activeTab === 'controversies' || activeTab === 'polls') && (
            <div className="max-w-2xl bg-[#1a1a1a] border border-gray-800 rounded-3xl p-12 text-center text-gray-400">
              <AlertTriangle size={48} className="mx-auto mb-6 text-yellow-500 opacity-50" />
              <h3 className="text-2xl font-bold text-white mb-4">進階模組開發中</h3>
              <p className="leading-relaxed">
                爭議懶人包與投票調查的後台管理介面結構與品牌管理相似。<br/>
                為保持目前系統流暢度，此原型展示目前主要開放「大數字修改」與「品牌」的完整新增/刪除功能。<br/>
                (資料庫已建置好對應的 Collection，可透過程式碼直接擴充。)
              </p>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
