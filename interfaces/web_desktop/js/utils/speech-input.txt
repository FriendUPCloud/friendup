speech-input
============

Simple speech input for `<input>` elements — replaces deprecated `x-webkit-speech` attribute

## Use:

1. Include **speech-input.css** and **speech-input.js**
2. Add an `si-input` class to your input field. 
3. Wrap the input in a `<div>` with an `si-wrapper` class.
4. Add a button with an `si-btn` class as a sibling to the input. For the default style use the button markup in the example below:

```html
<div class="si-wrapper">
    <input type="text" class="si-input" placeholder="What's up?">
    <button class="si-btn">
        speech input
        <span class="si-mic"></span>
        <span class="si-holder"></span>
    </button>
</div>
```

And you're done! Here's a demo:

[![speech-input demo][1]][2]

## FAQ

### Why does it keep asking me to allow the microphone?
To have the microphone permissions persist, use https: http://stackoverflow.com/a/15999940/552067

### I clicked the mic button but it didn't do anything.
Make sure you're using it on an actual server — it won't work on a `file://` URL. Try [starting up a simple static HTTP server](https://gist.github.com/willurd/5720255).

### [Can I use](http://caniuse.com/#feat=web-speech) this in non-webkit browsers?
Not yet.

## [License (MIT)](http://hug.mit-license.org/)


[1]: http://f.cl.ly/items/3m0n2Q0y0h1a0N2P2s0Y/screenshot-by-nimbus.png
[2]: http://daniel-hug.github.io/speech-input/
