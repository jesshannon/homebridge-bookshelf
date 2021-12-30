import { Int16 } from 'hap-nodejs';
import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { BaseAccessory } from './baseAccessory';
import { BookshelfPlatform } from './platform';

export class ColourAccessory extends BaseAccessory {

  private brightness: number = 0; 
  private hue: number = 0;
  private saturation: number = 0;

  actualBrightness: number = 0;
  actualHue: number = 0;
  actualSaturation: number = 0;

  private interval: number = 0;

  constructor(
    platform: BookshelfPlatform,
    accessory: PlatformAccessory,
  ) {

    super(platform, accessory);

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb

    // register handlers for the Brightness Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.Brightness)
        .onSet(this.setBrightness.bind(this))
        .onGet(this.getBrightness.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.Saturation)
        .onSet(this.setSaturation.bind(this))
        .onGet(this.getSaturation.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.Hue)
        .onSet(this.setHue.bind(this))
        .onGet(this.getHue.bind(this));

  }

  public stop() {
      clearInterval(this.interval as any as NodeJS.Timeout);
  }

  async setOn(value: CharacteristicValue) {

        if(value){
            //this.stop();
            //this.interval = setTimeout(()=>this.updateLights(), 100) as any as number;
        }

      if(value && this.brightness == 0){
        this.brightness = 50;
      } else if(!value) {
        this.brightness = 0;
      }

    this.updateLights();
      
    this.platform.log.debug('Set Characteristic On ->', value);
  }

  async getOn(): Promise<CharacteristicValue> {
    return this.brightness > 0;
  }

  async setBrightness(value: CharacteristicValue) {
    this.platform.log.debug('Set Brightness ->', value);
    this.brightness = value as number;
    this.updateLights();
  }
  async getBrightness(): Promise<CharacteristicValue> {
    return this.brightness as CharacteristicValue;
  }
  async setHue(value: CharacteristicValue) {
    this.platform.log.debug('Set Hue ->', value);
    this.hue = value as number;
    this.updateLights();
  }
  async getHue(): Promise<CharacteristicValue> {
    return this.hue as CharacteristicValue;
  }
  async setSaturation(value: CharacteristicValue) {
    this.platform.log.debug('Set Saturation ->', value);
    this.saturation = value as number;
    this.updateLights();
  }
  async getSaturation(): Promise<CharacteristicValue> {
    return this.saturation as CharacteristicValue;
  }

  async updateLights() {

    //this.actualBrightness = this.actualBrightness + ((this.brightness - this.actualBrightness) / 5);
    //this.actualHue = this.actualHue + ((this.hue - this.actualHue) / 5);
    //this.actualSaturation = this.actualSaturation + ((this.saturation - this.actualSaturation) / 5);

    var length = 384;

    var color = this.hslToRgb(this.hue / 360, this.saturation / 100, this.brightness / 120); // scaled max brightness down

    this.platform.log.debug('Setting RGB ->', color);

    let data = new Uint8Array(length * 3)
    for (let pixel = 0; pixel < length; pixel ++) {
        let i = 3 * pixel;

        data[i] = color[0]
        data[i + 1] = color[1]
        data[i + 2] = color[2]
    }
    this.platform.fadeCandy.send(data);

  }

  hslToRgb(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        var hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

}
