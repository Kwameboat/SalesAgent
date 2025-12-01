import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get seller data
    const { data: seller } = await supabase
      .from('sellers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!seller) {
      return new Response(JSON.stringify({ error: 'Seller not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get statistics
    const { count: productCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', seller.id);

    const { count: contentCount } = await supabase
      .from('generated_content')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', seller.id);

    // Calculate days since last post
    const daysSincePost = seller.last_posted_at
      ? Math.floor((Date.now() - new Date(seller.last_posted_at).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Call OpenAI for insights
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = `You are a Ghanaian business advisor. Analyze this seller's performance and provide brief, actionable insights:

Shop: ${seller.shop_name}
City: ${seller.city}
Products Added: ${productCount || 0}
Content Sets Generated: ${contentCount || 0}
Days Since Last Post: ${daysSincePost !== null ? daysSincePost : 'Never posted'}

Provide:
1. A brief performance summary (2-3 sentences)
2. One key strength
3. One improvement area
4. One specific action they should take this week

Keep it encouraging, practical, and culturally relevant for a Ghanaian small business owner. Return as JSON:
{
  "summary": "Performance summary text",
  "strength": "Key strength",
  "improvement": "Area to improve",
  "action": "Specific action to take"
}`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      return new Response(JSON.stringify({ error: `OpenAI: ${errorText}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openaiData = await openaiResponse.json();
    const insightsText = openaiData.choices[0].message.content.trim();
    
    let insights;
    try {
      const cleanedContent = insightsText.replace(/```json\n?|\n?```/g, '').trim();
      insights = JSON.parse(cleanedContent);
    } catch {
      insights = {
        summary: 'Keep posting consistently to grow your business!',
        strength: 'You\'re using AI to save time',
        improvement: 'Post more frequently',
        action: 'Create content for one product today'
      };
    }

    return new Response(JSON.stringify({
      stats: {
        productCount: productCount || 0,
        contentCount: contentCount || 0,
        daysSincePost,
        lastPostedAt: seller.last_posted_at,
      },
      insights,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
