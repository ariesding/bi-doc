<template>
  <div class="filter" :class="{ 'hide-filter-title': !showFilterTitle }">
    <div v-if="showFilterTitle" class="filter-title">
      <h4>筛选</h4>
      <el-checkbox v-model="isFilterResigned">过滤离职人员</el-checkbox>
    </div>
    <div class="filter-search">
      <SearchInput
        ref="searchInput"
        v-model="keyword"
        class="search-input"
        placeholder="请输入成员名称"
        @on-search="handleInput"
      />
      <!-- <el-input
        ref="searchInput"
        v-model="keyword"
        placeholder="请输入成员名称"
        @keydown.enter="handleInput"
      >
        <template #suffix>
          <el-icon class="icon-search cursor-pointer" @click="handleInput" />
        </template>
      </el-input> -->
    </div>
    <UserInfoList
      ref="userTree"
      :choose-type="type"
      :choose-info="chooseInfo"
      :is-filter-resigned="isFilterResigned"
      :is-search="isSearch"
      :show-branch-list="showBranchList"
      :station-list="stationList"
      :rank-list="rankList"
      :all-user-list="allUserList"
    />
  </div>
  <div class="foot xs-flex xs-flex-space-between">
    <XSButton plain @click="cancel">清除</XSButton>
    <div>
      <XSButton plain @click="close">取消</XSButton>
      <XSButton normal :style="{ marginLeft: '16px' }" @click="submit">
        确定
      </XSButton>
    </div>
  </div>
