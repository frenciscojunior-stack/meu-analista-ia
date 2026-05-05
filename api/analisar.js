export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { jogo } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

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
        max_tokens: 1500,
        stream: true,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{
          role: 'user',
          content: `Você é um analista esportivo profissional. Busque dados atuais e faça uma análise pré-jogo COMPLETA do jogo: ${jogo}

Estruture EXATAMENTE assim:

⚽ CONFRONTO: [times e competição]
📊 FORMA RECENTE:
- [Time 1]: [últimos 5 jogos]
- [Time 2]: [últimos 5 jogos]
🏆 HISTÓRICO DE CONFRONTOS: [últimos confrontos diretos]
❌ DESFALQUES: [jogadores fora de cada time]
📈 ESTATÍSTICAS:
- Média de gols: [time 1] / [time 2]
- Cartões amarelos por jogo: [time 1] / [time 2]
- Escanteios por jogo: [time 1] / [time 2]
🎯 PROBABILIDADES:
- Vitória [time 1]: XX%
- Empate: XX%
- Vitória [time 2]: XX%
- Mais de 2.5 gols: XX%
- Menos de 2.5 gols: XX%
💡 PALPITE FINAL: [time vencedor ou empate] - Seja direto e objetivo.

Não peça informações adicionais. Sempre dê um palpite final claro.`
        }]
      })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              res.write(`data: ${JSON.stringify({ texto: parsed.delta.text })}\n\n`);
            }
          } catch {}
        }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (erro) {
    res.write(`data: ${JSON.stringify({ erro: erro.message })}\n\n`);
    res.end();
  }
} 
