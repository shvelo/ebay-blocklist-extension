var blacklist = [];

init();

function init() {
    chrome.storage.onChanged.addListener(function (changes) {
        if (changes.ebayBlacklist) {
            blacklist = changes.ebayBlacklist.newValue;
            console.log('Blacklist updated', blacklist);
            runBlacklist();
        }
    });

    getBlacklist(runBlacklist);
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

function runBlacklist() {
    const results = document.querySelectorAll(".lvresult");
    let seller, sellerArea, blacklistButton;

    results.forEach(function (result) {
        seller = result.textContent.match(/seller: ([^\n\(]+)/i)[1];
        if (!seller)
            return;

        if (isBlacklisted(seller)) {
            console.log('Found result from blacklisted seller', seller);
            result.parentElement.removeChild(result);
        } else {
            // Add blacklist button to all results
            sellerArea = result.querySelector('.lvdetails li:last-child');

            // Return if button already added
            if (sellerArea.lastChild && sellerArea.lastChild.dataset && sellerArea.lastChild.dataset.isBlacklistButton)
                return;

            blacklistButton = document.createElement('button');
            blacklistButton.innerText = 'Blacklist';
            blacklistButton.dataset.isBlacklistButton = true;
            let cachedSeller = seller;
            blacklistButton.addEventListener('click', function () {
                blacklistSeller(cachedSeller);
            });
            sellerArea.appendChild(blacklistButton);
        }
    });
}