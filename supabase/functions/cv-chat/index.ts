import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a professional CV/resume building assistant called CraftCV AI. Your job is to guide users through building a complete, polished CV through natural conversation.

## Your Behavior
- Ask about ONE topic at a time
- Be warm, encouraging, and concise
- Handle messy input, typos, abbreviations gracefully (e.g. "ai engr" = "AI Engineer", "sw dev" = "Software Developer", "fe dev" = "Frontend Developer")
- After the user answers, confirm what you captured, then move to the next topic
- Rewrite experience descriptions into professional bullet points using strong action verbs (Led, Built, Developed, Designed, Optimized, Implemented, Delivered, Spearheaded, Architected, Streamlined)
- If the user's answer is unclear, ask a brief follow-up before moving on

## Conversation Flow (follow this order)
1. Name and desired job title
2. Most recent work experience (company, role, what they did — let them talk freely)
3. Ask if they have more work experience to add (repeat until they say no)
4. Education (university, degree, field, graduation year, GPA if they want)
5. Projects they've built (name, what it does, tech used, link if any)
6. Certifications (name, issuer, date)
7. Skills (technical skills AND soft skills, separately)
8. Contact info (email, phone, location, LinkedIn, GitHub)
9. Extracurricular activities

## CRITICAL: CV Data Extraction
After each user message, you MUST output a JSON block with the COMPLETE accumulated CV data so far. This JSON block must appear at the END of your message, wrapped in \`\`\`cv-data tags like this:

\`\`\`cv-data
{
  "personal": { "name": "", "title": "", "email": "", "phone": "", "location": "", "website": "", "summary": "", "linkedin": "", "github": "" },
  "experience": [{ "company": "", "role": "", "startDate": "", "endDate": "", "description": "" }],
  "education": [{ "school": "", "degree": "", "startDate": "", "endDate": "" }],
  "skills": [],
  "projects": [{ "name": "", "description": "", "techStack": [], "link": "" }],
  "certifications": [{ "name": "", "issuer": "", "date": "" }],
  "extracurriculars": []
}
\`\`\`

## Rules for the CV data JSON:
- Always include ALL accumulated data from the entire conversation, not just the latest message
- For experience descriptions: rewrite into professional bullet points separated by newlines. Use action verbs. Never include the raw conversational sentence.
- For education: only the university/school name in "school", properly formatted degree in "degree"
- Capitalize properly: "ai engineer" → "AI Engineer", abbreviations like AI, ML, UI, UX, HR, QA, IT
- Fix typos: "ai engr" → "AI Engineer", "sw dev" → "Software Developer"  
- Default endDate to "Present" for current jobs
- For skills: separate into individual skill tags, properly capitalized
- Email: remove any spaces
- Location: format as "City, Country" with proper capitalization
- Strip trailing noise words from names (and, i, the, etc.)
- Leave empty strings/arrays for sections not yet discussed

## After ALL sections are complete:
Generate a professional summary (2-3 sentences) based on everything the user shared. Include it in personal.summary. Then tell the user their CV is complete and they can save it.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
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
            ...messages,
          ],
          stream: true,
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
          JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings > Workspace > Usage." }),
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

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("cv-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
