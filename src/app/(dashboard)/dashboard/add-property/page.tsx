'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import PaymentModal from '@/components/payment/PaymentModal';
import MapPickerClient from '@/components/map/MapPickerClient';
import ImageUploader from '@/components/property/ImageUploader';
import { createClient } from '@/lib/supabase/client';
import type { PropertyType, PaymentPeriod, ListingType } from '@/types';
import { DISTRICTS, LISTING_FEE, MIN_IMAGES } from '@/lib/constants';
import { checkTrialStatus } from '@/lib/supabase/trial';
import { sanitizeText, isValidUgandaCoords } from '@/lib/security';

const STEPS = ['Basic Info', 'Location', 'Photos', 'Pricing'];

function AddPropertyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditing = !!editId;

  const { user, profile } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingProperty, setLoadingProperty] = useState(isEditing);
  const [error, setError] = useState<string | null>(null);
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    property_type: 'apartment' as PropertyType,
    listing_type: 'landlord' as ListingType,
    bedrooms: 1,
    bathrooms: 1,
    district: 'Kampala',
    area_name: '',
    latitude: 0.3476,
    longitude: 32.5899,
    price_ugx: 0,
    payment_period: 'monthly' as PaymentPeriod,
  });

  const [images, setImages] = useState<File[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    if (!editId || !user) return;
    async function loadProperty() {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', editId)
        .eq('landlord_id', user!.id)
        .single();
      if (fetchError || !data) {
        setError('Property not found or access denied');
        setLoadingProperty(false);
        return;
      }
      setForm({
        title: data.title,
        description: data.description ?? '',
        property_type: data.property_type,
        listing_type: data.listing_type,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        district: data.district,
        area_name: data.area_name,
        latitude: data.latitude,
        longitude: data.longitude,
        price_ugx: data.price_ugx,
        payment_period: data.payment_period,
      });
      setLoadingProperty(false);
    }
    loadProperty();
  }, [editId, user]);

  function nextStep(validate: () => boolean) {
    setError(null);
    if (validate()) setStep((s) => s + 1);
  }

  function validateStep1() {
    if (!form.title.trim()) { setError('Title is required'); return false; }
    return true;
  }

  function validateStep2() {
    if (!form.area_name.trim()) { setError('Area / neighbourhood is required'); return false; }
    if (form.latitude === 0 || form.longitude === 0) { setError('Please set a location on the map'); return false; }
    if (!isValidUgandaCoords(form.latitude, form.longitude)) {
      setError('Location must be within Uganda. Please pin your property on the map.');
      return false;
    }
    return true;
  }

  function validateStep3() {
    if (!isEditing && images.length < MIN_IMAGES) {
      setImageError(`Please upload at least ${MIN_IMAGES} images (you have ${images.length})`);
      return false;
    }
    setImageError(null);
    return true;
  }

  async function uploadImages(propertyId: string, userId: string): Promise<string[]> {
    const supabase = createClient();
    const urls: string[] = [];

    for (const file of images) {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      // Cryptographically random filename — prevents enumeration and path traversal
      const path = `${userId}/${propertyId}/${crypto.randomUUID()}.${ext}`;
      const { data, error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(path, file, { upsert: true });

      if (uploadError) {
        console.warn('Image upload failed:', uploadError.message);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(data.path);

      urls.push(publicUrl);
    }

    return urls;
  }

  const trial = checkTrialStatus(profile?.trial_end_date);

  async function submitProperty() {
    if (!user) return;
    if (form.price_ugx <= 0) { setError('Price must be greater than 0'); return; }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Sanitize all user-supplied text before touching the database
      const sanitizedForm = {
        ...form,
        title: sanitizeText(form.title, 200),
        description: form.description ? sanitizeText(form.description, 2000) : '',
        area_name: sanitizeText(form.area_name, 100),
      };

      if (isEditing) {
        const { error: updateError } = await supabase
          .from('properties')
          .update({ ...sanitizedForm })
          .eq('id', editId)
          .eq('landlord_id', user.id);

        if (updateError) throw new Error(updateError.message);

        if (images.length > 0) {
          const imageUrls = await uploadImages(editId!, user.id);
          if (imageUrls.length > 0) {
            const imageRows = imageUrls.map((url) => ({
              property_id: editId,
              image_url: url,
              is_primary: false,
            }));
            await supabase.from('property_images').insert(imageRows);
          }
        }

        router.push('/dashboard/properties');
      } else {
        const { data: property, error: propError } = await supabase
          .from('properties')
          .insert({
            ...sanitizedForm,
            landlord_id: user.id,
            is_active: false,
          })
          .select('id')
          .single();

        if (propError) throw new Error(propError.message);

        const imageUrls = await uploadImages(property.id, user.id);
        if (imageUrls.length > 0) {
          const imageRows = imageUrls.map((url, i) => ({
            property_id: property.id,
            image_url: url,
            is_primary: i === 0,
          }));
          await supabase.from('property_images').insert(imageRows);
        }

        if (trial.isOnTrial) {
          const res = await fetch('/api/trial-activate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, type: 'listing', referenceId: property.id }),
          });
          if (!res.ok) throw new Error('Trial activation failed');
          router.push('/dashboard/properties');
        } else {
          setCreatedPropertyId(property.id);
          setShowPayment(true);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save property');
    } finally {
      setLoading(false);
    }
  }

  if (!user || loadingProperty) {
    return <div className="p-8 text-center text-stone-400 dark:text-slate-500">Loading…</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-stone-900 dark:text-white mb-1">
        {isEditing ? 'Edit Property' : 'Add a Property'}
      </h1>
      <p className="text-sm text-stone-500 dark:text-slate-400 mb-6">
        {isEditing
          ? 'Update your property details below'
          : 'List your property and reach thousands of tenants in Uganda'}
      </p>

      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((label, i) => {
          const s = i + 1;
          return (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step > s ? 'bg-green-500 text-white' : step === s ? 'bg-orange-500 text-white' : 'bg-stone-100 dark:bg-slate-700 text-stone-400 dark:text-slate-500'
                }`}>
                  {step > s ? '✓' : s}
                </div>
                <span className="text-[10px] text-stone-400 dark:text-slate-500 mt-0.5 hidden sm:block">{label}</span>
              </div>
              {s < STEPS.length && (
                <div className={`flex-1 h-1 mx-1 rounded transition-colors ${step > s ? 'bg-green-500' : 'bg-stone-100 dark:bg-slate-700'}`} />
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl p-3 text-sm mb-4">
          {error}
        </div>
      )}

      {/* ── Step 1: Basic Info ── */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">Property Title *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-3 border border-stone-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-white dark:bg-slate-700 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-slate-500"
              placeholder="e.g. Modern 2BR Apartment in Kololo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-stone-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm resize-none bg-white dark:bg-slate-700 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-slate-500"
              placeholder="Describe the property — furnishing, amenities, terms…"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">Accommodation Type</label>
              <select
                value={form.property_type}
                onChange={(e) => setForm({ ...form, property_type: e.target.value as PropertyType })}
                className="w-full px-4 py-3 border border-stone-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-white dark:bg-slate-700 text-stone-900 dark:text-white"
              >
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="bedsitter">Bedsitter</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">Listing Type</label>
              <select
                value={form.listing_type}
                onChange={(e) => setForm({ ...form, listing_type: e.target.value as ListingType })}
                className="w-full px-4 py-3 border border-stone-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-white dark:bg-slate-700 text-stone-900 dark:text-white"
              >
                <option value="landlord">Landlord</option>
                <option value="broker">Broker</option>
                <option value="agent">Property Agent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">Bedrooms</label>
              <input
                type="number" min={1}
                value={form.bedrooms}
                onChange={(e) => setForm({ ...form, bedrooms: Number(e.target.value) })}
                className="w-full px-4 py-3 border border-stone-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-white dark:bg-slate-700 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">Bathrooms</label>
              <input
                type="number" min={1}
                value={form.bathrooms}
                onChange={(e) => setForm({ ...form, bathrooms: Number(e.target.value) })}
                className="w-full px-4 py-3 border border-stone-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-white dark:bg-slate-700 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          <button onClick={() => nextStep(validateStep1)} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors">
            Next: Location →
          </button>
        </div>
      )}

      {/* ── Step 2: Location ── */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">District *</label>
              <select
                value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
                className="w-full px-4 py-3 border border-stone-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-white dark:bg-slate-700 text-stone-900 dark:text-white"
              >
                {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">Area / Neighbourhood *</label>
              <input
                value={form.area_name}
                onChange={(e) => setForm({ ...form, area_name: e.target.value })}
                className="w-full px-4 py-3 border border-stone-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-white dark:bg-slate-700 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-slate-500"
                placeholder="e.g. Kololo, Ntinda, Kiwatule"
              />
            </div>
          </div>

          {/* Coordinate inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">Latitude</label>
              <input
                type="number" step="0.00001"
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: Number(e.target.value) })}
                className="w-full px-4 py-3 border border-stone-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-white dark:bg-slate-700 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">Longitude</label>
              <input
                type="number" step="0.00001"
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: Number(e.target.value) })}
                className="w-full px-4 py-3 border border-stone-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-white dark:bg-slate-700 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Interactive map */}
          <MapPickerClient
            latitude={form.latitude}
            longitude={form.longitude}
            onLocationChange={(lat, lng) => setForm({ ...form, latitude: lat, longitude: lng })}
          />

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 border border-stone-200 dark:border-slate-600 text-stone-600 dark:text-slate-300 hover:border-stone-300 dark:hover:border-slate-500 py-3 rounded-xl text-sm font-medium transition-colors">
              ← Back
            </button>
            <button onClick={() => nextStep(validateStep2)} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors">
              Next: Photos →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Images ── */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-sm text-stone-600 dark:text-slate-400">
            {isEditing ? (
              <>Add more photos below. <strong>Existing photos will be kept.</strong></>
            ) : (
              <>Upload <strong>at least {MIN_IMAGES} photos</strong> to give tenants a clear picture.
              The first image will be the cover.</>
            )}
          </p>

          <ImageUploader
            files={images}
            onChange={(f) => { setImages(f); setImageError(null); }}
            error={imageError}
          />

          <div className="flex gap-3 pt-2">
            <button onClick={() => setStep(2)} className="flex-1 border border-stone-200 dark:border-slate-600 text-stone-600 dark:text-slate-300 hover:border-stone-300 dark:hover:border-slate-500 py-3 rounded-xl text-sm font-medium transition-colors">
              ← Back
            </button>
            <button onClick={() => nextStep(validateStep3)} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors">
              Next: Pricing →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Pricing ── */}
      {step === 4 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">Rent Price (UGX) *</label>
            <input
              type="number" min={0}
              value={form.price_ugx || ''}
              onChange={(e) => setForm({ ...form, price_ugx: Number(e.target.value) })}
              className="w-full px-4 py-3 border border-stone-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-white dark:bg-slate-700 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-slate-500"
              placeholder="e.g. 450000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">Payment Period</label>
            <select
              value={form.payment_period}
              onChange={(e) => setForm({ ...form, payment_period: e.target.value as PaymentPeriod })}
              className="w-full px-4 py-3 border border-stone-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-white dark:bg-slate-700 text-stone-900 dark:text-white"
            >
              <option value="monthly">Monthly</option>
              <option value="6_months">Every 6 Months</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {!isEditing && (
            trial.isOnTrial ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🎉</span>
                  <div>
                    <p className="font-semibold text-green-800 dark:text-green-300 text-sm">Free Trial — No Payment Required</p>
                    <p className="text-green-700 dark:text-green-400 text-xs mt-0.5">
                      Your listing will be active until your trial ends on{' '}
                      <strong>{trial.endDate?.toLocaleDateString('en-UG', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💳</span>
                  <div>
                    <p className="font-semibold text-stone-900 dark:text-white text-sm">Listing Fee: UGX 10,000</p>
                    <p className="text-stone-500 dark:text-slate-400 text-xs mt-0.5">
                      Your listing will be active for <strong>3 months</strong> after payment.
                      Reach thousands of tenants across Uganda.
                    </p>
                  </div>
                </div>
              </div>
            )
          )}

          {/* Summary */}
          <div className="bg-stone-50 dark:bg-slate-700/50 rounded-2xl p-4 text-sm space-y-1.5">
            <p className="font-semibold text-stone-700 dark:text-slate-200 mb-2">Listing Summary</p>
            <div className="flex justify-between text-stone-600 dark:text-slate-400">
              <span>Title</span><span className="font-medium truncate max-w-[55%] text-right">{form.title}</span>
            </div>
            <div className="flex justify-between text-stone-600 dark:text-slate-400">
              <span>Type</span><span className="capitalize">{form.property_type} · {form.listing_type}</span>
            </div>
            <div className="flex justify-between text-stone-600 dark:text-slate-400">
              <span>Location</span><span>{form.area_name}, {form.district}</span>
            </div>
            {!isEditing && (
              <div className="flex justify-between text-stone-600 dark:text-slate-400">
                <span>Photos</span><span>{images.length} uploaded</span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(3)} className="flex-1 border border-stone-200 dark:border-slate-600 text-stone-600 dark:text-slate-300 hover:border-stone-300 dark:hover:border-slate-500 py-3 rounded-xl text-sm font-medium transition-colors">
              ← Back
            </button>
            <button
              onClick={submitProperty}
              disabled={loading}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {loading
                ? 'Saving…'
                : isEditing
                  ? 'Save Changes'
                  : trial.isOnTrial
                    ? 'List for Free →'
                    : 'Pay UGX 10,000 & List →'}
            </button>
          </div>
        </div>
      )}

      {createdPropertyId && (
        <PaymentModal
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          onSuccess={() => router.push('/dashboard/properties')}
          amount={LISTING_FEE}
          type="listing"
          referenceId={createdPropertyId}
          userId={user.id}
          phoneNumber={profile?.phone_number ?? ''}
        />
      )}
    </div>
  );
}

export default function AddPropertyPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-stone-400 dark:text-slate-500">Loading…</div>}>
      <AddPropertyForm />
    </Suspense>
  );
}
