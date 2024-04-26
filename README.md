## react-paint

changes:
* Updated some dependencies
* Implemented fill feature/button
* Added white color
* Removed undo history limits (was 9 iirc)
* Using updated react-paint temporary fork(https://github.com/nisetynet/react-paint-test)

How to build?
```bash
make dist
```

You can download and try prebuilt plugin from [here](temp-release/com.mattermost.draw-plugin-0.0.5.tar.gz).

hope this helps
_____________________________________________________________

<h1 align="center">
  <img src="./images/plugin-draw-logo.png" alt="Draw plugin logo" width="200">
  <br/>
  Mattermost Draw Plugin
</h1>

This plugin will allow you to draw direcly in mattermost and upload the result
as an image attachment.

Besides allow you to open local images, edit them and upload.

<p align="center">
  <img src="./images/screenshot.png" alt="Draw plugin example" width="654">
</p>

## Installation

1. Go to the [releases page of this GitHub repository](https://github.com/jespino/mattermost-plugin-draw/releases) and download the latest release for your Mattermost server.
2. Upload this file in the Mattermost **System Console > Plugins > Management** page to install the plugin, and enable it. To learn more about how to upload a plugin, [see the documentation](https://docs.mattermost.com/administration/plugins.html#plugin-uploads).
3. Start using your plugin and have fun.
