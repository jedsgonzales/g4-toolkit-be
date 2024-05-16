import { prismaService } from 'src/services/db/prisma.service';
import { SmartG4Reciever } from 'src/services/smartg4/receiver.service';

const listener = new SmartG4Reciever(prismaService);
listener
  .startMonitoring()
  .then(() => {
    console.log('Monitoring started');
  })
  .catch((err) => {
    console.error(err);
  });
