import { Int16 } from 'hap-nodejs';
import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { BookshelfPlatform } from './platform';

export abstract class BaseAccessory {
  protected service: Service;

  constructor(
    protected readonly platform: BookshelfPlatform,
    protected readonly accessory: PlatformAccessory,
  ) {

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
        .onSet(this.setOn.bind(this))
        .onGet(this.getOn.bind(this));

  }

  public abstract stop();

  async mySetOn(value: CharacteristicValue){

    this.platform.setCurrentAccessory(this);

    this.setOn(value);
  }

  abstract setOn(value: CharacteristicValue);
  abstract getOn(): Promise<CharacteristicValue>;
}