<script setup lang="ts">
// 頁面 Meta
useSeoMeta({
  title: "隱私政策 - 競賽報名系統",
  description: "競賽報名系統的隱私政策和個人資料保護說明",
})
</script>

<template>
  <div>
    <UPageHeader
      title="隱私政策"
      description="我們如何收集、使用和保護您的個人資料"
      class="mb-8"
    >
      <template #links>
        <UButton icon="i-lucide-arrow-left" variant="ghost" to="/">
          返回首頁
        </UButton>
      </template>
    </UPageHeader>

    <UPageCard>
      <div class="prose dark:prose-invert max-w-none">
        <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
          最後更新時間：2025年8月8日
        </p>

        <h2>1. 政策概述</h2>
        <p>
          本隱私政策說明我們如何收集、使用、儲存和保護您在使用競賽報名系統時提供的個人資料。
          我們承諾保護您的隱私權，並遵守相關的個人資料保護法規。
        </p>

        <h2>2. 資料收集</h2>
        <h3>2.1 我們收集的資料類型</h3>
        <ul>
          <li><strong>帳號資訊：</strong>姓名、電子郵件地址、使用者名稱</li>
          <li><strong>個人資料：</strong>性別、生日、聯絡電話</li>
          <li><strong>賽事相關資料：</strong>報名資訊、隊伍資料、參賽記錄</li>
          <li><strong>技術資料：</strong>IP 位址、瀏覽器類型、作業系統</li>
          <li><strong>使用資料：</strong>網站使用行為、登入記錄</li>
        </ul>

        <h3>2.2 資料收集方式</h3>
        <ul>
          <li>您直接提供的資訊（註冊、報名等）</li>
          <li>自動收集的技術資訊（Cookies、日誌檔案）</li>
          <li>第三方服務提供的資訊（Google 登入等）</li>
        </ul>

        <h2>3. 資料使用目的</h2>
        <p>我們收集您的個人資料用於以下目的：</p>
        <ul>
          <li><strong>服務提供：</strong>建立和管理您的帳號、處理賽事報名</li>
          <li><strong>身分驗證：</strong>確認您的身分和登入權限</li>
          <li><strong>溝通聯絡：</strong>發送重要通知、賽事更新</li>
          <li><strong>服務改善：</strong>分析使用模式、優化系統功能</li>
          <li><strong>安全維護：</strong>防範詐騙、確保系統安全</li>
          <li><strong>法律遵循：</strong>符合法律要求和法院命令</li>
        </ul>

        <h2>4. 資料分享與揭露</h2>
        <h3>4.1 我們不會販售您的個人資料</h3>
        <p>我們承諾不會將您的個人資料販售給第三方。</p>

        <h3>4.2 有限的資料分享</h3>
        <p>在以下情況下，我們可能會分享您的資料：</p>
        <ul>
          <li><strong>賽事主辦方：</strong>提供必要的參賽者資訊</li>
          <li><strong>服務提供商：</strong>協助我們提供服務的合作夥伴</li>
          <li><strong>法律要求：</strong>應法律程序或政府機關要求</li>
          <li><strong>安全目的：</strong>保護我們或他人的合法權益</li>
        </ul>

        <h2>5. 資料保護措施</h2>
        <p>我們採用多種安全措施來保護您的個人資料：</p>
        <ul>
          <li><strong>加密技術：</strong>使用 SSL/TLS 加密傳輸</li>
          <li><strong>存取控制：</strong>限制資料存取權限</li>
          <li><strong>定期備份：</strong>確保資料安全和可用性</li>
          <li><strong>安全監控：</strong>監控異常活動和潛在威脅</li>
          <li><strong>員工培訓：</strong>定期進行資安教育訓練</li>
        </ul>

        <h2>6. 資料保存期限</h2>
        <p>我們會根據不同類型的資料設定適當的保存期限：</p>
        <ul>
          <li><strong>帳號資料：</strong>帳號存續期間及其後 3 年</li>
          <li><strong>賽事資料：</strong>賽事結束後 5 年</li>
          <li><strong>日誌資料：</strong>收集後 1 年</li>
          <li><strong>備份資料：</strong>最多 7 年</li>
        </ul>

        <h2>7. 您的權利</h2>
        <p>根據個人資料保護法，您享有以下權利：</p>
        <ul>
          <li><strong>查詢權：</strong>查詢我們持有的您的個人資料</li>
          <li><strong>更正權：</strong>要求更正不準確的資料</li>
          <li><strong>刪除權：</strong>要求刪除您的個人資料</li>
          <li><strong>限制處理權：</strong>限制我們處理您的資料</li>
          <li><strong>資料可攜權：</strong>要求提供您的資料副本</li>
          <li><strong>反對權：</strong>反對我們處理您的資料</li>
        </ul>

        <h2>8. Cookies 使用</h2>
        <h3>8.1 什麼是 Cookies</h3>
        <p>
          Cookies 是小型文字檔案，當您造訪網站時會儲存在您的裝置上，
          用於記住您的偏好設定和改善使用體驗。
        </p>

        <h3>8.2 我們使用的 Cookies 類型</h3>
        <ul>
          <li><strong>必要 Cookies：</strong>網站正常運作所需</li>
          <li><strong>功能 Cookies：</strong>記住您的偏好設定</li>
          <li><strong>分析 Cookies：</strong>了解網站使用情況</li>
        </ul>

        <h3>8.3 管理 Cookies</h3>
        <p>
          您可以透過瀏覽器設定來管理或禁用 Cookies，
          但這可能會影響某些網站功能的正常使用。
        </p>

        <h2>9. 第三方服務</h2>
        <p>我們可能使用以下第三方服務：</p>
        <ul>
          <li><strong>Google 服務：</strong>登入認證、地圖服務</li>
          <li><strong>雲端託管：</strong>資料儲存和處理</li>
          <li><strong>分析工具：</strong>網站使用情況分析</li>
        </ul>
        <p>這些第三方服務有其各自的隱私政策，我們建議您詳細閱讀。</p>

        <h2>10. 兒童隱私</h2>
        <p>
          我們的服務主要針對 13 歲以上的使用者。 如果您未滿 13
          歲，請在父母或監護人同意下使用本服務。 我們不會故意收集 13
          歲以下兒童的個人資料。
        </p>

        <h2>11. 跨境資料傳輸</h2>
        <p>
          您的個人資料可能會傳輸至台灣以外的國家或地區進行處理和儲存。
          我們會確保這些傳輸符合適用的資料保護法規。
        </p>

        <h2>12. 政策更新</h2>
        <p>
          我們可能會不定期更新本隱私政策。重大變更將透過網站公告或電子郵件通知您。
          請定期查看本頁面以了解最新的隱私政策。
        </p>

        <h2>13. 聯絡我們</h2>
        <p>如果您對本隱私政策有任何疑問或需要行使您的權利，請聯絡我們：</p>
        <ul>
          <li>電子郵件：privacy@example.com</li>
          <li>客服電話：0800-000-000</li>
          <li>郵寄地址：台北市信義區○○路○○號</li>
          <li>服務時間：週一至週五 9:00-18:00</li>
        </ul>

        <div class="mt-8 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            <strong>重要提醒：</strong>
            使用我們的服務即表示您已閱讀並同意本隱私政策。
            如果您不同意本政策的任何條款，請停止使用我們的服務。
            我們建議您定期查看本政策，以了解我們如何保護您的個人資料。
          </p>
        </div>
      </div>
    </UPageCard>
  </div>
</template>
