import { auth } from '@/auth';

export const GET = auth(async (req) => {
  if (!req.auth?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const slug = process.env.VERCEL_INTEGRATION_SLUG || 'trigdit';
  const vercelAuthUrl = `https://vercel.com/integrations/${slug}/new`;

  console.log('Redirecting to Vercel Integration URL:', vercelAuthUrl);

  return Response.redirect(vercelAuthUrl);
});
