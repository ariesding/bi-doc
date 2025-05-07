<!-- 表格负责人字段组件，点击可跳转团队成员 -->
<template>
  <!--自适应配置 :popper-options="{
      placement: 'auto'
    }" -->
  <el-tooltip
    v-if="users.length"
    :placement="placement"
    :show-after="50"
    :hide-after="50"
    :popper-options="{
      modifiers: [
        {
          name: 'flip',
          options: {
            fallbackPlacements: ['left']
          }
        }
      ]
    }"
    popper-class="table-leader_tooltip"
  >
    <!-- tooltip 内容 slot：头像 + 用户名 -->
    <template #content>
      <div class="tooltip-box">
        <div
          v-for="user in users"
          :key="user.fzrId"
          class="table-leader-wrap"
          :class="{
            'table-leader-wrap--disabled': !checkJumpMemberDetail(user),
            hasTimeLine: user.timeLine
          }"
          style="padding: 5px 12px"
        >
          <div class="left">
            <img
              :key="user.fzrId"
              class="table-avatar"
              :src="getAvatar(user.userName, user.fzrId, user.headerUrl)"
            />

            <TextOverTooltip is-native-title :title="getUserPostStr(user)">
              <span
                class="table-leader-name table-leader-name--dark"
                :class="{ 'jump-detail': checkJumpMemberDetail(user) }"
                @click="clickUser(user)"
              >
                {{ getUserPostStr(user) }}
              </span>
            </TextOverTooltip>
          </div>
          <div v-if="user.timeLine" class="right">
            <div v-for="period in user.timeLine" :key="period" class="period">
              <template v-if="period.startTime || period.endTime">
                <span class="start-time">
                  {{ period.startTime ? period.startTime : '过去' }}
                </span>
                <span class="separator">&nbsp;-&nbsp;</span>
                <span class="start-time">
                  {{ period.endTime ? period.endTime : '未来' }}
                </span>
              </template>
              <template v-else>
                <span class="null-time">--</span>
              </template>
            </div>
          </div>
        </div>
      </div>
    </template>
    <!-- 触发项：头像 -->
    <div class="table-leader-wrap2">
      <template v-for="user in showUsers" :key="user.fzrId">
        <!-- <img
          class="table-avatar"
          :src="getAvatar(user.userName, user.fzrId, user.headerUrl)"
          :class="{ 'table-avatar--left-offset': index !== 0 }"
        /> -->
        <span
          class="table-leader-name"
          :class="{
            'table-leader-name--not-clickable': !checkJumpMemberDetail(user)
          }"
          @click="clickUser(user)"
        >
          {{ user.userName }}
        </span>
      </template>

      <div v-if="users.length > LIMIT_COUNT">
        <!-- class="table-avatar table-avatar--left-offset table-avatar--no-border" -->

        <div style="display: flex; flex-direction: row">
          <i>&nbsp;+</i>
          <span style="flex-shrink: 0">
            {{ users.length - LIMIT_COUNT }}
          </span>
        </div>
      </div>
    </div>
  </el-tooltip>

  <!-- 单个用户 目前和多个用户一样处理 S-->
  <div v-if="false" class="table-leader-wrap" style="justify-content: start">
    <!-- <img
      class="table-avatar"
      :src="getAvatar(users[0].userName, users[0].fzrId, users[0].headerUrl)"
      :style="{ zIndex: 666 }"
    /> -->
    <span
      v-if="users.length === 1"
      v-title="getSingleUserTitle(users[0])"
      class="table-leader-name"
      @click="clickUser(users[0])"
    >
      {{ users[0].userName }}
      <!-- 20240911，马总确认，隐藏岗位 -->
      <!-- {{ users[0]?.postName ? ' (' + users[0]?.postName + ')' : '' }} -->
    </span>
  </div>
  <!-- 单个用户 E -->
</template>

