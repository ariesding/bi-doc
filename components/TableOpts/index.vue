<!-- 页脚组件 -->
<template>
  <div class="table-opts">
    <slot></slot>
    <template
      v-if="
        props.showOpts && props.showOptTypes.length && finalOptTypes?.length
      "
    >
      <div
        ref="optWrapperRef"
        class="opts-wrapper"
        :class="[
          finalPlacement && 'opts-wrapper--placement',
          finalPlacement && `opts-wrapper--placement-${finalPlacement}`
        ]"
        :style="{
          left: offsetRight
            ? ''
            : finalPlacement === 'center'
            ? '100%'
            : offsetLeft,
          right: offsetRight,
          backgroundColor: customBackgroudColor
        }"
      >
        <template v-for="optType in finalOptTypes" :key="optType.type">
          <button
            v-if="!optType.children?.length"
            :class="['opt-btn', optType.className || 'default']"
            @click.stop="clickOpt(row, optType.type)"
          >
            {{ optTypeNameForValue(optType.type) }}
            <img v-if="optType.link" :src="optType.link" alt="" />
          </button>

          <!-- 带下拉选择的 -->
          <el-popover
            v-if="optType.children?.length"
            placement="bottom"
            popper-class="more-opts-popover"
            trigger="hover"
            :offset="2"
            :show-arrow="false"
            :hide-after="0"
            :popper-options="{
              modifiers: [
                { name: 'preventOverflow', options: { altAxis: true } },
                {
                  name: 'flip',
                  options: { fallbackPlacements: ['right', 'left'] }
                }
              ]
            }"
          >
            <!-- 触发按钮 -->
            <template #reference>
              <button
                :class="['opt-btn', optType.className || 'default']"
                @mouseenter="mouseEnterMoreOpts"
                @mouseleave="mouseLeaveMoreOpts"
                @click.stop
              >
                {{ optTypeNameForValue(optType.type) }}
                <img v-if="optType.link" :src="optType.link" alt="" />
              </button>
            </template>

            <!-- 任务 有选项 需要特殊处理 -->
            <ul
              class="opt-btn__dropdown"
              @mouseenter="mouseEnterMoreOpts"
              @mouseleave="mouseLeaveMoreOpts"
            >
              <div class="opt-btn__dropdown-content">
                <template
                  v-for="(item, index) in optType.children"
                  :key="item.type + index"
                >
                  <div v-if="item.type === 'line'" class="opt-btn-line"></div>
                  <div
                    v-else
                    class="opt-btn-item"
                    @click.stop="clickOpt(row, item.type)"
                  >
                    {{ item.name }}
                  </div>
                </template>
              </div>
            </ul>
          </el-popover>
        </template>
      </div>
    </template>

    <!-- 商品打标 -->
    <GoodsFlagConfigDialog
      v-if="goodsFlagDialogVisible"
      :goods="row"
      @cancel="goodsFlagDialogVisible = false"
      @confirm="confirmGoodsFlagDialog"
    />

    <!-- 商品标签管理 -->
    <!-- <GoodsFlagManageDrawer
      v-if="goodsFlagManageVisible"
      @close="goodsFlagManageVisible = false"
    /> -->

    <!-- 店铺打标 -->
    <ShopFlagConfigDialog
      v-if="shopFlagDialogVisible"
      :shop="row"
      @cancel="shopFlagDialogVisible = false"
      @confirm="confirmShopFlagDialog"
    />

    <!-- 店铺标签管理 -->
    <!-- <ShopFlagManageDrawer
      v-if="shopFlagManageVisible"
      @close="shopFlagManageVisible = false"
    /> -->

    <!-- 渠道目标 -->
    <PlatformTargetManageDrawer
      v-if="platformTargetDrawerVisible"
      v-model:visible="platformTargetDrawerVisible"
      :channel="row"
      @update-target="onSaveTarget"
    />

    <!-- 商品目标 -->
    <GoodsTargetManageDrawer
      v-if="goodsTargetDrawerVisible"
      v-model:visible="goodsTargetDrawerVisible"
      :goods="row"
      :prop="prop"
      @update-target="onSaveTarget"
    />

    <!-- 店铺目标 -->
    <StoreTargetManageDrawer
      v-if="storeTargetDrawerVisible"
      v-model:visible="storeTargetDrawerVisible"
      :store="row"
      @update-target="onSaveTarget"
    />
    <!-- 类目目标 -->
    <CategoryTargetManageDrawer
      v-if="categoryTargetDrawerVisible"
      v-model:visible="categoryTargetDrawerVisible"
      :cate="row"
      :shop-id="shopId"
      :platform="platform"
      @update-target="onSaveTarget"
    />

    <!-- 货品打标 -->
    <HpFlagConfigDialog
      v-if="hpFlagDialogVisible"
      :hp="row"
      @cancel="hpFlagDialogVisible = false"
      @confirm="confirmHpFlagDialog"
    />

    <!-- 新建标准任务 -->
    <StandardTask
      v-if="standardTaskVisible"
      v-model:visible="standardTaskVisible"
      :task="{
        taskGoodsInfo: {
          ...row,
          goodsType: row.isSpu ? 1 : 0
        }
      }"
      @update-goods-task="onUpdateTask"
    />

    <!-- 新建流程任务 -->
    <FlowTask
      v-if="flowTaskVisible"
      v-model:visible="flowTaskVisible"
      :task="{
        taskGoodsInfo: {
          ...row,
          goodsType: row.isSpu ? 1 : 0
        }
      }"
      @update-goods-task="onUpdateTask"
    />

    <!-- 全部任务 -->
    <AllTask
      v-if="allTaskVisible"
      v-model:visible="allTaskVisible"
      :goods="{
        ...row,
        goodsType: row.isSpu ? 1 : 0
      }"
      @update-goods-task="onUpdateTask"
    />

    <!-- 货品标签管理 -->
    <!-- <HpFlagManageDrawer
      v-if="hpFlagManageVisible"
      @close="hpFlagManageVisible = false"
    /> -->

    <!-- 商品警戒值 -->
    <GoodsThresholdDrawer
      v-if="goodsThresholdVisible"
      :goods="row"
      @confirm="confirmGoodsThreshold"
      @close="goodsThresholdVisible = false"
    />
  </div>
