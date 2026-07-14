ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS stock_by_color JSONB DEFAULT '[]'::jsonb;

-- Storage setup for vehicle images
insert into storage.buckets (id, name, public)
values ('vehicle-images', 'vehicle-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Staff upload vehicle images" on storage.objects;
drop policy if exists "Staff delete vehicle images" on storage.objects;
drop policy if exists "Public read vehicle images" on storage.objects;

create policy "Staff upload vehicle images" on storage.objects for insert to authenticated
with check (bucket_id = 'vehicle-images');

create policy "Staff delete vehicle images" on storage.objects for delete to authenticated
using (bucket_id = 'vehicle-images');

create policy "Public read vehicle images" on storage.objects for select to public
using (bucket_id = 'vehicle-images');
