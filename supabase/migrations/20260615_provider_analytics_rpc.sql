-- Aggregate provider analytics in Postgres to avoid full-table transfer to Node
create or replace function get_provider_analytics_summary(p_id uuid)
returns table(event_type text, count bigint)
language sql
security definer
stable
as $$
  select event_type, count(*)::bigint
  from provider_analytics
  where provider_id = p_id
  group by event_type;
$$;

-- Grant to authenticated users; RLS on provider_analytics controls row visibility
grant execute on function get_provider_analytics_summary(uuid) to authenticated;
