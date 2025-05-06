<!-- table字段配置项抽屉组件 -->
<template>
  <el-drawer
    ref="drawerRef"
    v-model="showDrawerDelegate"
    :with-header="false"
    :append-to-body="true"
    :custom-class="customClass"
    :lock-scroll="true"
    :size="800"
    :close-on-click-modal="false"
    :destroy-on-close="true"
    :before-close="confirmBeforeClose"
  >
    <div class="page custom-view-manager">
      <div class="page__hd">
        <p class="page__title" @dblclick="clickAllFields">
          {{ isIndicator ? '设定指标' : '自定义数据字段' }}
          <span>（{{ seletedFieldCount }}/{{ sortNumberLimit }}）</span>
        </p>
        <i class="page__close icon-cancel" @click="close"></i>
      </div>

      <div v-if="!isLoading" class="page__bd">
        <ul class="page-bd__left">
          <!-- 只有我的项目里面的表格才有切换模板这个功能 -->
          <div v-if="isProject" class="header">
            <div class="name-switch">
              <WindowSelector
                v-show="!hideWindowSelector"
                :table-key="tableId"
                :show-scmb="showScmb"
                :column-key="columnKey"
                :tower="tower"
                :height="24"
                :operational="false"
                panel-align="left"
                style="margin-right: 12px"
                @change="onTemplateChange"
              >
                <template #trigger="triggerData">
                  <SwitchWindowBtn v-bind="triggerData" />
                </template>
              </WindowSelector>

              <!-- 模板名称 -->
              <TextOverTooltip
                v-if="!isIndicator"
                :title="templateFullName"
                is-native-title
              >
                <span class="name">
                  {{ templateFullName }}
                </span>
              </TextOverTooltip>
            </div>

            <el-input
              v-model="inputFieldName"
              clearable
              placeholder="请输入关键字"
              class="search-input"
              @input="handleInput"
            >
              <template #prefix>
                <i class="icon-search" style="color: var(--icon-btn-color)"></i>
              </template>
            </el-input>
          </div>
          <div v-else style="height: 16px"></div>

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
                    <template
                      v-for="field in module.fieldList"
                      :key="field.name"
                    >
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
                <img
                  width="425"
                  src="/src/assets/images/Empty/nodata_page.svg"
                />
                <p class="msg">暂无相关数据</p>
              </div>
            </template>
          </div>

          <slot name="customField"></slot>
        </ul>
        <div class="page-bd__right sort">
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
      <div v-else v-xs-loading="isLoading" class="page__bd"></div>
      <div class="page__ft">
        <div>
          <XSButton
            :normal="true"
            :style="{ marginLeft: '16px' }"
            @click="confirmSort"
          >
            确定
          </XSButton>
          <XSButton
            :plain="true"
            :width="'64'"
            :style="{ marginLeft: '16px' }"
            @click="close"
          >
            取消
          </XSButton>
        </div>

        <div v-if="isProject && !hideWindowSelector">
          <div class="save-as-btn" @click="saveToPersonWindow">
            <i class="icon-lingcunwei"></i>
            保存至个人视窗
          </div>
          <div
            v-if="isAdmin"
            class="save-as-btn"
            @click="showSaveToEnterpriseDialog = true"
          >
            <i class="icon-lingcunwei"></i>
            保存至企业视窗
          </div>
        </div>
      </div>
    </div>

    <SaveToEnterpriseWindowDialog
      v-if="showSaveToEnterpriseDialog"
      @close="showSaveToEnterpriseDialog = false"
      @confirm="onSaveToEnterpriseConfirm"
    />
  </el-drawer>
</template>

