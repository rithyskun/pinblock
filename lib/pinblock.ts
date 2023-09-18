/**
 * XOR two String or buffer
 * @param {string | Buffer} first  String or Buffer
 * @param {string | Buffer} second String or Buffer
 * @returns {Buffer}
 */
export const xor = (first: string | Buffer, second: string | Buffer) => {
  const fistByteBuffer = Buffer.isBuffer(first)
    ? first
    : Buffer.from(first, 'hex');
  const secondByteBuffer = Buffer.isBuffer(second)
    ? second
    : Buffer.from(second, 'hex');

  const result = Buffer.allocUnsafe(fistByteBuffer.length);
  for (let i = 0; i < fistByteBuffer.length; i++) {
    const firstByte = fistByteBuffer[i];
    const secondByte = secondByteBuffer[i];
    result.fill(firstByte ^ secondByte, i);
  }
  return result;
};

const randomHexNibble = () => {
  return randomIntFromInterval(0, 15).toString(16);
};

const randomIntFromInterval = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};
/**
 * ISO 9564-1 Format 0. An `ISO-0` PIN block format is equivalent to the `ANSI X9.8`,` VISA-1`,
 * and `ECI-1` PIN block formats and is similar to a VISA-4 PIN block format.
 * @param {string} PAN 16 digits
 * @param {string} PIN supports a PIN from 4 to 12 digits in length.A PIN that is longer than 12 digits is truncated on the right.
 * @returns {string}
 */
export const pinBlockFormat0 = (PAN: string, PIN: string) => {
  const PINLen = PIN.length;
  const PANLen = PAN.length;

  const preparedPIN = '0' + PINLen.toString(16) + PIN.padEnd(14, 'F');

  const preparedPAN = '0000' + PAN.substring(PANLen - 13, PANLen - 1);

  const PINblock = xor(preparedPIN, preparedPAN);

  return PINblock.toString('hex').toUpperCase();
};

export const pinBlockFormat0Decrypt = (PAN: string, PINblock: string) => {
  const PANLen = PAN.length;

  const preparedPAN = '0000' + PAN.substring(PANLen - 13, PANLen - 1);

  const decryptedPINblock = xor(PINblock, preparedPAN);

  const decryptedPIN = decryptedPINblock.toString('hex').toUpperCase();

  const PINLen = parseInt(decryptedPIN[1], 16);

  const PIN = decryptedPIN.substring(2, PINLen + 2);

  return PIN;
};

/**
 * ISO 9564-1:2003 Format 1. The `ISO-1` PIN block format is equivalent to an `ECI-4` PIN block format and is recommended for usage where no PAN data is available.
 * @param {string} PIN supports a PIN from 4 to 12 digits in length. A PIN that is longer than 12 digits is truncated on the right.
 * @returns {string}
 */
export const pinBlockFormat1 = (PIN: string) => {
  const PINLen = PIN.length;

  let code = '1' + PINLen.toString(16) + PIN;

  for (let i = code.length; i < 16; i++) {
    code = code.concat(randomHexNibble());
  }

  return code.toUpperCase();
};

/**
 * ISO 9564-3: 2003 Format 2. `ISO-2` is for local use with off-line systems only.
 * @param {string} PIN supports a PIN from 4 to 12 digits in length. A PIN that is longer than 12 digits is truncated on the right.
 * @returns {string}
 */
export const pinBlockFormat2 = (PIN: string) => {
  const PINLen = PIN.length;

  const code = '2' + PINLen.toString(16) + PIN.padEnd(14, 'F');

  return code.toUpperCase();
};

/**
 * ISO 9564-1: 2002 Format 3. . `ISO-3`
 * @param {string} PAN 16 digits
 * @param {string} PIN supports a PIN from 4 to 12 digits in length.A PIN that is longer than 12 digits is truncated on the right.
 * @returns {string}
 */
export const pinBlockFormat3 = (PAN: string, PIN: string) => {
  const PINLen = PIN.length;

  let preparedPIN = '3' + PINLen.toString(16) + PIN;

  for (let i = preparedPIN.length; i < 16; i++) {
    const randomHexBetween10To15 = randomIntFromInterval(10, 15).toString(16);
    preparedPIN = preparedPIN.concat(randomHexBetween10To15);
  }

  const preparedPAN = PAN.slice(3, 15).padStart(16, '0');

  const clearPINblock = xor(preparedPIN, preparedPAN);

  return clearPINblock.toString('hex').toUpperCase();
};
