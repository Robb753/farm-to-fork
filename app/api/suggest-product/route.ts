import { NextRequest, NextResponse } from "next/server";

const ALLOWED_CATEGORIES = [
  "Légumes",
  "Fruits",
  "Laitages",
  "Viandes",
  "Céréales",
  "Miel & Confitures",
  "Boissons",
  "Autres",
];

const ALLOWED_UNITS = ["kg", "pièce", "litre", "botte", "douzaine"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input: string = body?.input ?? "";

    if (!input || input.trim().length < 2) {
      return NextResponse.json(
        { error: "Saisie trop courte (minimum 2 caractères)" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Clé API Anthropic manquante" },
        { status: 500 }
      );
    }

    const prompt = `Tu es un assistant pour une marketplace de producteurs locaux en France.
L'utilisateur a saisi : "${input.trim()}"
Réponds uniquement en JSON strict avec cette structure :
{"name":"nom normalisé du produit en français","category":"une seule catégorie parmi : Légumes, Fruits, Laitages, Viandes, Céréales, Miel & Confitures, Boissons, Autres","unit":"une seule unité parmi : kg, pièce, litre, botte, douzaine"}
Contraintes :
- pas de texte hors JSON
- pas de markdown
- une seule catégorie autorisée
- une seule unité autorisée
- répondre en français`;

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error("Anthropic API error:", errText);
      return NextResponse.json(
        { error: "Erreur lors de l'appel à l'IA" },
        { status: 502 }
      );
    }

    const anthropicData = await anthropicRes.json();
    const rawText: string = anthropicData?.content?.[0]?.text ?? "";

    let parsed: { name?: unknown; category?: unknown; unit?: unknown };
    try {
      parsed = JSON.parse(rawText.trim());
    } catch {
      console.error("JSON parse error, raw text:", rawText);
      return NextResponse.json(
        { error: "Réponse IA invalide (JSON non parsable)" },
        { status: 502 }
      );
    }

    const name = typeof parsed.name === "string" ? parsed.name.trim() : "";
    const category =
      typeof parsed.category === "string" ? parsed.category.trim() : "";
    const unit = typeof parsed.unit === "string" ? parsed.unit.trim() : "";

    if (!name) {
      return NextResponse.json(
        { error: "Réponse IA invalide (nom manquant)" },
        { status: 502 }
      );
    }

    if (!ALLOWED_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `Catégorie non reconnue : "${category}"` },
        { status: 502 }
      );
    }

    if (!ALLOWED_UNITS.includes(unit)) {
      return NextResponse.json(
        { error: `Unité non reconnue : "${unit}"` },
        { status: 502 }
      );
    }

    return NextResponse.json({ name, category, unit });
  } catch (err) {
    console.error("suggest-product route error:", err);
    return NextResponse.json({ error: "Erreur serveur inattendue" }, { status: 500 });
  }
}
