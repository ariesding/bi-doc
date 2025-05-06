<!-- table 图片+文本表现形式（单元格左边显示图片，右边显示文本） -->
<template>
  <TableOpts
    v-bind="$attrs"
    :custom-backgroud-color="customBackgroudColor"
    :row="goodsInfo"
    :prop="goodsPropMap"
    :class="wrapperClass"
  >
    <div class="message-box" :class="isSimple ? '' : 'not-simple'">
      <!-- 跟进和待办小圆点提示 -->
      <div v-if="showDot" class="ball">
        <span
          v-if="String(goodsInfo?.hasUnread) === '1'"
          class="item has-unread"
        ></span>
        <span
          v-if="String(goodsInfo?.hasTodo) === '1'"
          class="item has-todo"
        ></span>
        <span
          v-if="String(goodsInfo?.hasTask) === '1'"
          class="item has-task"
        ></span>
      </div>
      <!-- 有img url 或 猫宁渠道（支持上传图片） -->

      <template v-if="goodsInfo[goodsPropMap.url] || isMN">
        <el-popover
          v-if="popVisible && showBigPicture"
          :hide-after="15"
          :show-after="300"
          :disabled="!showBigPicture"
          :virtual-ref="triggerRef"
          :placement="placement"
          popper-class="goods-popper"
          width="200"
          :offset="5"
          trigger="hover"
          :persistent="false"
          virtual-triggering
        >
          <template #default>
            <div class="img-box">
              <img
                class="hover-img"
                :src="goodsUrlCalc(false, 'large')"
                height="320"
              />
            </div>
            <div
              v-if="showName"
              class="name-area"
              :class="{
                open: canOpenExternal(
                  `${goodsInfo[goodsPropMap.link] || goodsInfo[goodsPropMap.goodsLink] || ''}`
                )
              }"
              @click="
                jumpTo(
                  `${goodsInfo[goodsPropMap.link] || goodsInfo[goodsPropMap.goodsLink] || ''}`
                )
              "
              v-html="
                wordColorFormat(goodsInfo[goodsPropMap.name], textColorList, textColor)
              "
            ></div>
            <slot name="custom_default"></slot>

            <div class="bottom-bar">
              <div v-if="showCopy" class="copy-area">
                <p class="goods-box">
                  {{ goodsIdTips }}
                  <span>{{ goodsInfo[goodsPropMap.id] }}</span>
                </p>
                <i
                  v-title="'复制'"
                  class="icon-copy"
                  @click="onCopy(goodsInfo[goodsPropMap.id])"
                ></i>
              </div>
              <div v-else></div>

              <div v-if="isUploadImage && isMN" class="upload-goods-image">
                <i class="icon-upload"></i>
                <label :for="uploadUUID">上传图片</label>
              </div>
            </div>

            <slot name="custom_default_bottom"></slot>
          </template>
        </el-popover>

        <img
          ref="triggerRef"
          class="trigger-img"
          :class="{ border: imgBorder }"
          :src="smallImg"
          :data-set="goodsPropMap.url"
          @mouseover="imgOver"
        />

        <!-- 选择文件 -->
        <input
          :id="uploadUUID"
          ref="uploadInputRef"
          class="upload-input"
          type="file"
          accept=".jpg,.png,.gif"
          @change="fileChange"
        />
      </template>

      <!-- 没有img url -->
      <template v-else>
        <img
          v-if="!asyncLoad"
          class="empty-img"
          :src="emptyUrl"
          style="border-radius: 2px"
        />
        <div
          v-if="asyncLoad"
          class="empty-img-async"
          @click="
            jumpTo(`${goodsInfo[goodsPropMap.link] || goodsInfo[goodsPropMap.goodsLink] || ''}`)
          "
        ></div>
      </template>
      <template v-if="isSimple">
        <!-- 文字 -->
        <div class="right_box">
          <div
            class="right_box-top"
            :class="{ center: !showId && !slots.default }"
          >
            <button class="operation" :class="goodsNameClass">
              <TextOverTooltip
                :rows="rows"
                :title="goodsInfo[goodsPropMap.name]"
                :is-native-title="isNativeTitle || !textColorList.length"
              >
                <slot name="name_prefix"></slot>
                <!-- 可以点击链接跳转 -->
                <span
                  v-if="
                    canClickJump &&
                    canOpenExternal(
                      `${goodsInfo[goodsPropMap.link] || goodsInfo[goodsPropMap.goodsLink] || ''}`
                    )
                  "
                  v-title="isNativeTitle ? goodsInfo[goodsPropMap.name] : ''"
                  @click.stop="
                    jumpTo(
                      `${
                        goodsInfo[goodsPropMap.link] || goodsInfo[goodsPropMap.goodsLink] || ''
                      }`,
                      'title'
                    )
                  "
                  v-html="
                    wordColorFormat(
                      goodsInfo[goodsPropMap.name],
                      textColorList,
                      textColor
                    )
                  "
                ></span>

                <!-- 不可以点击链接跳转 -->
                <span
                  v-else
                  v-title="isNativeTitle ? goodsInfo[goodsPropMap.name] : ''"
                  v-html="
                    wordColorFormat(
                      goodsInfo[goodsPropMap.name],
                      textColorList,
                      textColor
                    )
                  "
                ></span>
              </TextOverTooltip>
              <slot name="tooltip_suffix"></slot>
            </button>
            <slot>
              <div v-if="showId" class="goods">
                <p class="goods-box ellipsis">
                  {{ goodsIdTips }}
                  <span>{{ goodsInfo[goodsPropMap.id] }}</span>
                </p>
              </div>
            </slot>
          </div>
          <div v-if="showSubName" class="right_box-bottom font-size-12">
            {{ goodsInfo[goodsPropMap.subName] }}
          </div>
        </div>

        <!-- 等级标记 -->
        <FlagGroup
          v-if="!isSku"
          :id="goodsInfo[goodsPropMap.flags]"
          :scope="goodsPropMap.scope"
        />
        <!-- 已下架 -->
        <OldGoodsTag
          v-if="!hideSoldOut && !isSku"
          :status="goodsInfo?.status"
        />
        <!-- 新品 -->
        <template v-if="!isSku">
          <!--我的项目，使用 isNewGoods 判断-->
          <template v-if="showAsideMenu">
            <NewGoodsTag v-if="goodsInfo?.isNewGoods" force-show />
          </template>
          <!--工作台组件，暂时保留原有逻辑-->
          <NewGoodsTag v-else :on-sale-time="goodsInfo?.onSaleTime" />
        </template>
        <slot name="custom_tag"></slot>
      </template>

      <!-- 多行详细显示  -->
      <template v-else>
        <div class="right_box">
          <button class="operation" :class="goodsNameClass">
            <span
              v-if="
                canClickJump &&
                canOpenExternal(
                  `${goodsInfo[goodsPropMap.link] || goodsInfo[goodsPropMap.goodsLink] || ''}`
                )
              "
              v-title="isNativeTitle ? goodsInfo[goodsPropMap.name] : ''"
              @click.stop="
                jumpTo(
                  `${goodsInfo[goodsPropMap.link] || goodsInfo[goodsPropMap.goodsLink] || ''}`,
                  'title'
                )
              "
              v-html="
                wordColorFormat(goodsInfo[goodsPropMap.name], textColorList, textColor)
              "
            ></span>

            <!-- 不可以点击链接跳转 -->
            <span
              v-else
              v-title="isNativeTitle ? goodsInfo[goodsPropMap.name] : ''"
              v-html="
                wordColorFormat(goodsInfo[goodsPropMap.name], textColorList, textColor)
              "
            ></span>
          </button>

          <!-- 标签 -->
          <div class="flags-wrapper">
            <!-- 等级标记 -->
            <FlagGroup
              v-if="!isSku"
              :id="goodsInfo[goodsPropMap.flags]"
              :scope="goodsPropMap.scope"
              :collopse-size="4"
            />
            <!-- 已下架 -->
            <OldGoodsTag
              v-if="!hideSoldOut && !isSku"
              :status="goodsInfo?.status"
            />
            <!-- 新品 -->
            <template v-if="!isSku">
              <!--我的项目，使用 isNewGoods 判断-->
              <template v-if="showAsideMenu">
                <NewGoodsTag v-if="goodsInfo?.isNewGoods" force-show />
              </template>
              <!--工作台组件，暂时保留原有逻辑-->
              <NewGoodsTag v-else :on-sale-time="goodsInfo?.onSaleTime" />
            </template>
            <slot name="custom_tag"></slot>
          </div>

          <!-- 店铺 -->
          <div class="shop-wrapper">
            <img v-if="shopLogo" :src="shopLogo" />
            <TextOverTooltip is-native-title :title="goodsInfo.shopName">
              <span
                v-if="canOpenExternal(goodsInfo.shopLink)"
                class="linkClass"
                style="cursor: pointer"
                @click.stop="openExternalLink(goodsInfo.shopLink)"
              >
                {{ goodsInfo.shopName }}
              </span>
              <span v-else>{{ goodsInfo.shopName }}</span>
            </TextOverTooltip>
          </div>
        </div>
      </template>
    </div>
  </TableOpts>
