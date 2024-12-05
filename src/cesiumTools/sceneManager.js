import * as Cesium from "cesium";
import { TencentImageryProvider } from "./mapPlugin";

// 初始化地图场景
export const initViewer = (container) => {
  // 初始化cesium地图对象viewer
  const viewer = new Cesium.Viewer(container, {
    timeline: false, // 是否显示时间线控件
    animation: false, // 是否显示动画控件
    baseLayerPicker: false, // 避免token
    infoBox: false, // 是否显示点击要素之后显示的信息
    selectionIndicator: false, //选中元素显示,默认true
    skyAtmosphere: false, //关闭地球光环
    homeButton: false,
    fullscreenButton: false,
    geocoder: false,
    sceneModePicker: false,
    shouldAnimate: true,
    navigationHelpButton: false,
  });

  const options = {
    style: 4, 
    crs: "WGS84",
  };
  // 添加腾讯底图
  viewer.imageryLayers.add(
    new Cesium.ImageryLayer(new TencentImageryProvider(options))
  );
  return viewer;
};

// 视角飞到全局
export const flyToDefaultView = (viewer) => {
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(113.95, 30.19, 34000),
    duration: 2,
    orientation: {
      heading: Cesium.Math.toRadians(35.0),
      pitch: Cesium.Math.toRadians(-37.0),
      roll: 0.0,
    },
  });
};
