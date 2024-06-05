"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useModalStore = void 0;
const vue_1 = require("vue");
const pinia_1 = require("pinia");
exports.useModalStore = (0, pinia_1.defineStore)('modal', () => {
    const modalContent = (0, vue_1.ref)({
        title: 'title',
        content: 'content',
        acceptText: 'acceptText',
        cancelText: 'cancelText',
    });
    const isOpened = (0, vue_1.ref)(false);
    const onAcceptFunction = (0, vue_1.ref)(() => { });
    function togleModal() {
        isOpened.value = !isOpened.value;
    }
    function setOnAcceptFunction(func) {
        onAcceptFunction.value = func;
    }
    function setModalContent(content) {
        modalContent.value = content;
    }
    function resetmodalState() {
        isOpened.value = false;
        modalContent.value = {
            title: 'title',
            content: 'content',
            acceptText: 'acceptText',
            cancelText: 'cancelText',
        };
        setOnAcceptFunction(() => { });
    }
    return { isOpened, setModalContent, togleModal, modalContent, setOnAcceptFunction, onAcceptFunction, resetmodalState };
});