</template>

<script setup>
  import { computed, useSlots, ref } from 'vue';
  import emptyUrl from '@/assets/images/Empty/nodata_goods.svg';
  import TextOverTooltip from '@/components/TextOverTooltip/index.vue';
  import TableOpts from '@/components/TableOpts/index.vue';
  import NewGoodsTag from '@/components/GoodsDetailContainer/NewGoodsTag.vue';
  import OldGoodsTag from '@/components/GoodsDetailContainer/OldGoodsTag.vue';
  import FlagGroup from '@/components/Flag/FlagGroup.vue';
  import { wordColorFormat } from '@/utils/utils';
  import { useWindowSize } from '@vueuse/core';
  import { effectiveUrl, ensureUrlStartsWithHttp } from '@/utils/img';
  import { onCopy } from '@/utils/onCopy';
  import { useRoute } from 'vue-router';
  import { SCOPE } from '@/components/Flag/config';
  import { canOpenExternal, openExternalLink } from '@/utils/windowUtil';
  import { channelMap } from '@/utils/table';
  import useUploadGoodsImage from '@/hooks/useUploadGoodsImage';
  import { isSpu } from '@/utils/goodsUtils';

  const slots = useSlots();

  const props = defineProps({
    showId: {
      type: Boolean,
      default: () => false
    },
    showCopy: {
      type: Boolean,
      default: () => false
    },
    overEvent: {
      type: Boolean,
      default: () => false
    },
    wrapperClass: {
      type: String,
      default: ''
    },
    showName: {
      type: Boolean,
      default: () => false
    },
    initialPic: {
      type: Boolean,
      default: false
    },
    /*
        goods属性：
            src:小图地址
            bigSrc:大图地址
            title:商品名称
            id,
            link:跳转商品地址
            hasUnread:有消息 0否 1是
        */
    goods: {
      type: Object,
      default: () => {}
    },
    // 商品id的name 适配部分京东页面显示SPUID
    goodsIdTips: {
      type: String,
      default: '商品ID:'
    },
    // 特殊文字颜色
    textColor: {
      type: String,
      default: '#BD4206'
    },
    // 需要特殊颜色的文字数组
    textColorList: {
      type: Array,
      default: () => []
    },
    prop: {
      type: Object,
      default: () => ({})
    },
    rows: {
      type: Number,
      default: 1
    },
    // 是否异步加载图片(存在其他接口获取图片，例如：选款分析和直通车中)
    asyncLoad: {
      type: Boolean,
      default: false
    },
    /**
     * 缩略图尺寸
     * ps:这边的尺寸为淘系商品图的尺寸，在设置后需要确认一下此尺寸是否存在相对图片
     */
    imgSzie: {
      type: Number,
      default: 24
    },
    imgBorder: {
      type: Boolean,
      default: true
    },
    // 能否点击跳转到商品主页
    canClickJump: {
      type: Boolean,
      default: () => true
    },
    hideSoldOut: {
      //
      type: Boolean,
      default: false
    },
    showBigPicture: { type: Boolean, default: true }, //hover时是否显示大图\
    showSubName: {
      type: Boolean,
      default: false
    },
    // 商品名称悬浮不采用el-tooltip，采用title
    isNativeTitle: {
      type: Boolean,
      default: false
    },
    // 展示跟进待办的红点和蓝点提示
    showDot: {
      type: Boolean,
      default: false
    },
    // 自动设置img hover出现的位置
    autoPlacement: {
      type: Boolean,
      default: false
    },
    // hover自定义背景色
    customBackgroudColor: {
      type: String,
      default: ''
    },
    // 是否是sku列
    isSku: {
      type: Boolean,
      default: false
    },
    // 是否是简单缩略显示（单行、小图片）
    isSimple: {
      type: Boolean,
      default: true
    },
    // 是否可以上传图片
    isUploadImage: {
      type: Boolean,
      default: true
    }
  });

  const emits = defineEmits(['on-img-over', 'upload-image']);
  // 商品信息
  const goodsInfo = computed(() => {
    return props.goods;
  });
  const defaultPropMap = {
    id: isSpu(goodsInfo.value) ? 'spuid' : 'goodsId',
    url: 'goodsUrl',
    name: 'goodsName',
    scope: SCOPE.sp,
    link: 'link',
    status: 'status',
    flags: 'goodsFlag',
    goodsLink: 'goodsLink',
    subName: 'subName'
  };

  /**
   * img hover出现的位置
   */
  const placement = ref('right');
  const setPlacement = () => {
    try {
      const { width } = useWindowSize();
      if (width.value - triggerRef.value.getBoundingClientRect().right < 360)
        placement.value = 'left';
    } catch (e) {}
  };

  /**
   * 控制img pop是否渲染
   * @type {Ref<UnwrapRef<boolean>>}
   */
  const popVisible = ref(false);

  /**
   * img pop trigger ref
   * @type {Ref<any>}
   */
  const triggerRef = ref();
  
  // goodsPropMap 商品属性映射对象
  const goodsPropMap = computed(() => {
    return { ...defaultPropMap, ...props.prop };
  });

  /**
   * @param {*} url
   * @param {*} type 表示点击哪个区域，为空时允许跳转（跳过props限制）
   */
  const jumpTo = (url, type) => {
    if (!type || props.canClickJump) {
      openExternalLink(url);
    }
  };

  const imgOver = () => {
    // 需要设置自动显示hover位置的先进行计算
    if (props.autoPlacement) setPlacement();
    popVisible.value = true;
    if (props.overEvent) {
      emits('on-img-over', {
        dom: triggerRef.value,
        data: {
          ...goodsInfo.value
        }
      });
    }
  };

  /**
   * 修正后端返回的数据中已有裁剪的参数时
   */
  const CROP_REG = /_\d+x\d+\./gi;
  // 最新的后缀是xz
  const CROP_NEW = /_\d+x\d+xz/gi;

  // 商品图片地址
  const goodsImgUrl = computed(() => {
    let path = ensureUrlStartsWithHttp(goodsInfo.value?.[goodsPropMap.value.url]);

    // 图片还原(后端返回的图片可能已经裁剪过导致smallImg再次裁剪加载不出图片)
    if (CROP_REG.test(path)) path = path.split(path.match(CROP_REG)[0])[0];
    if (CROP_NEW.test(path)) path = path.split(path.match(CROP_NEW)[0])[0];
    return path;
  });

  // 是否是 alicdn 的，是才可以缩略
  const isAliCdn = computed(() => goodsImgUrl.value?.includes?.('alicdn'));
  // 是否可以使用缩略图
  const haveSmall = ref(true);
  goodsImgUrl.value &&
    isAliCdn.value &&
    effectiveUrl(
      `${goodsImgUrl.value}_${props.imgSzie}x${props.imgSzie}.jpg`
    ).then(b => {
      haveSmall.value = b;
    });

  const smallImg = computed(() => {
    // 返回原图；
    if (props.initialPic) return goodsImgUrl.value;
    if (isAliCdn.value) {
      const url = `${goodsImgUrl.value}_${props.imgSzie}x${props.imgSzie}.jpg`;
      return haveSmall.value ? url : goodsImgUrl.value;
    }
    return goodsImgUrl.value || emptyUrl;
  });

  const goodsUrlCalc = computed(() => {
    return (initial = false, size = 'normal') => {
      const _size =
        size === 'normal' ? `_${props.imgSzie}x${props.imgSzie}.` : `_320x320.`;

      // 返回原图；
      if (initial || props.initialPic) return goodsImgUrl.value;

      // 如果已经是裁剪图了，就把裁剪参数换一下，返回裁剪图；
      if (CROP_REG.test(goodsImgUrl.value)) {
        const url = goodsImgUrl.value?.replace?.(CROP_REG, _size);
        return haveSmall.value ? url : goodsImgUrl.value;
      }
      if (CROP_NEW.test(goodsImgUrl.value)) {
        const url = goodsImgUrl.value?.replace?.(CROP_NEW, _size);
        return haveSmall.value ? url : goodsImgUrl.value;
      }

      // 没有裁剪参数且是alicdn域名的，就裁剪一下，返回裁剪图；
      if (isAliCdn.value) {
        const url = `${goodsImgUrl.value}${_size}jpg`;
        return haveSmall.value ? url : goodsImgUrl.value;
      }
      // 兜底的返回;
      return goodsImgUrl.value || emptyUrl;
    };
  });

  const route = useRoute();
  // 显示侧边菜单，在我的项目
  const showAsideMenu = computed(() => !!route.meta.showAsideMenu);

  // 商品名称class
  const goodsNameClass = computed(() => {
    const goods = goodsInfo.value;
    const canClickJump = props.canClickJump;

    const _map = goodsPropMap.value;
    const goodsLink = goods[_map.goodsLink];
    const link = goods[_map.link];
    const Status = goods[_map.status];
    return {
      normal: (!goodsLink && !link) || !canClickJump,
      oldGoods: (Status || Status === 0) && +Status !== 1,
      disableOldGoods:
        !canClickJump || !canOpenExternal(`${link || goodsLink || ''}`),
      open: canClickJump && canOpenExternal(`${link || goodsLink || ''}`)
    };
  });

  const shopLogo = computed(
    () => channelMap[goodsInfo.value?.platform?.toLowerCase()]?.icon
  );

  // 上传商品图片
  const { uploadInputRef, uploadUUID, isMN, fileChange } = useUploadGoodsImage({
    queryParams: computed(() => {
      const goods = goodsInfo.value;
      return {
        goodsId: goods[goodsPropMap.value.id],
        platform: goods.platform,
        shopId: goods.shopId
      };
    }),
    successCb: goodsUrl => {
      const goods = goodsInfo.value;
      goods[goodsPropMap.value.url] = goodsUrl;
      emits('upload-image', goodsUrl);
    }
  });
