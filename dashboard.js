import {patchExt} from  "/patchExt.js"

document.getElementById("file").addEventListener("change", async () => {
    let patchedExt = await patchExt(file.files[0], null, "Manual")

    installResult(patchedExt)
})

let installedAddons = await chrome.management.getAll().then(ext => ext.filter(ext => ext.id.endsWith("_CRXInstaller")))
for(let ext of installedAddons) {
    const escapeStr = t => new Option(t).innerHTML

    let source = ext.id.match(/(?<=@).*?(?=_)/)[0]
    let latestVersion = await queryLatest(source, ext.id)
    let needsUpdate = latestVersion && latestVersion !== ext.version
    
    document.getElementById("installed").insertAdjacentHTML("beforeend", `
        <tr>
            <td>${escapeStr(ext.name)}</td>
            <td>${escapeStr(ext.version)}</td>
            <td>${escapeStr(latestVersion || 'Unknown')}</td>
            <td>${escapeStr(source)}</td>
            <td>
                ${needsUpdate ? 
                    `<button class="update-btn" data-ext-id="${ext.id}" data-source="${source}">
                        Update to ${latestVersion}
                    </button>` : 
                    '<span class="up-to-date">Up to date</span>'
                }
            </td>
        </tr>
    `)
}

document.addEventListener('click', event => {
    if (event.target.classList.contains('update-btn')) {
        const extId = event.target.dataset.extId
        const source = event.target.dataset.source
        updateExtension(extId, source)
    }
})

function installResult(ab){
    let blobLink = URL.createObjectURL(new Blob([ab], {type: "application/x-xpinstall"}))
    location.href = blobLink

    let debugElm = document.createElement("a")
    debugElm.download = "debug.xpi"
    debugElm.href = blobLink
    console.log("%c Debugging Information of CRX Installer", "font-size: large")
    console.log("If you need generated xpi for debugging, store following object as global variable and run `temp0.click()`:")
    console.log(debugElm)
}

async function queryLatest(source, extId){
    if(source == "CWS"){
        let id = extId.match(/.*?(?=@)/)
        let apiRes = await fetch(`https://clients2.google.com/service/update2/crx?prodversion=140&acceptformat=crx3&x=id%3D${id}%26installsource%3Dondemand%26uc`).then(res => res.text())
        return new DOMParser().parseFromString(apiRes,"text/xml").querySelector("updatecheck").getAttribute("version")
    }
    return undefined
}

async function updateExtension(extId, source) {
    let id = extId.split("@")[0]
    if(source == "CWS"){
        let crx = await fetch(`https://clients2.google.com/service/update2/crx?response=redirect&prodversion=140&acceptformat=crx3&x=id%3D${id}%26installsource%3Dondemand%26uc`).then(r => r.arrayBuffer())
        let xpi =await patchExt(crx, id, source)
        installResult(xpi)
    }
}
