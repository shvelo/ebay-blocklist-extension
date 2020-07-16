var blocklist = [];

init();

function init() {
    chrome.storage.onChanged.addListener(function (changes) {
        if (changes.ebayBlacklist) {
            blocklist = changes.ebayBlacklist.newValue;
            console.log('Blocklist updated', blocklist);
            updateBlocklist();
        }
    });

    getBlocklist(updateBlocklist);
}

function getBlocklist(cb) {
    chrome.storage.sync.get(['ebayBlacklist'], function (result) {
        console.log('Blocklist currently is', result.ebayBlacklist);
        if (result.ebayBlacklist)
            blocklist = result.ebayBlacklist;
        if (cb) cb();
    });
}

function saveBlocklist(cb) {
    chrome.storage.sync.set({ ebayBlacklist: blocklist }, function () {
        console.log('Saved Blocklist', blocklist);
        if (cb) cb();
    });
}

function isBlocked(seller) {
    return blocklist.indexOf(seller) !== -1;
}

function blockSeller(seller, cb) {
    if (isBlocked(seller))
        return;
    blocklist.push(seller);
    saveBlocklist(cb);
}

function unblockSeller(seller, cb) {
    let index = blocklist.indexOf(seller);
    if (index !== -1) {
        blocklist.splice(index, 1);
    }
    saveBlocklist(cb);
}

function updateBlocklist() {
    const blocklistEl = document.getElementById('blocklist-body');
    blocklistEl.innerHTML = "";
    blocklist.forEach(function (seller) {
        let sellerEl = document.createElement('tr');
        sellerEl.innerHTML = `<td>${seller}</td>`;

        let unblockTd = document.createElement('td');
        sellerEl.appendChild(unblockTd);

        let unblockButton = document.createElement('button');
        unblockButton.innerHTML = 'Unblock';
        let cachedSeller = seller;
        unblockButton.addEventListener('click', function () {
            unblockSeller(cachedSeller);
        });
        unblockTd.appendChild(unblockButton);

        blocklistEl.appendChild(sellerEl);
    })
}