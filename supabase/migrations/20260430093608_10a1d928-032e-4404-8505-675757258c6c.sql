DROP POLICY IF EXISTS "Avatars are publicly viewable" ON storage.objects;

CREATE POLICY "Avatar files are publicly readable by direct path"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'avatars'
  AND array_length(storage.foldername(name), 1) >= 1
);