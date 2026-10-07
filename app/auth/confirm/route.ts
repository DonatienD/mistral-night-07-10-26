import { createClient } from '@/lib/supabase/server';
import { type EmailOtpType } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { NextURL } from 'next/dist/server/web/next-url';

export const instant = false;;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const { searchParams } = url;
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/';

  const redirectTo = new URL(next, url);
  redirectTo.pathname = next;
  redirectTo.searchParams.delete('token_hash');
  redirectTo.searchParams.delete('type');

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    });
    if (!error) {
      redirectTo.searchParams.delete('next');
      return NextResponse.redirect(redirectTo);
    }
  }

  // return the user to an error page with a message
  redirectTo.pathname = '/auth/error';
  redirectTo.searchParams.set('error', 'Invalid or expired confirmation link');
  return NextResponse.redirect(redirectTo);
}
