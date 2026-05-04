export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { jogo } = req.body;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{
          role: 'user',
          content: `Você é um analista esportivo profissional. Busque dados atuais e faça uma análise pré-jogo completa e objetiva do jogo: ${jogo}. Inclua: forma recente dos times, confrontos diretos, desfalques, prognóstico com porcentagem de chance de vitória de cada time e empate. Seja direto e objetivo, sem pedir informações adicionais.`
        }]
      })
    });

    const data = await response.json();
    const texto = data.content?.find(b => b.type === 'text')?.text || 'Sem resposta';
    return res.status(200).json({ analise: texto });
  } catch (erro) {
    return res.status(500).json({ erro: erro.message });
  }
} 
