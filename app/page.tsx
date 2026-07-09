import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* ----------------------------------------------------
          1. 主視覺看板區 (Hero Section)
         ---------------------------------------------------- */}
      <section className="py-24 px-4 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          
          {/* 【主標題】 */}
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-black dark:text-white mb-6">
            歡迎來到小羊跟宥利的測試網站
          </h1>
          
          {/* 【副標題 / 網站簡介】 */}
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
            Thoughtfully designed everyday essentials for work, travel, and life.
            Minimalist aesthetics meet maximum functionality.
          </p>
          
          {/* 【主按鈕區】 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            
            {/* 左邊主要按鈕文字 (連結改 href="/你的路徑") */}
            <Link
              href="/catalog/fall"
              className="inline-flex items-center justify-center bg-black dark:bg-white text-white dark:text-black px-8 py-3 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              Shop Fall Collection
            </Link>
            
            {/* 右邊次要按鈕文字 */}
            <Link
              href="/catalog/latest"
              className="inline-flex items-center justify-center border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
            >
              View Latest
            </Link>
            
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          2. 精選分類方格區 (Collections Grid)
         ---------------------------------------------------- */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          
          {/* 分類區的大標題與小字介紹 */}
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-black dark:text-white mb-4">
              Shop by Season
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              Discover our curated collections, each designed for specific moments and seasons.
            </p>
          </div>

          {/* 方格卡片列表 (共 5 個分類) */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* --- 卡片 1：秋季 (Fall) --- */}
            <Link href="/catalog/fall" className="group block">
              <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-8 h-64 flex flex-col justify-between hover:border-black dark:hover:border-white transition-colors">
                <div>
                  <span className="text-4xl mb-4 block">🍂</span> {/* 可更換 Emoji 圖標 */}
                  <h3 className="text-xl font-semibold text-black dark:text-white mb-2">Fall</h3> {/* 卡片標題 */}
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Cozy layers and warm essentials for crisp autumn days {/* 卡片敘述 */}
                  </p>
                </div>
                <span className="text-sm font-medium text-black dark:text-white group-hover:underline">
                  Shop Collection → {/* 卡片底部連結文字 */}
                </span>
              </div>
            </Link>

            {/* --- 卡片 2：冬季 (Winter) --- */}
            <Link href="/catalog/winter" className="group block">
              <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-8 h-64 flex flex-col justify-between hover:border-black dark:hover:border-white transition-colors">
                <div>
                  <span className="text-4xl mb-4 block">❄️</span>
                  <h3 className="text-xl font-semibold text-black dark:text-white mb-2">Winter</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Premium insulation and weather protection
                  </p>
                </div>
                <span className="text-sm font-medium text-black dark:text-white group-hover:underline">
                  Shop Collection →
                </span>
              </div>
            </Link>

            {/* --- 卡片 3：春季 (Spring) --- */}
            <Link href="/catalog/latest" className="group block">
              <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-8 h-64 flex flex-col justify-between hover:border-black dark:hover:border-white transition-colors">
                <div>
                  <span className="text-4xl mb-4 block">🌱</span>
                  <h3 className="text-xl font-semibold text-black dark:text-white mb-2">Spring 2026</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Fresh starts with lightweight, versatile pieces
                  </p>
                </div>
                <span className="text-sm font-medium text-black dark:text-white group-hover:underline">
                  Preview Collection →
                </span>
              </div>
            </Link>

            {/* --- 卡片 4：限量版 (Limited Edition) --- */}
            <Link href="/catalog/limited-edition" className="group block">
              <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-8 h-64 flex flex-col justify-between hover:border-black dark:hover:border-white transition-colors">
                <div>
                  <span className="text-4xl mb-4 block">✨</span>
                  <h3 className="text-xl font-semibold text-black dark:text-white mb-2">Limited Edition</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Exclusive collaborations and special releases
                  </p>
                </div>
                <span className="text-sm font-medium text-black dark:text-white group-hover:underline">
                  Explore →
                </span>
              </div>
            </Link>

            {/* --- 卡片 5：特賣區 (Outlet) --- */}
            <Link href="/catalog/outlet" className="group block">
              <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-8 h-64 flex flex-col justify-between hover:border-black dark:hover:border-white transition-colors">
                <div>
                  <span className="text-4xl mb-4 block">📦</span>
                  <h3 className="text-xl font-semibold text-black dark:text-white mb-2">Outlet</h3>
                  <h3 className="text-xl font-semibold text-black dark:text-white mb-2">Outlet</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Past seasons at special prices
                  </p>
                </div>
                <span className="text-sm font-medium text-black dark:text-white group-hover:underline">
                  Browse Deals →
                </span>
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          3. 訂閱電子報區 (Newsletter Section)
         ---------------------------------------------------- */}
      <section className="py-16 px-4 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-xl mx-auto text-center">
          
          {/* 訂閱欄位小標題 */}
          <h3 className="text-lg font-semibold text-black dark:text-white mb-3">
            Stay in the loop
          </h3>
          
          {/* 訂閱欄位說明的文字 */}
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Be the first to know about new collections and exclusive offers.
          </p>
          
          <div className="flex gap-3">
            {/* 輸入框的預設提示文字 (placeholder) */}
            <input
              type="email"
              placeholder="Enter your email" 
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
            
            {/* 訂閱按鈕文字 */}
            <button className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
              Subscribe
            </button>
            
          </div>
        </div>
      </section>
    </main>
  )
}
