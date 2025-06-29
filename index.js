const mqtt = require('mqtt');
const axios = require('axios');

// === Konfigurasi MQTT ===
const mqttBroker = 'mqtt://broker.hivemq.com';
const mqttTopic = 'iot/kolam1';
const mqttClient = mqtt.connect(mqttBroker);

// === Konfigurasi Firebase ===
const FIREBASE_API_KEY = 'AIzaSyASB15Aegg57nnhZTZR9Pu6TKlKZRmaCtQ';
const PROJECT_ID = 'iotkolam-c5bf2';
const COLLECTION = 'data_kolam';
const FIREBASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}`;

// === Saat Terhubung ke MQTT ===
mqttClient.on('connect', () => {
  console.log('✅ Terhubung ke MQTT broker');
  mqttClient.subscribe(mqttTopic, err => {
    if (err) {
      console.error('❌ Gagal subscribe:', err);
    } else {
      console.log(`📡 Subscribed ke topic: ${mqttTopic}`);
    }
  });
});

// === Saat Menerima Pesan dari MQTT ===
mqttClient.on('message', async (topic, message) => {
  const payload = message.toString();
  console.log(`📥 Data diterima [${topic}]: ${payload}`);

  try {
    const jsonData = JSON.parse(payload);
    const firestoreData = convertToFirestore(jsonData);
    await sendToFirebase(firestoreData);
  } catch (err) {
    console.error('❌ Gagal parsing atau kirim data:', err.message);
  }
});

// === Ubah Data JSON ke Format Firestore ===
function convertToFirestore(data) {
  const fields = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'number') {
      fields[key] = { doubleValue: value };
    } else if (typeof value === 'string') {
      fields[key] = { stringValue: value };
    }
  }

  fields.timestamp = {
    timestampValue: new Date().toISOString()
  };

  return { fields };
}

// === Kirim ke Firestore via REST API ===
async function sendToFirebase(data) {
  try {
    const response = await axios.post(`${FIREBASE_URL}?key=${FIREBASE_API_KEY}`, data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Data berhasil dikirim ke Firestore:', response.data.name);
  } catch (err) {
    console.error('❌ Gagal kirim ke Firebase:', err.response?.data || err.message);
  }
}
