/*
 * SPDX-FileCopyrightText: 2022 Tim Perry <tim@httptoolkit.tech>
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
    MockRTCPeer, MockRTCSession
} from "mockrtc";

type FunctionKeys<T> = keyof {
    [K in keyof T as T[K] extends Function ? K : never]: unknown
};

type NonFunctionKeys<T> = keyof {
    [K in keyof T as T[K] extends Function ? never : K]: unknown
};

type Unpromised<P> = P extends Promise<infer R> ? R : P;

export type PeerMethodKeys = FunctionKeys<MockRTCPeer>;

// When serializing a response, we lose the non-serializable values, e.g. functions.
export type PeerMethodSerializedResult<M extends PeerMethodKeys> = {
    [K in NonFunctionKeys<Unpromised<ReturnType<MockRTCPeer[M]>>>]:
        Unpromised<ReturnType<MockRTCPeer[M]>>[K];
};

export interface PeerCallRequest<M extends PeerMethodKeys> {
    type: `peer:method`;
    methodName: M;
    args: Parameters<MockRTCPeer[M]>;
}

export interface PeerCallResponse<M extends PeerMethodKeys> {
    type: 'result';
    result: PeerMethodSerializedResult<M>;
}

export type SessionMethodKeys = FunctionKeys<MockRTCSession>;

// When serializing a response, we lose the non-serializable values, e.g. functions.
export type SessionMethodSerializedResult<M extends SessionMethodKeys> = {
    [K in NonFunctionKeys<Unpromised<ReturnType<MockRTCSession[M]>>>]:
        Unpromised<ReturnType<MockRTCSession[M]>>[K];
};

export interface SessionCallRequest<M extends SessionMethodKeys> {
    type: `session:method`;
    sessionId: string;
    methodName: M;
    args: Parameters<MockRTCSession[M]>;
}

export interface SessionCallResponse<M extends SessionMethodKeys> {
    type: 'result';
    result: SessionMethodSerializedResult<M>;
}

export type HTKExtensionRequest =
    | PeerCallRequest<'createOffer'>
    | PeerCallRequest<'answerOffer'>
    | PeerCallRequest<'createExternalOffer'>
    | PeerCallRequest<'answerExternalOffer'>
    | SessionCallRequest<'createOffer'>
    | SessionCallRequest<'completeOffer'>
    | SessionCallRequest<'answerOffer'>;

export type HTKExtensionResponse =
    | { type: 'error', message: string }
    | PeerCallResponse<'createOffer'>
    | PeerCallResponse<'answerOffer'>
    | PeerCallResponse<'createExternalOffer'>
    | PeerCallResponse<'answerExternalOffer'>
    | SessionCallResponse<'createOffer'>
    | SessionCallResponse<'completeOffer'>
    | SessionCallResponse<'answerOffer'>;