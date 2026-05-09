import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { event_type, servings, item_description, scope_flavor_details, scope_design_description, city, state, budget } = await req.json()

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const prompt = `A custom baker is pricing an order with these details: Event type: ${event_type || 'unknown'}. Servings: ${servings || 'unknown'}. Item description: ${item_description || 'none provided'}. Flavor details: ${scope_flavor_details || 'none provided'}. Design description: ${scope_design_description || 'none provided'}. Location: ${city || 'unknown'}, ${state || 'unknown'}. The customer's budget is $${budget}. Based on general market rates for custom cottage bakers in the United States, what is a reasonable price range for this order? Respond in JSON only with this structure: { "low": number, "high": number, "reasoning": string (max 50 words) }. Do not include any other text.`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'Invalid response' }, { status: 500 })

    const parsed = JSON.parse(jsonMatch[0])
    return NextResponse.json({ low: parsed.low, high: parsed.high, reasoning: parsed.reasoning })
  } catch {
    return NextResponse.json({ error: 'Pricing unavailable' }, { status: 500 })
  }
}
