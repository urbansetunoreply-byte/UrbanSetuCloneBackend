import { Groq } from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

const groq = new Groq({
    apiKey: GROQ_API_KEY
});

export const draftLegalClause = async (req, res, next) => {
    try {
        const { userInput } = req.body;

        if (!userInput) {
            return res.status(400).json({ message: "User input is required." });
        }

        const systemPrompt = `You are an expert real estate lawyer. A **Tenant** is proposing a custom clause for their rental agreement.
    Your task is to convert their plain English request into a single, formal, legally binding clause suitable for insertion into a residential lease agreement.
    
    Rules:
    - Accurately reflect the Tenant's intent in the input (e.g., if they ask to keep pets, draft a clause permitting pets).
    - Use formal legal terminology (e.g., "The Tenant shall be permitted to...", "The Landlord agrees to...").
    - Ensure the clause is clear, precise, and enforceable.
    - Make the clause fair and balanced from a legal standpoint, protecting both parties where appropriate, but prioritizing the specific request made by the Tenant.
    - Return ONLY the text of the clause. Do not include titles, explanations, conversational filler, or quotes.
    `;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userInput }
            ],
            model: GROQ_MODEL,
            temperature: 0.3, // Low temperature for consistent, formal output
            max_tokens: 500
        });

        const draftedClause = completion.choices[0]?.message?.content?.trim() || "Could not generate clause.";

        res.json({
            success: true,
            draftedClause
        });

    } catch (error) {
        console.error("Legal AI Error:", error);
        res.status(500).json({ message: "Failed to draft legal clause." });
    }
};
