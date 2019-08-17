import getSqlDriver from '../getSqlDriver';

const selectFilesUnderCategory = `
WITH categories_subtree AS (
  WITH RECURSIVE tc( i )  AS (
    SELECT id FROM categories WHERE id = $category_id
    UNION 
    SELECT id from categories, tc
    WHERE categories.parent_id = tc.i
  )
  SELECT categories.id FROM categories WHERE categories.id IN tc
),
  categorized_files AS (
  SELECT categories_files.file_id
  FROM categories_files
  WHERE categories_files.category_id IN categories_subtree
)
SELECT DISTINCT files.id, files.name
FROM files
WHERE files.id IN categorized_files
`;

const queryFilesUnderCategory = (category) => {
  return new Promise((resolve, reject) => {
    getSqlDriver().all(
      selectFilesUnderCategory,
      {
        $category_id: category.id,
      },
      (err, rows) => {
        if (err) {
          console.log('err:', err);
          reject();
        } else {
          resolve(rows);
        }
      },
    );
  });
};

export default queryFilesUnderCategory;
