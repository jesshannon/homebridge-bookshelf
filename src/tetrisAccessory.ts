import { Int16 } from 'hap-nodejs';
import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { BaseAccessory } from './baseAccessory';
import { BookshelfPlatform } from './platform';
import { Shelf } from './shelf';

export class TetrisAccessory extends BaseAccessory {

    isOn: Boolean = false;

    frameCount = 0;
    frameLoop = 2;

    colours = [
        [209, 34, 41],
        [246, 138, 30],
        [253, 224, 26],
        [0, 121, 64],
        [36, 64, 142],
        [115, 41, 130],
    ];

    constructor(
        platform: BookshelfPlatform,
        accessory: PlatformAccessory,
    ) {
        super(platform, accessory);
        
    }

    async setOn(value: CharacteristicValue) {
        this.isOn = value ? true : false;
    }

    async getOn(): Promise<CharacteristicValue> {
        return this.isOn == true;
    }

    public async loop() {
        if (!this.isOn) {
            this.allOff();
            this.renderShelves();
            return;
        }

        this.frameCount = (this.frameCount + 1) % this.frameLoop;
        if (this.frameCount == 0) {
            this.animFrame();
        }
    }

    currentColumn = 0;
    currentPosition = -1;

    animFrame() {
        if(this.currentPosition < -1)
        {
            this.currentPosition++;
        }
        else if(this.currentPosition < 0){
            // start new column
            this.currentColumn = Math.floor(Math.random() * this.platform.bookCase.length);
            this.platform.bookCase[this.currentColumn][0].Colour = this.colours[Math.floor(Math.random() * this.colours.length)];
            this.currentPosition = 0;
        } else {
            
            var column = this.platform.bookCase[this.currentColumn];

            if(
                column.length > this.currentPosition+1 &&
                this.arraysEqual(column[this.currentPosition+1].Colour, [0,0,0]))
                {
                    column[this.currentPosition+1].Colour = column[this.currentPosition].Colour;
                    column[this.currentPosition].Colour = [0,0,0];
                    this.currentPosition++;
                } else if(this.currentPosition == 0){
                    this.currentPosition = -4;
                    this.resetColumn(column);
                } else {
                    this.currentPosition = -1;
                }
        }
    }
    
    resetColumn(column: Shelf[]) {
        var speed = 1.5;
        var prevColour : number[];

        var fall = () => {
            
            column.forEach((shelf: Shelf, index: number)=>{
                var tempColour = shelf.Colour;
                shelf.Colour = index == 0 ? [0,0,0] : prevColour;
                prevColour = tempColour;
            });

            if(!this.arraysEqual(column[column.length-1].Colour,[0,0,0])){
                speed = speed * 2;
                setTimeout(fall, 1000/speed);
            }
            this.renderShelves();
        };
        setTimeout(fall, 1000/speed);
    }


    arraysEqual(a, b) {
        if (a === b) return true;
        if (a == null || b == null) return false;
        if (a.length !== b.length) return false;
      
        // If you don't care about the order of the elements inside
        // the array, you should sort both arrays here.
        // Please note that calling sort on an array will modify that array.
        // you might want to clone your array first.
      
        for (var i = 0; i < a.length; ++i) {
          if (a[i] !== b[i]) return false;
        }
        return true;
      }
}
