import { CRC_TABLE } from '@constants';

const smartcloud = Buffer.from('SMARTCLOUD');
const standardHeader = Buffer.from([...smartcloud, 0xaa, 0xaa]);

export const withLeadCodes = (fullPacket: Buffer) => {
  const smartCloundIndex = fullPacket.indexOf(smartcloud);
  const targetIdx = smartCloundIndex + smartcloud.length;

  if (
    !(fullPacket.subarray(targetIdx, targetIdx + 2).readUInt16BE(0) == 0xaaaa)
  ) {
    throw new MalformedSmartG4MessageError('Missing lead codes');
  }

  return true;
};

export const withProperLength = (fullPacket: Buffer) => {
  const smartCloundIndex = fullPacket.indexOf(smartcloud);
  const minLength = smartCloundIndex + standardHeader.length + 1; // IP + Header + Lead Code
  const length = fullPacket.subarray(minLength - 1, minLength).readUInt8(0);
  const reqLength = minLength + length - 1;

  if (!(length >= 11 && length <= 78 && fullPacket.length >= reqLength)) {
    throw new MalformedSmartG4MessageError('Wrong length');
  }

  return length;
};

export const withCorrectCRC = (fullPacket: Buffer) => {
  const smartCloundIndex = fullPacket.indexOf(smartcloud);
  const minLength = smartCloundIndex + standardHeader.length + 1; // IP + Header + Lead Code
  const length = fullPacket.subarray(minLength - 1, minLength).readUInt8(0);

  const crc = checkCRC(fullPacket.subarray(minLength - 1), length - 2);
  if (!crc) {
    throw new MalformedSmartG4MessageError('Bad CRC');
  }

  return crc;
};

/**
 * Checks the presence of Smart G4 header `SMARTCLOUD`
 * @param fullPacket packet to check
 */
export const withSmartG4Header = (fullPacket: Buffer) => {
  if (!(fullPacket.indexOf(standardHeader) > 3)) {
    throw new MalformedSmartG4MessageError('Missing Smart G4 Header');
  }
};

/**
 * Extracts packet data from lead code up to CRC
 * @param fullPacket source packet
 * @returns extracted packet as Buffer
 */
export const getDataAfterHeader = (fullPacket: Buffer) => {
  const headerIndex = fullPacket.indexOf(smartcloud);
  const dataLength = fullPacket
    .subarray(headerIndex + 2, headerIndex + 3)
    .readUInt8(0);

  return fullPacket.subarray(
    headerIndex + smartcloud.length,
    headerIndex + smartcloud.length + dataLength,
  );
};

export const getIpBeforeHeader = (fullPacket: Buffer) => {
  const headerIndex = fullPacket.indexOf(smartcloud);
  return fullPacket.subarray(headerIndex - 4, headerIndex);
};

export class MalformedSmartG4MessageError extends Error {
  constructor(msg?: string) {
    super(msg || 'Malformed SmartG4 message');
  }
}

export const packCRC = (arrayPtrBuf: Buffer, intBufLen: number) => {
  let wdCRC: number = 0;
  let wdPtrCount: number = 0;
  let bytDat: number;

  try {
    while (intBufLen !== 0) {
      bytDat = (wdCRC >> 8) & 0x00ff;
      wdCRC = (wdCRC << 8) & 0xff00;
      wdCRC = wdCRC ^ CRC_TABLE[bytDat ^ arrayPtrBuf[wdPtrCount]];

      wdPtrCount++;
      intBufLen--;
    }

    const mbytCRCHighData = wdCRC >> 8;
    const mbytCRCLowData = wdCRC & 0x00ff;

    return [mbytCRCHighData, mbytCRCLowData];
  } catch (ex: any) {
    console.error(ex.message + '(PackCRC)');
  }
};

export const checkCRC = (arrayPtrBuf: Buffer, intBufLen: number) => {
  let wdCRC: number = 0;
  let bytDat: number;
  let bytPtrCount: number = 0;

  try {
    while (intBufLen !== 0) {
      bytDat = (wdCRC >> 8) & 0x00ff;
      wdCRC = (wdCRC << 8) & 0xff00;
      wdCRC = wdCRC ^ CRC_TABLE[bytDat ^ arrayPtrBuf[bytPtrCount]];

      bytPtrCount++;
      intBufLen--;
    }

    if (
      arrayPtrBuf[bytPtrCount] === wdCRC >> 8 &&
      arrayPtrBuf[bytPtrCount + 1] === (wdCRC & 0x00ff)
    ) {
      return arrayPtrBuf.subarray(bytPtrCount, bytPtrCount + 2);
    }
  } catch (ex: any) {
    console.error(ex.message + '(CheckCRC)');
  }

  return false;
};

export * from './raw_structure';
export * from './base_structure';
