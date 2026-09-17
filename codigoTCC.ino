int chama = 32;
int gas = 34;
int verde = 19;
int vermelho = 18;
int buzzer = 21;

 
void setup()
{
  Serial.begin(9600);
  pinMode(chama, INPUT);
  pinMode(verde, OUTPUT);
  pinMode(vermelho, OUTPUT);
  pinMode(buzzer, OUTPUT);
}
 
void loop()
{
  int valor_d = digitalRead(chama);
  int sensorValue = analogRead(gas); 
  Serial.print("Valor digital: ");
  Serial.println(valor_d);
 
  if (valor_d != 1)
  {
    digitalWrite(buzzer, HIGH);
    digitalWrite(verde, LOW);
    digitalWrite(vermelho, HIGH);
    delay(500);
    digitalWrite(vermelho, LOW);
    digitalWrite(buzzer, LOW);
    Serial.println("Fogo detectado !!!");
  }
  else{
    digitalWrite(buzzer, LOW);
    digitalWrite(verde, HIGH);
    digitalWrite(vermelho, LOW);
  }


  Serial.print("Leitura do sensor MQ-2: ");
  Serial.println(sensorValue);
  if(sensorValue >=300){
    Serial.println("Gás detectado!!!");
    digitalWrite(vermelho, HIGH);
    digitalWrite(verde, LOW);
    digitalWrite(buzzer, HIGH);
    delay(500);
    digitalWrite(vermelho, LOW);
    digitalWrite(buzzer, LOW);
  }
  else{
    digitalWrite(vermelho, LOW);
    digitalWrite(verde, HIGH);
    digitalWrite(buzzer, LOW);
  }
  delay(100);
}
 