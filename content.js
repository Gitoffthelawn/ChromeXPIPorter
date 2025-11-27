function showSpinner(container){
    container.innerHTML = `<div jscontroller="qUYJve" data-progressvalue="0" class="XDoBEd-JGcpL-MkD1Ye kqmIdb" style="--progress-value: 0;"><div role="progressbar" jsname="LbNpof" class="XDoBEd-JGcpL-P1ekSe XDoBEd-JGcpL-P1ekSe-OWXEXe-A9y3zc" aria-label="Processing item install"><div class="XDoBEd-JGcpL-lMrXfd"><svg xmlns="http://www.w3.org/2000/svg" jsname="AAGWEe" class="XDoBEd-JGcpL-lLvYUc-Bd00G"><circle jsname="u014N" class="XDoBEd-JGcpL-BEcm3d"></circle><circle jsname="vS4zxc" class="XDoBEd-JGcpL-oLOYtf-uDEFge"></circle></svg></div></div></div>`
}

function hideSpinner(container){
    container.innerHTML = `<div class="VfPpkd-dgl2Hf-ppHlrf-sM5MNb" data-is-touch-wrapper="true"><button class="UywwFc-LgbsSe UywwFc-LgbsSe-OWXEXe-dgl2Hf UywwFc-GqqPG-wdeprb-FoKg4d-dgl2Hf-ppHlrf"><span jsname="V67aGc" class="UywwFc-vQzf8d">Add to Firefox</span></button></div>`
    container.querySelector("Button").addEventListener("click", () => installFromCWS(container))
}

async function installFromCWS(container){
    await checkIfMainContainer()
    showSpinner(container)
    let xpi = await chrome.runtime.sendMessage({type:"getCWS"})
    let blobLink = URL.createObjectURL(new Blob([xpi], {type: "application/x-xpinstall"}))
    
    // Check if "Download without installing directly" is enabled
    const settings = await chrome.storage.local.get(['downloadWithoutInstalling'])
    const downloadDirectly = settings.downloadWithoutInstalling || false
    
    if (downloadDirectly) {
        // Download directly without showing installation popup
        const downloadLink = document.createElement("a")
        downloadLink.download = "extension.xpi"
        downloadLink.href = blobLink
        downloadLink.style.display = "none"
        document.body.appendChild(downloadLink)
        downloadLink.click()
        document.body.removeChild(downloadLink)
    } else {
        // Show installation popup (default behavior)
        location.href = blobLink
    }

    let debugElm = document.createElement("a")
    debugElm.download = "debug.xpi"
    debugElm.href = blobLink
    console.log("%c Debugging Information of CRX Installer", "font-size: large")
    console.log("If you need generated xpi for debugging, store following object as global variable and run `temp0.click()`:")
    console.log(debugElm)

    hideSpinner(container)
}

function hideChromeAds() {
    const style = document.createElement('style')
    style.textContent = `
        div.xX710b.XtdnDc,
        div[aria-labelledby=promo-header] {
            display: none !important;
        }
    `
    document.head.appendChild(style)
}

async function checkIfMainContainer(){
    let isMainContainer = await chrome.runtime.sendMessage({type:"checkContainer"})
    if(!isMainContainer){
        alert("Installation may fails within the container.\nPlease open without container!")
    }
}

async function main(container, target){
    container.XPIPorter = true
    hideChromeAds()
    let isInstalled  = await chrome.runtime.sendMessage({type:"isInstalledCWS"})
    target.disabled = false
    if(!isInstalled){
        target.querySelector("span.UywwFc-vQzf8d").innerHTML = "Add to Firefox"
        target.addEventListener("click", () => installFromCWS(container))
    } else {
        target.querySelector("span.UywwFc-vQzf8d").innerHTML = "Remove from Firefox"
        target.addEventListener("click", () => chrome.runtime.sendMessage({type:"uninstall"}))
    }
}

setInterval(() => {
    let containers = Array.from(document.querySelectorAll(".OdjmDb")).filter(container => container.XPIPorter != true)
    containers.forEach(container =>{
        let target = container.querySelector(".UywwFc-LgbsSe")
        target && main(container, target)
    })
}, 100)
