#include <WiFiManager.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <mbedtls/md.h>
#include "esp_system.h"

// Canal que cada sensor físico ocupa na placa (o "canal" mostrado no app).
// Esta placa tem 1 sensor de chama e 1 de gás: no app, informe capacidade
// 1 de chama e 1 de gás ao parear.
#define INDICE_CHAMA 1
#define INDICE_GAS 1

int chama = 32;  // saída digital (D0) do módulo de chama: LOW = chama
int gas = 34;    // saída analógica (A0) do MQ-2 — GPIO34 é ADC1, funciona com Wi-Fi ligado
int verde = 4;
int vermelho = 2;
int buzzer = 13;

// Leitura analógica (0–4095 no ESP32) a partir da qual considera gás.
// Calibre com o sensor aquecido (~2 min ligado) em ar limpo e com gás.
const int LIMITE_GAS = 300;

String estadoChama = "seguro";
String estadoGas = "seguro";
String ultimoEstadoEnviadoChama = "";
String ultimoEstadoEnviadoGas = "";

// A parte de sensor roda sempre; a rede é opcional. Nenhuma falha de rede
// reinicia a placa: ela só tenta de novo depois de INTERVALO_RETRY.
unsigned long ultimoEnvioChama = 0;
unsigned long ultimoEnvioGas = 0;
const unsigned long intervalo = 30000;
const unsigned long INTERVALO_RETRY = 10000;

// Backoff por categoria de ação de rede: uma falha de envio de chama não
// pode atrasar um envio de gás pendente (e vice-versa), então cada um tem
// seu próprio "está em espera / desde quando". auth cobre provisionamento e
// login, que são pré-requisitos mutuamente exclusivos dos envios.
struct EstadoRetry {
  bool emEspera = false;
  unsigned long desde = 0;
};
EstadoRetry retryAuth;
EstadoRetry retryChama;
EstadoRetry retryGas;

// O intervalo de retry só vale depois de uma FALHA. Depois de um envio bem
// sucedido a placa pode mandar a próxima leitura na hora — senão uma chama
// detectada logo após o envio de "seguro" esperaria até 10 s pra ser enviada.
bool podeTentar(EstadoRetry &r) {
  return !r.emEspera || millis() - r.desde >= INTERVALO_RETRY;
}
void registrarFalha(EstadoRetry &r) {
  r.emEspera = true;
  r.desde = millis();
}

// Alterna a cada passagem do loop qual sensor tenta enviar primeiro, pra
// nenhum dos dois passar fome do outro (ver nota no loop()).
bool tentarChamaPrimeiro = true;

// Pisca LED vermelho + buzzer sem delay(), pra não travar a leitura.
unsigned long ultimaPiscada = 0;
bool alarmeLigado = false;
const unsigned long INTERVALO_PISCA = 250;
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


bool sucesso(int codigo) {
  return codigo >= 200 && codigo < 300;
}

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

int provisionar() {
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
  return codigo;
}

int fazerLogin() {
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
  return codigo;
}

// Devolve o código HTTP; quem chama atualiza o "último enviado" do tipo.
int enviarLeitura(const char* tipo, int indice, String estado, int leitura) {
  JsonDocument docReq;
  JsonDocument docRes;
  docReq["tipo"] = tipo;
  docReq["indice"] = indice;
  docReq["estado"] = estado;
  docReq["leitura"] = leitura;

  int codigo = postJson("/sensores/leituras", docReq, docRes, true);

  if (codigo == 401) {
    accessToken = ""; // token expirou: o loop refaz o login
  }
  else if (codigo == 403) {
    reiniciarPareamento();
  }
  return codigo;
}

void setup()
{
  Serial.begin(9600);
  pinMode(chama, INPUT);
  pinMode(gas, INPUT);
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
  // 1. Sensores: sempre, com ou sem internet.
  int valorChama = digitalRead(chama);
  int valorGas = analogRead(gas);
  Serial.print("Chama (digital): ");
  Serial.print(valorChama);
  Serial.print("  Gas (MQ-2): ");
  Serial.println(valorGas);

  estadoChama = (valorChama != 1) ? "chama" : "seguro";
  estadoGas = (valorGas >= LIMITE_GAS) ? "gas" : "seguro";
  bool emAlerta = estadoChama != "seguro" || estadoGas != "seguro";

  if (emAlerta) {
    digitalWrite(verde, LOW);
    if (millis() - ultimaPiscada >= INTERVALO_PISCA) {
      ultimaPiscada = millis();
      alarmeLigado = !alarmeLigado;
      digitalWrite(vermelho, alarmeLigado ? HIGH : LOW);
      digitalWrite(buzzer, alarmeLigado ? HIGH : LOW);
    }
  }
  else {
    alarmeLigado = false;
    digitalWrite(buzzer, LOW);
    digitalWrite(vermelho, LOW);
    digitalWrite(verde, HIGH);
  }

  // 2. Portal de configuração (só faz algo se estiver aberto).
  wmanage.process();

  // 3. Rede: só se houver Wi-Fi. Uma ação de rede por volta do loop — mas
  // qual ação, entre chama e gás, alterna a cada volta (ver tentarChamaPrimeiro)
  // em vez de sempre favorecer chama, pra uma leitura de chama que fica
  // mudando de estado toda volta não conseguir travar o envio de gás
  // indefinidamente.
  if (WiFi.status() == WL_CONNECTED) {
    if (placaId == "") {
      if (strlen(campoPairCode.getValue()) > 0 && podeTentar(retryAuth)) {
        if (sucesso(provisionar())) retryAuth.emEspera = false;
        else registrarFalha(retryAuth);
      }
    }
    else if (accessToken == "") {
      if (podeTentar(retryAuth)) {
        if (sucesso(fazerLogin())) retryAuth.emEspera = false;
        else registrarFalha(retryAuth);
      }
    }
    else {
      bool chamaPronta = podeTentar(retryChama) &&
        (millis() - ultimoEnvioChama >= intervalo || estadoChama != ultimoEstadoEnviadoChama);
      bool gasPronta = podeTentar(retryGas) &&
        (millis() - ultimoEnvioGas >= intervalo || estadoGas != ultimoEstadoEnviadoGas);

      tentarChamaPrimeiro = !tentarChamaPrimeiro;
      bool enviouAlgo = false;

      for (int passo = 0; passo < 2 && !enviouAlgo; passo++) {
        bool vezDaChama = (passo == 0) ? tentarChamaPrimeiro : !tentarChamaPrimeiro;

        if (vezDaChama && chamaPronta) {
          String estadoEnviado = estadoChama;
          int codigo = enviarLeitura("chama", INDICE_CHAMA, estadoEnviado, valorChama);
          if (sucesso(codigo)) {
            retryChama.emEspera = false;
            ultimoEstadoEnviadoChama = estadoEnviado;
            ultimoEnvioChama = millis();
          }
          // 401 = token expirado: o relogin acontece já na próxima volta.
          else if (codigo != 401) registrarFalha(retryChama);
          enviouAlgo = true;
        }
        else if (!vezDaChama && gasPronta) {
          String estadoEnviado = estadoGas;
          int codigo = enviarLeitura("gas", INDICE_GAS, estadoEnviado, valorGas);
          if (sucesso(codigo)) {
            retryGas.emEspera = false;
            ultimoEstadoEnviadoGas = estadoEnviado;
            ultimoEnvioGas = millis();
          }
          // 401 = token expirado: o relogin acontece já na próxima volta.
          else if (codigo != 401) registrarFalha(retryGas);
          enviouAlgo = true;
        }
      }
    }
  }

  delay(100);
}
