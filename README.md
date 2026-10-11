# Dynamic Flame Sensor (DFS)

Projeto de TCC: um sistema para monitorar sensores de **chama** e **gás** em casa. Placas ESP32 leem os sensores e enviam as leituras para uma API. Um aplicativo Android mostra o estado de cada sensor, guarda o histórico e envia uma notificação no celular assim que algo é detectado.

O repositório também traz o código da placa, para quem quiser montar o próprio sistema de sensores.

## Como as partes se conectam

```
[ESP32 + sensores] --HTTPS--> [API (DFS-backend, Render)] --> [Firestore]
                                      |
                                      +--push (Expo)--> [App Android (DFS-frontend)]
[App Android] --HTTPS (token Firebase)--> [API]
```

| Pasta | O que é |
|---|---|
| [`codigoTCC/`](codigoTCC/codigoTCC.ino) | Firmware da placa ESP32 (Arduino IDE) |
| [`DFS-backend/`](DFS-backend/) | API em Node.js/Express, hospedada no Render, com Firebase Admin (Firestore + Auth) |
| [`DFS-frontend/`](DFS-frontend/) | Aplicativo em React Native com Expo |

## Montando a placa

### Materiais

- 1 ESP32 DevKit
- 1 módulo sensor de chama (infravermelho) com saída digital `D0`
- 1 sensor de gás MQ-2 (módulo com saída analógica `A0`)
- 1 LED verde, 1 LED vermelho e 2 resistores de 220 Ω
- 1 buzzer ativo
- Protoboard e jumpers
- 2 resistores para o divisor de tensão do MQ-2 (ex.: 10 kΩ e 20 kΩ)

### Ligações

| Componente | Pino do componente | Pino do ESP32 |
|---|---|---|
| Sensor de chama | `VCC` / `GND` | `3V3` / `GND` |
| Sensor de chama | `D0` | `GPIO 32` |
| MQ-2 | `VCC` / `GND` | `5V (VIN)` / `GND` |
| MQ-2 | `A0` (pelo divisor de tensão) | `GPIO 34` |
| LED verde (+ resistor) | ânodo | `GPIO 4` |
| LED vermelho (+ resistor) | ânodo | `GPIO 2` |
| Buzzer | `+` | `GPIO 13` |

> **Atenção:** alimentado com 5 V, o MQ-2 pode entregar até 5 V em `A0`, mas os pinos do ESP32 aceitam no máximo 3,3 V. Use um divisor de tensão (ex.: `A0` → 10 kΩ → `GPIO 34` → 20 kΩ → `GND`).
>
> Use o `GPIO 34` (ou outro pino do ADC1) para o MQ-2. Os pinos do ADC2 não funcionam enquanto o Wi-Fi está ligado.

### Gravando o firmware

1. Instale a [Arduino IDE](https://www.arduino.cc/en/software) e, no Gerenciador de Placas, o pacote **esp32** (Espressif Systems).
2. No Gerenciador de Bibliotecas, instale:
   - **WiFiManager**, de tzapu
   - **ArduinoJson**, de Benoit Blanchon (versão 7)
3. Abra `codigoTCC/codigoTCC.ino` e selecione a placa **ESP32 Dev Module**.
4. Se for usar a sua própria API, troque a variável `url`.
5. Ajuste `LIMITE_GAS` depois de observar no Monitor Serial (9600 baud) os valores do MQ-2 em ar limpo e na presença de gás. Deixe o sensor ligado por uns 2 minutos antes, para ele aquecer.
6. Grave na placa.

### Pareando a placa com o app

1. No app, abra **Conectar placa**. Ele mostra um código de pareamento, válido por 10 minutos.
2. Ligue a placa. Ela cria uma rede Wi-Fi chamada **DFS-Setup**.
3. Conecte o celular a essa rede. Na página que abrir, escolha o Wi-Fi da casa e digite o código.
4. Quando a placa confirmar, o app pergunta quantos sensores ela tem. Com este firmware, informe **1 de chama e 1 de gás**.
5. Cadastre os sensores em **Adicionar sensor**.

Depois disso, a placa:
- envia uma leitura a cada 30 segundos;
- envia imediatamente quando o estado de um sensor muda;
- refaz o login sozinha quando o token expira;
- volta ao modo de pareamento se for desconectada pelo app.

Os LEDs e o buzzer funcionam mesmo sem internet.

## Rodando a API (DFS-backend)

1. Crie um projeto no Firebase com Firestore e Authentication (provedores e-mail/senha e Google).
2. Gere uma chave de conta de serviço e salve como `firebase-key.json` fora do repositório.
3. Copie `DFS-backend/.env.example` para `.env` e preencha `API_SECRET` e `FIREBASE_KEY_PATH`.
4. Instale e inicie:
   ```
   npm install
   npm start
   ```
5. Publique as regras e os índices do Firestore:
   ```
   firebase deploy --only firestore
   ```

O arquivo `DFS-backend/requisicoes.http` tem exemplos de todas as rotas para a extensão REST Client do VS Code.

## Rodando o app (DFS-frontend)

1. Copie `DFS-frontend/.env.example` para `.env` e preencha a configuração do Firebase, o Web Client ID do Google e o link da API.
2. Instale e rode:
   ```
   npm install
   npx expo run:android
   ```

### Gerando o APK (EAS Build)

1. Cadastre as variáveis do `.env` no EAS, porque o `.env` não é enviado no build. Repita para cada variável:
   ```
   eas env:create --environment preview --name EXPO_PUBLIC_APIKEY --value ... --visibility plaintext
   ```
2. Gere o APK:
   ```
   eas build -p android --profile preview
   ```
3. Configurações necessárias na primeira vez:
   - Cadastre no Firebase (Configurações do projeto → app Android) o SHA-1 e o SHA-256 da keystore do EAS. Eles aparecem em `eas credentials`. Depois, baixe o `google-services.json` de novo. Sem isso, o login com Google falha.
   - Envie ao EAS a chave FCM V1 (`eas credentials` → Android → Push Notifications). Sem ela, as notificações não chegam.

## Simulador de placa

Na pasta `DFS-simulador/` (local, não versionada) há um script Node que imita a placa: pareia com um código do app e envia leituras de chama ou gás pelo teclado. Ele serve para testar o app sem o hardware.

## Equipe

- Douglas Moreira de Campos Junior
- Felipe Augusto dos Reis
- Théo Souza Santos
