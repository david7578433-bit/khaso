-- Kasho chat attachments are visible immediately. Gallery submissions keep
-- their normal admin-approval workflow.

create or replace function public.approve_chat_attachment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.purpose = 'chat' or new.storage_path like 'chat/%' or new.storage_path like 'private/%' then
    new.purpose := 'chat';
    new.status := 'approved';
  end if;
  return new;
end;
$$;

drop trigger if exists approve_chat_attachment_before_insert on public.photo_uploads;
create trigger approve_chat_attachment_before_insert
before insert or update of purpose, storage_path, status on public.photo_uploads
for each row execute function public.approve_chat_attachment();

update public.photo_uploads
set purpose = 'chat', status = 'approved'
where storage_path like 'chat/%' or storage_path like 'private/%';
