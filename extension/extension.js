const LOG_PREFIX = 'eBay Blocklist:';
const BUTTON_CLASS = 'blocklist-extension-button';
const NOTIFICATION_CLASS = 'blocklist-extension-notification';
const NOTIFICATION_BUTTON_CLASS = 'blocklist-extension-notification-button';

var blocklist = [];
var options = {
    hideLocalPickups: false,
};
const log = console.log.bind(console, LOG_PREFIX);

init();

function init() {
    chrome.storage.onChanged.addListener(function (changes) {
        if (changes.ebayBlocklist) {
            blocklist = changes.ebayBlocklist.newValue;
            console.log('Blocklist updated', blocklist);
        }
        if (changes.ebayOptions) {
            options = changes.ebayOptions.newValue;
            console.log('Options updated', options);
        }

        if (changes.ebayBlocklist || changes.ebayOptions) {
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
    chrome.storage.sync.get(['ebayBlocklist', 'ebayOptions'], function (result) {
        if (result.ebayOptions) {
            options = result.ebayOptions;
            console.log('Retrieved options', options)
        }

        if (result.ebayBlocklist) {
            verifyBlocklist(result.ebayBlocklist, cb);
            console.log('Retrieved Blocklist', result.ebayBlocklist);
        }
        else if (cb) cb();
    });
}

function saveBlocklist(cb) {
    chrome.storage.sync.set({ ebayBlocklist: blocklist }, function () {
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
    blockNotification.className = NOTIFICATION_CLASS;
    const undoButton = document.createElement('button');
    undoButton.innerText = 'undo';
    undoButton.className = NOTIFICATION_BUTTON_CLASS;
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
    const results = document.querySelectorAll(".lvresult, .s-item");
    let seller, sellerArea, blockButton;

    results.forEach(function (result) {

        if (options.hideLocalPickups) {
            let matches = result.textContent.match(/(Nur Abholung|Pickup only)/i);
            let localPickup = matches && matches[1];
            if (localPickup) {
                console.log('Found local pickup:', localPickup);
                result.style.display = 'none';
                return;
            }
        }

        let sellerMatches = result.textContent.match(/(seller|Verkäufer): ([^\n\(]+)/i);
        seller = sellerMatches && sellerMatches[2];
        if (!seller)
            return;

        if (isBlocked(seller)) {
            console.log('Found result from blocked seller', seller);
            result.style.display = 'none';
        } else {
            result.style.display = 'block';
            // Add block button to all results
            sellerArea = result.querySelector('.lvdetails li:last-child, .s-item__seller-info');

            // Return if button already added
            if (sellerArea.lastChild && sellerArea.lastChild.className === BUTTON_CLASS)
                return;

            blockButton = document.createElement('button');
            blockButton.innerHTML = '&times Block';
            blockButton.dataset.isBlockButton = true;
            blockButton.className = BUTTON_CLASS;
            let cachedSeller = seller;
            blockButton.addEventListener('click', function () {
                blockSeller(cachedSeller);
            });
            sellerArea.appendChild(blockButton);
        }
    });
}
