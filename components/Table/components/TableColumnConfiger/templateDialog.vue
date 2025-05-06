<template>
  <!-- 新建和编辑表格字段模板Dialog -->
  <XSDialog
    :visible="visible"
    custom-class="table-template-dialog"
    :title="optType == 'create' ? '新建视窗' : '编辑视窗'"
    width="846px"
    :before-close="confirmBeforeClose"
    @close="confirmBeforeClose"
  >
    <div class="content">
      <div v-show="isChooseMax" class="num-hint">
        字段最多可选择{{ sortNumberLimit }}个！
      </div>
      <div class="input-box">
        <div class="name">
          <span class="star">*</span>
          <span class="text">视窗名称</span>
        </div>
        <div>
          <el-input
            ref="inputRef"
            v-model="name"
            placeholder="请输入视窗名称"
            clearable
            autofocus
            :maxlength="15"
            @blur="handleBlur"
          />
          <div v-show="showValidateText && !isClosing" class="validate-text">
            视窗名称不能为空
          </div>
        </div>
      </div>
      <div class="main">
        <ul class="left">
          <li
            v-for="module in moduleList"
            :key="module.name"
            :style="{
              backgroundColor: module.bgColor
            }"
            :class="['module-item', module.isSecondaryGroup ? 'secondary' : '']"
          >
            <span class="module-item__name">{{ module.name }}</span>
            <div class="module-item__list">
              <div
                v-for="field in module.fieldList"
                :key="field.name"
                class="field-item"
              >
                <el-checkbox
                  :key="field.name"
                  v-model="field.checked"
                  size="small"
                  :disabled="!field.enabled || (isChooseMax && !field.checked)"
                  @change="clickMoudleField(field)"
                >
                  <TextOverTooltip :title="field.name" is-native-title>
                    <span class="field-item__name">
                      {{ field.name }}
                    </span>
                  </TextOverTooltip>
                </el-checkbox>
                <el-tooltip
                  v-if="field.note && field.note !== field.name"
                  popper-class="xs-tips"
                  :content="field.note"
                  placement="top"
                  :hide-after="0"
                  transition=""
                >
                  <i
                    class="icon-explain field-item__tips"
                    style="margin-right: 4px"
                  ></i>
                </el-tooltip>
              </div>
            </div>
          </li>
        </ul>

        <div class="right sort">
          <div class="sort__hd">
            <div class="opts">
              <span class="select-num">
                已选{{ seletedFieldCount }}/{{ sortNumberLimit }}
              </span>
              <span class="clear-btn" @click="clearAllFields">清空</span>
            </div>
            <div class="tips">拖动以下字段进行排序</div>
          </div>
          <div class="sort__bd">
            <draggable
              v-model="sortFieldList"
              class="sort-bd--content"
              item-key="key"
              v-bind="dragOptions"
              :move="onMove"
              @start="isDraging = true"
              @end="isDraging = false"
            >
              <template #item="{ element }">
                <div
                  class="sort-item"
                  :class="{ 'sort-item--fixed': element.fixed }"
                >
                  <i class="icon-dragTo"></i>
                  <span v-title="element.name" class="sort-item__name ellipsis">
                    {{ element.name }}
                  </span>
                  <i
                    class="icon-cancel"
                    @click="clickMoudleField(element, true)"
                  ></i>
                </div>
              </template>
            </draggable>
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <XSButton plain class="btn btn-cancel" @click="confirmBeforeClose">
        取消
      </XSButton>
      <XSButton normal class="btn btn-confirm" @click="handleConfirm">
        确定
      </XSButton>
    </template>
  </XSDialog>
</template>

