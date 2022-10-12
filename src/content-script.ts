/*
 * SPDX-FileCopyrightText: 2022 Tim Perry <tim@httptoolkit.tech>
 * SPDX-License-Identifier: Apache-2.0
 */

import { runtime as extensionRuntime } from 'webextension-polyfill';

// Inject our RTC hook script:
const script = document.createElement('script');
script.src = extensionRuntime.getURL("/build/injected-script.js")
document.documentElement.appendChild(script);

// Simply forwards data from events to the SW (not accessible from the page)
document.addEventListener('htk-extension:sw-message', async (event) => {
    const { id, requestJson } = (event as CustomEvent).detail;
    const request = JSON.parse(requestJson);

    try {
        const response = await extensionRuntime.sendMessage(request);
        document.dispatchEvent(
            new CustomEvent(`htk-extension:sw-response:${id}`, {
                detail: response
            })
        );
    } catch (e) {
        console.error('Failed to forward message:', request, e);
    }
});