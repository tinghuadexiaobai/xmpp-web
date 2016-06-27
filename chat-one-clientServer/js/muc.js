var server = $.cookie('server');
var BOSH_SERVICE = 'https://' + server +':5280';
var ADMIN_JID = 'admin@' + server;
var connection = null;
var connected = false;
var jid = "";
var i = 0;
var resource = 'web';
var tochatJID = $.cookie('tochatJID') + '@' + server + '/' + resource;

function add_message(name,img,msg,clear) {
	i = i + 1;
	var  inner = $('#chat-messages-inner');
	var time = new Date();
	var hours = time.getHours();
	var minutes = time.getMinutes();
	if(hours < 10) hours = '0' + hours;
	if(minutes < 10) minutes = '0' + minutes;
	var id = 'msg-'+i;
    var idname = name.replace(' ','-').toLowerCase();
	inner.append('<p id="'+id+'" class="user-'+idname+'">'
									+'<span class="msg-block"><img src="'+img+'" alt="" /><strong>'+name+'</strong> <span class="time">- '+hours+':'+minutes+'</span>'
									+'<span class="msg">'+msg+'</span></span></p>');
	$('#'+id).hide().fadeIn(800);
	if(clear) {
		$('.chat-message input').val('').focus();
	}
	$('#chat-messages').animate({ scrollTop: inner.height() },100);
}

// 连接状态改变的事件
function onConnect(status) {
    if (status == Strophe.Status.CONNFAIL) {
        alert("连接失败！");
    } else if (status == Strophe.Status.AUTHFAIL) {
        alert("登录失败！");
    } else if (status == Strophe.Status.DISCONNECTED) {
        alert("连接断开！");
        connected = false;
        logout();
    } else if (status == Strophe.Status.CONNECTED) {
        connected = true;

        // 当接收到<message>节，调用onMessage回调函数
        connection.addHandler(onMessage, null, 'message', null, null, null);
        connection.addHandler(onIq, null, 'iq', null, null, null);

        // 首先要发送一个<presence>给服务器（initial presence

        console.log('pres: ', $pres())

        connection.send($pres().tree());
    }
}

function onIq(msg) {
    console.log('iq - msg: ' + Strophe.serialize(msg))
}
  
// 接收到<message>  
function onMessage(msg) {
    console.log('onMessage: ' + Strophe.serialize(msg))

    // 解析出<message>的from、type属性，以及body子元素
    var from = msg.getAttribute('from');
    var type = msg.getAttribute('type');
    var elems = msg.getElementsByTagName('params');
    var msgID = msg.getAttribute('id');

    console.log('from: ', from, ", type: ", type, ', elems: ', elems, ', msgID: ' + msgID)

    if (elems.length > 0) {
        var messageType = elems[0].attributes[1].value;

        if (msgID) {
            console.log('msgID: ', msgID, ' :messagetype: ', messageType, " :type: ", type)
        }

        if (type == "chat") {

            if (messageType === '8') {
                var b = '<button onclick="endsession()">结束回话</button>';
                add_message(from.substring(from.indexOf('/') + 1), 'img/demo/av1.jpg', b, true);
            } else if (messageType === '3') {
                var b = '<button onclick="chooseCServiceOther()">点击此链接转接奖金客服</button>';
                add_message(from.substring(from.indexOf('/') + 1), 'img/demo/av1.jpg', b, true);
            } else {
                if (messageType === '0') {
                    tochatJID = from;
                }
                var body = elems[0].firstChild;
                add_message(from.substring(from.indexOf('/') + 1), 'img/demo/av1.jpg', Strophe.getText(body), true);
            }

            if (msgID) {
                buildACKMessageWithMID(msgID);
            }
        }
    }

    return true;
}

var chars = ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];

function generateMixed(n) {
     var res = "";
     for(var i = 0; i < n ; i ++) {
         var id = Math.ceil(Math.random()*35);
         res += chars[id];
     }
     return res;
}

function logout() {
    // 清空cookie
    $.removeCookie('username');
    $.removeCookie('password');
    $.removeCookie('server');
    $.removeCookie('tochatJID');
    window.location.href = './';
}

function remove_user(userid,name) {
    i = i + 1;
    $('.contact-list li#user-'+userid).addClass('offline').delay(1000).slideUp(800,function(){
        $(this).remove();
    });
    var  inner = $('#chat-messages-inner');
    var id = 'msg-'+i;
    inner.append('<p class="offline" id="'+id+'"><span>User '+name+' left the chat</span></p>');
    $('#'+id).hide().fadeIn(800);
}

// 发送消息  
function send(val) {
    if(connected) {

        // 创建一个<message>元素并发送
        // <params messagetype="0" xmlns="yl:xmpp:params"><text>aaaa</text></params> 
        var attr = [['messagetype', '0'], ['xmlns', 'zc:xmpp:params']];
        var msg = $msg({
            from: jid,
            to: tochatJID,
            type: 'chat',
            id: generateMixed(10)
        }).c("body", null, val)
        .c("params", attr, null)
        .c("text", null, val);

        console.log(msg.tree())

        connection.send(msg.tree());

        add_message(jid.substring(jid.indexOf('/') + 1), 'img/demo/av1.jpg', val, true);
        $("#input-msg").val('');
    } else {
        alert("请先登录！");
        logout();
    }
}