</template>

<script setup>
  import { ref, computed, onBeforeUnmount } from 'vue';
  import { OPT_TYPE, OPT_TYPE_CHILD, optTypeNameForValue } from './config';
  import {
    GoodsTargetManageDrawer,
    PlatformTargetManageDrawer,
    StoreTargetManageDrawer,
    CategoryTargetManageDrawer
  } from '../TargetManageDrawer';
  import GoodsFlagConfigDialog from '@/components/Flag/GoodsFlag/GoodsFlagConfigDialog.vue';
  // import GoodsFlagManageDrawer from '@/components/Flag/GoodsFlag/GoodsFlagManageDrawer.vue';
  // import ShopFlagManageDrawer from '@/components/Flag/ShopFlag/ShopFlagManageDrawer.vue';
  import useGoodsFlagConfig from '@/components/Flag/GoodsFlag/useGoodsFlagConfig';
  import ShopFlagConfigDialog from '@/components/Flag/ShopFlag/ShopFlagConfigDialog.vue';
  import useShopFlagConfig from '@/components/Flag/ShopFlag/useShopFlagConfig';
  import LINK from '@img/WorkTable/DemandInsight/white_link.svg';
  import { useUserStore } from '@/store/useUser';
  import HpFlagConfigDialog from '@/components/Flag/HpFlag/HpFlagConfigDialog.vue';
  // import HpFlagManageDrawer from '@/components/Flag/HpFlag/HpFlagManageDrawer.vue';
  import useHpFlagConfig from '@/components/Flag/HpFlag/useHpFlagConfig';
  import StandardTask from '@/views/task/components/standardTask.vue';
  import FlowTask from '@/views/task/components/flowTask.vue';
  import AllTask from '@/views/task/components/AllTask.vue';

  import { GoodsThresholdDrawer } from '@/components/GoodsThreshold';

  const props = defineProps({
    // 商品信息
    row: { type: Object, default: () => ({}) },
    // 是否显示
    showOpts: { type: Boolean, default: true },
    // 显示的操作类型
    showOptTypes: { type: Array, default: () => [] },
    // 操作类型是否使用内部默认排序
    useInnerSort: { type: Boolean, default: true },
    // 自定义显示位置（目前只适配了表格）： top center bottom
    placement: { type: String, default: '' },
    // 显示的位置left
    offsetLeft: { type: String, default: '11px' },
    // 显示的位置right
    offsetRight: { type: String, default: '' },
    // hover自定义背景色
    customBackgroudColor: { type: String, default: '' },
    // 商品属性映射（用于商品目标）
    prop: { type: Object, default: () => ({}) },
    // 店铺id
    shopId: { type: String, default: '' },
    // 平台
    platform: { type: String, default: '' }
  });

  const emit = defineEmits([
    'on-click-opt',
    'on-goods-flag-change',
    'on-shop-flag-change',
    'on-hp-flag-change',
    'update-target',
    'update:row-hover',
    'update:has-task',
    'on-goods-threshold-change'
  ]);

  const { userInfo } = useUserStore();
  const payType = Number(userInfo?.payType);

  const onSaveTarget = () => {
    emit('update-target');
  };

  const onUpdateTask = val => {
    emit('update:has-task', val);
  };

  // 按钮顺序：运营分析/全景分析/跟进/目标/打标
  const orderedOptTypes = [
    { type: OPT_TYPE.detail },
    { type: OPT_TYPE.personTarget },
    { type: OPT_TYPE.checkProfitRule },
    { type: OPT_TYPE.teamTarget },
    { type: OPT_TYPE.goodsPanorama },
    { type: OPT_TYPE.goodsOperation },
    { type: OPT_TYPE.hpPanorama },
    { type: OPT_TYPE.followup },
    { type: OPT_TYPE.mark },
    { type: OPT_TYPE.goodsTarget },
    { type: OPT_TYPE.categoryTarget },
    { type: OPT_TYPE.shopMark },
    { type: OPT_TYPE.shopTarget },
    { type: OPT_TYPE.platformTarget },
    { type: OPT_TYPE.goodsThreshold },
    { type: OPT_TYPE.hpMark },
    { type: OPT_TYPE.trend },
    { type: OPT_TYPE.salesTrend },
    { type: OPT_TYPE.category },
    { type: OPT_TYPE.calculation },
    { type: OPT_TYPE.profitCalculation },
    { type: OPT_TYPE.searchTrend },
    { type: OPT_TYPE.battlefieldSand },
    { type: OPT_TYPE.competitiveAnalysis },
    { type: OPT_TYPE.soaringMarket },
    { type: OPT_TYPE.keywordCloud },
    { type: OPT_TYPE.view },
    { type: OPT_TYPE.progress },
    { type: OPT_TYPE.calculated },
    { type: OPT_TYPE.categoryLayout },
    { type: OPT_TYPE.categoryLayouted },
    { type: OPT_TYPE.addChooseGoods },
    { type: OPT_TYPE.delChooseGoods, className: 'notice' },
    { type: OPT_TYPE.addChooseWords },
    { type: OPT_TYPE.delChooseWords, className: 'notice' },
    { type: OPT_TYPE.setSelf },
    { type: OPT_TYPE.setCompetitive, className: 'notice' },
    { type: OPT_TYPE.trend2 },
    { type: OPT_TYPE.hotGoodsPlan },
    { type: OPT_TYPE.demandTrend },
    { type: OPT_TYPE.goodsStyle },
    { type: OPT_TYPE.supplyChain, link: LINK },
    { type: OPT_TYPE.follower },
    { type: OPT_TYPE.share },
    {
      type: OPT_TYPE.task,
      children: OPT_TYPE_CHILD.task
    }
  ];

  // 排过序显示的按钮
  const finalOptTypes = computed(() => {
    let optTypes = [...props.showOptTypes];
    optTypes = optTypes.map(k => {
      return {
        type: k.type || k,
        className: k.className || ''
      };
    });

    // 跟进按钮显示逻辑：边界版本和俱乐部版本 不显示跟进按钮,
    // payType等于9，代表边界版本；payType等于3，代表俱乐部版本；
    if ([3, 9].includes(payType)) {
      optTypes = optTypes.filter(item => item !== OPT_TYPE.followup);
    }

    if (props.useInnerSort) {
      return orderedOptTypes.filter(k =>
        optTypes.map(j => j.type).includes(k.type)
      );
    }

    return optTypes;
  });

  // 最终的显示位置
  const finalPlacement = computed(() => {
    if (props.placement) return props.placement;
    if (finalOptTypes.value?.length < 3) return 'center';
    return '';
  });

  // 打标相关管理
  const {
    goodsFlagDialogVisible,
    confirmGoodsFlagDialog
    // goodsFlagManageVisible,
    // onGoodsFlagManageClick
  } = useGoodsFlagConfig({
    confirmCb: flag => {
      emit('on-goods-flag-change', flag);
    }
  });
  const {
    shopFlagDialogVisible,
    confirmShopFlagDialog
    // shopFlagManageVisible,
    // onShopFlagManageClick
  } = useShopFlagConfig({
    confirmCb: name => {
      emit('on-shop-flag-change', name);
    }
  });
  const {
    hpFlagDialogVisible,
    confirmHpFlagDialog
    // hpFlagManageVisible,
    // onHpFlagManageClick
  } = useHpFlagConfig({
    confirmCb: name => {
      emit('on-hp-flag-change', name);
    }
  });

  // 店铺目标管理抽屉
  const storeTargetDrawerVisible = ref(false);
  const goodsTargetDrawerVisible = ref(false);

  // 渠道目标抽屉
  const platformTargetDrawerVisible = ref(false);
  // 类目目标抽屉
  const categoryTargetDrawerVisible = ref(false);
  const targetModel = ref({});

  // 新建标准任务
  const standardTaskVisible = ref(false);
  // 新建流程任务
  const flowTaskVisible = ref(false);
  // 全部任务
  const allTaskVisible = ref(false);

  // 离开下来按钮,延时关闭,如果进入下拉菜单按钮则清除延时
  let mouseLeaveMoreOptsTimeout;
  // 下来按钮hover事件
  const mouseEnterMoreOpts = () => {
    clearTimeout(mouseLeaveMoreOptsTimeout);
    emit('update:row-hover', true);
  };
  const mouseLeaveMoreOpts = () => {
    mouseLeaveMoreOptsTimeout = setTimeout(() => {
      emit('update:row-hover', false);
    }, 100);
  };

  // 商品警戒值
  const goodsThresholdVisible = ref(false);
  const confirmGoodsThreshold = () => {
    goodsThresholdVisible.value = false;
    emit('on-goods-threshold-change');
  };

  // 点击操作
  const clickOpt = (row, optType) => {
    // 商品打标
    if (optType === OPT_TYPE.mark) {
      goodsFlagDialogVisible.value = true;
      return;
    }
    // 店铺打标
    if (optType === OPT_TYPE.shopMark) {
      shopFlagDialogVisible.value = true;
      return;
    }
    // 货品打标
    if (optType === OPT_TYPE.hpMark) {
      hpFlagDialogVisible.value = true;
      return;
    }
    // 商品目标
    if (optType === OPT_TYPE.goodsTarget) {
      goodsTargetDrawerVisible.value = !goodsTargetDrawerVisible.value;
      targetModel.value = { ...props.row };
      return;
    }
    // 店铺目标
    if (optType === OPT_TYPE.shopTarget) {
      storeTargetDrawerVisible.value = !storeTargetDrawerVisible.value;
      targetModel.value = { ...props.row };
      return;
    }
    // 渠道目标
    if (optType === OPT_TYPE.platformTarget) {
      platformTargetDrawerVisible.value = !platformTargetDrawerVisible.value;
      targetModel.value = { ...props.row };
      return;
    }
    // 类目目标
    if (optType === OPT_TYPE.categoryTarget) {
      categoryTargetDrawerVisible.value = !categoryTargetDrawerVisible.value;
      targetModel.value = { ...props.row };
      return;
    }
    // 新建标准任务
    if (optType === OPT_TYPE.createStandardTask) {
      standardTaskVisible.value = !standardTaskVisible.value;
      return;
    }
    // 新建流程任务
    if (optType === OPT_TYPE.createFlowTask) {
      flowTaskVisible.value = !flowTaskVisible.value;
      return;
    }
    // 全部任务
    if (optType === OPT_TYPE.allTask) {
      allTaskVisible.value = !allTaskVisible.value;
      return;
    }

    // 商品警戒值
    if (optType === OPT_TYPE.goodsThreshold) {
      goodsThresholdVisible.value = true;
    }

    // 个人目标 先在 团队总览 团队成员中单独处理 要提取公共的可后期迁移
    // 团队目标 先在 团队总览 团队列表中单独处理 要提取公共的可后期迁移

    emit('on-click-opt', row, optType);
  };

  onBeforeUnmount(() => {
    clearTimeout(mouseLeaveMoreOptsTimeout);
  });
