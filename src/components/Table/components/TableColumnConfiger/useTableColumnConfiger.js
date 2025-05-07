import { ElMessage } from 'element-plus';
import { computed, ref, watch } from 'vue';
import {
  getTableColumnConfigApi,
  postSaveTableColumnConfigApi
} from '@/api/base.js';
import _debounce from 'lodash/debounce';
import _orderBy from 'lodash/orderBy';
import { pinyin } from 'pinyin-pro';
export const useTableColumnConfiger = ({
  tableKey,
  showScmb = ref(true),
  columnKey = ref(''),
  showDrawerDelegate = ref(false),
  tower,
  isIndicator,
  sortSubNumber,
  customDisplay = ref(null)
}) => {
  const isTestMode = computed(
    () =>
      import.meta.env.MODE !== 'production' ||
      ['test.ecbis.com', 'demo2.ecbis.cn'].includes(window.location.host)
  );

  // 当前使用的模板id,都是字符串格式
  const curTemplateId = ref('-1');

  // 是否正在加载；
  const isLoading = ref(false);

  // 可排序数量限制
  const sortNumberLimit = ref(0);

  // 模板名称
  const templateName = ref('');

  const allData = ref({});

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

  // 判断是否已经全选，因为“全选”功能是隐藏功能，只有测试开放，所以通过逻辑判断当前全选状态，再次双击取消全选
  const isChooseAll = computed(() => {
    if (!moduleList.value?.length) return false;
    const list = moduleList.value
      .map(k => k.fieldList.filter(field => !field.hidden))
      .flat();
    return list.filter(k => k.enabled).every(j => j.checked);
  });

  // 点击全选(测试环境对字段测试需要放开字段选择限制，目前可以通过后端限制最大可选数配置，该代码暂时注释)
  const clickAllFields = () => {
    if (!isTestMode.value) return;
    // if (isChooseAll.value) {
    //   moduleList.value.forEach(module => {
    //     module.fieldList
    //       .filter(field => !field.hidden)
    //       .forEach(field => {
    //         field.checked = false;
    //       });
    //   });
    // } else {
    //   moduleList.value.forEach(module => {
    //     module.fieldList
    //       .filter(field => !field.hidden)
    //       .forEach(field => {
    //         field.checked = true;
    //       });
    //   });
    // }

    // _updateUnselectedFieldStatus();
    // _updateSortFieldList();
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

  // 点击选择 field
  const clickMoudleField = (field, isBatch) => {
    if (field.enabled && !field.fixed) {
      // 如果不是通过点击check-box来触发的话，需要让isBatch为true才能处理
      if (isBatch) field.checked = !field.checked;
      _updateUnselectedFieldStatus();
      _updateSortFieldList();
    }
  };

  // 批量切换选中字段
  const switchTemplate = list => {
    clearAll();
    sortFieldList.value = [];
    // 根据选中的字段进行选择，保证选中的顺序
    list.forEach(key => {
      moduleList.value.some(module => {
        return module.fieldList.some(field => {
          if (field.key === key) {
            clickMoudleField(field, true);
            return true;
          }
        });
      });
    });
  };

  // clear all 选中field
  const clearAll = () => {
    moduleList.value.forEach(module => {
      module.fieldList.forEach(field => {
        field.enabled = true;
        field.checked = false;
      });
    });
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

  // 请求数据
  const requestModuleData = () => {
    if (!tableKey.value) {
      sortNumberLimit.value = 0;
      defaultDisplay.value = [];
      moduleList.value = [];
      sortFieldList.value = [];
      return;
    }
    if (isLoading.value) return;
    isLoading.value = true;
    getTableColumnConfigApi(
      {
        tableKey: tableKey.value,
        showScmb: showScmb.value,
        columnKey: columnKey.value
      },
      { tower }
    )
      .then(res => {
        let data = res?.data?.data;
        if (data) {
          allData.value = data;
          data && _handleModuleData(data);
        }
      })
      .catch(error => {
        console.log('error: ', error);
      })
      .finally(() => {
        isLoading.value = false;
      });
  };

  const getModuleData = _debounce(requestModuleData, 50);

  // 打开抽屉时，有tableKey则立即获取数据，没有则监听tableKey变化
  watch(showDrawerDelegate, current => {
    if (current && tableKey.value) {
      getModuleData();
    } else {
      watch(tableKey, () => {
        if (tableKey.value) getModuleData();
      });
    }
  });

  // **************************************** 网络请求 ****************************************
  // 处理请求的模块数据
  const _handleModuleData = data => {
    let {
      columnInfo,
      display,
      defaultDisplay: _defaultDisplay,
      maxNum,
      maxIndicatorNum,
      defaultTemplateId,
      templateType,
      templateName: _templateName
    } = data;
    defaultDisplay.value = _defaultDisplay ?? [];
    sortNumberLimit.value = Math.max(
      0,
      (isIndicator ? maxIndicatorNum : maxNum) - sortSubNumber
    );

    // 优先使用自定义显示字段
    if (customDisplay.value) {
      display = customDisplay.value;
    }

    // 额外处理不同类型的视窗，加上后缀
    if (templateType === 1) defaultTemplateId += 'person';
    if (templateType === 2) defaultTemplateId += 'company';
    if (templateType === 3) defaultTemplateId += 'system';
    curTemplateId.value = defaultTemplateId;
    templateName.value = _templateName || '';
    if (columnInfo) {
      // 模块 Map
      let moduleMap = {};

      // 按出现顺序记录 group 的顺序
      const groupOrder = Array.from(
        new Set(columnInfo.map(item => item.group))
      );
      // 排序逻辑
      columnInfo = _orderBy(
        columnInfo,
        [
          item => groupOrder.indexOf(item.group), // 按 group 的顺序排序
          item => item.group !== item.subGroup // group 和 subGroup 不同的排在后面
        ],
        ['asc', 'asc'] // 两个条件均升序
      );

      columnInfo.forEach(
        (
          { columnKey, columnName, group, subGroup, isDefault, note },
          index
        ) => {
          const isSecondaryGroup = subGroup && group !== subGroup;
          const groupName = isSecondaryGroup ? subGroup : group;
          const curGroup = isSecondaryGroup ? `${group}-${subGroup}` : group;
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
            key: curGroup,
            name: groupName,
            fieldList: [],
            isSecondaryGroup,
            group,
            subGroup
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
      hanldeBgColor(moduleList.value);
      handlePinyin(moduleList.value);
      refreshAllStatus();
    }
  };

  const hanldeBgColor = list => {
    // 颜色处理
    const primaryList = list.filter(item => !item.isSecondaryGroup);
    list.forEach((item, i) => {
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
        item.bgColor = list[i - 1]?.bgColor || '';
      }
    });
  };
  // 处理数据-加拼音信息
  const handlePinyin = list => {
    list.forEach(item => {
      item.fieldList.forEach(field => {
        const pinyinArray = pinyin(field.name, {
          toneType: 'none',
          type: 'array'
        });
        // 初始化拼音对象
        field.pinyin = {};
        field.pinyin.text = field.name;
        // 全拼
        (field.pinyin.fullPinyin = pinyinArray.join('').toLowerCase()),
          // 简拼
          (field.pinyin.initials = pinyinArray
            .map(p => p[0])
            .join('')
            .toLowerCase());
      });
    });
  };
  // 提交数据
  const requestUploadModuleData = async () => {
    try {
      let res = await postSaveTableColumnConfigApi(
        {
          tableKey: tableKey.value,
          columnKeys: sortFieldList.value.map(field => field.key)
        },
        { tower }
      );
      if (res) {
        ElMessage({
          type: 'success',
          message: '保存成功'
        });
      }
      return res;
    } catch (error) {
      console.log(error);
    }
  };

  return {
    isTestMode,
    switchTemplate,
    curTemplateId,
    templateName,

    allData,
    sortNumberLimit,
    moduleList,
    sortFieldList,
    seletedFieldCount,
    isChooseAll,
    clickAllFields,
    clickMoudleField,
    isSortChanged,
    clearAllFields,
    resetSort,
    requestModuleData,
    hanldeBgColor,
    requestUploadModuleData,
    isLoading
  };
};
