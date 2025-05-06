<template>
  <div class="column-configer">
    <ul class="left">
      <div class="header">
        <el-input
          v-model="inputFieldName"
          clearable
          placeholder="请输入关键字"
          @input="handleInput"
        >
          <template #prefix>
            <i class="icon-search" style="color: var(--icon-btn-color)"></i>
          </template>
        </el-input>
      </div>

      <div class="module-list">
        <!-- 字段列表 -->
        <template v-if="validModuleList?.length">
          <template v-for="module in validModuleList" :key="module.key">
            <li
              :style="{
                backgroundColor: module.bgColor
              }"
              :class="[
                'module-item',
                module.isSecondaryGroup ? 'secondary' : ''
              ]"
            >
              <span class="module-item__name">{{ module.name }}</span>
              <ul v-if="module.fieldList.length" class="module-item__list">
                <template v-for="field in module.fieldList" :key="field.name">
                  <li v-if="!field.hidden" class="field-item">
                    <el-checkbox
                      :key="field.name"
                      v-model="field.checked"
                      class="ellipsis"
                      size="small"
                      :disabled="!field.enabled || field.fixed"
                      @change="clickMoudleField(field)"
                    >
                      <span v-title="field.name" class="field-item__name">
                        {{ field.name }}
                      </span>
                    </el-checkbox>
                    <el-tooltip
                      v-if="field.note && field.note !== field.name"
                      popper-class="xs-tips"
                      :popper-options="{
                        modifiers: [
                          {
                            name: 'flip',
                            options: {
                              fallbackPlacements: [
                                'top',
                                'bottom',
                                'right',
                                'left'
                              ]
                            }
                          }
                        ]
                      }"
                      :content="field.note"
                      placement="top"
                      :hide-after="0"
                      transition=""
                    >
                      <i
                        class="icon-explain field-item__tips"
                        style="margin-right: 4px"
                      ></i>
                    </el-tooltip>
                  </li>
                </template>
              </ul>
            </li>
          </template>
        </template>
        <template v-else-if="validModuleList?.length === 0">
          <div class="empty-box">
            <img width="425" src="/src/assets/images/Empty/nodata_page.svg" />
            <p class="msg">暂无相关数据</p>
          </div>
        </template>
      </div>

      <slot name="customField"></slot>
    </ul>
    <div class="right sort">
      <div class="sort__hd">
        <div class="opts">
          <span class="select-num">
            已选{{ seletedFieldCount }}/{{ sortNumberLimit }}
          </span>
          <span class="reset-btn" @click="resetSort">恢复默认</span>
          <span class="clear-btn" @click="clearAllFields">清空</span>
        </div>
        <div class="tips">拖动以下字段进行排序</div>
      </div>
      <div ref="dragWrapperRef" class="sort__bd">
        <draggable
          v-model="sortFieldList"
          class="sort-bd--content"
          item-key="key"
          v-bind="dragOptions"
          :move="onMove"
          @start="onDragStart"
          @end="onDragEnd"
        >
          <template #item="{ element }">
            <div
              class="sort-item"
              :class="{ 'sort-item--fixed': element.fixed }"
            >
              <i class="icon-dragTo"></i>
              <span v-title="element.name" class="sort-item__name ellipsis">
                {{ element.name }}
              </span>
              <i
                class="icon-cancel"
                @click="clickMoudleField(element, true)"
              ></i>
            </div>
          </template>
        </draggable>
      </div>
    </div>
  </div>
</template>

