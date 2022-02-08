import { Int16 } from 'hap-nodejs';
import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { BaseAccessory } from './baseAccessory';
import { BookshelfPlatform } from './platform';
import { IOT_CONNECTION } from './private'
import { Shelf } from './shelf';
import { Mqtt as Protocol } from 'azure-iot-device-mqtt';
import { Client, Message } from 'azure-iot-device';

export class PainterAccessory extends BaseAccessory {

    client: Client = null as any;
    isOn: Boolean = false;

    constructor(
        platform: BookshelfPlatform,
        accessory: PlatformAccessory,
    ) {
        super(platform, accessory);

    }

    disconnectHandler(): void {
        this.client.open().catch((err) => {
            this.platform.log.error(err.message);
        });
    }

    connectHandler(): void {
        this.platform.log.debug("Connected to hub");
        this.sayHello();
    }

    messageHandler(msg: any): void {
        this.platform.log.debug('Id: ' + msg.messageId + ' Body: ' + msg.data);
        this.client.complete(msg);
    }

    errorHandler(err: any): void {
        this.platform.log.error(err.message);
    }

    sayHello(){
        var message = new Message("hello");
        this.client.sendEvent(message);
    }

    async setOn(value: CharacteristicValue) {
        this.platform.log.debug(value ? 'Switched On' : 'Switched Off');
        this.isOn = value ? true : false;

        if (this.isOn) {

            this.client = Client.fromConnectionString(IOT_CONNECTION, Protocol);
            this.client.on('connect', ()=>this.connectHandler());
            this.client.on('error', (err)=>this.errorHandler(err));
            this.client.on('disconnect', ()=>this.disconnectHandler());
            this.client.on('message', (msg)=>this.messageHandler(msg));
            this.client.open().catch((err) => {
                console.error('Could not connect: ' + err.message);
            });

        } else {
            this.client.close();
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
