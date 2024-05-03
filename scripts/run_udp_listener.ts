/* import { prismaService } from '../src/services/db'; */
import { prismaService } from '@services';
import { SmartG4Reciever } from '../src/services/smartg4';

const listener = new SmartG4Reciever(prismaService);
listener
  .startMonitoring()
  .then(() => {
    console.log('Monitoring started');
  })
  .catch((err) => {
    console.error(err);
  });
