<template>
  <div
    ref="wrapperRef"
    :class="[
      'xs-table-wrapper',
      `xs-table-${tableClass}__wrapper`,
      $attrs.class,
      {
        'is-scroll-x': isScrollX,
        'has-summary': summary,
        'last-summary': sumLineIndex === data.length - 1,
        'first-summary': sumLineIndex === 0,
        'xs-no-border-table': !tableBorder,
        resizable: resizable,
        'not-stickyable': !stickyable && !selfSticky,
        'set-max-height-table': maxHeight && scrollbarMaxHeight
      },
      `is-scrolling-${scrollPosition}`
    ]"
    :style="commonStyleVariables"
  >
    <!-- thead 上方的元素容器，跟随表格横向滚动 S -->
    <TableHeaderFilter
      v-if="showHeaderFilter"
      class="TableHeaderFilterEl"
      :t-head-columns="tHeadColumns"
      :header-width="headerWidth"
      :col-width-arr="colWidthArr"
      :scroll-left="scrollLeft"
      :check-last-fixed-left="checkLastFixedLeft"
      :check-first-fixed-right="checkFirstFixedRight"
      :init-table-state="initTableState"
      :master-background="headerFilterMasterBackground"
      :data="data"
    >
      <template
        v-for="item in tHeadColumns"
        :key="item.prop"
        #[item.topFilter?.slot]
      >
        <slot
          v-if="item.topFilter?.slot"
          :name="item.topFilter?.slot"
          :column="item"
        ></slot>
      </template>
    </TableHeaderFilter>
    <!-- thead 上方的元素容器，跟随表格横向滚动 E -->

    <!-- 吸顶参照元素 -->
    <div
      :class="`reference reference-top reference-${tableClass}`"
      :style="{
        position: 'absolute',
        top: referenceTop + 'px',
        left: 0
      }"
    ></div>
    <XSAfterMounted @on-mounted="onElTableMounted">
      <template #skeleton>
        <el-skeleton animated style="width: 100%; line-height: 45px">
          <template #template>
            <div class="skeleton-item__wrapper">
              <el-skeleton-item
                v-for="item in skeletonRows"
                :key="item"
                class="skeleton-item"
              />
            </div>
          </template>
        </el-skeleton>
      </template>
      <!-- 表格组件 -->
      <el-table
        ref="tableRef"
        v-sticky="{
          uid: tableClass,
          offset,
          bottomFixedOffset,
          stickyable,
          inPageScroll,
          delay: stickyDelay,
          errorRange
        }"
        :class="[
          `xs-table xs-table-${tableClass}`,
          { 'is-empty-table': isEmptyTable }
        ]"
        :row-key="rowKey"
        border
        :highlight-current-row="highlightCurrentRow"
        :show-summary="showSummary"
        :summary-method="summaryMethod"
        :resizable="false"
        :data="
          isVirtualList
            ? visibleData
            : [
                ...(currentData || []).slice(0, sumLineIndex),
                ...finalSummary,
                ...(currentData || []).slice(sumLineIndex)
              ]
        "
        :max-height="maxHeight"
        :scrollbar-always-on="true"
        :row-class-name="tableRowClassName"
        :cell-class-name="cellClassName"
        style="width: 100%"
        header-cell-class-name="xs-table-header__cell"
        :stripe="stripe"
        v-bind="$attrs"
        :span-method="spanMethod"
        @cell-click="onCellClick"
        @row-click="onRowClick"
        @cell-mouse-enter="onCellMouseEnter"
        @cell-mouse-leave="onCellMouseLeave"
        @header-dragend="headerDragend"
      >
        <!-- key需要加上sortable和filterable，否则后端更新了配置后，因为key不变页面dom复用，没有读取到真正后端配置 -->
        <el-table-column
          v-for="(column, index) in columnsComputed"
          :key="`${column.prop}-${column.sortable}-${column.filterable}-${index}`"
          :prop="column.prop"
          v-bind="{ ...column, sortable: false, showOverflowTooltip: false }"
          :class-name="tableColumnClass(column, index)"
          :resizable="
            resizable &&
            column.resizable !== false &&
            ![column.slot, column.type].includes('selection')
          "
        >
          <!-- XSTable用了自己写的sort所以sortable设置成false即可，否则hover到表头上鼠标指针显示pointer -->
          <template #header>
            <div
              class="header"
              :style="{
                backgroundColor: column.backgroundColor,
                ...(column.labelStyle || {})
              }"
              @click.stop
              @dblclick.stop="headerDbClick(column, index)"
              @mousedown="headerMouseDown"
            >
              <!-- 表头标签 -->
              <div
                class="header-label"
                :style="{
                  justifyContent:
                    column.align === 'right'
                      ? 'flex-end'
                      : column.align === 'center'
                      ? 'center'
                      : 'flex-start'
                }"
              >
                <!-- 表头提示图标 -->
                <span v-if="column.remakeable">
                  <el-tooltip
                    effect="dark"
                    :content="column.remake"
                    placement="top-start"
                  >
                    <i class="icon-help cursor-pointer"></i>
                  </el-tooltip>
                </span>

                <!-- 如果有renderlabel的函数 -->
                <template v-if="column.renderLabel">
                  <span
                    :style="getLabelStyle(column)"
                    @click.stop="onHeaderClick(column, $event)"
                  >
                    <XSRenderHelper
                      :content="column.renderLabel({ ...column }, filteredData)"
                    />
                  </span>
                </template>

                <!-- 使用插槽渲染表头标签 -->
                <template v-else-if="column.slotLabel">
                  <slot
                    :name="column.slotLabel"
                    :column="column"
                    :style="getLabelStyle(column)"
                  ></slot>
                </template>

                <!-- 默认表头标签 -->
                <span
                  v-else
                  :style="{
                    ...getLabelStyle(column),
                    cursor:
                      !column.filterable && column.sortable
                        ? 'pointer'
                        : getLabelStyle(column).cursor
                  }"
                  @click.stop="onHeaderClick(column, $event)"
                >
                  {{ column.label }}
                </span>

                <!-- 排序筛选下拉的小箭头 -->
                <span
                  v-if="column.sortable || column.filterable"
                  class="filter-wrapper"
                >
                  <template v-if="column.filterSortSlot">
                    <slot :name="column.filterSortSlot"></slot>
                  </template>
                  <TablePopover
                    v-else
                    ref="tablePopoverRef"
                    v-model:value="column.filter.models"
                    v-model:treeType="column.filter.treeType"
                    v-model:emptyFilter="column.quickFilter.isEmptyFilter"
                    :average-value="
                      currentData?.[0]?.[column.quickFilter?.avgProp]
                    "
                    :column="column"
                    :sort-key="currentSortKey"
                    :sort-order="currentSortOrder"
                    :filter-options="
                      column.filterable ? filterOption[column.prop] : []
                    "
                    class-name="append-to-parent-popover"
                    @confirm="onPopoverConfirm"
                    @cancel="onPopoverCancel"
                    @sort="onPopoverSort"
                    @show="onPopShow"
                  >
                    <template #default="scope">
                      <div
                        class="reference_wrapper"
                        @click="
                          e => {
                            if (disableInnerSortAndFilter) {
                              e.stopPropagation();
                            }
                          }
                        "
                      >
                        <img
                          v-for="item in popoverStatus"
                          v-show="scope.state === item"
                          :key="item"
                          :class="item"
                          :src="getTableHeaderIcon(item)"
                          alt="filter_icon"
                        />
                      </div>
                    </template>
                  </TablePopover>
                </span>
              </div>

              <!-- 表头调整大小的假边框 -->
              <div
                v-if="
                  resizable &&
                  column.resizable !== false &&
                  !tableBorder &&
                  ![column.slot, column.type].includes('selection')
                "
                class="header-fake-border-wrapper"
                :style="{
                  backgroundColor: column.backgroundColor
                }"
                @dblclick.stop="headerDbClick(column, index)"
                @mousedown="headerMouseDown"
              >
                <img :src="tableResizeIcon" class="resize-icon" />
              </div>
            </div>
          </template>

          <!-- 单元格内容 -->
          <template v-if="column.render" #default="scope">
            <!-- 可编辑单元格 -->
            <template
              v-if="
                column.canEdit &&
                scope.row.index === clickRow &&
                scope.column.property === clickProp
              "
            >
              <!-- 数字输入框 -->
              <input-number
                v-if="column.isNumberCell"
                v-model:value="scope.row[column.prop]"
                class="tableEditInput"
                :integer="column.isNumberCell && !column.isPerCell"
                @on-blur="editBlur(scope.row)"
              >
                <template v-if="column.isPerCell" #suffix>
                  <span class="suffix-icon">%</span>
                </template>
              </input-number>

              <!-- 日期选择器 -->
              <el-date-picker
                v-else-if="column.isDateCell"
                ref="editDateRef"
                v-model="scope.row[column.prop]"
                class="editDatePicker"
                popper-class="editDatePickerPopper"
                type="date"
                :teleported="true"
                placement="bottom"
                :clearable="false"
                :editable="false"
                placeholder=""
                format="YYYY/MM/DD"
                value-format="YYYY-MM-DD"
                @blur="editBlur(scope.row)"
                @input="selectDateChange($event, scope.row)"
              />

              <!-- 文本域编辑 -->
              <el-input
                v-else-if="column.isTextareaCell"
                ref="editInputRef"
                v-model="scope.row[column.prop]"
                class="tableEditInput"
                resize="none"
                type="textarea"
                :maxlength="50"
                @blur="editBlur(scope.row)"
              />

              <!-- 文本编辑 -->
              <el-input
                v-else
                ref="editInputRef"
                v-model="scope.row[column.prop]"
                class="tableEditInput"
                :maxlength="50"
                @blur="editBlur(scope.row)"
              />
            </template>

            <!-- 非编辑状态下的单元格内容 -->
            <template v-else>
              <!-- 文本域显示 -->
              <div
                v-if="column.canEdit && column.isTextareaCell"
                v-title="scope.row[column.prop]"
                class="custom-textarea"
                :class="scope.row[column.prop] ? '' : 'custom-textarea--empty'"
              >
                {{
                  scope.row[column.prop] || column.renderAttr?.placeholder || ''
                }}
              </div>

              <!-- 带溢出提示的文本 -->
              <TextOverTooltip
                v-else-if="column.showOverflowTooltip"
                :title="
                  typeof column.render(
                    column,
                    scope.row,
                    dataComputed,
                    columnsComputed,
                    tableKey
                  ) === 'string'
                    ? column.render(
                        column,
                        scope.row,
                        dataComputed,
                        columnsComputed,
                        tableKey
                      )
                    : scope.row[column.prop]
                "
                is-native-title
              >
                <XSRenderHelper
                  :content="
                    column.render(
                      column,
                      scope.row,
                      dataComputed,
                      columnsComputed,
                      tableKey
                    )
                  "
                />
              </TextOverTooltip>

              <!-- 默认渲染内容 -->
              <XSRenderHelper
                v-else
                :content="
                  column.render(
                    column,
                    scope.row,
                    dataComputed,
                    columnsComputed,
                    tableKey
                  )
                "
              />
            </template>
          </template>

          <!-- 使用插槽渲染单元格内容 -->
          <template v-else-if="column.slot" #default="scope">
            <TextOverTooltip
              v-if="column.showOverflowTooltip && !scope.row.sumLine"
              :title="scope.row[column.prop]"
              is-native-title
            >
              <slot
                :name="column.slot"
                :row="scope.row"
                :column="column"
                :index="scope.$index"
                :page-size="pageSize"
                :current-page="currentPage"
              ></slot>
            </TextOverTooltip>
            <slot
              v-else
              :name="column.slot"
              :row="scope.row"
              :column="column"
              :index="scope.$index"
              :page-size="pageSize"
              :current-page="currentPage"
            ></slot>
          </template>

          <!-- 带溢出提示的普通文本 -->
          <template v-else-if="column.showOverflowTooltip" #default="scope">
            <TextOverTooltip
              v-if="!scope.row.sumLine"
              :title="scope.row[column.prop]"
              is-native-title
            >
              {{ scope.row[column.prop] }}
            </TextOverTooltip>
          </template>
        </el-table-column>

        <!-- 空数据模板 -->
        <template #empty>
          <slot name="empty">
            <slot
              v-if="!loading && isEmptyTable && !initTableState"
              name="emptyContent"
            >
              <XSEmpty
                :image="nodata"
                :image-size="emptySize"
                :label="emptyLabel"
                class="xs-table__empty"
              >
                <div v-if="emptyBtnList?.length" class="btn-box">
                  <div
                    v-for="item in emptyBtnList"
                    :key="item.name"
                    class="btn-item"
                    @click="item.click(item.type)"
                  >
                    {{ item.name }}
                  </div>
                </div>
              </XSEmpty>
            </slot>
            <el-skeleton v-else animated style="width: 100%">
              <template #template>
                <div class="skeleton-item__wrapper">
                  <el-skeleton-item
                    v-for="item in finalSkeletonRows"
                    :key="item"
                    class="skeleton-item"
                  />
                </div>
              </template>
            </el-skeleton>
          </slot>
        </template>
        <template #append>
          <div v-if="scrollLoadMore" ref="loadDomRef" style="height: 1px"></div>
        </template>
      </el-table>
    </XSAfterMounted>
    <!-- 整体是否移出视口的的参照元素 -->
    <div
      :class="`reference reference-bottom reference-${tableClass}-bottom`"
      :style="{
        position: 'absolute',
        bottom: referenceBottom === '' ? '' : referenceBottom + 'px',
        left: 0
      }"
    ></div>
    <div
      v-if="paginationCompted && paginationVisible && !isEmptyTable"
      class="pagination-wrapper"
      :style="{
        justifyContent: paginationCompted.position,
        ...paginationStyle
      }"
    >
      <slot name="paginationLeft"></slot>
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :small="isSmallPagination"
        v-bind="{
          total,
          layout,
          pageSizes,
          pagerCount,
          onCurrentChange,
          onPageSizeChange
        }"
      />
    </div>
    <!-- 有边框的table左右边框会超出底部一点，用这两个元素进行遮盖 -->
    <div v-if="showBorderMask" class="border-mask left-mask"></div>
    <div v-if="showBorderMask" class="border-mask right-mask"></div>
  </div>
