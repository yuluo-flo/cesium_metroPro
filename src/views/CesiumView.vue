
<template>
  <div id="cesium-viewer">
    <slot />
  </div>
</template>

<script setup>
import * as Cesium from "cesium";
import { onMounted } from "vue";
import {
  initViewer,
  flyToDefaultView,
} from "@/cesiumTools/sceneManager";
import { getLine } from "@/api/line";
import { useLineData } from "@/store";
const lineDataStore=useLineData()
//初始化cesium实例
Cesium.Ion.defaultAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwZWI2YTk3ZC1mZWI4LTQyMDUtYmI1Ny00YzFkYTFmYmIwYzIiLCJpZCI6MjE3MTU4LCJpYXQiOjE3MTY0Mjc1MDZ9.dC3r6S37sujU0HyCKe-k_flKuGM9kyy_oqkd9eQutZs";
onMounted(async () => {
    // 创建地图实例 添加腾讯地图
    const viewer = initViewer("cesium-viewer");
    // 视角飞行
    flyToDefaultView(viewer)
    lineDataStore.setViewer(viewer)
    // 获取地铁线路数据，并进行数据处理
    const lineData = await getLine()
    lineDataStore.setData(lineData)
});
</script>
<style>
#cesium-viewer {
  width: 100%;
  height: 100%;
  pointer-events: all;
}
</style>
