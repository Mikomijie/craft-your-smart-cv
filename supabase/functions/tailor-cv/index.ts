import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a professional CV tailoring AI. Given a CV (as JSON) and a job description, you must:

1. Analyze how well the CV matches the job description
2. Rewrite experience bullet points to better match the job requirements using strong action verbs
3. Enhance the professional summary to target this specific role
4. Identify matching skills, skills to highlight, and skill gaps
5. Calculate a realistic match score (0-100)
6. Generate a professional cover letter

You MUST respond with a JSON object (no markdown, no code blocks, just raw JSON) with this exact structure:
{
  "matchScore": 78,
  "matchingSkills": ["Python", "React"],
  "highlightSkills": ["Leadership", "Agile"],
  "gapSkills": ["Kubernetes", "AWS"],
  "tailoredCV": { ... the full CV object with rewritten bullets and enhanced summary ... },
  "coverLetter": {
    "professional": "Dear Hiring Manager,...",
    "warm": "Dear Hiring Manager,...",
    "bold": "Dear Hiring Manager,...",
    "concise": "Dear Hiring Manager,..."
  },
  "changes": ["Rewrote 3 experience bullets to emphasize cloud skills", "Added keywords: Docker, CI/CD", "Enhanced summary to target DevOps role"]
}

Rules for the tailored CV:
- Keep the same JSON structure as input CV
- Rewrite experience descriptions into stronger bullet points that match JD keywords
- Enhance summary to specifically target this role
- Do NOT invent fake experience or skills the person doesn't have
- For the cover letter, use the person's actual name (strip trailing words like "and", "i", "the")
- Cover letter should reference specific skills and experience from the CV
- Cover letter should be 3-4 paragraphs, properly formatted with line breaks
- Sign off with "Best regards,\\n[Name]"
- matchScore should be realistic: 90+ only if nearly perfect match, 50-70 for partial matches
- If skills array is empty, infer skills from experience descriptions and job title`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cvData, jobDescription } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `Here is the CV data:\n${JSON.stringify(cvData, null, 2)}\n\nHere is the job description:\n${jobDescription}`,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited — please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";
    
    // Strip markdown code blocks if present
    content = content.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    
    // Validate it's valid JSON
    const parsed = JSON.parse(content);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("tailor-cv error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
