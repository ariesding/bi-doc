/**
 * 操作类型
 */
export const OPT_TYPE = {
  mark: 'mark', // 打标
  followup: 'followup', // 跟进
  goodsTarget: 'goodsTarget', // 商品目标
  shopMark: 'shopMark', // 店铺打标
  shopTarget: 'shopTarget', // 店铺目标
  categoryTarget: 'categoryTarget', // 店铺目标
  platformTarget: 'platformTarget', // 渠道目标
  detail: 'detail', // 详情
  hpMark: 'hpMark', // 货品打标
  personTarget: 'personTarget', //个人目标
  teamTarget: 'teamTarget', // 团队目标
  trend: 'trend', // 趋势
  salesTrend: 'salesTrend', // 销售走势
  category: 'category', // 品类分析
  calculation: 'calculation', // 测算
  profitCalculation: 'profitCalculation', // 测算
  goodsPanorama: 'goods-panorama', // 商品全景分析
  goodsOperation: 'goods-operation', // 商品运营分析
  hpPanorama: 'hp-panorama', // 货品全景分析
  searchTrend: 'search-trend', // 搜索趋势
  battlefieldSand: 'battlefield-sand', // 战场沙盘
  competitiveAnalysis: 'competitive-analysis', // 竞争分析
  soaringMarket: 'soaring-market', // 飙升市场
  keywordCloud: 'keyword-cloud', // 关键词云
  view: 'view', // 查看
  progress: 'progress', // 进度
  calculated: 'calculated', // 已测算
  categoryLayout: 'categoryLayout', // 品类布局
  categoryLayouted: 'categoryLayouted', // 已布局
  cancelMarking: 'cancelMarking', // 取消打标
  checkProfitRule: 'checkProfitRule', // 查看提成规则
  addChooseGoods: 'addChooseGoods', // 加入选品库
  delChooseGoods: 'delChooseGoods', // 移出选品库
  addChooseWords: 'addChooseWords', // 加入选词库
  delChooseWords: 'delChooseWords', // 加入选词库
  setSelf: 'setSelf', // 标为本品
  setCompetitive: 'setCompetitive', // 标为竞品
  trend2: 'trend2', // 趋势,不是走势
  hotGoodsPlan: 'hotGoodsPlan', // 爆款计划
  demandTrend: 'demandTrend', // 需求趋势
  goodsStyle: 'goodsStyle', // 商品款式
  supplyChain: 'supplyChain', // 供应链
  follower: 'follower', // 跟进人
  share: 'share', //共享
  task: 'task', // 任务
  createStandardTask: 'create-standard-task', // 新建标准任务
  createFlowTask: 'create-flow-task', // 新建流程任务
  allTask: 'all-task', // 新建流程任务
  goodsThreshold: 'goodsThreshold' // 商品警戒值
};

const OPT_TYPE_NAME_MAP = new Map([
  [OPT_TYPE.mark, '打标'],
  [OPT_TYPE.followup, '跟进'],
  [OPT_TYPE.goodsTarget, '目标'],
  [OPT_TYPE.shopMark, '打标'],
  [OPT_TYPE.shopTarget, '店铺目标'],
  [OPT_TYPE.platformTarget, '渠道目标'],
  [OPT_TYPE.categoryTarget, '类目目标'],
  [OPT_TYPE.detail, '详情'],
  [OPT_TYPE.hpMark, '打标'],
  [OPT_TYPE.trend, '走势'],
  [OPT_TYPE.personTarget, '个人目标'],
  [OPT_TYPE.teamTarget, '团队目标'],
  [OPT_TYPE.salesTrend, '销售走势'],
  [OPT_TYPE.category, '品类分析'],
  [OPT_TYPE.calculation, '测算'],
  [OPT_TYPE.profitCalculation, '利润测算'],
  [OPT_TYPE.goodsPanorama, '全景分析'],
  [OPT_TYPE.goodsOperation, '运营分析'],
  [OPT_TYPE.hpPanorama, '全景分析'],
  [OPT_TYPE.searchTrend, '搜索趋势'],
  [OPT_TYPE.battlefieldSand, '战场沙盘'],
  [OPT_TYPE.competitiveAnalysis, '竞争分析'],
  [OPT_TYPE.soaringMarket, '飙升市场'],
  [OPT_TYPE.keywordCloud, '关键词云'],
  [OPT_TYPE.view, '查看'],
  [OPT_TYPE.progress, '进度'],
  [OPT_TYPE.calculated, '已测算'],
  [OPT_TYPE.categoryLayout, '品类布局'],
  [OPT_TYPE.categoryLayouted, '已布局'],
  [OPT_TYPE.cancelMarking, '取消打标'],
  [OPT_TYPE.checkProfitRule, '提成规则'],
  [OPT_TYPE.addChooseGoods, '加入选品库'],
  [OPT_TYPE.delChooseGoods, '移出选品库'],
  [OPT_TYPE.addChooseWords, '加入选词库'],
  [OPT_TYPE.delChooseWords, '移出选词库'],
  [OPT_TYPE.setSelf, '标为本品'],
  [OPT_TYPE.setCompetitive, '标为竞品'],
  [OPT_TYPE.trend2, '趋势'],
  [OPT_TYPE.hotGoodsPlan, '爆款计划'],
  [OPT_TYPE.demandTrend, '需求趋势'],
  [OPT_TYPE.goodsStyle, '商品款式'],
  [OPT_TYPE.supplyChain, '供应链'],
  [OPT_TYPE.follower, '跟进人'],
  [OPT_TYPE.share, '共享'],
  [OPT_TYPE.task, '任务'],
  [OPT_TYPE.createStandardTask, '新建标准任务'],
  [OPT_TYPE.createFlowTask, '新建流程任务'],
  [OPT_TYPE.allTask, '全部任务'],
  [OPT_TYPE.goodsThreshold, '警戒值']
]);

/**
 * 根据操作类型值获取名称
 */
export const optTypeNameForValue = val => OPT_TYPE_NAME_MAP.get(val);

// 操作类型 带子集 的
export const OPT_TYPE_CHILD = {
  task: [
    OPT_TYPE.createStandardTask,
    OPT_TYPE.createFlowTask,
    'line',
    OPT_TYPE.allTask
  ].map(key => ({
    type: key,
    name: optTypeNameForValue(key)
  }))
};
