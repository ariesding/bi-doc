import { computed, ref } from 'vue';

export const useTemplateDialog = ({ data, optType = 'create' }) => {
  // 可排序数量限制
  const sortNumberLimit = ref(0);

  // 所有模块数据
  const moduleList = ref([]);

  // 排序 field
  const sortFieldList = ref([]);

  // 默认排序
  const defaultDisplay = ref([]);

  // 选择的 field 数量，排除固定位置的
  const seletedFieldCount = computed(() =>
    moduleList.value.reduce(
      (total, module) =>
        total +
        module.fieldList.filter(field => !field.fixed && field.checked).length,
      0
    )
  );

  // 点击选择 field
  const clickMoudleField = (field, isBatch) => {
    if (field.enabled && !field.fixed) {
      // 如果不是通过点击check-box来触发的话，需要让isBatch为true才能处理
      if (isBatch) field.checked = !field.checked;
      _updateUnselectedFieldStatus();
      _updateSortFieldList();
    }
  };

  // 清空所有选中的 field
  const clearAllFields = () => {
    if (!sortFieldList.value?.length) return;

    sortFieldList.value.forEach(field => {
      field.checked = false;
    });
    _updateUnselectedFieldStatus();
    _updateSortFieldList();
  };

  // 刷新所有状态：选中项和排序
  const refreshAllStatus = isDefault => {
    moduleList.value.forEach(module => {
      module.fieldList.forEach(field => {
        field.enabled = true;
        field.checked = isDefault ? field.defaultOrder > -1 : field.order > -1;
      });
    });
    _updateUnselectedFieldStatus();
    sortFieldList.value = _getOriginSortedFieldList(isDefault);
  };

  // 获取原始排序的 field
  const _getOriginSortedFieldList = isDefault => {
    let sortKey = isDefault ? 'defaultOrder' : 'order';
    let fieldList = moduleList.value.reduce(
      (total, module) => [
        ...total,
        ...module.fieldList.filter(field => field[sortKey] > -1)
      ],
      []
    );
    if (isDefault) {
      fieldList = defaultDisplay.value.map(key =>
        fieldList.find(field => field.key === key)
      );
    } else {
      fieldList.sort((a, b) => a[sortKey] - b[sortKey]);
    }
    fieldList = fieldList.filter(Boolean);
    return fieldList;
  };

  // 判断排序是否发生变化
  const isSortChanged = () => {
    let originList = _getOriginSortedFieldList();
    if (originList.length !== sortFieldList.value.length) return true;
    return originList.some(
      (field, index) => field.name !== sortFieldList.value[index].name
    );
  };

  // 获取选择的 field
  const getSelectedFieldList = () => {
    return moduleList.value.reduce(
      (total, module) => [
        ...total,
        ...module.fieldList.filter(field => field.checked)
      ],
      []
    );
  };

  // 更新未选择的 field 状态
  const _updateUnselectedFieldStatus = () => {
    let enabled = seletedFieldCount.value < sortNumberLimit.value;
    moduleList.value.forEach(module => {
      module.fieldList.forEach(field => {
        if (!field.checked) {
          field.enabled = enabled;
        }
      });
    });
  };

  // 更新排序的 field
  const _updateSortFieldList = () => {
    // 获取选择的待排序 field
    let newFieldList = getSelectedFieldList();
    // 当前排序 field 删除
    sortFieldList.value = sortFieldList.value.filter(field =>
      newFieldList.includes(field)
    );
    // 当前排序 field 增加
    newFieldList.forEach(field => {
      if (!sortFieldList.value.includes(field)) {
        sortFieldList.value.push(field);
      }
    });
  };

  // 恢复默认排序
  const resetSort = () => {
    refreshAllStatus(true);
  };

  const boostrap = () => {
    data && _handleModuleData(data);
  };

  // **************************************** 网络请求 ****************************************
  // 处理请求的模块数据
  const _handleModuleData = data => {
    let {
      columnInfo,
      display,
      defaultDisplay: _defaultDisplay,
      maxNum = 25
    } = data;
    if (optType === 'create') {
      display = [];
    }
    defaultDisplay.value = _defaultDisplay ?? [];
    sortNumberLimit.value = maxNum;
    if (columnInfo) {
      // 模块 Map
      let moduleMap = {};
      columnInfo.forEach(
        (
          { columnKey, columnName, group, subGroup, isDefault, note },
          index
        ) => {
          const isSecondaryGroup = subGroup && group !== subGroup;
          const curGroup = isSecondaryGroup ? subGroup : group;
          let field = {
            key: columnKey,
            name: columnName,
            note: note ?? columnName
          };
          // 系统默认初始排序
          if (isDefault === '1') {
            field.defaultOrder = index;
          }
          // 当前排序
          let order = display.indexOf(columnKey);
          if (order > -1) {
            field.order = order;
          }
          // 获取模块，没有则创建
          let module = moduleMap[curGroup] ?? {
            name: curGroup,
            fieldList: [],
            isSecondaryGroup
          };
          // 更新 field
          module.fieldList.push(field);
          // 更新模块 Map
          moduleMap[curGroup] = module;
        }
      );
      // 更新 moduleList
      moduleList.value = [];
      Object.keys(moduleMap).forEach(key => {
        moduleList.value.push(moduleMap[key]);
      });

      // 颜色处理
      const primaryList = moduleList.value.filter(
        item => !item.isSecondaryGroup
      );
      moduleList.value.forEach((item, i) => {
        const index = primaryList.findIndex(val => val.name === item.name);
        // 如果当前模块是一级分类
        if (index !== -1) {
          // 且是偶数排名，这里是从0开始的，所以 index % 2 为真表示偶数
          if (index % 2) {
            item.bgColor = '#fafafb';
          } else {
            item.bgColor = '';
          }
        } else {
          // 二级分类的话，背景色同上一个
          item.bgColor = moduleList.value[i - 1].bgColor;
        }
      });

      refreshAllStatus();
    }
  };

  boostrap();
  return {
    sortNumberLimit,
    moduleList,
    sortFieldList,
    seletedFieldCount,
    clearAllFields,
    clickMoudleField,
    isSortChanged,
    resetSort
  };
};