<script setup>
  import { ref, defineProps, nextTick, computed, onMounted } from 'vue';
  import XSDialog from '@/components/CommonDialog.vue';
  import draggable from 'vuedraggable';
  import { useTemplateDialog } from './useTemplateDialog.js';
  import XSButton from '@/components/Button.vue';
  import { allowHTMLScroll } from '@/utils/scroll';
  import MessageBox from '@/components/ConfirmDialog/Confirm';
  import { ElMessage } from 'element-plus';
  import { saveTableConfigTemplateApi } from '@/api/base.js';
  import { state } from './state';
  import TextOverTooltip from '@/components/TextOverTooltip/index.vue';
  import { useEventListener } from '@vueuse/core';
  import { wait } from '@/utils/utils';

  const props = defineProps({
    curTemplateId: {
      type: String,
      required: true
    },
    data: {
      type: Object,
      default: () => ({})
    },
    onClose: {
      type: Function,
      required: true
    },
    tableKey: {
      type: String,
      required: true
    },
    tower: {
      type: Boolean,
      default: false
    },
    optType: {
      type: String,
      default: 'edit'
    },
    sortNumberLimit: {
      type: Number,
      default: 25
    },
    getTemplateList: {
      type: Function,
      required: true
    },
    switchTemplate: {
      type: Function,
      default: () => {}
    },
    setTemplateName: {
      type: Function,
      default: () => {}
    },
    isCurrentTemplate: {
      type: Boolean,
      default: false
    },
    contextEmits: {
      type: Function,
      default: null
    }
  });

  const {
    moduleList,
    sortFieldList,
    clickMoudleField,
    isSortChanged,
    seletedFieldCount,
    clearAllFields
  } = useTemplateDialog({
    data: props.data,
    optType: props.optType
  });

  const isChooseMax = computed(
    () => sortFieldList.value.length === +props.sortNumberLimit
  );

  // 抽屉是否可见
  const visible = ref(true);

  // 模板名称校验文本可见
  const showValidateText = ref(false);

  const inputRef = ref(null);

  // 模板名称输入框自动聚焦
  onMounted(() => {
    nextTick(() => {
      inputRef.value?.focus();
    });
  });

  const handleBlur = () => {
    // 防止关闭的时候触发失焦事件，显示提示文本
    setTimeout(() => {
      if (name.value.trim() !== '') {
        showValidateText.value = false;
        inputRef.value?.ref.classList.remove('invalid');
      } else {
        showValidateText.value = true;
        inputRef.value?.ref.classList.add('invalid');
      }
    }, 150);
  };

  const name = ref(props.data.name || '');

  // 正在关闭弹窗的标识
  const isClosing = ref(false);

  const close = () => {
    visible.value = false;
    state.globalTableTemplateDialogVisible = false;
    nextTick(allowHTMLScroll);
    props.onClose();
  };

  const doClose = ref();

  const isEsc = ref();

  // 监听keyup事件如果是esc则把isEsc设置为true
  useEventListener(
    document.body,
    'keyup',
    e => e.keyCode === 27 && (isEsc.value = true)
  );

  const confirmBeforeClose = async done => {
    isClosing.value = true;
    await wait(200);
    // 如果done是function则表明触发了beforeClose
    const isDone = typeof done === 'function';

    if (
      // 如果内容变动了
      isSortChanged() &&
      // 如果是主动触发并且不是点确认关闭的并且没有将isEsc设置为false或者
      ((!isDone && !doClose.value && isEsc.value !== false) ||
        // 是beforeClose触发的且是按了esc的情况打开提示弹框
        (isDone && isEsc.value))
    ) {
      MessageBox({
        title: '提示',
        message: '数据未保存，确认关闭吗?',
        draggable: false,
        showCancelButton: true,
        lockScroll: true
        // confirmBtnType: 'danger'
      }).then(() => {
        // 如果是按esc触发的下次触发直接关闭
        if (isEsc.value) {
          doClose.value = true;
        } else {
          doClose.value = false;
        }
        isEsc.value = false;
        close();
        isDone && done();
      });
    } else {
      if (isEsc.value) {
        doClose.value = true;
      } else {
        doClose.value = false;
      }
      isEsc.value = false;
      close();
      isDone && done();
    }
  };

  // 点击确定按钮
  const handleConfirm = async () => {
    name.value = name.value.trim();
    if (name.value === '') {
      // ElMessage.warning('模板名称不允许为空');
      showValidateText.value = true;
      return;
    }
    // 不管是新建和编辑都不允许，都至少选择一个字段
    if (sortFieldList.value.length === 0) {
      ElMessage({
        type: 'warning',
        message: '请勾选要展示的列'
      });
      return;
    }
    const isSameName = name.value === (props?.data?.name || '');
    if (isSortChanged() || !isSameName) {
      // 请求接口
      try {
        const display = sortFieldList.value.map(item => item.key);
        const params = {
          display,
          tableKey: props.tableKey,
          name: name.value
        };

        if (props.optType === 'edit') {
          params.id = props.data.id;
        }

        const res = await saveTableConfigTemplateApi(params, {
          tower: props.tower
        });
        if (res?.data?.code === 0) {
          ElMessage.success('保存成功');
          props.getTemplateList();
          if (
            props.optType === 'edit' &&
            props.curTemplateId === props?.data?.id
          ) {
            props.switchTemplate(display);
            props.setTemplateName(name.value);
          }
          // 如果是当前使用中的模板，且传入了上下文的 emits ，那么就出发上下文的 change 事件；
          if (props.isCurrentTemplate && props.contextEmits) {
            props.contextEmits('change');
          }
        }
      } catch (error) {
        console.log('保存或者新建模板错误：', error);
      }
      doClose.value = true;
      close();
    } else {
      // ElMessage.warning('数据未发生改变');
      doClose.value = true;
      close();
    }
  };

  // draggable option 参数：http://www.sortablejs.com/options.html
  const dragOptions = ref({
    animation: 200,
    disabled: false,
    ghostClass: 'ghost', // drop placeholder的css类名
    filter: '.sort-item--fixed' // 过滤器，不需要进行拖动的元素
  });

  // 是否在排序
  const isDraging = ref(false);

  // 正在移动：忽略固定位置项
  const onMove = evt => {
    return evt.related.className.indexOf('sort-item--fixed') === -1;
  };
