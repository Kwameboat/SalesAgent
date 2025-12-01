import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface GenerateContentRequest {
  productId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('===== Content Generation Started =====');

  try {
    // Get auth token
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    console.log('User authentication:', { userId: user?.id, error: userError?.message });
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: ' + (userError?.message || 'No user') }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    let productId: string;
    try {
      const body = await req.json() as GenerateContentRequest;
      productId = body.productId;
      console.log('Product ID from request:', productId);
    } catch (e) {
      console.error('Failed to parse request body:', e);
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!productId) {
      console.error('No product ID provided');
      return new Response(JSON.stringify({ error: 'Product ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch product with seller details
    console.log('Fetching product...');
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        *,
        seller:sellers(*)
      `)
      .eq('id', productId)
      .single();

    if (productError) {
      console.error('Product fetch error:', productError);
      return new Response(JSON.stringify({ error: 'Product not found: ' + productError.message }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!product) {
      console.error('Product not found in database');
      return new Response(JSON.stringify({ error: 'Product does not exist' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Product loaded:', { 
      name: product.product_name, 
      price: product.price,
      seller: product.seller?.shop_name,
      sellerName: product.seller?.name,
      sellerPhone: product.seller?.phone,
      hasImage: !!product.image_url,
      hasLogo: !!product.seller?.logo_url
    });

    // Check OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured in backend' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('OpenAI API key configured');

    // Prepare AI prompt
    const systemMessage = `You are a professional Ghanaian sales and marketing expert specializing in small business promotion across multiple social media platforms. You deeply understand:
- MoMo (Mobile Money) payment culture and trust-building
- Ghanaian English expressions and local communication styles
- Creating urgency without being pushy
- Building customer trust in competitive markets
- Platform-specific content strategies (Facebook, Instagram, WhatsApp, TikTok, YouTube)
- Viral hashtag trends and platform-specific hashtag optimization
- Professional graphic design principles for sales materials
- Understanding buyer psychology in Ghana's urban and peri-urban markets

Your task is to generate compelling, platform-specific sales content.

Generate content with a ${product.seller.preferred_tone} tone for a business in ${product.seller.city}.

CRITICAL: Return ONLY a valid JSON object (no markdown, no code blocks). Use this EXACT structure:

{
  "facebook": {
    "posts": ["detailed engaging post 1 (150-200 words)", "post 2", "post 3"],
    "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"],
    "bestTime": "Best posting time"
  },
  "instagram": {
    "captions": ["detailed caption 1 (100-150 words)", "caption 2", "caption 3"],
    "reels": ["detailed reel script 1", "script 2"],
    "stories": ["story idea 1", "story 2", "story 3"],
    "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5", "#hashtag6", "#hashtag7", "#hashtag8", "#hashtag9", "#hashtag10"],
    "bestTime": "Best posting time"
  },
  "whatsapp": {
    "statusUpdates": ["detailed status 1", "status 2", "status 3"],
    "broadcastMessages": ["detailed broadcast 1 (100+ words)", "broadcast 2"],
    "quickReplies": ["detailed reply 1", "reply 2", "reply 3"],
    "bestTime": "Best posting time"
  },
  "tiktok": {
    "videoScripts": ["detailed script 1 with timestamps", "script 2"],
    "hooks": ["hook 1", "hook 2", "hook 3"],
    "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5", "#hashtag6"],
    "trends": "Current trending sounds/challenges",
    "bestTime": "Best posting time"
  },
  "youtube": {
    "videoIdeas": ["detailed video idea 1", "idea 2", "idea 3"],
    "descriptions": ["SEO-optimized description 1 (200+ words)", "description 2"],
    "thumbnailTips": "Thumbnail design guidance",
    "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"],
    "bestTime": "Best upload time"
  },
  "strategy": "Comprehensive weekly cross-platform strategy (200+ words)",
  "flyerPrompt": "Detailed DALL-E prompt for generating a professional sales flyer image"
}`;

    const userMessage = `Product: ${product.product_name}
Price: GH₵${product.price}
Description: ${product.description || 'No description provided'}
Shop: ${product.seller.shop_name}
City: ${product.seller.city}

Generate DETAILED platform-specific sales content:

1. FACEBOOK:
   - 3 DETAILED engaging posts (150-200 words each) with emojis, storytelling, CTAs, MoMo payment mentions, urgency
   - 5 trending/relevant hashtags
   - Best posting time

2. INSTAGRAM:
   - 3 DETAILED captions (100-150 words) optimized for engagement with emojis and hooks
   - 2 Instagram Reels video scripts (30-45 seconds) with detailed actions, transitions, text overlays
   - 3 Story ideas with interactive elements (polls, questions, countdown)
   - 10 hashtags (mix of trending and niche)
   - Best posting time

3. WHATSAPP:
   - 3 status update texts with emojis and hooks
   - 2 DETAILED broadcast message templates (100+ words) for promotions with full sales pitch
   - 3 quick reply scripts for common customer questions (price, availability, delivery, payment)
   - Best posting time

4. TIKTOK:
   - 2 DETAILED video scripts (30-60 seconds) with timestamps, actions, dialogue, transitions
   - 3 attention-grabbing hooks/openers
   - 6 viral hashtags
   - Current trend ideas to leverage for this product
   - Best posting time

5. YOUTUBE:
   - 3 video title ideas (SEO-optimized, clickbait but honest)
   - 2 DETAILED video descriptions (200+ words) with keywords, timestamps, links, CTAs
   - Thumbnail design tips
   - 5 relevant hashtags
   - Best upload time

6. COMPREHENSIVE cross-platform strategy (200+ words):
   - Weekly content calendar
   - How to repurpose content across platforms
   - Engagement tactics
   - MoMo payment trust-building
   - Customer retention tips

7. FLYER IMAGE GENERATION PROMPT:
   Create a detailed DALL-E prompt for generating a professional, eye-catching sales flyer image (1080x1080px square format for social media) that MUST include:
   - Product name: ${product.product_name}
   - Price: GH₵${product.price}
   - Shop name: ${product.seller.shop_name}
   - Seller contact: ${product.seller.name} - ${product.seller.phone}
   - ${product.seller.logo_url ? 'Incorporate vibrant colors that complement the business logo (use modern African/Ghanaian color palettes - greens, golds, oranges, reds)' : 'Ghana flag colors (green, gold, red) or vibrant African color palette'}
   - Modern, professional design optimized for Instagram, Facebook, WhatsApp
   - Bold, readable typography
   - Eye-catching layout with clear visual hierarchy
   - MoMo payment acceptance message
   - Call-to-action elements
   - Professional but approachable aesthetic
   - Mobile-friendly design (readable on small screens)
   
The prompt should be detailed enough for DALL-E to generate a complete, ready-to-use sales flyer with ALL contact information clearly visible.

MAKE ALL POSTS DETAILED, PERSUASIVE, AND SALES-FOCUSED. Include specific Ghanaian cultural references, MoMo payment mentions, local buyer concerns, and trust-building language.`;

    // Call OpenAI API
    console.log('Calling OpenAI API...');
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.9,
        response_format: { type: "json_object" }
      }),
    });

    console.log('OpenAI response status:', openaiResponse.status);

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', errorText);
      return new Response(JSON.stringify({ error: 'OpenAI API error: ' + errorText }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openaiData = await openaiResponse.json();
    console.log('OpenAI response received successfully');
    
    const contentText = openaiData.choices[0].message.content.trim();
    console.log('Content text length:', contentText.length);
    
    let generatedContent;
    try {
      // Parse the JSON response
      const cleanedContent = contentText.replace(/```json\n?|\n?```/g, '').trim();
      generatedContent = JSON.parse(cleanedContent);
      console.log('Parsed content structure:', Object.keys(generatedContent));
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Content received:', contentText);
      return new Response(JSON.stringify({ error: 'Failed to parse AI response - invalid JSON format' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate generated content structure
    if (!generatedContent.facebook || !generatedContent.instagram || !generatedContent.whatsapp || !generatedContent.tiktok || !generatedContent.youtube) {
      console.error('Invalid content structure:', generatedContent);
      return new Response(JSON.stringify({ error: 'AI response missing required platform fields' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate flyer image with DALL-E FIRST
    console.log('Content text generated, now generating flyer image...');
    let flyerImageUrl: string | null = null;
    
    if (generatedContent.flyerPrompt) {
      try {
        console.log('Calling DALL-E API for flyer generation...');
        const dalleResponse = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: generatedContent.flyerPrompt,
            n: 1,
            size: '1024x1024', // Square format for social media
            quality: 'hd', // High quality for professional look
          }),
        });

        if (dalleResponse.ok) {
          const dalleData = await dalleResponse.json();
          const imageUrl = dalleData.data[0].url;
          console.log('DALL-E image generated:', imageUrl);

          // Download the image
          const imageResponse = await fetch(imageUrl);
          const imageBlob = await imageResponse.blob();

          // Upload to Supabase Storage
          const fileName = `flyers/${productId}/${Date.now()}.png`;
          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(fileName, imageBlob, {
              contentType: 'image/png',
            });

          if (uploadError) {
            console.error('Failed to upload flyer image:', uploadError);
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('product-images')
              .getPublicUrl(fileName);
            
            flyerImageUrl = publicUrl;
            console.log('Flyer image uploaded to storage:', flyerImageUrl);
          }
        } else {
          const errorText = await dalleResponse.text();
          console.error('DALL-E API error:', errorText);
        }
      } catch (dalleError) {
        console.error('Failed to generate flyer image:', dalleError);
        // Continue even if flyer generation fails
      }
    }

    // Save to database WITH flyer image URL
    console.log('Saving content to database with flyer URL:', flyerImageUrl);
    const { data: savedContent, error: saveError } = await supabase
      .from('generated_content')
      .insert({
        product_id: productId,
        seller_id: product.seller_id,
        facebook_content: generatedContent.facebook,
        instagram_content: generatedContent.instagram,
        whatsapp_content: generatedContent.whatsapp,
        tiktok_content: generatedContent.tiktok,
        youtube_content: generatedContent.youtube,
        strategy: generatedContent.strategy,
        posting_hour: generatedContent.facebook.bestTime,
        captions: JSON.stringify(generatedContent.facebook.posts),
        whatsapp_lines: JSON.stringify(generatedContent.whatsapp.statusUpdates),
        dm_replies: JSON.stringify(generatedContent.whatsapp.quickReplies),
        flyer_image_url: flyerImageUrl,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Database save error:', saveError);
      return new Response(JSON.stringify({ error: 'Failed to save content: ' + saveError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Content saved successfully with flyer, ID:', savedContent.id);
    console.log('Flyer image URL in database:', savedContent.flyer_image_url);
    console.log('===== Content Generation Complete =====');

    return new Response(JSON.stringify({ 
      success: true, 
      contentId: savedContent.id,
      flyerImageUrl: flyerImageUrl,
      message: 'Detailed content and flyer image generated successfully' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('===== UNEXPECTED ERROR =====');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(JSON.stringify({ 
      error: 'Server error: ' + error.message,
      type: error.constructor.name
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
