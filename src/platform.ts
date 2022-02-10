import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic, UnknownContext } from 'homebridge';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { ExamplePlatformAccessory } from './platformAccessory';
import { ColourAccessory } from './colourAccessory';
import { RandomAccessory } from './randomAccessory';
import FadeCandy = require('node-fadecandy');
import { BaseAccessory } from './baseAccessory';
import { PainterAccessory } from './painterAccessory';
import { FlagAccessory } from './flagAccessory';
import { Shelf } from './shelf';
import { throws } from 'assert';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class BookshelfPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  public fadeCandy: FadeCandy;

  private currentAccessory?: BaseAccessory;

  fadeCandyReady: boolean = false;

  interval: any = 0;
  
  shelfDefinition = [
    [
      [[49, 56], [112, 119]],

      [[39, 47], [103, 110]],

      [[29, 37], [92, 101]],

      [[19, 27], [83, 90]],

      [[10, 17], [74, 81]],

      [[0, 8], [64, 72]],
    ],
    [
      [[177, 184], [241, 248]],

      [[167, 175], [231, 239]],

      [[157, 165], [221, 229]],

      [[147, 155], [211, 219]],

      [[138, 145], [202, 209]],

      [[128, 137], [192, 201]],
    ],

    [
      [[304, 311], [369, 376]],

      [[295, 303], [359, 367]],

      [[284, 293], [348, 357]],

      [[275, 283], [339, 347]],

      [[266, 273], [330, 337]],

      [[256, 264], [320, 328]],
    ],


  ];

  public bookCase: Shelf[][] = [];

  public allShelves: Shelf[] = [];

  pixelToShelf: Shelf[] = [];

  length = 64 * 6;

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.name);

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', () => {

      this.discoverDevices();
      this.setupFadeCandy();

    });

    this.generateShelfMappings();
  }

  ready(){
    this.log.debug('Fadecandy ready');

    this.allOff();

    this.interval = global.setInterval(() => this.loop(), 300);
  }

  generateShelfMappings() {

    this.bookCase = this.shelfDefinition
      .map((col, c) => col.map((px, r) => new Shelf(c, r, px, [0, 0, 0])));

    this.allShelves = this.bookCase.reduce(function (a, b) { return a.concat(b); }, []);
    this.pixelToShelf = new Array<Shelf>(this.length);
    for (let pixel = 0; pixel < this.length; pixel++) {
      var matched = this.allShelves.filter(sh => sh.Pixels.filter(s => s[0] <= pixel && s[1] >= pixel).length > 0);
      this.pixelToShelf[pixel] = matched.length > 0 ? matched[0] : (null as any)
    }

  }

  public renderShelves() {

    let data = new Uint8Array(this.length * 3)
    for (let pixel = 0; pixel < this.length; pixel++) {
      let i = 3 * pixel;

      var shelf = this.pixelToShelf[pixel];

      if (shelf) {
        data[i] = shelf.Colour[0];
        data[i + 1] = shelf.Colour[1];
        data[i + 2] = shelf.Colour[2];
      } else {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
      }
    }

    this.fadeCandy.send(data);

  }

  public allOff(){
    this.setAll([0,0,0]);
  }
  
  public setAll(colour: number[]){
    this.allShelves.forEach(s=>s.Colour = colour);
  }

  loop() {
    if (this.currentAccessory) {
      //this.log.debug('Ping ', this.currentAccessory.displayName );
      this.currentAccessory.loop();
    }
    this.renderShelves();
  }

  public setCurrentAccessory(newAccessory: BaseAccessory) {

    this.log.debug('Setting active item ', typeof (this.currentAccessory));

    if (this.currentAccessory !== newAccessory) {
      this.currentAccessory?.switchOff();
      this.currentAccessory = newAccessory;
    }

  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  setupFadeCandy() {
    this.fadeCandy = new FadeCandy();
    this.fadeCandy.on(FadeCandy.events.READY, (fc) => {
      fc.config.set(FadeCandy.Configuration.schema.DISABLE_KEYFRAME_INTERPOLATION, 0);
      fc.clut.create();
    });
    this.fadeCandy.on(FadeCandy.events.COLOR_LUT_READY, (fc) => {
      this.fadeCandyReady = true;
      this.ready();
    });
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  discoverDevices() {

    const devices = [
      {
        uniqueId: 'BKSF-COLR',
        displayName: 'Bookshelf',
        accessoryType: ColourAccessory
      },
      {
        uniqueId: 'BKSF-RAND',
        displayName: 'Random Shelves',
        accessoryType: RandomAccessory
      },
      {
        uniqueId: 'BKSF-PAINT',
        displayName: 'Shelf Canvas',
        accessoryType: PainterAccessory
      },
      {
        uniqueId: 'BKSF-TRNS-FLAG',
        displayName: 'Trans Flag',
        accessoryType: FlagAccessory,
        config: [          
          [115, 123, 240],
          [240, 10, 224],
          [235, 235, 210],
          [235, 235, 210],
          [240, 10, 224], 
          [115, 123, 240],
        ]
      },
      {
        uniqueId: 'BKSF-PRD-FLAG',
        displayName: 'Pride Flag',
        accessoryType: FlagAccessory,
        config: [          
          [209, 34, 41],
          [246, 138, 30],
          [253, 224, 26],
          [0, 121, 64],
          [36, 64, 142], 
          [115, 41, 130],
        ]
      },
    ];

    // loop over the discovered devices and register each one if it has not already been registered
    for (const device of devices) {

      const uuid = this.api.hap.uuid.generate(device.uniqueId);

      const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

      var cls = device.accessoryType;

      if (existingAccessory) {
        this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

        new cls!(this, existingAccessory, device.config);

        // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
        // remove platform accessories when no longer present
        // this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
        // this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
      } else {
        // the accessory does not yet exist, so we need to create it
        this.log.info('Adding new accessory:', device.displayName);

        // create a new accessory
        const accessory = new this.api.platformAccessory(device.displayName, uuid);

        // store a copy of the device object in the `accessory.context`
        // the `context` property can be used to store any data about the accessory you may need
        accessory.context.device = device;

        // create the accessory handler for the newly create accessory
        // this is imported from `platformAccessory.ts`
        new cls!(this, accessory, device.config);

        // link the accessory to your platform
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    }
  }
}
