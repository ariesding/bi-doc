// 通过一个树结构，获取该结构内所有的成员数量
export const getGroupMemberNumByList = list => {
  let nums = 0;
  function getNum(list) {
    (list || []).forEach(k => {
      if (k.children?.length) {
        getNum(k.children);
      } else {
        if (k.isMember) nums++;
      }
    });
  }
  getNum(list);
  return nums;
};

// 通过id获取该id下的所有成员数
export const getGroupMemberNumById = (
  allUserList,
  id,
  prop,
  isFilterResigned
) => {
  let child = allUserList.filter(k => k[prop] === id);
  if (isFilterResigned) {
    child = child.filter(k => Number(k.status) !== 3);
  }
  return child?.length || 0;
};

// 获取全部节点
export const getAllNodes = list => {
  let nodes = [];
  function checkList(list) {
    list.forEach(item => {
      if (item.children?.length) {
        checkList(item.children);
        nodes.push(item.id);
      } else {
        nodes.push(item.id);
      }
    });
  }
  checkList(list);
  return nodes;
};
