-- REVIEW ONLY. Not applied. Run in a staging copy first, then request owner approval.
-- Legacy tables stay RevID-only; no skincare data enters legacy service-role queries.
begin;
create table public.commerce_stores (
 id text primary key, name text not null, currency text not null check(currency='ZAR'),
 launched boolean not null default false, checkout_enabled boolean not null default false,
 shipping_cents integer check(shipping_cents>=0), policies_approved boolean not null default false
);
insert into public.commerce_stores(id,name,currency) values ('revid','RevID','ZAR'),('still-form','Still Form','ZAR');
alter table public.orders add column store_id text not null default 'revid' references public.commerce_stores(id) check(store_id='revid');
alter table public.reviews add column store_id text not null default 'revid' references public.commerce_stores(id) check(store_id='revid');
-- Defaults backfill the existing rows without changing their business values.
create table public.commerce_store_members(store_id text references public.commerce_stores(id),user_id uuid references auth.users(id),primary key(store_id,user_id));
create table public.commerce_products (
 id uuid primary key, store_id text not null references public.commerce_stores(id), slug text not null,
 title text not null, description text not null, collection text not null,
 ingredients text not null, usage text not null, delivery text not null, images jsonb not null,
 published boolean not null default false, demo boolean not null default false,
 unique(store_id,slug), unique(store_id,id)
);
create table public.commerce_variants (
 id uuid primary key, store_id text not null, product_id uuid not null, label text not null, sku text not null,
 size text not null, price_cents integer not null check(price_cents>0), stock integer not null check(stock>=0),
 foreign key(store_id,product_id) references public.commerce_products(store_id,id), unique(store_id,sku),unique(store_id,id)
);
create table public.commerce_orders (
 id uuid primary key default gen_random_uuid(), store_id text not null references public.commerce_stores(id),
 user_id uuid not null references auth.users(id), request_key uuid not null, request_payload jsonb not null,
 customer jsonb not null, items jsonb not null, amount_cents integer not null check(amount_cents>0),
 currency text not null check(currency='ZAR'), status text not null default 'pending' check(status in ('pending','paid','failed','shipped','refunded')),
 checkout_id text unique, redirect_url text, payment_id text unique, paid_at timestamptz, created_at timestamptz not null default now(),
 unique(store_id,user_id,request_key), unique(store_id,id)
);
create index commerce_orders_customer on public.commerce_orders(store_id,user_id,created_at desc);
create table public.commerce_payment_events(provider text not null,event_id text not null,store_id text not null references public.commerce_stores(id),order_id uuid not null,payload jsonb not null,created_at timestamptz default now(),primary key(provider,event_id),foreign key(store_id,order_id) references public.commerce_orders(store_id,id));
create table public.commerce_discounts(id uuid primary key default gen_random_uuid(),store_id text not null references public.commerce_stores(id),code text not null,active boolean default false,configuration jsonb not null,unique(store_id,code));
create table public.commerce_content(store_id text references public.commerce_stores(id),slug text not null,body jsonb not null,primary key(store_id,slug));
-- New data is reachable ONLY through authenticated, store-scoped server endpoints.
-- No anon/authenticated policies: direct REST reads and writes deny all new tables.
do $$ declare t text; begin
 foreach t in array array['commerce_stores','commerce_store_members','commerce_products','commerce_variants','commerce_orders','commerce_payment_events','commerce_discounts','commerce_content'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon, authenticated',t);
  execute format('grant all on public.%I to service_role',t);
 end loop;
end $$;
-- Atomic catalogue update; ownership is checked before entering this RPC.
create function public.commerce_save_product(p_store text,p_product jsonb) returns void
language plpgsql security invoker set search_path=public,pg_temp as $$
declare v jsonb;
begin
 if exists(select 1 from commerce_products where id=(p_product->>'id')::uuid and store_id<>p_store) then raise exception 'Wrong store'; end if;
 insert into commerce_products(id,store_id,slug,title,description,collection,ingredients,usage,delivery,images,published,demo)
 values((p_product->>'id')::uuid,p_store,p_product->>'slug',p_product->>'title',p_product->>'description',p_product->>'collection',p_product->>'ingredients',p_product->>'usage',p_product->>'delivery',p_product->'images',(p_product->>'published')::boolean,(p_product->>'demo')::boolean)
 on conflict(id) do update set slug=excluded.slug,title=excluded.title,description=excluded.description,collection=excluded.collection,ingredients=excluded.ingredients,usage=excluded.usage,delivery=excluded.delivery,images=excluded.images,published=excluded.published,demo=excluded.demo;
 for v in select value from jsonb_array_elements(p_product->'variants') loop
  if exists(select 1 from commerce_variants where id=(v->>'id')::uuid and (store_id<>p_store or product_id<>(p_product->>'id')::uuid)) then raise exception 'Wrong variant store'; end if;
  insert into commerce_variants(id,store_id,product_id,label,sku,size,price_cents,stock)
  values((v->>'id')::uuid,p_store,(p_product->>'id')::uuid,v->>'label',v->>'sku',v->>'size',(v->>'price_cents')::integer,(v->>'stock')::integer)
  on conflict(id) do update set label=excluded.label,sku=excluded.sku,size=excluded.size,price_cents=excluded.price_cents,stock=excluded.stock;
 end loop;
 -- Keep historical variant identities; removed variants become unavailable.
 update commerce_variants set stock=0 where store_id=p_store and product_id=(p_product->>'id')::uuid and id not in (select (value->>'id')::uuid from jsonb_array_elements(p_product->'variants'));
end $$;
-- Inventory is reserved atomically. Never trust browser amounts or product titles.
create function public.commerce_create_order(p_store text,p_user uuid,p_key uuid,p_lines jsonb,p_customer jsonb) returns jsonb
language plpgsql security invoker set search_path=public,pg_temp as $$
declare s commerce_stores; o commerce_orders; r record; q integer; total integer:=0; snapshot jsonb:='[]'; input jsonb;
begin
 input:=jsonb_build_object('lines',p_lines,'customer',p_customer);
 perform pg_advisory_xact_lock(hashtextextended(p_store||p_user::text||p_key::text,0));
 select * into o from commerce_orders where store_id=p_store and user_id=p_user and request_key=p_key;
 if found then
  if o.request_payload<>input then raise exception 'Idempotency key reused with different details'; end if;
  return to_jsonb(o);
 end if;
 select * into s from commerce_stores where id=p_store;
 if not found or not s.launched or not s.checkout_enabled or not s.policies_approved or s.shipping_cents is null then raise exception 'Checkout closed'; end if;
 if jsonb_typeof(p_lines)<>'array' or jsonb_array_length(p_lines)<1 or jsonb_array_length(p_lines)>30 then raise exception 'Invalid cart'; end if;
 -- Aggregate duplicates and lock variants in stable order to prevent overselling/deadlocks.
 for r in select (value->>'variantId')::uuid as vid,sum((value->>'qty')::integer)::integer as qty from jsonb_array_elements(p_lines) group by 1 order by 1 loop
  q:=r.qty;
  if q<1 or q>20 then raise exception 'Invalid quantity'; end if;
  select v.*,p.title,p.published,p.demo into r from commerce_variants v join commerce_products p on p.id=v.product_id and p.store_id=v.store_id where v.id=r.vid and v.store_id=p_store for update of v;
  if not found or not r.published or r.demo or r.stock<q then raise exception 'Product unavailable'; end if;
  total:=total+r.price_cents*q;
  update commerce_variants set stock=stock-q where id=r.id and store_id=p_store;
  snapshot:=snapshot||jsonb_build_array(jsonb_build_object('variantId',r.id,'productId',r.product_id,'title',r.title,'label',r.label,'sku',r.sku,'unitPrice',r.price_cents,'qty',q));
 end loop;
 insert into commerce_orders(store_id,user_id,request_key,request_payload,customer,items,amount_cents,currency)
 values(p_store,p_user,p_key,input,p_customer,snapshot,total+s.shipping_cents,s.currency) returning * into o;
 return to_jsonb(o);
end $$;
-- Signed webhook + exact stored checkout, currency and total. Event/order mutation is one transaction.
create function public.commerce_apply_payment(p_store text,p_event text,p_checkout text,p_payment text,p_amount integer,p_currency text,p_success boolean,p_payload jsonb) returns text
language plpgsql security invoker set search_path=public,pg_temp as $$
declare o commerce_orders; line jsonb;
begin
 select * into o from commerce_orders where store_id=p_store and checkout_id=p_checkout for update;
 if not found then return 'unmatched'; end if;
 if o.amount_cents<>p_amount or o.currency<>p_currency then raise exception 'Payment mismatch'; end if;
 insert into commerce_payment_events(provider,event_id,store_id,order_id,payload) values('yoco',p_event,p_store,o.id,p_payload) on conflict do nothing;
 if not found then return 'duplicate'; end if;
 if o.status<>'pending' then return 'already-final'; end if;
 if p_success then
  update commerce_orders set status='paid',payment_id=p_payment,paid_at=now() where id=o.id and store_id=p_store;
 else
  update commerce_orders set status='failed' where id=o.id and store_id=p_store;
  for line in select value from jsonb_array_elements(o.items) loop
   update commerce_variants set stock=stock+(line->>'qty')::integer where id=(line->>'variantId')::uuid and store_id=p_store;
  end loop;
 end if;
 return 'processed';
end $$;
revoke all on function public.commerce_save_product(text,jsonb) from public,anon,authenticated;
revoke all on function public.commerce_create_order(text,uuid,uuid,jsonb,jsonb) from public,anon,authenticated;
revoke all on function public.commerce_apply_payment(text,text,text,text,integer,text,boolean,jsonb) from public,anon,authenticated;
grant execute on function public.commerce_save_product(text,jsonb) to service_role;
grant execute on function public.commerce_create_order(text,uuid,uuid,jsonb,jsonb) to service_role;
grant execute on function public.commerce_apply_payment(text,text,text,text,integer,text,boolean,jsonb) to service_role;
-- Catalogue imagery uses a NEW public bucket. No browser write policies.
insert into storage.buckets(id,name,public) values('commerce-catalog','commerce-catalog',true);
-- Server admin enforces still-form/products/<product UUID>/ paths. No personal uploads here.
commit;
