/**
 * @description 状态管理文件，现在一个globalTableTemplateDialogVisible
 */
import { reactive } from 'vue';

export const state = reactive({
  // 全局表格字段模板弹窗的显示状态
  globalTableTemplateDialogVisible: false
});
