import * as soui4 from "soui4";
import * as os from "os";
import * as std from "std";
import * as utils from "utils.dll";
	
var g_workDir="";

class AppLvAdapter extends soui4.SLvAdapter{
	constructor(mainDlg){
		super();
		this.mainDlg = mainDlg;
		this.onGetView= this.getView;
		this.onGetCount = this.getCount;
		this.appList = []; //prepare a app list.
	}

	getView(pos,pItem,pTemplate){
		if(pItem.GetChildrenCount()==0){
			pItem.InitFromXml(pTemplate);
		}
		let appInfo = this.appList[pos];
		let wndName = pItem.FindIChildByName("txt_name");
		wndName.SetWindowText(appInfo.name);
		let wndMd5 = pItem.FindIChildByName("txt_md5");
		wndMd5.SetWindowText(appInfo.md5);
	}

	getCount(){
		return this.appList.length;
	}
	
	AddFileInfo(fileInfo){
		this.appList =	this.appList.concat(fileInfo);
		soui4.log("AddFileInfo, items:"+fileInfo.length+" all length:"+this.appList.length);
		this.notifyDataSetChanged();
	}
};

class MainDialog extends soui4.JsHostWnd{
	constructor(){
		super("layout:dlg_main");
		this.onEvt = this.onEvent;
	}

	onEvent(e){
		if(e.GetID()==8000){//event_init
			this.init();
		}else if(e.GetID()==10000 && e.Sender().GetID()==10){
			this.onEvt = 0;
			this.uninit();
			this.DestroyWindow();
		}
		return false;
	}
	
	onDrop(fileCount){
		soui4.log("onDrop, fileCount:"+fileCount);
		let fileInfo=[];
		for(let i=0;i<fileCount;i++){
			let buf = new soui4.SStringA();
			this.dropTarget.GetDropFileName(i,buf);
			let md5 = utils.FileMd5(buf.c_str());
			fileInfo.push({"name":buf.c_str(),"md5":md5});
		}
		this.lvAdapter.AddFileInfo(fileInfo);
	}
	
	init(){
		let lv_applist=this.FindIChildByName("lv_applist");
		let lvapi = soui4.QiIListView(lv_applist);
		this.lvAdapter = new AppLvAdapter(this);
		lvapi.SetAdapter(this.lvAdapter);
		lvapi.Release();

		this.EnableDragDrop();
		//enable dropdrop.
		this.dropTarget = new soui4.SDropTarget();
		this.dropTarget.cbHandler = this;
		this.dropTarget.onDrop = this.onDrop;
		lv_applist.RegisterDragDrop(this.dropTarget);
	}
	uninit(){
		let lv_applist=this.FindIChildByName("lv_applist");
		let lvapi = soui4.QiIListView(lv_applist);
		lvapi.SetAdapter(0);
		lvapi.Release();
		this.lvAdapter= null;
		
		lv_applist.UnregisterDragDrop();
		this.dropTarget=null;
	}
};


function main(inst,workDir,args)
{
	soui4.log(workDir);
	g_workDir = workDir;
	let theApp = soui4.GetApp();
	let souiFac = soui4.CreateSouiFactory();

	let map = new Map();
	let a = {name:"soui4js",age:100};
	map.set(JSON.stringify(a),a);
	let b = {name:"soui4js",age:100};
	console.log("map has object a "+ map.has(JSON.stringify(a)));
	console.log("map has object b "+ map.has(JSON.stringify(b)));

	/*
	let resProvider = souiFac.CreateResProvider(1);
	soui4.InitFileResProvider(resProvider,workDir + "/uires");
	//*/
	//*
	// show how to load resource from a zip file
	let resProvider = soui4.CreateZipResProvider(theApp,workDir +"/uires.zip","souizip");
	if(resProvider === 0){
		soui4.log("load res from uires.zip failed");
		return -1;
	}
	//*/
	let resMgr = theApp.GetResProviderMgr();
	resMgr.AddResProvider(resProvider,"uidef:xml_init");
	resProvider.Release();
	let hwnd = soui4.GetActiveWindow();
	let hostWnd = new MainDialog();
	hostWnd.Create(hwnd,0,0,0,0);
	hostWnd.SendMessage(0x110,0,0);//send init dialog message.
	hostWnd.ShowWindow(1); //1==SW_SHOWNORMAL
	souiFac.Release();
	let ret= theApp.Run(hostWnd.GetHwnd());
	hostWnd=null;
	soui4.log("js quit");
	return ret;
}

globalThis.main=main;