<script setup>
  import MessageBox from '@/components/ConfirmDialog/Confirm';
  import { computed, nextTick, ref, toRefs, watch } from 'vue';
  import draggable from 'vuedraggable';
  import { useTableColumnConfiger } from './useTableColumnConfiger.js';
  import { ElMessage } from 'element-plus';
  import { useRoute } from 'vue-router';

  import _debounce from 'lodash/debounce';
  import TextOverTooltip from '@/components/TextOverTooltip/index.vue';
  import { wait } from '@/utils/utils';
  import WindowSelector from '@/components/WindowManagement/WindowSelector.vue';
  import SwitchWindowBtn from '@/components/WindowManagement/SwitchWindowBtn.vue';
  import SaveToEnterpriseWindowDialog from '@/components/WindowManagement/SaveToEnterpriseWindowDialog.vue';
  import useWindowSelector from './useWindowSelector.js';

  const props = defineProps({
    tableId: {
      type: String,
      required: true
    },
    // 指标key。用于大指标和表格联动时，如关键指标分析页面
    columnKey: {
      type: String,
      default: ''
    },
    showDrawer: {
      type: Boolean,
      required: true
    },
    onClose: {
      type: Function,
      required: false,
      default: () => {}
    },
    onConfirm: {
      type: Function,
      required: false,
      default: () => {}
    },
    customClass: {
      type: String,
      default: ''
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
    // 是否隐藏windowSelector。当前隐藏：库存商品、商品运营分析的推广分析
    hideWindowSelector: {
      type: Boolean,
      default: false
    }
  });

  const route = useRoute();

  // 过滤字段输入框--绑定的值
  const inputFieldName = ref('');

  const { tableId, columnKey } = toRefs(props);
  // 是否显示视窗模板
  const showScmb = computed(() => !props.hideWindowSelector);

  const emit = defineEmits(['update:showDrawer']);

  // 显示抽屉中间代理值，防止 v-model 嵌套
  const showDrawerDelegate = computed({
    get: () => props.showDrawer,
    set: val => {
      emit('update:showDrawer', val);
    }
  });

  // 打开弹窗
  watch(showDrawerDelegate, val => {
    if (!val) {
      inputFieldName.value = '';
      handleInput();
    }
  });

  const drawerRef = ref(null);

  const doClose = ref();

  const confirmBeforeClose = async done => {
    if (isSortChanged() && !doClose.value && !isLoading.value) {
      await wait(200);
      MessageBox({
        title: '提示',
        message: '数据未保存，确认关闭吗?',
        draggable: false,
        showCancelButton: true,
        lockScroll: true
        // confirmBtnType: 'danger'
      }).then(() => {
        moduleList.value = [];
        doClose.value = false;
        done();
      });
    } else {
      doClose.value = false;
      done();
    }
  };

  const close = () => {
    drawerRef.value.handleClose();
    // emit('update:showDrawer', false);
    props.onClose?.();
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

  // 点击确定按钮
  const confirmSort = async () => {
    if (sortFieldList.value.length === 0) {
      ElMessage({
        type: 'warning',
        message: '请勾选要展示的列'
      });
      return;
    }

    if (isProject.value) {
      checkSaveProjectTemplate();
    } else {
      checkSaveComponentsTable();
    }
  };

  // 检查保存我的项目模板
  const checkSaveProjectTemplate = async () => {
    const _isTemplateChanged = await isTemplateChanged();
    const _isTemplateSortChanged = isTemplateSortChanged();
    // 未切换模板，未改变排序
    if (!_isTemplateChanged && !_isTemplateSortChanged) {
      saveCloseHandler();
      return;
    }
    try {
      // 排序改变
      if (_isTemplateSortChanged) {
        if (!checkCanSave()) return;
        await fetchSaveProjectTemplate(getSaveTemplateParams());
      }
      // 切换模板
      if (_isTemplateChanged) {
        await fetchSwitchTemplate();
      }
      saveCloseHandler();
      props.onConfirm?.(tableId.value);
      showSaveSuccessMsg();
      refreshTemplateList();
    } catch (error) {
      saveCloseHandler();
      console.log('error: ', error);
    }
  };

  // 检查保存组件表格
  const checkSaveComponentsTable = () => {
    if (isSortChanged()) {
      requestUploadModuleData().then(() => {
        saveCloseHandler();
        props.onConfirm?.(tableId.value);
      });
    } else {
      saveCloseHandler();
    }
  };

  const saveCloseHandler = () => {
    doClose.value = true;
    close();
  };

  // 获取保存模板的参数
  const getSaveTemplateParams = () => {
    const display = sortFieldList.value.map(item => item.key);
    const { name, templateType, userJson } = curTemplate.value;
    return {
      tableKey: props.tableId,
      id: curTemplateId.value
        .replaceAll('person', '')
        .replaceAll('company', '')
        .replaceAll('system', ''),
      name,
      templateType,
      userJson,
      display
    };
  };

  const {
    switchTemplate,
    curTemplateId,
    sortNumberLimit,
    moduleList,
    sortFieldList,
    seletedFieldCount,
    // isChooseAll,
    clickAllFields,
    clickMoudleField,
    isSortChanged,
    clearAllFields,
    resetSort,
    requestUploadModuleData,
    hanldeBgColor,
    isLoading
  } = useTableColumnConfiger({
    tableKey: tableId,
    showScmb,
    columnKey,
    showDrawerDelegate,
    tower: props.tower,
    isIndicator: props.isIndicator,
    sortSubNumber: props.sortSubNumber
  });

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
      fieldList.forEach(field => {
        // 字段名匹配
        const haveFieldName =
          field.name.toLowerCase().includes(search) ||
          field.pinyin.fullPinyin.includes(search) ||
          field.pinyin.initials.includes(search);
        field.hidden = !haveFieldName;
        // field.hidden = !field.name.toLowerCase().includes(search);
      });
    });
  };

  const filterFnWithDebounce = _debounce(filterSortFieldListFn, 100);

  const handleInput = () => {
    inputFieldName.value = inputFieldName.value.trim();
    filterFnWithDebounce();
  };

  const {
    isAdmin,
    isProject,
    curTemplate,
    templateFullName,
    showSaveToEnterpriseDialog,
    onTemplateChange,
    fetchSwitchTemplate,
    checkCanSave,
    isTemplateChanged,
    isTemplateSortChanged,
    fetchSaveProjectTemplate,
    saveToPersonWindow,
    onSaveToEnterpriseConfirm,
    showSaveSuccessMsg,
    refreshTemplateList
  } = useWindowSelector({
    route,
    tableKey: tableId,
    showScmb,
    columnKey,
    tower: props.tower,
    curTemplateId,
    moduleList,
    switchTemplateUIHandler: switchTemplate,
    getSaveTemplateParams
  });
