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

        const systemPrompt = `You are an expert real estate lawyer specialized in drafting rental agreements.
    Your task is to convert the user's plain English request into a single, formal, legally binding clause suitable for insertion into a residential lease agreement.
    
    Rules:
    - Use formal legal terminology (e.g., "The Tenant shall...", "The Landlord reserves the right...").
    - Be precise and enforceable.
    - Return ONLY the text of the clause. Do not include titles, explanations, conversational filler, or quotes.
    - If the input is ambiguous, draft a standard clause covering the likely intent but favor the Landlord's protection by default unless specified otherwise.
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