</script>

<style lang="scss">
  .message-box {
    width: 100%;
    overflow: hidden;
    .ball {
      width: 12px;
      height: 24px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      position: absolute;
      left: 2px;
      & > :not(:last-child) {
        margin-bottom: 1.5px;
      }
      .item {
        width: 7px;
        height: 7px;
        // border: 1px solid white;
        border-radius: 50%;
        box-sizing: border-box;
      }
      .has-unread {
        background: #e23735;
      }
      .has-todo {
        background: #2f6cf6;
      }
      .has-task {
        background: #ffb32c;
      }
    }

    .empty-img {
      width: 24px;
      height: 24px;
    }

    .empty-img-async {
      background: linear-gradient(90deg, #f7f9ff 27%, #fff 37%, #f7f9ff 45%);
      background-size: 400% 100%;
      animation: loading 1.4s ease infinite;

      @-webkit-keyframes loading {
        0% {
          background-position: 100% 50%;
        }
        100% {
          background-position: 0 50%;
        }
      }
      width: 40px;
      height: 40px;
      border-radius: 2px;
    }
  }
  .goods-popper {
    .img-box {
      text-align: center;
      .hover-img {
        object-fit: contain;
        border-radius: 2px;
      }
    }
  }

  // 表格，开启打标等批量操作时，商品会在第二列，调整一些样式
  .el-table
    .el-table__inner-wrapper
    .el-table__body-wrapper
    .el-table__row
    .el-table__cell:nth-child(2) {
    // 小圆点位置左移
    .message-box .ball {
      left: -2px;
    }
  }
</style>
<style lang="scss" scoped>
  $primaryColor: var(--main-color);
  .name-area {
    width: 320px;
    padding: 0 6px;
    margin: 8px 0;
    font-style: normal;
    font-weight: 400;
    line-height: 16px;
    letter-spacing: -0.02em;
    color: var(--main-color);
    font-family: 'Microsoft YaHei UI';
    cursor: default;
    &.open {
      cursor: pointer;
    }
  }

  .bottom-bar {
    padding: 0 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .copy-area {
    display: flex;
    align-items: center;
    justify-content: start;
    color: #595959;
    img {
      width: 12px !important;
      height: 12px !important;
      margin-left: 6px;
      cursor: pointer;
    }
    .icon-copy {
      font-size: 15px;
      margin-left: 6px;
      cursor: pointer;
    }
  }

  .upload-goods-image {
    display: flex;
    align-items: center;
    color: var(--text-light-color);
    cursor: pointer;

    &:hover {
      color: var(--main-color);
    }

    i {
      font-size: 14px;
      margin-right: 4px;
    }

    label {
      cursor: pointer;
    }
  }

  .operation {
    outline: none;
    border: none;
    background: transparent;
    color: var(--main-color);
    // cursor: pointer;
    text-align: left;
    &.open {
      span {
        cursor: pointer;
        color: #3d6dda;
        &:hover {
          color: #2351b9;
          text-decoration: underline;
        }
        &:active {
          color: #1a3b87;
          text-decoration: underline;
        }
      }
    }
    &.normal {
      // 不可点击时，指针状态清楚
      cursor: inherit;
      color: var(--black);
    }

    &.oldGoods {
      cursor: default;
      color: var(--text-dblight-color) !important;
    }
    &.oldGoods > :deep(*) {
      cursor: default;
      color: var(--text-dblight-color);
      &:hover {
        color: var(--text-dblight-color);
        text-decoration: underline;
      }
      &:active {
        color: var(--text-dblight-color);
        text-decoration: underline;
      }
    }
    &.disableOldGoods > :deep(*) {
      &:hover {
        text-decoration: none;
      }
      &:active {
        text-decoration: none;
      }
    }
  }
  button {
    width: 100%;
  }
  .text-popup {
    max-width: 300px;
  }
  .message-box {
    display: flex;
    align-items: center;

    .trigger-img {
      display: block;
      width: 24px;
      height: 24px;
      border-radius: 2px;
      object-fit: contain;
      &.border {
        border: 1px solid var(--border-color);
      }
    }

    .upload-input {
      display: none;
    }

    .right_box {
      margin-left: 8px;
      width: 0;
      flex: 1 1 auto;
      font-family: Microsoft YaHei;
      &-top {
        a {
          display: block;
          width: 85%;
          color: $primaryColor;
          line-height: 24px;
          font-size: 14px;
          text-decoration: none;
        }

        .goods {
          display: flex;
          align-items: center;

          > img {
            width: 22px;
            height: 22px;
            background: transparent;
            border: 0;
            position: relative;
            top: -1px;
            margin: 0 8px;
            display: block;
            cursor: pointer;
          }

          .goods-box {
            cursor: default;
            span {
              font-family: 'Inter';
              font-size: 15px;
            }
          }
        }

        &.center {
          display: flex;
          align-items: center;
          .operation {
            transform: translateY(1.5px);
          }
        }
      }
      &-bottom {
        color: #595959;
        font-size: 12px !important;
        line-height: 12px !important;
      }
    }

    &.not-simple {
      .empty-img,
      .trigger-img {
        width: 140px;
        height: 140px;
      }

      .right_box {
        display: flex;
        flex-direction: column;

        .operation {
          margin-bottom: 8px;
          white-space: pre-wrap;
        }

        .flags-wrapper {
          display: flex;
          align-items: center;
          &:not(:empty) {
            margin-bottom: 8px;
          }

          & > * {
            margin-left: 0 !important;
            &:not(:first-child) {
              margin-left: 4px !important;
            }
          }
        }

        .shop-wrapper {
          height: 18px;
          display: flex;
          align-items: center;
          img {
            margin-right: 8px;
          }
        }
      }
    }
  }
</style>
