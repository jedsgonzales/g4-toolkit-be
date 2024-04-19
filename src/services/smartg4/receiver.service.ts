import { ByteLengthParser, SerialPort } from 'serialport';

export class SmartG4Reciever {
  constructor() {}

  async readSerialData(portName) {
    const port = new SerialPort({ path: portName, baudRate: 9600 });

    const parser = port.pipe(new ByteLengthParser({ length: 2 }));

    return new Promise((resolve, reject) => {
      let dataQueue: Buffer = Buffer.from([]);

      parser.on('data', (data: Buffer) => {
        // append incoming data to queue
        dataQueue = Buffer.from([...dataQueue, ...data]);
      });

      port.on('error', (err) => {
        reject(err);
      });

      port.once('close', () => {
        resolve(dataQueue);
      });
    });
  }
}
