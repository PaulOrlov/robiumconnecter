#include <FastLED.h>
int indexLed;
CRGBArray<5> led1;
void setup(){
  Serial.begin(9600);
  indexLed = 0;
  FastLED.addLeds<WS2812B, 9, GRB>(led1, 5);
}
void loop(){
  Serial.println("Hello from the London Robotics School !!!");
  fill_rainbow(led1, 5, indexLed * 10, 20);
  FastLED.show();
  indexLed = indexLed + 10;
  delay(200);
}
