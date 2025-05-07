/**
 * @author tangyishan
 * @description 表格工具方法
 */

import { getRandomCode } from '@/config/Table';

/**
 * 为表格数据添加唯一id
 * @param {*} data
 */
export const addRowId = data => {
  (data || []).forEach((item, index) => {
    item.__row_id__ = `${index}_${getRandomCode()}`;
    if (item.children) {
      addRowId(item.children);
    }
  });
};
