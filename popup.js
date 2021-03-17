let viteAddr = document.getElementById('viteAddr');
let changeAddr = document.getElementById('changeAddr');
let trackOnlineNode = document.getElementById('trackOnlineNode');
let noti = document.getElementById('noti');
let dataWrapper = document.getElementById('dataWrapper');
let dataLoading = document.getElementById('dataLoading');

chrome.storage.sync.get('addr', ({ addr }) => {
	viteAddr.value = addr || '';
	changeAddr.textContent = addr ? 'Change' : 'Save';
	console.log('addr', addr);
	if(addr){
		fetchData(addr);
		trackOnlineNode.classList.remove('hidden');
	}
});
chrome.storage.sync.get('autoTracking', ({ autoTracking }) => {
	trackOnlineNode.textContent = autoTracking ? 'ON' : 'OFF';
});

changeAddr.addEventListener('click', async () => {
	var addr = viteAddr.value.trim();
	var flag = false;
	if(addr){
		if(/^vite_[a-z0-9]+/i.test(addr)){
			flag = true;
		}
	} else {
		flag = true;
	}
	if(flag){
		chrome.storage.sync.set({ addr: addr });
		viteAddr.value = addr;
		changeAddr.textContent = addr ? 'Change' : 'Save';
		noti.textContent = 'Change Vite address successfully!';
		noti.classList.remove('error');
		noti.classList.add('success');
		console.log('changed', addr);
		if(addr){
			fetchData(addr);
			trackOnlineNode.classList.remove('hidden');
		} else {
			dataWrapper.classList.add('hidden');
			trackOnlineNode.classList.add('hidden');
		}
		chrome.runtime.sendMessage({dataUpdated: true});
	} else {
		noti.textContent = 'Vite address is not structured correctly!';
	}
});

trackOnlineNode.addEventListener('click', async() => {
	chrome.storage.sync.get('autoTracking', ({ autoTracking }) => {
		autoTracking = !autoTracking;
		trackOnlineNode.textContent = autoTracking ? 'ON' : 'OFF';
		chrome.storage.sync.set({ autoTracking: autoTracking }, function(){
			chrome.runtime.sendMessage({dataUpdated: true});
		});
	});
});

function fetchData(addr){
	var xhr = new XMLHttpRequest();
	xhr.open('GET', 'https://vitex.vite.net/reward/pledge/full/stat?address='+ addr);
	xhr.onload = xhr.onerror = function(){
		dataLoading.classList.add('hidden');
		var flag = true;
		var data;
		try {
			data = JSON.parse(xhr.responseText);
			if(!data['data']['totalYesterdayFullReward']){
				flag = false;
			}
		} catch(e) {
			console.log('error', e)
		}
		if(flag){
			dataWrapper.classList.remove('hidden');
			document.getElementById('totalYesterdayFullReward').textContent = data['data']['totalYesterdayFullReward'];
			document.getElementById('totalYesterdayVoteReward').textContent = data['data']['totalYesterdayVoteReward'];
			document.getElementById('onlineNodeCount').textContent = data['data']['onlineNodeCount'];
			document.getElementById('pledgeNodeCount').textContent = data['data']['pledgeNodeCount'];
			document.getElementById('pledgeAmount').textContent = data['data']['pledgeAmount'];
		} else {
			noti.textContent = 'Error, get data failed!';
			noti.classList.remove('success');
			noti.classList.add('error');
			dataWrapper.classList.add('hidden');
		}
	};
	dataLoading.classList.remove('hidden');
	xhr.send();
}