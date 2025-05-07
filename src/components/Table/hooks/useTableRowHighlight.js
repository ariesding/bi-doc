/**
 * @author tangyishan
 * @description 表格行点击高亮
 */

import { ref, watch } from 'vue';

/*
表格行点击高亮方案
1. 表格内部控制（普通表格，我的项目默认使用）
2. 表格外部控制（需要手动控制或外部分页）
3. 表格内部控制 + 外部控制（表格外部有选中操作，如多选设置目标等）
*/
const useTableRowHighlight = ({ tableData, rowKey }) => {
  const HIGHLIGHT_CLASS = 'high-light-row';

  const key = rowKey || '__row_id__';

  const selectedRowIds = ref([]);
  // 数据变化，清空高亮
  watch(tableData, () => {
    selectedRowIds.value = [];
  });

  // 行点击事件
  const onRowClick = row => {
    // 合计行 或者 指定行禁用高亮行，则不处理
    if (row.sumLine || row.__row_hightlight_disabled__) return;

    const rowId = row[key];
    if (selectedRowIds.value.includes(rowId)) {
      selectedRowIds.value = selectedRowIds.value.filter(id => id !== rowId);
    } else {
      selectedRowIds.value.push(rowId);
    }
  };

  // 添加高亮样式
  const addRowHighlightClass = ({ classList, row }) => {
    if (classList.includes(HIGHLIGHT_CLASS)) return;

    const rowId = row[key];
    selectedRowIds.value.includes(rowId) && classList.push(HIGHLIGHT_CLASS);
  };

  // 清空高亮样式
  const clearRowsHighlight = () => {
    selectedRowIds.value = [];
  };

  return {
    onRowClick,
    addRowHighlightClass,
    clearRowsHighlight
  };
};

export default useTableRowHighlight;