<script setup>
  import { computed, toRefs } from 'vue';
  import { getAvatar } from '@/utils/getUserAvatar';
  import { useManageStore } from '@/store/useManage';
  import { useProjectPermissionsStore } from '@/store/useProjectPermissions';

  const { manageUsers } = toRefs(useManageStore());
  const manageUserIds = computed(
    () => manageUsers.value?.map(item => String(item.userId)) || []
  );

  const props = defineProps({
    users: {
      type: Array,
      default: () => []
    },
    placement: {
      type: String,
      default: 'right'
    }
  });

  const LIMIT_COUNT = 1;

  const getUserPostStr = user => {
    return user.userName + (user?.postName ? `(${user?.postName})` : '');
  };

  // 显示的用户
  const showUsers = computed(() =>
    props.users.length > LIMIT_COUNT ? [props.users[0]] : props.users
  );

  // 当前登录用户是否有成员详情的菜单权限
  const hasMemberDetailMenu = computed(() => {
    return useProjectPermissionsStore().hasPermission('td_cyxq');
  });

  // 点击用户跳转到团队成员详情
  const clickUser = user => {
    if (!hasMemberDetailMenu.value) return;
    // 不是登录用户管理的人
    if (!manageUserIds.value.includes(String(user.fzrId))) return;
    window.open(
      `${location.origin}/workTable/teamMemberDetail?memberId=${user.fzrId}`
    );
  };

  // 检验是否能跳转到成员详情
  const checkJumpMemberDetail = user => {
    return (
      hasMemberDetailMenu.value &&
      manageUserIds.value.includes(String(user.fzrId))
    );
  };

  const getSingleUserTitle = user => {
    // 没有责权时间线
    if (!user?.timeLine?.length) return '';

    const { startTime, endTime } = user.timeLine[0];
    const timeStr =
      startTime || endTime
        ? `<span class="start-time">${startTime ? startTime : '过去'}</span>
        <span class="separator">&nbsp;-&nbsp;</span>
        <span class="start-time">${endTime ? endTime : '未来'}</span>`
        : '<span class="null-time">--</span>';
    const res = `<div style="display:flex;height:24px;align-items:center;">
        <div style="display:flex;margin-right:16px;">
          <span style="min-width:max-content;">${
            user.userName + (user?.postName ? ' (' + user?.postName + ')' : '')
          } </span>
        </div>
        <div style="display:flex;min-width:max-content;">${timeStr}</div>
      </div>`;
    return res.replaceAll('\n', '');
  };
</script>

<style lang="scss">
  .tooltip-box {
    width: 308px;
    max-height: 340px;
    margin: 3px 0;
    overflow-y: auto;
  }
  .table-leader-wrap,
  .table-leader-wrap2 {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;

    &--disabled {
      opacity: 0.6;
      .table-leader-name {
        cursor: default !important;
        &:hover {
          text-decoration: none !important;
        }
      }
    }

    &.table-leader-wrap2 {
      display: inline-flex;
      vertical-align: middle;
    }

    .table-avatar {
      min-width: 24px;
      height: 24px;
      background-color: #e0e9fe;
      box-shadow: 0 0 0 0.5px var(--border-color);
      box-sizing: border-box;
      border-radius: 12px;

      &--left-offset {
        margin-left: 1px;
      }

      &--no-border {
        border: none;
        background: #bfbfbf;
        color: #fff;
        display: flex;
        justify-content: center;
        white-space: nowrap;
        i {
          font-size: 12px;
          transform: translateX(3px);
        }
        span {
          font-size: 20px;
          font-weight: 500;
          display: inline-block;
          transform: scale(0.6);
        }
      }
    }

    .table-avatar-default {
      background-color: #e0e9fe;
    }

    .table-leader-name {
      font-size: 14px;
      line-height: 18px;
      margin-left: 4px;
      color: #000;
      cursor: pointer;
      &:hover {
        text-decoration: underline;
      }

      &--dark {
        color: #fff;
      }

      &--not-clickable {
        cursor: default !important;
        &:hover {
          text-decoration: none !important;
        }
      }
    }
  }
  .table-leader-wrap {
    justify-content: space-between;
    line-height: 18px;
    &.hasTimeLine {
      &:not(:last-child) {
        margin-bottom: 4px;
      }
    }
    .left {
      width: 0;
      flex: 1;
      display: flex;
      align-items: center;
      align-self: flex-start;
      margin-right: 16px;
      .jump-detail {
        color: #789ff9;
      }
    }
    .right {
      .period {
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        margin-top: 4px;
        font-family: 'Inter';
        font-style: normal;
        font-feature-settings: 'tnum';
        letter-spacing: -0.5px;
        &:first-child {
          margin-top: 0px;
        }
      }
    }
  }

  .table-leader_tooltip {
    padding: 0;
  }
</style>
