import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { checkRateLimit, getClientIp, ALLOWED_IMAGE_TYPES, ALLOWED_IMAGE_EXTENSIONS, MAX_IMAGE_SIZE_BYTES } from '@/lib/security';

const BUCKET = 'property-images';
// Allowed MIME types as a Set for O(1) lookup
const ALLOWED_MIME_SET = new Set<string>(ALLOWED_IMAGE_TYPES);
// Max images per request batch
const MAX_BATCH = 20;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);

  // Rate limit: 60 signed URLs per IP per 10 minutes (20 images × 3 properties)
  const rl = checkRateLimit(`upload:sign:${ip}`, 60, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many upload requests.' }, { status: 429 });
  }

  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const files = body.files;
  if (!Array.isArray(files) || files.length === 0 || files.length > MAX_BATCH) {
    return NextResponse.json({ error: `Provide 1–${MAX_BATCH} files.` }, { status: 400 });
  }

  // Validate each file descriptor before issuing any signed URLs
  const validated: Array<{ name: string; mime: string; size: number }> = [];
  for (const f of files) {
    if (typeof f !== 'object' || !f) {
      return NextResponse.json({ error: 'Invalid file descriptor.' }, { status: 400 });
    }
    const { name, mime, size } = f as { name: unknown; mime: unknown; size: unknown };

    if (typeof name !== 'string' || typeof mime !== 'string' || typeof size !== 'number') {
      return NextResponse.json({ error: 'Each file must have name (string), mime (string), size (number).' }, { status: 400 });
    }

    // MIME type check
    if (!ALLOWED_MIME_SET.has(mime)) {
      return NextResponse.json(
        { error: `File type "${mime}" is not allowed. Only JPG, PNG, and WebP images are accepted.` },
        { status: 400 }
      );
    }

    // Extension check (prevents rename attacks via Content-Type spoofing)
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_IMAGE_EXTENSIONS.includes(`.${ext}`)) {
      return NextResponse.json(
        { error: `File extension ".${ext}" is not allowed.` },
        { status: 400 }
      );
    }

    // Size check
    if (size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File "${name}" exceeds the 5 MB limit.` },
        { status: 400 }
      );
    }

    validated.push({ name, mime, size });
  }

  // Generate signed upload URLs — one per validated file
  const supabase = await createServiceRoleClient();
  const results: Array<{ signedUrl: string; path: string; token: string }> = [];

  for (const file of validated) {
    const ext      = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const filename = `${crypto.randomUUID()}.${ext}`;
    // Files are scoped to the user's own folder: {userId}/{filename}
    const path     = `${user.id}/${filename}`;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);

    if (error || !data) {
      return NextResponse.json({ error: 'Failed to generate upload URL.' }, { status: 500 });
    }

    results.push({ signedUrl: data.signedUrl, path, token: data.token });
  }

  return NextResponse.json({ success: true, uploads: results });
}
