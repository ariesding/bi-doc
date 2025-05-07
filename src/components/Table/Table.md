# Table API

## Table 属性

| 属性名 | 说明  | 类型  | Default |
| --- | --- | --- | --- |
| showHeaderFilter | 是否显示表头过滤器 | Boolean | false |
| inPageScroll | 是否在页面内滚动 | Boolean | false |
| stickyDelay | sticky指令的延迟时间(ms) | Number | 500 |
| tableBorder | 是否显示表格边框 | Boolean | false |
| scrollLoadMore | 滚动到底加载更多 | Boolean | false |
| stripe | 是否使用斑马纹 | Boolean | true |
| skeletonRows | 骨架屏渲染行数 | Number | 20  |
| data | 表格数据源 | Array | []  |
| columns | 表格列配置 | Array | []  |
| offset | 表头吸顶时距离顶部的距离 | Number | 48  |
| bottomFixedOffset | 底部滚动条fixed时的偏移量(px) | Number | 0   |
| headerFilterStickyable | 是否开启表头过滤器吸顶 | Boolean | false |
| headerFilterZIndex | 表头过滤器的z-index | Number | 9   |
| themeColor | 表头背景色 | String | #fff |
| columnHighlight | 是否高亮鼠标悬停的列 | Boolean | false |
| maxHeight | 表格的最大高度 | String/Number | auto |
| useInnerSort | 是否使用el-table内部的排序 | Boolean | true |
| useInnerFilter | 是否使用内置过滤 | Boolean | true |
| hideSumLineWhenUseInnerFilter | 使用el-table内置过滤时是否隐藏合计行 | Boolean | false |
| disableInnerSortAndFilter | 是否禁用内置排序和过滤 | Boolean | false |
| numberClassName | 数字类型的单元格的class名称 | String | xs-number-cell |
| textClassName | 文本单元格的类名 | String | xs-text-cell |
| showSummary | 是否显示合计行 | Boolean | false |
| summaryMethod | 合计行计算方法 | Function | () => {} |
| defaultSort | 默认排序 | Object | {}  |
| stickyable | 是否可吸顶 | Boolean | true |
| selfSticky | 是否使用自定义吸顶 | Boolean | false |
| pagination | 分页配置 | Object/Boolean | true |
| isSmallPagination | 是否使用小型分页 | Boolean | false |
| paginationStyle | 分页容器样式 | Object | {}  |
| unScrollTop | 页码变化时是否滚动到表格顶部 | Boolean | false |
| spanMethod | 单元格合并方法 | Function | () => {} |
| highlightCurrentRow | 是否高亮当前行 | Boolean | false |
| rowKey | 行数据的key | String | ''  |
| rowClassName | 行的类名 | Function | undefined |
| cellClassName | 单元格类名 | Function | undefined |
| clickRow | 点击单元格所在的行 | String/Number | ''  |
| clickProp | 点击单元格所在的列的key | String/Number | ''  |
| secondarySort | 次要排序字段 | Object | {}  |
| tableStripe | 是否使用斑马纹 | Boolean | true |
| resetPostionOnDataChange | 数据变化时是否重置滚动位置 | Boolean | true |
| filterOption | 过滤选项 | Object | {}  |
| headerClickable | 表头是否可点击 | Boolean | false |
| headerProp | 默认选中的表头字段 | String | null |
| emptyLabel | 空数据文案 | String | 暂无相关数据 |
| emptyBtnList | 空数据时的按钮列表 | Array | []  |
| headerMainColor | 表头是否使用主色 | Boolean | false |
| loading | 加载状态 | Boolean | false |
| resizable | 是否可调整列宽 | Boolean | true |
| errorRange | 错误范围 | Array | undefined |
| tableKey | 表格唯一标识 | String | ''  |
| calcScrollHeight | 是否计算滚动高度 | Boolean | true |
| closeTablePopoverOnScroll | 滚动时是否关闭tablePopover | Boolean | true |
| isVirtualList | 是否使用虚拟列表 | Boolean | false |
| virtualListLength | 虚拟列表可视区域长度 | Number | 30  |
| virtualListLimitLength | 虚拟列表限制长度 | Number | 0   |
| virtualListItemHeight | 列表项每一项的高度 | Number | 40  |
| referenceTop | 参考顶部偏移量 | Number/String | 16  |
| referenceBottom | 参考底部偏移量 | Number/String | ''  |
| useScrollResizeHeader | 横向滚动触发固定表头的resize事件 | Boolean | true |
| showBorderMask | 有边框的table左右边框遮挡 | Boolean | false |
| headerFilterMasterBackground | 表头过滤器主背景色 | String | rgba(0,0,0,0) |
| emptySize | 空状态尺寸 | Number | 425 |
| useRowHighlight | 使用表格内部的表格行点击高亮 | Boolean | 依赖路由meta |

## Table 事件

| 事件名 | 说明  | 类型  |
| --- | --- | --- |
| stickyChange | 表格吸顶状态变化时触发 | Function |
| resetColumnWidth | 表头双击恢复列宽时触发 | Function |
| headDragend | 表头拖拽结束时触发 | Function |
| headerClick | 表头点击时触发 | Function |
| getEditInfo | 单元格编辑完成时触发 | Function |
| scroll | 表格滚动时触发 | Function |
| currentDataChange | 当前页数据变化时触发 | Function |
| pageIndexChange | 页码变化时触发 | Function |
| pageSizeChange | 每页条数变化时触发 | Function |
| popoverAllReset | 筛选/排序重置时触发 | Function |
| popoverConfirm | 筛选确定时触发 | Function |
| popShow | 筛选弹窗显示时触发 | Function |
| popoverCancel | 筛选取消时触发 | Function |
| sortChange | 排序变化时触发 | Function |
| cellClick | 单元格点击时触发 | Function |
| rowClick | 行点击时触发 | Function |
| cellMouseEnter | 单元格鼠标进入时触发 | Function |
| cellMouseLeave | 单元格鼠标离开时触发 | Function |

## Table 插槽

| 插槽名 | 说明  | 子标签 |
| --- | --- | --- |
| default | 自定义默认内容，通常配合 Table-column 使用 | Table-column |
| append | 插入至表格最后一行之后的内容，若表格有合计行，该 slot 会位于合计行之上。 | —   |
| empty | 当数据为空时自定义的内容 | —   |
| emptyContent | 嵌套在 empty 内部，用于进一步自定义空数据内容 | —   |
| skeleton | 自定义骨架屏内容 | —   |
| paginationLeft | 分页器左侧自定义内容 | —   |
| [column.slotLabel] | 动态表头插槽，列配置 slotLabel 时生效。slot 名由 columns 配置决定 | —   |
| [item.topFilter?.slot] | 表头过滤器自定义内容，配置 topFilter.slot 时生效 | —   |
| [column.filterSortSlot] | 表头排序/筛选自定义内容，配置 filterSortSlot 时生效 | —   |
| [column.slot] | 动态单元格插槽，列配置 slot 时生效 | —   |

> 说明：
> 
> * 动态插槽如 [column.slotLabel]、[item.topFilter?.slot]、[column.filterSortSlot]、[column.slot]，需要在列配置中指定相应的 slot 名称，才会生效。
> * 这些插槽可用于高度自定义表头、单元格、过滤器、排序等内容。
> * 其他如 TableHeaderFilter、TablePopover 等子组件也可能支持插槽，具体可参考对应子组件文档。

# Table-column API

## Table-column 属性
