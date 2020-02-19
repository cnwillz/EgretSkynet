namespace sproto {
    export class RpcMessage {
        public session: number
        public ud: any //userdata in header,such as message_id
        public proto: string // proto name
        public tag: number // proto tag
        public request: any
        public response: any
        public type: string //request or response
    }
}