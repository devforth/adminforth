<template>

  <div 
    class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 
      focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400
      dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 whitespace-normal af-quill-editor"
  >
    <div  
      ref="editor"
      @keydown.tab.prevent.stop="approveCompletion('all')"
      @keydown.ctrl.right.prevent.stop="approveCompletion('word')"
      @keydown.ctrl.down.prevent.stop="startCompletion()"
    >
      
    </div>
  </div>


</template>

<script setup lang="ts">
import { onMounted, ref, onUnmounted, watch, type Ref } from "vue";
import { callAdminForthApi } from '@/utils';
import { AdminForthColumn } from '@/types/AdminForthConfig';
import AsyncQueue from './async-queue';
import Quill from "quill";
import "quill/dist/quill.snow.css";


function dbg(title: string,...args: any[]) {
  // return; // comment for debug
  console.log(title, ...args.map(a =>JSON.stringify(a, null, 1))); 
}

// blots/embed: Represents inline embed elements, like images or videos that can be inserted into the text flow.
const Embed = Quill.import('blots/embed');

// @ts-ignore
class CompleteBlot extends Embed {
  static blotName = 'complete';
  static tagName = 'span';

  static create(value: { text: string }) {
    let node = super.create();
    node.setAttribute('contenteditable', 'false');
    node.setAttribute('completer', '');
    node.innerText = value.text;
    return node;
  }
  
  static value(node: HTMLElement) {
    return {
      text: node.innerText,
    };
  }
}
// @ts-ignore
Quill.register(CompleteBlot);

const updaterQueue = new AsyncQueue();

const props = defineProps<{
  column: AdminForthColumn,
  record: any,
  meta: any,
}>();

const emit = defineEmits([
  'update:value',
]);

const currentValue: Ref<string> = ref('');

const editor = ref<HTMLElement>();
const completion = ref<string[] | null>(null);
let quill: any = null;
const editorFocused = ref(false);

let lastText: string | null = null;

onMounted(() => {
  currentValue.value = props.record[props.column.name] || '';
  editor.value.innerHTML = currentValue.value;

  quill = new Quill(editor.value as HTMLElement, {
    theme: "snow",
    placeholder: 'Type here...',
    // formats : ['complete'],
    modules: {
      toolbar: props.meta.toolbar || [
        ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
        ['blockquote', 'code-block', 'link'],
        // [
        //   // 'image', 
        //   // 'video', 
        //   // 'formula'
        // ],

        [{ 'header': 2 }, { 'header': 3 }],               // custom button values
        [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'list': 'check' }],
        // [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
        // [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
        // [{ 'direction': 'rtl' }],                         // text direction

        // [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
        // [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

        // [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
        // [{ 'font': [] }],
        [{ 'align': [] }],

        ['clean']                                         // remove formatting button
      ],
      keyboard: {
        bindings: {
          tab: {
            key: 9,
            handler: function (range: any, context: any) {
              if (completion.value !== null) {
                return true;
              }
            },
          },
        },
      }
    },
  });

  lastText = quill.getText();

  quill.on(Quill.events.TEXT_CHANGE, async (delta: any, oldDelta: any, source: string) => {
    dbg('🪽 TEXT_CHANGE fired ', delta, oldDelta, source);
    updaterQueue.add(emitTextUpdate);
    startCompletion();
  });
  
  quill.on('selection-change', (range: any, oldRange: any, source: string) => {
    dbg('🪽 selection changed', range, oldRange, source);
    if (range === null) {
      // blur event
      removeCompletionOnBlur();
      editorFocused.value = false;
      return;
    } else {
      editorFocused.value = true;
      startCompletion();
    }
    const text = quill.getText();
    // don't allow to select after completion
    if (range?.index === text.length) {
      dbg('✋ prevent selection after completion');
      quill.setSelection(text.length - 1, 0, 'silent');
    }
  });


  // handle right swipe on mobile uding document/window, and console log if swiped in right direction
  if ('ontouchstart' in window) {
    document.addEventListener('touchstart', handleTouchStart, false);
    document.addEventListener('touchmove', handleTouchMove, false);
  }

});


async function emitTextUpdate() {
  const html = quill.root.innerHTML;
  
  if (lastText === html) {
    return;
  }

  lastText = html;

  await (new Promise((resolve) => setTimeout(resolve, 0)));

  dbg('⬆️ emit value suggestion-input', html);
  emit('update:value', html);
}

// Auto-Completion functions
let tmt: null | ReturnType<typeof setTimeout> = null;

let xDown: null | number = null;
let yDown: null | number = null;

function handleTouchStart(evt: TouchEvent) {
  xDown = evt.touches[0].clientX;
  yDown = evt.touches[0].clientY;
}

function handleTouchMove(evt: TouchEvent) {
  if (!xDown || !yDown) {
    return;
  }

  let xUp = evt.touches[0].clientX;
  let yUp = evt.touches[0].clientY;

  let xDiff = xDown - xUp;
  let yDiff = yDown - yUp;

  if (Math.abs(xDiff) > Math.abs(yDiff)) {
    if (xDiff < 0) {
      // complete word if completion and input is focused
      dbg('👇 swipe right', completion.value, editorFocused.value);
      if (completion.value !== null && editorFocused.value) {
        approveCompletion('word');
        // [Intervention] Unable to preventDefault inside passive event listener due to target being treated as passive. See https://www.chromestatus.com/feature/5093566007214080
        // evt.preventDefault();
        evt.stopPropagation();
      }
    }
  }

  xDown = null;
  yDown = null;
}

