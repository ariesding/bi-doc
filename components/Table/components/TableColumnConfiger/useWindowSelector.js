/**
 * @author tangyishan
 * @description 切换视窗模板
 */

import {
  ENTERPRISE_WINDOW,
  PERSONAL_WINDOW,
  SYSTEM_WINDOW
} from '@/components/WindowManagement/helper/Constants';
import { useGetLoginUserRole } from '@/hooks/useGetLoginUserRole';
import { useProjectWindowStore } from '@/store/useProjectWindow';
import { computed, ref } from 'vue';
import MessageBox from '@/components/ConfirmDialog/Confirm';
import { saveTableConfigTemplateApi } from '@/api/base';
import { ElMessage } from 'element-plus';
import { wait } from '@/utils/utils';
import _isEqual from 'lodash/isEqual';

const useWindowSelector = ({
  route,
  tableKey,
  showScmb = ref(true),
  columnKey = ref(''),
  tower,
  curTemplateId,
  moduleList,
  switchTemplateUIHandler,
  getSaveTemplateParams
}) => {
  // 是否管理员
  const { isAdmin } = useGetLoginUserRole();
  // 视窗模板仓库
  const windowStore = useProjectWindowStore();
  // 当前模板
  const curTemplate = computed(() =>
    windowStore.getTemplate({
      tableKey: tableKey.value,
      templateId: curTemplateId.value
    })
  );
  // 显示保存至企业视窗弹窗
  const showSaveToEnterpriseDialog = ref(false);
  // 是否是我的项目
  const isProject = computed(() => route.meta.showBreadCrumbBorder);

  // 模板全名称
  const templateFullName = computed(() => {
    if (!isProject.value || !tableKey.value || !curTemplateId.value) {
      return '';
    }
    return windowStore.getTemplateFullName({
      tableKey: tableKey.value,
      templateId: curTemplateId.value
    });
  });

  // 点击模板切换了
  const onTemplateChange = value => {
    const { id, display } = value;
    curTemplateId.value = id;
    switchTemplateUIHandler(display);
  };

  // 请求切换模板
  const fetchSwitchTemplate = async () => {
    return new Promise((resolve, reject) => {
      windowStore.switchTemplate({
        tableKey: tableKey.value,
        templateId: curTemplateId.value,
        templateType: curTemplate.value.templateType,
        tower,
        cb: result => {
          (result ? resolve : reject)();
        }
      });
    });
  };

  // ********************************** 保存 **********************************
  // 检查是否可以保存
  const checkCanSave = () => {
    const errorMsg = getSaveTemplateErrorMsg();
    if (errorMsg) {
      ElMessage({
        type: 'warning',
        message: errorMsg
      });
      return false;
    }
    return true;
  };

  // 获取保存模板的错误提示信息
  const getSaveTemplateErrorMsg = () => {
    const { templateType } = curTemplate.value;
    // 个人模板，允许操作
    if (templateType === PERSONAL_WINDOW) return '';

    if (templateType === SYSTEM_WINDOW)
      return '系统视窗不支持修改，请保存至个人视窗或企业视窗';

    if (!isAdmin.value) return '您无权限修改，请保存至个人视窗';

    return '';
  };

  // 是否切换了模板
  const isTemplateChanged = async () => {
    const defaultTemplateId = await windowStore.getDefaultTemplateId({
      tableKey: tableKey.value,
      showScmb: showScmb.value,
      columnKey: columnKey.value,
      tower,
      force: true
    });
    return curTemplateId.value !== defaultTemplateId;
  };

  // 模板字段排序是否有变化
  const isTemplateSortChanged = () => {
    const { display: curDisplay } = getSaveTemplateParams();
    const allkeys =
      moduleList.value
        ?.map(item => item.fieldList)
        ?.flat()
        ?.map(item => item.key) || [];
    const { display } = curTemplate.value;
    // 过滤掉原先不存在的keys
    const fitleredkeys = display?.filter(item => allkeys.includes(item)) || [];
    return !_isEqual(curDisplay, fitleredkeys);
  };

  // 请求保存模板
  const fetchSaveProjectTemplate = async params => {
    return saveTableConfigTemplateApi(params, { tower });
  };

  // 点击保存至个人视窗
  const saveToPersonWindow = () => {
    MessageBox({
      title: '保存至个人视窗',
      message: '个人视窗名称',
      draggable: false,
      showCancelButton: true,
      boxType: 'prompt',
      showInput: true,
      inputPlaceholder: '请输入视窗名称',
      inputValidator: value => {
        const name = value?.trim();
        if (!name) return '请输入视窗名称';
        return true;
      },
      lockScroll: true
    })
      .then(async ({ value }) => {
        fetchSaveToPersonWindow(value?.trim());
      })
      .catch(error => {
        console.log('error: ', error);
      });
  };

  // 请求保存个人视窗模板
  const fetchSaveToPersonWindow = async name => {
    try {
      const { display } = getSaveTemplateParams();
      const params = {
        tableKey: tableKey.value,
        display,
        name,
        templateType: PERSONAL_WINDOW
      };
      await fetchSaveProjectTemplate(params);
      showSaveSuccessMsg();
      refreshTemplateList();
    } catch (error) {
      console.log('error: ', error);
    }
  };

  // 请求保存企业视窗
  const onSaveToEnterpriseConfirm = async value => {
    try {
      const { windowName, memberIds } = value;
      const { display } = getSaveTemplateParams();
      const params = {
        tableKey: tableKey.value,
        display,
        name: windowName,
        templateType: ENTERPRISE_WINDOW,
        userJson: memberIds
      };
      await fetchSaveProjectTemplate(params);
      showSaveToEnterpriseDialog.value = false;
      showSaveSuccessMsg();
      refreshTemplateList();
    } catch (error) {
      console.log('error: ', error);
    }
  };

  // 提示成功
  const showSaveSuccessMsg = () => {
    ElMessage({
      type: 'success',
      message: '保存成功'
    });
  };

  // 刷新模板列表
  const refreshTemplateList = async () => {
    await wait(250);
    windowStore.getTemplateList({
      tableKey: tableKey.value,
      tower,
      force: true
    });
  };

  return {
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
  };
};

export default useWindowSelector;
