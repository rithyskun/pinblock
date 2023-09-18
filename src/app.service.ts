import { Injectable } from '@nestjs/common';
import { pinBlockFormat0, xor, pinBlockFormat0Decrypt } from 'lib';
import * as crypto from 'crypto';

@Injectable()
export class AppService {
  // Helper function to XOR two hexadecimal strings
  xorHex(a: string, b: string) {
    let result = '';
    for (let i = 0; i < a.length; i++) {
      result += (parseInt(a[i], 16) ^ parseInt(b[i], 16)).toString(16);
    }
    return result.toUpperCase();
  }

  decryptZPK(zmk: string, encryptedZPK: string) {
    const CHIPER_TYPE = 'des-ede';

    const data = Buffer.from(encryptedZPK, 'hex').toString('binary');
    const key = Buffer.from(zmk, 'hex');
    const decipher = crypto.createDecipheriv(CHIPER_TYPE, key, null);
    decipher.setAutoPadding(false);
    let decrypted = decipher.update(data, 'binary', 'hex');
    decrypted += decipher.final('hex');

    return decrypted.toUpperCase();
  }

  async decryptDes(body: any) {
    const { encryptedPinBlock, pan, clearZMK, encryptedZPK } = body;
    const iv = Buffer.alloc(8, 0);

    const panBlock = '0000' + pan.slice(-13, -1);

    const clearZPK = this.decryptZPK(clearZMK, encryptedZPK);

    const key = Buffer.from(clearZPK, 'hex');
    const data = Buffer.from(encryptedPinBlock, 'hex').toString('binary');

    const decipher = crypto.createDecipheriv('des-ede-cbc', key, iv);
    decipher.setAutoPadding(false);
    let decrypted = decipher.update(data, 'binary', 'hex');
    decrypted += decipher.final('hex');

    const PIN = pinBlockFormat0Decrypt(pan, decrypted);
    const pinBlock =
      '0' + PIN.length + PIN + 'FFFFFFFFFFFFFF'.slice(PIN.length); // Pad the pin with F characters

    return {
      pinBlock,
      panBlock,
      clearZPK,
      clearPinBlock: decrypted,
      PIN,
    };
  }

  async encryptDes(body: any) {
    // Sample data for testing
    const { pin, pan, clearZMK, encryptedZPK } = body; // The pin
    // const encryptedZPK = '7E72AF6A738EC3B295D7A30DACBACF70';

    // const zmk = '6479F8B5B5F86749382092ECAD08C816'; // The ZMK get from XOR of C1 & C2
    const iv = Buffer.alloc(8, 0);

    // Generate a pin block from the pin and the pan using ISO-format-0
    const pinBlock =
      '0' + pin.length + pin + 'FFFFFFFFFFFFFF'.slice(pin.length); // Pad the pin with F characters
    const panBlock = '0000' + pan.slice(-13, -1); // Take the last 12 digits of the pan (excluding the check digit)
    let clearPinBlock = ''; // XOR the two blocks
    for (let i = 0; i < 16; i++) {
      clearPinBlock += (parseInt(pinBlock[i], 16) ^ parseInt(panBlock[i], 16))
        .toString(16)
        .toUpperCase();
    }

    const clearZPK = this.decryptZPK(clearZMK, encryptedZPK);

    // encryptWithZPK
    const key = Buffer.from(clearZPK, 'hex'); // Convert the ZPK from hex to binary
    const data = Buffer.from(clearPinBlock, 'hex').toString('binary'); // Convert the pin block from hex to binary
    const cipher = crypto.createCipheriv('des-ede-cbc', key, iv); // Create a cipher object
    cipher.setAutoPadding(false);
    let encryptWithZPK = cipher.update(data, 'binary', 'hex');
    encryptWithZPK += cipher.final('hex');

    return {
      pinBlock,
      panBlock,
      clearZPK,
      clearPinBlock,
      encryptedPinBlock: encryptWithZPK.toUpperCase(),
    };
  }

  encrypt(zmk: string, clearzpk: string) {
    const CHIPER_TYPE = 'des-ede-cbc';
    const AUTO_PADDING_CONTROL = false;

    const plaintext = Buffer.from(clearzpk, 'hex').toString('binary');
    const key = Buffer.from(zmk, 'hex');
    const iv = Buffer.alloc(8, 0);

    const cipher = crypto.createCipheriv(CHIPER_TYPE, key, iv);
    cipher.setAutoPadding(AUTO_PADDING_CONTROL);

    let encrypted = cipher.update(plaintext, 'binary', 'hex');
    encrypted += cipher.final('hex');

    return encrypted.toUpperCase();
  }

  decrypt(zmk: string, zmkEncrypt: string) {
    const CHIPER_TYPE = 'des-ede-cbc';
    const AUTO_PADDING_CONTROL = false;
    const encryptedMessage = Buffer.from(zmkEncrypt, 'hex').toString('binary');
    const key = Buffer.from(zmk, 'hex');
    const iv = Buffer.alloc(8, 0);

    const decipher = crypto.createDecipheriv(CHIPER_TYPE, key, iv);
    decipher.setAutoPadding(AUTO_PADDING_CONTROL);

    let decrypted = decipher.update(encryptedMessage, 'binary', 'hex');
    decrypted += decipher.final('hex');

    return decrypted.toUpperCase();
  }

  async encryptPinBlock(body: any): Promise<any> {
    const { pin, pan } = body;
    const clearPinBlock = await pinBlockFormat0(pan, pin);

    const ZPK = '2F0E5DE085C7892C924A4A2A5D3D5E34';
    const encryptWithZPK = this.encrypt(ZPK, clearPinBlock);

    const ZMK = '6479F8B5B5F86749382092ECAD08C816';
    const encryptedPinBlock = this.encrypt(ZMK, encryptWithZPK);

    return {
      clearPinBlock,
      encryptWithZPK,
      encryptedPinBlock,
    };
  }

  async decryptPinBlock(body: any): Promise<any> {
    const { pin, pan } = body;
    const ZMK = '6479F8B5B5F86749382092ECAD08C816';
    const encryptWithZPK = this.decrypt(ZMK, pin);

    const ZPK = '2F0E5DE085C7892C924A4A2A5D3D5E34';
    const atmPinBlock = this.decrypt(ZPK, encryptWithZPK).toUpperCase();
    const PIN = pinBlockFormat0Decrypt(pan, atmPinBlock);

    return {
      encryptWithZPK,
      atmPinBlock,
      PIN,
    };
  }
}