</template>

<script lang="jsx">
  import {
    computed,
    defineComponent,
    defineAsyncComponent,
    ref,
    toRefs,
    toRaw,
    watch,
    nextTick,
    reactive,
    onMounted,
    defineExpose,
    provide,
    onBeforeUnmount
  } from 'vue';
  import {
    getColumn,
    getData,
    getRandomCode,
    TABLE_HEAD_STATUS
  } from '@/config/Table';
  import sticky, { store as stickyStore } from '@/directives/Sticky.js';
  import { storeToRefs } from 'pinia';
  import { useTableColumnWidthStore } from '@/store/useTableColumnWidth';
  import tableResizeIcon from '@/assets/images/Table/table-resize-icon.svg';
  import useTableRowHighlight from './hooks/useTableRowHighlight';
  import { addRowId } from './utils.js';
  import router from '@/router';

  export default defineComponent({
    name: 'XSTable',
    directives: { sticky },
    inheritAttrs: false,
    methods: {
      dispatch(isSticky = false) {
        // eslint-disable-next-line vue/require-explicit-emits
        this.$emit('stickyChange', isSticky);
      }
    }
  });
</script>

<script lang="jsx" setup>
  import InputNumber from './components/inputNumber.vue';
  import TablePopover from './components/TablePopover.vue';
  import XSRenderHelper from '@/components/RenderHelper.vue';
  import XSEmpty from '../Empty.vue';

  import nodata from '@/assets/images/Empty/nodata_page.svg';
  import { BLOCK_PROP_LIST, DEFAULT_PAGINATION, sorter } from '@/config/Table';
  import usePagination from '@/hooks/usePagination';
  import useFilter from '@/hooks/useFilter';
  import { toNumber } from '@/utils/numberFormatter';
  import { useTableLoadingStateStore } from '@/store/useTableLoadingState';

  import _isEqual from 'lodash/isEqual';
  import _cloneDeep from 'lodash/cloneDeep';
  import _debounce from 'lodash/debounce';
  import _isString from 'lodash/isString';
  import { useEventListener } from '@vueuse/core';
  import TextOverTooltip from '@/components/TextOverTooltip/index.vue';

  const TableHeaderFilter = defineAsyncComponent(() =>
    import('./components/TableHeaderFilter.vue')
  );

  // 监听表格内部的滚动容器，并给外部添加滚动状态的样式
  let scroller;
  const scrollLeft = ref(0);
  const scrollPosition = ref('left');
  const isScrollX = ref(false);

  /*********** 基本属性定义 Start ***************/
  const { initTableState } = storeToRefs(useTableLoadingStateStore());

  /**
   * 表格的唯一id；
   */
  const tableClass = getRandomCode();

  /**
   * table组件实例；
   */
  const tableRef = ref();
  const tablePopoverRef = ref();
  /**
   * 传进来的props.data,稍微处理下，便于塞下一些默认值，并且拷贝一份出来；
   */
  const tableDataRef = ref([]);

  /**
   * 事件定义；
   */
  const emit = defineEmits([
    'popoverAllReset',
    'popoverConfirm',
    'popoverCancel',
    'pageIndexChange',
    'pageSizeChange',
    'sortChange',
    'cellClick',
    'rowClick',
    'cellMouseEnter',
    'cellMouseLeave',
    'stickyChange',
    'currentDataChange',
    'scroll',
    'headerClick',
    'getEditInfo',
    'headDragend',
    'resetColumnWidth',
    'popShow'
  ]);

  /**
   * 定义组件的props
   */
  const props = defineProps({
    // 是否显示表头过滤器
    showHeaderFilter: Boolean,

    // 是否在页面内滚动
    inPageScroll: Boolean,

    // sticky指令的延迟时间(ms)
    stickyDelay: {
      type: Number,
      default: 500
    },

    // 是否显示表格边框
    tableBorder: Boolean,

    //滚动到底加载更多
    scrollLoadMore: {
      type: Boolean,
      default: false
    },

    // 是否使用斑马纹
    stripe: {
      type: Boolean,
      default: true
    },

    // 骨架屏渲染行数，默认20，个别特殊的表格，不需要这么多行，所以需要自己传入；
    skeletonRows: {
      type: Number,
      default: 20
    },

    // 表格数据源
    data: {
      type: Array,
      default: () => []
    },

    // 表格列配置
    columns: {
      /**
       * columnItem 目前确定支持的配置；
       * 组件文档： https://qiyegonglue.com/article/guideDetail?id=12671&draft=2&curIndex=0
       * width,
       * label,
       * prop,
       * min-width，
       * fixed,
       * noUseOnly: false 配合isOnlySort使用（这两个属性不再使用，统一用sortable和filterable来控制）
       * sortable: true = 开启排序，
       * sort-orders，
       * align,
       * filterable: true = 开启筛选；
       * filter：{  筛选的配置
       *   inputCount: 1, 输入框数量，最多显示2个，否则超出容器了；
       *   placeholder：请输入，输入框提醒；
       *   placeholderAlign：left，提醒所在位置
       *   cancelBtnText: 清除，取消按钮文案
       *   confirmBtnText: 确定，确认按钮文案；
       *   useLocalFilter: 是否使用前端过滤
       *   isSortReverse: 排序是否反过来,排名之类的需要（比如潜力商品抖音）
       *   selectClearable: select是否可清空
       *   models: 输入或选中的数据
       * }
       *
       * renderLabel：Function，自定义表头文案，支持jsx;
       * render：Function, 自定义单元格内容，支持jsx;
       *
       * columnItem 确定不支持的配置；
       * render-header: function,（可以用renderLabel代替）
       *
       * 其他的配置项未经测试；
       */
      type: Array,
      default: () => []
    },

    // 表头吸顶时距离顶部的距离；默认44px;
    offset: {
      type: Number,
      default: 48 // 默认表头高度
    },

    // 底部滚动条fixed时的偏移量(px)
    bottomFixedOffset: {
      type: Number,
      default: 0
    },

    // 是否开启表头过滤器吸顶
    headerFilterStickyable: Boolean,

    // 表头过滤器的z-index
    headerFilterZIndex: {
      type: Number,
      default: 9
    },

    // 表头背景色，默认是主题色；
    themeColor: {
      type: String,
      default: '#fff'
    },

    // 是否高亮鼠标悬停的列
    columnHighlight: Boolean,

    // 表格的最大高度,支持css calc 语法，但不支持如 calc(100% - 100px)的模糊计算;
    maxHeight: {
      type: [String, Number],
      default: `auto`
    },

    // 是否使用el-table内部的排序；
    useInnerSort: {
      type: Boolean,
      default: true
    },

    // 是否使用内置过滤
    useInnerFilter: {
      type: Boolean,
      default: true
    },

    // 使用el-table内置过滤时是否隐藏合计行
    hideSumLineWhenUseInnerFilter: Boolean,

    // 是否禁用内置排序和过滤
    disableInnerSortAndFilter: Boolean,

    // 数字类型的单元格的class名称；
    numberClassName: {
      type: String,
      default: 'xs-number-cell'
    },

    // 文本单元格的类名
    textClassName: {
      type: String,
      default: 'xs-text-cell'
    },

    // 是否显示合计行
    showSummary: Boolean,

    // 合计行计算方法
    summaryMethod: {
      type: Function,
      default: () => {}
    },

    // 默认排序
    defaultSort: {
      type: Object,
      // default: () => ({ prop: 'sales', order: 'ascending' }),
      default: () => ({})
    },

    // 是否可吸顶
    stickyable: {
      type: Boolean,
      default: true
    },

    // 是否使用自定义吸顶
    selfSticky: Boolean,

    // 分页配置
    pagination: {
      type: [Object, Boolean],
      default: true
    },

    // 是否使用小型分页
    isSmallPagination: Boolean,

    // 分页容器样式
    paginationStyle: {
      type: Object,
      default: () => ({})
    },

    /**
     * 不需要监听页码变化，在页码变化时滚动条自动滚动到表格顶部
     * 主要适用于弹窗内表格
     */
    unScrollTop: Boolean,

    // 单元格合并方法
    spanMethod: {
      type: Function,
      default: () => {}
    },

    // 是否高亮当前行
    highlightCurrentRow: {
      type: Boolean,
      default: false
    },

    // 行数据的key
    rowKey: {
      type: String,
      default: ''
    },

    // 行的类名
    rowClassName: {
      type: Function,
      default: undefined
    },

    // 单元格类名
    cellClassName: {
      type: Function,
      default: undefined
    },

    // 点击单元格所在的行
    clickRow: {
      type: [String, Number],
      default: ''
    },

    // 点击单元格所在的列的key
    clickProp: {
      type: [String, Number],
      default: ''
    },

    /**
     * 次要排序字段，当排序时遇到2个相同的值时，如果配置了该属性，数据相同的部分则会按这个prop 和 order 重排 ；
     * { prop: 'key', order: 'ascending' || 'descending' }
     */
    secondarySort: {
      type: Object,
      default: () => ({})
    },

    // 是否使用斑马纹
    tableStripe: {
      type: Boolean,
      default: true
    },

    // 数据变化时是否重置滚动位置
    resetPostionOnDataChange: {
      type: Boolean,
      default: true
    },

    // 过滤选项
    filterOption: {
      type: Object,
      default: () => ({})
    },

    // 表头是否可点击
    headerClickable: Boolean,

    // 默认选中的表头字段
    headerProp: {
      type: String,
      default: null
    },

    // 空数据文案
    emptyLabel: {
      type: String,
      default: '暂无相关数据'
    },

    // 空数据时的按钮列表
    emptyBtnList: {
      type: Array,
      default: () => {}
    },

    // 表头是否使用主色
    headerMainColor: Boolean,

    // 加载状态
    loading: Boolean,

    // 是否可调整列宽
    resizable: {
      type: Boolean,
      default: true
    },

    // 错误范围
    errorRange: { type: Array, default: undefined },

    // 表格唯一标识
    tableKey: { type: String, default: '' },

    // 是否计算滚动高度
    calcScrollHeight: {
      type: Boolean,
      default: true
    },

    // 滚动时是否关闭tablePopover
    closeTablePopoverOnScroll: {
      type: Boolean,
      default: true
    },

    // 是否使用虚拟列表
    isVirtualList: Boolean,

    // 虚拟列表可视区域长度
    virtualListLength: {
      type: Number,
      default: 30
    },

    // 虚拟列表限制长度
    virtualListLimitLength: {
      type: Number,
      default: 0
    },

    // 列表项每一项的高度
    virtualListItemHeight: {
      type: Number,
      default: 40
    },

    // 参考顶部偏移量
    referenceTop: {
      type: [Number, String],
      default: 16
    },

    // 参考底部偏移量
    referenceBottom: {
      type: [Number, String],
      default: ''
    },

    // 是否使用横向滚动触发固定表头的resize事件，重新渲染
    useScrollResizeHeader: {
      type: Boolean,
      default: true
    },

    // 有边框的table左右边框会超出底部一点，用该属性进行遮挡
    showBorderMask: Boolean,

    // 表头过滤器主背景色
    headerFilterMasterBackground: {
      type: String,
      default: 'rgba(0,0,0,0)'
    },

    // 空状态尺寸
    emptySize: {
      type: Number,
      default: 425
    },

    // 使用表格内部的表格行点击高亮（我的项目默认使用）
    useRowHighlight: {
      type: Boolean,
      default: router.currentRoute.value?.meta?.showAsideMenu
    }
  });

  const tableColumnWidthStore = useTableColumnWidthStore();

  const resizedWidth = ref([]);

  const dragInfoKey = computed(() => {
    return `${props.tableKey}_drag_info`;
  });

  const isColResize = ref(false);

  const dragInfo = ref([]);

  // 分发resize事件
  const dispatchResizeEvent = () => {
    const event = new Event('resize');
    window.dispatchEvent(event);
  };

  const getDragInfo = () => {
    if (!props.tableKey) return [];
    const data = localStorage.getItem('tableColumnsWidthInfo');
    if (data) {
      const allInfo = JSON.parse(data) || {};
      return allInfo[dragInfoKey.value] || [];
    }
    return [];
  };

  // 获取目标列
  // 在数组中查找目标项
  const findTarget = (singleItem, arr, isIndex) => {
    const findFunc = item => {
      // 优先匹配prop、props或slot
      if (singleItem.prop || singleItem.props || singleItem.slot) {
        return (
          (item.prop &&
            [singleItem.prop, singleItem.property].includes(item.prop)) ||
          (item.props && singleItem.props === item.props) ||
          (item.slot && singleItem.slot === item.slot)
        );
      }
      // 如果没有匹配到上述属性，则匹配label
      return item.label && singleItem.label === item.label;
    };

    // 根据isIndex参数决定返回索引还是项本身
    return isIndex ? arr.findIndex(findFunc) : arr.find(findFunc);
  };

  // 缓存拖拽宽度
  const setDragInfo = columns => {
    const info = columns.map(item => ({
      prop: item.prop,
      props: item.props,
      slot: item.slot,
      width: item.width,
      label: item.label
    }));
    if (props.tableKey) {
      // 更新缓存宽度时需要注意保留原本缓存内容，替换改变后的内容
      const savedColumns = getDragInfo();
      info.forEach(item => {
        const target = findTarget(item, savedColumns);
        if (target) {
          target.width = item.width;
        } else {
          savedColumns.push(item);
        }
      });
      dragInfo.value = savedColumns;
      let data = localStorage.getItem('tableColumnsWidthInfo');
      data = data ? JSON.parse(data) : {};
      data[dragInfoKey.value] = savedColumns
        .filter(item => !!item.width)
        .map(item => ({ ...item, draged: true }));
      localStorage.setItem('tableColumnsWidthInfo', JSON.stringify(data));
      tableColumnWidthStore.setTableColumnWidthByDrag();
    }
  };

  // 鼠标点下时判断是否是可拖拽状态，因为mouseup时会清除拖拽状态，使用debounce记录双击第一次状态
  const headerMouseDown = _debounce(
    () => {
      isColResize.value = document.body?.style?.cursor === 'col-resize';
    },
    300,
    { leading: true }
  );

  // 表头双击时恢复当前行的默认宽度（鼠标指针是col-resize时）
  const headerDbClick = async (column, i) => {
    if (!isColResize.value) return;
    isColResize.value = false;
    const info = _cloneDeep(dragInfo.value);
    const index = findTarget(column, info, true);

    info[index].width = columnsResult.value[i].initialWidth;
    dragInfo.value = [...info];
    setDragInfo(info);
    // 多级表头情况下拖拽改变宽度表头会不对齐，需要触发resize事件重新计算
    setTimeout(() => {
      dispatchResizeEvent();
      emit('resetColumnWidth', column);
    }, 150);
  };

  // 表头拖拽结束
  const headerDragend = (nw, ow, col, evt) => {
    nextTick(() => {
      const columns = _cloneDeep(columnsComputed.value);
      // 限制最大最小拖拽宽度(最后一列不限制最大宽度)
      const index = findTarget(col, columns, true);
      let result = nw;
      if (nw >= 550 && index !== columns.length - 1) {
        result = 550;
      }
      if (nw <= 85) {
        if (columns[index]?.initialWidth < 85) {
          // 表格列默认宽度低于80时设置宽度为默认宽度
          if (nw <= columns[index]?.initialWidth) {
            result = columns[index]?.initialWidth;
          } else {
            result = nw;
          }
        } else {
          result = 85;
        }
      }

      if (nw <= 180 && col.label === '商品') {
        result = 180;
      }

      // // 设置表格的最小拖拽宽度
      // if (columns[index]?.minWidth) {
      //   if (nw <= columns[index]?.minWidth) {
      //     result = columns[index]?.minWidth;
      //   }
      // }

      // 设置表格的最小拖拽宽度
      if (columns[index]?.minDragWidth) {
        if (nw <= columns[index]?.minDragWidth) {
          result = columns[index]?.minDragWidth;
        }
      }

      col.width = result;
      // 缓存设置了width的column信息
      if (columns[index]) {
        columns[index].width = result;
      }

      setDragInfo(columns);
      // 多级表头情况下拖拽改变宽度表头会不对齐，需要触发resize事件重新计算
      dispatchResizeEvent();
      emit('headDragend', result, ow, col, evt);
    });
  };

  // 判断是否浏览器顶层横向滚动
  let lastScrollLeft = 0;
  let lastScrollTop = 0;
  let horizontalScrollFlag = ref(false);
  const isHorizontalScroll = () => {
    const currentScrollLeft =
      window.pageXOffset || document.documentElement.scrollLeft;
    const currentScrollTop =
      window.pageYOffset || document.documentElement.scrollTop;

    const isHorizontalScroll =
      Math.abs(currentScrollLeft - lastScrollLeft) >
      Math.abs(currentScrollTop - lastScrollTop);

    // 更新上一次滚动的位置
    lastScrollLeft = currentScrollLeft;
    lastScrollTop = currentScrollTop;

    horizontalScrollFlag.value = isHorizontalScroll;
  };
  const scrollMutation = ref(null);
  // 存储滚动后元素的滚动距离
  const horizontalScrollLeft = {
    header: 0,
    footer: 0
  };
  // 设置 头部 和底部 元素跟随页面滚动
  const setScrollElPosition = (e, targetEl, type) => {
    const horizontalScrollLeftVal =
      e.target.scrollingElement.scrollLeft - horizontalScrollLeft[type];
    horizontalScrollLeft[type] = e.target.scrollingElement.scrollLeft;
    if (horizontalScrollFlag.value) {
      // 处理横向滚动的逻辑
      let _scrollEl = targetEl;
      if (_scrollEl && _scrollEl.style.cssText.indexOf('fixed') > -1) {
        const styleArr = _scrollEl.style.cssText.split(';');
        const leftIndex = styleArr.findIndex(item => item.indexOf('left') > -1);
        const fixedIndex = styleArr.findIndex(
          item => item.indexOf('fixed') > -1
        );
        if (leftIndex > -1 && fixedIndex > -1) {
          const left = styleArr[leftIndex].match(/[-\d]+/g).map(Number);
          styleArr[leftIndex] = `left: ${left[0] - horizontalScrollLeftVal}px`;
          _scrollEl.style.cssText = styleArr.join(';');
        }
      }
    }
  };

  // 头部滚动回调
  const tablerHeaderScroll = e => {
    const tableHeader = document.querySelector(
      `.xs-table-${tableClass} .el-table__header-wrapper`
    );
    setScrollElPosition(e, tableHeader, 'header');
  };
  // 底部滚动回调
  const tablerFooterScroll = e => {
    const scrollbar = document.querySelector(
      `.xs-table-${tableClass} .el-scrollbar__bar`
    );
    setScrollElPosition(e, scrollbar, 'footer');
  };
  // 打开popover后滚动页面popover位置会有问题；
  const tableHeaderResize = () => {
    if (tablePopoverRef.value && tablePopoverRef.value.length) {
      const flag = tablePopoverRef.value.some(item => item.visible);
      flag && dispatchResizeEvent();
    }
  };

  const wrapperRef = ref();

  // 解决某些情况下，表头和表体分离的bug
  const fixedHeaderSplitBody = () => {
    if (!props.stickyable) return;
    const headerDom = document.querySelector(
      `.xs-table-${tableClass}__wrapper .el-table__header-wrapper`
    );
    const bodyDom = document.querySelector(
      `.xs-table-${tableClass}__wrapper .el-table__body-wrapper`
    );
    if (headerDom && bodyDom) {
      const {
        top: bodyTop,
        bottom: bodyBottom,
        left: bodyLeft
      } = bodyDom?.getBoundingClientRect() || {};
      const { top: headerTop, height: headerHeight } =
        headerDom.getBoundingClientRect() || {};
      if (bodyTop - headerTop > headerHeight || headerTop > bodyBottom) {
        headerDom.style.cssText = `position: absolute;top:0;left:0;`;
        // 部分情况下表头吸顶状态恢复成默认状态时Sticky.js未检测到，而在此方法内强行让它变成postion: absolute；
        // 这种情况下需要将xs-table-fixed这个class手动删除，并重新赋予表格头部的高度到--xs-table-header-height
        if (headerDom.parentNode.classList.contains('xs-table-fixed')) {
          headerDom.parentNode.classList.remove('xs-table-fixed');
        }
      } else if (bodyTop < props.offset && bodyBottom > props.offset) {
        // 页面滚动过快时，有时候无法检测到页面底部对照元素出现导致表头不吸顶，此时强制设置为吸顶状态并添加吸顶的class
        headerDom.style.cssText = `position: fixed;top:${props.offset}px;left:${bodyLeft}px;`;
        if (!headerDom.parentNode.classList.contains('xs-table-fixed')) {
          headerDom.parentNode.classList.add('xs-table-fixed');
        }
      }
      wrapperRef.value.style.setProperty(
        '--xs-table-header-height',
        `${headerDom.offsetHeight}px`
      );
    }
  };

  // 解决某些情况下，横向滚动条和表体分离的bug
  const fixedScrollbarSplitBody = () => {
    if (!props.stickyable) return;
    if (!tableRef.value?.$el) return;
    const scrollDom = tableRef.value.$el.querySelector(
      `.el-scrollbar__bar.is-horizontal`
    );
    const bodyDom = tableRef.value.$el.querySelector(`.el-table__body-wrapper`);
    const headerDom = tableRef.value.$el.querySelector(
      `.el-table__header-wrapper`
    );
    if (scrollDom && bodyDom && headerDom) {
      const bodyBottom = bodyDom?.getBoundingClientRect()?.bottom;
      const { bottom: scrollBottom, top: scrollTop } =
        scrollDom.getBoundingClientRect() || {};
      const { top: headerTop } = headerDom.getBoundingClientRect() || {};
      if (scrollBottom - bodyBottom > 26 || scrollTop < headerTop) {
        scrollDom.style.cssText = `position: absolute; left:0; bottom: 0`;
      }
    }
  };

  // 主动计算表头吸顶 offset为主动吸顶高度
  const dealFixedHeader = offset => {
    const headerDom = document.querySelector(
      `.xs-table-${tableClass}__wrapper .el-table__header-wrapper`
    );
    const bodyDom = document.querySelector(
      `.xs-table-${tableClass}__wrapper .el-table__body-wrapper`
    );
    if (headerDom && bodyDom) {
      const {
        top: bodyTop,
        bottom: bodyBottom,
        left: bodyLeft
      } = bodyDom?.getBoundingClientRect() || {};
      const { top: headerTop, height: headerHeight } =
        headerDom.getBoundingClientRect() || {};

      if (bodyTop - headerTop - 0.9 > headerHeight || headerTop > bodyBottom) {
        headerDom.style.cssText = `position: absolute;top:0;left:0;`;
        // 部分情况下表头吸顶状态恢复成默认状态时Sticky.js未检测到，而在此方法内强行让它变成postion: absolute；
        // 这种情况下需要将xs-table-fixed这个class手动删除，并重新赋予表格头部的高度到--xs-table-header-height
        if (headerDom.parentNode.classList.contains('xs-table-fixed')) {
          headerDom.parentNode.classList.remove('xs-table-fixed');
        }
      } else if (bodyTop - 32 < offset && bodyBottom > offset) {
        // 页面滚动过快时，有时候无法检测到页面底部对照元素出现导致表头不吸顶，此时强制设置为吸顶状态并添加吸顶的class
        headerDom.style.cssText = `position: fixed;top:${offset}px;left:${bodyLeft}px;`;
        if (!headerDom.parentNode.classList.contains('xs-table-fixed')) {
          headerDom.parentNode.classList.add('xs-table-fixed');
        }
      }
      wrapperRef.value.style.setProperty(
        '--xs-table-header-height',
        `${headerDom.offsetHeight}px`
      );
    }
  };

  onMounted(() => {
    nextTick(() => {
      setTimeout(() => {
        useEventListener(window, 'scroll', isHorizontalScroll);
        // 获取表头 底部滚动条
        useEventListener(window, 'scroll', tablerHeaderScroll);
        useEventListener(window, 'scroll', tablerFooterScroll);
        useEventListener(window, 'scroll', () => {
          props.showHeaderFilter && tableHeaderResize();
          fixedHeaderSplitBody();
          fixedScrollbarSplitBody();
        });
      }, 0);
    });
  });

  onBeforeUnmount(() => {
    scrollMutation.value?.disconnect?.();
  });

  const scrollbarMaxHeight = ref();

  // 设置maxHeight情况下出现横向滚动条会被遮盖，因为xs-table给el-scrollbar设置了padding-bottom导致el-table内部计算滚动条maxHeight出错
  const changeScrollHeight = () => {
    nextTick(() => {
      setTimeout(() => {
        if (!scroller || !props.calcScrollHeight) return;
        scrollMutation.value = null;
        // xs-table给padding-bottom设置了14所以height需要在maxHeight基础上减去14px
        const setScrollerHeight = maxHeight => {
          scrollbarMaxHeight.value =
            Number(maxHeight.split('px')[0]) - 14 + 'px';
          // scroller.style.height = Number(maxHeight.split('px')[0]) - 14 + 'px';
        };
        let maxHeight = scroller?.style.maxHeight;
        setScrollerHeight(maxHeight);
        // 拖拽表头可能会导致maxHeight重新计算，监听maxHeight变化时重设height
        scrollMutation.value = new MutationObserver(mutations => {
          mutations.forEach(function (mutation) {
            if (mutation.attributeName === 'style') {
              const newMaxHeight = mutation.target.style.maxHeight;
              if (newMaxHeight !== maxHeight) {
                maxHeight = newMaxHeight;
                setScrollerHeight(newMaxHeight);
              }
            }
          });
        });
        scrollMutation.value.observe(scroller, {
          attributes: true
        });
      }, 0);
    });
  };

  const onHeaderClick = (column, event) => {
    // 判断是否为单排序的操作,再自定义排序
    if (column.sortable && !column.filterable) {
      let sortList = ['descending', 'ascending', 'normal', 'descending'];
      const { prop } = column;
      if (prop === currentSortKey.value) {
        let order = currentSortOrder.value || 'normal';
        order = sortList[sortList.indexOf(order) + 1];
        onPopoverSort({ prop, order });
      } else {
        onPopoverSort({
          prop,
          order: sortList[0]
        });
      }
      scrollToTop();
      return;
    }
    if (!props.headerClickable) return;
    const { prop, label, unHeaderClick } = column;
    if (!prop || !label || unHeaderClick || BLOCK_PROP_LIST.includes(prop))
      return;
    emit('headerClick', column, event);
  };
  const getLabelStyle = column => {
    return {
      color:
        props.headerMainColor || props.headerProp === column.prop
          ? 'var(--main-color)'
          : 'black',
      cursor:
        props.headerClickable &&
        column.prop &&
        !column.unHeaderClick &&
        !BLOCK_PROP_LIST.includes(column.prop)
          ? 'pointer'
          : 'default'
    };
  };

  /**
   * 当前排序的key, 值为column.prop;
   */
  const currentSortKey = ref(props.defaultSort?.prop || '');

  /**
   * 排序顺序；
   */
  const currentSortOrder = ref(
    props.defaultSort?.prop ? props.defaultSort?.order || 'descending' : null
  );

  watch(
    () => props.defaultSort,
    (current, prev) => {
      if (_isEqual(current, prev)) return;
      currentSortKey.value = props.defaultSort?.prop || currentSortKey.value;
      currentSortOrder.value =
        props.defaultSort?.order || currentSortOrder.value;
    }
  );

  /**
   * 表格内容编辑
   */
  const editBlur = row => {
    emit('getEditInfo', row);
  };
  const selectDateChange = (val, row) => {
    editBlur(row);
  };

  const handleResizeForScrollbar = () => {
    isScrollX.value = scroller?.scrollWidth > scroller?.clientWidth;
  };
  const handleScroll = () => {
    // 滚动时关闭headerPopover
    props.closeTablePopoverOnScroll &&
      tablePopoverRef.value?.forEach(item => {
        item?.closePopover?.();
      });
    if (!props.headerFilterStickyable) {
      scrollLeft.value = scroller?.scrollLeft;
    }
    if (scroller?.scrollLeft === 0) {
      scrollPosition.value = 'left';
    } else if (
      Math.ceil(scroller?.scrollLeft + scroller?.offsetWidth) >=
      scroller?.scrollWidth
    ) {
      scrollPosition.value = 'right';
    } else {
      scrollPosition.value = 'middle';
    }
    emit('scroll', { scrollLeft: scrollLeft.value });
    if (isVirtualList.value) {
      virtualListScroll();
    }
  };

  const isFixedLeft = item => item?.fixed === true || item?.fixed === 'left';
  const isFixedRight = item => item?.fixed === 'right';

  const checkLastFixedLeft = (item, index) => {
    if (!isFixedLeft(item)) return false;
    const next = tHeadColumns.value?.[index + 1];
    return !isFixedLeft(next);
  };

  const checkFirstFixedRight = (item, index) => {
    if (!isFixedRight(item)) return false;
    const prev = tHeadColumns.value?.[index - 1];
    return !isFixedRight(prev);
  };

  /**
   * 分页属性计算；
   */
  const paginationCompted = computed(() => {
    if (!props.pagination) return false;
    if (props.pagination && typeof props.pagination !== 'object') {
      return { ...DEFAULT_PAGINATION };
    }
    return { ...DEFAULT_PAGINATION, ...props.pagination };
  });

  /**
   * columns 重新计算，便于把一些默认值塞进去；
   */
  const columnsStore = reactive({});
  if (!columnsStore[tableClass]) {
    columnsStore[tableClass] = reactive(
      getColumn(props.columns, props.defaultSort || {})
    );
  }
  const columnsResult = computed(() => {
    return (
      columnsStore[tableClass] ||
      reactive(getColumn(props.columns, props.defaultSort || {}))
    );
  });

  const columnsComputed = computed(
    () => {
      const result = [...columnsResult.value];
      result.forEach(item => {
        const target = findTarget(item, dragInfo.value);
        // 储存的宽度大于等于80或未储存宽度时将宽度设置为储存的宽度（未储存时是undefined）
        if (target && item.minDragWidth && target.width < item.minDragWidth) {
          item.width = item.minDragWidth;
        } else if (
          target &&
          (target?.width >= 85 ||
            (!target?.width && typeof target?.width !== 'number') ||
            target?.props === 'index' ||
            // 默认宽度小于80、序号列不做宽度低于80时设置宽度80的操作
            target?.label === '序号' ||
            item?.initialWidth < 85)
        ) {
          item.width = target?.width;
        } else {
          item.width = item.width || undefined;
        }
      });
      return result;
    },
    { immediate: true }
  );

  /******************* thead 上方的元素容器，跟随表格横向滚动 S *******************/
  const headerWidth = ref('');
  const colLists = ref([]);
  let colWidthArr = ref([]);
  let theadContentObserver = null;
  // 设置表头上方元素的宽度
  const setHeaderAbouveElWidth = (trigger, delay) => {
    colWidthArr.value.length = [];
    nextTick(() => {
      setTimeout(() => {
        // colgroupLists：table中colgroup标签中的col标签
        // 获取其宽度，从而设置thead上面的列宽度
        const colgroupLists = document.querySelectorAll(
          `.xs-table-${tableClass}__wrapper .el-table__header-wrapper colgroup col`
        );
        colLists.value = colgroupLists;
        // 获取table的表头元素，从而得到表头的宽度
        const header = document.querySelector(
          `.xs-table-${tableClass}__wrapper .el-table__header`
        );
        headerWidth.value = header?.style.width;
        colWidthArr.value = Array.from(colLists.value).map(item => item.width);
        resizedWidth.value = [...colWidthArr.value];
        // resize时触发，不通过监听 colgroup DOM 的变化来改变元素的宽度
        if (trigger) {
          theadContentObserver?.disconnect?.();
          return;
        }
        // 初始化时解决页面宽度大于table的列宽总和，宽度不自适应的问题
        const colGroup = document.querySelector(
          `.xs-table-${tableClass}__wrapper .el-table__header-wrapper colgroup`
        );
        // 页面还没有渲染出 colGroup 元素时中断，不执行下面的代码
        if (!colGroup) return;
        // 创建 theadContentObserver 对象
        theadContentObserver = new MutationObserver(mutations => {
          colWidthArr.value.length = 0;
          mutations.forEach(function (mutation) {
            if (mutation.attributeName === 'width') {
              colWidthArr.value.push(mutation.target.width);
            }
          });
        });
        // 监听 colGroup DOM 的变换
        theadContentObserver.observe(colGroup, {
          attributes: true,
          childList: true,
          subtree: true
        });
      }, delay || 0);
    });
  };
  setHeaderAbouveElWidth();

  const onResize = async () => {
    setHeaderAbouveElWidth(true);
  };
  useEventListener(window, 'resize', onResize);

  // 设置表头上方元素的列
  const tHeadColumns = computed(() => {
    let columnLists =
      columnsStore[tableClass] ||
      reactive(getColumn(props.columns, props.defaultSort || {}));
    return resetTheadAbouveItemsPosition(columnLists);
  });

  const resetTheadAbouveItemsPosition = lists => {
    // 优先使用dom的width计算，否则拖拽改变表头宽度之后tHeadColumns不重新计算，left错误导致样式错乱
    // 不直接使用colWidthArr的原因是页面刚加载时会多次触发MutationObserve改变colWidthArr导致死循环页面卡死
    let leftList = [], //table 左固定列集合
      rightList = [], //table 不固定列集合
      mainList = []; //table 右固定列集合
    let _lfWidth, _rgWidth; // 固定列宽度，黏性定位设置left/right
    //  遍历列集合，将左固定、不固定和右固定列重新排序
    // 以便于生成theade上面的元素
    lists.forEach((item, index) => {
      const itemWidth = resizedWidth.value[index]
        ? Number(resizedWidth.value[index])
        : 0;
      if (item.fixed === 'left') {
        if (leftList.length === 0) {
          item.left = 0;
          _lfWidth = itemWidth || item.width || item.minWidth;
        } else {
          item.left = _lfWidth;
          _lfWidth = item.left + (itemWidth || item.width || item.minWidth);
        }
        leftList.push(item);
      } else if (item.fixed === 'right') {
        if (rightList.length === 0) {
          item.right = 0;
          _rgWidth = itemWidth || item.width || item.minWidth;
        } else {
          item.right = _rgWidth;
          _rgWidth = item.right + (itemWidth || item.width || item.minWidth);
        }
        rightList.push(item);
      } else {
        mainList.push(item);
      }
    });
    return leftList.concat(mainList, rightList);
  };

  // 等待 el-table 挂载，再添加滚动监听
  const onElTableMounted = () => {
    scroller = tableRef.value?.$el?.querySelector(
      '.el-table .el-scrollbar__wrap'
    );
    scroller && useEventListener(scroller, 'scroll', handleScroll);
    setTimeout(handleScroll, 0);

    useEventListener(window, 'resize', handleResizeForScrollbar);
    setTimeout(handleResizeForScrollbar, 0);

    setTimeout(dispatchResizeEvent, 0);

    if (isVirtualList.value) {
      setVirtualListHeight();
    }
  };

  /******************* thead 上方的元素容器，跟随表格横向滚动 E *******************/

  /**
   * 数据重新计算，便于把一些默认值塞进去；
   */
  const dataComputed = computed({
    get() {
      return tableDataRef.value;
    },
    set(val = []) {
      tableDataRef.value = val;
    }
  });

  /*********** 基本属性定义 End ***************/

  /*********** 对参数监控 Start ***************/

  /**
   * columns变化时，有可能需要重新计算一下高度;
   */
  watch(
    () => props.columns,
    async (current, prev) => {
      // 防止表头位置错乱
      setTimeout(() => {
        props.showHeaderFilter && dispatchResizeEvent();
      }, 150);

      if (isColumnsEqual(current, prev)) return;

      props.stickyable && stickyStore[tableClass]?.listener?.resize?.();

      shouldResetFilter(current, prev) && onPopoverAllReset();

      // 重置columns
      columnsStore[tableClass] = reactive(
        getColumn(current, props.defaultSort || {})
      );
    },
    { deep: true }
  );

  // 是否需要重置筛选（判断正在使用的配置是否改变）
  const shouldResetFilter = (current, prev) => {
    const usedProps = Object.keys(filters).filter(Boolean);
    const currentUsedColumns = (current || []).filter(item =>
      usedProps.includes(item.prop)
    );
    const prevUsedColumns = (prev || []).filter(item =>
      usedProps.includes(item.prop)
    );
    return !isColumnsEqual(currentUsedColumns, prevUsedColumns);
  };

  /**
   * 检查配置是否改变（顺序、sortable、filterable）
   */
  const isColumnsEqual = (current, prev) => {
    // 简化配置
    const simpleOption = list =>
      list.map(({ prop, label, sortable, filterable }) => {
        return { key: prop || label, sortable, filterable };
      });
    return _isEqual(simpleOption(current), simpleOption(prev));
  };

  /**
   * 合计数据，根据第一条数据 sumLine=true 判断
   */
  const summary = ref([]);
  const sumLineIndex = ref(-1);
  /**
   * 最终显示的合计数据
   */
  const finalSummary = computed(() => {
    return props.hideSumLineWhenUseInnerFilter && Object.keys(filters).length
      ? []
      : summary.value || [];
  });

  onMounted(() => {
    watch(
      () => props.tableKey,
      v => {
        if (!v) return;
        const info = getDragInfo();
        dragInfo.value = info;
      },
      { immediate: true }
    );
    watch(
      () => props.data,
      async current => {
        if (props.headerFilterStickyable) {
          const TableHeaderFilterElChild = document.querySelector(
            '.TableHeaderFilterElChild'
          );
          let TableHeaderFilterElChildCopy = null;
          let el_table__header_wrapper = null;
          if (TableHeaderFilterElChild) {
            TableHeaderFilterElChildCopy =
              TableHeaderFilterElChild.parentNode?.removeChild(
                TableHeaderFilterElChild
              );

            el_table__header_wrapper = document.querySelector(
              '.el-table__header-wrapper'
            );
            if (el_table__header_wrapper) {
              const chilren = Array.from(el_table__header_wrapper.children);
              const index = chilren.findIndex(
                item => item.className === 'TableHeaderFilterElChild'
              );
              if (index === -1) {
                el_table__header_wrapper.insertBefore(
                  TableHeaderFilterElChildCopy,
                  el_table__header_wrapper.children[0]
                );
              }
            }
          }
        }

        if (props.resetPostionOnDataChange) {
          tableRef.value?.setScrollLeft?.(0);
        }
        let list = toNumber(getData([...(current || [])]));
        // 处理合计数据，有合计数据，会一直显示在第一行或最后一行
        const index = list.findIndex(item => item.sumLine);
        if (index !== -1) {
          // 存在多条汇总情况
          const sumLines = list.filter(item => item.sumLine);
          sumLineIndex.value = index;
          summary.value = sumLines;
          list = list
            .slice(0, index)
            .concat(list.slice(index + sumLines.length));
        } else {
          summary.value = null;
        }
        // 处理行高亮
        props.useRowHighlight && addRowId(list);
        tableDataRef.value = list;
        // if (current.length === 0) {
        // current.length === 0 时，才会触发骨架屏;
        // 显示骨架屏时，页面高度可能比原来高，即原来没有滚动条，出现骨架屏时有滚动条；
        // 所以在数据变化后，重新触发一次表头的宽度计算；

        // 第一次渲染等待500ms，其余数据变化时等待200ms，手动触发resize
        // await wait(prev ? 200 : 500);
        dispatchResizeEvent();
        await setHeaderAbouveElWidth();
        // }
      },
      { immediate: true }
    );
    watch(
      () => props.maxHeight,
      v => {
        if (v) {
          changeScrollHeight();
        } else {
          scrollMutation.value?.disconnect?.();
        }
      },
      { immediate: true }
    );
  });

  /*********** 对参数监控 End ***************/

  /************  筛选 && 分页 Hooks 调用 Start  **************/

  /**
   * 调用筛选的hooks；
   */
  let {
    filteredData,
    onPopoverConfirm: popoverConfirm,
    onPopoverCancel: popoverCancel,
    clearFilters,
    triggerFilter,
    filters
  } = useFilter(
    tableDataRef,
    columnsResult,
    {
      prop: currentSortKey,
      order: currentSortOrder
    },
    props.secondarySort,
    props.useInnerSort,
    tablePopoverRef
  );

  /**
   * 清空排序
   * @param notTriggerFilter 是否不触发筛选事件
   */
  const clearSorters = notTriggerFilter => {
    currentSortKey.value = props.defaultSort?.prop;
    currentSortOrder.value = props.defaultSort?.order;
    !notTriggerFilter && triggerFilter();
  };

  // 清空筛选并将排序变为初始状态
  const clearFiltersAndSorters = () => {
    clearFilters();
    clearSorters(false);
  };

  provide('$filters', filters);

  /**
   * 调用分页的hooks；
   */
  let {
    paginationVisible,
    currentPage,
    total,
    paging,
    pageSize,
    pageSizes,
    pagerCount,
    layout,
    currentData,
    onPageSizeChange,
    onCurrentChange,
    loadDomRef
  } = usePagination(filteredData, paginationCompted, props);

  // 表格最终显示的骨架屏行数
  const finalSkeletonRows = ref(undefined);

  watch(currentData, data => {
    // 重置骨架屏行数
    if (finalSkeletonRows.value === undefined) {
      finalSkeletonRows.value = props.skeletonRows;
    } else {
      // 数据长度  = 当前页数据 + 合计数据
      let dataSize = (data?.length || 0) + finalSummary.value?.length;
      if (dataSize > 0) {
        // 大于0，小于等于默认的行数
        finalSkeletonRows.value = Math.min(dataSize, props.skeletonRows);
      }
    }
    emit('currentDataChange', currentData.value);
    if (isVirtualList.value) {
      setVirtualListHeight();
    }
  });

  const {
    isVirtualList,
    virtualListItemHeight,
    virtualListLength,
    virtualListLimitLength
  } = toRefs(props);
  const startOffset = ref(0);
  const start = ref(0);
  const end = ref(virtualListLength.value);
  const listHeight = computed(() => {
    if (!isVirtualList.value) return 0;
    return (currentData.value.length - 1) * virtualListItemHeight.value;
  });
  const getTransform = computed(() => {
    if (!isVirtualList.value) return 0;
    return `translate3d(0,${startOffset.value}px,0)`;
  });
  const visibleData = computed(() => {
    if (!isVirtualList.value) return [];
    let tableBody = document.querySelector(
      `.xs-table-${tableClass} .el-table__body-wrapper .el-table__body`
    );
    if (tableBody) {
      if (
        virtualListLimitLength.value &&
        virtualListLimitLength.value < currentData.value.length
      ) {
        tableBody.style.transform = getTransform.value;
      } else {
        tableBody.style.transform = 'initial';
      }
    }
    return currentData.value.slice(
      start.value,
      Math.min(end.value, currentData.value.length)
    );
  });
  const setVirtualListHeight = () => {
    nextTick(() => {
      const scrollDom = document.querySelector(
        `.xs-table-${tableClass} .el-table__body-wrapper .el-scrollbar__view`
      );
      if (scrollDom) {
        const style = scrollDom.getAttribute('style');
        const styleList = style
          .split(';')
          .filter(item => item && item.substring(0, 6) !== 'height');
        if (
          virtualListLimitLength.value &&
          virtualListLimitLength.value < currentData.value.length
        ) {
          styleList.push(`height:${listHeight.value}px`);
        }
        scrollDom.setAttribute('style', styleList.join(';'));
      }
    });
  };

  const virtualListScroll = () => {
    const tableScrollNode = document
      .querySelector(`.xs-table-${tableClass}`)
      ?.querySelector('.el-scrollbar__wrap');
    let scrollTop = tableScrollNode.scrollTop;
    //此时的开始索引
    start.value = Math.floor(scrollTop / virtualListItemHeight.value);
    if (start.value < 0) start.value = 0;
    if (currentData.value.length <= virtualListLength.value) start.value = 0;
    //此时的结束索引
    end.value = start.value + virtualListLength.value;
    //此时的偏移量
    startOffset.value = scrollTop - (scrollTop % virtualListItemHeight.value);
    startOffset.value =
      startOffset.value > virtualListItemHeight.value
        ? startOffset.value - virtualListItemHeight.value
        : startOffset.value === virtualListItemHeight.value
        ? virtualListItemHeight.value
        : 0;
  };

  const setVirtualListTop = startIndex => {
    const tableScrollNode = document
      .querySelector(`.xs-table-${tableClass}`)
      ?.querySelector('.el-scrollbar__wrap');
    let scrollTop = startIndex * virtualListItemHeight.value;
    tableScrollNode.scrollTop = scrollTop;
    start.value = startIndex;
    end.value = start.value + virtualListLength.value;
    startOffset.value = scrollTop - (scrollTop % virtualListItemHeight.value);
    startOffset.value =
      startOffset.value > virtualListItemHeight.value
        ? startOffset.value - virtualListItemHeight.value
        : startOffset.value === virtualListItemHeight.value
        ? virtualListItemHeight.value
        : 0;
  };
  /**
   * 获得指定dom到顶部的距离；
   * @param {*} selector
   */
  const height2Top = selector => {
    const elem = document.querySelector(selector);
    const { top = 0 } = (elem && elem.getBoundingClientRect()) || {};
    const { scrollTop = 0 } = document.scrollingElement;
    return scrollTop + top - props.offset;
  };

  /**
   * 页码和页长的变化监听，垂直方向的滚动条在变化时需要滚动到第一条数据的位置；
   */
  watch(
    [currentPage, pageSize],
    ([newCurrentPage, newPageSize], [oldCurrentPage, oldPageSize]) => {
      if (newCurrentPage !== oldCurrentPage) {
        emit('pageIndexChange', newCurrentPage);
      }
      if (newPageSize !== oldPageSize) {
        emit('pageSizeChange', newPageSize);
      }
      scrollToTop();
      if (props.unScrollTop) return;
      nextTick(() => {
        document.scrollingElement.scrollTop =
          height2Top(`.reference-${tableClass}`) - props.referenceTop;
      });
    }
  );

  // 表格内部滚动条回到顶部
  const scrollToTop = () => {
    const tableScrollNode = document
      .querySelector(`.xs-table-${tableClass}`)
      ?.querySelector('.el-scrollbar__wrap');
    if (tableScrollNode?.scrollTop) tableScrollNode.scrollTop = 0;
  };
  // 表格内部滚动条回到顶部
  const scrollToLeft = () => {
    scroller = tableRef.value?.$el?.querySelector(
      '.el-table .el-scrollbar__wrap'
    );
    if (scroller) {
      scroller.scrollLeft = 0;
    }
  };

  /**
   * 表格数据是否为空
   */
  const isEmptyTable = computed(() => {
    return (
      props.data?.length === 0 ||
      ((currentData.value?.length === 0 || currentData.value === undefined) &&
        !finalSummary.value?.length)
    );
  });

  /************  筛选 && 分页 Hooks 调用 End  **************/

  /************ 表头状态相关 Start ************/
  /**
   * 重置所有 popover 状态：恢复默认 sort，清空 filter
   */
  const onPopoverAllReset = () => {
    if (props.defaultSort?.prop) {
      nextTick(() => {
        const { prop, order = 'descending' } = props.defaultSort || {};

        // 不使用el-table内部的排序的，不会进行重置排序
        props.useInnerSort &&
          (filteredData.value = filteredData.value.sort(
            sorter(prop, order, props.secondarySort)
          ));
      });
    }

    clearFilters();
    emit('popoverAllReset');
  };

  /**
   * 删选popover确定按钮点击；
   * @param {*} value 输入框的值, 数组类型, 按照输入框的顺序排序；
   * @param {*} prop 筛选列的prop 字段索引；
   * @param {*} column 该列的整体的配置；
   */
  const onPopoverConfirm = (value, filterEmpty, prop, column) => {
    const searchValue = Array.isArray(value)
      ? value.map(item =>
          _isString(item) ? (String(item) || '').trim() : item
        )
      : _isString(value)
      ? (String(value) || '').trim()
      : value;
    popoverConfirm?.({
      value: searchValue,
      filterEmpty,
      prop,
      column,
      useInnerFilter: props.useInnerFilter
    });
    emit('popoverConfirm', { value: searchValue, prop, column });
  };

  const onPopShow = () => {
    emit('popShow');
  };

  /**
   * 删选popover取消按钮点击；
   * @param {*} prop 筛选列的prop 字段索引；
   * @param {*} column 该列的整体的配置；
   */
  const onPopoverCancel = (prop, column) => {
    popoverCancel?.({ prop, column });
    emit('popoverCancel', { prop, column });
  };

  // 手动设置表格过滤数据
  const setFilters = ({ value, prop, column }) => {
    const targetColumn = columnsResult.value.find(item => item.prop === prop);
    if (targetColumn.filter) {
      targetColumn.filter.models = value;
    }

    popoverConfirm?.({
      value,
      prop,
      column,
      useInnerFilter: props.useInnerFilter
    });
  };
  /**
   * 主动点击排序按钮;
   * @param {*} param0
   */
  const onPopoverSort = ({ prop, order, isSortReverse }) => {
    currentSortKey.value = prop;
    if (isSortReverse) {
      currentSortOrder.value =
        order === 'descending' ? 'ascending' : 'descending';
    } else {
      currentSortOrder.value = order;
    }
    if (props.useInnerSort) {
      nextTick(() => {
        // 重置数据默认排序方式
        if (order === 'normal') triggerFilter();
        filteredData.value = filteredData.value.sort(
          sorter(prop, order, props.secondarySort, isSortReverse)
        );
        emit('sortChange', { prop, order, secondarySort: props.secondarySort });
      });
    } else {
      emit('sortChange', { prop, order, secondarySort: props.secondarySort });
    }
  };

  // 删除onPopoverStatusChange方法

  const popoverStatus = Object.values(TABLE_HEAD_STATUS);
  const getTableHeaderIcon = status => {
    return new URL(
      `../../assets/images/Table/${
        props.headerMainColor && status === 'normal' ? 'normal_main' : status
      }.svg`,
      import.meta.url
    ).href;
  };

  /************ 表头状态相关 End ************/

  /************ 表格样式设置 Start ************/

  /**
   * 单元列的className计算
   */
  const tableColumnClass = computed(() => {
    return (column, index) => {
      const classArr = [];

      classArr.push(
        column.isNumberCell ? props.numberClassName : props.textClassName
      );

      const [prop, no] = hoverColumnKey.value;
      if (prop === column.prop && index === no && props.columnHighlight) {
        classArr.push(`highlight`);
      }
      if (column.showOverflowTooltip) {
        classArr.push('over-tooltip');
        classArr.push(column.align);
      }

      if (column.className) {
        classArr.push(column.className);
      }

      // if (column.canEdit) {
      //   classArr.push(`cursor-pointer`);
      // }

      return classArr.join(' ');
    };
  });

  const scrollTo = option => {
    tableRef.value.scrollTo(option);
  };

  const setCurrentRow = row => {
    tableRef.value.setCurrentRow(row);
  };

  // 设置每页显示条数
  const setPageSize = newPageSize => {
    pageSize.value = newPageSize;
  };
  // 获取当前展示的每页显示条数
  const getPageSize = () => {
    return pageSize.value;
  };
  // 设置当前页码
  const setPage = newPage => {
    currentPage.value = newPage;
  };
  // 获取当前页码
  const getPage = () => {
    return currentPage.value;
  };
  /**
   * 样式变量计算;
   */
  const commonStyleVariables = computed(() => {
    return {
      '--xs-theme-color': props.themeColor,
      '--scrollbar-max-height': scrollbarMaxHeight.value
    };
  });
  /************ 表格样式设置 End ************/

  // 单元格点击事件展示的时间选择器
  const editDateRef = ref();
  // 单元格点击事件展示的文本输入框
  const editInputRef = ref();

  // 单元格点击事件
  const onCellClick = async (row, column, cell, event) => {
    // await是为了等待外部更新clickRow和clickProp，让内部的dom展示出来
    await emit('cellClick', row, column, cell, event);
    // 行点击编辑数据，如果是日期则直接打开日期选择器
    if (editDateRef.value) editDateRef.value[0]?.focus();
    // 行点击编辑数据，如果是文本输入框，直接聚焦
    if (editInputRef.value) editInputRef.value[0]?.focus();
  };

  /**
   *  行点击事件
   */
  const onRowClick = async (row, column, event) => {
    // await是为了等待外部更新clickRow和clickProp，让内部的dom展示出来
    await emit('rowClick', row, column, event);
    // 行点击编辑数据，如果是日期则直接打开日期选择器
    if (editDateRef.value) editDateRef.value[0]?.focus();
    // 行点击编辑数据，如果是文本输入框，直接聚焦
    if (editInputRef.value) editInputRef.value[0]?.focus();

    props.useRowHighlight && onRowClickForHightlight(row);
  };
  /**
   * 获取表格数据
   */
  const getTableData = () => {
    return tableDataRef.value;
  };
  /**
   * 获取分过页的数据
   */
  const getPagingData = () => {
    return paging.value;
  };
  /**
   *  获取当前表格的显示数据
   */
  const getCurrentData = () => {
    return currentData.value;
  };
  /**
   *  获取当前表格的过滤数据
   */
  const getFilteredData = () => {
    return filteredData.value;
  };

  const {
    onRowClick: onRowClickForHightlight,
    addRowHighlightClass,
    clearRowsHighlight
  } = useTableRowHighlight({ tableData: dataComputed, rowKey: props.rowKey });

  /**
   * 表格行的自定义类目
   * 可增加自定义类目
   * @param {*} data
   */
  const tableRowClassName = data => {
    // 执行 获取 页面的自定义class
    let classList = props.rowClassName ? props.rowClassName(data) : '';
    try {
      if (typeof classList === 'function') classList = classList(data);
      classList = classList ? classList.split(' ') : [];

      const { row } = data;
      if (row.hover) classList.push('tr-row-hover');

      props.useRowHighlight && addRowHighlightClass({ classList, row });

      classList = classList.join(' ');
    } catch (e) {
      console.log(e);
    }

    return classList;
  };

  /************ cross 十字高亮 Start ************/
  /**
   * 记录hover的单元格相关属性，[prop = 该列的字段索引, index = 第几列];
   */
  const hoverColumnKey = ref([]);

  /**
   * 当单元格 hover 进入时会触发该事件;
   * @param {*} row
   * @param {*} column
   * @param {*} cell
   */
  const onCellMouseEnter = (row, column, cell, event) => {
    emit('cellMouseEnter', row, column, cell, event);
    if (!props.columnHighlight) return;
    const { property, no } = toRaw(column);
    hoverColumnKey.value = [property, no];
  };

  /**
   * 当单元格 hover 移出时会触发该事件;
   */
  const onCellMouseLeave = (row, column, cell, event) => {
    emit('cellMouseLeave', row, column, cell, event);
    if (!props.columnHighlight) return;
    hoverColumnKey.value = [];
  };
  // 服务端分页，重新获取数据后，滚动到顶部
  const scrollToTopByServer = () => {
    document.scrollingElement.scrollTop =
      height2Top(`.reference-${tableClass}`) - props.referenceTop;
  };
  /************ cross 十字高亮 End ************/
  defineExpose({
    tableClass,
    tableRef,
    getPage,
    setPage,
    getPageSize,
    scrollTo,
    scrollToTop,
    scrollToLeft,
    setCurrentRow,
    getTableData,
    getPagingData,
    getCurrentData,
    getFilteredData,
    tablePopoverRef,
    setVirtualListTop,
    setHeaderAbouveElWidth,
    setPageSize,
    setFilters,
    clearFilters,
    clearFiltersAndSorters,
    clearSorters,
    onPopoverSort,
    currentSortKey,
    currentSortOrder,
    dealFixedHeader,
    scrollToTopByServer,
    clearRowsHighlight
  });
