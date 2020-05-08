var blacklist = [];

init();

function init() {
    chrome.storage.onChanged.addListener(function (changes) {
        if (changes.ebayBlacklist) {
            blacklist = changes.ebayBlacklist.newValue;
            console.log('Blacklist updated', blacklist);
            updateBlacklist();
        }
    });

    getBlacklist(updateBlacklist);
}

function getBlacklist(cb) {
    chrome.storage.sync.get(['ebayBlacklist'], function (result) {
        console.log('Blacklist currently is', result.ebayBlacklist);
        if (result.ebayBlacklist)
            blacklist = result.ebayBlacklist;
        if (cb) cb();
    });
}

function saveBlacklist(cb) {
    chrome.storage.sync.set({ ebayBlacklist: blacklist }, function () {
        console.log('Saved Blacklist', blacklist);
        if (cb) cb();
    });
}

function isBlacklisted(seller) {
    return blacklist.indexOf(seller) !== -1;
}

function blacklistSeller(seller, cb) {
    if (isBlacklisted(seller))
        return;
    blacklist.push(seller);
    saveBlacklist(cb);
}

function unblacklistSeller(seller, cb) {
    let index = blacklist.indexOf(seller);
    if (index !== -1) {
        blacklist.splice(index, 1);
    }
    saveBlacklist(cb);
}

function updateBlacklist() {
    const blacklistEl = document.getElementById('blacklist-body');
    blacklistEl.innerHTML = "";
    blacklist.forEach(function (seller) {
        let sellerEl = document.createElement('tr');
        sellerEl.innerHTML = `<td>${seller}</td>`;

        let unblacklistTd = document.createElement('td');
        sellerEl.appendChild(unblacklistTd);

        let unblacklistButton = document.createElement('button');
        unblacklistButton.innerHTML = 'Unblacklist';
        let cachedSeller = seller;
        unblacklistButton.addEventListener('click', function () {
            unblacklistSeller(cachedSeller);
        });
        unblacklistTd.appendChild(unblacklistButton);

        blacklistEl.appendChild(sellerEl);
    })
}