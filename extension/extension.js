const buttonClass = 'blocklist-extension-button';
const notificationClass = 'blocklist-extension-notification';
const notificationButtonClass = 'blocklist-extension-notification-button';

var blocklist = [];

init();

function init() {
    chrome.storage.onChanged.addListener(function (changes) {
        if (changes.ebayBlacklist) {
            blocklist = changes.ebayBlacklist.newValue;
            console.log('Blocklist updated', blocklist);
            runBlocklist();
        }
    });

    getBlocklist(runBlocklist);
}

function verifyBlocklist(newBlocklist, cb) {
    if (!(newBlocklist instanceof Array)) {
        console.log('Blocklist invalid, resetting');
        return resetBlocklist(cb);
    }

    if (newBlocklist.length && typeof newBlocklist[0] === 'string') {
        console.log('Blocklist in old format, migrating');
        return migrateBlocklist(newBlocklist, cb);
    }

    blocklist = newBlocklist;
    if (cb) cb();
}

function resetBlocklist(cb) {
    blocklist = [];
    saveBlocklist(cb);
}

function migrateBlocklist(newBlockList, cb) {
    blocklist = newBlockList.map((item) => {
        return item;
    });
    if (cb) cb();
}

function getBlocklist(cb) {
    chrome.storage.sync.get(['ebayBlacklist'], function (result) {
        console.log('Retrieved Blocklist', result.ebayBlacklist);
        if (result.ebayBlacklist)
            verifyBlocklist(result.ebayBlacklist, cb);
        else if (cb) cb();
    });
}

function saveBlocklist(cb) {
    chrome.storage.sync.set({ ebayBlacklist: blocklist }, function () {
        console.log('Saved Blocklist', blocklist);
        if (cb) cb();
    });
}

function isBlocked(seller) {
    for (let i in blocklist) {
        if (blocklist[i] === seller)
            return true;
    }
    return false;
}

function findBlocklistIndex(seller) {
    for (let i in blocklist) {
        if (blocklist[i] === seller)
            return i;
    }
    return -1;
}

function blockSeller(seller, cb) {
    if (isBlocked(seller))
        return;
    blocklist.push(seller);
    notifyBlocked(seller);
    runBlocklist();
    saveBlocklist(cb);
}

function unblockSeller(seller, cb) {
    let index = findBlocklistIndex(seller);
    if (index !== -1) {
        blocklist.splice(index, 1);
    }
    saveBlocklist(cb);
}

function notifyBlocked(seller) {
    let removed = false;
    const blockNotification = document.createElement('div');
    blockNotification.innerHTML = `Seller <strong>${seller}</strong> blocked`;
    blockNotification.className = notificationClass;
    const undoButton = document.createElement('button');
    undoButton.innerText = 'undo';
    undoButton.className = notificationButtonClass;
    let cachedSeller = seller;
    undoButton.addEventListener('click', function () {
        unblockSeller(cachedSeller);
        if (!removed) {
            document.body.removeChild(blockNotification);
            removed = true;
        }
    });
    blockNotification.appendChild(undoButton);
    document.body.appendChild(blockNotification);
    setTimeout(function () {
        if (!removed) {
            document.body.removeChild(blockNotification);
            removed = true;
        }
    }, 5000);
}

function runBlocklist() {
    const results = document.querySelectorAll(".lvresult");
    let seller, sellerArea, blockButton;

    results.forEach(function (result) {
        seller = result.textContent.match(/seller: ([^\n\(]+)/i)[1];
        if (!seller)
            return;

        if (isBlocked(seller)) {
            console.log('Found result from blocked seller', seller);
            result.style.display = 'none';
        } else {
            result.style.display = 'block';
            // Add block button to all results
            sellerArea = result.querySelector('.lvdetails li:last-child');

            // Return if button already added
            if (sellerArea.lastChild && sellerArea.lastChild.className === buttonClass)
                return;

            blockButton = document.createElement('button');
            blockButton.innerHTML = '&times Block';
            blockButton.dataset.isBlockButton = true;
            blockButton.className = buttonClass;
            let cachedSeller = seller;
            blockButton.addEventListener('click', function () {
                blockSeller(cachedSeller);
            });
            sellerArea.appendChild(blockButton);
        }
    });
}