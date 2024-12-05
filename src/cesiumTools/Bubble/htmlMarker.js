import { render, createVNode } from "vue";
import { getStationInfo } from "@/api/line";
import * as Cesium from "cesium";
/**
 * html简单文本标注类
 */
//类定义：定义一个名为SimpleLabel的类，用于处理地图上的文本标签。
class SimpleLabel {
  //构造函数：初始化类实例时设置各种属性，包括Cesium Viewer、标签位置、文本内容、显示状态、颜色、字段、值、距离缩放规则、附加属性、弹出类型、偏移量等。同时定义了弹出窗口的路由映射。
  constructor(viewer, options) {
    this.viewer = viewer;
    this.position = Cesium.defaultValue(
      options.position,
      Cesium.Cartesian3.ZERO
    );
    this.label = Cesium.defaultValue(options.label, "label");
    this.isShow = Cesium.defaultValue(options.isShow, true);
    this.color = Cesium.defaultValue(options.color, "#ff0000");
    this.fields = Cesium.defaultValue(options.fields, []);
    this.values = Cesium.defaultValue(options.values, []);
    this.scaleByDistance = Cesium.defaultValue(
      options.scaleByDistance,
      new Cesium.NearFarScalar(1000, 1, 20000, 0.4)
    );
    this.attr = Cesium.defaultValue(options.attr, {});
    this.popupType = Cesium.defaultValue(options.type, "marker");
    this.offset = Cesium.defaultValue(options.offset, [0, 0]);
    this.popupRoutes = {
      marker: () => import("./MakerTemplate.vue"),
      carPopup: () => import("./PopupCar.vue"),
      queryPopup: () => import("./PopupQuery.vue"),
    };
    this.queryPopup = null;

    this.isDisplay = true;
  }
  //changePosition：外部调用的方法，用于改变标签的显示位置。
  // 外部修改坐标
  changePosition(position) {
    this.position = position;
  }
  //removeQueryPopup：移除已存在的查询气泡框。
  removeQueryPopup() {
    this.queryPopup && this.queryPopup.removeMarker();
  }
  //异步方法，用于展示查询气泡框。它通过调用服务获取站点详细信息，然后基于这些信息创建一个新的SimpleLabel实例来展示气泡内容。
  // 展示查询气泡框
  async showQueryPopup() {
    // 调用自己，展示新的气泡框
    // 从服务获取站点详细数据
    const params = {
      name: this.attr.name,
    };
    const { code, data } = await getStationInfo(params);
    if (code === 200) {
      const address = data.address;
      const peopleFlow = data.peopleFlow;
      const fields = ["名称", "客流量状态", "所属线路", "是否换乘"];
      const values = [
        this.attr.name,
        peopleFlow,
        address,
        this.attr.isChange ? "是" : "否",
      ];
      // 调用自己，展示新的气泡框
      this.queryPopup = new SimpleLabel(this.viewer, {
        position: this.position,
        label: this.attr.name,
        isShow: true,
        color: this.color,
        scaleByDistance: this.scaleByDistance,
        attr: this.attr,
        fields: fields,
        values: values,
        type: "queryPopup",
        offset: [150, -20],
      });
      this.queryPopup.addLabel();
    }
  }
  //addLabel：主要方法，用于添加文本标签到地图上。它根据popupType加载相应的Vue组件模板，创建Vue节点，渲染到DOM，并处理标签的位置、大小随视角变化的逻辑，以及添加场景渲染后的回调函数。
  async addLabel() {
    // 如果在模板中找不到对应的，直接返回
    if (!this.popupRoutes[this.popupType]) {
      return null;
    }
    const res = await this.popupRoutes[this.popupType]();
    //创建模板 label: this.properties.attr.label
    this.vmInstance = createVNode(res.default, {
      label: this.label,
      color: this.color,
      position: this.position,
      attr: this.attr,
      clickCallback: () => {
        this.showQueryPopup();
      },
      closePopup: () => {
        this.removeMarker();
      },
      fields: this.fields,
      values: this.values,
    }); //根据模板创建一个面板
    this.mountNode = document.createElement("div");
    render(this.vmInstance, this.mountNode);
    this.viewer.cesiumWidget.container.appendChild(this.mountNode); //将字符串模板生成的内容添加到DOM上
    this.addPostRender();
    this.vmInstance.el.style.display = this.isShow ? "block" : "none";
    return this.vmInstance.el;
  }
  //calcaluteGrade：计算根据距离的文本标签缩放等级。
  calcaluteGrade(curValue, stdNearFar) {
    let curPara = -1;
    if (curValue <= stdNearFar.near) {
      curPara = stdNearFar.nearValue;
    } else if (curValue >= stdNearFar.far) {
      curPara = stdNearFar.farValue;
    } else {
      const totalGrade = Math.ceil(
        Math.log(stdNearFar.far / stdNearFar.near) / Math.log(2)
      );
      const curGrade = Math.round(
        Math.log(curValue / stdNearFar.near) / Math.log(2)
      );
      curPara =
        stdNearFar.nearValue +
        ((stdNearFar.farValue - stdNearFar.nearValue) * curGrade) / totalGrade;
    }
    return curPara;
  }
  //addPostRender：添加场景的postRender事件监听器，用于实时更新标签位置和大小。
  //添加场景事件
  addPostRender() {
    this.viewer.scene.postRender.addEventListener(this.postRender, this);
  }
  //postRender：场景渲染后的回调函数，根据相机位置实时调整标签位置、大小和显示状态。
  //场景渲染事件 实时更新标签的位置 使其与笛卡尔坐标一致
  postRender() {
    if (!this.vmInstance.el || !this.vmInstance.el.style) return;
    const canvasHeight = this.viewer.scene.canvas.height;
    const windowPosition = new Cesium.Cartesian2();
    Cesium.SceneTransforms.wgs84ToWindowCoordinates(
      this.viewer.scene,
      this.position,
      windowPosition
    );
    this.vmInstance.el.style.bottom =
      canvasHeight - windowPosition.y + this.offset[1] + "px";
    const elWidth = this.vmInstance.el.offsetWidth;
    this.vmInstance.el.style.left =
      windowPosition.x - elWidth / 2 + this.offset[0] + "px";

    // 处理近大远小效果
    const cameraHeight = Math.ceil(
      this.viewer.camera.positionCartographic.height
    );
    const scaleSize = this.calcaluteGrade(cameraHeight, this.scaleByDistance);
    this.vmInstance.el.style.transform = `scale(${scaleSize},${scaleSize})`;

    // 只有当显示模式打开的时候，才进行优化
    if (this.isDisplay) {
      const condition1 =
        windowPosition.y < 0 || windowPosition.y > canvasHeight;
      const condition2 = this.viewer.camera.positionCartographic.height > 12000;
      const condition3 =
        windowPosition.x < 0 ||
        windowPosition.x > this.viewer.scene.canvas.width;
      if (condition1 || condition2 || condition3) {
        this.vmInstance.el.style.display = "none";
      } else {
        this.vmInstance.el.style.display = "block";
      }
    }
  }
  //removeMarker：移除标签及其相关的DOM元素和事件监听器。
  removeMarker() {
    this.mountNode &&
      this.viewer.cesiumWidget.container.removeChild(this.mountNode); //删除DOM
    this.viewer.scene.postRender.removeEventListener(this.postRender, this); //移除事件监听
    this.mountNode = null;
  }
}
export default SimpleLabel;