</script>

<style lang="scss">
  .editDatePickerPopper {
    z-index: 999 !important;
  }
  .editDatePicker {
    width: 100% !important;
    height: 32px;
    font-family: Inter;
    font-size: 15px;
    .el-input__inner {
      text-align: right;
      padding: 0 10px !important;
    }
    .el-input__prefix {
      display: none !important;
    }
  }
  .tableEditInput {
    height: 30px !important;
    &.el-textarea {
      height: 100% !important;
      .el-textarea__inner {
        height: 100%;
        padding: 8px;
        line-height: 18px;
        border-radius: 0;
      }
    }
  }
</style>

<style lang="scss" scoped>
  .header {
    background: var(--xs-theme-color, #fff);
    z-index: 1004;
    color: #595959;
    height: auto;
    .header-label {
      padding: 8px 0;
      min-height: 40px;
      vertical-align: middle;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: left;

      img,
      svg {
        cursor: pointer;
        width: 12px;
        height: 12px;
      }
      > span {
        display: inline-block;
        height: auto;
        max-width: 100%;
        line-height: 16px;
        font-size: 14px;
        font-weight: normal;
      }
      .icon-help {
        font-size: 10px;
        color: #8c8c8c !important;
        margin-right: 4px;
      }

      .filter-wrapper {
        flex: 0 0 10px;
        margin-left: 4px;
        width: 12px !important;
        .reference_wrapper {
          display: flex;
          .sortIcon {
            font-size: 20px;
            color: var(--icon-btn-color);
            cursor: pointer;
          }
        }
      }
    }
  }

  .btn-box {
    display: flex;
    gap: 32px;
    .btn-item {
      display: flex;
      width: 260px;
      height: 40px;
      padding: 0px 16px;
      font-size: 16px;
      color: #3d6dda;
      justify-content: center;
      align-items: center;
      gap: 8px;
      border-radius: 2px;
      border: 1px solid #3d6dda;
      background: #fff;
      cursor: pointer;
    }
  }

  .has-summary {
    &.first-summary {
      :deep(.el-table) {
        // 商品表格第一行高亮
        .el-table__body-wrapper .el-table__body .el-table__row:first-child {
          --el-fill-color-lighter: var(
            --el-table-row-summary-bg-color
          ) !important;
          .cell {
            // 合计行的自定义字段，鼠标默认样式
            cursor: default;
          }
          // 合计行第一列隐藏勾选框
          td:first-child {
            .el-checkbox .is-disabled {
              opacity: 0;
              cursor: default;
            }
          }
        }
      }
    }
    &.last-summary {
      :deep(.el-table) {
        // 商品表格第一行高亮
        .el-table__body-wrapper .el-table__body .el-table__row:last-of-type {
          --el-fill-color-lighter: var(
            --el-table-row-summary-bg-color
          ) !important;
          // 合计行第一列隐藏勾选框
          td:first-child {
            .el-checkbox .is-disabled {
              opacity: 0;
              cursor: default;
            }
          }
        }
      }
    }
  }

  .pagination-wrapper {
    height: 64px;
    display: flex;
    justify-content: flex-end;
  }

  :deep(.el-scrollbar__bar.is-vertical) {
    z-index: 5;
    right: 0;
  }

  :deep(.el-table) {
    .tr-row-hover {
      --el-fill-color-lighter: var(--el-table-row-hover-bg-color) !important;
    }
  }
</style>
<style lang="scss" src="./Table.scss"></style>
<style>
  .el-pagination .el-select .el-input__inner {
    box-shadow: none !important;
  }
  .el-pagination .el-select .el-input.is-focus .el-input__inner {
    box-shadow: none !important;
  }
</style>
