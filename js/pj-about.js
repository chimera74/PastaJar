pj.AboutFrame = {
    version: chrome.runtime.getManifest().version
};

pj.AboutFrame.Init = function () {
    pj.aboutFrame.find($("#pj-about-back-button")).click(function () {
        pj.ShowStorage();
    });

    $("span#pj-about-version").html(pj.AboutFrame.version);
};