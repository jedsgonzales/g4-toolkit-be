const allowedChars = '1234567890.abcdefghijklmnopqrstuvwxyz~!@#$%^&*()-=_+';
const allowedChars2 = '1234567890abcdefghijklmnopqrstuvwxyz';
const numbersOnly = '1234567890';

/**
 * Creates string composed of letters, nuumbers and special characters.
 * @param len length of string
 * @returns generated string of `len` length
 */
export const createString = (len = 8) => {
  let str = '';
  while (str.length < len) {
    str = `${str}${allowedChars.charAt(
      Math.round(Math.random() * (allowedChars.length - 1)),
    )}`;
  }

  return str;
};

/**
 * Creates string composed of only letters and nuumbers
 * @param len length of string
 * @returns generated string of `len` length
 */
export const createString2 = (len = 8) => {
  let str = '';
  while (str.length < len) {
    str = `${str}${allowedChars2.charAt(
      Math.round(Math.random() * (allowedChars2.length - 1)),
    )}`;
  }

  return str;
};

export const convert =
  (from: BufferEncoding, to: BufferEncoding) =>
  (
    str:
      | WithImplicitCoercion<string>
      | {
          [Symbol.toPrimitive](hint: 'string'): string;
        },
  ) =>
    Buffer.from(str, from).toString(to);

export const utf8ToHex = convert('utf8', 'hex');
export const hexToUtf8 = convert('hex', 'utf8');

export const makeNumber = (len = 6) => {
  let str = '';
  while (str.length < len) {
    str = `${str}${numbersOnly.charAt(
      Math.round(Math.random() * (numbersOnly.length - 1)),
    )}`;
  }

  return str;
};
