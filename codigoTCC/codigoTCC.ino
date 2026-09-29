#include <WiFiManager.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <mbedtls/md.h>
#include "esp_system.h"

#define INDICE_CHAMA 1
#define INDICE_GAS 1

int chama = 32;
//int gas = 34;
int verde = 4;
int vermelho = 2;
int buzzer = 13;
String estadoChama = "seguro";
String estadoGas = "seguro";
String ultimoEstadoEnviado = "";

// A parte de sensor roda sempre; a rede é opcional. Nenhuma falha de rede
// reinicia a placa: ela só tenta de novo depois de INTERVALO_RETRY.
unsigned long ultimoEnvio = 0;
const unsigned long intervalo = 30000;
unsigned long ultimaTentativa = 0;
const unsigned long INTERVALO_RETRY = 10000;
// Enquanto um POST espera resposta o loop fica parado (e o sensor também),
// então o timeout precisa ser curto.
const uint16_t TIMEOUT_HTTP = 10000;

WiFiManager wmanage;
// Global: o portal roda em segundo plano e usa o campo depois do setup().
WiFiManagerParameter campoPairCode("pairCode", "Código de pareamento: ", "", 8);

WiFiClientSecure cliente;
HTTPClient http;
String url = "https://dynamic-flame-sensor.onrender.com";

Preferences prefs;
String accessToken = ""; // String (e não const char*) pra não apontar pra memória do JsonDocument
String device_secret;
String placaId;


// Faz um POST com JSON e devolve o código HTTP (negativo = falha de conexão).
int postJson(String caminho, JsonDocument& corpo, JsonDocument& resposta, bool comToken) {
  String corpoJson;
  serializeJson(corpo, corpoJson);

  http.begin(cliente, url + caminho);
  http.setTimeout(TIMEOUT_HTTP);
  http.addHeader("Content-Type", "application/json");
  if (comToken) {
    http.addHeader("Authorization", "Bearer " + accessToken);
  }
  int codigo = http.POST(corpoJson);
  String texto = http.getString();
  http.end();

  Serial.print("POST ");
  Serial.print(caminho);
  Serial.print(" -> ");
  Serial.print(codigo);
  Serial.print(" ");
  Serial.println(texto);

  resposta.clear();
  deserializeJson(resposta, texto);
  return codigo;
}

// Apaga placaId/segredo e reabre o portal pra pedir um código novo.
void reiniciarPareamento() {
  Serial.println("Placa sem pareamento valido. Abrindo portal DFS-Setup.");
  prefs.begin("DFS", false);
  prefs.clear();
  prefs.end();
  placaId = "";
  device_secret = "";
  accessToken = "";
  if (!wmanage.getConfigPortalActive()) {
    wmanage.startConfigPortal("DFS-Setup");
  }
}

void provisionar() {
  const char* dadosPairCode = campoPairCode.getValue();
  Serial.print("PairCode digitado: ");
  Serial.println(dadosPairCode);

  uint8_t bytesAleatorios[16];
  esp_fill_random(bytesAleatorios, sizeof(bytesAleatorios));

  char segredo[33];
  for (int i = 0; i < 16; i++) {
    sprintf(segredo + (i * 2), "%02x", bytesAleatorios[i]);
  }

  mbedtls_md_context_t ctx;
  mbedtls_md_init(&ctx);
  mbedtls_md_setup(&ctx, mbedtls_md_info_from_type(MBEDTLS_MD_SHA256), 0);
  mbedtls_md_starts(&ctx);
  mbedtls_md_update(&ctx, (const unsigned char*)segredo, strlen(segredo));
  unsigned char hash[32];
  mbedtls_md_finish(&ctx, hash);
  mbedtls_md_free(&ctx);

  char secretHash[65];
  for (int i = 0; i < 32; i++) {
    sprintf(secretHash + (i * 2), "%02x", hash[i]);
  }

  uint64_t chipId64 = ESP.getEfuseMac();
  char chipIdString[17];
  sprintf(chipIdString, "%llX", chipId64);

  JsonDocument docReq;
  JsonDocument docRes;
  docReq["pairCode"] = dadosPairCode;
  docReq["chipId"] = chipIdString;
  docReq["secretHash"] = secretHash;

  int codigo = postJson("/auth/provisionar", docReq, docRes, false);

  if (codigo == 200) {
    placaId = docRes["placaId"].as<String>();
    accessToken = docRes["accessToken"].as<String>();
    device_secret = segredo;

    prefs.begin("DFS", false);
    prefs.putString("device_secret", device_secret);
    prefs.putString("placaId", placaId);
    prefs.end();

    Serial.println("Provisionamento concluido e salvo.");
  }
  else if (codigo == 400 || codigo == 403 || codigo == 404 || codigo == 409) {
    // Código vazio, expirado, errado ou já usado: tentar de novo não adianta,
    // o usuário precisa gerar outro código no app.
    campoPairCode.setValue("", 8);
    reiniciarPareamento();
  }
  // Outros códigos (sem conexão, servidor acordando, 5xx, 429): tenta de novo depois.
}

