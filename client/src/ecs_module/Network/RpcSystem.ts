class RpcSystem extends System {
    public execute() {
        let loader = World.shareInstance.createSystem(ProtoLoader)
        let c = World.shareInstance.createEntity(RpcComponent)
		loader.loadProto(c).then(function(c) {
            let socket = new network.GameSocket(c.s2c, c.c2s)
            socket.onConnected = RpcSystem.onConnected
            socket.onDisconnected = RpcSystem.onDisconnected
            socket.onError = RpcSystem.onError
            socket.connect("127.0.0.1", 8888)
            c.socket = socket
        })
    }

    public static onConnected(socket: network.GameSocket) {
        console.info("socket open")

        socket.addHandler("auth", function(data, response) {
            console.log("auth")
            response({ token : "nothing"})
        })

        socket.addHandler("heartbeat", function(data) {
            console.log("heartbeat")
        })

        socket.sendRequest("handshake", null, function(data) {
            console.log(data.msg)
        })
        socket.sendRequest("set", { what : "hello", value : "world" }, function(data) {
                this.sendRequest("get", { what : "hello"}, function(data) {
                    console.log("get", data.result)
                })
        }.bind(socket))
        socket.sendRequest("say", { msg : "say something" })
    }

    public static onDisconnected() {
        console.info("socket close")
    }

    public static onError() {
        console.error("socket error")
    }
}