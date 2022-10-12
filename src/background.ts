/*
 * SPDX-FileCopyrightText: 2022 Tim Perry <tim@httptoolkit.tech>
 * SPDX-License-Identifier: Apache-2.0
 */

console.clear();

import * as webextension from 'webextension-polyfill';
import * as MockRTC from 'mockrtc';
import {
    HTKExtensionRequest,
    HTKExtensionResponse,
    PeerCallRequest,
    PeerMethodKeys,
    SessionCallRequest,
    SessionMethodKeys
} from './message-types';

// Create a MockRTC session, which will be shared between all pages:
const mockRTCSession = MockRTC.getLocal();
const mockPeerPromise = mockRTCSession.start().then(() => {

    // *** Configure your MockRTC setup here: ***

    mockRTCSession.on('data-channel-message-sent', ({ content }) => console.log(`Sent: ${content}`));
    mockRTCSession.on('data-channel-message-received', ({ content }) => console.log(`Received: ${content}`));

    // Return the peer that will handle all hooked traffic:
    return mockRTCSession.buildPeer()
        .thenPassThrough(); // Proxy traffic transparently, doing nothing

    /// *** --- ***

});

// Inject the hooks into every page, and connect them to this session:
webextension.scripting.unregisterContentScripts().then(async () => {
    await webextension.scripting.registerContentScripts([
        {
            id: 'rtc-content-script',
            matches: ['<all_urls>'],
            persistAcrossSessions: false,
            allFrames: true,
            js: ['build/content-script.js']
        }
    ]);
});

async function runPeerMethod<M extends PeerMethodKeys>(
    request: PeerCallRequest<M>
): Promise<ReturnType<MockRTC.MockRTCPeer[M]>> {
    const { methodName, args } = request;
    const peer = await mockPeerPromise;

    return await (peer[methodName] as any).apply(peer, args);
}

async function runSessionMethod<M extends SessionMethodKeys>(
    request: SessionCallRequest<M>
): Promise<ReturnType<MockRTC.MockRTCSession[M]>> {
    const { sessionId, methodName, args } = request;
    const peer = await mockPeerPromise;
    const session = peer.getSession(sessionId);
    return await (session[methodName] as any).apply(session, args);
}

webextension.runtime.onMessage.addListener(((
    message: HTKExtensionRequest,
    _sender: any,
    sendMessage: (msg: HTKExtensionResponse) => void
) => {
    (async () => {
        try {
            switch (message.type) {
                case 'peer:method':
                    const peerResult = await runPeerMethod(message);

                    // We strip the session to just the id, to avoid exposing the adminClient
                    // or any other unnecessary details. Not good to share the mock session id
                    // with pages as with that malicious pages could actively reconfigure it!
                    (peerResult as any).session = { sessionId: peerResult.session.sessionId }
                    delete (peerResult as any).setAnswer;

                    return {
                        type: 'result',
                        result: peerResult
                    } as const;
                case 'session:method':
                    const sessionResult = (await runSessionMethod(message))!;
                    return {
                        type: 'result',
                        result: sessionResult
                    } as const;
            }
        } catch (e: any) {
            console.warn(e);
            return { type: 'error', message: e.message ?? e } as const;
        }
    })().then((result) => {
        sendMessage(result);
    });

    // In Firefox, we could just return the above as a promise here and we'd be golden.
    // Unfortunately that doesn't work in Chrome, so instead we have to use sendMessage and
    // return true here to allow async responses:
    return true;
}) as any);
