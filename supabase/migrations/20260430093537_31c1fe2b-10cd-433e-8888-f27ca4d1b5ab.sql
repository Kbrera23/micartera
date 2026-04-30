-- Normalize and remove duplicate categories per user while preserving expense links
WITH ranked AS (
  SELECT
    id,
    FIRST_VALUE(id) OVER (
      PARTITION BY user_id, lower(regexp_replace(trim(name), '\s+', ' ', 'g'))
      ORDER BY is_default DESC, created_at ASC, id ASC
    ) AS keep_id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, lower(regexp_replace(trim(name), '\s+', ' ', 'g'))
      ORDER BY is_default DESC, created_at ASC, id ASC
    ) AS rn
  FROM public.categories
), duplicates AS (
  SELECT id, keep_id
  FROM ranked
  WHERE rn > 1
)
UPDATE public.expenses e
SET category_id = d.keep_id
FROM duplicates d
WHERE e.category_id = d.id;

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, lower(regexp_replace(trim(name), '\s+', ' ', 'g'))
      ORDER BY is_default DESC, created_at ASC, id ASC
    ) AS rn
  FROM public.categories
)
DELETE FROM public.categories c
USING ranked r
WHERE c.id = r.id
  AND r.rn > 1;

-- Normalize existing names so the interface and future comparisons are consistent
UPDATE public.categories
SET name = regexp_replace(trim(name), '\s+', ' ', 'g')
WHERE name <> regexp_replace(trim(name), '\s+', ' ', 'g');

-- Prevent duplicate category names per user, ignoring case and extra spacing
CREATE UNIQUE INDEX IF NOT EXISTS categories_user_normalized_name_unique
ON public.categories (user_id, lower(regexp_replace(trim(name), '\s+', ' ', 'g')));