</template>
<script setup>
  import { computed, nextTick, onMounted, ref, watch, defineExpose } from 'vue';
  import UserInfoList from './UserInfoList.vue';
  import SearchInput from '@/components/SearchInput/index.vue';

  const props = defineProps({
    chooseUser: {
      type: Array,
      default: () => []
    },
    // 显示过滤提示
    showFilterTitle: {
      type: Boolean,
      default: true
    },

    type: {
      type: [String, undefined],
      default: 'branch'
    },
    filterOptions: {
      type: Array,
      default: () => []
    },
    // 不需要显示离职部门成员
    hideDeptDimission: {
      type: Boolean,
      default: false
    }
  });

  const emits = defineEmits(['close', 'cancel', 'submit']);

  const searchInput = ref();

  // 部门列表
  const branchList = ref([]);
  // 岗位列表
  const stationList = ref([]);
  // 职级列表
  const rankList = ref([]);
  // 所有员工列表
  const allUserList = ref([]);

  // 是否过滤离职人员
  const isFilterResigned = ref(true);

  // 初始化设置过滤离职人员状态
  const setFilter = () => {
    if (!allUserList.value?.length || !props.chooseUser.filter(k => k)?.length)
      return;
    isFilterResigned.value = !allUserList.value
      .filter(k => Number(k.status) === 3)
      .find(k => props.chooseUser.includes(k.userId));
  };

  // 根据选中的人以及类型确定应该选中的id
  const chooseInfo = ref([]);

  // 初始化获取面板数据
  const getData = () => {
    // 设置部门/成员/岗位/职级 数据源信息
    let [deptList = [], postList = [], userList = []] =
      props.filterOptions || [];

    if (props.hideDeptDimission) {
      // 部门树下 剔除离职人员
      deptList = deptList.filter(dept => dept.deptName !== '离职人员');
    }

    branchList.value = deptList || [];
    stationList.value = postList.map(k => ({
      label: k.label,
      id: k.id,
      postId: k.postId
    }));
    rankList.value = postList.filter(k => k.children?.length);
    // .map(k => {
    //   return {
    //     label: k.label,
    //     children: k.children
    //   };
    // });
    allUserList.value = userList || [];

    // 设置已经选中的信息
    if (props.chooseUser?.length) {
      if (props.type === 'branch') {
        chooseInfo.value = [...props.chooseUser];
      } else {
        const idList = props.chooseUser
          .filter(id => id)
          .map(id => {
            const data = allUserList.value.find(k => k.userId === id);
            return props.type === 'station'
              ? `post-${data?.postId}`
              : `rank-${data?.rankId}`;
          });
        chooseInfo.value = Array.from(new Set(idList)).filter(k => k);
      }
    }

    setFilter();
  };

  // 搜索关键词
  const keyword = ref('');

  // 是否是搜索状态
  const isSearch = ref(false);

  // 确定搜索方法
  const handleInput = () => {
    isSearch.value = !!keyword.value;
  };

  // 无搜索关键字则取消搜索状态
  watch(keyword, () => {
    if (!keyword.value) isSearch.value = false;
  });

  // 成员搜索更新树形结构数据
  const searchMembers = (treeData, keyword) => {
    function searchInNode(node, parentPath = []) {
      const path = parentPath.concat(node.label);

      if (!node.children?.length) {
        // 过滤离职员工场景下不展示离职员工
        if (isFilterResigned.value && node.isResigned) {
          return [];
        }
        if (isSearch.value) {
          if (node.label.includes(keyword) && node.isMember) {
            return [
              {
                label: node.label,
                id: node.id,
                isMember: node.isMember,
                isResigned: node.isResigned
              }
            ];
          }
          return [];
        } else {
          return { ...node };
        }
      } else {
        // if (!node.children.find(k => k.isMember)) return [];
        const children = node.children?.flatMap(child =>
          searchInNode(child, path)
        );

        return children.length > 0
          ? [
              {
                label: node.label,
                id: node.id,
                isMember: node.isMember,
                isResigned: node.isResigned,
                children
              }
            ]
          : [];
      }
    }

    return treeData?.flatMap(department => {
      const departmentResults = (department.children || []).flatMap(team =>
        searchInNode(team, [department.label])
      );

      return (department.id === 'dimission' || isSearch.value) &&
        !departmentResults.length
        ? []
        : [
            {
              label: department.label,
              id: department.id,
              children: departmentResults
            }
          ];
    });
  };

  // 当前展示的部门成员信息
  const showBranchList = computed(() => {
    let list = [];
    if (isSearch.value || isFilterResigned.value) {
      list = searchMembers(
        branchList.value,
        isSearch.value ? keyword.value : ''
      );
    } else {
      list = branchList.value;
    }
    return list;
  });

  const cancel = () => {
    emits('cancel');
  };

  const close = () => {
    emits('close');
  };

  const userTree = ref();

  const submit = () => {
    let memberList = [];
    const { type, list } = userTree.value.getChooseInfo();
    if (type === 'branch') {
      memberList = list;
    } else {
      memberList = allUserList.value
        .filter(i => !isFilterResigned.value || Number(i.status) !== 3)
        .filter(k =>
          list.includes(
            type === 'station' ? `post-${k.postId}` : `rank-${k.rankId}`
          )
        )
        .map(j => j.userId);
    }
    emits('submit', type, memberList);
  };

  onMounted(async () => {
    getData();
    await nextTick();
    searchInput.value?.inputRef?.focus();
  });

  defineExpose({
    userTree
  });
</script>
<style lang="scss" scoped>
  .filter {
    flex: 1 1 0;
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: 16px;
    &.hide-filter-title {
      padding: 0;
    }
    &-title {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      :deep(.el-checkbox) {
        height: 14px;
        .el-checkbox__label {
          color: #8c8c8c !important;
          padding-left: 4px !important;
        }
      }
    }
    &-search {
      margin-bottom: 8px;
      .search-input {
        :deep(.el-input) {
          width: 100% !important;
        }
      }
      .icon-search {
        font-size: 16px;
        margin-top: 8px;
      }
    }
    .box {
      flex: 1 1 0;
    }
  }
  .foot {
    text-align: right;
    padding: 8px 16px;
    border-top: 1px solid #d4dbe9;
  }
</style>
