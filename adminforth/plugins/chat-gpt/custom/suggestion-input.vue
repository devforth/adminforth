<template>
  <div  
      ref="editor"
      @keydown.tab.prevent.stop="approveCompletion('all')"
      @keydown.ctrl.right.prevent.stop="approveCompletion('word')"
      @click="startCompletionIfEmpty"
      :class="`type-${props.type}`"
  >
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
    node.setAttribute('completer', '');
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

const emit = defineEmits([
  'update:modelValue',
]);

const editor = ref(null);
let quill = null;

onMounted(async () => {
  console.log('props type', props.type);
  console.log('props modelValue', props.modelValue);
  quill = new Quill(editor.value, {
    theme: "snow",
    modules: {
      toolbar: null,
    },
  });

  quill.on(Quill.events.TEXT_CHANGE, (delta, oldDelta, source) => {
    const text = quill.getText();
    console.log('🪽 text changed', text);
    if (props.type === 'string' && text.includes('\n\n')) {
      const newText = text.replace(/\n\n/g, '');
      quill.setText(newText, 'silent');
    }
    console.log('1️⃣ emit value from child', text);
    emit('update:modelValue', text);
    // allow update to propagate
    startCompletion();
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


const tmt = ref(null);

async function startCompletion() {
  editor.value.setAttribute('data-with-complete', 'false');

  if (tmt.value) {
    clearTimeout(tmt.value);
  }
  tmt.value = setTimeout(async () => {
    let completion = await props.completionRequest();
    if (props.type === 'string') {
      completion = completion.replace(/\n/g, ' ');
    }
    const d = quill.getContents();
    const text = quill.getText();
    const lastIsComplete = d.ops[d.ops.length - 1].insert.complete;
    if (!lastIsComplete) {
      console.log('✅ No completion yet, adding')
      quill.insertEmbed(text.length, 'complete', { text: completion }, 'silent');
    } else {
      console.log('✅ Completion already exists, updating')
      const cursorPosition = quill.getSelection();
      d.ops[d.ops.length - 1].insert.complete.text = completion
      quill.setContents(d, "silent");
      quill.setSelection(cursorPosition.index, cursorPosition.length, 'silent');
    }
    const textNew = quill.getText();
    emit('update:modelValue', textNew);
    editor.value.setAttribute('data-with-complete', 'true');
  }, props.debounceTime || 300);
}

function startCompletionIfEmpty() {
  const d = quill.getContents();
  if (!d.ops[d.ops.length - 1].insert.complete) {
    startCompletion();
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
  
  console.log(`💨 state before compl ${JSON.stringify(ops)}`);

  // replace one \n in the end
  ops[ops.length - 2].insert = ops[ops.length - 2].insert.replace(/\t\n$/g, '');
  // replace one tab in the end
  // ops[ops.length - 2].insert = ops[ops.length - 2].insert.replace(/\t$/g, '');
  // ops[ops.length - 2].insert = ops[ops.length - 2].insert.replace(/\n$/g, '');

  if (props.type === 'string') {
    ops[ops.length - 2].insert = ops[ops.length - 2].insert.replace(/\n/g, ' ');
  }
  let needComplete = false;
  if (type === 'all') {
    ops[ops.length - 2].insert += completion;

    quill.setContents({ ops }, 'silent');

    needComplete = true;
    
  } else {
    const firstWord = completion.split(' ')[0] + ' ';
    const newCompletion = completion.slice(firstWord.length);
    ops[ops.length - 2].insert += firstWord;

    // update completion
    ops[ops.length - 1].insert.complete.text = newCompletion;
    quill.setContents({ ops }, 'silent');

    if (newCompletion.length === 0) {
      needComplete = true;
    }
  }
  console.log(`💨 state after compl ${JSON.stringify(ops)}`);

  // set cursor to the end
  const textNew = quill.getText();
  quill.setSelection(textNew.length, 0, 'silent');

  if (needComplete) {
    startCompletion();
  }
}

</script>

<style lang="scss">
.ql-editor {
  outline: none;
  &:focus {
    outline: none;
  }
}

.ql-editor p:last-of-type {
  display: inline;
}

.ql-container[data-with-complete="true"] .ql-editor {
  p:last-of-type br {
    display: none;
  }
}

.ql-container[data-with-complete="false"] [completer] {
  display: none;
}

.type-string {

  .ql-editor {
    overflow: hidden;
  }
}
</style>