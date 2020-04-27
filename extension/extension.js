const buttonClass = 'blacklist-extension-button';
const notificationClass = 'blacklist-extension-notification';
const notificationButtonClass = 'blacklist-extension-notification-button';

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
    notifyBlacklisted(seller);
    saveBlacklist(cb);
}

function unblacklistSeller(seller, cb) {
    let index = blacklist.indexOf(seller);
    if (index !== -1) {
        blacklist.splice(index, 1);
    }
    saveBlacklist(cb);
}

function notifyBlacklisted(seller) {
    let removed = false;
    blacklistNotification = document.createElement('div');
    blacklistNotification.innerHTML = `Seller <strong>${seller}</strong> added to blacklist`;
    blacklistNotification.className = notificationClass;
    const undoButton = document.createElement('button');
    undoButton.innerText = 'undo';
    undoButton.className = notificationButtonClass;
    let cachedSeller = seller;
    undoButton.addEventListener('click', function () {
        unblacklistSeller(cachedSeller);
        if (!removed) {
            document.body.removeChild(blacklistNotification);
            removed = true;
        }
    });
    blacklistNotification.appendChild(undoButton);
    document.body.appendChild(blacklistNotification);
    setTimeout(function () {
        if (!removed) {
            document.body.removeChild(blacklistNotification);
            removed = true;
        }
    }, 5000);
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
            result.style.display = 'none';
        } else {
            result.style.display = 'block';
            // Add blacklist button to all results
            sellerArea = result.querySelector('.lvdetails li:last-child');

            // Return if button already added
            if (sellerArea.lastChild && sellerArea.lastChild.className === buttonClass)
                return;

            blacklistButton = document.createElement('button');
            blacklistButton.innerHTML = '&times Blacklist';
            blacklistButton.dataset.isBlacklistButton = true;
            blacklistButton.className = buttonClass;
            let cachedSeller = seller;
            blacklistButton.addEventListener('click', function () {
                blacklistSeller(cachedSeller);
            });
            sellerArea.appendChild(blacklistButton);
        }
    });
}