onUnmounted(() => {
  quill.off(Quill.events.TEXT_CHANGE);
  quill.off('selection-change');

  if ('ontouchstart' in window) {
    document.removeEventListener('touchstart', handleTouchStart);
    document.removeEventListener('touchmove', handleTouchMove);
  }
});


async function complete(textBeforeCursor: string) {
  const res = await callAdminForthApi({
      path: `/plugin/${props.meta.pluginInstanceId}/doComplete`,
      method: 'POST',
      body: {
        record: {...props.record, [props.column.name]: textBeforeCursor},
      },
  });

  return res.completion;
}

function updateCompleteEmbed(text: string) {
  const curCursorPos = quill.getSelection();
  const d = quill.getContents();
  const c = d.ops.find((op: any) => op.insert.complete);
  if (!c) {
    return;
  }
  c.insert.complete.text = text;
  quill.setContents(d.ops, 'silent');
  quill.setSelection(curCursorPos.index, curCursorPos.length, 'silent');
}

function deleteCompleteEmbed() {
  const completeNode = quill.root.querySelector('[completer]');
  const completeBlot = Quill.find(completeNode);
  const blotIdx: number | null = completeBlot ? quill.getIndex(completeBlot) : null;

  dbg('👇 complete blot idx', blotIdx);

  if (blotIdx !== null) {
    quill.deleteText(blotIdx, 1, 'silent');
  }
}

function approveCompletion(type: 'all' | 'word') { 
  if (!props.meta.shouldComplete) {
    return;
  }

  dbg('💨 approveCompletion')

  if (completion.value === null) {
    return;
  }

  const cursorPosition = quill.getSelection();

  let shouldComplete = false;
  if (type === 'all') {
    dbg(`👇 insert all at ${cursorPosition.index}, ${completion.value.join('')}`);
    deleteCompleteEmbed();
    quill.insertText(cursorPosition.index, completion.value.join(''), 'silent');
    shouldComplete = true;
  } else {
    const word = completion.value[0];
    quill.insertText(cursorPosition.index, word, 'silent');
    completion.value = completion.value.slice(1);
    if (completion.value.length === 0) {
      shouldComplete = true;
    } else {
      // update completion
      // TODO probably better way to update Embed?
      updateCompleteEmbed(completion.value.join(''));
    }
  }

  updaterQueue.add(emitTextUpdate);

  if (shouldComplete) {
    startCompletion();
  }

}

async function startCompletion() {
  if (!props.meta.shouldComplete) {
    return;
  }
  completion.value = null;
  deleteCompleteEmbed();

  if (tmt) {
    clearTimeout(tmt);
  }
  tmt = setTimeout(async () => {
    const currentTmt = tmt;
    const cursorPosition = quill.getSelection();
    dbg('👇 get pos', cursorPosition.index, cursorPosition.length)
    if (cursorPosition.length !== 0) {
      // we will not complete if text selected
      return;
    }

    const charAfterCursor = quill.getText(cursorPosition.index, 1);
    dbg('👇 charAfterCursor', charAfterCursor);
    if (charAfterCursor !== '\n') {
      // we will not complete if not at the end of the line
      return;
    }

    const textBeforeCursor = quill.getText(0, cursorPosition.index);

    const completionAnswer = await complete(textBeforeCursor);
    if (currentTmt !== tmt) {
      // while we were waiting for completion, new completion was started
      return;
    }

    quill.insertEmbed(cursorPosition.index, 'complete', { text: completionAnswer.join('') }, 'silent');

    // dbg('👇 set pos', cursorPosition.index, cursorPosition.length)
    // quill.setSelection(cursorPosition.index, cursorPosition.length, 'silent');

    completion.value = completionAnswer;

    dbg('👇 completion finished', quill.getContents());

  }, props.meta.debounceTime || 300);
}

function removeCompletionOnBlur() {
  if (lastText?.trim().length === 0) {
    completion.value = null;
    const d = quill.getContents();
    const i = d.ops.findIndex((op: any) => op.insert.complete);
    if (i !== -1) {
      d.ops.splice(i, 1);
      quill.setContents(d, 'silent');
      dbg('🧹 Cleaned completion from ops to make ph visible');
    }
  }
}

</script>

<style lang="scss">

.af-quill-editor {

  .ql-toolbar.ql-snow[class] {
    border: none;
    padding: 0 0 1rem 0;

    .ql-picker-label{
      padding-left: 0;
    }
  }

  .ql-container {
    border: 0;

    .ql-editor {
      position: relative;
      padding: 0;
      min-height: 100px;

      &.ql-blank::before {
        left: 0px;
        font-style: normal;
      }
    }
  }


//TODO: remove
//  .ql-editor:not(:focus) [completer] {
//    display: none;
//  }

  .ql-editor [completer] {
    color: gray;
    font-style: italic;
  }

}




</style>