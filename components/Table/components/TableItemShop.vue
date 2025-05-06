<template>
  <TableOpts
    v-bind="$attrs"
    :row="shop"
    target-type="store"
    :custom-backgroud-color="customBackgroudColor"
  >
    <div class="shop-wrapper">
      <img
        v-if="shopPlatformIcon && shopLogo"
        :src="shopLogo"
        :style="{ width: `${imgSize}px`, height: `${imgSize}px` }"
      />
      <span v-if="showUnfinished" class="unfinished-span">
        <div class="dot-flashing dot1"></div>
        <div class="dot-flashing dot2"></div>
        <div class="dot-flashing dot3"></div>
      </span>
      <TextOverTooltip is-native-title :title="shop.shopName">
        <span
          v-if="canOpenExternal(shop.shopLink)"
          style="cursor: pointer"
          class="linkClass"
          @click.stop="openExternalLink(shop.shopLink)"
        >
          {{ shop.shopName }}
        </span>
        <span v-else>{{ shop.shopName }}</span>
      </TextOverTooltip>
      <!-- 标签 -->
      <FlagGroup v-if="showFlag" :id="shop?.shopFlag" :scope="SCOPE.dp" />
    </div>
  </TableOpts>
</template>

<script setup>
  import { computed } from 'vue';
  import { channelMap } from '@/utils/table';
  import TextOverTooltip from '@/components/TextOverTooltip/index.vue';
  import TableOpts from '@/components/TableOpts/index.vue';
  import { SCOPE } from '@/components/Flag/config';
  import FlagGroup from '@/components/Flag/FlagGroup.vue';
  import { canOpenExternal, openExternalLink } from '@/utils/windowUtil';

  const props = defineProps({
    shop: { type: Object, default: () => {} },
    shopPlatformIcon: { type: Boolean, default: true },
    showUnfinished: { type: Boolean, default: true },
    // 是否显示标签
    showFlag: { type: Boolean, default: true },
    // hover自定义背景色
    customBackgroudColor: { type: String, default: '' },
    // 图片大小
    imgSize: { type: Number, default: 16 }
  });

  const shopLogo = computed(() => props.shop?.shopLogo || getSrc(props.shop));

  const getSrc = row => channelMap[row?.platform?.toLowerCase()]?.icon;
</script>

<style lang="scss" scoped>
  .shop-wrapper {
    display: flex;
    position: relative;
    align-items: center;
    > img {
      margin-right: 8px;
      object-fit: contain;
    }
    .unfinished-span {
      left: 8px;
      width: 15px;
      height: 15px;
      bottom: -3px;
      display: none;
      justify-content: center;
      align-items: center;
      position: absolute;
      background: #ffffff;
      border-radius: 50%;

      &::after {
        content: '';
        position: absolute;
        left: 1px;
        top: 1px;
        width: 13px;
        height: 13px;
        border-radius: 50%;
        border: 1px solid var(--main-color);
        box-sizing: border-box;
      }

      .dot-flashing {
        position: relative;
        width: 2px;
        height: 2px;
        background-color: var(--main-color);
        transform: scale(0.75);
        border-radius: 50%;
        &.dot1 {
          animation: dotFlashing 0.9s infinite alternate;
          animation-delay: 0s;
        }
        &.dot2 {
          margin: 0 1px;
          animation: dotFlashing 0.9s infinite alternate;
          animation-delay: 0.3s;
        }
        &.dot3 {
          animation: dotFlashing 0.9s infinite alternate;
          animation-delay: 0.6s;
        }
      }
      @keyframes dotFlashing {
        0% {
          background-color: var(--main-color);
        }
        100% {
          background-color: #ffffff;
        }
      }
    }
  }
</style>
