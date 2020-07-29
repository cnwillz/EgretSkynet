namespace network {
    export class GameSocket {
        private sessionId: number = 0;
        private sessions:  { [key: string]: Function; } = {};
        private handlers: { [key: string]: Function; } = {};
        private socket: egret.WebSocket;
        public rpc: sproto.SprotoRpc;

        public onConnected: Function;
        public onDisconnected: Function;
        public onError: Function;

        constructor(s2c: sproto.SprotoManager, c2s: sproto.SprotoManager) {
            this.rpc = new sproto.SprotoRpc(s2c, c2s)
        }

        public connect(ip, port): void {
            try {
                //创建 WebSocket 对象
                this.socket = new egret.WebSocket();
                //设置数据格式为二进制，默认为字符串
                this.socket.type = egret.WebSocket.TYPE_BINARY;
                //添加收到数据侦听，收到数据会调用此方法
                this.socket.addEventListener(egret.ProgressEvent.SOCKET_DATA, this.onReceiveMessage, this);
                //添加链接打开侦听，连接成功会调用此方法
                this.socket.addEventListener(egret.Event.CONNECT, this.onSocketOpen, this);
                //添加链接关闭侦听，手动关闭或者服务器关闭连接会调用此方法
                this.socket.addEventListener(egret.Event.CLOSE, this.onSocketClose, this);
                //添加异常侦听，出现异常会调用此方法
                this.socket.addEventListener(egret.IOErrorEvent.IO_ERROR, this.onSocketError, this);
                this.socket.connect(ip, port);
            } catch(e) {
                console.error(e);
            }
        }

        public addHandler(proto: string, handler: Function): void {
            this.handlers[proto] = handler;
        }

        public removeHandler(proto: string): void {
            delete this.handlers[proto]
        }

        public getHandler(proto: string): Function {
            let handler: Function = null;
            if(this.handlers.hasOwnProperty(proto))
                handler = this.handlers[proto];
            return handler;
        }

        public dispatch(buffer: bufferjs.Buffer): any {
            let message = this.rpc.unpackMessage(buffer);
            let name = message.name;

            if(name) {
                //request
                let handler = this.handlers[name];
                if(handler) {
                    if(message.response) {
                        let socket = this.socket;
                        handler(message.content, function(data, ud : any = null) {
                            let buffer = message.response(data, ud);
                            var byte : egret.ByteArray = new egret.ByteArray(buffer);
                            socket.writeBytes(byte);
                        });
                    } else {
                        handler(message.content);
                    }
                } else {
                    console.warn(name + " 协议没有注册处理回调!")
                }
                return;
            } else {
                //response
                let handler = this.sessions[message.session];
                if(handler) {
                    handler(message.content);
                } else {
                    console.error("会话不存在:", message.session)
                }
            }
            
            
        }

        public sendRequest(proto: string, data: any = null, handler: Function = null): any {
            let sid = 0;
            if(handler != null) {
                this.sessionId++;
                sid = this.sessionId;
                this.sessions[<string><any>sid] = handler;
            }
            
            let buffer = this.rpc.packRequest(proto, data, sid);
            //构造函数内部会将bytes直接赋值为buffer，不会额外分配
            var byte:egret.ByteArray = new egret.ByteArray(buffer);
            this.socket.writeBytes(byte);
        }

        private onReceiveMessage(e: egret.Event): void {
            //创建 ByteArray 对象
            var byte:egret.ByteArray = new egret.ByteArray();
            //读取数据
            this.socket.readBytes(byte);
            //新创建的缓存区会直接引用给定的字节数组，不会额外分配
            let buffer = bufferjs.Buffer.from(byte.bytes);

            this.dispatch(buffer)
        }

        private onSocketOpen(): void {
            if(this.onConnected) {
                this.onConnected(this)
            }
        }

        private onSocketClose(): void {
            if(this.onDisconnected) {
                this.onDisconnected()
            }
        }

        private onSocketError(): void {
            if(this.onError) {
                this.onError()
            }
        }
    }
}