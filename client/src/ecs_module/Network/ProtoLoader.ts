class ProtoLoader extends System {
    public execute()
	{
    }
    
    public async loadProto(component:RpcComponent):Promise<RpcComponent> {
        let c2sProto = `
        .package {
            type 0 : integer
            session 1 : integer
            ud 2 : string
        }
        
        handshake 1 {
            response {
                msg 0  : string
            }
        }
        
        get 2 {
            request {
                what 0 : string
            }
            response {
                result 0 : string
            }
        }
        
        set 3 {
            request {
                what 0 : string
                value 1 : string
            }
        }
        
        say 4 {
            request {
                msg 0 : string
            }
        }
        
        quit 5 {}
                `
        let s2cProto = `
        .package {
            type 0 : integer
            session 1 : integer
            ud 2 : string
        }
        
        auth 1 {
            response {
                token 0 : string
            }
        }
        
        heartbeat 2 {}
                `
        let s2c = new sproto.SprotoManager(s2cProto)
        let c2s = new sproto.SprotoManager(c2sProto)

        component.s2c = s2c;
        component.c2s = c2s;

        return new Promise<RpcComponent>((resolve,reject)=>{resolve(component)})
    }
}