function getHistoryMessage() {
    if(connected) {

        var attr = [['xmlns', 'urn:xmpp:archive'], ['with', 'testm@' + server], ['start', '2016-06-01T02:56:15Z'], ['end', '2016-06-06T10:56:15Z']];
        var set = [['xmlns', 'http://jabber.org/protocol/rsm']]

        var msg = $iq({
            type: 'get',
            id: generateMixed(10)
        }).c('retrieve', attr, null)
        .c('set', set, null)
        .c('max', 30, null);

        console.log(msg.tree())

        connection.send(msg.tree());
    } else {
        alert("请先登录！");
        logout();
    }
}

function pushsub01() {
    if (connected) {

        // 创建节点
        // connection.pubsub.createNode('XMPP_NODE1', {'title': 'HelloWorld', 'summary': 'helloworld'})

        // 获取节点配置
        connection.pubsub.getConfig('XMPP_NODE1');

        // // 获取好友列表
        // var msg = $iq({
        //     id: generateMixed(10),
        //     type: 'get'
        // }).c('query', {'xmlns': 'jabber:iq:roster'});

    } else {
        alert("请先登陆！");
        logout();
    }
}

function subscribe01() {
    if (connected) {
        connection.pubsub.subscribe('XMPP_NODE1');
    } else {
        alert("请先登陆！");
        logout();
    }
}

function pushpub() {
    if (connected) {
        var entry = new Strophe.Builder('entry', {
            xmlns: 'http://www.w3.org/2005/Atom'
        }).c('title', null, 'hahahaha')
        .c('summary', null, 'To be, or not to be')
        .c('link', {'rel': 'alternate', 'type': 'text/html', 'href': 'http://denmark.lit/2003/12/13/atom03'})
        .up()
        .c('id', null, 'tag:denmark.lit,2003:entry-32397')
        .c('published', null, '2003-12-13T18:30:02Z')
        .c('updated', null, '2003-12-13T18:30:02Z');
        console.log('entry: ' + entry)
        connection.pubsub.publish('XMPP_NODE1', [{
            attrs: ['id', 'title', 'summary'],
            data: [entry]
        }]);
    } else {
        alert("请先登陆！");
        logout();
    }
}

function chooseCService() {
    if (connected) {
        var attr = [['messagetype', '12'], ['xmlns', 'zc:xmpp:params']];
        var msg = $msg({
            from: jid,
            to: 'customer@' + server,
            type: 'chat',
            id: generateMixed(10)
        }).c("body", null, 'chooseCService')
        .c("params", attr, null)
        .c("deptid", null, '154ec3d423a912ca3723494402e8e57c')
        .c("time", '2003-12-13T18:30:02Z');

        console.log(msg.tree())

        connection.send(msg.tree());
    } else {
        alert('请先登录');
        logout();
    }
}

function chooseCServiceOther() {
    if (connected) {
        var attr = [['messagetype', '9'], ['xmlns', 'zc:xmpp:params']];
        var msg = $msg({
            from: jid,
            to: 'customer@' + server,
            type: 'chat',
            id: generateMixed(10)
        }).c("body", null, 'chooseCService')
        .c("params", attr, null)
        .c("deptid", null, '154ec3d423a912ca3723494402e8e57c')
        .c("todeptid", null, '154f068f080db0fe9d9ce5347f9a3137')
        .c("suid", null, '402881f4550604220155060e7095003e')
        .c("time", '2003-12-13T18:30:02Z');

        console.log(msg.tree())

        connection.send(msg.tree());
    } else {
        alert('请先登录');
        logout();
    }
}

function endsession() {

    if (connected) {
        var attr = [['messagetype', '5'], ['xmlns', 'zc:xmpp:params']];
        var msg = $msg({
            from: jid,
            to: tochatJID,
            type: 'chat',
            id: generateMixed(10)
        }).c("body", null, '会话结束')
        .c("params", attr, null)
        .c("text", null, '会话结束')
        .c("deptid", null, '154ec3d423a912ca3723494402e8e57c');

        console.log(msg.tree())

        connection.send(msg.tree());
    } else {
        alert('请先登录');
        logout();
    }
}

function getCurrentTime() {
    var today = new Date();
    var s1=today.getFullYear()+"-"+today.getMonth()+"-"+today.getDate()+" "+today.getHours()+":"+today.getMinutes()+":"+today.getSeconds();
    return s1;
}

function buildACKMessageWithMID(mid) {
    var attr = [['xmlns', 'http://zhichuang.com/xmpp/client/reveived'], ['id', mid], ['stamp', getCurrentTime()]];
    var msg = $msg({
        to: ADMIN_JID,
        from: jid,
        type: 'chat'
    }).c('received', attr, null);

    console.log('消息回执: ' + Strophe.serialize(msg))
    connection.send(msg.tree());
}

