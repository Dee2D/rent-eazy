'use client';

import { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import PaymentModal from '@/components/payment/PaymentModal';
import { createClient } from '@/lib/supabase/client';
import type { ServiceProvider, ServiceCategory, Subscription, ProviderAnalyticsSummary, AvailabilityStatus } from '@/types';
import { DISTRICTS, SUBSCRIPTION_FEE } from '@/lib/constants';
import { checkTrialStatus } from '@/lib/supabase/trial';
import { sanitizeText, isValidUgandaCoords, validateImageFile } from '@/lib/security';
import AvailabilityBadge from '@/components/provider/AvailabilityBadge';

interface Props {
  userId: string;
  phoneNumber: string;
  existingProvider: ServiceProvider | null;
  categories: ServiceCategory[];
  subscription: Subscription | null;
  trialEndDate: string | null;
  analytics: ProviderAnalyticsSummary | null;
}

// ── Creation form (no provider yet) ───────────────────────────────────────────

function CreateProviderForm({
  userId,
  categories,
  trial,
  onCreated,
  onShowPayment,
}: {
  userId: string;
  categories: ServiceCategory[];
  trial: ReturnType<typeof checkTrialStatus>;
  onCreated: (p: ServiceProvider) => void;
  onShowPayment: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [form, setForm]       = useState({
    category_id: categories[0]?.id ?? '',
    description: '',
    district: '',
    area_name: '',
    latitude: 0.3476,
    longitude: 32.5899,
  });

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      if (!form.district) { setError('Please select a district.'); return; }
      if (!form.area_name.trim()) { setError('Please enter your area or neighbourhood.'); return; }
      if (!isValidUgandaCoords(form.latitude, form.longitude)) {
        setError('Location must be within Uganda. Please enter valid coordinates.');
        return;
      }
      const supabase = createClient();
      const { data, error: dbErr } = await supabase
        .from('service_providers')
        .insert({
          ...form,
          description: sanitizeText(form.description, 2000),
          area_name:   sanitizeText(form.area_name, 100),
          profile_id:  userId,
          is_visible:  false,
        })
        .select('*, service_categories(name), profiles(full_name, phone_number, phone_verified)')
        .single();

      if (dbErr) throw new Error(dbErr.message);
      const newProvider = data as ServiceProvider;
      onCreated(newProvider);

      if (trial.isOnTrial) {
        const res = await fetch('/api/trial-activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, type: 'subscription', referenceId: newProvider.id }),
        });
        if (!res.ok) throw new Error('Trial activation failed');
        window.location.reload();
      } else {
        onShowPayment();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-stone-500 dark:text-slate-400 text-sm">
        Create your service provider profile and subscribe to appear on the map.
      </p>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl p-3 text-sm">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">Service Category</label>
        <select
          value={form.category_id}
          onChange={(e) => setForm({ ...form, category_id: e.target.value })}
          className="w-full px-4 py-3 border border-stone-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-white dark:bg-slate-700 text-stone-900 dark:text-white"
        >
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 border border-stone-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm resize-none bg-white dark:bg-slate-700 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-slate-500"
          placeholder="Describe your services and experience…"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">District</label>
        <select
          value={form.district}
          onChange={(e) => setForm({ ...form, district: e.target.value, area_name: '' })}
          className="w-full px-4 py-3 border border-stone-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-white dark:bg-slate-700 text-stone-900 dark:text-white"
        >
          <option value="">Select district…</option>
          {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">Area / Neighbourhood</label>
        <input
          type="text"
          value={form.area_name}
          onChange={(e) => setForm({ ...form, area_name: e.target.value })}
          disabled={!form.district}
          placeholder={form.district ? 'e.g. Ntinda, Kiwatule, Najjera' : 'Select a district first'}
          className="w-full px-4 py-3 border border-stone-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-white dark:bg-slate-700 text-stone-900 dark:text-white placeholder:text-stone-400 disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">Latitude</label>
          <input
            type="number" step="0.0001" value={form.latitude}
            onChange={(e) => setForm({ ...form, latitude: Number(e.target.value) })}
            className="w-full px-4 py-3 border border-stone-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-white dark:bg-slate-700 text-stone-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">Longitude</label>
          <input
            type="number" step="0.0001" value={form.longitude}
            onChange={(e) => setForm({ ...form, longitude: Number(e.target.value) })}
            className="w-full px-4 py-3 border border-stone-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-white dark:bg-slate-700 text-stone-900 dark:text-white"
          />
        </div>
      </div>

      {trial.isOnTrial ? (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 text-sm">
          <p className="font-semibold text-green-800 dark:text-green-300 mb-1">Free Trial Active</p>
          <p className="text-green-700 dark:text-green-400">Your profile will appear on the map for free until your trial ends.</p>
        </div>
      ) : (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 text-sm">
          <p className="font-semibold text-stone-900 dark:text-white mb-1">Subscription Fee</p>
          <p className="text-stone-600 dark:text-slate-400">Pay UGX {SUBSCRIPTION_FEE.toLocaleString('en-UG')} to appear on the map for 30 days.</p>
        </div>
      )}

      <button
        onClick={submit}
        disabled={loading}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {loading ? 'Creating…' : trial.isOnTrial ? 'Create Profile (Free Trial)' : 'Create Profile & Subscribe'}
      </button>
    </div>
  );
}

// ── Tag / location editor ──────────────────────────────────────────────────────

function TagEditor({
  label,
  placeholder,
  tags,
  onChange,
  max,
}: {
  label: string;
  placeholder: string;
  tags: string[];
  onChange: (t: string[]) => void;
  max: number;
}) {
  const [input, setInput] = useState('');

  function add() {
    const val = input.trim();
    if (!val || tags.includes(val) || tags.length >= max) return;
    onChange([...tags, val]);
    setInput('');
  }

  return (
    <div>
      <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-2">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 text-xs font-medium px-3 py-1.5 rounded-xl border border-orange-200 dark:border-orange-800">
            {t}
            <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} aria-label={`Remove ${t}`} className="text-orange-400 hover:text-orange-600">×</button>
          </span>
        ))}
        {tags.length === 0 && <span className="text-sm text-stone-400 dark:text-slate-500">None added</span>}
      </div>
      {tags.length < max && (
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 border border-stone-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white dark:bg-slate-700 text-stone-900 dark:text-white placeholder:text-stone-400"
          />
          <button
            type="button"
            onClick={add}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main edit panel ────────────────────────────────────────────────────────────

function EditProfilePanel({
  provider,
  userId,
  categories,
  onSaved,
}: {
  provider: ServiceProvider;
  userId: string;
  categories: ServiceCategory[];
  onSaved: (p: ServiceProvider) => void;
}) {
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    headline:              provider.headline ?? '',
    provider_bio:          provider.provider_bio ?? '',
    description:           provider.description ?? '',
    category_id:           provider.category_id,
    district:              provider.district,
    area_name:             provider.area_name,
    latitude:              provider.latitude,
    longitude:             provider.longitude,
    availability_status:   provider.availability_status,
    years_active:          provider.years_active ?? '',
    response_time_hours:   provider.response_time_hours,
    seo_title:             provider.seo_title ?? '',
    seo_description:       provider.seo_description ?? '',
    service_tags:          provider.service_tags,
    service_locations:     provider.service_locations,
    gallery_images:        provider.gallery_images,
    profile_image:         provider.profile_image ?? '',
  });

  async function uploadFile(file: File, bucket: string, prefix: string): Promise<string | null> {
    const validErr = validateImageFile(file);
    if (validErr) { setError(validErr); return null; }
    const ext  = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `${prefix}/${crypto.randomUUID()}.${ext}`;
    const supabase = createClient();
    const { data, error: uploadErr } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (uploadErr) { setError(`Upload failed: ${uploadErr.message}`); return null; }
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return publicUrl;
  }

  async function handleProfileImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const url = await uploadFile(file, 'provider-images', `${userId}/${provider.id}/profile`);
    setUploading(false);
    if (url) setForm((f) => ({ ...f, profile_image: url }));
    e.target.value = '';
  }

  async function handleGalleryAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 10 - form.gallery_images.length);
    if (!files.length) return;
    setUploading(true);
    setError(null);
    const urls: string[] = [];
    for (const file of files) {
      const url = await uploadFile(file, 'provider-images', `${userId}/${provider.id}/gallery`);
      if (url) urls.push(url);
    }
    setUploading(false);
    setForm((f) => ({ ...f, gallery_images: [...f.gallery_images, ...urls] }));
    e.target.value = '';
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSuccess(false);

    if (!isValidUgandaCoords(form.latitude, form.longitude)) {
      setError('Coordinates must be within Uganda.');
      setSaving(false);
      return;
    }

    const res = await fetch('/api/provider/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerId: provider.id,
        ...form,
        years_active:        form.years_active === '' ? null : Number(form.years_active),
        response_time_hours: Number(form.response_time_hours),
      }),
    });

    const json = await res.json() as { provider?: ServiceProvider; error?: string };
    setSaving(false);

    if (!res.ok || !json.provider) {
      setError(json.error ?? 'Failed to save profile.');
      return;
    }

    setSuccess(true);
    onSaved(json.provider);
    setTimeout(() => setSuccess(false), 3000);
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl p-3 text-sm">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-xl p-3 text-sm">Profile saved successfully.</div>
      )}

      {/* Profile Image */}
      <div className="bg-white dark:bg-slate-800 border border-stone-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
        <h3 className="font-semibold text-stone-900 dark:text-white mb-4">Profile Image</h3>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-stone-100 dark:bg-slate-700 overflow-hidden flex items-center justify-center shrink-0">
            {form.profile_image ? (
              <Image src={form.profile_image} alt="Profile" width={80} height={80} className="object-cover w-full h-full" />
            ) : (
              <span className="text-3xl">👤</span>
            )}
          </div>
          <div>
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-stone-100 dark:bg-slate-700 hover:bg-stone-200 dark:hover:bg-slate-600 text-stone-700 dark:text-slate-200 text-sm font-medium rounded-xl transition-colors">
              {uploading ? 'Uploading…' : 'Upload Photo'}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleProfileImageChange} disabled={uploading} />
            </label>
            <p className="text-xs text-stone-400 dark:text-slate-500 mt-1.5">JPG, PNG or WebP · Max 5 MB</p>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-white dark:bg-slate-800 border border-stone-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="font-semibold text-stone-900 dark:text-white">Basic Info</h3>

        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">Category</label>
          <select
            value={form.category_id}
            onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
            className="w-full px-4 py-3 border border-stone-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-white dark:bg-slate-700 text-stone-900 dark:text-white"
          >
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">Headline <span className="text-stone-400 font-normal">(120 chars)</span></label>
          <input
            type="text" maxLength={120}
            value={form.headline}
            onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
            placeholder="e.g. Certified Plumber with 8 years experience in Kampala"
            className="w-full px-4 py-3 border border-stone-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-white dark:bg-slate-700 text-stone-900 dark:text-white placeholder:text-stone-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">Bio <span className="text-stone-400 font-normal">(shown on profile)</span></label>
          <textarea
            value={form.provider_bio}
            onChange={(e) => setForm((f) => ({ ...f, provider_bio: e.target.value }))}
            rows={4} maxLength={1000}
            placeholder="Tell clients about yourself, your qualifications, and what makes you stand out…"
            className="w-full px-4 py-3 border border-stone-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm resize-none bg-white dark:bg-slate-700 text-stone-900 dark:text-white placeholder:text-stone-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">Short Description <span className="text-stone-400 font-normal">(shown on cards)</span></label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={2} maxLength={2000}
            className="w-full px-4 py-3 border border-stone-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm resize-none bg-white dark:bg-slate-700 text-stone-900 dark:text-white placeholder:text-stone-400"
          />
        </div>
      </div>

      {/* Location */}
      <div className="bg-white dark:bg-slate-800 border border-stone-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="font-semibold text-stone-900 dark:text-white">Location</h3>
        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">District</label>
          <select
            value={form.district}
            onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
            className="w-full px-4 py-3 border border-stone-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-white dark:bg-slate-700 text-stone-900 dark:text-white"
          >
            <option value="">Select district…</option>
            {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">Area / Neighbourhood</label>
          <input
            type="text" value={form.area_name} maxLength={100}
            onChange={(e) => setForm((f) => ({ ...f, area_name: e.target.value }))}
            className="w-full px-4 py-3 border border-stone-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-white dark:bg-slate-700 text-stone-900 dark:text-white"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">Latitude</label>
            <input type="number" step="0.0001" value={form.latitude}
              onChange={(e) => setForm((f) => ({ ...f, latitude: Number(e.target.value) }))}
              className="w-full px-4 py-3 border border-stone-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-white dark:bg-slate-700 text-stone-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">Longitude</label>
            <input type="number" step="0.0001" value={form.longitude}
              onChange={(e) => setForm((f) => ({ ...f, longitude: Number(e.target.value) }))}
              className="w-full px-4 py-3 border border-stone-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-white dark:bg-slate-700 text-stone-900 dark:text-white" />
          </div>
        </div>
      </div>

      {/* Availability & Response */}
      <div className="bg-white dark:bg-slate-800 border border-stone-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="font-semibold text-stone-900 dark:text-white">Availability</h3>
        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-2">Status</label>
          <div className="flex gap-3 flex-wrap">
            {(['available', 'busy', 'offline'] as AvailabilityStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setForm((f) => ({ ...f, availability_status: s }))}
                className={`transition-all ${form.availability_status === s ? 'ring-2 ring-orange-400 ring-offset-2 dark:ring-offset-slate-800' : 'opacity-60'}`}
              >
                <AvailabilityBadge status={s} />
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">Years Active</label>
            <input
              type="number" min={0} max={100}
              value={form.years_active}
              onChange={(e) => setForm((f) => ({ ...f, years_active: e.target.value === '' ? '' : Number(e.target.value) }))}
              placeholder="e.g. 5"
              className="w-full px-4 py-3 border border-stone-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-white dark:bg-slate-700 text-stone-900 dark:text-white placeholder:text-stone-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">Response Time (hrs)</label>
            <input
              type="number" min={1} max={168}
              value={form.response_time_hours}
              onChange={(e) => setForm((f) => ({ ...f, response_time_hours: Number(e.target.value) }))}
              className="w-full px-4 py-3 border border-stone-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-white dark:bg-slate-700 text-stone-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Services & Locations */}
      <div className="bg-white dark:bg-slate-800 border border-stone-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-6">
        <h3 className="font-semibold text-stone-900 dark:text-white">Services & Coverage</h3>
        <TagEditor
          label="Service Tags (max 15)"
          placeholder="e.g. Pipe Repair, Leak Fixing…"
          tags={form.service_tags}
          onChange={(t) => setForm((f) => ({ ...f, service_tags: t }))}
          max={15}
        />
        <TagEditor
          label="Service Locations (max 10)"
          placeholder="e.g. Ntinda, Kiwatule…"
          tags={form.service_locations}
          onChange={(t) => setForm((f) => ({ ...f, service_locations: t }))}
          max={10}
        />
      </div>

      {/* Gallery */}
      <div className="bg-white dark:bg-slate-800 border border-stone-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
        <h3 className="font-semibold text-stone-900 dark:text-white mb-4">Work Gallery <span className="text-stone-400 text-sm font-normal">({form.gallery_images.length}/10)</span></h3>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {form.gallery_images.map((url, i) => (
            <div key={url} className="relative aspect-square rounded-xl overflow-hidden group">
              <Image src={url} alt={`Gallery ${i + 1}`} fill className="object-cover" sizes="33vw" />
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, gallery_images: f.gallery_images.filter((_, j) => j !== i) }))}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 hover:bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove image"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        {form.gallery_images.length < 10 && (
          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-stone-100 dark:bg-slate-700 hover:bg-stone-200 dark:hover:bg-slate-600 text-stone-700 dark:text-slate-200 text-sm font-medium rounded-xl transition-colors">
            {uploading ? 'Uploading…' : '+ Add Photos'}
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleGalleryAdd} disabled={uploading} />
          </label>
        )}
      </div>

      {/* SEO */}
      <div className="bg-white dark:bg-slate-800 border border-stone-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="font-semibold text-stone-900 dark:text-white">SEO <span className="text-xs text-stone-400 font-normal">(optional)</span></h3>
        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">SEO Title</label>
          <input type="text" maxLength={120} value={form.seo_title}
            onChange={(e) => setForm((f) => ({ ...f, seo_title: e.target.value }))}
            placeholder="Auto-generated from your name and category if blank"
            className="w-full px-4 py-3 border border-stone-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-white dark:bg-slate-700 text-stone-900 dark:text-white placeholder:text-stone-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">Meta Description</label>
          <textarea value={form.seo_description} maxLength={200}
            onChange={(e) => setForm((f) => ({ ...f, seo_description: e.target.value }))}
            rows={2}
            placeholder="160–200 chars — used by search engines"
            className="w-full px-4 py-3 border border-stone-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm resize-none bg-white dark:bg-slate-700 text-stone-900 dark:text-white placeholder:text-stone-400" />
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving || uploading}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm"
      >
        {saving ? 'Saving…' : 'Save Profile'}
      </button>
    </div>
  );
}

