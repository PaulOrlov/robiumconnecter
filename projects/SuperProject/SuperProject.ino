#include <FastLED.h>
int indexLed;
CRGBArray<4> led1;
void setup(){
  indexLed = 0;
  FastLED.addLeds<WS2812B, 9, GRB>(led1, 4);
}
void loop(){
  fill_rainbow(led1, 4, indexLed * 10, 20);
  FastLED.show();
  indexLed = indexLed + 10;
  delay(100);
}