function zjservice() {
    // 154f068f080db0fe9d9ce5347f9a3137

    var attr = [['messagetype', '3'], ['xmlns', 'zc:xmpp:params']];
        var msg = $msg({
            from: '402881f4550604220155060e7095003e@192.168.1.120',
            to: 'test@192.168.1.120',
            type: 'chat',
            id: generateMixed(10)
        }).c("body", null, '点击此链接转接奖金客服')
        .c("params", attr, null)
        .c("text", null, '点击此链接转接奖金客服')
        .c("deptid", null, '154ec3d423a912ca3723494402e8e57c')
        .c("todeptid", null, '154f068f080db0fe9d9ce5347f9a3137')
        .c("desp", null, '为什么这个月的奖金只有500')
        .c("zuid", null, 'test')
        .c("time", null, '2003-12-13T18:30:02Z');

    // var attr = [['messagetype', '4'], ['xmlns', 'zc:xmpp:params']];
    //     var msg = $msg({
    //         from: '402881f4550604220155060e7095003e@192.168.1.120',
    //         to: 'admin@192.168.1.120',
    //         type: 'chat',
    //         id: generateMixed(10)
    //     }).c("body", null, '同部门转接')
    //     .c("params", attr, null)
    //     .c("text", null, '会话结束')
    //     .c("url", null, 'http://www.qq.com')
    //     .c("deptid", null, '154ec3d423a912ca3723494402e8e57c')
    //     .c("zuid", null, 'test')
    //     .c("suid", null, '402881f454ecdddf0154ecfa1a530084')
    //     .c("time", null, '2003-12-13T18:30:02Z');

    console.log(msg.tree())

    connection.send(msg.tree());

    // <message from="test@localhost/smack" to="admin@localhost" type="chat" id="23432SSDD">
    //     <body></body>
    //     <params messagetype="3" xmlns="zc:xmpp:params">
    //         <text>跨部门消息</text>
    //         <desp>为什么这个月的奖金只有500</desp>
    //         <time>2016-05-18T15:53:55Z</time>
    //         <deptid>001</deptid>
    //         <todeptid>xxxxxxxxxxxxxxxxx</todeptid>
    //         <zuid>testtesttest</zuid>
    //     </params>
    //     <verification>DSJFSLD32432432432</verification>
    // </message>


    // <message from="test@localhost/smack" to="admin@localhost" type="chat" id="23432SSDD">
    //     <body></body>
    //     <params messagetype="4" xmlns="zc:xmpp:params">
    //         <text>同部门消息</text>
    //         <url>http://xxxx</url>
    //         <time>2016-05-18T15:53:55Z</time>
    //         <deptid>001</deptid>
    //         <zuid>testtesttest</zuid>
    //         <suid>xxxxxxxxxxx</suid>
    //     </params>
    //     <verification>DSJFSLD32432432432</verification>
    // </message>
}

function comtestxx() {
    var attr = [['messagetype', '0'], ['xmlns', 'zc:xmpp:params']];
        var msg = $msg({
            from: 'admin@192.168.1.120',
            to: "demoCompoent@192.168.1.120",
            type: 'chat',
            id: generateMixed(10)
        }).c("body", null, 'test')
        .c("params", attr, null)
        .c("text", null, 'test');

        console.log(msg.tree())

        connection.send(msg.tree());
}
  
$(document).ready(function() {
  
    // 通过BOSH连接XMPP服务器
    var username = $.cookie('username');
    var password = $.cookie('password');
    if (
        (typeof(username) == 'undefined') || 
        (typeof(password) == 'undefined')) {

	     window.location.href = "./";
	     return ;
    } else {
    	if(!connected) {
	        connection = new Strophe.Connection(BOSH_SERVICE);
            $('.panel-content li span').text(username)
            username = username + '@' + server + '/' + resource
            connection.connect(username, password, onConnect);
            jid = username;
	    }
    }

	$('.chat-message button').click(function(){
  		var input = $(this).siblings('span').children('input[type=text]');
  		if(input.val() != ''){
  			send(input.val());
  		}
	});

	$('.chat-message input').keypress(function(e){
  		if(e.which == 13) {
  			if($(this).val() != ''){
  				send($(this).val());
  			}
  		}
	});

    // 获取历史记录
    $('#history-message #button').click(function() {
        getHistoryMessage();
    });

    // 创建节点
    $('#history-message #pubsub').click(function() {
        pushsub01();
    });

    // 订阅节点
    $('#history-message #subscribe').click(function() {
        subscribe01();
    });

    // 发布
    $('#history-message #pushpub').click(function() {
        pushpub();
    });

    $('#chooseCService').click(function() {
        chooseCService();
    });

    $('#zjkf').click(function() {
        zjservice();
    });

    // 退出
    $("#logout").click(function() {
        if (connected) {
            connection.disconnect("offline")
        }

        logout();
    });

    $('#comtest').click(function() {
comtestxx();
    });
});