<!-- table 的排序、筛选弹窗面板 -->
<template>
  <div
    :key="column.prop || column.label"
    style="position: relative"
    @click.stop
  >
    <el-popover
      v-if="hideAfter"
      ref="popoverRef"
      v-model:visible="visible"
      :teleported="teleported"
      :width="222"
      :show-arrow="false"
      :popper-class="`${
        column.filterType === 'userTree' ? 'user-popover' : 'xs-popover'
      } ${uuidClass} ${className} ${column.className ?? ''}`"
      :persistent="false"
      :popper-options="{
        placement: 'bottom-start',
        modifiers: [
          {
            name: 'offset',
            options: {
              offset: [-75, 6]
            }
          },
          // 位置不够，自动翻转
          {
            name: 'flip',
            options: {
              fallbackPlacements: ['top-start']
            }
          }
        ]
      }"
      :popper-style="{ padding: '0 !important' }"
      @show="onShow"
      @hide="onHide"
    >
      <template #reference>
        <div v-if="column.sortable && !column.filterable">
          <span class="table-caret-wrapper caret-wrapper">
            <i
              class="sort-caret ascending"
              :class="sortBtnClsComputed('ascending')"
              @click="onSortClickFun('ascending')"
            ></i>
            <i
              class="sort-caret descending"
              :class="sortBtnClsComputed('descending')"
              @click="onSortClickFun('descending')"
            ></i>
          </span>
        </div>
        <div
          v-else
          class="table-popover-trigger"
          :class="triggerClass"
          @click="clickTrigger"
        >
          <slot name="default" :state="state"></slot>
        </div>
      </template>
      <div v-on-click-outside="clickOut" class="search">
        <!-- 这个popover 中不一定会有排序，但一定会有筛选！！ -->
        <template v-if="column.filter.sortable">
          <div class="cell-title">
            <h4>排序</h4>
            <span v-if="column.filter.sortSubTitle">
              {{ column.filter.sortSubTitle }}
            </span>
          </div>
          <div class="sorts">
            <XSButton
              :class-name="sortBtnClsComputed('ascending')"
              plain
              @click="onSortClick('ascending')"
            >
              <div class="x-button-slot">
                <i class="icon-upSort"></i>
                <span>升序</span>
              </div>
            </XSButton>

            <XSButton
              :class-name="sortBtnClsComputed('descending')"
              plain
              @click="onSortClick('descending')"
            >
              <div class="x-button-slot">
                <i class="icon-downSort"></i>
                <span>降序</span>
              </div>
            </XSButton>
          </div>
        </template>

        <div v-if="column.filterable">
          <template v-if="column.filterType === 'userTree'">
            <!-- models因为去掉前后空格转成string，choose-user是选中的成员id，重新转回number，保持内部逻辑不变 -->
            <TableUserSelect
              :choose-user="models.map(k => Number(k))"
              :type="userTreeType"
              :filter-options="filterOptions"
              @close="hideHandler"
              @cancel="onCancelClick"
              @submit="userSearchSubmit"
            />
          </template>
          <template v-else>
            <div class="cell-title">
              <h4>筛选</h4>
              <span v-if="column.filter.filterSubTitle">
                {{ column.filter.filterSubTitle }}
              </span>
            </div>
            <div
              v-if="column.filterType === 'select'"
              :class="[
                'search-select',
                column.filterMultiple ? 'multiple' : ''
              ]"
            >
              <el-select
                ref="selectRef"
                :model-value="column.filterMultiple ? models : models[0]"
                filterable
                size="default"
                :clearable="column.filter.selectClearable"
                :multiple="column.filterMultiple"
                :placeholder="
                  column.filter.placeholder || `请选择${column.label}`
                "
                class="table-filter__select"
                :popper-class="`table-filter__popper ${uuidSelectClass}`"
                @update:model-value="onSelectChange"
                @clear="onCancelClick"
                @visible-change="selectDropDownVisibleChange"
              >
                <!-- 多选下拉筛选框，现在支持对象{label,value}的格式，避免后端过滤时，前端需要反复处理字段 -->
                <el-option
                  v-for="(cate, cateIndex) in filterOptions"
                  :key="cate"
                  :label="_isObject(cate) ? cate?.label : cate"
                  :value="
                    !column.filterValue
                      ? _isObject(cate)
                        ? cate?.value
                        : cate
                      : cateIndex
                  "
                />
              </el-select>
            </div>

            <div v-else-if="column.filterType === 'time'">
              <el-date-picker
                :model-value="models"
                :editable="false"
                type="daterange"
                value-format="YYYY-MM-DD"
                clearable
                range-separator="~"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                class="table-filter__time"
                popper-class="table-filter__popper"
                :disabled-date="calcDisabledDate"
                @update:model-value="onTimeChange"
              />
            </div>
            <template v-else>
              <div class="search-input">
                <template
                  v-for="index in column.filter.inputCount"
                  :key="`input-${index}`"
                >
                  <div class="search-input-item">
                    <span v-if="column.filter.suffixLabel">
                      {{ column.filter.suffixLabel }}
                    </span>
                    <!-- 存在 suffixLabel时，不显示placeholder -->
                    <input
                      :ref="setInputRef"
                      v-model="models[index - 1]"
                      :class="[filterEmpty ? 'is-disable' : '']"
                      :placeholder="
                        column.filter.suffixLabel
                          ? ''
                          : column.filter.placeholder
                      "
                      :style="{
                        '--xs-placeholder-align': column.filter.placeholderAlign
                      }"
                      type="text"
                      :disabled="filterEmpty"
                      @keyup.enter="onConfirmClick"
                    />
                  </div>

                  <b v-if="index !== column.filter.inputCount">-</b>
                </template>
              </div>
            </template>
          </template>
          <div
            v-if="
              column.quickFilterable &&
              (column.quickFilter.type === 'empty' ||
                (column.quickFilter.type === 'average' && !isAverageEmpty))
            "
            class="quick-search xs-flex xs-flex-space-between xs-flex-col-center"
          >
            <span>快速筛选</span>
            <el-checkbox
              v-if="column.quickFilter.type === 'empty'"
              v-model="filterEmpty"
            >
              筛选无数据
            </el-checkbox>
            <div
              v-else-if="column.quickFilter.type === 'average'"
              class="xs-flex"
            >
              <div class="link" @click="setAverage('high')">高于平均值</div>
              <div class="link" @click="setAverage('low')">低于平均值</div>
            </div>
          </div>
          <template v-if="!hiddenBtns">
            <div class="search-button">
              <button
                v-if="column.filter.showCancelBtn"
                type="button"
                @click="onCancelClick"
              >
                {{ column.filter.cancelBtnText }}
              </button>
              <button type="button" @click="onConfirmClick">
                {{ column.filter.confirmBtnText }}
              </button>
            </div>
          </template>
        </div>
      </div>
    </el-popover>
  </div>
</template>
<script>
  import {
    computed,
    ref,
    onMounted,
    toRaw,
    watch,
    defineExpose,
    inject,
    nextTick
  } from 'vue';
  import _debounce from 'lodash/debounce';
  import _isObject from 'lodash/isObject';
  import _isString from 'lodash/isString';
  import _isEqual from 'lodash/isEqual';
  import { TABLE_HEAD_STATUS } from '@/config/Table';
  import { valueValidator, SUFFIX_MULTIPLIER_MAP } from '@/utils/filterMethod';
  import { ClickOutside as vOnClickOutside } from '@/directives/ClickOutside.js';
  import { isEmpty } from '@/utils/numberFormatter';
  import TableUserSelect from './TableUserSelect/index.vue';
  export default {
    name: 'TablePopover'
  };
</script>
<script setup>
  import { useEventListener } from '@vueuse/core';
  import _cloneDeep from 'lodash/cloneDeep';

  const props = defineProps({
    teleported: {
      type: Boolean,
      default: true
    },
    averageValue: {
      type: [String, Number],
      default: ''
    },
    column: {
      type: Object,
      required: true
    },
    value: {
      type: Array,
      required: true
    },
    treeType: {
      type: String,
      default: ''
    },
    emptyFilter: {
      type: Boolean,
      default: false
    },
    className: {
      type: String,
      default: ''
    },
    sortKey: {
      type: String,
      default: ''
    },
    sortOrder: {
      type: String,
      default: null
    },
    filterOptions: {
      type: Array,
      default: () => []
    }
  });

  watch(
    () => props.filterOptions,
    (current, old) => {
      if (!current?.length || _isEqual(current, old)) return;
      // 筛选数据类型是否为对象
      const isObject = _isObject(current[0]);
      // 如果下拉式筛选前一次有值的话，需要判断新的list里是否包含这个值，否则需要清空它;
      if (isMultiSelect.value) {
        let newModels = models.value.filter(model =>
          current.map(item => (isObject ? item.value : item)).includes(model)
        );
        models.value = newModels;
        lastModels.value = newModels;
      } else {
        if (!current.length) {
          models.value[0] = '';
        } else {
          // 判断筛选数据的格式
          if (isObject) {
            if (!current.map(item => item.value).includes(models.value[0])) {
              models.value[0] = '';
            }
          } else {
            if (!current.includes(models.value[0])) {
              models.value[0] = '';
            }
          }
        }
      }
      hideHandler();
      onConfirmClick();
    }
  );

  const $filters = inject('$filters');

  const emit = defineEmits([
    'confirm',
    'cancel',
    'update:value',
    'update:treeType',
    'update:emptyFilter',
    'sort',
    'show',
    'hide',
    'status'
  ]);

  const uuidClass = ref('table-popover-' + Math.random().toString(16).slice(2));

  const uuidSelectClass = ref(
    'table-popover-select-' + Math.random().toString(16).slice(2)
  );

  const hiddenBtns = computed(() => {
    return ['userTree', 'time', 'select'].includes(props.column.filterType);
  });

  const calcDisabledDate = date => date.getTime() > Date.now();

  // ======================================== 控制 popover 显示 ========================================
  /**
   * 手动控制 popover 是否显示
   */
  const visible = ref(false);
  const uuid = ref(Math.random().toString(16).slice(2));
  const triggerClass = ref('trigger__' + uuid.value);

  // 允许触发点击trigger的开关
  let allowClick = true;

  /**
   * 点击 trigger
   */
  const clickTrigger = () => {
    if (!allowClick) return;
    visible.value = !visible.value;
    allowClick = false;
    if (visible.value) filterEmpty.value = props.emptyFilter;
  };
  /**
   * 点击 popover 外部
   */
  const clickOut = _debounce(e => {
    if (ignoreClick(e)) return;
    closePopover();
  }, 0);
  /**
   * 关闭 popover
   */
  const closePopover = () => {
    models.value = getInitModels();
    visible.value = false;
  };

  // 	延迟关闭
  const hideAfter = ref(200);

  /**
   * 外部主动关闭
   */
  const exposeClosePopover = async () => {
    if (visible.value) {
      // 延迟关闭时长设为0
      hideAfter.value = 0;
      await nextTick();
      models.value = getInitModels();
      visible.value = false;
      await nextTick();
      // 延迟关闭时长 恢复默认
      hideAfter.value = 200;
    }
  };

  /**
   * 是否忽略点击
   * @param {*} e
   */
  const ignoreClick = e => {
    // 点击时 popover 未显示
    // 点击的是 popover 容器
    // 点击的是选择器下拉选项
    // 点击的是自身 popover 触发项
    return (
      !visible.value ||
      isClickPopoverContainer(e) ||
      isClickSelectOption(e) ||
      isClickSelfTrigger(e)
    );
  };
  // 点击的是选择器下拉选项
  const isClickSelectOption = e => {
    if (!props.column.filterMultiple && props.column.filterType === 'select')
      return false;
    return e?.path?.some?.(item =>
      item.classList?.contains?.('table-filter__popper')
    );
  };
  // 点击的是 popover 容器
  const isClickPopoverContainer = e => {
    const className =
      props.column.filterType === 'userTree' ? 'user-popover' : 'xs-popover';
    return e?.path?.some?.(item => item.classList?.contains?.(className));
  };
  const isMultiSelect = ref(
    props.column.filterType === 'select' && props.column.filterMultiple
  );
  // 点击本身 trigger
  const isClickSelfTrigger = e =>
    e?.path?.some?.(item => item.classList?.contains?.(triggerClass.value));
  // ======================================== 控制 popover 显示 结束 ========================================

  // 时间范围更改;
  const onTimeChange = value => {
    if (value) {
      models.value = value;
    } else {
      emptyValues();
    }
    onConfirmClick();
  };

  const onSelectChange = async val => {
    props.column.filterMultiple && addTitleAttrForSelectTags();
    if (!props.column.filterMultiple) {
      models.value[0] = val;
      onConfirmClick();
    } else {
      models.value = val;

      // 滚动到最后：当用户选择了过多的选择项时，后面的选项会隐藏到滚动容器里面，测试希望选项过多，新增选项时能滚动到最后展示当前所选内容
      nextTick(() => {
        const wrapperDom = selectRef.value.selectWrapper;
        const dom = wrapperDom.querySelector('.el-select-tags-wrapper');

        if (dom) {
          dom.scroll({
            // val.length表示当前多选过滤框，选择了几个值，每个选项的高度是24，所以向下滚动到val.length*24
            top: val.length * 24,
            behavior: 'smooth'
          });
        }
      });

      if (!val?.length) {
        selectRef.value?.blur();
        await nextTick();
        onCancelClick();
      }
    }
  };

  const addSelectOptionClass = async () => {
    setTimeout(() => {
      // 获取下拉菜单
      const tag = document.querySelector(`.${uuidSelectClass.value}`);
      if (!tag) return;
      // 获取当前下拉菜单位置
      const type = tag.getAttribute('data-popper-placement');
      // 根据当前菜单位置判断下拉菜单移动需要添加和删除的类名
      const addClassName =
        type.indexOf('bottom') > -1 ? 'move-up' : 'move-down';
      const removeClassName =
        type.indexOf('bottom') > -1 ? 'move-down' : 'move-up';
      let className = tag.className;
      // 如果当前类名中没有需要添加的类名，需要手动添加
      if (className.indexOf(addClassName) === -1) {
        // 当前类名无需要删除类名，直接添加
        if (className.indexOf(removeClassName) === -1) {
          className = `${className} ${addClassName}`;
        } else {
          // 当前类名有需要删除类名，将删除类名替换为添加类名
          className = className.replace(removeClassName, addClassName);
        }
      }
      // 重新设置下拉菜单类名
      tag.setAttribute('class', `${className}`);
    }, 0);
  };

  // 给选择的select tag添加title属性，用于鼠标hover时显示完整的内容
  const addTitleAttrForSelectTags = () => {
    setTimeout(() => {
      const tags = document.querySelectorAll(
        `.${uuidClass.value} .el-select__tags .el-tag .el-select__tags-text`
      );
      tags.forEach(tag => {
        tag.setAttribute('title', tag.innerText);
      });
    });
  };

  // select下拉展开时，给选择项添加title属性，用于鼠标hover时显示完整的内容
  // addSelectOptionClass给下拉菜单设置位移类名，保持样式统一
  const selectDropDownVisibleChange = visible => {
    if (!visible) return;
    setTimeout(() => {
      const items = document.querySelectorAll(
        `.table-filter__popper .el-select-dropdown__item`
      );
      items.forEach(item => {
        item.setAttribute('title', item.innerText);
      });
      addSelectOptionClass();
    }, 0);
  };

  const filterEmpty = ref(props.emptyFilter);

  const isAverageEmpty = computed(() => isEmpty(props.averageValue));

  // 设置平均值
  const setAverage = type => {
    // 根据输入框单位转化平均值
    const multiplier =
      SUFFIX_MULTIPLIER_MAP[props.column?.filter?.suffixLabel] || 1;
    const avgVal = (props.averageValue / multiplier).toFixed(2) || '';
    if (type === 'high') {
      models.value = [avgVal, ''];
    } else {
      models.value = ['', avgVal];
    }
  };

  /**
   * popover实例绑定;
   */
  const popoverRef = ref();
  const getInitModels = () => {
    let value = props.value;
    return isMultiSelect.value
      ? Array.isArray(value)
        ? value.filter(Boolean)
        : []
      : value;
  };
  // const models = ref(getInitModels());

  const models = computed({
    get: getInitModels,
    set: val => {
      // 将输入框的值去掉前后的空格
      const value = Array.isArray(val)
        ? val.map(item =>
            _isString(item) ? (String(item) || '').trim() : item
          )
        : _isString(val)
        ? (String(val) || '').trim()
        : val;
      emit('update:value', value);
    }
  });
  // 上次筛选值
  const lastModels = ref(_cloneDeep(toRaw(models.value)));

  const userTreeType = computed({
    get: () => props.treeType,
    set: type => emit('update:treeType', type)
  });

  /**
   * 设置input的ref;
   */
  const inputRefs = ref([]);
  const setInputRef = el => {
    if (!el) return;
    inputRefs.value.push(el);
  };

  /**
   * select的ref
   */
  const selectRef = ref();

  /**
   * 第一次打开筛选时输入框聚焦;
   */
  const onShow = () => {
    allowClick = true;
    emit('show');
    inputRefs.value?.[0]?.focus();
    addTitleAttrForSelectTags();
  };

  /**
   * popover 状态；
   * 用来指示下拉箭头的状态；
   * normal = 正常箭头向下;  asc = 升序；desc: 降序；ascAndFilter：升序且筛选；descAndFilter: 降序且筛选；filtered：筛选；
   */

  // const state = ref('');
  const state = computed(() => {
    const {
      column: { prop, isSortReverse },
      sortKey,
      sortOrder
    } = props;
    const { ascAndFilter, descAndFilter, filtered, asc, desc, normal } =
      TABLE_HEAD_STATUS;

    const isSort = sortKey === prop;
    const isAsc = isSort && sortOrder === 'ascending';

    // 有 select 的多选情况
    const hasFiltered = $filters?.[prop];
    let state = normal;
    if (hasFiltered) {
      if (isSort) {
        if (isSortReverse) {
          state = isAsc ? descAndFilter : ascAndFilter;
        } else {
          state = isAsc ? ascAndFilter : descAndFilter;
        }
      } else {
        state = filtered;
      }
    } else {
      if (isSort) {
        if (isSortReverse) {
          state = isAsc ? desc : asc;
        } else {
          state = isAsc ? asc : desc;
        }
      } else {
        state = normal;
      }
    }
    return state;
  });

  watch(
    state,
    current => {
      emit('status', current);
    },
    { immediate: true }
  );

  /**
   * popover关闭了
   */
  const onHide = () => {
    if (isMultiSelect.value) {
      onConfirmClick();
    } else {
      hideHandler();
    }
  };

  // popover关闭时的处理
  const hideHandler = (clearable = false) => {
    allowClick = true;
    visible.value = false;
    if (clearable) {
      emptyValues();
    } else {
      models.value = _cloneDeep(toRaw(lastModels.value));
    }
  };

  // 清空输入计时器，防止一个更新周期内频繁清空
  let emptyValuesTimer = null;
  /**
   * 清空输入框的值;
   */
  const emptyValues = () => {
    if (emptyValuesTimer) return;
    emptyValuesTimer = setTimeout(() => {
      _emptyValues();
      emptyValuesTimer = null;
    });
  };
  const _emptyValues = () => {
    const value = isMultiSelect.value
      ? []
      : new Array(models.value.length).fill('');
    models.value = value;
    lastModels.value = _cloneDeep(value);
  };

  const isSameArray = (list1, list2) => {
    if (list1.length !== list2.length) return false;
    if (list1.length === 0) return true;
    return list1.every(k => list2.includes(k));
  };

  const userSearchSubmit = (type, list) => {
    if (userTreeType.value === type && isSameArray(list, models.value)) {
      hideHandler();
      return;
    }
    userTreeType.value = type;
    models.value = list?.filter(k => k);
    onConfirmClick();
  };

  /**
   * 确定按钮点击，更新输入框的值并隐藏popover;
   */
  const onConfirmClick = _debounce(() => {
    let canContinue = true;
    if (
      models.value.length > 1 &&
      !['select', 'userTree', 'time', 'text'].includes(props.column.filterType)
    ) {
      canContinue = valueValidator(toRaw(models.value), props.column.prop);
    }
    if (!canContinue) return;
    emit('update:value', toRaw(models.value));
    emit('update:emptyFilter', filterEmpty.value);
    emit(
      'confirm',
      toRaw(models.value),
      filterEmpty.value,
      props.column.prop,
      props.column
    );
    lastModels.value = _cloneDeep(toRaw(models.value));
    //可能未render
    hideHandler();
  }, 100);

  /**
   * 清除按钮点击,清空输入框，并隐藏popover；
   */
  const onCancelClick = _debounce(() => {
    userTreeType.value = '';
    emptyValues();
    emit('update:value', toRaw(models.value));
    filterEmpty.value = false;
    emit('update:emptyFilter', filterEmpty.value);
    emit('cancel', props.column.prop, props.column);
    // popoverRef.value.hide();
    hideHandler(true);
  }, 100);

  /**
   * 排序按钮点击;
   */
  const onSortClick = _debounce(order => {
    const { prop, isSortReverse = false } = props.column;
    emit('sort', { prop, order, isSortReverse });
    popoverRef.value.hide();
  }, 100);

  /**
   * 排序点击;
   */
  const onSortClickFun = _debounce(order => {
    const {
      column: { prop },
      sortKey,
      sortOrder
    } = props;
    // 判断是否需要取消排序
    if (prop === sortKey && order === sortOrder) {
      emit('sort', { prop: '', order: 'normal' });
    } else {
      emit('sort', { prop, order });
    }
  }, 100);

  /**
   * 排序按钮class计算，active时高亮显示；
   */
  const sortBtnClsComputed = computed(() => {
    const {
      column: { prop, isSortReverse },
      sortKey,
      sortOrder
    } = props;
    return order => {
      let sortOrderCopy = sortOrder;
      if (isSortReverse) {
        sortOrderCopy =
          sortOrderCopy === 'descending' ? 'ascending' : 'descending';
      }
      if (prop === sortKey && order === sortOrderCopy) return 'active';
      return '';
    };
  });
  // 页面操作，涉及到需要手动清空还原搜索框内容的场景(涉及到调用表格的ref，所以无法用v-if的方式处理表格)
  const clear = () => {
    // const { normal } = TABLE_HEAD_STATUS;
    emptyValues();
    // state.value = normal;
    emit('status', state.value);
    emit('update:value', toRaw(models.value));
    emit('cancel', props.column.prop, props.column);
  };

  onMounted(() => {
    nextTick(() => {
      setTimeout(() => {
        // 页面滚动监听，当select下拉菜单切换位置时，手动位置修正，保持样式统一
        useEventListener(window, 'scroll', addSelectOptionClass);
      }, 0);
    });
  });

  defineExpose({
    visible,
    models,
    getProp: () => props.column.prop,
    emptyValues,
    clear,
    closePopover,
    exposeClosePopover
  });
</script>
<style lang="scss" scoped>
  .cell-title {
    color: #000;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    h4 {
      font-weight: 700;
      font-size: 14px;
      line-height: 16px;
    }
    span {
      font-weight: 400;
      font-size: 12px;
      line-height: 16px;
      opacity: 0.45;
    }
  }

  .table-filter__select {
    min-height: 32px;
    color: #000;
    background: #fff;
    border: 1px solid #d4dbe9;
    border-radius: 2px;
    :deep(.el-input__inner) {
      background: transparent !important;
      color: #000 !important;
      width: 100%;
      border: none !important;
      // outline: 0 !important;
      padding-left: 16px;
      font-style: normal;
      font-weight: normal;
      font-size: 14px;
      height: 30px;
      border-radius: 0;
      line-height: 30px;
      box-shadow: none;
      &::placeholder {
        color: #bfbfbf !important;
      }
      &:hover,
      &:focus {
        border-radius: 0;
        box-shadow: 0 0 0 1px var(--el-input-focus-border-color) inset;
      }
    }
    :deep(.el-select .el-input.is-focus .el-input__inner) {
      border-radius: 0;
      box-shadow: 0 0 0 1px var(--el-input-focus-border-color) inset;
    }
  }

  .search {
    padding: 16px;
    // border: 1px solid var(--border-color);
    border-radius: 1px;

    .sorts {
      margin-bottom: 18px;

      display: flex;
      justify-content: space-between;
      :deep(.x-button) {
        margin-left: 0;
        flex: 0 0 86px;
        &.active {
          border-color: #8099f2;
          background: #eef0fe;
          .x-button-slot {
            color: var(--main-color);
            svg path {
              fill: var(--main-color);
            }
            .icon-upSort {
              font-size: 16px;
              color: var(--main-color);
            }
          }
        }
      }
      .x-button-slot {
        display: flex;
        align-items: center;
        justify-content: center;
        svg {
          margin-right: 4px;
        }
        .icon-upSort,
        .icon-downSort {
          font-size: 16px;
          margin-right: 4px;
          // color: var(--main-color);
        }
        &:hover,
        &.active {
          color: var(--main-color);
          :deep(svg path) {
            fill: var(--main-color);
          }
        }
      }
    }

    &-input {
      display: flex;
      align-items: center;
      width: 100%;
      .search-input-item {
        position: relative;
        flex: 1;
        &:first-child:not(:last-child),
        &:last-child:not(:first-child) {
          flex: 0 0 86px;
        }
        > span {
          position: absolute;
          top: 50%;
          right: 5px;
          transform: translateY(-45%);
          color: #e2e6ef;
          & + input {
            padding-right: 18px;
          }
        }
        .is-disable {
          cursor: not-allowed;
          &:hover,
          &:focus {
            border-color: #d4dbe9;
          }
        }
        input {
          padding: 0 4px 0 8px;
          height: 32px;
          width: 100%;
          border: 1px solid #d4dbe9;
          border-radius: 1px;
          color: #1b2948;
          font-size: 14px;
          cursor: text;
          &:hover,
          &:focus {
            outline: none;
            border-color: var(--main-color);
            // box-shadow: 0 0 0 1px var(--main-color) inset;
          }
          &::placeholder {
            text-align: var(--xs-placeholder-align);
            color: var(--input-placeholder-color);
          }
        }
      }

      b {
        flex: 0 0 6px;
        margin: 0 5px;
        height: 32px;
        line-height: 32px;
        color: #d4dbe9;
        font-size: 14px;
      }
    }
    .quick-search {
      margin-top: 8px;
      font-size: 12px;
      color: #8c8c8c;
      height: 14px;
      .link {
        font-size: 12px;
        + .link {
          margin-left: 10px;
        }
      }
      :deep(.el-checkbox) {
        height: 14px;
        .el-checkbox__label {
          font-size: 12px;
          padding-left: 4px;
        }
        &.is-checked {
          .el-checkbox__label {
            color: var(--main-color);
          }
        }
      }
    }
    &-button {
      margin-top: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      button {
        &:first-child:last-child {
          flex: 1;
        }
        &:first-child:not(:last-child),
        &:last-child:not(:first-child) {
          flex: 0 0 86px;
        }
        cursor: pointer;
        outline: none;
        font-size: 14px;
        font-weight: 400;
        line-height: 32px;
        height: 32px;
        background-color: #fff;
        border: 1px solid var(--main-color);
        border-radius: 2px;
        color: var(--main-color);
        &:last-child {
          background-color: var(--main-color);
          color: #fff;
        }
        &:hover {
          outline: none;
        }
      }
    }
  }
  :deep(.el-select) {
    .el-select__tags .el-tag {
      --el-tag-text-color: var(--text-light-color);
    }
  }

  .table-caret-wrapper {
    --sort-default-color: var(--text-dblight-color);
    --sort-active-color: var(--main-color);

    width: 10px;
    .sort-caret.ascending {
      border-bottom-color: var(--sort-default-color);
      left: 1px;
      &.active {
        border-bottom-color: var(--sort-active-color);
      }
    }
    .sort-caret.descending {
      border-top-color: var(--sort-default-color);
      left: 1px;
      &.active {
        border-top-color: var(--sort-active-color);
      }
    }
  }
</style>
<style lang="scss">
  .search-select.multiple {
    .el-select__tags {
      min-height: fit-content;
      .el-select-tags-wrapper {
        max-height: 112px;
        overflow-x: hidden;
        overflow-y: auto;
      }
      .el-select__input {
        flex-basis: 100%;
      }
    }
  }

  .move-down {
    transform: translateY(10px);
  }

  .move-up {
    transform: translateY(-10px);
  }

  .table-filter__popper {
    z-index: 5002 !important;

    .el-select-dropdown {
      max-width: 480px;
    }

    .el-select-dropdown .el-select-dropdown__item.selected {
      --el-color-primary: var(--main-color);
    }

    .el-popper__arrow {
      display: none;
    }

    .el-select-dropdown__empty {
      height: 76px;
      background: url(/src/assets/images/Empty/nodata.svg) no-repeat center 10px/48px;
      padding-top: 49px;
    }
  }

  .table-filter__time {
    width: 100% !important;
    border-radius: 2px;
    overflow: hidden;
    position: relative;

    .el-icon.el-input__icon.el-range__icon {
      display: none;
    }
    .el-range-input {
      width: 49%;
      flex: 1;
    }

    .el-range-separator {
      padding: 0;
      flex: 0 0 12px;
    }

    .el-range__close-icon {
      position: absolute;
      top: 0;
      right: 1px;
      opacity: 1;
      width: 20px;
      background: #fff;
      text-align: center;
      height: calc(100% - 2px);
      transform: translateY(1px);
    }

    &.el-range-editor.el-input__inner {
      // padding: 3px;
      padding: 3px 10px 3px 10px;
    }
  }
</style>
