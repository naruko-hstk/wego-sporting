<script setup lang="ts">
const items = [
  {
    title: "北部",
    description: "北部地區的賽事",
    regions: [
      {
        name: "基隆市",
        description: "在基隆市舉辦的賽事",
        to: "/region/keelung",
      },
      {
        name: "新北市",
        description: "在新北市舉辦的賽事",
        to: "/region/new-taipei",
      },
      {
        name: "臺北市",
        description: "在臺北市舉辦的賽事",
        to: "/region/taipei",
      },
      {
        name: "桃園市",
        description: "在桃園市舉辦的賽事",
        to: "/region/taoyuan",
      },
      {
        name: "新竹市",
        description: "在新竹市舉辦的賽事",
        to: "/region/hsinchu-city",
      },
      {
        name: "新竹縣",
        description: "在新竹縣舉辦的賽事",
        to: "/region/hsinchu-county",
      },
      {
        name: "苗栗縣",
        description: "在苗栗縣舉辦的賽事",
        to: "/region/miaoli",
      },
    ],
  },
  {
    title: "中部",
    description: "中部地區的賽事",
    regions: [
      {
        name: "臺中市",
        description: "在臺中市舉辦的賽事",
        to: "/region/taichung",
      },
      {
        name: "彰化縣",
        description: "在彰化縣舉辦的賽事",
        to: "/region/changhua",
      },
      {
        name: "南投縣",
        description: "在南投縣舉辦的賽事",
        to: "/region/nantou",
      },
      {
        name: "雲林縣",
        description: "在雲林縣舉辦的賽事",
        to: "/region/yunlin",
      },
    ],
  },
  {
    title: "南部",
    description: "南部地區的賽事",
    regions: [
      {
        name: "嘉義市",
        description: "在嘉義市舉辦的賽事",
        to: "/region/chiayi-city",
      },
      {
        name: "嘉義縣",
        description: "在嘉義縣舉辦的賽事",
        to: "/region/chiayi-county",
      },
      {
        name: "臺南市",
        description: "在臺南市舉辦的賽事",
        to: "/region/tainan",
      },
      {
        name: "高雄市",
        description: "在高雄市舉辦的賽事",
        to: "/region/kaohsiung",
      },
      {
        name: "屏東縣",
        description: "在屏東縣舉辦的賽事",
        to: "/region/pingtung",
      },
    ],
  },
  {
    title: "東部",
    description: "東部地區的賽事",
    regions: [
      {
        name: "宜蘭縣",
        description: "在宜蘭縣舉辦的賽事",
        to: "/region/yilan",
      },
      {
        name: "花蓮縣",
        description: "在花蓮縣舉辦的賽事",
        to: "/region/hualien",
      },
      {
        name: "臺東縣",
        description: "在臺東縣舉辦的賽事",
        to: "/region/taitung",
      },
    ],
  },
  {
    title: "外島",
    description: "外島地區的賽事",
    regions: [
      {
        name: "澎湖縣",
        description: "在澎湖縣舉辦的賽事",
        to: "/region/penghu",
      },
      {
        name: "金門縣",
        description: "在金門縣舉辦的賽事",
        to: "/region/kinmen",
      },
      {
        name: "連江縣",
        description: "在連江縣舉辦的賽事",
        to: "/region/lienchiang",
      },
    ],
  },
]
</script>

<template>
  <div>
    <template v-for="(item, index) in items" :key="index">
      <UPageHeader
        :title="item.title"
        :description="item.description"
        class="mb-4"
      />
      <UPageColumns>
        <UPageCard
          v-for="(region, regionIndex) in item.regions"
          :key="regionIndex"
          :title="region.name"
          :description="region.description"
          :to="region.to"
          variant="subtle"
        />
      </UPageColumns>
    </template>
  </div>
</template>

<style scoped></style>