</script>

<style lang="scss" scoped>
  $theme-color: var(--main-color);

  ul {
    list-style: none;
  }

  li {
    display: inline;
  }

  .page {
    position: absolute;
    width: 800px;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #fff;
    text-align: left;
    box-shadow: inset 0px -1px 0px #e2e6ef;

    &__hd {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      padding: 0 24px;
      height: 56px;
      background: #fff;
      border-bottom: 1px solid #d4dbe9;
    }

    &__title {
      font-size: 16px;
      color: #000;
      user-select: none;
    }

    &__close {
      font-size: 22px;
      cursor: pointer;
      color: var(--icon-btn-color);
    }

    &__bd {
      flex: 1;
      height: 0;
      display: flex;
      :deep(.el-scrollbar__view) {
        height: 100%;
      }

      .page-bd__left {
        display: flex;
        flex-direction: column;
        width: 620px;
        height: 100%;
        background: #fff;
        .header {
          padding: 12px 24px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;

          .name-switch {
            padding-right: 32px;
            flex: 1;
            width: 0;
            height: 25px;
            display: flex;
            align-items: center;
            .name {
              color: #000;
              font-size: 14px;
              font-weight: 400;
            }
          }

          :deep(.search-input) {
            width: 180px;
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
          &:first-child {
            padding-top: 0;
          }
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

              // &--disabled {
              //   opacity: 0.45;
              //   cursor: not-allowed;
              // }

              // &--fixed {
              //   opacity: 0.65;
              //   cursor: not-allowed;
              // }
            }
          }

          // &.even {
          //   background-color: #fafafb;
          // }
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

      .page-bd__right {
        padding: 16px;
        flex: 1;
        width: 0;
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

    &__ft {
      height: 56px;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      background-color: white;
      border-top: 1px solid #d4dbe9;

      & > * {
        display: flex;
        align-items: center;

        .save-as-btn {
          display: flex;
          align-items: center;
          height: 28px;
          margin-right: 24px;
          color: var(--text-dblight-color);
          font-size: 12px;
          font-weight: 400;
          cursor: pointer;

          &:hover {
            color: var(--main-color);
          }

          i {
            font-size: 16px;
            margin-right: 4px;
          }
        }
      }
    }
  }

  .ghost {
    opacity: 0.2;
    background-color: rgba(0, 0, 0, 0.1) !important;
    border: none !important;
  }

  .xs-checkbox {
    position: relative;
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 1px solid #d4dbe9;
    border-radius: 1px;

    &--checked {
      background: var(--main-color);
      border: 1px solid var(--main-color);

      &::after {
        position: absolute;
        display: block;
        top: 3px;
        left: 2px;
        width: 5px;
        height: 2px;
        content: '';
        border: 1px solid #fff;
        border-width: 0 0 1px 1px;
        box-sizing: content-box;
        transform-origin: 50%;
        transform: rotate(-45deg);
      }
    }
  }
</style>

<style lang="scss">
  .el-drawer__body {
    padding: 0 !important;
  }

  .el-drawer__body {
    padding: 0 !important;
  }
</style>
