class RpcSystem extends System {
    public execute() {
        let loader = World.shareInstance.createSystem(ProtoLoader)
        let c = World.shareInstance.createEntity(RpcComponent)
		loader.loadProto(c).then(function(c) {
            c.socket = new network.GameSocket(c.s2c, c.c2s)
            c.socket.connect("127.0.0.1", 8888)
        })
    }
}