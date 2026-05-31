-- Storage RLS for baker photo-auth process shot uploads.
--
-- Path structure: photo-auth/{bakers.id}/{filename}
-- Ownership: bakers.user_id = auth.uid()
--
-- Three policies are required for upsert=true:
--   SELECT  -- storage server reads the existing object to resolve INSERT vs UPDATE conflict
--   INSERT  -- new file upload (WITH CHECK on the incoming row)
--   UPDATE  -- overwrite of an existing file (USING on the existing row, WITH CHECK on the new row)
--
-- Run DROP first so re-applying this file is safe.

DROP POLICY IF EXISTS "baker_photo_auth_select" ON storage.objects;
DROP POLICY IF EXISTS "baker_photo_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "baker_photo_auth_update" ON storage.objects;

-- Allows the storage server to read an existing object when resolving the upsert conflict.
CREATE POLICY "baker_photo_auth_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'baker-photos'
  AND (storage.foldername(name))[1] = 'photo-auth'
  AND (storage.foldername(name))[2] IN (
    SELECT id::text FROM public.bakers WHERE user_id = auth.uid()
  )
);

-- Allows uploading a new process shot.
CREATE POLICY "baker_photo_auth_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'baker-photos'
  AND (storage.foldername(name))[1] = 'photo-auth'
  AND (storage.foldername(name))[2] IN (
    SELECT id::text FROM public.bakers WHERE user_id = auth.uid()
  )
);

-- Allows overwriting an existing process shot (upsert on a fixed filename).
-- USING validates the existing row; WITH CHECK validates the replacement row.
CREATE POLICY "baker_photo_auth_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'baker-photos'
  AND (storage.foldername(name))[1] = 'photo-auth'
  AND (storage.foldername(name))[2] IN (
    SELECT id::text FROM public.bakers WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'baker-photos'
  AND (storage.foldername(name))[1] = 'photo-auth'
  AND (storage.foldername(name))[2] IN (
    SELECT id::text FROM public.bakers WHERE user_id = auth.uid()
  )
);
