//@ts-check
import { Machine } from 'xstate';

const machine = Machine({
  id: 'search-screen',
  context: {
    searchResultFiles: [],
    chosenAncestorCategory: null,
    inputFileNameText: '',
    selectedFileRow: null,
  },
  type: 'parallel',
  states: {
    processing: {
      id: 'processing',
      initial: 'idle',
      states: {
        idle: {},
        failure: {},
        fetchingSearchResultsBothFilters: {
          invoke: {
            src: 'fetchSearchResultsBothFilters',
            onDone: {
              target: 'idle',
              actions: 'updateSearchResultFiles',
            },
            onError: 'failure',
          },
        },
        fetchingSearchResultsOnlyByNameFilter: {
          invoke: {
            src: 'fetchSearchResultsOnlyByNameFilter',
            onDone: {
              target: 'idle',
              actions: 'updateSearchResultFiles',
            },
            onError: 'failure',
          },
        },
        fetchingSearchResultsOnlyByAncestorCategoryFilter: {
          invoke: {
            src: 'fetchSearchResultsOnlyByAncestorCategoryFilter',
            onDone: {
              target: 'idle',
              actions: 'updateSearchResultFiles',
            },
            onError: 'failure',
          },
        },
      },
      on: {
        FETCH_DATA: [
          {
            cond: (_, __, meta) =>
              meta.state.matches('filtering.filterByName.enabled') &&
              meta.state.matches('filtering.filterByAncestorCategory.enabled'),
            target: '#processing.fetchingSearchResultsBothFilters',
          },
          {
            in: 'filtering.filterByName.enabled',
            target: '#processing.fetchingSearchResultsOnlyByNameFilter',
          },
          {
            in: 'filtering.filterByAncestorCategory.enabled',
            target: '#processing.fetchingSearchResultsOnlyByAncestorCategoryFilter',
          },
        ],
      },
    },
    filtering: {
      type: 'parallel',
      states: {
        filterByName: {
          initial: 'enabled',
          states: {
            enabled: {
              on: {
                TOGGLE_FILTER_BY_NAME: 'disabled',
                CHANGED_TEXT: {
                  actions: 'updateInputFileNameText',
                },
              },
            },
            disabled: {
              on: {
                TOGGLE_FILTER_BY_NAME: 'enabled',
              },
            },
          },
        },
        filterByAncestorCategory: {
          id: 'filter-by-ancestor-category',
          initial: 'disabled',
          states: {
            enabled: {
              on: {
                CHOOSE_ANOTHER_CATEGORY: 'choosing',
              },
            },
            disabled: {
              on: {
                OPENED_CATEGORY_ACCORDION: 'choosing',
              },
            },
            choosing: {
              on: {
                CHOSE_CATEGORY: {
                  actions: 'updateChosenAncestorCategory',
                  target: 'enabled',
                },
              },
            },
          },
          on: {
            CLOSED_CATEGORY_ACCORDION: '#filter-by-ancestor-category.disabled',
          },
        },
      },
    },
  },
  on: {
    SELECT_FILE_ROW: {
      actions: 'updateSelectedFileRow',
    },
  },
});

export default machine;
