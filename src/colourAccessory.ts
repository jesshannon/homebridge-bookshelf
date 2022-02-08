import { Int16 } from 'hap-nodejs';
import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { BaseAccessory } from './baseAccessory';
import { BookshelfPlatform } from './platform';

export class ColourAccessory extends BaseAccessory {

  private brightness: number = 0;
  private hue: number = 0;
  private saturation: number = 0;

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

  async setOn(value: CharacteristicValue) {

    this.platform.log.debug(value ? 'Switched On' : 'Switched Off');

    if (value && this.brightness == 0) {
      this.brightness = 50;
    } else if (!value) {
      this.brightness = 0;
      this.allOff();
      this.renderShelves();
    }

  }

  async getOn(): Promise<CharacteristicValue> {
    this.platform.log.debug('On state requested');
    return this.brightness > 0;
  }

  async setBrightness(value: CharacteristicValue) {
    this.platform.log.debug('Set brightness to ', value);
    this.brightness = value as number;
  }
  async getBrightness(): Promise<CharacteristicValue> {
    return this.brightness as CharacteristicValue;
  }
  async setHue(value: CharacteristicValue) {
    this.platform.log.debug('Set hue to ', value);
    this.hue = value as number;
  }
  async getHue(): Promise<CharacteristicValue> {
    return this.hue as CharacteristicValue;
  }
  async setSaturation(value: CharacteristicValue) {
    this.platform.log.debug('Set saturation to ', value);
    this.saturation = value as number;
  }
  async getSaturation(): Promise<CharacteristicValue> {
    return this.saturation as CharacteristicValue;
  }

  public async loop() {

    if (this.brightness == 0) {
      this.allOff();
      return;
    }

    var color = this.hslToRgb(this.hue / 360, this.saturation / 100, this.brightness / 120); // scaled max brightness down
    this.setAll(color);


  }

}
