var MessageServer = require('./message_server.js');


setTimeout(function(){
	var str = '恭喜您！订单【测试订单号123456】【测试】跟踪成功！\r\n'+
			'[须知]:商品确认收货后半小时返利会添加到个人账户\r\n\r\n一一一🍉常用指令一一一\r\n'+
			'账户信息请回复：个人信息\r\n订单查询请回复：订单\r\n余额提现请回复：提现\r\n详细教程请回复：帮助';
	MessageServer.getInstance(null).update_order('evKveVWXPnPbQuKP',str,function (result) {
	    console.log(result);
	});
},5000)
