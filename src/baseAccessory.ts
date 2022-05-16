import { Int16 } from 'hap-nodejs';
import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { stringify } from 'querystring';
import { BookshelfPlatform } from './platform';
import { Shelf } from './shelf';


export abstract class BaseAccessory {
  protected service: Service;

  public displayName: string;

  constructor(
    protected readonly platform: BookshelfPlatform,
    protected readonly accessory: PlatformAccessory,
  ) {

    this.displayName = accessory.context.device.displayName;

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Jess Shannon')
      .setCharacteristic(this.platform.Characteristic.Model, 'Bookshelf Light')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'Bookshelf-colour');

    // get the LightBulb service if it exists, otherwise create a new LightBulb service
    // you can create multiple services for each accessory
    this.service = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb);

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.displayName);

    // register handlers for the On/Off Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.mySetOn.bind(this))
      .onGet(this.getOn.bind(this));


  }

  public abstract loop();


  async mySetOn(value: CharacteristicValue) {

    this.platform.setCurrentAccessory(this);

    this.setOn(value);
  }

  protected setAll(colour: number[]) {
    this.platform.setAll(colour);
  }

  protected allOff(){
    this.platform.allOff();
  }

  protected renderShelves(){
    this.platform.renderShelves();
  }

  // this will trigger a setOn event
  public switchOff() {
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .setValue(0);
  }

  abstract setOn(value: CharacteristicValue);
  abstract getOn(): Promise<CharacteristicValue>;

  hueSatBriToRGB(hue, saturation, brightness){
    
    // this produces a colour that better matches the display in HomeKit
    var color = this.hslToRgb(hue / 360, saturation / 100, 0.5);

    var max = Math.max(...color);

    var adjustedColor = color.map(c=>c * ((brightness * 2.55) / max));

    return adjustedColor;
  }

  hslToRgb(h, s, l) {
    var r, g, b;

    if (s == 0) {
      r = g = b = l; // achromatic
    } else {
      var hue2rgb = function hue2rgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      }

      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }
}