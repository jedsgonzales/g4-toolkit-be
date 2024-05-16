import { DeviceService } from 'src/services/db/device.service';
import { prismaService } from 'src/services/db/prisma.service';
import { IncomingParser } from 'src/services/smartg4/incoming.parser.service';

const deviceSvc = new DeviceService(prismaService);
const parser = new IncomingParser(prismaService, deviceSvc);

parser
  .startMonitoring()
  .then(() => {
    console.log('Packet monitoring started');
  })
  .catch((err) => {
    console.error(err);
  });