void fazerLogin() {
  JsonDocument docReq;
  JsonDocument docRes;
  docReq["placaId"] = placaId;
  docReq["secret"] = device_secret;

  int codigo = postJson("/auth/dispositivo", docReq, docRes, false);

  if (codigo == 200) {
    accessToken = docRes["accessToken"].as<String>();
    Serial.println("Login da placa ok.");
  }
  else if (codigo == 401 || codigo == 403 || codigo == 404) {
    // Segredo não confere, placa revogada ou apagada.
    reiniciarPareamento();
  }
}

void enviarLeitura(const char* tipo, int indice, String estado, int leitura) {
  JsonDocument docReq;
  JsonDocument docRes;
  docReq["tipo"] = tipo;
  docReq["indice"] = indice;
  docReq["estado"] = estado;
  docReq["leitura"] = leitura;

  int codigo = postJson("/sensores/leituras", docReq, docRes, true);

  if (codigo == 200 || codigo == 201) {
    ultimoEstadoEnviado = estado;
    ultimoEnvio = millis();
  }
  else if (codigo == 401) {
    accessToken = ""; // token expirou: o loop refaz o login
  }
  else if (codigo == 403) {
    reiniciarPareamento();
  }
}

void setup()
{
  Serial.begin(9600);
  pinMode(chama, INPUT);
  pinMode(verde, OUTPUT);
  pinMode(vermelho, OUTPUT);
  pinMode(buzzer, OUTPUT);

  prefs.begin("DFS", true);
  device_secret = prefs.getString("device_secret");
  placaId = prefs.getString("placaId");
  prefs.end();

  Serial.print("placaId salvo: ");
  Serial.println(placaId);

  cliente.setInsecure();

  // Portal não bloqueante: o setup termina logo e o loop (sensor) começa a
  // rodar mesmo sem Wi-Fi. O portal é atendido por wmanage.process() no loop.
  wmanage.setConfigPortalBlocking(false);
  wmanage.setConnectTimeout(10);
  wmanage.addParameter(&campoPairCode);

  if (device_secret == "" || placaId == "") {
    // Sem pareamento: abre o portal mesmo se já houver Wi-Fi salvo, pra
    // pedir o código.
    wmanage.startConfigPortal("DFS-Setup");
  }
  else {
    wmanage.autoConnect("DFS-Setup");
  }
}

void loop()
{
  // 1. Sensor: sempre, com ou sem internet.
   int valor_d = digitalRead(chama);
   //int sensorValue = analogRead(gas);
   Serial.print("Valor digital: ");
   Serial.println(valor_d);

   if (valor_d != 1)
   {
     estadoChama = "chama";
     digitalWrite(buzzer, HIGH);
     digitalWrite(verde, LOW);
     digitalWrite(vermelho, HIGH);
     delay(500);
     digitalWrite(vermelho, LOW);
     digitalWrite(buzzer, LOW);
     Serial.println("Fogo detectado !!!");
   }
   else{
     estadoChama = "seguro";
     digitalWrite(buzzer, LOW);
     digitalWrite(verde, HIGH);
     digitalWrite(vermelho, LOW);
   }


//   Serial.print("Leitura do sensor MQ-2: ");
//   Serial.println(sensorValue);
//   if(sensorValue >=300){
//     estadoGas = "gas";
//     Serial.println("Gás detectado!!!");
//     digitalWrite(vermelho, HIGH);
//     digitalWrite(verde, LOW);
//     digitalWrite(buzzer, HIGH);
//     delay(500);
//     digitalWrite(vermelho, LOW);
//     digitalWrite(buzzer, LOW);
//   }
//   else{
//     estadoGas = "seguro";
//     digitalWrite(vermelho, LOW);
//     digitalWrite(verde, HIGH);
//     digitalWrite(buzzer, LOW);
//   }

  // 2. Portal de configuração (só faz algo se estiver aberto).
  wmanage.process();

  // 3. Rede: só se houver Wi-Fi. Uma ação de rede por volta do loop.
  if (WiFi.status() == WL_CONNECTED) {
    bool podeTentar = millis() - ultimaTentativa >= INTERVALO_RETRY;

    if (placaId == "") {
      if (podeTentar && strlen(campoPairCode.getValue()) > 0) {
        ultimaTentativa = millis();
        provisionar();
      }
    }
    else if (accessToken == "") {
      if (podeTentar) {
        ultimaTentativa = millis();
        fazerLogin();
      }
    }
    // Envia a cada `intervalo` ou na hora em que o estado muda (ex.: fogo).
    else if (millis() - ultimoEnvio >= intervalo || estadoChama != ultimoEstadoEnviado) {
      if (podeTentar) {
        ultimaTentativa = millis();
        enviarLeitura("chama", INDICE_CHAMA, estadoChama, valor_d);
        // enviarLeitura("gas", INDICE_GAS, estadoGas, sensorValue);
      }
    }
  }

  delay(100);
}
