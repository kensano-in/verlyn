import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const caseId = formData.get('case_id') as string;

    if (!file || !caseId) {
      return NextResponse.json({ error: 'Missing file or case_id' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Ensure bucket exists (safe check)
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      if (!buckets?.find(b => b.name === 'support_attachments')) {
        await supabase.storage.createBucket('support_attachments', { public: true });
      }
    } catch (e) {
      console.error('[Upload API] Bucket Init Error:', e);
    }
    const fileExt = file.name.split('.').pop();
    const fileName = `${caseId}/${nanoid()}.${fileExt}`;
    const filePath = `support/${fileName}`;

    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from('support_attachments')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadErr) {
      // If bucket doesn't exist, we might get an error.
      return NextResponse.json({ error: `Upload failed: ${uploadErr.message}` }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from('support_attachments')
      .getPublicUrl(filePath);

    return NextResponse.json({ 
      url: urlData.publicUrl,
      name: file.name,
      size: file.size,
      type: file.type
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
