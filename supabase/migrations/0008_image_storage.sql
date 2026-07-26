-- Storage bucket for user-uploaded images (avatars, banners, menu photos).
-- Public read (so images display without auth), but writes are restricted
-- to the owner: files must be uploaded under a path starting with the
-- uploader's own user id, e.g. "avatars/<user_id>/photo.jpg".

insert into storage.buckets (id, name, public)
values ('livebite-images', 'livebite-images', true)
on conflict (id) do nothing;

create policy "public read of livebite images"
  on storage.objects for select
  using (bucket_id = 'livebite-images');

create policy "users can upload into their own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'livebite-images'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "users can update their own uploaded files"
  on storage.objects for update
  using (
    bucket_id = 'livebite-images'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "users can delete their own uploaded files"
  on storage.objects for delete
  using (
    bucket_id = 'livebite-images'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
