import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    // Check system process environment first
    let apiKey = process.env.GROQ_API || process.env.GROQ_API_KEY || "";
    
    // Dynamic runtime fallback to parse .env.local directly if the server hasn't been restarted
    if (!apiKey) {
      try {
        const envPath = path.join(process.cwd(), ".env.local");
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, "utf-8");
          const match = envContent.match(/^GROQ_API\s*=\s*(.*)$/m);
          if (match && match[1]) {
            apiKey = match[1].trim();
          }
        }
      } catch (err) {
        console.error("Runtime env.local parsing failed: ", err);
      }
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API key is not configured in your .env.local file. Please add GROQ_API=your_key and restart the frontend server." },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: `You are the WorkMesh AI Assistant, a dedicated virtual helper built directly into the WorkMesh HR & Operations platform.

SCOPE OF KNOWLEDGE & CRITICAL RULES:
1. You ONLY answer queries, explain features, and guide users on tasks related to the WorkMesh product, its features, workflows, and company HR guidelines.
2. The core features of WorkMesh include:
   - **Dashboard**: Central console showing active shift check-ins, punch clocks, and quick stats.
   - **Attendance Log (Daily Shift Records)**: Registering daily hours, viewing punch logs, check-in/out, and requesting regularizations for missed logs.
   - **Time-Off Ledger (Leave)**: Viewing leave balances (Casual, Sick, Privilege) and submitting leave requests.
   - **Compensation Sheet (Payroll)**: View monthly salary summaries, status, and download secure print-ready PDF payslips.
   - **Corporate Directory (Departments)**: Company org structures, departments, and manager information.
   - **Employee Profile**: Personal contact data, joining date, and configurations.
3. If the user asks ANY question, request, or coding task that is OUTSIDE of the WorkMesh product or HR/Portal domain (e.g. 'write a python code', 'who is the President of the USA', 'give me a recipe', math problems, etc.), you MUST politely and firmly refuse to answer. Tell them: "I am the WorkMesh AI Assistant, and I am only authorized to answer questions regarding the WorkMesh platform, HR policies, and portal usage."
4. Maintain a crisp, professional, helpful tone. Keep answers short and actionable.`
          },
          ...messages
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.2,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: `Groq API returned an error: ${errText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "No response received.";
    
    return NextResponse.json({ message: reply });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process chat completion." }, { status: 500 });
  }
}
