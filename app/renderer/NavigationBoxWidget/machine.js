//@ts-check
import { Machine } from 'xstate';

const machine = Machine({
  id: 'navigation-box-widget',
  initial: 'idle',
  states: {
    idle: {
      on: {
        CLICK_ADD_BUTTON: 'fileAdditionModal',
        CLICK_FILE_IMPORT_BUTTON: 'fileImportModal',
      },
    },
    fileAdditionModal: {
      on: {
        CLOSE_FILE_ADDITION_MODAL: 'idle',
        FILE_ADDITION_MODAL_SUBMIT: {
          target: 'idle',
          actions: 'navigateToFileScreen',
        },
      },
    },
    fileImportModal: {
      on: {
        CLOSE_FILE_IMPORT_MODAL: 'idle',
      },
    },
  },
});

export default machine;
