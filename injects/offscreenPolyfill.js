// Chrome Offscreen API Polyfill for Firefox
// This polyfill provides a basic implementation of chrome.offscreen for Firefox compatibility

(function() {
    'use strict';
    
    // Check if chrome.offscreen is not available (Firefox)
    if (typeof chrome !== 'undefined' && chrome.offscreen) {
        return; // Chrome.offscreen is available, no polyfill needed
    }
    
    // Create chrome object if it doesn't exist
    if (typeof chrome === 'undefined') {
        window.chrome = {};
    }
    
    // Offscreen document management
    let offscreenDocument = null;
    let offscreenDocumentId = null;
    let offscreenCallbacks = new Map();
    let callbackId = 0;
    
    // Create a hidden iframe for offscreen document simulation
    function createOffscreenDocument() {
        if (offscreenDocument) {
            return Promise.resolve(offscreenDocumentId);
        }
        
        return new Promise((resolve, reject) => {
            try {
                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                iframe.style.position = 'absolute';
                iframe.style.left = '-9999px';
                iframe.style.top = '-9999px';
                iframe.style.width = '1px';
                iframe.style.height = '1px';
                
                // Create a simple HTML document for the iframe
                const htmlContent = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Offscreen Document</title>
                    </head>
                    <body>
                        <script>
                            // Offscreen document context
                            window.offscreenContext = {
                                ready: true,
                                postMessage: function(message) {
                                    parent.postMessage({
                                        type: 'offscreen_message',
                                        data: message
                                    }, '*');
                                }
                            };
                            
                            // Listen for messages from the main context
                            window.addEventListener('message', function(event) {
                                if (event.data && event.data.type === 'offscreen_command') {
                                    // Handle offscreen commands here
                                    if (event.data.command === 'close') {
                                        window.close();
                                    }
                                }
                            });
                        </script>
                    </body>
                    </html>
                `;
                
                iframe.src = 'data:text/html;base64,' + btoa(htmlContent);
                
                iframe.onload = function() {
                    offscreenDocument = iframe;
                    offscreenDocumentId = 'offscreen_' + Date.now();
                    document.body.appendChild(iframe);
                    resolve(offscreenDocumentId);
                };
                
                iframe.onerror = function() {
                    reject(new Error('Failed to create offscreen document'));
                };
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    // Remove offscreen document
    function removeOffscreenDocument() {
        if (offscreenDocument) {
            try {
                document.body.removeChild(offscreenDocument);
            } catch (e) {
                // Ignore errors when removing
            }
            offscreenDocument = null;
            offscreenDocumentId = null;
        }
    }
    
    // Chrome.offscreen API implementation
    chrome.offscreen = {
        // Reason constants
        Reason: {
            AUDIO_PLAYBACK: 'AUDIO_PLAYBACK',
            CLIPBOARD: 'CLIPBOARD',
            DOM_SCRAPING: 'DOM_SCRAPING',
            DOM_PARSER: 'DOM_PARSER',
            USER_MEDIA: 'USER_MEDIA',
            WEB_RTC: 'WEB_RTC',
            WORKERS: 'WORKERS',
            BLOBS: 'BLOBS',
            DOM_PRINTING: 'DOM_PRINTING',
            LOCAL_STORAGE: 'LOCAL_STORAGE',
            TESTING: 'TESTING'
        },
        
        // Create an offscreen document
        createDocument: function(parameters) {
            return new Promise((resolve, reject) => {
                createOffscreenDocument()
                    .then(docId => {
                        // Simulate the document creation
                        const result = {
                            documentId: docId,
                            reasons: parameters.reasons || ['WORKERS'],
                            justification: parameters.justification || 'Polyfill for Firefox compatibility'
                        };
                        resolve(result);
                    })
                    .catch(reject);
            });
        },
        
        // Close the offscreen document
        closeDocument: function(parameters) {
            return new Promise((resolve) => {
                removeOffscreenDocument();
                resolve();
            });
        },
        
        // Check if offscreen document exists
        hasDocument: function() {
            return Promise.resolve(offscreenDocument !== null);
        },
        
        // Get reasons for offscreen document
        getReasons: function() {
            return Promise.resolve(offscreenDocument ? ['WORKERS'] : []);
        },
        
        // Send message to offscreen document
        sendMessage: function(message) {
            return new Promise((resolve, reject) => {
                if (!offscreenDocument) {
                    reject(new Error('No offscreen document available'));
                    return;
                }
                
                const currentCallbackId = ++callbackId;
                offscreenCallbacks.set(currentCallbackId, { resolve, reject });
                
                // Set timeout for response
                setTimeout(() => {
                    if (offscreenCallbacks.has(currentCallbackId)) {
                        offscreenCallbacks.delete(currentCallbackId);
                        reject(new Error('Offscreen message timeout'));
                    }
                }, 5000);
                
                // Send message to iframe
                offscreenDocument.contentWindow.postMessage({
                    type: 'offscreen_command',
                    command: 'message',
                    data: message,
                    callbackId: currentCallbackId
                }, '*');
            });
        }
    };
    
    // Listen for messages from offscreen document
    window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'offscreen_message') {
            // Handle response from offscreen document
            const callbackId = event.data.callbackId;
            if (callbackId && offscreenCallbacks.has(callbackId)) {
                const callback = offscreenCallbacks.get(callbackId);
                offscreenCallbacks.delete(callbackId);
                callback.resolve(event.data.data);
            }
        }
    });
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', function() {
        removeOffscreenDocument();
    });
    
    console.log('Chrome Offscreen API polyfill loaded for Firefox compatibility');
})();
