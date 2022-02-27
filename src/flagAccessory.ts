import { Int16 } from 'hap-nodejs';
import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { BaseAccessory } from './baseAccessory';
import { BookshelfPlatform } from './platform';
import { IOT_CONNECTION } from './private'
import { Shelf } from './shelf';
import { Mqtt as Protocol } from 'azure-iot-device-mqtt';
import { Client, Message } from 'azure-iot-device';

export class FlagAccessory extends BaseAccessory {

    private brightness: number = 100;

    isOn: Boolean = false;

    config: number[][] = [];

    constructor(
        platform: BookshelfPlatform,
        accessory: PlatformAccessory,
        config: any
    ) {
        super(platform, accessory);
        this.config = config as number[][];
        
        this.service.getCharacteristic(this.platform.Characteristic.Brightness)
        .onSet(this.setBrightness.bind(this))
        .onGet(this.getBrightness.bind(this));
    }

    async setOn(value: CharacteristicValue) {
        this.platform.log.debug(value ? 'Switched On' : 'Switched Off');
        this.isOn = value ? true : false;

        if (this.isOn) {
            this.platform.bookCase.forEach(col => 
                this.config.forEach((f, i)=>
                    col[i].Colour = [
                        (f[0] * this.brightness) / 100,
                        (f[1] * this.brightness) / 100,
                        (f[2] * this.brightness) / 100,
                    ]
                ));
        } else {
            this.allOff();
        }
    }

    async getOn(): Promise<CharacteristicValue> {
        return this.isOn == true;
    }

    public async loop() {
        if (!this.isOn) { // all off
            this.allOff();
        }
    }

    async setBrightness(value: CharacteristicValue) {
        this.platform.log.debug('Set brightness to ', value);
        this.brightness = value as number;
      }
      async getBrightness(): Promise<CharacteristicValue> {
        return this.brightness as CharacteristicValue;
      }

}
