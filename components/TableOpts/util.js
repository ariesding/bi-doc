import { useProjectPermissionsStore } from '@/store/useProjectPermissions';

/**
 * 获取有效的按钮类型
 * @param {*} typePermkeysMap 按钮和需要权限的映射
 * @param {*} optTypes 可选的按钮类型，不传默认取 typePermkeysMap 的 keys
 */
export const getValidOptTypes = (optTypePermkeysMap, optTypes) => {
  // 权限仓库
  const permsStore = useProjectPermissionsStore();

  const hasPermissionTypes = Object.keys(optTypePermkeysMap)
    .map(key => {
      const permKeys = [].concat(optTypePermkeysMap[key]);
      return permKeys.some(item => !permsStore.hasPermission(item))
        ? false
        : key;
    })
    .filter(Boolean);

  return optTypes?.length
    ? optTypes?.filter(item => hasPermissionTypes.includes(item)) || []
    : hasPermissionTypes;
};