</script>

<style lang="scss" scoped>
  .table-opts {
    &:hover {
      .opts-wrapper {
        visibility: visible;
      }
    }

    // 按钮组默认显示在行中
    .opts-wrapper {
      position: absolute;
      margin: 0;
      top: 0;
      bottom: 0;
      padding: 3px 4px;
      border-width: 0;
      display: flex;
      align-items: center;

      font-size: 0;
      z-index: 9;
      visibility: hidden;
      background-color: var(--el-table-row-hover-bg-color);

      .opt-btn {
        padding: 0 8px;
        height: 24px;
        line-height: 24px;
        white-space: nowrap;
        font-size: 12px;
        text-align: center;
        user-select: none;
        border-radius: 2px;
        border: none;
        outline: none;
        cursor: pointer;
        color: var(--text-white-color);
        display: flex;
        align-items: center;
        position: relative;

        > img {
          margin-left: 4px;
        }

        &.default {
          background: var(--main-color);
          &:hover {
            background: #2351b9;
          }

          &:active {
            background: #1a3b87;
          }
        }

        &.notice {
          background: #bd4206;
          &:hover {
            background: #8e3104;
          }

          &:active {
            background: #682403;
          }
        }

        &:not(:first-child) {
          margin-left: 4px !important;
        }
      }
    }
  }
