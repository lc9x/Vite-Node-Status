let viteAddr = document.getElementById('viteAddr');
let changeAddr = document.getElementById('changeAddr');
let trackOnlineNode = document.getElementById('trackOnlineNode');
let noti = document.getElementById('noti');
let dataWrapper = document.getElementById('dataWrapper');
let dataLoading = document.getElementById('dataLoading');
let nodesStatus = document.getElementById('nodesStatus');

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
	dataLoading.classList.remove('hidden');
	fetch('https://vitex.vite.net/reward/pledge/full/stat?address='+ addr, {
		mode: 'no-cors'
	}).then(response => response.json()).then(function(data){
		var totalYesterdayFullReward = data['data']['totalYesterdayFullReward']
		document.getElementById('totalYesterdayFullReward').textContent = totalYesterdayFullReward;
		document.getElementById('totalYesterdayVoteReward').textContent = data['data']['totalYesterdayVoteReward'];
		document.getElementById('onlineNodeCount').textContent = data['data']['onlineNodeCount'];
		document.getElementById('pledgeNodeCount').textContent = data['data']['pledgeNodeCount'];
		document.getElementById('pledgeAmount').textContent = data['data']['pledgeAmount'];
		dataWrapper.classList.remove('hidden');
		dataLoading.classList.add('hidden');
	}).catch((error) => {
		noti.textContent = 'Error, get data failed!';
		noti.classList.remove('success');
		noti.classList.add('error');
		dataWrapper.classList.add('hidden');
	});
	nodesStatus.classList.remove('hidden');
	fetch('https://stats.vite.net/api/getAlivePeers?address='+ addr).then(res => res.json()).then(function(data){
		console.log('data', data);
		let list = data['list'];
		let promises = [];
		const nodes = list.map(node => {
			var tr = document.createElement('tr');
			tr.innerHTML = '<td>'+ encodeURI(node['nodeName']) +'</td><td>'+ encodeURI(node['ip']) +'</td><td>'+ encodeURI(node['isAlive']) +'</td><td class="chainHeight">Loading</td>';
			nodesStatus.appendChild(tr);
			return fetch('http://'+ node['ip'] +':48132/', {
				method: 'POST',
			    headers: {
			      'Accept': 'application/json',
			      'Content-Type': 'application/json',
			      'Cache-Control': 'no-cache'
			    },
			    body: JSON.stringify({
			        'jsonrpc': '2.0',
			        'id': 2,
			        'method': 'ledger_getSnapshotChainHeight',
			        'params': 'null'
			    })
			}).then(res => res.json()).then(function(data){
				console.log('data chain', data);
				tr.querySelector('.chainHeight').textContent = data.result;
			}).catch((err) => {
				console.error('fetch chain height error', err);
				tr.querySelector('.chainHeight').textContent = 'ERROR';
			});
		});
		Promise.all(nodes);
	}).catch((err) => {
		console.error('fetch nodes from vite address error', err);
	});
	/*
	chrome.runtime.sendMessage(null, { action: 'nodesStatus', addr: addr }, function(response){
		console.log('response', response);
		return;
		
	}); */
}
