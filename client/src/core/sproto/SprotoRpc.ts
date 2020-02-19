namespace sproto {
    export class SprotoRpc {
        public sessions:  { [key: string]: RpcMessage; } = {};

        public constructor(public s2c: SprotoManager, public c2s: SprotoManager,
        public packageClass: string = "package") {

        }

        public packRequest(proto: string, data: any, session: number = 0, ud: any = null) {
            let protocol = this.c2s.getProtocol(proto)
            let tag = protocol.tag
            let header = this.newPackageHeader(protocol.tag, session, ud)
            let headerBuf = this.c2s.encode(this.packageClass, header)
            let packBuf = null
            if(data != null) {
                let contentBuf = this.c2s.encode(protocol.st[SPROTO_REQUEST].name, data, protocol.st[SPROTO_REQUEST]);
				let sz = headerBuf.length + contentBuf.length;
				packBuf = this.c2s.pack(bufferjs.Buffer.concat([headerBuf, contentBuf], sz));
            } else {
                packBuf = this.c2s.pack(headerBuf);
            }

            if(session != 0) {
                if(this.sessions.hasOwnProperty(<string><any>session))
                    console.error("repeat session: " + session)
                let message = new RpcMessage()
                message.session = session
                message.proto = proto
                message.request = data
                message.response = protocol.st[SPROTO_RESPONSE] || true
                message.tag = tag
                
                this.sessions[<string><any>session] = message
            }

            return packBuf
        }

        public generatePackResponser(responseSprotoType, spindex, session) {
            return function(data, ud: any = null) {
                let header = this.newPackageHeader(0, session, ud)

                let headerBuf = this.s2c.encode(this.packageClass, header);
                if (responseSprotoType) {
                    let contentBuf = this.s2c.encode("", data, responseSprotoType, spindex);
                    let sz = headerBuf.length + contentBuf.length;
                    return this.s2c.pack(bufferjs.Buffer.concat([headerBuf, contentBuf], sz));
                } else {
                    return this.s2c.pack(headerBuf);
                }
            }
        }

        public unpackMessage(buffer: bufferjs.Buffer, spindex: number = 0) {
            let data = {type: null, name: null, content: null, response: null, session: null}
            let bin = this.s2c.unpack(buffer);

            let header = this.newPackageHeader(null, null);
            let sz = this.s2c.ldecode(this.packageClass, bin, 0, header);
            if (sz < 0) {
                console.error("[sproto error]: decode failed");
                return data;
            }
            if (header.type) {
                // request
                let result = {};
                let p = this.s2c.tagProtocols[header.type];

                if (p) {
                    if(p.st[SPROTO_REQUEST]) {
                        let err = this.s2c.ldecode(p.st[SPROTO_REQUEST].name, bin, sz, result, p.st[SPROTO_REQUEST], spindex);
                        if (err < 0) {
                            console.error("[sproto error]: decode failed");
                            return data;
                        }
                    }
                } else {
                    console.error("[sproto error]: can't find protocol by tag:", header.type);
                }
                
                let session = header.session;
                if (session) {
                    data.type = "REQUEST"
                    data.name = p.name
                    data.content = result
                    data.response = this.generatePackResponser(p.st[SPROTO_RESPONSE], spindex, session).bind(this)
                    return data
                } else {
                    data.type = "REQUEST"
                    data.name = p.name
                    data.content = result
                    return data
                }

            } else {
                // response
                let session = header.session;
                if (session == null) {
                    console.error("[sproto error]: session not found");
                    return data;
                }

                let msg = this.sessions[<string><any>session];
                if (msg == undefined || msg == null) {
                    console.error("[sproto error]: Unknown session", session);
                    return data;
                }

                this.sessions[<string><any>session] = null;
                if (msg.response === true) {
                    data.type = "RESPONSE"
                    data.session = session
                    return data
                } else {
                    let result = {};
                    let err  = this.s2c.ldecode(msg.response.name, bin, sz, result, msg.response);
                    if (err < 0) {
                        console.error("[sproto error]: decode failed");
                        return data;
                    }
                    data.type = "RESPONSE"
                    data.session = session
                    data.content = result
                    return data;
                }
            }
        }

        private newPackageHeader(tag: number, session: number, ud: any = null) {
            let header = {type: 0, session: 0}
            if(tag != 0)
                header.type = tag
            else
                if(session == 0)
                    console.error("[sproto error]response expect session")
            if(session != 0)
                header.session = session
            if(ud != null)
                header["ud"] = ud
            
            return header
        }
    }
}