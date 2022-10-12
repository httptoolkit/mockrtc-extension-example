/*
 * SPDX-FileCopyrightText: 2022 Tim Perry <tim@httptoolkit.tech>
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
    MockRTCPeer,
    MockRTCSession,
    MockRTCOfferParams,
    MockRTCAnswerParams,
    MockRTCExternalOfferParams,
    MockRTCExternalAnswerParams,
    OfferOptions,
    AnswerOptions
} from 'mockrtc';
import * as hooks from 'mockrtc/dist/webrtc-hooks';

import {
    HTKExtensionRequest,
    HTKExtensionResponse,
    PeerMethodKeys,
    PeerMethodSerializedResult,
    SessionMethodKeys,
    SessionMethodSerializedResult
} from './message-types';

// Not very unique, but both content script (receiver) and us (in the page) live & die together so it's OK.
let nextMessageId = 0;

async function sendRequest(request: HTKExtensionRequest) {
    const requestId = nextMessageId++;
    const event = new CustomEvent('htk-extension:sw-message', {
        detail: {
            id: requestId,
            // In Chrome, if this value contains some non-serializable data, it becomes entirely
            // null when transferred to the content-script, instead of dropping those fields.
            // We manually serialize JSON (which does drop fields) first to avoid that.
            requestJson: JSON.stringify(request)
        }
    });

    document.dispatchEvent(event);

    const response = await new Promise<HTKExtensionResponse>((resolve) => {
        document.addEventListener(`htk-extension:sw-response:${requestId}`, (event) => {
            resolve((event as CustomEvent).detail);
        }, { once: true });
    });

    if (response.type === 'error') {
        throw new Error(response.message);
    } else if (response.type === 'result') {
        return response.result;
    }
}

function sendPeerMethodRequest<M extends PeerMethodKeys>(
    methodName: M,
    args: Parameters<MockRTCPeer[M]>
): Promise<PeerMethodSerializedResult<M>> {
    return sendRequest({
        type: 'peer:method',
        methodName,
        args
    } as HTKExtensionRequest) as unknown as Promise<PeerMethodSerializedResult<M>>;
}

function sendSessionMethodRequest<M extends SessionMethodKeys>(
    sessionId: string,
    methodName: M,
    args: Parameters<MockRTCSession[M]>
): Promise<SessionMethodSerializedResult<M>> {
    return sendRequest({
        type: 'session:method',
        sessionId,
        methodName,
        args
    } as HTKExtensionRequest) as unknown as Promise<SessionMethodSerializedResult<M>>;
}

function buildSession(id: string): MockRTCSession {
    return {
        sessionId: id,
        createOffer: (options?: OfferOptions) =>
            sendSessionMethodRequest(id, 'createOffer', [options]),
        completeOffer: async (answer: RTCSessionDescriptionInit) => {
            await sendSessionMethodRequest(id, 'completeOffer', [answer])
        },
        answerOffer: (offer: RTCSessionDescriptionInit, options?: AnswerOptions) =>
            sendSessionMethodRequest(id, 'answerOffer', [offer, options]),
    }
}

/**
 * A mock RTC peer instance backed by pushMessage to the remote instance that's managed by the
 * extensions background service worker, so that we can use a single peer across all pages:
 */
const mockPeer: MockRTCPeer = {
    async createOffer(options?: OfferOptions): Promise<MockRTCOfferParams> {
        const result = await sendPeerMethodRequest('createOffer', [options]);
        const session = buildSession(result.session.sessionId);
        return {
            offer: result.offer,
            session,
            setAnswer: session.completeOffer.bind(session)
        };
    },

    async answerOffer(offer: RTCSessionDescriptionInit, options?: AnswerOptions): Promise<MockRTCAnswerParams> {
        const result = await sendPeerMethodRequest('answerOffer', [offer, options]);
        const session = buildSession(result.session.sessionId);
        return {
            answer: result.answer,
            session
        };
    },

    async createExternalOffer(options?: OfferOptions): Promise<MockRTCExternalOfferParams> {
        const result = await sendPeerMethodRequest('createExternalOffer', [options]);
        const session = buildSession(result.session.sessionId);
        return {
            id: result.id,
            offer: result.offer,
            session,
            setAnswer: session.completeOffer.bind(session)
        };
    },

    async answerExternalOffer(offer: RTCSessionDescriptionInit, options?: AnswerOptions): Promise<MockRTCExternalAnswerParams> {
        const result = await sendPeerMethodRequest('answerExternalOffer', [offer, options]);
        const session = buildSession(result.session.sessionId);
        return {
            id: result.id,
            answer: result.answer,
            session
        };
    }
} as MockRTCPeer;

// Hook all WebRTC connections in this page:
hooks.hookAllWebRTC(mockPeer); // (This is where the magic happens)