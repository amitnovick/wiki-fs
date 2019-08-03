import React from 'react';
import FileImportModal from './FileImportModal/FileImportModal';
import { useMachine } from '@xstate/react';
import machine from './machine';
import ReactContext from './ReactContext';
import { assign } from 'xstate';
import store from '../../redux/store';
import copyFile from '../../utils/copyFile';
import queryInsertFile from '../../query-functions/queryInsertFile';
import deleteFile from '../../utils/deleteFile';
const path = require('path');

const getUserFilesSubdirPath = (store) =>
  store && store.startupScreen ? store.startupScreen.userFilesSubdirFilesPath : null;

const attemptToCopyFiles = async (filesPaths) => {
  const userFilesSubdirPath = getUserFilesSubdirPath(store.getState());
  if (userFilesSubdirPath === null) {
    // Handling error where global value is not available
    return filesPaths.reduce((aggregateCopyingOutcomes, filePath) => {
      return {
        ...aggregateCopyingOutcomes,
        [filePath]: false,
      };
    });
  } else {
    let filesCopyingOutcomes = {};
    for (let i = 0; i < filesPaths.length; i++) {
      const sourceFilePath = filesPaths[i];
      const sourceFileBasePath = path.basename(sourceFilePath);
      const destinationFilePath = path.join(userFilesSubdirPath, sourceFileBasePath);
      try {
        await copyFile(sourceFilePath, destinationFilePath);
        filesCopyingOutcomes[sourceFilePath] = true;
      } catch (error) {
        filesCopyingOutcomes[sourceFilePath] = false;
      }
    }
    return filesCopyingOutcomes;
  }
};

const addFilesToDb = async (filesPaths) => {
  let filesPathAdditionOutcomes = {};
  for (let i = 0; i < filesPaths.length; i++) {
    const filePath = filesPaths[i];
    const fileBasename = path.basename(filePath);
    try {
      await queryInsertFile(fileBasename);
      filesPathAdditionOutcomes[filePath] = true;
    } catch (error) {
      filesPathAdditionOutcomes[filePath] = false;
    }
  }
  return filesPathAdditionOutcomes;
};

const removeCopiedFilesThatAlreadyExistInDb = async (filesPaths) => {
  const filesPathsBasenames = filesPaths.map((filePath) => path.basename(filePath));
  for (let i = 0; i < filesPathsBasenames.length; i++) {
    const filePathBasename = filesPathsBasenames[i];
    try {
      await deleteFile(filePathBasename);
    } catch (error) {
      console.log('Error while removing copied file that already exists in db:', filePathBasename);
    }
  }
};

const attemptToImportFiles = async (filesPaths) => {
  const filesPathsCopyingOnFsOutcomes = await attemptToCopyFiles(filesPaths);
  const filesPathsCopiedSuccessfully = Object.entries(filesPathsCopyingOnFsOutcomes).reduce(
    (aggregateFilePathsCopiedSucessfully, [filePath, didCopySuccessfully]) => {
      return didCopySuccessfully
        ? [...aggregateFilePathsCopiedSucessfully, filePath]
        : aggregateFilePathsCopiedSucessfully;
    },
    [],
  );
  const filePathsAddedToDbOutcome = await addFilesToDb(filesPathsCopiedSuccessfully);
  const copiedFilesThatAlreadyExistInDb = filesPathsCopiedSuccessfully.filter(
    (filePath) => filePathsAddedToDbOutcome[filePath] === false,
  );
  try {
    await removeCopiedFilesThatAlreadyExistInDb(copiedFilesThatAlreadyExistInDb);
  } catch (error) {
    console.log('Error while removing copied files that already exist in db:', error);
  }

  const finalFilesPathsOutcomes = Object.entries(filesPathsCopyingOnFsOutcomes).reduce(
    (aggregateFinalFilesPathsOutcomes, [filePath, didCopySuccessfully]) => {
      return {
        ...aggregateFinalFilesPathsOutcomes,
        [filePath]: didCopySuccessfully && filePathsAddedToDbOutcome[filePath],
      };
    },
    {},
  );
  return finalFilesPathsOutcomes;
};

const machineWithConfig = machine.withConfig({
  services: {
    attemptToImportFiles: (context, __) => attemptToImportFiles(context.filesPaths),
  },
  actions: {
    updateFilesPaths: assign({ filesPaths: (_, event) => event.filesPaths }),
    updateFilePathsAttemptOutcomes: assign({ filePathsAttemptOutcomes: (_, event) => event.data }),
  },
});

const FileImportModalWidget = ({ onClose }) => {
  const [, , service] = useMachine(machineWithConfig, {
    actions: {
      onClose: (_, __) => onClose(),
    },
  });
  return (
    <ReactContext.Provider value={service}>
      <FileImportModal onClose={onClose} />
    </ReactContext.Provider>
  );
};

export default FileImportModalWidget;