</style>

<style lang="scss">
  .xs-table-wrapper .xs-table .el-table__inner-wrapper .el-table__body-wrapper {
    .el-table__row {
      // hover表格行，显示按钮组
      &:hover,
      &.tr-row-hover {
        .el-table__cell {
          @for $i from 1 through 5 {
            &:nth-child(#{$i}) {
              z-index: #{8 - $i};
              .opts-wrapper {
                visibility: visible;
              }
            }
          }
        }
      }

      .el-table__cell {
        @for $i from 1 through 5 {
          &:nth-child(#{$i}) {
            z-index: #{7 - $i};
          }
        }
      }

      // 按钮组显示在上方
      .opts-wrapper--placement-top {
        top: unset;
        bottom: 100%;
        padding: 3px 4px 0;
        border-width: 1px 1px 0 1px;
      }

      // 按钮组显示在下方
      .opts-wrapper--placement-bottom {
        top: 100%;
        bottom: unset;
        border: 1px solid var(--border-color);
        border-width: 0 1px 1px 1px;
      }

      // 按钮组显示在表格行中
      .opts-wrapper--placement-center {
        top: unset;
        top: 0;
        bottom: 0;
        padding: 3px 4px;
        border-width: 0;
      }

      // 表格中，按钮组默认显示在下方
      .el-table__cell {
        .opts-wrapper:not(.opts-wrapper--placement) {
          @extend .opts-wrapper--placement-bottom;
        }
      }

      // 表格最后一行，按钮组显示在上面
      &:not(:first-child):last-child {
        .el-table__cell {
          .opts-wrapper:not(.opts-wrapper--placement) {
            @extend .opts-wrapper--placement-top;
          }
        }
      }

      // 表格只有一行，按钮组显示在表格行中
      &:only-child {
        .el-table__cell {
          .opts-wrapper:not(.opts-wrapper--placement) {
            @extend .opts-wrapper--placement-center;
          }
        }
      }
    }
  }

  .el-popper.more-opts-popover {
    padding: 0 !important;
    min-width: 60px !important;
    border: none !important;
    border-radius: 2px;
    z-index: 3 !important;
    background: transparent;
    box-shadow: none;

    .opt-btn__dropdown {
      padding-top: 4px;
      .opt-btn__dropdown-content {
        background: #fff;
        box-shadow: 0px 0px 12px 0px #0000001f;
        padding: 8px 0;
        border-radius: 2px;

        .opt-btn-item {
          line-height: 32px;
          min-width: 116px;
          font-size: 14px;
          color: #000;
          padding-left: 16px;
          text-align: left;
          cursor: pointer;

          &:hover {
            color: var(--main-color);
            background: #e2eeff;
          }
        }
        .opt-btn-line {
          width: calc(100% - 32px);
          margin: 8px 16px;
          height: 1px;
          background: var(--border-color);
        }
      }
    }
  }
</style>
