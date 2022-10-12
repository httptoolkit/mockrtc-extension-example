# MockRTC WebExtension Example

> _Part of [HTTP Toolkit](https://httptoolkit.tech): powerful tools for building, testing & debugging HTTP(S), WebRTC, and more_

This is an example web extension you can use as a base to build your own WebRTC-intercepting web extensions for debugging.

This is a proof-of-concept example to start from, not something you'd immediately use out of the box. To intercept WebRTC using this repo:

* Clone this repo
* `npm install`
* Modify the logic in [background.ts](https://github.com/httptoolkit/mockrtc-extension-example/blob/88344b382d244c04c022ba36ffb62e2cfe412ddc/src/background.ts#L23-L32) to configure MockRTC however you'd like
* Launch the extension
    * You may be able to run `npm start` to launch a MockRTC backend, build the code in this repo into a usable web extension, and open a new Chrome window with that extension temporarily installed.
    * Or this may fail, if you don't have Chrome in your PATH as `google-chrome`, if you're using Windows, if Chrome is already running, or probably in various other cases.
    * As an alternative, you can run `npm run start:backend`, and then install the extension manually in any Chromium-based browser by going to `chrome://extensions/`, enabling developer mode, clicking 'Load unpacked' and then selecting the `public` folder in this repo on your machine.
    * Should also work in Safari & Firefox and anywhere else supporting web extensions, although I haven't tested.
* Test it on the official samples at https://webrtc.github.io/samples/, for example:
    * Go to `chrome://extensions` and click the 'service worker' link on the MockRTC extension open the console for your extension.
    * Open https://webrtc.github.io/samples/src/content/datachannel/messaging/ for a convenient chat demo.
    * Click connect, which will open two MockRTC connections in that one page, connected together.
    * Send a message in either direction - you'll see 'Sent: X' & 'Received: X' (from the two connections) appear in your extension console.

Once you've got the basics working, you can extend the code in `background.ts` to monitor any WebRTC events or define any rules you'd like to do anything you're interested in. If you run into limitations in MockRTC and there's more capabilities you need there, [please open an issue](https://github.com/httptoolkit/mockrtc/issues/new).

---

_This‌ ‌project‌ ‌has‌ ‌received‌ ‌funding‌ ‌from‌ ‌the‌ ‌European‌ ‌Union’s‌ ‌Horizon‌ ‌2020‌‌ research‌ ‌and‌ ‌innovation‌ ‌programme‌ ‌within‌ ‌the‌ ‌framework‌ ‌of‌ ‌the‌ ‌NGI-POINTER‌‌ Project‌ ‌funded‌ ‌under‌ ‌grant‌ ‌agreement‌ ‌No‌ 871528._

![The NGI logo and EU flag](./ngi-eu-footer.png)