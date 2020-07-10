class CoreLoadingUI extends eui.Component implements RES.PromiseTaskReporter {

    public constructor() {
        super();

        this.skinName = "LoadingUISkin";
        this.createView();
    }

    private textField: egret.TextField;

    private createView(): void {
        this.textField = new egret.TextField();
        this.addChild(this.textField);
        this.textField.y = 300;
        this.textField.width = 480;
        this.textField.height = 100;
        this.textField.textAlign = "center";
        this.textField.text = 'Loading...';

        // var label: eui.Label = <any>this.getChildByName("label");
        // label.text = "加载中";
    }

    public onProgress(current: number, total: number): void {
        this.textField.text = `Loading...${current}/${total}`;
    }
}
