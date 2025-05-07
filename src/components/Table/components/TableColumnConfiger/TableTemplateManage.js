/**
 * @description 动态挂载表格字段模板弹窗的方法
 * @use 外部引入mountTableTemplate方法，在需要挂载该弹窗时，传入合适的参数，调用该方法就行。
 */

import { createVNode, render } from 'vue';
import templateDialog from './templateDialog.vue';
import { appStore } from '@/store/useAppStore';

const container = document.createElement('div');
container.classList.add('table-column-template-manage');

export const mountTableTemplate = params => {
  // params 对象含有 optType,data,tableKey属性，它们是templateDialog的props属性，onClose是销毁该弹窗的方法
  const props = {
    ...params,
    // 组件自动销毁、清除的props事件
    onClose: () => {
      setTimeout(() => {
        render(null, container);
      }, 0);
    }
  };
  const vnode = createVNode(templateDialog, props);
  // 注入当前vnode的上下文，同app一致
  vnode.appContext = appStore.app._context;
  render(vnode, container);
  document.body.append(container);
};