<script setup>
  import {
    computed,
    ref,
    defineExpose,
    nextTick,
    toRefs,
    onMounted
  } from 'vue';
  import _debounce from 'lodash/debounce';
  import draggable from 'vuedraggable';
  import { useTableColumnConfiger } from './useTableColumnConfiger.js';

  const props = defineProps({
    tableKey: {
      type: String,
      required: true
    },
    tower: {
      type: Boolean,
      default: false
    },
    // 是否是综合指标
    isIndicator: {
      type: Boolean,
      default: false
    },
    // 可排序数量需要减去固定字段的数量
    sortSubNumber: {
      type: Number,
      default: 0
    },
    // 自定义显示字段
    customDisplay: {
      type: Array,
      default: undefined
    }
  });

  const { tableKey, customDisplay } = toRefs(props);

  const {
    sortNumberLimit,
    moduleList,
    sortFieldList,
    seletedFieldCount,

    clickMoudleField,
    isSortChanged,
    clearAllFields,
    resetSort,
    hanldeBgColor,
    requestModuleData
  } = useTableColumnConfiger({
    tableKey,
    tower: props.tower,
    isIndicator: props.isIndicator,
    sortSubNumber: props.sortSubNumber,
    customDisplay
  });

  // 过滤字段输入框--绑定的值
  const inputFieldName = ref('');

  const validModuleList = computed(() => {
    // 第一次请求数据时处理为null，不渲染无数据icon
    if (!moduleList.value?.length) return null;
    let list = moduleList.value.filter(
      ({ fieldList, isSecondaryGroup, subGroup }) => {
        // 当前模块是否有可见的字段
        const curModuleVisible =
          fieldList.filter(field => !field.hidden).length > 0;

        // 当前模块可见，直接返回
        if (curModuleVisible) return true;

        // 当前模块不可见，且是子模块，直接返回
        if (isSecondaryGroup) return false;

        // 当前模块不可见，是主模块，判断子模块是否有可见的字段
        const subGroups = moduleList.value.filter(
          ({ isSecondaryGroup, group }) =>
            isSecondaryGroup && group === subGroup
        );
        return subGroups.some(({ fieldList }) => {
          return fieldList.filter(field => !field.hidden).length > 0;
        });
      }
    );
    hanldeBgColor(list);
    return list;
  });

  // 过滤处理函数
  const filterSortFieldListFn = () => {
    // 搜索内容
    const search = inputFieldName.value.toLowerCase();
    moduleList.value.forEach(({ fieldList }) => {
      // 字段名匹配
      fieldList.forEach(field => {
        // 字段名匹配
        const haveFieldName =
          field.name.toLowerCase().includes(search) ||
          field.pinyin.fullPinyin.includes(search) ||
          field.pinyin.initials.includes(search);
        field.hidden = !haveFieldName;
      });
    });
  };

  const filterFnWithDebounce = _debounce(filterSortFieldListFn, 100);

  const handleInput = () => {
    inputFieldName.value = inputFieldName.value.trim();
    filterFnWithDebounce();
  };

  // draggable option 参数：http://www.sortablejs.com/options.html
  const dragOptions = ref({
    animation: 200,
    disabled: false,
    ghostClass: 'ghost', // drop placeholder的css类名
    filter: '.sort-item--fixed' // 过滤器，不需要进行拖动的元素
  });

  const dragWrapperRef = ref(null);
  // 被拖动前的index位置
  let lastIndex = ref(-1);
  const onDragStart = ({ oldDraggableIndex }) => {
    lastIndex.value = oldDraggableIndex;
  };

  const onDragEnd = () => {
    lastIndex.value = -1;
    dragWrapperRef?.value.querySelectorAll('.sort-item').forEach(item => {
      item.classList.remove('last');
    });
  };

  // 正在移动：忽略固定位置项
  const onMove = evt => {
    nextTick(() => {
      const dom = dragWrapperRef?.value.querySelector(
        `.sort-item:nth-child(${lastIndex.value + 1})`
      );
      dom.classList.add('last');
    });

    return evt.related.className.indexOf('sort-item--fixed') === -1;
  };

  onMounted(requestModuleData);

  // ********************************** expose **********************************
  defineExpose({
    getSeletedFieldCount: () => seletedFieldCount.value,
    getSelectedFields: () => sortFieldList.value.map(item => item.key),
    getSelectedFieldItems: () => [...sortFieldList.value],
    isSortChanged,
    requestModuleData
  });
</script>

