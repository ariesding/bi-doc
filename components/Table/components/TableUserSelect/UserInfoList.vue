<template>
  <div class="box">
    <div class="box-header">
      <el-radio-group v-model="targetType">
        <el-radio
          v-for="target in targets"
          :key="target.value"
          :label="target.value"
          :disabled="isSearch && target.value !== BRANCH_TYPE"
        >
          {{ target.label }}
        </el-radio>
      </el-radio-group>
      <div class="header-select">
        <span
          class="header-select_btn cursor-pointer"
          @click="headerSelect('all')"
        >
          全选
        </span>
        <div class="header-select_line"></div>
        <span class="header-select_btn cursor-pointer" @click="headerSelect()">
          反选
        </span>
      </div>
    </div>
    <template v-for="item in targets" :key="`treeBox${item.value}`">
      <div
        v-show="item.value === targetType"
        :ref="el => setTreeBoxMap(el, item.value)"
        class="box-body"
      >
        <el-tree
          :ref="el => setTreeMap(el, item.value)"
          :key="`tree${item.value}`"
          :class="item.value"
          :data="treeListMap[item.value]"
          :indent="20"
          node-key="id"
          show-checkbox
          :props="treeProps"
          empty-text="没有找到相关信息,请输入成员姓名再搜索"
          :expand-on-click-node="false"
          :check-on-click-node="true"
          :auto-expand-parent="false"
          :render-after-expand="false"
          :default-expanded-keys="openKeys"
          @node-click="nodeClick"
          @check="handleCheckChange"
          @node-collapse="closeNode"
          @node-expand="openNode"
        >
          <template #default="{ node }">
            <span :id="node.data.id">
              {{ node.data.label }}
            </span>
            <span v-if="node.data.isResigned">（离职）</span>
            <span v-if="isBranch && !node.data.isMember">
              ({{ getGroupMemberNumByList(node.data.children || []) }})
            </span>
            <span
              v-else-if="
                (isStation &&
                  !getGroupMemberNumById(node.data.postId, 'postId')) ||
                (isRank &&
                  node.data.isRankNode &&
                  !getGroupMemberNumById(node.data.rankId, 'rankId'))
              "
            >
              （暂无成员）
            </span>
          </template>
        </el-tree>
      </div>
    </template>
  </div>
