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
        max_tokens: 2000,
        stream: true,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{
          role: 'user',
          content: `Você é um analista esportivo profissional. Busque dados sobre o jogo: ${jogo}

REGRA IMPORTANTE: Se não encontrar algum dado específico, use sua base de conhecimento para estimar. NUNCA deixe uma seção em branco ou diga que não encontrou dados. Sempre complete todas as seções com o melhor dado disponível ou uma estimativa fundamentada.

Estruture EXATAMENTE assim:

⚽ CONFRONTO: [times, competição, data e horário]

📊 FORMA RECENTE:
- [Time 1]: [últimos 5 jogos]
- [Time 2]: [últimos 5 jogos]

🏆 HISTÓRICO: [últimos confrontos diretos com placares]

❌ DESFALQUES:
- [Time 1]: [lesionados e suspensos]
- [Time 2]: [lesionados e suspensos]

📈 ESTATÍSTICAS:
- Posse de bola: [time 1] XX% / [time 2] XX%
- Média de gols marcados: [time 1] X.X / [time 2] X.X
- Média de gols sofridos: [time 1] X.X / [time 2] X.X
- Cartões amarelos por jogo: [time 1] X.X / [time 2] X.X
- Escanteios por jogo: [time 1] X.X / [time 2] X.X
- Chutes a gol por jogo: [time 1] X.X / [time 2] X.X

💰 ODDS:
- Vitória [time 1]: X.XX
- Empate: X.XX
- Vitória [time 2]: X.XX
- Mais de 2.5 gols: X.XX
- Menos de 2.5 gols: X.XX
- Ambos marcam (Sim): X.XX
- Ambos marcam (Não): X.XX

🎯 PROBABILIDADES:
- Vitória [time 1]: XX%
- Empate: XX%
- Vitória [time 2]: XX%
- Mais de 2.5 gols: XX%
- Menos de 2.5 gols: XX%
- Ambos marcam: XX%

⭐ JOGADORES CHAVE:
- [Time 1]: [2-3 jogadores decisivos]
- [Time 2]: [2-3 jogadores decisivos]

💡 PALPITE FINAL: [nome do time ou Empate] — [justificativa em 2 linhas]

🎰 MELHOR APOSTA: [mercado recomendado com odd]`
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
