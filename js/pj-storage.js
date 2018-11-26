pj.Storage = {
    storage: undefined,
    storageContainer: undefined,
    storageKey: "PJStorage"
};

pj.Storage.Init = async function () {
    pj.storageFrame.find($(".pj-button-add")).click(function () {
        pj.ShowEdit();
    });

    await pj.Storage.LoadStorage();
    pj.Storage.storageContainer = $(".pj-storage-container");
    pj.Storage.RefreshContainer();
    pj.Storage.storageContainer.sortable( {
        stop: pj.Storage.ReorderAndSave,
        placeholder: "pj-storedelement-placeholder"
    } );

};

pj.Storage.LoadStorage = async function () {

    function _loadStorage() {
        let deferred = $.Deferred();
        chrome.storage.local.get([pj.Storage.storageKey], function (data) {
            deferred.resolve(data);
        });
        return deferred.promise();
    }

    let data = await _loadStorage();
    pj.Storage.storage = [];
    if (data) {
        $.each(data[pj.Storage.storageKey], function (i, val) {
            pj.Storage.storage.push(new PJStoredElement(val.id, val.text));
        });
        if (data[pj.Storage.storageKey] != null)
            pj.Log(data[pj.Storage.storageKey].length + " items loaded from local storage");
        else
            pj.Log("Storage is empty. Looks like it is first launch.");
    }
};

pj.Storage.SaveStorage = function () {

    // build array of simple objects
    let simpleItems = [];
    $.each(pj.Storage.storage, function (i, val) {
        simpleItems.push(val.getSimpleObject());
    });

    // save to storage
    chrome.storage.local.set({[pj.Storage.storageKey]: simpleItems}, function () {
        pj.Log("Items saved to local storage");
    });
};

pj.Storage.AddOrUpdate = function (item) {
    let existingItem = pj.Storage.storage.find(function (element, index, array) {
        return element.id === item.id;
    });
    if (existingItem == null) {
        pj.Storage.storage.push(item);
    } else {
        existingItem.text = item.text;
    }

    pj.Storage.SaveStorage();
    pj.Storage.RefreshContainer();
};

/**
 * @return {number}
 */
pj.Storage.GetStorageIndexById = function (id) {
    let res = -1;
    $.each(pj.Storage.storage, function (i, val) {
        if (id === val.id) {
            res = i;
            return false;
        }
    });
    return res;
};

pj.Storage.GenerateId = function () {
    let res = 0;
    while (res == 0) {
        res = Math.ceil(Math.random() * 0xFFFFFFFF);
        $.each(pj.Storage.storage, function (i, val) {
            if (res === val.id) {
                res = 0;
                return false;
            } else {
                return false;
            }
        });
    }
    return res;
};

pj.Storage.RefreshContainer = function () {
    pj.Storage.storageContainer.empty();
    pj.Storage.storage.forEach((item, i, arr) => {
        item.appendTo(pj.Storage.storageContainer);
    });
    if (pj.Settings.settings[pj.Settings.keys.PJ_SETTING_LOAD_EMOTES])
        pj.Storage.storageContainer.find(".pj-storedelement-text span")
            .kappa({channels: pj.Settings.settings[pj.Settings.keys.PJ_SETTING_LOAD_EMOTES_CHANNEL_LIST]});
    pj.Log("Kappa done");
};

pj.Storage.HideAllStorageControls = function () {
    $.each(pj.Storage.storage, function (i, val) {
        val.hideControls();
    });
};

pj.Storage.ReorderAndSave = function (event, ui) {

    let id = parseInt(ui.item.attr('pj-storage-id'), 10);
    let oldPos = pj.Storage.GetStorageIndexById(id);
    if (oldPos < 0) {
        pj.LogError("Can't find element with id " + id);
        return;
    }
    let newPos = ui.item.index();
    pj.Log("Moving element " + id + " from " + oldPos + " to " + newPos);
    let element = pj.Storage.storage.splice(oldPos, 1)[0];
    pj.Storage.storage.splice(newPos, 0, element);
    pj.Storage.SaveStorage();
};