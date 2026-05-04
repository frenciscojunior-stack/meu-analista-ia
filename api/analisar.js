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
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Você é um analista esportivo profissional. Faça uma análise pré-jogo COMPLETA e OBJETIVA do jogo: ${jogo}

Estruture assim:
⚽ CONFRONTO: [times]
📊 FORMA RECENTE: [últimos jogos de cada time]
🏆 HISTÓRICO: [confrontos diretos]
❌ DESFALQUES: [jogadores fora]
🎯 PROGNÓSTICO:
- Vitória time 1: XX%
- Empate: XX%
- Vitória time 2: XX%
💡 PALPITE: [seu palpite direto]

Seja direto e objetivo. Não peça informações adicionais.`
        }]
      })
    });

    const data = await response.json();
    const texto = data.content?.[0]?.text || 'Sem resposta';
    return res.status(200).json({ analise: texto });
  } catch (erro) {
    return res.status(500).json({ erro: erro.message });
  }
}
