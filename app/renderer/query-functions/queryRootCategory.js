import getSqlDriver from '../sqlDriver';

const selectRootCategory = `
SELECT categories.id, categories.name
FROM categories
WHERE categories.parent_id IS NULL
LIMIT 1;
`;

const queryRootCategory = () => {
  return new Promise((resolve, reject) => {
    getSqlDriver().all(selectRootCategory, (err, categoriesRows) => {
      if (err) {
        console.log('err:', err);
        reject();
      } else {
        const rootCategory = categoriesRows[0];
        resolve(rootCategory);
      }
    });
  });
};

export default queryRootCategory;
