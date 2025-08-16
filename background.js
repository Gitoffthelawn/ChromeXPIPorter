import {patchExt} from  "/patchExt.js"

chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({url: "dashboard.html"})
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    request.type == "getCWS" && getCWS(sender.tab.url).then(xpi => sendResponse(xpi))
    request.type == "isInstalledCWS" && isInstalledCWS(sender.tab.url).then(bool => sendResponse(bool))
    request.type == "uninstall" && uninstallCWS(sender.tab.url)
    return true
})

chrome.management.onInstalled.addListener(ext => {
    if(ext.id.endsWith("XPIPorter")){
        chrome.tabs.reload()
    }
})

chrome.management.onUninstalled.addListener(ext => {
    if(ext.id.endsWith("XPIPorter")){
        chrome.tabs.reload()
    }
})

async function getCWS(url){
    let id = url.replace(/.*?\/detail(\/.*?)?\/(.*?)(\/|#|\?|$).*/, "$2")
    try {
        return await getAMOAlt(id)
    } catch {
        let crx = await fetch(`https://clients2.google.com/service/update2/crx?response=redirect&prodversion=140&acceptformat=crx3&x=id%3D${id}%26installsource%3Dondemand%26uc`).then(r => r.arrayBuffer())
        return await patchExt(crx, id, "CWS")
    }
}

async function isInstalledCWS(url){
    let id = url.replace(/.*?\/detail(\/.*?)?\/(.*?)(\/|#|\?|$).*/, "$2")
    let allExtensions = await chrome.management.getAll()
    return Boolean(allExtensions.find(ext => ext.id == `${id}@CWS_XPIPorter`))
}

function uninstallCWS(url){
    let id = url.replace(/.*?\/detail(\/.*?)?\/(.*?)(\/|#|\?|$).*/, "$2")
    chrome.runtime.sendMessage(`${id}@CWS_XPIPorter`, {type:"XPIPorterUninstall"})
}

async function getAMOAlt(cwsId){
    let maps = await fetch("https://services.addons.mozilla.org/api/v5/addons/browser-mappings/?browser=chrome").then(j => j.json())
    let firefoxId = maps.results.find(item => item.extension_id == cwsId).addon_guid
    let apiResponse = await fetch(`https://addons.mozilla.org/api/v5/addons/addon/${firefoxId}/`).then(r => r.json())
    return await fetch(apiResponse['current_version']['file']['url']).then(r => r.arrayBuffer())
}
