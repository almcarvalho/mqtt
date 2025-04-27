// Primeiro instale a dependência MQTT e Express:
// npm install mqtt express

const mqtt = require('mqtt');
const express = require('express');
const app = express();

app.use(express.json());

// Conectando no broker público da HiveMQ
//const client = mqtt.connect('mqtt://broker.hivemq.com:1883');

const client = mqtt.connect('mqtt://broker.emqx.io:1883');

const topico = 'almcarvalho/teste';

client.on('connect', () => {
  console.log('Conectado ao Broker!');

  // Inscreve no tópico
  client.subscribe(topico, (err) => {
    if (!err) {
      console.log(`Inscrito no tópico: ${topico}`);

      // Publica uma mensagem depois de inscrever
      client.publish(topico, 'Mensagem de teste enviada pelo Node.js!');
    } else {
      console.error('Erro ao se inscrever:', err.message);
    }
  });
});

client.on('message', (topic, message) => {
  console.log(`Mensagem recebida no tópico ${topic}: ${message.toString()}`);
});

client.on('error', (err) => {
  console.error('Erro de conexão:', err.message);
});

// Rota POST para publicar mensagem no tópico via Postman
app.post('/publicar', (req, res) => {
  const { mensagem } = req.body;

  if (!mensagem) {
    return res.status(400).json({ erro: 'Mensagem não fornecida' });
  }

  client.publish(topico, mensagem, (err) => {
    if (err) {
      console.error('Erro ao publicar mensagem:', err.message);
      return res.status(500).json({ erro: 'Falha ao publicar mensagem' });
    }

    console.log(`Mensagem publicada via HTTP: ${mensagem}`);
    res.json({ status: 'Mensagem publicada com sucesso!', mensagem });
  });
});

// Iniciar o servidor HTTP
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor HTTP rodando na porta ${PORT}`);
});
