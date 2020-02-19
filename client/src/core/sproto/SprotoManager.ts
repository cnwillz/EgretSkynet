namespace sproto {
    const SPROTO_TARRAY = 0x80;
    const SPROTO_CHUNK_SIZE = 1000;
    const SPROTO_SIZEOF_LENGTH = 4;
    const SPROTO_SIZEOF_HEADER  = 2;
    const SPROTO_SIZEOF_FIELD  = 2;
    const SPROTO_SIZEOF_INT64 = 8;
    const SPROTO_SIZEOF_INT32 = 4;

    const SPROTO_ERROR_TYPE = -3;

    const SPROTO_ENCODE_BUFFERSIZE = 2050;

    export const SPROTO_REQUEST = 0;
    export const SPROTO_RESPONSE = 1;

    class SprotoField {
        constructor(public name: string, public tag: number, public type: string) {
        }
    }


    class SprotoType {
        public f: SprotoField[] = [];
        public maxn: number = 0;

        constructor(public name: string) {
        }
    }

    class SprotoProtocol {
        public st: SprotoType[] = [null, null];
        constructor(public name: string, public tag: number) {
        }
    }

    export class SprotoManager {
        private t: SprotoType[] = [];
        private p: SprotoProtocol[] = [];
        private buffer: bufferjs.Buffer;
        //private sz: number;
        private static sp_tb: SprotoManager[] = [];
        //private header_tmp;

        constructor(public ctx: string,
            public tagProtocols = []
            ) {

            ctx = this.common_filter(ctx);
            this.parse(ctx);
            // this.buffer = Buffer.allocUnsafe(4);
            this.buffer = bufferjs.Buffer.allocUnsafe(2048);
            // this.header_tmp = {type: null, session: null};
        }

        // 注释过滤
        private common_filter(text: string) {
            return text.replace(/#.*\n/g, "\n");
        }

        private parse(text: string) {
            let types = text.match(/\.\w+[\s\n]*{[^{}]+}/ig);
            let errsyntax = text.match(/\n\w+[\s\n]*{/ig);

            if (errsyntax) {
                errsyntax.forEach(protoname	=> {  
                    protoname += " ... }";
                    console.error("[sproto error]: syntax error at proto name:", protoname.replace(/\n/, ""));
                });
            }

            if (this.isNull(types) === false) {
                for (let i = 0; i < types.length; i++) {
                    let mtype = types[i];
                    let typestr = mtype.match(/\.\w+/i);
                    if (typestr && typestr[0] != null) {
                        let stype = this.type_create(typestr);
                        this.t[stype.name] = stype;
                    }
                }
            }

            let protocols = text.match(/\w+\s+\-?\d+\s*{[\n\t\s]*(request\s*{[^{}]*})?[\n\t\s]*(response\s*{[^{}]*})?[\n\t\s]*}/ig);
            if (this.isNull(protocols) === false) { 
                for (let i = 0; i < protocols.length; ++i) {
                    this.protocol_create(protocols[i]);
                }
            }

        }

        protocol_create(protocol: string) {
            let nametag = protocol.match(/\w+\s+\-?\d+/i)[0];
            let arr = nametag.split(/\s+/);
            let name = arr[0];
            let tag = Number(arr[1]);

            if (tag < 0) {
                console.error("[sproto error]: syntax error at tag(%d) number less 0 at protocol %s", tag, name);
            }

            let proto = new SprotoProtocol(name, tag);
            this.p[name] = proto;
            this.tagProtocols[tag] = proto;

            let requeststr = protocol.match(/request\s*{[^{}]*}/g);
            let responsestr = protocol.match(/response\s*{[^{}]*}/g);
            if (requeststr) {
                let req = ["request"];
                req["input"] = requeststr[0];
                proto.st[SPROTO_REQUEST] = this.type_create(req, name);
            }

            if (responsestr) {
                let resp = ["response"];
                resp["input"] = responsestr[0];
                proto.st[SPROTO_RESPONSE] = this.type_create(resp, name);
            }
        }

        private type_create(type, protoname?) {
            let name = type[0];
            if (name.charAt(0) === ".") {
                name = name.substr(1, name.length); // substr 去掉第一个字符的点.
            }

            let stype = new SprotoType(name);
            let content = type.input.replace(/.?{|}/g, "");
            let lines = content.match(/\w+\s+\-?\d+\s*:\s*\*?\w+/gi);
            let errsyntax = content.match(/[a-z]+\s*:\s*\*?[a-z]+/i)

            if (errsyntax) {
                console.error("[sproto error]: syntax error at tag number:", errsyntax[0]);
            }

            if (this.isNull(lines)) {
                return stype;
            }

            let maxn = lines.length;
            let offset = 8888888888;
            let offcounter = 0;
            let tags = []

            for (let i of lines) {
                let ft = i.split(/\s*(\-?\d+)?\s*:\s*/g);
                let tag = Number(ft[1]);
                let f = new SprotoField(ft[0], tag, ft[2]);
                stype.f.push(f);

                if (tag < 0) {
                    console.error("[sproto error]: syntax error at tag(%d) number less 0 in type %s", tag, protoname?protoname:name);
                }

                if (tags[tag]) {
                    console.error("[sproto error]: redefine tag %d in type %s", tag, protoname?protoname:name);
                }

                if (tag - offset > 1) {
                    ++offcounter;
                }

                offset = tag;
                tags[tag] = true;
            }

            maxn += stype.f[0].tag + offcounter;
            stype.maxn = maxn;

            return stype;
        }

        private isNull(val) {
            if (val === undefined || val === null) {
                return true;
            }

            return false;
        }

        private vquerytype(name: string, reqdecode?) {
            if (this.isNull(reqdecode)) {
                return this.t[name];
            } else {
                let sp = SprotoManager.sp_tb[reqdecode];
                return sp.t[name];
            }
        }

        private getType=Object.prototype.toString

        private checkType(value, type) {
            const typestr = this.getType.call(value);
            let cmp = typestr.substring(8, typestr.length - 1);
            cmp = cmp.toLowerCase();

            if (cmp == type) {
                return true;
            } else {
                return cmp;
            }
        }

        private uint64_rshift(num, offset){
            return Math.floor(num / Math.pow(2, offset));
        }

        private checkInteger(num, offset:number = 31) {
        	let numh = this.uint64_rshift(num, offset);
            if (numh === 0 || numh === -1) {
            	return 4;
            } else {
            	return 8;
            }
        }

        private uint32_to_uint64(data, data_idx: number, negative: number|boolean) {
        	if (negative === 0 || negative === false) { 
        		data[data_idx++] = 0;
        		data[data_idx++] = 0;
        		data[data_idx++] = 0;
        		data[data_idx++] = 0;
        	} else {
        		data[data_idx++] = 0xff;
        		data[data_idx++] = 0xff;
        		data[data_idx++] = 0xff;
        		data[data_idx++] = 0xff;
        	}
        }

        private encode_integer_array(v, args, data, data_idx, size) {
            let fillflag = data_idx;
            let array_index = data_idx + 1;
            let intlen = SPROTO_SIZEOF_INT32;

            size -= (1 + SPROTO_SIZEOF_LENGTH);
            if (size < 0) {
                return -1;
            }

            for (let i = 0; i < v.length; i++) {
                args.value = v[i];
                args.i = i;
                if (this.checkType(args, "number") === null) {
                    return SPROTO_ERROR_TYPE;
                }
                
                let value = v[i];
                let sz = this.checkInteger(value);

                if (sz === SPROTO_SIZEOF_INT32) { 
                    data[array_index++] = value & 0xff;
                    data[array_index++] = (value >> 8) & 0xff;
                    data[array_index++] = (value >> 16) & 0xff;
                    data[array_index++] = (value >> 24) & 0xff;
                    if (intlen === SPROTO_SIZEOF_INT64) {
                        this.uint32_to_uint64(data, array_index, value & 0x80000000);
                        array_index += 4;
                    }
                } else {
                    if (sz != SPROTO_SIZEOF_INT64)
                        return -1;

                    if (intlen === SPROTO_SIZEOF_INT32) {
                        size -= (SPROTO_SIZEOF_INT64 * (i - 1));
                        if (size < 0) {
                            return -1;
                        }

                        // 对前面 i-1 个32位的整数重新编码
                        for (let j = i - 1; j >= 0; --j) {
                            let start8 = data_idx + 1 + j * SPROTO_SIZEOF_INT64;
                            let start4 = data_idx + 1 + j * SPROTO_SIZEOF_INT32;
                            let k = start8;
                            
                            for (; k < start8 + 4; ++k) {
                                data[k] = data[start4 + k - start8];
                            }

                            //根据第三位决定后4位是否全为 0 或者全 0xff
                            this.uint32_to_uint64(data, k, data[start8 + 3] & 0x80);	
                        }

                        array_index = (data_idx + 1) + i * SPROTO_SIZEOF_INT64; //重新设置 array_index 起始位置
                    }

                    data[array_index++] = value & 0xff;
                    data[array_index++] = (value >> 8) & 0xff;
                    data[array_index++] = (value >> 16) & 0xff;
                    data[array_index++] = (value >> 24) & 0xff;

                    let hi =  this.uint64_rshift(value, 32);
                    data[data_idx + 8] = hi & 0xff;
                    data[data_idx + 9] = (hi >> 8) & 0xff;
                    data[data_idx + 10] = (hi >> 16) & 0xff;
                    data[data_idx + 11] = (hi >> 24) & 0xff;

                    intlen = SPROTO_SIZEOF_INT64;
                }

                size -= intlen;
                if (size < 0 || size < SPROTO_SIZEOF_INT64) {
                    return -1;
                }
            }

            if (array_index === data_idx + 1) {
                return 0;
            }

            data[fillflag] = intlen;
            return array_index - data_idx;
        }

        private checkValue(args, type: string) {
        	let value = args.value;
        	let res = this.checkType(value, type);
        	if (res !== true) {
        		console.error("[sproto error]: .%s[%d] is not an %s (Is a %s)", args.name, args.i, type, res, value);
        		return null;
        	}

            return type;
        }

        private fillSize(data, data_idx, sz){
            data[data_idx] = sz & 0xff;
            data[data_idx+1] = (sz >> 8) & 0xff;
            data[data_idx+2] = (sz >> 16) & 0xff;
            data[data_idx+3] = (sz >> 24) & 0xff;
            return sz + SPROTO_SIZEOF_LENGTH;
        }

        private encode_string_array(v, args, data, data_idx, size) {
            let start = data_idx;

            for (var i = 0; i < v.length; ++i) {
                args.value = v[i];
                args.i = i;
                if (this.checkValue(args, "string") === null) {
                    return SPROTO_ERROR_TYPE;
                }

                let tu = bufferjs.Buffer.from(v[i]);
                let len = tu.length;
                size -= (SPROTO_SIZEOF_LENGTH + len);
                if (size < 0) {
                    return -1;
                }


                let sz = this.fillSize(data, data_idx, len);
                let pos = data_idx + SPROTO_SIZEOF_LENGTH;
                data.fill(tu, pos, pos + len);

                data_idx += sz;
            }

            return data_idx - start;
        }


        private encode_boolean_array(v, args, data, data_idx, size) {
            let start = data_idx;
            for (var i = 0; i < v.length; ++i) {
                args.value = v[i];
                args.i = i;
                if (this.checkValue(args, "boolean") === null) {
                    return SPROTO_ERROR_TYPE;
                }

                size -= SPROTO_SIZEOF_LENGTH;
                if (size < 0) {
                    return -1;
                }

                data[data_idx++] = v[i] ? 1 : 0;
            }

            return data_idx - start;
        }

        private encode_object_array(v, args, data, data_idx, size) {
            let sz = 0;
            let start = data_idx;
            let total = 0;
            for (let i = 0; i < v.length; ++i) {
                size -= SPROTO_SIZEOF_LENGTH;
                if (size < 0) {
                    return -1;
                }
                sz = this.lencode(args.type, v[i], start + SPROTO_SIZEOF_LENGTH, null, args.spindex);
                if (sz < 0) {
                    if (sz === SPROTO_ERROR_TYPE) {
                        return SPROTO_ERROR_TYPE;
                    }
                    return sz;
                }

                let tmpsz = this.fillSize(data, start, sz);
                size -= tmpsz;
                start += tmpsz;

                total += sz + SPROTO_SIZEOF_LENGTH;
            }

            return total;
        }

        private encode_array(v, args, data, data_idx, size) {
            let value = null;
            let sz = 0;
            size -= SPROTO_SIZEOF_LENGTH;

            if (size < 0) {
                return -1;
            }

            switch(args.type) {
            case "integer":
                sz = this.encode_integer_array(v, args, data, data_idx + SPROTO_SIZEOF_LENGTH, size);
                break;
            case "string":
                sz = this.encode_string_array(v, args, data, data_idx + SPROTO_SIZEOF_LENGTH, size);
                break;
            case "boolean":
                sz = this.encode_boolean_array(v, args, data, data_idx + SPROTO_SIZEOF_LENGTH, size);
                break;
            default: 
                sz = this.encode_object_array(v, args, data, data_idx + SPROTO_SIZEOF_LENGTH, size);
                break;
            }

            if (sz < 0) {
                return sz;
            }
            return this.fillSize(data, data_idx, sz);
        }

        private write_ff(buffer, ff_srcstart, dstbuffer, ff_desstart, n) {
            let i;
            let align8_n = (n + 7) & (~7); //8的倍数
            dstbuffer[ff_desstart] = 0xff;
            dstbuffer[ff_desstart + 1] = align8_n / 8 - 1;

            let start = ff_desstart + 2;
            let str = "";

            for (let i = start; i < start + n; ++i) {
                dstbuffer[i] = buffer[ff_srcstart + i - start];
                str += dstbuffer.toString("hex", i, i + 1) + " ";
            }

            start += n;
            for(let i = 0; i < align8_n - n; ++i){
                dstbuffer[start + i] = 0;
            }
        }

        getProtocol(name: string) {
            return this.p[name];
        }

        /**
         * typeName 协议名
         * tbl 协议数据
         * st 协议类
         * spindex SprotoManager编号
         */
        encode(typeName: string, tbl: any, st?, spindex?) {
            let sz = 0;
            while(true) {
                sz = this.lencode(typeName, tbl, 0, st, spindex);
                if (sz < 0) {
                    if (sz === SPROTO_ERROR_TYPE) {
                        return;
                    }

                    let alloc_sz = this.buffer.length * 2;
                    if (alloc_sz > 65535) {
                        console.error("[sproto warning]: alloc memory more 6k");
                        throw new Error('Perhaps memory overflow!');
                        // console.log(this.buffer)
                        // return null;
                    }
                    this.buffer = bufferjs.Buffer.allocUnsafe(alloc_sz);
                } else {
                    break;
                }
            }

            let result = bufferjs.Buffer.allocUnsafe(sz);
            this.buffer.copy(result, 0, 0, result.length);
            return result;
        }

        private pack_seg(srcbuffer, srcidx, dstbuffer, dstidx, n) {
            let header = dstidx++;
            let notzero = 0;
            let bits = 0;
            
            for (var i = 0; i < 8; ++i) {
                if(srcbuffer[srcidx + i] !== 0) {
                    dstbuffer[dstidx++] = srcbuffer[srcidx + i];
                    bits |= (1 << i);
                    ++notzero;
                }
            }

            if ((notzero === 6 || notzero === 7) && n > 0) {
                notzero = 8;
            }

            if (notzero === 8) {
                if (n > 0) {
                    return 8;
                }
                return 10;
            }

            dstbuffer[header] = bits;
            return notzero + 1;
        }

        private toWord(p, pos) {
            return p[pos] | p[pos + 1]<<8;
        }

        private toDword(p, pos, uint = false) {
            let num = p[pos] | p[pos + 1] << 8 | p[pos + 2] << 16 | p[pos + 3] << 24;
            if (uint) {
                num = num >>> 0;
            }

            return num;
        }

        private querytype(name: string) {
            return this.t[name];
        }

        private findtag(typename: string, tag: number, st?, reqdecode?) {
            let type = null;
            if (!this.isNull(reqdecode) && this.isNull(st)) {
                let sp = SprotoManager.sp_tb[reqdecode];
                type = sp.t[typename];
            } else {
                if (st) {
                    type = st;
                } else {
                    type = this.querytype(typename);
                }
            }

            for (let f of type.f) {
                if (tag === f.tag) {
                    return f;
                }
            }

            return null;
        }

        private hi_low_uint64(low, hi){
            var value = (hi & 0xFFFFFFFF) * 0x100000000 + low;
            return value;
        }

        private decode_array(type: string, buffer, data_idx: number, sz: number, st?, reqdecode?) {
            let result :any= [];

            switch (type) {
            case "integer":
                let len = buffer[data_idx++];
                --sz;
                if (len === SPROTO_SIZEOF_INT32) {
                    if (sz % SPROTO_SIZEOF_INT32 != 0) {
                        return false;
                    }

                    for (let i = 0; i < sz/SPROTO_SIZEOF_INT32; ++i) {
                        result[i] = this.toDword(buffer, data_idx);
                        data_idx += SPROTO_SIZEOF_INT32;
                    }
                } else if (len === SPROTO_SIZEOF_INT64) {
                    if (sz % SPROTO_SIZEOF_INT64 !== 0) {
                        return false;
                    }

                    for (let i = 0; i < sz/SPROTO_SIZEOF_INT64; ++i) {
                        let	low = this.toDword(buffer, data_idx, true);
                        let	hi = this.toDword(buffer, data_idx + SPROTO_SIZEOF_INT32, true);

                        result[i] = this.hi_low_uint64(low, hi);
                        data_idx += SPROTO_SIZEOF_INT64;
                    }	
                } else {
                    result = false;
                }
                break;
            case "string":
                let i = 0;
                for (;;) {
                    sz -= SPROTO_SIZEOF_LENGTH;
                    let len = this.toDword(buffer, data_idx);
                    data_idx += SPROTO_SIZEOF_LENGTH;
                    sz -= len;

                    result[i++] = buffer.toString("utf8", data_idx, data_idx + len);

                    data_idx += len;
                    if (sz == 0) {
                        break;
                    } else if (sz < 0) {
                        return false;
                    }
                }
                break;
            case "boolean":
                for (let i = 0; i < sz; ++i) {
                    result[i] = buffer[data_idx + i] === 0 ? false : true;
                }
                break;
            default:
                if (sz === 0) {
                    return result;
                }else if (sz < 0) {
                    return false;
                }

                let j = 0;
                for (;;) {
                    sz -= SPROTO_SIZEOF_LENGTH;
                    let len = this.toDword(buffer, data_idx);
                    data_idx += SPROTO_SIZEOF_LENGTH;
                    result[j] = {};

                    this.ldecode(type, buffer, data_idx, result[j++], null, reqdecode);
                    data_idx += len;
                    sz -= len;

                    if (sz == 0) {
                        break;
                    } else if (sz < 0) {
                        return false;
                    }
                }

                break;
            }

            return result;
        }

        decode(typename: string, buffer: bufferjs.Buffer) {
            let result = {};
            let sz = this.ldecode(typename, buffer, 0, result);
            if (sz < 0) {
                console.error("[sproto error]: decode failed");
                return;
            }
            return result;
        }

        pack(buffer:bufferjs.Buffer) {
            const srcsz = buffer.length;
            let dstsz = (srcsz + 2047) / 2048 * 2 + srcsz + 2;

            let dstbuffer = bufferjs.Buffer.allocUnsafe(dstsz);
            let tmp = bufferjs.Buffer.allocUnsafe(8);
            let dstidx = 0;
            let srcidx;
            let ff_n = 0;
            let ff_srcstart = -1;
            let ff_desstart = -1;
            let ff_buffer;

            for (let i = 0; i < srcsz; i += 8) {
                srcidx = i;

                let n = 0;
                let padding = i + 8 - srcsz;
                if (padding > 0) {
                    let data_end = 8 - padding

                    for (let j = 0; j < 8; ++j) {
                        if (j < data_end) {
                            tmp[j] = buffer[i + j];
                            continue;
                        }
                        tmp[j] = 0;
                    }

                    buffer = tmp;
                    srcidx = 0;
                }

                n = this.pack_seg(buffer, srcidx, dstbuffer, dstidx, ff_n);
                dstsz -= n;

                if (n === 10) {
                    ff_srcstart = srcidx;
                    ff_desstart = dstidx;
                    ff_buffer = buffer;
                    ff_n = 1;
                } else if (n === 8 && ff_n > 0) {
                    ++ff_n;
                    if (ff_n === 256) {
                        if (dstsz >= 0) {
                            this.write_ff(ff_buffer, ff_srcstart, dstbuffer, ff_desstart, 256*8);
                        }
                        ff_n = 0;
                    }
                } else {
                    if (ff_n > 0) {
                        if (dstsz >= 0) {
                            this.write_ff(ff_buffer, ff_srcstart, dstbuffer, ff_desstart, ff_n*8);
                        }
                        ff_n = 0;
                    }
                }

                dstidx += n;
            }

            if(dstsz >= 0){
                if(ff_n === 1) {
                    this.write_ff(ff_buffer, ff_srcstart, dstbuffer, ff_desstart, 8);
                }
                else if (ff_n > 1) {
                    this.write_ff(ff_buffer, ff_srcstart, dstbuffer, ff_desstart, srcsz - ff_srcstart);
                }
            }

            return dstbuffer.slice(0, dstidx);
        }

        private encode_integer(v, data, data_idx, size) {
            if (size < SPROTO_SIZEOF_LENGTH * 2) {
            	return -1;
            }

            data[data_idx+4] = v & 0xff;
            data[data_idx+5] = (v >> 8) & 0xff;
            data[data_idx+6] = (v >> 16) & 0xff;
            data[data_idx+7] = (v >> 24) & 0xff;
            return this.fillSize(data, data_idx, 4);
        }

        private encode_uint64(v, data, data_idx, size) {
        	if (size < SPROTO_SIZEOF_LENGTH + SPROTO_SIZEOF_INT64) {
        		return -1;
        	}

        	data[data_idx + 4] = v & 0xff;
        	data[data_idx + 5] = (v >> 8) & 0xff;
        	data[data_idx + 6] = (v >> 16) & 0xff;
        	data[data_idx + 7] = (v >> 24) & 0xff;
            
        	let hi =  this.uint64_rshift(v, 32);
        	data[data_idx + 8] = hi & 0xff;
        	data[data_idx + 9] = (hi >> 8) & 0xff;
        	data[data_idx + 10] = (hi >> 16) & 0xff;
        	data[data_idx + 11] = (hi >> 24) & 0xff;
        	return this.fillSize(data, data_idx, SPROTO_SIZEOF_INT64);
        }

        unpack(buffer: bufferjs.Buffer) {
            // let osz = ENCODE_BUFFERSIZE;
            let osz = buffer.length * 2;
            let outbuffer = bufferjs.Buffer.allocUnsafe(osz);
            let sz = this.lunpack(buffer, outbuffer);

            if (sz < 0) {
                console.error("[sproto error]: Invalid unpack stream");
                return null;
            } 

            if (sz > osz) {
                do {
                    osz *= 2;
                    outbuffer = bufferjs.Buffer.allocUnsafe(osz);
                } while (sz > osz);

                sz = this.lunpack(buffer, outbuffer);
                if (sz < 0) {
                    console.error("[sproto error]: Invalid unpack stream");
                    return null;
                }
            }

            return outbuffer.slice(0, sz);
        }

        private lencode(typename: string, tbl: any, startpoint: number, st?, spindex?) {
            let type = null;

            if (st) {
                type = st;
            } else {
                type = this.vquerytype(typename, spindex);
            }

            if (type === undefined) {
                console.log(this.t)
                console.error("[sproto error]: Invalid field type '%s' \"%s\"", typename, tbl, spindex);
                return SPROTO_ERROR_TYPE;
            }

            let header_sz = startpoint + SPROTO_SIZEOF_HEADER + type.maxn * SPROTO_SIZEOF_FIELD;
            let fieldidx = startpoint + SPROTO_SIZEOF_HEADER;
            let lasttag = -1;
            let tag = 0;
            let index = 0;
            let data = header_sz;
            let sumsz = this.buffer.length - startpoint - header_sz;
            
            if (sumsz < 0) {
                return -1;
            }

            let args = {name: null, value: null, i: 0};
            
            for (let f of type.f) {
                let sz = -1;
                let value = 0;
                let tu = tbl[f.name];
                let deatail_type = null;

                args.name = f.name;
                args.value = tu;

                if (this.isNull(tu)) {
                    continue;
                }

                if (f.type.charAt(0) === "*") {
                    deatail_type = this.checkValue(args, "array");
                    if (deatail_type === null) {
                        return SPROTO_ERROR_TYPE;
                    }
                    let t = f.type.substring(1, f.type.length);

                    sz = this.encode_array(tu, {type: t, name: f.name, spindex: spindex}, this.buffer, data, sumsz);
                } else {
                    switch(f.type) {
                    case "boolean":
                        deatail_type = this.checkValue(args, "boolean");
                        if (deatail_type === null) {
                            return SPROTO_ERROR_TYPE;
                        }
                        sz = 1;
                        break;
                    case "integer":
                        if (deatail_type === null) {
                            deatail_type = this.checkValue(args, "number");
                            if (deatail_type === null) {
                                return SPROTO_ERROR_TYPE;
                            }
                        }
                        
                        sz = this.checkInteger(tu);
                        if (sz == 4) {
                            value = tu >>> 0;						
                            if (value < 0x7fff) {
                                value = (value + 1) * 2;
                            } else {
                                sz = this.encode_integer(value, this.buffer, data, sumsz);
                                value = 0;
                            }
                        } else if (sz == 8) {	//value is int64
                            sz = this.encode_uint64(tu, this.buffer, data, sumsz);
                        }
                        
                        break;
                    case "string":
                        deatail_type = this.checkValue(args, "string");
                        if (deatail_type === null) {
                            return SPROTO_ERROR_TYPE;
                        }
                    default:
                        let isstring = deatail_type;
                        if (deatail_type === null) {
                            deatail_type = this.checkValue(args, "object");
                            if (deatail_type === null) {
                                return SPROTO_ERROR_TYPE;
                            }
                        }

                        let fsz = 0;
                        if (isstring) {
                            tu = bufferjs.Buffer.from(tu);
                            if (sumsz - data - tu.length - SPROTO_SIZEOF_LENGTH < 0) {
                                sz = -1;
                                break;
                            }
                            fsz = tu.length;
                            let value_idx = data + SPROTO_SIZEOF_LENGTH;
                            this.buffer.fill(tu, value_idx, value_idx + fsz);
                        } else {
                            fsz = this.lencode(f.type, tu, data + SPROTO_SIZEOF_LENGTH, null, spindex);
                        }
                        if (fsz < 0) {
                            if (fsz === SPROTO_ERROR_TYPE) {
                                return SPROTO_ERROR_TYPE;
                            }
                            sz = -1;
                        } else {
                            sz = this.fillSize(this.buffer, data, fsz);
                        }
                        break;
                    }
                }

                if (sz < 0) {
                    if (sz === SPROTO_ERROR_TYPE) {
                        return SPROTO_ERROR_TYPE;
                    }
                    return -1;
                }
                if (sz > 0) {
                    if (value === 0) {
                        data += sz;
                        sumsz -= sz;
                    }

                    tag = f.tag - lasttag - 1;
                    if (tag > 0) {
                        tag = (tag - 1) * 2 + 1;
                        if (tag > 0xffff)
                            return -1;

                        this.buffer[fieldidx++] = tag & 0xff;
                        this.buffer[fieldidx++] = (tag >> 8) & 0xff;
                        ++index;
                    }

                    this.buffer[fieldidx++] = value & 0xff;
                    this.buffer[fieldidx++] = (value >> 8) & 0xff;

                    lasttag = f.tag;
                    ++index;
                }
            }

            this.buffer[startpoint + 0] = index & 0xff;
            this.buffer[startpoint + 1] = (index >> 8) & 0xff;

            let data_sz = data - header_sz;
            data = header_sz;

            if (index != type.maxn) {
                let start = startpoint + SPROTO_SIZEOF_HEADER + index * SPROTO_SIZEOF_FIELD;
                for (var i = start; i < start + data_sz; i++) {
                    this.buffer[i] = this.buffer[data + i - start];
                }
            }
            // console.log("size:", header_sz, sumsz, startpoint, index, data_sz)
            return SPROTO_SIZEOF_HEADER + index * SPROTO_SIZEOF_FIELD + data_sz;
        }

        private lunpack(buffer: bufferjs.Buffer, outbuffer: bufferjs.Buffer) {
            let srcidx = 0;
            let outidx = 0;

            let srcsz = buffer.length;
            let outsz = outbuffer.length;

            while (srcsz > 0) {
                let bits = buffer[srcidx++];
                --srcsz;

                if (bits === 0xff) {
                    let n = (buffer[srcidx++] + 1) * 8;
                    --srcsz;

                    if (srcsz < n)
                        return -1;

                    if (outsz - outidx > n) {
                        for (let j = 0; j < n; ++j) {
                            outbuffer[outidx++] = buffer[srcidx++];
                        }
                    }
                    srcsz -= n;

                } else {
                    for (let i = 0; i < 8; ++i) {
                        if ((bits & 1) === 1) {
                            if (srcsz < 0) {
                                return -1;
                            }
                            if (outidx < outsz) {
                                outbuffer[outidx] = buffer[srcidx];
                            }
                            --srcsz;
                            ++outidx;
                            ++srcidx;
                        } else {
                            if (outidx < outsz) {
                                outbuffer[outidx] = 0;
                            } else {
                                return outidx + 1;
                            }
                            ++outidx;
                        }
                        bits >>>= 1;
                    }
                }
            }

            return outidx;
            
        }

        public ldecode(typename: string, buffer: bufferjs.Buffer, startpoint:number, result: Object, st?, reqdecode?) {
            let fn = this.toWord(buffer, startpoint);
            let size = SPROTO_SIZEOF_HEADER;

            let field_idx = startpoint + SPROTO_SIZEOF_HEADER;
            let data_idx = startpoint + SPROTO_SIZEOF_HEADER + fn * SPROTO_SIZEOF_FIELD;
            let tag = -1;
            let args = {name: null, type: null};

            for (var i = 0; i < fn; ++i) {
                ++tag;

                let sz = 0;
                let value = this.toWord(buffer, field_idx);
                field_idx += SPROTO_SIZEOF_FIELD;
                size += SPROTO_SIZEOF_FIELD;

                if ((value & 1) !== 0) {
                    tag += (value >> 1);
                    continue;
                }

                value = (value>>1) - 1;
                let f = this.findtag(typename, tag, st, reqdecode);
                if (f === null) {
                    continue;
                }

                let currentdata_idx = data_idx;

                if (value < 0) {
                    sz = this.toDword(buffer, currentdata_idx);
                    currentdata_idx += SPROTO_SIZEOF_LENGTH;
                    data_idx = currentdata_idx + sz;
                    size += SPROTO_SIZEOF_LENGTH + sz;

                    if (f.type.charAt(0) === '*') {
                        let array_res :any = [];
                        if (sz > 0) {
                            let t = f.type.substring(1, f.type.length);
                            array_res = this.decode_array(t, buffer, currentdata_idx, sz, st, reqdecode);
                            if (array_res === false) {
                                console.error("[sproto error]: decode array filed(%s) failed", f.name);
                                return -1;
                            }
                        }
                        result[f.name] = array_res;
                    } else {
                        switch (f.type) {
                        case "string":
                            result[f.name] = buffer.toString("utf8", currentdata_idx, currentdata_idx + sz);	
                            break;
                        case "integer":
                            let low = this.toDword(buffer, currentdata_idx);
                            let hi = 0;
                            if (sz === SPROTO_SIZEOF_INT64) {
                                low = this.toDword(buffer, currentdata_idx, true);
                                hi = this.toDword(buffer, currentdata_idx + SPROTO_SIZEOF_INT32, true);
                            } else if (sz !== SPROTO_SIZEOF_INT32) {
                                return -1;
                            }

                            result[f.name] = this.hi_low_uint64(low, hi);
                            break;
                        default:
                            let subres = {};
                            let tmpsz = this.ldecode(f.type, buffer, currentdata_idx, subres, null, reqdecode);
                            if (tmpsz < 0) {
                                return tmpsz;
                            }
                            size += tmpsz;
                            result[f.name] = subres;
                            break;
                        }
                    }
                } else if (f.type !== "integer" && f.type !== "boolean"){ // value>=0，必须是 integer 或者 boolean，所以要先判断 f.type类型
                    console.error("[sproto error]: field(%s) type:", f.name, f.type);
                    return -1;
                } else {	// value >= 0
                    if (f.type === "boolean") {
                        result[f.name] = value !== 0 ? true : false;
                    } else {
                        result[f.name] = value;
                    }
                }
            }

            return size;
        }

        encodePack(typeName: string, tbl: Object) {
            let buffer = this.encode(typeName, tbl);
            return this.pack(buffer);
        }

        unpackDecode(typeName: string, buffer) {
            return this.decode(typeName, this.unpack(buffer));
        }
    }

}