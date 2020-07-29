class IdGenerator {
		public constructor() {
		}
		
		private static instanceIdGenerator :number = 0;
		
		private static appId:number;
		
		public static set AppId(value:number)
		{
				this.appId = value;
				this.instanceIdGenerator = this.appId << 48;
		}

		private static value:number;

		public static get GenerateId():number
		{
			let time = egret.getTimer()

			return (this.appId << 48) + (time << 16) + ++this.value;
		}
		
		public static GenerateInstanceId():number
		{
			return ++this.instanceIdGenerator;
		}

		public static get AppId():number
		{
			return this.appId
		}
	}
