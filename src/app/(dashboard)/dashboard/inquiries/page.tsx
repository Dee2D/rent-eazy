import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MessageCircle, Clock } from 'lucide-react';

interface InquiryRow {
  id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  properties: { title: string; district: string } | null;
  profiles: { full_name: string; phone_number: string | null } | null;
}

export default async function InquiriesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await supabase
    .from('inquiries')
    .select('id, message, is_read, created_at, properties(title, district), profiles!inquiries_tenant_id_fkey(full_name, phone_number)')
    .eq('landlord_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  const inquiries = (data ?? []) as unknown as InquiryRow[];

  // Mark all unread as read
  const unreadIds = inquiries.filter((i) => !i.is_read).map((i) => i.id);
  if (unreadIds.length > 0) {
    await supabase.from('inquiries').update({ is_read: true }).in('id', unreadIds);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle size={22} className="text-orange-500" />
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white">Inquiries</h1>
        {unreadIds.length > 0 && (
          <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {unreadIds.length} new
          </span>
        )}
      </div>

      {inquiries.length === 0 ? (
        <div className="text-center py-20 text-stone-400 dark:text-slate-500">
          <MessageCircle size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-medium">No inquiries yet</p>
          <p className="text-sm mt-1">When tenants message you about your listings, they&apos;ll appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {inquiries.map((inquiry) => (
            <div
              key={inquiry.id}
              className={`bg-white dark:bg-slate-800 border rounded-2xl p-5 shadow-sm transition-colors ${
                !inquiry.is_read
                  ? 'border-orange-200 dark:border-orange-700'
                  : 'border-stone-100 dark:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-semibold text-stone-900 dark:text-white text-sm">
                    {inquiry.profiles?.full_name ?? 'Tenant'}
                  </p>
                  <p className="text-xs text-stone-400 dark:text-slate-500 mt-0.5">
                    Re: {inquiry.properties?.title ?? 'Unknown property'} · {inquiry.properties?.district}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-stone-400 dark:text-slate-500 text-xs shrink-0">
                  <Clock size={12} />
                  {new Date(inquiry.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </div>
              </div>

              <p className="text-stone-700 dark:text-slate-300 text-sm leading-relaxed">{inquiry.message}</p>

              {inquiry.profiles?.phone_number && (
                <div className="mt-3 pt-3 border-t border-stone-100 dark:border-slate-700">
                  <a
                    href={`https://wa.me/${inquiry.profiles.phone_number.replace(/\D/g, '')}?text=${encodeURIComponent('Hi, I saw your inquiry on Rent Eazy.')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400 hover:underline"
                  >
                    💬 Reply on WhatsApp
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
