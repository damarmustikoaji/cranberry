import { neon } from "@neondatabase/serverless";

export interface ErrorGroup {
  fingerprint: string;
  message: string;
  stack: string | null;
  path: string | null;
  release: string | null;
  occurrences: number;
  first_seen: string;
  last_seen: string;
}

/**
 * Reads error_events written by the app. Expected table (created by the app repo's migration):
 *   error_events(id bigserial, fingerprint text, message text, stack text, path text,
 *                release text, user_agent text, created_at timestamptz default now())
 */
export async function recentErrorGroups(databaseUrl: string, sinceMinutes: number): Promise<ErrorGroup[]> {
  const sql = neon(databaseUrl);
  const rows = await sql`
    select fingerprint,
           (array_agg(message order by created_at desc))[1] as message,
           (array_agg(stack   order by created_at desc))[1] as stack,
           (array_agg(path    order by created_at desc))[1] as path,
           (array_agg(release order by created_at desc))[1] as release,
           count(*)::int as occurrences,
           min(created_at)::text as first_seen,
           max(created_at)::text as last_seen
      from error_events
     where created_at > now() - make_interval(mins => ${sinceMinutes})
     group by fingerprint
     order by occurrences desc
     limit 20`;
  return rows as ErrorGroup[];
}
