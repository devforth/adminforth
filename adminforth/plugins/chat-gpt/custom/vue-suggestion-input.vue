<template>
  <div 
    :class="`input-type-${type}`"
    @click="input.focus()"
  >
    <span 
      contenteditable="true" 
      @input.input="onInput"
      @focus="initCompletion"
      @blur="onBlur"
      @keydown.tab.prevent="approveComplete()"
      @keydown.ctrl.right.prevent="approveComplete(true)"
      ref="input"
      class="outline-none"
    ></span>
    
    <span v-if="completion" 
      class="completion"
      :class="emptyLine ? 'completion-shift-up' : ''"
      @click="input.focus()">{{ completion }}
    </span>
    <span v-if='!currentValue && !completion' class="placeholder">Type here...</span>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

const props = defineProps<{
  modelValue: string,
  debounceTime: number,
  type: 'text' | 'string',
  completionRequest: () => Promise<string>,
}>();

const emit = defineEmits([
  'update:modelValue',
]);

const completion = ref('');
const input = ref<HTMLElement | null>(null);
const currentValue = ref('');

function updateFromInput() {
  currentValue.value = props.modelValue;
  input.value.innerText = currentValue.value;
}

onMounted(() => {
  updateFromInput()
});

watch(() => props.modelValue, (value) => {
  if (value === currentValue.value) {
    return;
  }
  updateFromInput()
});

watch(() => currentValue.value, (value) => {
  emit('update:modelValue', value);
});

let timeout = null;


async function initCompletion() {
  completion.value = '';
  if (timeout) {
    clearTimeout(timeout);
  }
  timeout = setTimeout(async () => {
    const resp = await props.completionRequest();
    completion.value = resp;
    console.log('initCompletion resp', resp);

  }, props.debounceTime || 300);
}

const emptyLine = ref(false);

function onInput(e) {
  let inText = e.target.innerText;
  emptyLine.value = inText.endsWith('\n\n');
  if (inText.endsWith('\n') && inText.slice(-2, -1) !== '\n') {
    // input.value.querySelector('br:last-child')?.remove();
    inText = e.target.innerText
  }
  // .replace('\u00A0', ' ') - replaces non-breakable space with regular space
  const whatWasEntered = inText.slice(currentValue.value.length).replace('\u00A0', ' ');
  console.log('🪰 whatWasEntered', JSON.stringify(whatWasEntered), completion.value.startsWith(whatWasEntered));
  console.log('🍲 completion', JSON.stringify(completion.value));

  currentValue.value = inText;

  if (whatWasEntered && completion.value.startsWith(whatWasEntered)) {
    completion.value = completion.value.slice(whatWasEntered.length);
    console.log('🍲 completion after mod', JSON.stringify(completion.value));

  } else {
    initCompletion();
  }
}

function onBlur() {
  return; //todo
  completion.value = '';
  timeout && clearTimeout(timeout);
}

function setEndOfContenteditable(contentEditableElement) {
  var range,selection;
  if (document.createRange) { //Firefox, Chrome, Opera, Safari, IE 9+
    range = document.createRange();//Create a range (a range is a like the selection but invisible)
    range.selectNodeContents(contentEditableElement);//Select the entire contents of the element with the range
    range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
    selection = window.getSelection();//get the selection object (allows you to change selection)
    selection.removeAllRanges();//remove any selections already made
    selection.addRange(range);//make the range you have just created the visible selection
  } else if (document.selection) {//IE 8 and lower
    range = document.body.createTextRange();//Create a range (a range is a like the selection but invisible)
    range.moveToElementText(contentEditableElement);//Select the entire contents of the element with the range
    range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
    range.select();//Select the range (make it the visible selection
  }
}

function approveComplete(word: boolean = false) {
  if (emptyLine.value) {
    input.value.querySelector('br:last-child')?.remove();
    emptyLine.value = false;
  }
  const addText = word ? completion.value.split(' ')[0] + ' ' : completion.value;
  // remove from completion
  completion.value = completion.value.slice(addText.length);

  input.value.innerText += addText;
  currentValue.value = input.value.innerText;

  setTimeout(() => {
    setEndOfContenteditable(input.value);
    input.value.focus();
  }, 0);

  if (!word || !completion.value.trim()) {
    initCompletion();
  }


}

</script>

<style scoped>
.completion {
  opacity: 0.5;
  pointer-events: none;
  
}

.completion-shift-up {
  transform: translateY(-1.3rem);
  display: inline-block;
}

.placeholder {
  opacity: 0.5;
}

.input-type-text {
  min-height: 5rem;
  border-radius: 0.25rem;
  white-space: pre-wrap;
}

</style>