</script>

<style lang="scss" scoped>
  .table-template-dialog {
    border-radius: 4px;
    .el-dialog__body .dialog-content_body {
      padding: 0;
    }
    .content {
      font-size: 14px;
      .num-hint {
        width: 100%;
        height: 24px;
        font-size: 12px;
        color: #595959;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #fffbcc;
        position: absolute;
        transform: translate(-16px, -16px);
      }
      .input-box {
        height: 88px;
        display: flex;
        // align-items: center;
        padding-left: 24px;
        padding-top: 32px;
        padding-bottom: 24px;
        .name {
          margin-top: 7px;
          margin-right: 16px;
          letter-spacing: 0.84px;
          .star {
            color: #bd4206;
          }
        }
        .el-input {
          width: 344px;
          .el-input__inner {
            &.invalid {
              border: 1px solid #bd4206 !important;
            }
            &:focus {
              box-shadow: none !important;
            }
            &:hover {
              box-shadow: none !important;
            }
          }
        }
        .validate-text {
          margin-top: 2px;
          font-size: 12px;
          color: #bd4206;
        }
      }
      .main {
        display: flex;
        max-height: 472px;
        overflow: auto;
        .left {
          flex: 1 1 0%;
          background: #fff;
          box-sizing: border-box;
          overflow: auto;
          .header {
            padding: 12px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;

            .name {
              font-size: 16px;
            }
            .opt {
              height: 24px;
              display: flex;
              align-items: center;
              padding: 0 8px;
              color: #3d6dda;
              border-radius: 2px;
              border: 1px solid #3d6dda;
              cursor: pointer;
              i {
                font-size: 14px;
                margin-right: 4px;
              }
              .text {
                font-size: 12px;
              }
            }
          }

          .module-item {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            padding: 16px 24px;
            padding-right: 16px;
            &.secondary {
              padding-top: 0;
              margin-top: -8px;
              .module-item__name {
                margin-left: 10px;
                font-size: 12px;
                font-weight: 400;
              }
            }

            &__name {
              height: 18px;
              line-height: 15px;
              color: #000;
              font-size: 14px;
              font-weight: 700;
            }

            &__list {
              width: 100%;
              padding-left: 10px;
              box-sizing: border-box;

              .field-item {
                display: inline-flex;
                flex-direction: row;
                align-items: center;
                height: 30px;
                width: 25%;
                cursor: pointer;

                &__name {
                  // padding: 0 4px 2px 6px;
                  // position: relative;
                  // top: -1px;
                  font-size: 12px;
                  color: #595959;
                  user-select: none;
                }

                &__tips {
                  margin: 0 4px;
                  font-size: 14px;
                  color: var(--text-tblight-color);
                }

                // &--disabled {
                //   opacity: 0.45;
                //   cursor: not-allowed;
                // }

                // &--fixed {
                //   opacity: 0.65;
                //   cursor: not-allowed;
                // }
              }
            }
          }
        }

        .right {
          width: 180px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          background: #f3f6ff;

          .sort__hd {
            font-size: 12px;
            line-height: 15px;
            margin-bottom: 16px;
            .opts {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 8px;
              .select-num {
                color: #5a5a5a;
              }
              .reset-btn,
              .clear-btn {
                color: var(--main-color);
                cursor: pointer;
              }
              .reset-btn {
                margin-left: auto;
              }
              .clear-btn {
                margin-left: 4px;
              }
            }
            .tips {
              color: #bfbfbf;
            }
          }

          .sort__bd {
            flex: 1;
            height: 0;
            position: relative;

            .sort-bd--content {
              width: 100%;
              height: 100%;
              overflow: auto;

              .sort-item {
                display: flex;
                flex-direction: row;
                align-items: center;
                padding: 0 3px;
                height: 28px;
                margin-bottom: 8px;
                background-color: #fff;
                border: 1px solid transparent;
                border-radius: 2px;
                box-shadow: 0px 1px 2px rgba(47, 108, 246, 0.06);
                &:hover {
                  border: 1px solid var(--main-color);
                  .icon-cancel {
                    opacity: 1;
                  }
                }

                &__name {
                  flex: 1 1 0%;
                  padding: 0 4px;
                  font-size: 12px;
                  color: #000;
                  cursor: move;
                }

                &--fixed {
                  opacity: 0.45;
                  cursor: not-allowed;
                }

                i {
                  font-size: 14px;
                  color: var(--border-color);
                }

                .icon-dragTo {
                  cursor: move;
                }
                .icon-cancel {
                  opacity: 0;
                  cursor: pointer;
                  margin-left: auto;
                  color: #8c8c8c;
                }
              }
            }
          }
        }
      }
    }
  }
  // .xs-checkbox {
  //   position: relative;
  //   display: inline-block;
  //   width: 12px;
  //   min-width: 12px;
  //   height: 12px;
  //   border: 1px solid #d4dbe9;
  //   border-radius: 1px;
  //   box-sizing: border-box;

  //   &--checked {
  //     background: var(--main-color);
  //     border: 1px solid var(--main-color);

  //     &::after {
  //       position: absolute;
  //       display: block;
  //       top: 3px;
  //       left: 2px;
  //       width: 5px;
  //       height: 2px;
  //       content: '';
  //       border: 1px solid #fff;
  //       border-width: 0 0 1px 1px;
  //       box-sizing: content-box;
  //       transform-origin: 50%;
  //       transform: rotate(-45deg);
  //     }
  //   }
  // }
</style>
<style lang="scss" scoped>
  .field-item {
    :deep(.el-checkbox.el-checkbox--small) {
      max-width: calc(100% - 24px);
      .el-checkbox__label {
        max-width: calc(100% - 10px);
      }
    }
  }
</style>
