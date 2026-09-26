#include <WiFiManager.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <mbedtls/md.h>
#include "esp_system.h"

//int chama = 32;
//int gas = 34;
//int verde = 19;
//int vermelho = 18;
//int buzzer = 21;
WiFiManager wmanage;
JsonDocument docReq;
JsonDocument docRes;
String corpoJson;
WiFiClientSecure cliente;
HTTPClient http;
String url = "https://dynamic-flame-sensor.onrender.com";
Preferences prefs;
const char* accessTokenRec;

void setup()
{
  Serial.begin(9600);
  //  pinMode(chama, INPUT);
  //  pinMode(verde, OUTPUT);
  //  pinMode(vermelho, OUTPUT);
  //  pinMode(buzzer, OUTPUT);

  prefs.begin("DFS", true);
  String device_secret = prefs.getString("device_secret");
  String placaId = prefs.getString("placaId");
  prefs.end();

  Serial.print("placaId salvo: ");
  Serial.println(placaId);
  Serial.print("device_secret salvo: ");
  Serial.println(device_secret);

  if (device_secret == "" || placaId == "") {
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


    uint64_t chipId64 = ESP.getEfuseMac();
    WiFiManagerParameter campoPairCode {"pairCode", "Código de pareamento: ", "", 8};
    wmanage.addParameter(&campoPairCode);

    wmanage.startConfigPortal("DFS-Setup");
    Serial.println("Portal fechado, Wi-Fi conectado.");

    const char* dadosPairCode = campoPairCode.getValue();
    Serial.print("PairCode digitado: ");
    Serial.println(dadosPairCode);

    char chipIdString[17];
    sprintf(chipIdString, "%llX", chipId64);

    char secretHash[65];
    for (int i = 0; i < 32; i++) {
      sprintf(secretHash + (i * 2), "%02x", hash[i]);
    }

    docReq["pairCode"] = dadosPairCode;
    docReq["chipId"] = chipIdString;
    docReq["secretHash"] = secretHash;

    serializeJson(docReq, corpoJson);

    cliente.setInsecure();

    http.begin(cliente, url + "/auth/provisionar");
    http.addHeader("Content-Type", "application/json");
    int codigo = http.POST(corpoJson);
    String resposta = http.getString();
    http.end();

    Serial.print("Codigo HTTP (provisionar): ");
    Serial.println(codigo);
    Serial.print("Resposta (provisionar): ");
    Serial.println(resposta);

    DeserializationError erro = deserializeJson(docRes, resposta);
    if (erro || codigo != 200) {
      ESP.restart();
    }
    accessTokenRec = docRes["accessToken"];
    const char* placaIdRec = docRes["placaId"];

    prefs.begin("DFS", false);
    prefs.putString("device_secret", segredo);
    prefs.putString("placaId", placaIdRec);
    prefs.end();

    device_secret = segredo;
    placaId = placaIdRec;

    docReq.clear();
    docRes.clear();

    Serial.println("Provisionamento concluido e salvo.");
  }
  wmanage.autoConnect("DFS-Setup");
  Serial.println("Wifi Conectado!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());

  docReq["placaId"] = placaId;
  docReq["secret"] = device_secret;

  serializeJson(docReq, corpoJson);

  cliente.setInsecure();
  http.begin(cliente, url + "/auth/dispositivo");
  http.addHeader("Content-Type", "application/json");
  int codigo = http.POST(corpoJson);
  String resposta = http.getString();
  http.end();

  Serial.print("Codigo HTTP (dispositivo): ");
  Serial.println(codigo);
  Serial.print("Resposta (dispositivo): ");
  Serial.println(resposta);

  DeserializationError erro = deserializeJson(docRes, resposta);
  if (erro || codigo != 200) {
    ESP.restart();
  }
  accessTokenRec = docRes["accessToken"];
  Serial.print("Token recebido: ");
  Serial.println(accessTokenRec);


}

void loop()
{
  //  int valor_d = digitalRead(chama);
  //  int sensorValue = analogRead(gas);
  //  Serial.print("Valor digital: ");
  //  Serial.println(valor_d);
  //
  //  if (valor_d != 1)
  //  {
  //    digitalWrite(buzzer, HIGH);
  //    digitalWrite(verde, LOW);
  //    digitalWrite(vermelho, HIGH);
  //    delay(500);
  //    digitalWrite(vermelho, LOW);
  //    digitalWrite(buzzer, LOW);
  //    Serial.println("Fogo detectado !!!");
  //  }
  //  else{
  //    digitalWrite(buzzer, LOW);
  //    digitalWrite(verde, HIGH);
  //    digitalWrite(vermelho, LOW);
  //  }
  //
  //
  //  Serial.print("Leitura do sensor MQ-2: ");
  //  Serial.println(sensorValue);
  //  if(sensorValue >=300){
  //    Serial.println("Gás detectado!!!");
  //    digitalWrite(vermelho, HIGH);
  //    digitalWrite(verde, LOW);
  //    digitalWrite(buzzer, HIGH);
  //    delay(500);
  //    digitalWrite(vermelho, LOW);
  //    digitalWrite(buzzer, LOW);
  //  }
  //  else{
  //    digitalWrite(vermelho, LOW);
  //    digitalWrite(verde, HIGH);
  //    digitalWrite(buzzer, LOW);
  //  }
  //  delay(100);
}