</template>
<script setup>
  import { computed, nextTick, onMounted, ref, watch, defineExpose } from 'vue';
  import { getGroupMemberNumByList, getAllNodes } from './treeConfig';

  const props = defineProps({
    isFilterResigned: {
      type: Boolean,
      default: true
    },
    chooseInfo: {
      type: Array,
      default: () => []
    },
    chooseType: {
      type: String,
      default: ''
    },
    isSearch: {
      type: Boolean,
      default: false
    },
    showBranchList: {
      type: Array,
      default: () => []
    },
    stationList: {
      type: Array,
      default: () => []
    },
    rankList: {
      type: Array,
      default: () => []
    },
    allUserList: {
      type: Array,
      default: () => []
    }
  });

  const treeBoxRefMap = ref({});

  const setTreeBoxMap = (el, type) => {
    if (el) treeBoxRefMap.value[type] = el;
  };

  // 树dom的ref映射
  const treeRefMap = ref({});

  const setTreeMap = (el, type) => {
    if (el) treeRefMap.value[type] = el;
  };

  // 通过id获取该id下的所有成员数
  const getGroupMemberNumById = (id, prop) => {
    let child = props.allUserList.filter(k => k[prop] === id);
    if (props.isFilterResigned) {
      child = child.filter(k => Number(k.status) !== 3);
    }
    return child?.length || 0;
  };

  const BRANCH_TYPE = 'branch';
  const STATION_TYPE = 'station';
  const RANK_TYPE = 'rank';

  const targets = [
    { label: '部门', value: BRANCH_TYPE },
    { label: '岗位', value: STATION_TYPE },
    { label: '职级', value: RANK_TYPE }
  ];

  const targetType = ref(props.chooseType || BRANCH_TYPE);

  // 当前是部门面板
  const isBranch = computed(() => targetType.value === targets[0].value);
  // 当前是岗位面板
  const isStation = computed(() => targetType.value === targets[1].value);
  // 当前是职级面板
  const isRank = computed(() => targetType.value === targets[2].value);

  // 当前树组件的数据源
  const treeListMap = ref({});

  // 获取数据最后一个层级的集合
  const getLeafTree = (tree, type) => {
    let list = [];
    function getLast(children) {
      children?.forEach(item => {
        if (item?.children?.length) {
          getLast(item.children);
        } else {
          if (type === BRANCH_TYPE) {
            if (props.isFilterResigned) {
              if (!item.isResigned && item.isMember) list.push(item.id);
            } else {
              if (item.isMember) list.push(item.id);
            }
          } else {
            const prop = type === STATION_TYPE ? 'postId' : 'rankId';
            const childNum = getGroupMemberNumById(item[prop], prop);
            if (childNum) list.push(item.id);
          }
        }
      });
    }
    getLast(tree);
    return list;
  };

  const branchCanSelect = ref([]);

  const stationCanSelect = ref([]);

  const rankCanSelect = ref([]);

  // 所有可选的项
  const allList = computed(() => {
    if (isBranch.value) {
      return branchCanSelect.value;
    } else if (isStation.value) {
      return stationCanSelect.value;
    } else {
      return rankCanSelect.value;
    }
  });

  // 头部全选和反选逻辑(搜索状态下要保留之前的选中项)
  const headerSelect = type => {
    let list = [];
    if (type === 'all') {
      list = [...allList.value];
      setChoose(list);
    } else {
      const chooseList = getChoose();
      const unChooseList = allList.value.filter(k => !chooseList.includes(k));
      if (props.isSearch)
        branchChooseList.value = branchChooseList.value.filter(
          k => !chooseList.includes(k)
        );
      list = [...unChooseList];
      setChoose(list);
    }
    if (isBranch.value) {
      branchChooseList.value = props.isSearch
        ? [...branchChooseList.value, ...list]
        : [...list];
    } else if (isStation.value) {
      stationChooseList.value = [...list];
    } else {
      rankChooseList.value = [...list];
    }
  };

  // 设置选中项
  const setChoose = list => {
    treeRefMap.value[targetType.value].setCheckedKeys([...list], true);
  };

  // 获取选中项
  const getChoose = () => {
    const chooses = treeRefMap.value[targetType.value]
      .getCheckedKeys(true)
      .filter(k => k);
    return chooses;
  };

  // 设置tree的disable状态
  const treeProps = computed(() => {
    return {
      disabled: setDisable
    };
  });

  // disable状态设置
  const setDisable = data => {
    let disabled = false;
    if (isBranch.value) {
      disabled =
        (props.isFilterResigned &&
          ((data.isMember && data.isResigned) ||
            (!data.isMember && data.label === '离职人员'))) ||
        (getGroupMemberNumByList(data.children) === 0 && !data.isMember);
    } else {
      const prop = isStation.value ? 'postId' : 'rankId';
      const childNum = getGroupMemberNumById(data[prop], prop);
      disabled = !childNum;
    }
    return disabled;
  };

  // 搜索状态默认选中“部门”
  watch(
    () => props.isSearch,
    val => {
      if (val) targetType.value = targets[0].value;
    }
  );

  // 切换选中的类型（需要重新设置选中项）
  const onTargetTypeChange = () => {
    let list = [];
    if (isBranch.value) {
      list = [...branchChooseList.value];
    } else if (isStation.value) {
      list = [...stationChooseList.value];
    } else {
      list = [...rankChooseList.value];
    }
    setChoose([...list]);
  };

  // 部门选中的项
  const branchChooseList = ref([]);
  // 岗位的选中项
  const stationChooseList = ref([]);
  // 职级的选中项
  const rankChooseList = ref([]);

  // 点击全选的node，设置取消全选
  const nodeClick = data => {
    if (isBranch.value && data.children?.length) {
      const memberList = getLeafTree(data.children, BRANCH_TYPE);
      // 点击node的时候，如果全部成员都已经被选中，则取消全部成员选中（因为disabled状态问题，el组件无法识别全选）
      if (memberList.every(k => branchChooseList.value.includes(k))) {
        branchChooseList.value = branchChooseList.value.filter(
          k => !memberList.includes(k)
        );
        setChoose(branchChooseList.value);
      }
    }
  };

  /**
   *  深度优先遍历
   *  @params {Array} tree 树数据
   *  @params {Array} func 操作函数
   */
  const dfsTransFn = (tree, func) => {
    tree.forEach(node => {
      func(node);
      // 如果子树存在，递归调用
      if (node.children?.length) {
        dfsTransFn(node.children, func);
      }
    });
    return tree;
  };

  // 处理节点选中和取消
  const checkNode = node => {
    // 是叶子节点--成员节点
    if (!node.children) {
      const set = new Set(branchChooseList.value);
      const exist = set.has(node.id);
      if (exist) {
        set.delete(node.id);
      } else {
        set.add(node.id);
      }
      branchChooseList.value = [...set];
    }
  };

  // 树形结构数据选中项变更获取最新的选中项
  const handleCheckChange = node => {
    const list = getChoose();
    if (isBranch.value) {
      // 这里获取的节点顺序是树的顺序
      // if (props.isSearch) {
      //   // 搜索状态下需要保留非搜索状态时选中的成员
      //   const unChoose = allList.value.filter(k => !list.includes(k));
      //   const oldList = branchChooseList.value.filter(
      //     k => !unChoose.includes(k)
      //   );
      //   branchChooseList.value = Array.from(new Set([...oldList, ...list]));
      // } else {
      //   branchChooseList.value = [...list];
      // }

      // 这里获取的节点顺序，是根据用户选择的顺序
      if (node.children) {
        dfsTransFn(node.children, checkNode);
      } else {
        checkNode(node);
      }
    } else if (isStation.value) {
      stationChooseList.value = [...list];
    } else {
      rankChooseList.value = [...list];
    }
  };

  // 获取所有部门id(初始化默认全部展开)
  const getAllBranchId = () => {
    const keys = [];
    function getId(list) {
      list.forEach(item => {
        if (item.id && !item.isMember) keys.push(item.id);
        if (item.children?.length) {
          getId(item.children);
        }
      });
    }
    getId(props.showBranchList);
    return keys || [];
  };

  // 记录展开的部门key
  const openBranchKeys = ref([...getAllBranchId()]);

  // 记录展开的职级key
  const openRankKeys = ref(props.rankList.map(k => k.id));

  // 当前树结构展开的key
  const openKeys = computed(() => {
    if (isBranch.value) {
      return openBranchKeys.value;
    } else {
      return openRankKeys.value;
    }
  });

  // 关闭节点移除记录的key
  const closeNode = data => {
    if (isBranch.value) {
      openBranchKeys.value = openBranchKeys.value.filter(k => k !== data.id);
    } else {
      openRankKeys.value = openRankKeys.value.filter(k => k !== data.id);
    }
  };

  // 展开节点记录展开的key
  const openNode = data => {
    if (isBranch.value) {
      if (!openBranchKeys.value.includes(data.id))
        openBranchKeys.value.push(data.id);
    } else {
      if (!openRankKeys.value.includes(data.id))
        openRankKeys.value.push(data.id);
    }
  };

  const allCanSelectList = () => {
    branchCanSelect.value = [
      ...getLeafTree(treeListMap.value.branch, BRANCH_TYPE)
    ];
    stationCanSelect.value = [
      ...getLeafTree(treeListMap.value.station, STATION_TYPE)
    ];
    rankCanSelect.value = [...getLeafTree(treeListMap.value.rank, RANK_TYPE)];
  };

  watch(
    () => props.isFilterResigned,
    async val => {
      await nextTick();
      // 过滤离职人员会导致树组件可选节点的变化，所以要更新可选项（全选时用）
      allCanSelectList();

      if (val) {
        // 离职人员集合
        const resignedList = props.allUserList
          .filter(k => Number(k.status) === 3)
          .map(k => k.userId);

        // 三个tab中选中的离职人员相关信息需要全部清除掉
        // 部门和人员选中的就是人员，之前排除离职人员即可
        branchChooseList.value = branchChooseList.value.filter(
          k => !resignedList.includes(k)
        );
        // 过滤离职人员后，只有离职人员的相关岗位和职级下将无人员，不可选，根据这个条件排除掉只有离职人员的岗位和职级
        stationChooseList.value = stationChooseList.value.filter(
          k =>
            getGroupMemberNumById(Number(k.substring(5, k.length)), 'postId') >
            0
        );
        rankChooseList.value = rankChooseList.value.filter(
          k =>
            getGroupMemberNumById(Number(k.substring(5, k.length)), 'rankId') >
            0
        );

        onTargetTypeChange();
        openBranchKeys.value = openBranchKeys.value.filter(
          k => k !== 'dimission'
        );
      } else {
        // 如果不过滤离职人员，设置离职人员节点默认展开
        if (!openBranchKeys.value.includes('dimission'))
          openBranchKeys.value.push('dimission');
      }
    }
  );

  // 数据变更需要设置对应的选中项，以及重新设置全部可选项
  watch(
    () => props.showBranchList,
    async () => {
      await nextTick();
      treeListMap.value.branch = props.showBranchList;
      branchCanSelect.value = [
        ...getLeafTree(treeListMap.value.branch, BRANCH_TYPE)
      ];
      onTargetTypeChange();
    },
    { immediate: true }
  );

  const initData = () => {
    // 树组件数据源初始化
    treeListMap.value = {
      branch: props.showBranchList,
      station: props.stationList,
      rank: props.rankList
    };

    allCanSelectList();

    if (props.chooseInfo?.length) {
      // 初始化默认选中数据
      if (props.chooseType === BRANCH_TYPE)
        branchChooseList.value = [...props.chooseInfo];
      if (props.chooseType === STATION_TYPE)
        stationChooseList.value = [...props.chooseInfo];
      if (props.chooseType === RANK_TYPE)
        rankChooseList.value = [...props.chooseInfo];
      setChoose(props.chooseInfo);
      const allNodes = getAllNodes(treeListMap.value[targetType.value]);
      const index = allNodes.findIndex(k => k === props.chooseInfo[0]);
      const scrollTop = index * 26;
      setTimeout(() => {
        treeBoxRefMap.value[targetType.value].scrollTop = scrollTop;
      }, 500);
    }

    // 默认展开节点初始化
    openBranchKeys.value = getAllBranchId();
    openRankKeys.value = props.stationList.map(k => k.id);
  };

  const getChooseInfo = () => {
    let list = [];
    if (isBranch.value) {
      list = [...branchChooseList.value];
    } else if (isStation.value) {
      list = [...stationChooseList.value];
    } else {
      list = [...rankChooseList.value];
    }
    return { type: targetType.value, list };
  };

  defineExpose({
    getChooseInfo
  });

  onMounted(async () => {
    await nextTick();
    initData();
  });
