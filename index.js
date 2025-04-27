// Primeiro instale a dependência MQTT e Express:
// npm install mqtt express

const mqtt = require('mqtt');
const express = require('express');
const app = express();

app.use(express.json());

// Conectando no broker público da HiveMQ
const client = mqtt.connect('mqtt://broker.emqx.io:1883');

const topico = 'almcarvalho/teste';

client.on('connect', () => {
  console.log('Conectado ao Broker!');

  //Inscreve no tópico
  // client.subscribe(topico, (err) => {
  //   if (!err) {
  //     console.log(`Inscrito no tópico: ${topico}`);

  //     // Publica uma mensagem depois de inscrever
  //     client.publish(topico, 'Mensagem de teste enviada pelo Node.js!');
  //   } else {
  //     console.error('Erro ao se inscrever:', err.message);
  //   }
  // });

});

client.on('message', (topic, message) => {
  console.log(`Mensagem recebida no tópico ${topic}: ${message.toString()}`);
});

client.on('error', (err) => {
  console.error('Erro de conexão:', err.message);
});

// Rota POST para publicar mensagem no tópico via Postman
app.post('/testar', (req, res) => {
  const { mensagem, valor } = req.body;

  const conteudo = mensagem || valor;

  if (!conteudo) {
    return res.status(400).json({ erro: 'Mensagem ou valor não fornecido' });
  }

  client.publish(topico, String(conteudo), (err) => {
    if (err) {
      console.error('Erro ao publicar mensagem:', err.message);
      return res.status(500).json({ erro: 'Falha ao publicar mensagem' });
    }

    console.log(`Mensagem publicada via HTTP: ${conteudo}`);
    res.json({ status: 'Mensagem publicada com sucesso!', conteudo });
  });
});

app.post('/publicar', async (req, res) => {
  const { id, topic } = req.query; // ← Pega da querystring agora!

  if (topic !== 'payment' || !id) {
    return res.status(400).json({ erro: 'Webhook inválido' });
  }

  const paymentId = id;
  const accessToken = process.env.MERCADO_PAGO_TOKEN;

  if (!accessToken) {
    return res.status(500).json({ erro: 'Token do Mercado Pago não configurado' });
  }

  try {
    const resposta = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const pagamento = resposta.data;

    if (pagamento.status !== 'approved') {
      return res.status(400).json({ erro: 'Pagamento não aprovado' });
    }

    const valor = Math.round(pagamento.transaction_amount);
    const valorFormatado = valor.toString().padStart(4, '0');

    console.log(`Pagamento aprovado! Valor formatado: ${valorFormatado}`);

    client.publish(topico, valorFormatado, (err) => {
      if (err) {
        console.error('Erro ao publicar no MQTT:', err.message);
      } else {
        console.log(`Valor publicado no MQTT: ${valorFormatado}`);
      }
    });

    res.json.status(200)({ status: 'Pagamento aprovado', valorFormatado });
  } catch (error) {
    console.error('Erro ao consultar pagamento:', error.message);
    res.status(500).json({ erro: 'Erro ao consultar pagamento' });
  }
});


// Iniciar o servidor HTTP
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor HTTP rodando na porta ${PORT}`);
});
