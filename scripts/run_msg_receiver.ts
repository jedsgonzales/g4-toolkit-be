import { DeviceService, IncomingParser, prismaService } from '@services';

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