</script>
<style lang="scss" scoped>
  .box {
    border: 1px solid #d4dbe9;
    border-radius: 2px;
    &-header {
      height: 34px;
      line-height: 18px;
      padding: 8px 12px;
      background: #f2f2f2;
      display: flex;
      justify-content: space-between;
      align-items: center;
      :deep(.el-radio-group) {
        height: 18px;
        .el-radio {
          height: 18px;
        }
      }

      .header-select {
        height: 18px;
        line-height: 18px;
        display: flex;
        align-items: center;
        &_btn {
          color: var(--main-color);
          margin-top: 1px; // 测试觉得文字没有垂直居中，上面加一像素
        }
        &_line {
          height: 14px;
          border-left: 1px solid #bfbfbf;
          margin: 0 8px;
        }
      }
    }
    &-body {
      max-height: 274px;
      padding: 8px 12px;
      overflow: auto;
      :deep(.el-tree__empty-text) {
        width: 140px;
      }
      :deep(.el-tree-node__content) {
        .el-icon.el-tree-node__expand-icon {
          padding: 4px !important;
        }
      }
      .branch {
        display: flex;
        flex-grow: 1;
        flex-wrap: wrap;
        // width: 100%;
        max-height: calc(100% - 2px);
        // overflow: auto;
        :deep(.el-tree-node) {
          width: 100%;
          display: flex;
          flex-grow: 1;
          flex-wrap: wrap;
          flex-direction: column;
        }
      }
      .station {
        :deep(.el-tree-node__content) {
          .el-icon.el-tree-node__expand-icon.is-leaf {
            display: none;
          }
        }
      }
      .rank {
        :deep(.el-tree-node) {
          .el-tree-node__content {
            > .el-checkbox {
              display: none;
            }
          }
          .el-tree-node__children {
            .el-tree-node__content {
              .el-icon.el-tree-node__expand-icon.is-leaf {
                display: none;
              }
              > .el-checkbox {
                display: block;
                .el-checkbox__input {
                  margin-top: 8.5px;
                }
              }
            }
          }
        }
      }
    }
  }
</style>