// ── Analytics card ─────────────────────────────────────────────────────────────

function AnalyticsCard({ analytics }: { analytics: ProviderAnalyticsSummary }) {
  const stats = [
    { label: 'Total Profile Views',   value: analytics.total_views },
    { label: 'WhatsApp Clicks',        value: analytics.whatsapp_clicks },
    { label: 'Call Clicks',            value: analytics.call_clicks },
    { label: 'Views (last 30 days)',   value: analytics.views_last_30d },
    { label: 'Contact Clicks (30d)',   value: analytics.clicks_last_30d },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 border border-stone-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
      <h3 className="font-semibold text-stone-900 dark:text-white mb-4">Profile Analytics</h3>
      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value }) => (
          <div key={label} className="bg-stone-50 dark:bg-slate-700 rounded-xl p-3">
            <p className="text-2xl font-extrabold text-orange-500">{value.toLocaleString()}</p>
            <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

type Tab = 'overview' | 'edit' | 'analytics';

export default function ProviderClient({
  userId,
  phoneNumber,
  existingProvider,
  categories,
  subscription,
  trialEndDate,
  analytics,
}: Props) {
  const [provider, setProvider] = useState<ServiceProvider | null>(existingProvider);
  const [showPayment, setShowPayment] = useState(false);
  const [tab, setTab]           = useState<Tab>('overview');

  const trial = checkTrialStatus(trialEndDate);
  const [now]  = useState(Date.now);

  const daysLeft = useMemo(() => {
    if (!subscription) return 0;
    return Math.max(0, Math.ceil((new Date(subscription.end_date).getTime() - now) / 86400000));
  }, [subscription, now]);

  const handleCreated = useCallback((p: ServiceProvider) => setProvider(p), []);

  if (!provider) {
    return (
      <CreateProviderForm
        userId={userId}
        categories={categories}
        trial={trial}
        onCreated={handleCreated}
        onShowPayment={() => setShowPayment(true)}
      />
    );
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview',  label: 'Overview' },
    { id: 'edit',      label: 'Edit Profile' },
    { id: 'analytics', label: 'Analytics' },
  ];

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex gap-1 bg-stone-100 dark:bg-slate-700 p-1 rounded-2xl">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${
              tab === t.id
                ? 'bg-white dark:bg-slate-800 text-stone-900 dark:text-white shadow-sm'
                : 'text-stone-500 dark:text-slate-400 hover:text-stone-700 dark:hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === 'overview' && (
        <div className="space-y-5">
          {/* Profile summary */}
          <div className="bg-white dark:bg-slate-800 border border-stone-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start gap-4">
              {provider.profile_image ? (
                <Image
                  src={provider.profile_image}
                  alt="Profile"
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-2xl object-cover shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-3xl shrink-0">
                  🔧
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-stone-900 dark:text-white truncate">
                  {provider.service_categories?.name ?? 'Service Provider'}
                </p>
                {provider.headline && (
                  <p className="text-sm text-stone-500 dark:text-slate-400 mt-0.5 line-clamp-2">{provider.headline}</p>
                )}
                <div className="mt-2">
                  <AvailabilityBadge status={provider.availability_status} size="sm" />
                </div>
              </div>
            </div>

            {provider.rating_average > 0 && (
              <div className="mt-3 pt-3 border-t border-stone-100 dark:border-slate-700 flex items-center gap-2">
                <span className="text-orange-500 text-sm font-semibold">★ {provider.rating_average.toFixed(1)}</span>
                <span className="text-stone-400 dark:text-slate-500 text-xs">({provider.review_count} review{provider.review_count !== 1 ? 's' : ''})</span>
              </div>
            )}

            {provider.slug && (
              <a
                href={`/services/provider/${provider.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-orange-500 hover:underline font-medium"
              >
                View public profile ↗
              </a>
            )}
          </div>

          {/* Subscription status */}
          <div className="bg-white dark:bg-slate-800 border border-stone-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-stone-400 dark:text-slate-500 mb-2">Subscription</p>
            {subscription ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="font-semibold text-green-700 dark:text-green-400">Active</span>
                </div>
                <p className="text-sm text-stone-500 dark:text-slate-400">{daysLeft} days remaining</p>
                <p className="text-xs text-stone-400 dark:text-slate-500 mt-0.5">
                  Expires {new Date(subscription.end_date).toLocaleDateString('en-UG')}
                </p>
                <button
                  onClick={() => setShowPayment(true)}
                  className="mt-3 text-sm text-orange-500 hover:underline"
                >
                  Renew Subscription
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-stone-300 dark:bg-slate-600" />
                  <span className="font-semibold text-stone-500 dark:text-slate-400">Inactive</span>
                </div>
                <button
                  onClick={() => setShowPayment(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                >
                  Subscribe — UGX {SUBSCRIPTION_FEE.toLocaleString('en-UG')}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Edit ── */}
      {tab === 'edit' && (
        <EditProfilePanel
          provider={provider}
          userId={userId}
          categories={categories}
          onSaved={(p) => setProvider(p)}
        />
      )}

      {/* ── Analytics ── */}
      {tab === 'analytics' && analytics && <AnalyticsCard analytics={analytics} />}
      {tab === 'analytics' && !analytics && (
        <div className="bg-stone-50 dark:bg-slate-700 rounded-2xl p-8 text-center text-stone-400 dark:text-slate-500 text-sm">
          Analytics data not available.
        </div>
      )}

      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        onSuccess={() => window.location.reload()}
        amount={SUBSCRIPTION_FEE}
        type="subscription"
        referenceId={provider.id}
        userId={userId}
        phoneNumber={phoneNumber}
      />
    </div>
  );
}