<style lang="scss" scoped>
  .column-configer {
    display: flex;

    .left {
      flex: 1;
      width: 0;
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #fff;
      .header {
        padding: 12px 24px;
        display: flex;
        align-items: center;

        .name-switch {
          width: 256px;
          height: 25px;
          margin-right: 32px;
          display: flex;
          align-items: center;
          .name {
            font-size: 16px;
            font-weight: 700;
          }
        }
        .search-input {
          :deep(.el-input) {
            width: 164px;
            height: 24px;
            .el-input__inner {
              height: 24px;
              padding: 10px 26.5px 10px 8px;
              width: 136px;
            }
            .el-input-group__append {
              width: 28px;
              .search-icon-wrapper {
                width: 100%;
              }
            }
          }
        }
      }

      .module-list {
        flex: 1 1 0%;
        overflow: auto;
        scrollbar-gutter: stable;
      }
      .module-item {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        padding: 16px 24px;
        &.secondary {
          padding-top: 0;
          margin-top: -8px;
          .module-item__name {
            margin-left: 10px;
            font-size: 12px;
            font-weight: 400;
          }
        }

        &__name {
          height: 18px;
          line-height: 15px;
          color: #000;
          font-size: 14px;
          font-weight: 700;
        }

        &__list {
          width: 100%;
          padding-left: 8px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          column-gap: 16px;

          .field-item {
            display: inline-flex;
            flex-direction: row;
            align-items: center;
            height: 30px;
            :deep(.el-checkbox__label) {
              text-overflow: ellipsis;
              overflow: hidden;
              white-space: nowrap;
            }

            &__name {
              font-size: 12px;
              color: #595959;
              line-height: 16px;
            }

            &__tips {
              margin: 0 4px;
              font-size: 14px;
              color: var(--text-tblight-color);
              position: relative;
              top: 1px;
            }
          }
        }
      }
      .empty-box {
        margin-top: 40px;
        display: flex;
        flex-direction: column;
        align-items: center;
        .msg {
          font-family: 'Microsoft YaHei UI';
          font-style: normal;
          font-weight: 400;
          font-size: 14px;
          line-height: 18px;
          text-align: center;
          color: #8c8c8c;
        }
      }
    }

    .right {
      padding: 16px;
      width: 180px;
      display: flex;
      flex-direction: column;
      background: #f3f6ff;

      .sort__hd {
        font-size: 12px;
        line-height: 15px;
        margin-bottom: 16px;
        .opts {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;

          .select-num {
            color: #5a5a5a;
          }
          .reset-btn,
          .clear-btn {
            color: var(--main-color);
            cursor: pointer;
          }
          .reset-btn {
            margin-left: auto;
          }
          .clear-btn {
            margin-left: 4px;
          }
        }
        .tips {
          color: #bfbfbf;
        }
      }

      .sort__bd {
        flex: 1;
        height: 0;
        position: relative;

        .sort-bd--content {
          width: 100%;
          height: 100%;
          overflow: auto;
          .sort-item {
            display: flex;
            flex-direction: row;
            align-items: center;
            padding: 0 3px;
            height: 28px;
            margin-bottom: 8px;
            background-color: #fff;
            border: 1px solid transparent;
            border-radius: 2px;
            box-shadow: 0px 1px 2px rgba(47, 108, 246, 0.06);
            &:hover {
              border: 1px solid var(--main-color);
              .icon-cancel {
                opacity: 1;
              }
            }

            &.last:hover {
              border: none !important;
              .icon-cancel {
                opacity: 0;
              }
            }

            &__name {
              flex: 1 1 0%;
              padding: 0 4px;
              font-size: 12px;
              color: #000;
              cursor: move;
            }

            &--fixed {
              opacity: 0.45;
              cursor: not-allowed;
            }

            i {
              font-size: 14px;
              color: var(--border-color);
            }

            .icon-dragTo {
              cursor: move;
            }
            .icon-cancel {
              opacity: 0;
              cursor: pointer;
              margin-left: auto;
              color: #8c8c8c;
            }
          }
        }
      }
    }
  }
</style>
