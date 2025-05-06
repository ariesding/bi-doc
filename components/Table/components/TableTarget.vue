<!-- 推广目标字段组件 -->
<template>
  <!--自适应配置 :popper-options="{
      placement: 'auto'
    }" -->
  <!-- :show-arrow="false" -->
  <!-- trigger="click" -->
  <el-tooltip
    v-if="haveObj1"
    placement="right"
    :show-after="50"
    :hide-after="50"
    :popper-options="popperOptions"
    popper-class="table-target_tooltip"
  >
    <!-- tooltip 内容  -->
    <template #content>
      <div class="tooltip-box" :class="{ isGroup: haveObj2 }">
        <div class="left">
          <div class="line"></div>
          <div class="andOr">
            {{ showObj.groupRelation == 'OR' ? '或' : '且' }}
          </div>
        </div>
        <table cellspacing="0" cellpadding="0">
          <template v-for="(group, num) in showList" :key="num">
            <tr
              v-for="(item, index) in group"
              :key="`${num == 0 ? 'a' : 'b'}${index}`"
              :class="{
                tr0: num == 0 && index == group.length - 1,
                tr1: num == 1 && index == 0
              }"
            >
              <td>
                <div class="bk">{{ item.groupType }}</div>
              </td>
              <td>
                <div class="bk">
                  <span>{{ item.indicator }}</span>
                  <span>&nbsp;{{ item.indicatorOperator }}&nbsp;</span>
                  <span class="num">{{ item.indicatorData }}</span>
                </div>
              </td>
              <td>
                <div class="bk">
                  <span v-if="item.startDate || item.endDate">
                    {{ dayjs(item.startDate).format('YYYY/MM/DD') }}-{{
                      dayjs(item.endDate).format('YYYY/MM/DD')
                    }}
                  </span>
                  <span>&nbsp;{{ item.timeOperator }}&nbsp;</span>
                  <span class="num">{{ item.timeData }}</span>
                </div>
              </td>
              <td class="imgs">
                <img
                  v-if="item.calcResult == 'satisfy'"
                  src="@img/Table/target-success.svg"
                />
                <img
                  v-if="item.calcResult == 'unSatisfy'"
                  src="@img/Table/target-warn.svg"
                />
                <img
                  v-if="!item.calcResult || item.calcResult == 'unCalc'"
                  src="@img/Table/target-empty.svg"
                />
              </td>
            </tr>
          </template>
        </table>
      </div>
    </template>
    <div
      class="table-target-wrap"
      :class="{
        success: status == 'satisfy',
        warn: status == 'unSatisfy',
        calcing: status == 'calcing',
        unCalc: status == 'unCalc'
      }"
    >
      {{ satisfyList[status || 'unCalc'] }}
    </div>
  </el-tooltip>
  <div
    v-else
    class="table-target-wrap"
    :class="{
      success: status == 'satisfy',
      warn: status == 'unSatisfy',
      calcing: status == 'calcing',
      unCalc: status == 'unCalc'
    }"
  >
    {{ satisfyList[status || 'unCalc'] }}
  </div>
</template>

<script setup>
  import { computed, ref } from 'vue';
  import dayjs from 'dayjs';

  const props = defineProps({
    obj: {
      type: Object,
      default: () => {}
    },
    status: {
      type: String,
      default: ''
    }
  });

  const satisfyList = ref({
    satisfy: '已达成',
    unSatisfy: '未达成',
    unCalc: '未计算',
    none_config: '未配置',
    calcing: '计算中'
  });

  const showObj = computed(() => {
    return props.obj || {};
  });

  const showList = computed(() => {
    return [
      showObj.value.formulaResults1,
      showObj.value.formulaResults2
    ].filter(item => item && item.length > 0);
  });

  const haveObj1 = computed(() => {
    return !!showList.value[0];
  });
  const haveObj2 = computed(() => {
    return !!showList.value[1];
  });

  // 防止溢出
  const popperOptions = {
    modifiers: [
      {
        name: 'preventOverflow',
        options: {
          altAxis: true
        }
      },
      {
        name: 'flip',
        options: {
          fallbackPlacements: ['left']
        }
      }
    ]
  };
</script>

<style lang="scss" scoped>
  .tooltip-box {
    max-height: 340px;
    overflow-y: auto;
    min-width: 394px;
    padding: 12px 16px;
    position: relative;
    .left {
      display: none;
      position: absolute;
      left: 16px;
      top: 12px;
      bottom: 12px;
      width: 30px;
      align-items: center;

      .andOr {
        width: 100%;
        line-height: 32px;
        background: var(--black);
        border-radius: 2px;

        font-family: Microsoft YaHei UI;
        font-size: 14px;
        font-weight: 400;
        color: var(--white);
        text-align: center;
        position: relative;
        z-index: 2;
      }

      .line {
        position: absolute;
        top: 16px;
        left: 16px;
        bottom: 16px;
        right: 0;
        border: 1px solid #595959;
        border-right: none;
      }
    }

    table {
      tr {
        height: 32px;
        &:last-child > td {
          padding-bottom: 0;
        }

        & > td {
          padding-right: 8px;
          padding-bottom: 16px;
          &:last-child {
            padding-right: 0;
          }
          &:nth-child(1) > div {
            width: 58px;
          }
          &:nth-child(2) > div {
            min-width: 147px;
            text-align: left;
            padding: 0 8px;
            width: 100%;
          }
          &:nth-child(3) > div {
            min-width: 117px;
            text-align: left;
            padding: 0 8px;
            width: 100%;
          }

          .bk {
            line-height: 32px;
            background: var(--black);
            border-radius: 2px;
            color: var(--icon-btn-y-color);
            font-size: 14px;
            font-weight: 400;
            text-align: center;

            & > .num {
              color: var(--main-color);
            }
          }

          &.imgs {
            line-height: 32px;
            img {
              width: 16px;
              height: 16px;
              vertical-align: middle;
            }
          }
        }
      }
    }

    &.isGroup {
      padding-left: 54px;
      .left {
        display: flex;
      }

      table {
        tr {
          &.tr0 {
            & > td {
              padding-bottom: 12px;
            }
          }
          &.tr1 {
            & > td {
              padding-top: 12px;
              border-top: 1px solid #595959;
            }
          }
        }
      }
    }
  }

  .table-target-wrap {
    width: 48px;
    height: 22px;
    text-align: center;
    line-height: 22px;
    font-size: 12px;
    font-weight: 400;
    border-radius: 11px;
    display: inline-block;
    cursor: default;
    background: rgba(0, 0, 0, 0.06);
    color: #8c8c8c;

    &.success {
      color: #26a545;
      background: #e4ffeb;
    }
    &.calcing {
      color: var(--main-color);
      background: #d4e8ff;
    }
    &.unCalc {
      color: #789ff9;
      background: #d4e8ff;
    }
    &.warn {
      color: #ff7000;
      background: #ffe9cc;
    }
  }
</style>

<style lang="scss">
  .table-target_tooltip {
    padding: 0;
    // background: rgba(0, 0, 0, 0.85) !important;
    // border-color: rgba(0, 0, 0, 0.85) !important;
    // .el-popper__arrow::before {
    //   background: rgba(0, 0, 0, 0.85) !important;
    //   border-color: rgba(0, 0, 0, 0.85) !important;
    // }
  }
</style>
