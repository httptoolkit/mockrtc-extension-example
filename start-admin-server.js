/*
 * SPDX-FileCopyrightText: 2022 Tim Perry <tim@httptoolkit.tech>
 * SPDX-License-Identifier: Apache-2.0
 */

const mockrtc = require('mockrtc');
mockrtc.getAdminServer().start().then(() => {
    console.log('MockRTC admin server started');
});