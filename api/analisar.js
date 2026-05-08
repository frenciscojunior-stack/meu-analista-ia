const { Anthropic } = require('@anthropic-ai/sdk');
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  const { match, league } = req.body;
  const prompt = `Analise o jogo: ${match} (${league}). 
  Forneça: 
  1. Forma atual dos times.
  2. Desfalques importantes.
  3. Estatísticas de posse e gols.
  4. Comparação de Odds e onde está o VALOR.
  5. Palpite final objetivo.`;

  try {
    const stream = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
      stream: true,
    });
    res.setHeader('Content-Type', 'text/event-stream');
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') res.write(chunk.delta.text);
    }
    res.end();
  } catch (error) { res.status(500).json({ error: "Erro na API" }); }
}
 
