<template>
  <div  
      ref="editor"
      @keydown.tab.prevent.stop="approveCompletion('all')"
      @keydown.ctrl.right.prevent="approveCompletion('word')"
      @keydown="anyKey"
  >
    <p>Hello World!</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, onUnmounted, watch } from "vue";
import Quill from "quill";

const BlockEmbed = Quill.import('blots/block/embed');
class CompleteBlot extends BlockEmbed {
  static blotName = 'complete';
  static tagName = 'span';

  static create(value) {
    let node = super.create();
    node.setAttribute('contenteditable', 'false');
    node.setAttribute('style', `opacity: 0.5`);
    node.innerText = value.text;
    return node;
  }
  
  static value(node) {
    return {
      text: node.innerText,
    };
  }
}

Quill.register(CompleteBlot);

const props = withDefaults(
  defineProps<{
    modelValue: string,
    debounceTime?: number,
    type?: 'text' | 'string',
    delimiter?: '\n' | '<br>',
    completionRequest: () => Promise<string>,
  }>(), {
    debounceTime: 300,
    delimiter: '\n',
    type: 'string',
  }
);

const editor = ref(null);
const completion = ref('');
let quill = null;

onMounted(async () => {
  quill = new Quill(editor.value, {
    theme: "snow",
    modules: {
      toolbar: null,
    },
  });
  
  quill.on('selection-change', (range, oldRange, source) => {
    console.log('🪽 selection changed', range, oldRange, source);
    const text = quill.getText();
    // don't allow to select after completion
    if (range?.index === text.length) {
      quill.setSelection(text.length - 1, 0, 'silent');
    }
  });
});

onUnmounted(() => {
  quill.off(Quill.events.TEXT_CHANGE);
  quill.off('selection-change');
});

async function anyKey() {
  startCompletion();
  const currentDelta = quill.getContents();
  // console.log('🪽 anyKey', JSON.stringify(currentDelta));
  
}

const tmt = ref(null);

async function startCompletion() {
  if (tmt.value) {
    clearTimeout(tmt.value);
  }
  tmt.value = setTimeout(async () => {
    const completion = await props.completionRequest();
    const d = quill.getContents();
    const text = quill.getText();
    console.log('💨✍️ set completion text',  completion);
    const lastIsComplete = d.ops[d.ops.length - 1].insert.complete;
    if (!lastIsComplete) {
      console.log('✅ No completion yet, addig')
      quill.insertEmbed(text.length, 'complete', { text: completion }, 'silent');
    } else {
      console.log('✅ Completion already exists, updating')
      const cursorPosition = quill.getSelection();
      d.ops[d.ops.length - 1].insert.complete.text = completion
      quill.setContents(d, "silent");
      quill.setSelection(cursorPosition.index, cursorPosition.length, 'silent');
    }
    editor.value.setAttribute('data-with-complete', 'true');
  }, props.debounceTime || 300);
}

async function clearCompletion() {
  console.log('🪽 clearCompletion')
  const d = quill.getContents();
  const lastIsComplete = d.ops[d.ops.length - 1].insert.complete;
  if (lastIsComplete) {
    d.ops.splice(d.ops.length - 1, 1);
    quill.setContents(d, "silent");
    editor.value.removeAttribute('data-with-complete');
  }
}


function approveCompletion(type: 'all' | 'word') {
  console.log('🪽 approveCompletion')

  const ops = quill.getContents().ops;
  const completion = ops[ops.length - 1].insert.complete?.text
  if (!completion) {
    return;
  }
  if (typeof ops[ops.length - 2].insert !== 'string') {
    return;
  }
  // const text = quill.getText();
  
  // get completion
  if (type === 'all') {
    console.log(`💨💨 completion ops ${JSON.stringify(ops)}`);

    // replace all \t \n \r in the end
    ops[ops.length - 2].insert = ops[ops.length - 2].insert.replace(/[\t\n\r]+$/g, '');

    ops[ops.length - 2].insert += completion;

    quill.setContents({ ops }, 'silent');

    clearCompletion();
    // set cursor to the end
    const textNew = quill.getText();
    quill.setSelection(textNew.length, 0, 'silent');

    startCompletion();
  } else {
    // const lastWord = d.ops[d.ops.length - 1].insert;
    // const lastWordIndex = lastWord.lastIndexOf(' ');
    // const lastWordLength = lastWord.length;
    // const lastWordStart = d.ops.length - lastWordLength;
    // quill.deleteText(lastWordStart, lastWordLength);
    // quill.insertText(lastWordStart, completion);
  }
}

</script>

<style lang="scss">
.ql-editor {
  outline: none ;
}

.ql-editor p:last-of-type {
  display: inline;
}

.ql-container[data-with-complete] {
  p:last-of-type br {
    display: none;
  }
}
</style>