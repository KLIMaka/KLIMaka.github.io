define(["require", "exports", '../../../libs/dataviewstream', '../../bitreader'], function(require, exports, D, B) {
    var RotatingXorStream = (function () {
        function RotatingXorStream(stream) {
            this.stream = stream;
            var e1 = this.stream.readUByte();
            var e2 = this.stream.readUByte();
            this.enc = e1 ^ e2;
            this.endChecksum = e1 | (e2 << 8);
            this.checksum = 0;
        }
        RotatingXorStream.prototype.read = function () {
            var crypted = this.stream.readUByte();
            var b = crypted ^ this.enc;
            this.checksum = (this.checksum - b) & 0xffff;
            this.enc = (this.enc + 0x1f) % 0x100;
            return b;
        };
        return RotatingXorStream;
    })();

    var VerticalXorStream = (function () {
        function VerticalXorStream(stream, width) {
            this.stream = stream;
            this.x = 0;
            this.y = 0;
            this.width = width / 2;
            this.lastLine = new Array(width);
        }
        VerticalXorStream.prototype.read = function () {
            var b = this.stream.read();

            if (this.y > 0) {
                b = b ^ this.lastLine[this.x];
            }
            this.lastLine[this.x] = b;
            if (this.x < this.width - 1) {
                this.x++;
            } else {
                this.y++;
                this.x = 0;
            }
            return b;
        };
        return VerticalXorStream;
    })();

    var HuffmanNode = (function () {
        function HuffmanNode() {
            this.data = -1;
        }
        return HuffmanNode;
    })();

    var HuffmanStream = (function () {
        function HuffmanStream(r) {
            this.bitstream = new B.BitReader(r);
            this.tree = this.loadNode(this.bitstream);
        }
        HuffmanStream.prototype.loadNode = function (r) {
            if (r.readBit() == 0) {
                var left = this.loadNode(r);
                r.readBit();
                var right = this.loadNode(r);
                var node = new HuffmanNode();
                node.left = left;
                node.right = right;
                return node;
            } else {
                var node = new HuffmanNode();
                node.data = r.readBits(8);
                return node;
            }
        };

        HuffmanStream.prototype.read = function () {
            var node = this.tree;
            while (node.data == -1) {
                if (!this.bitstream.readBit())
                    node = node.left;
                else
                    node = node.right;
            }
            return node.data;
        };
        return HuffmanStream;
    })();
    exports.HuffmanStream = HuffmanStream;

    var fa0 = [
        { 'm': 1 },
        { 's': 2 },
        { 'q': 3 },
        { '0': 4 }
    ];
    var fa1 = [
        { 'm': 1 },
        { 's': 2 },
        { 'q': 3 },
        { '1': 4 }
    ];

    function search(r, disk) {
        var fa = disk == '0' ? fa0 : fa1;
        var state = 0;
        var length = 0;
        while (!r.eoi() && state != 4) {
            var b = r.readByteString(1);
            var state = fa[state][b] | 0;
            length++;
        }
        return length;
    }

    function readMsqBlocks(r) {
        var sign = r.readByteString(4);
        if (sign != 'msq0' && sign != 'msq1')
            throw new Error('No msq header found in file');
        var disk = sign[3];
        var blocks = new Array();
        var start = 0;
        var end = 4;

        while (true) {
            end += search(r, disk);
            if (!r.eoi()) {
                blocks.push([start, end - 4 - start]);
                start = end - 4;
            } else {
                break;
            }
        }
        blocks.push([start, end - start]);
        return blocks;
    }

    var TYPE_SAVEGAME = 'TYPE_SAVEGAME';
    var TYPE_SHOPLIST = 'TYPE_SHOPLIST';
    var TYPE_MAP = 'TYPE_MAP';

    function isSaveGame(bytes) {
        var seen = {};
        for (var i = 0; i < 8; i++) {
            var b = bytes[i];
            if (b > 7)
                return false;
            if (b != 0 && seen[b] == 1)
                return false;
            seen[b] = 1;
        }
        return true;
    }

    function isShopItems(bytes) {
        if (bytes[0] == 0x60 && bytes[1] == 0x60 && bytes[2] == 0x60)
            return true;
        return false;
    }

    function getType(r, size) {
        var sign = r.readByteString(4);
        if (sign != 'msq0' && sign != 'msq1')
            throw new Error('No msq header found in file');
        var xorStream = new RotatingXorStream(r);
        var bytes = new Array(9);
        for (var i = 0; i < 9; i++)
            bytes[i] = xorStream.read();

        if (size == 4614 && isSaveGame(bytes)) {
            return TYPE_SAVEGAME;
        } else if (size == 766 && isShopItems(bytes)) {
            return TYPE_SHOPLIST;
        } else {
            return TYPE_MAP;
        }
    }

    var ActionClassMap = (function () {
        function ActionClassMap(r, mapSize) {
            this.mapSize = mapSize;
            this.actionClasses = new Array(mapSize * mapSize);
            for (var i = 0; i < mapSize * mapSize; i += 2) {
                var b = r.readUByte();
                this.actionClasses[i] = (b >> 4) & 0x0f;
                this.actionClasses[i + 1] = b & 0x0f;
            }
        }
        ActionClassMap.prototype.get = function (x, y) {
            return this.actionClasses[y * this.mapSize + y];
        };
        return ActionClassMap;
    })();
    exports.ActionClassMap = ActionClassMap;

    var ActionMap = (function () {
        function ActionMap(r, mapSize) {
            this.mapSize = mapSize;
            this.actions = new Array(mapSize * mapSize);
            for (var i = 0; i < mapSize * mapSize; i++)
                this.actions[i] = r.readUByte();
        }
        ActionMap.prototype.get = function (x, y) {
            return this.actions[y * this.mapSize + y];
        };
        return ActionMap;
    })();
    exports.ActionMap = ActionMap;

    var CentralDirectory = (function () {
        function CentralDirectory(r) {
            this.actionClassMasterTable = new Array(16);
            this.stringsOffset = r.readUShort();
            this.monsterNamesOffset = r.readUShort();
            this.monsterDataOffset = r.readUShort();
            for (var i = 0; i < 16; i++)
                this.actionClassMasterTable[i] = r.readUShort();
            this.nibble6Offset = r.readUShort();
            this.npcOffset = r.readUShort();
            if (r.readUShort() != 0) {
                throw new Error('Last offset must be 0');
            }
        }
        return CentralDirectory;
    })();

    var Info = (function () {
        function Info(r) {
            this.unknown0 = r.readUByte();
            this.unknown1 = r.readUByte();
            this.encounterFrequency = r.readUByte();
            this.tileset = r.readUByte();
            this.lastMonster = r.readUByte();
            this.maxEncounters = r.readUByte();
            this.backgroundTile = r.readUByte();
            this.timeFactor = r.readUShort();
            this.unknown9 = r.readUByte();
        }
        return Info;
    })();
    exports.Info = Info;

    var BattleSettings = (function () {
        function BattleSettings(r) {
            this.strings = new Array(37);
            for (var i = 0; i < 37; i++)
                this.strings[i] = r.readUByte();
        }
        return BattleSettings;
    })();
    exports.BattleSettings = BattleSettings;

    var TileMap = (function () {
        function TileMap(r) {
            var mapSize = Math.sqrt(r.readUInt());
            if (mapSize != 32 && mapSize != 64)
                throw new Error('Invalid Tile Map header');

            this.unknown = r.readUInt();
            var huffmanStream = new HuffmanStream(r);
            this.map = new Array(mapSize * mapSize);
            for (var i = 0; i < this.map.length; i++)
                this.map[i] = huffmanStream.read();
        }
        return TileMap;
    })();
    exports.TileMap = TileMap;

    var Strings = (function () {
        function Strings(r, end) {
            this.strings = [];
            var start = r.mark();
            var charTable = new Array(60);
            for (var i = 60; i > 0; i--)
                charTable[60 - i] = r.readUByte();
            var tmp = r.readUShort();
            var quantity = tmp / 2;
            var stringOffsets = new Array();
            stringOffsets.push(tmp);
            for (var i = 1; i < quantity; i++) {
                tmp = r.readUShort();
                if ((tmp + start + 60 >= end) || (tmp < stringOffsets[i - 1])) {
                    if (i == quantity - 1) {
                        continue;
                    } else {
                        throw new Error("Error parsing strings");
                    }
                }
                stringOffsets.push(tmp);
            }
            for (var i = 0; i < stringOffsets.length; i++) {
                r.setOffset(stringOffsets[i] + 60 + start);
                this.readStringGroup(r, charTable, end);
            }
        }
        Strings.prototype.readStringGroup = function (r, charTable, end) {
            var bitStream = new B.BitReader(r);
            for (var j = 0; j < 4; j++) {
                var upper = false;
                var high = false;
                var str = '';
                outer:
                while (true) {
                    if (r.mark() > end)
                        return;
                    var index = bitStream.readBits(5, true);
                    switch (index) {
                        case 0x1f:
                            high = true;
                            break;
                        case 0x1e:
                            upper = true;
                            break;
                        default:
                            var char_ = charTable[index + (high ? 0x1e : 0)];
                            if (char_ == 0)
                                break outer;
                            var s = String.fromCharCode(char_);
                            if (upper)
                                s = s.toUpperCase();
                            str += s;
                            upper = false;
                            high = false;
                    }
                }
                this.strings.push(str);
            }
        };
        return Strings;
    })();
    exports.Strings = Strings;

    var Skills = (function () {
        function Skills(r) {
            this.skills = new Array();
            for (var i = 0; i < 30; i++) {
                this.skills.push([r.readUByte(), r.readUByte()]);
            }
        }
        return Skills;
    })();
    exports.Skills = Skills;

    var Items = (function () {
        function Items(r) {
            this.items = new Array();
            for (var i = 0; i < 30; i++) {
                var id = r.readUByte();
                var load = r.readUByte();
                if (id != 0)
                    this.items.push([id, load]);
            }
        }
        return Items;
    })();
    exports.Items = Items;

    var Char = (function () {
        function Char(r) {
            this.name = r.readByteString(14);
            this.str = r.readUByte();
            this.iq = r.readUByte();
            this.lck = r.readUByte();
            this.spd = r.readUByte();
            this.agi = r.readUByte();
            this.dex = r.readUByte();
            this.chr = r.readUByte();
            var tmp = r.readUInt();
            this.money = tmp & 0xffffff;
            this.gender = (tmp >> 16) & 0xff;
            this.natio = r.readUByte();
            this.ac = r.readUByte();
            this.maxCon = r.readUShort();
            this.con = r.readUShort();
            this.weapon = r.readUByte();
            this.skillPoints = r.readUByte();
            tmp = r.readUInt();
            this.exp = tmp & 0xffffff;
            this.level = (tmp >> 16) & 0xff;
            this.armor = r.readUByte();
            this.lastCon = r.readUShort();
            this.afflictions = r.readUByte();
            this.isNpc = r.readUByte();
            this.unknown2A = r.readUByte();
            this.itemRefuse = r.readUByte();
            this.skillRefuse = r.readUByte();
            this.attribRefuse = r.readUByte();
            this.tradeRefuse = r.readUByte();
            this.unknown2F = r.readUByte();
            this.joinString = r.readUByte();
            this.willingness = r.readUByte();
            this.rank = r.readByteString(25);
            r.skip(53);
            this.skills = new Skills(r);
            r.skip(1);
            this.items = new Items(r);
            r.skip(7);
        }
        return Char;
    })();
    exports.Char = Char;

    var NPCS = (function () {
        function NPCS(r) {
            this.chars = [];
            var offset = r.mark();
            if (r.readUShort() != 0)
                return;

            offset += 2;
            var quantity = (r.readUShort() - offset) / 2;
            if (quantity < 1 || quantity > 255)
                return;

            offset += quantity * 2;
            for (var i = 1; i < quantity; i++) {
                var tmp = r.readUShort();
                if (tmp != (offset + i * 0x100))
                    return;
            }

            for (var i = 0; i < quantity; i++)
                this.chars.push(new Char(r));
        }
        return NPCS;
    })();
    exports.NPCS = NPCS;

    var Monster = (function () {
        function Monster(r, name) {
            this.name = name;
            this.exp = r.readUShort();
            this.skill = r.readUByte();
            this.randomDamage = r.readUByte();
            var tmp = r.readUByte();
            this.maxGroupSize = tmp >> 4;
            this.ac = tmp & 15;
            var tmp = r.readUByte();
            this.fixedDamage = tmp >> 4;
            this.weaponType = tmp & 15;
            this.type = r.readUByte();
            this.picture = r.readUByte();
        }
        return Monster;
    })();
    exports.Monster = Monster;

    var Monsters = (function () {
        function Monsters(r, quantity, dataOffset) {
            this.monsters = [];
            var names = [];
            for (var i = 0; i < quantity; i++) {
                var name = '';
                var b = r.readUByte();
                while (b != 0) {
                    name += String.fromCharCode(b);
                    b = r.readUByte();
                }
                names.push(name);
            }

            r.setOffset(dataOffset);
            for (var i = 0; i < quantity; i++) {
                this.monsters.push(new Monster(r, names[i]));
            }
        }
        return Monsters;
    })();
    exports.Monsters = Monsters;

    var GameMap = (function () {
        function GameMap(r, size) {
            var sign = r.readByteString(4);
            if (sign != 'msq0' && sign != 'msq1')
                throw new Error('No msq header found in file');

            var start = r.mark();
            var xorStream = new RotatingXorStream(r);
            var bytes = new Uint8Array(6189);
            for (var i = 0; i < 6189; i++) {
                bytes[i] = xorStream.read();
            }

            var mapSize = this.getMapSize(bytes);
            var encSize = this.getEncryptionSize(bytes, mapSize);

            bytes = new Uint8Array(size - 6);
            r.setOffset(start);
            xorStream = new RotatingXorStream(r);
            for (var i = 0; i < encSize; i++)
                bytes[i] = xorStream.read();
            for (var i = encSize; i < bytes.length; i++)
                bytes[i] = r.readUByte();

            var tilemapOffset = this.getTilemapOffset(bytes, mapSize);
            var stream = new D.DataViewStream(bytes.buffer, true);
            this.mapSize = mapSize;
            this.size = size;
            this.tilemapOffset = tilemapOffset;
            this.read(stream);
        }
        GameMap.prototype.read = function (stream) {
            this.actionClassMap = new ActionClassMap(stream, this.mapSize);
            this.actionMap = new ActionMap(stream, this.mapSize);
            var centralDirectory = new CentralDirectory(stream);
            stream.readUByte();
            this.info = new Info(stream);
            this.battleSettings = new BattleSettings(stream);

            stream.setOffset(this.tilemapOffset);
            this.tileMap = new TileMap(stream);

            stream.setOffset(centralDirectory.stringsOffset);
            this.strings = new Strings(stream, this.tilemapOffset);

            stream.setOffset(centralDirectory.npcOffset);
            this.npcs = new NPCS(stream);

            var monstersOffset = centralDirectory.monsterDataOffset;
            if (monstersOffset != 0) {
                var quantity = (centralDirectory.stringsOffset - monstersOffset) / 8;
                stream.setOffset(centralDirectory.monsterNamesOffset);
                this.monsters = new Monsters(stream, quantity, monstersOffset);
            }
        };

        GameMap.prototype.getMapSize = function (bytes) {
            var is64 = false;
            var offset = 64 * 64 * 3 / 2;
            if ((offset + 44 < bytes.length) && (bytes[offset + 44] == 64 && bytes[offset + 6] == 0 && bytes[offset + 7] == 0)) {
                is64 = true;
            }

            var is32 = false;
            offset = 32 * 32 * 3 / 2;
            if ((offset + 44 < bytes.length && bytes[offset + 6] == 0 && bytes[offset + 7] == 0) && (bytes[offset + 44] == 32)) {
                is32 = true;
            }

            if (is32 == is64)
                throw new Error('Cannot determine map size');

            return is64 ? 64 : 32;
        };

        GameMap.prototype.getEncryptionSize = function (bytes, mapSize) {
            var offset = mapSize * mapSize * 3 / 2;
            return ((bytes[offset] & 0xff) | ((bytes[offset + 1] & 0xff) << 8));
        };

        GameMap.prototype.getTilemapOffset = function (bytes, mapSize) {
            var i = bytes.length - 9;
            while (i > 0) {
                if ((bytes[i] == 0) && (bytes[i + 1] == ((mapSize * mapSize) >> 8)) && (bytes[i + 2] == 0) && (bytes[i + 3] == 0) && (bytes[i + 6] == 0) && (bytes[i + 7] == 0)) {
                    return i;
                }
                i--;
            }
            throw new Error('Unable to find tiles offset');
        };
        return GameMap;
    })();
    exports.GameMap = GameMap;

    var Game = (function () {
        function Game(file) {
            this.maps = [];
            var r = new D.DataViewStream(file, true);
            var blocks = readMsqBlocks(r);
            for (var i = 0; i < blocks.length; i++) {
                var block = blocks[i];
                r.setOffset(block[0]);
                var type = getType(r, block[1]);
                r.setOffset(block[0]);

                switch (type) {
                    case TYPE_SAVEGAME:
                        break;
                    case TYPE_SHOPLIST:
                        break;
                    case TYPE_MAP:
                        this.maps.push(new GameMap(r, block[1]));
                        break;
                }
            }
        }
        return Game;
    })();
    exports.Game = Game;

    var Pic = (function () {
        function Pic(hs, w, h) {
            var vxor = new VerticalXorStream(hs, w);
            this.pixels = new Uint8Array(w * h);
            for (var i = 0; i < w * h; i += 2) {
                var b = vxor.read();
                this.pixels[i] = b >> 4;
                this.pixels[i + 1] = b & 0xf;
            }
        }
        return Pic;
    })();
    exports.Pic = Pic;

    var HTDSTileset = (function () {
        function HTDSTileset(r) {
            this.pics = [];
            var size = r.readUInt();
            var sign = r.readByteString(3) + r.readUByte();
            if (sign != 'msq0' && sign != 'msq1')
                throw new Error('No msq header found in file');

            var quantity = size * 2 / 16 / 16;
            var huffmanStream = new HuffmanStream(r);
            for (var i = 0; i < quantity; i++) {
                this.pics.push(new Pic(huffmanStream, 16, 16));
            }
        }
        return HTDSTileset;
    })();
    exports.HTDSTileset = HTDSTileset;

    var HTDS = (function () {
        function HTDS(file) {
            this.tilesets = [];
            var r = new D.DataViewStream(file, true);
            while (!r.eoi())
                this.tilesets.push(new HTDSTileset(r));
        }
        return HTDS;
    })();
    exports.HTDS = HTDS;
});
