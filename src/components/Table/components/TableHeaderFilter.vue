<template>
  <div
    style="width: 100%; overflow: hidden"
    class="TableHeaderFilterElContainer"
  >
    <!-- thead 上方的元素容器的项目 S -->
    <div
      style="display: flex; flex-direction: row; position: relative"
      :style="{ left: `-${scrollLeft}px`, width: headerWidth }"
      class="TableHeaderFilterElChild"
    >
      <div
        v-for="(item, index) in tHeadColumns"
        :key="item.prop"
        class="top-filter-item"
        :class="[
          item.className,
          checkLastFixedLeft(item, index) && `last-fixed-left`,
          checkFirstFixedRight(item, index) && `first-fixed-right`
        ]"
        :style="{
          width: colWidthArr[index] + 'px',
          align: item?.align,
          position: item.fixed ? 'sticky' : 'relative',
          left: item.fixed === 'left' && item?.left + 'px',
          right: item.fixed === 'right' && 0,
          zIndex: item.zIndex || (item.fixed && 9),
          textAlign: item?.align,
          background: item.backgroundColor
        }"
      >
        <div v-if="item.topFilter?.slot">
          <slot :name="item.topFilter?.slot" :column="item"></slot>
        </div>
        <div
          v-if="item.topFilter?.type === 'input'"
          class="top-filter-input__wrapper"
          :class="{
            'top-filter-input__wrapper-suffix': !!item.topFilter?.suffix,
            'no-margin': !!item.topFilter?.label
          }"
        >
          <span v-if="item.topFilter.label">
            <span v-if="!item.topFilter.tips">
              {{ item.topFilter.label }}
            </span>
            <span v-if="item.topFilter.tips">
              <el-tooltip
                effect="dark"
                :content="item.topFilter.tips"
                placement="top"
              >
                <span class="tip_line">{{ item.topFilter.label }}</span>
              </el-tooltip>
            </span>
          </span>

          <input
            v-model="item.topFilter.modelValue"
            class="top-filter-input"
            type="text"
            @blur="topFilterInputBlur(item.topFilter)"
          />
        </div>
        <div
          v-if="item.topFilter?.type === 'plainLabel'"
          class="top-filter-label__wrapper"
          :class="item.topFilter.className"
        >
          <template v-if="item.topFilter.label">
            <TextOverTooltip :title="item.topFilter.label" is-native-title>
              <span
                v-if="item.topFilter.renderLabel"
                :style="item.topFilter.style"
              >
                <XSRenderHelper
                  :content="item.topFilter.renderLabel({ ...item.topFilter })"
                />
              </span>
              <span v-else :style="item.topFilter.style">
                {{
                  item.topFilter.renderLabel
                    ? item.topFilter.renderLabel()
                    : item.topFilter.label
                }}
              </span>
            </TextOverTooltip>
          </template>
          <template v-else>
            <span>筛选值:</span>
            <p>默认为平均值</p>
          </template>
        </div>
      </div>
      <div
        v-if="isShowMaster"
        class="TableHeaderFilterElChildMaster"
        :style="{ background: masterBackground }"
      ></div>
    </div>

    <!-- thead 上方的元素容器的项目 E -->
  </div>
</template>
<script setup>
  import { defineProps, watch, ref } from 'vue';
  import TextOverTooltip from '@/components/TextOverTooltip/index.vue';
  import XSRenderHelper from '@/components/RenderHelper.vue';
  const props = defineProps({
    tHeadColumns: {
      type: Array,
      default() {
        return [];
      }
    },
    headerWidth: {
      type: [Number, String],
      default: ''
    },
    colWidthArr: {
      type: Array,
      default() {
        return [];
      }
    },
    scrollLeft: {
      type: [Number, String],
      default: 0
    },
    checkLastFixedLeft: {
      type: Function,
      default: () => {}
    },
    checkFirstFixedRight: {
      type: Function,
      default: () => {}
    },
    initTableState: {
      type: Boolean,
      default: true
    },
    masterBackground: {
      type: String,
      default: 'rgba(0,0,0,0)'
    },
    // table外部传入的数据源
    data: {
      type: Array,
      default: () => []
    }
  });
  const isShowMaster = ref(props.initTableState);
  watch(
    () => {
      return props.initTableState;
    },
    newval => {
      setTimeout(() => {
        isShowMaster.value = newval;
      }, 0);
    }
  );
  watch(
    () => {
      return props.data;
    },
    () => {
      setTimeout(() => {
        isShowMaster.value = false;
      }, 0);
    }
  );

  // 筛选值鼠标失焦执行 格式化数据
  const topFilterInputBlur = item => {
    if (!item.modelValueType) return;

    // 浮点数
    if (item.modelValueType === 'float') {
      let val = item.modelValue.replace(/[^\d.]/g, '');
      val = parseFloat(val).toFixed(2);
      val = val || val === 0 ? val.toString() : '';
      if (Number.isNaN(+val)) val = '0.00';
      item.modelValue = val;
    }
    // 整数
    if (item.modelValueType === 'int') {
      let val = item.modelValue.replace(/[^\d]/g, '');
      val = parseInt(val);
      val = val || val === 0 ? val.toString() : '';
      if (Number.isNaN(+val)) val = '0';
      item.modelValue = val;
    }
  };
</script>
<style lang="scss">
  .TableHeaderFilterElContainer {
    position: relative;
    &::before {
      content: '';
      top: 0;
      left: 0;
      width: 1px;
      height: 100%;
      z-index: 11;
      position: absolute;
      background-color: var(--el-table-border-color);
    }
    &::after {
      content: '';
      top: 0;
      right: 0;
      width: 1px;
      height: 100%;
      z-index: 11;
      position: absolute;
      background-color: var(--el-table-border-color);
    }

    .TableHeaderFilterElChild {
      position: relative;
      .TableHeaderFilterElChildMaster {
        position: absolute;
        top: 0;
        left: 0;
        height: 42px;
        width: 100%;
        z-index: 9;
      }
    }
  }
</style>
