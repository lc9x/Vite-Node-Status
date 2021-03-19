var addr, autoTracking, trackingInterval;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	console.log('onMessage', request);
	if(request.dataUpdated){
		console.log('message', request.dataUpdated);
		trackingCheck();
	}
});

function trackingCheck(){
	chrome.storage.sync.get(['addr', 'autoTracking'], function(result){
		console.log('result', result);
		clearInterval(trackingInterval);
		addr = result.addr;
		autoTracking = result.autoTracking;
		if(result.addr && result.autoTracking){
			trackingInterval = setInterval(function(){
				tracking();
			}, 60000);
			tracking();
		}
	});
}

function tracking(){
	console.log('tracking');
	fetch('https://vitex.vite.net/reward/pledge/full/stat?address='+ addr).then(response => response.json()).then(function(data){
		var flag = true;
		try {
			if(!data['data']['onlineNodeCount']){
				flag = false;
			}
		} catch(e) {
			console.log('error', e)
		}
		if(flag){
			setBadge(""+ data['data']['onlineNodeCount'], data['data']['onlineNodeCount'] +' Active Nodes ($date)', false);
		} else {
			setBadge('err', '$date', true);
		}
	}).catch((error) => {
		console.error('Error:', error);
		setBadge('err', '$date', true);
	});
}

function setBadge(text, title, isError){
	console.log('badge', text, title, isError);
	chrome.action.setBadgeText({text: text});
	chrome.action.setBadgeBackgroundColor({color: isError ? 'red' : '#4688F1'});
	title = title.replace(/\$date/gi, function(t){
		var d = new Date();
		return (d.getMonth() + 1) +'/'+ d.getDate() +'/'+ d.getFullYear() +' '+ d.getHours() +':'+ d.getMinutes();
	});
	console.log('title', title);
	chrome.action.setTitle({title: title});
}

setTimeout(function(){
	trackingCheck();
}, 5000);
