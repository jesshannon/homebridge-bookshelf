import { Int16 } from 'hap-nodejs';
import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { BaseAccessory } from './baseAccessory';
import { BookshelfPlatform } from './platform';
import { IOT_CONNECTION } from './private'
import { Shelf } from './shelf';
import { Mqtt as Protocol } from 'azure-iot-device-mqtt';
import { Client, Message } from 'azure-iot-device';

export class FlagAccessory extends BaseAccessory {

    isOn: Boolean = false;

    config: number[][] = [];

    constructor(
        platform: BookshelfPlatform,
        accessory: PlatformAccessory,
        config: any
    ) {
        super(platform, accessory);
        this.config = config as number[][];
    }

    async setOn(value: CharacteristicValue) {
        this.platform.log.debug(value ? 'Switched On' : 'Switched Off');
        this.isOn = value ? true : false;

        if (this.isOn) {
            this.platform.bookCase.forEach(col => 
                this.config.forEach((f, i)=>
                    col[i].Colour = f
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

}
