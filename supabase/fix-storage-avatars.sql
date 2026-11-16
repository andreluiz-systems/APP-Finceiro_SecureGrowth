-- Correção do Storage das fotos de perfil. Pode rodar mais de uma vez (não dá erro se já existir).
-- Cole no SQL Editor do Supabase e clique em Run.

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "avatars: enviar na propria pasta" on storage.objects;
drop policy if exists "avatars: ver na propria pasta"    on storage.objects;
drop policy if exists "avatars: trocar na propria pasta" on storage.objects;
drop policy if exists "avatars: apagar na propria pasta" on storage.objects;

create policy "avatars: enviar na propria pasta"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars: ver na propria pasta"
  on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars: trocar na propria pasta"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars: apagar na propria pasta"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
