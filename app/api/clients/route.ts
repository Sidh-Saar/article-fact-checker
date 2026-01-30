import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      industry,
      compliance_type,
      compliance_guidelines,
      fact_check_prompt,
      allowed_domains,
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Get user's organization
    const { data: userOrg } = await supabase
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    let orgId = userOrg?.org_id;

    if (!orgId) {
      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({ name: `${user.email}'s Organization` })
        .select()
        .single();

      if (orgError) throw orgError;

      const { error: membershipError } = await supabase
        .from('user_organizations')
        .insert({ user_id: user.id, org_id: newOrg.id, role: 'admin' });

      if (membershipError) throw membershipError;

      orgId = newOrg.id;
    }

    const { data: client, error } = await supabase
      .from('clients')
      .insert({
        org_id: orgId,
        name,
        industry,
        compliance_type: compliance_type || 'none',
        compliance_guidelines,
        fact_check_prompt,
        allowed_domains: allowed_domains || [],
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(client);
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
