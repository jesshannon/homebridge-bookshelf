import { Int16 } from 'hap-nodejs';
import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { BaseAccessory } from './baseAccessory';
import { BookshelfPlatform } from './platform';
import { Shelf } from './shelf';

export class RandomAccessory extends BaseAccessory {


    private brightness: number = 0;
    private hue: number = 0;
    private saturation: number = 0;
    
    isOn: Boolean = false;

    stack: Shelf[] = [];

    frameCount = 0;

    frameLoop = 10; // how many frames to complete one fade in/out step

    colour = [209, 147, 100]; // target colour

    constructor(
        platform: BookshelfPlatform,
        accessory: PlatformAccessory,
    ) {

        super(platform, accessory);

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

        if(value && !this.isOn){
            this.allOff();
            this.stack = [];
            this.stack.push(this.randomShelf(this.stack));
            this.stack.push(this.randomShelf(this.stack));
            this.stack.push(this.randomShelf(this.stack));
            this.stack.push(this.randomShelf(this.stack));
            this.stack.push(this.randomShelf(this.stack));
            this.stack.push(this.randomShelf(this.stack));
            this.stack.push(this.randomShelf(this.stack));
            this.stack.push(this.randomShelf(this.stack));
        }
        
        this.isOn = value ? true : false;
    }

    async getOn(): Promise<CharacteristicValue> {
        return this.isOn == true;
    }

    public async loop() {

        this.colour = this.hueSatBriToRGB(this.hue, this.saturation, this.brightness);

        if (!this.isOn) {
            this.allOff();
            this.renderShelves();
            return;
        }

        this.frameCount = (this.frameCount + 1) % this.frameLoop;
        
        var fadingIn = this.stack[this.stack.length-1];
        var fadingOut = this.stack[0];


        if (fadingIn) {
            fadingIn.Colour = this.getColour(this.frameCount);
        }

        if (fadingOut) {
            fadingOut.Colour = this.getColour(this.frameLoop - this.frameCount);
        }

        for(var l = 1; l < this.stack.length - 1; l++){
            this.stack[l].Colour = this.getColour(this.frameLoop);
        }

        if (this.frameCount == this.frameLoop - 1) {
            if(this.stack.length > 0){
                (this.stack.shift() as Shelf).Colour = [0,0,0];
            }
            this.stack.push(this.randomShelf(this.stack));
        }

    }

    getColour(frame: number){
        return [
            (frame / this.frameLoop) * this.colour[0],
            (frame / this.frameLoop) * this.colour[1],
            (frame / this.frameLoop) * this.colour[2],
        ]
    }

    randomShelf(exclude: Shelf[] = []) {
        var selected: Shelf = null as any;
        while (selected == null || exclude.filter(s=>s === selected).length > 0) {
            var col = this.platform.bookCase[Math.floor(Math.random() * this.platform.bookCase.length)];
            selected = col[Math.floor(Math.random() * col.length)];
        }
        return selected;
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

}
