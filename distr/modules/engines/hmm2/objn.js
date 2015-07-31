define(["require", "exports"], function(require, exports) {
    function getAnimFrame(icn, start, ticket, quantity) {
        if (typeof quantity === "undefined") { quantity = 0; }
        switch (icn) {
            case 'TELEPORT1':
            case 'TELEPORT2':
            case 'TELEPORT3':
                return start + ticket % 8;

            case 'FOUNTAIN':
            case 'TREASURE':
                return start + ticket % 2;

            case 'TWNBBOAT':
            case 'TWNKBOAT':
            case 'TWNNBOAT':
            case 'TWNSBOAT':
            case 'TWNWBOAT':
            case 'TWNZBOAT':
                return 1 + ticket % 9;

            case 'CMBTCAPB':
            case 'CMBTCAPK':
            case 'CMBTCAPN':
            case 'CMBTCAPS':
            case 'CMBTCAPW':
            case 'CMBTCAPZ':
                return 1 + ticket % 10;

            case 'CMBTHROB':
                return 1 + ticket % 18;
            case 'CMBTHROK':
                return 1 + ticket % 19;
            case 'CMBTHRON':
                return 1 + ticket % 19;
            case 'CMBTHROS':
                return 1 + ticket % 16;
            case 'CMBTHROW':
                return 1 + ticket % 16;
            case 'CMBTHROZ':
                return 1 + ticket % 18;

            case 'HEROFL00':
            case 'HEROFL01':
            case 'HEROFL02':
            case 'HEROFL03':
            case 'HEROFL04':
            case 'HEROFL05':
                return ticket % 5;

            case 'TWNBDOCK':
            case 'TWNKDOCK':
            case 'TWNNDOCK':
            case 'TWNSDOCK':
            case 'TWNWDOCK':
            case 'TWNZDOCK':

            case 'TWNBEXT0':
            case 'TWNKEXT0':
            case 'TWNNEXT0':
            case 'TWNSEXT0':
            case 'TWNWEXT0':
            case 'TWNZEXT0':

            case 'TWNBCAPT':
            case 'TWNBDW_3':
            case 'TWNBDW_4':
            case 'TWNBDW_5':
            case 'TWNBEXT1':
            case 'TWNBMOAT':
            case 'TWNBUP_3':
            case 'TWNBUP_4':
            case 'TWNKCSTL':
            case 'TWNKDW_0':
            case 'TWNKLTUR':
            case 'TWNKRTUR':
            case 'TWNKTHIE':
            case 'TWNKTVRN':
            case 'TWNNCSTL':
            case 'TWNNDW_2':
            case 'TWNNUP_2':
            case 'TWNSCAPT':
            case 'TWNSCSTL':
            case 'TWNSDW_0':
            case 'TWNSDW_1':
            case 'TWNSEXT1':
            case 'TWNSTHIE':
            case 'TWNSTVRN':
            case 'TWNSUP_1':
            case 'TWNSWEL2':
            case 'TWNWCAPT':
            case 'TWNWCSTL':
            case 'TWNWMOAT':
            case 'TWNZCSTL':
            case 'TWNZDW_0':
            case 'TWNZDW_2':
            case 'TWNZTHIE':
            case 'TWNZUP_2':
                return 1 + ticket % 5;

            case 'TWNBCSTL':
            case 'TWNKDW_2':
            case 'TWNKUP_2':
            case 'TWNNDW_5':
            case 'TWNNWEL2':
            case 'TWNWDW_0':
            case 'TWNWWEL2':
            case 'TWNZTVRN':
                return 1 + ticket % 6;

            case 'TWNKDW_4':
            case 'TWNKUP_4':
                return 1 + ticket % 7;

            case 'TAVWIN':
                return 2 + ticket % 20;

            case 'CMBTLOS1':
                return 1 + ticket % 30;
            case 'CMBTLOS2':
                return 1 + ticket % 29;
            case 'CMBTLOS3':
                return 1 + ticket % 22;
            case 'CMBTFLE1':
                return 1 + ticket % 43;
            case 'CMBTFLE2':
                return 1 + ticket % 26;
            case 'CMBTFLE3':
                return 1 + ticket % 25;
            case 'CMBTSURR':
                return 1 + ticket % 20;

            case 'WINCMBT':
                return 1 + ticket % 20;

            case 'MINIMON':
                return start + 1 + ticket % 6;

            case 'TWNNMAGE':
                return start + 1 + ticket % 5;

            case 'TWNBMAGE':
                return 4 == start ? start + 1 + ticket % 8 : 0;

            case 'SHNGANIM':
                return 1 + ticket % 39;

            case 'BTNSHNGL':
                return start + ticket % 4;

            case 'OBJNHAUN':
                return ticket % 15;

            case 'OBJNWATR':
                switch (start) {
                    case 0x00:
                        return start + (ticket % 11) + 1;

                    case 0x0C:

                    case 0x13:

                    case 0x26:

                    case 0x2D:

                    case 0x37:

                    case 0x3E:

                    case 0x45:

                    case 0x4C:
                    case 0x53:
                    case 0x5A:
                    case 0x61:
                    case 0x68:

                    case 0x6F:

                    case 0xBC:

                    case 0xC3:

                    case 0xE2:
                    case 0xE9:
                    case 0xF1:
                    case 0xF8:
                        return start + (ticket % 6) + 1;

                    case 0x76:
                    case 0x86:
                    case 0x96:
                    case 0xA6:
                        return start + (ticket % 15) + 1;

                    case 0xCA:
                    case 0xCE:
                    case 0xD2:
                    case 0xD6:
                    case 0xDA:
                    case 0xDE:
                        return start + (ticket % 3) + 1;

                    default:
                        return 0;
                }
                break;

            case 'OBJNWAT2':
                switch (start) {
                    case 0x03:
                    case 0x0C:
                        return start + (ticket % 6) + 1;

                    default:
                        return 0;
                }
                break;

            case 'OBJNCRCK':
                switch (start) {
                    case 0x50:
                    case 0x5B:
                    case 0x66:
                    case 0x71:
                    case 0x7C:
                    case 0x89:
                    case 0x94:
                    case 0x9F:
                    case 0xAA:

                    case 0xBE:

                    case 0xCA:
                        return start + (ticket % 10) + 1;

                    default:
                        return 0;
                }
                break;

            case 'OBJNDIRT':
                switch (start) {
                    case 0x99:
                    case 0x9D:
                    case 0xA1:
                    case 0xA5:
                    case 0xA9:
                    case 0xAD:
                    case 0xB1:
                    case 0xB5:
                    case 0xB9:
                    case 0xBD:
                        return start + (ticket % 3) + 1;

                    default:
                        return 0;
                }
                break;

            case 'OBJNDSRT':
                switch (start) {
                    case 0x36:
                    case 0x3D:
                        return start + (ticket % 6) + 1;

                    default:
                        return 0;
                }
                break;

            case 'OBJNGRA2':
                switch (start) {
                    case 0x17:
                    case 0x1B:
                    case 0x1F:
                    case 0x23:
                    case 0x27:
                    case 0x2B:
                    case 0x2F:
                    case 0x33:
                    case 0x37:
                    case 0x3B:
                        return start + (ticket % 3) + 1;

                    case 0x3F:
                    case 0x46:
                    case 0x4D:

                    case 0x54:

                    case 0x5D:
                    case 0x64:

                    case 0x6B:

                    case 0x72:
                        return start + (ticket % 6) + 1;

                    default:
                        return 0;
                }
                break;

            case 'OBJNLAV2':
                switch (start) {
                    case 0x00:

                    case 0x07:
                    case 0x0E:

                    case 0x15:
                        return start + (ticket % 6) + 1;

                    case 0x21:
                    case 0x2C:

                    case 0x37:
                    case 0x43:
                        return start + (ticket % 10) + 1;

                    default:
                        return 0;
                }
                break;

            case 'OBJNLAV3':
                switch (start) {
                    case 0x00:
                    case 0x0F:
                    case 0x1E:
                    case 0x2D:
                    case 0x3C:
                    case 0x4B:
                    case 0x5A:
                    case 0x69:
                    case 0x87:
                    case 0x96:
                    case 0xA5:

                    case 0x78:
                    case 0xB4:
                    case 0xC3:
                    case 0xD2:
                    case 0xE1:
                        return start + (ticket % 14) + 1;

                    default:
                        return 0;
                }
                break;

            case 'OBJNLAVA':
                switch (start) {
                    case 0x4E:
                    case 0x58:
                    case 0x62:
                        return start + (ticket % 9) + 1;

                    default:
                        return 0;
                }
                break;

            case 'OBJNMUL2':
                switch (start) {
                    case 0x3D:
                        return start + (ticket % 9) + 1;

                    case 0x1B:

                    case 0x53:
                    case 0x5A:
                    case 0x62:
                    case 0x69:

                    case 0x81:

                    case 0xA6:

                    case 0xAD:

                    case 0xB4:
                        return start + (ticket % 6) + 1;

                    case 0xBE:
                        return quantity ? start + (ticket % 6) + 1 : start + 7;

                    default:
                        return 0;
                }
                break;

            case 'OBJNMULT':
                switch (start) {
                    case 0x05:

                    case 0x0F:
                    case 0x19:
                        return start + (ticket % 9) + 1;

                    case 0x24:

                    case 0x2D:
                        return start + (ticket % 8) + 1;

                    case 0x5A:

                    case 0x61:
                    case 0x68:
                    case 0x7C:

                    case 0x83:
                        return start + (ticket % 6) + 1;

                    default:
                        return 0;
                }
                break;

            case 'OBJNSNOW':
                switch (start) {
                    case 0x04:

                    case 0x97:

                    case 0xA2:
                    case 0xA9:
                    case 0xB1:
                    case 0xB8:
                        return start + (ticket % 6) + 1;

                    case 0x60:
                    case 0x64:
                    case 0x68:
                    case 0x6C:
                    case 0x70:
                    case 0x74:
                    case 0x78:
                    case 0x7C:
                    case 0x80:
                    case 0x84:
                        return start + (ticket % 3) + 1;

                    default:
                        return 0;
                }
                break;

            case 'OBJNSWMP':
                switch (start) {
                    case 0x00:
                    case 0x0E:
                    case 0x2B:

                    case 0x07:
                    case 0x22:
                    case 0x33:

                    case 0x16:
                    case 0x3A:
                    case 0x43:
                    case 0x4A:
                        return start + (ticket % 6) + 1;

                    default:
                        return 0;
                }
                break;

            default:
                return 0;
        }
    }
    exports.getAnimFrame = getAnimFrame;

    function getIcn(id) {
        switch (id) {
            case 0x11:
                return 'TELEPORT1';
            case 0x12:
                return 'TELEPORT2';
            case 0x13:
                return 'TELEPORT3';
            case 0x14:
                return 'FOUNTAIN';
            case 0x15:
                return 'TREASURE';

            case 0x2C:
            case 0x2D:
            case 0x2E:
            case 0x2F:
                return 'OBJNARTI';

            case 0x30:
            case 0x31:
            case 0x32:
            case 0x33:
                return 'MONS32';

            case 0x38:
            case 0x39:
            case 0x3A:
            case 0x3B:
                return 'FLAG32';

            case 0x54:
            case 0x55:
            case 0x56:
            case 0x57:
                return 'MINIHERO';

            case 0x58:
            case 0x59:
            case 0x5A:
            case 0x5B:
                return 'MTNSNOW';

            case 0x5C:
            case 0x5D:
            case 0x5E:
            case 0x5F:
                return 'MTNSWMP';

            case 0x60:
            case 0x61:
            case 0x62:
            case 0x63:
                return 'MTNLAVA';

            case 0x64:
            case 0x65:
            case 0x66:
            case 0x67:
                return 'MTNDSRT';

            case 0x68:
            case 0x69:
            case 0x6A:
            case 0x6B:
                return 'MTNDIRT';

            case 0x6C:
            case 0x6D:
            case 0x6E:
            case 0x6F:
                return 'MTNMULT';

            case 0x74:
                return 'EXTRAOVR';

            case 0x78:
            case 0x79:
            case 0x7A:
            case 0x7B:
                return 'ROAD';

            case 0x7C:
            case 0x7D:
            case 0x7E:
            case 0x7F:
                return 'MTNCRCK';

            case 0x80:
            case 0x81:
            case 0x82:
            case 0x83:
                return 'MTNGRAS';

            case 0x84:
            case 0x85:
            case 0x86:
            case 0x87:
                return 'TREJNGL';

            case 0x88:
            case 0x89:
            case 0x8A:
            case 0x8B:
                return 'TREEVIL';

            case 0x8C:
            case 0x8D:
            case 0x8E:
            case 0x8F:
                return 'OBJNTOWN';

            case 0x90:
            case 0x91:
            case 0x92:
            case 0x93:
                return 'OBJNTWBA';

            case 0x94:
            case 0x95:
            case 0x96:
            case 0x97:
                return 'OBJNTWSH';

            case 0x98:
            case 0x99:
            case 0x9A:
            case 0x9B:
                return 'OBJNTWRD';

            case 0xA0:
            case 0xA1:
            case 0xA2:
            case 0xA3:
                return 'OBJNWAT2';

            case 0xA4:
            case 0xA5:
            case 0xA6:
            case 0xA7:
                return 'OBJNMUL2';

            case 0xA8:
            case 0xA9:
            case 0xAA:
            case 0xAB:
                return 'TRESNOW';

            case 0xAC:
            case 0xAD:
            case 0xAE:
            case 0xAF:
                return 'TREFIR';

            case 0xB0:
            case 0xB1:
            case 0xB2:
            case 0xB3:
                return 'TREFALL';

            case 0xB4:
            case 0xB5:
            case 0xB6:
            case 0xB7:
                return 'STREAM';

            case 0xB8:
            case 0xB9:
            case 0xBA:
            case 0xBB:
                return 'OBJNRSRC';

            case 0xC0:
            case 0xC1:
            case 0xC2:
            case 0xC3:
                return 'OBJNGRA2';

            case 0xC4:
            case 0xC5:
            case 0xC6:
            case 0xC7:
                return 'TREDECI';

            case 0xC8:
            case 0xC9:
            case 0xCA:
            case 0xCB:
                return 'OBJNWATR';

            case 0xCC:
            case 0xCD:
            case 0xCE:
            case 0xCF:
                return 'OBJNGRAS';

            case 0xD0:
            case 0xD1:
            case 0xD2:
            case 0xD3:
                return 'OBJNSNOW';

            case 0xD4:
            case 0xD5:
            case 0xD6:
            case 0xD7:
                return 'OBJNSWMP';

            case 0xD8:
            case 0xD9:
            case 0xDA:
            case 0xDB:
                return 'OBJNLAVA';

            case 0xDC:
            case 0xDD:
            case 0xDE:
            case 0xDF:
                return 'OBJNDSRT';

            case 0xE0:
            case 0xE1:
            case 0xE2:
            case 0xE3:
                return 'OBJNDIRT';

            case 0xE4:
            case 0xE5:
            case 0xE6:
            case 0xE7:
                return 'OBJNCRCK';

            case 0xE8:
            case 0xE9:
            case 0xEA:
            case 0xEB:
                return 'OBJNLAV3';

            case 0xEC:
            case 0xED:
            case 0xEE:
            case 0xEF:
                return 'OBJNMULT';

            case 0xF0:
            case 0xF1:
            case 0xF2:
            case 0xF3:
                return 'OBJNLAV2';
        }
        return null;
    }
    exports.getIcn = getIcn;
});
