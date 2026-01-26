# jsgui
A faster replacement for React.

## Usage

index.html
```html
<head>
  <link rel="stylesheet" href="jsgui.css" />
  <script type="module" src="app.mjs"></script>
</head>
```
app.mjs
```js
  import { makeComponent, renderRoot, span } from "jsgui.mjs";

  const root = makeComponent("root", function() {
    this.append(span("Hello world"));
  });
  renderRoot(root());
```

## Docs (WIP)
https://patrolin.github.io/jsgui/

## Commands

### build jsgui and docs
```
odin run tscompiler
```
### serve docs
```
python serve.py
```
