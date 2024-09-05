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

  const root = makeComponent(function root() {
    this.append(span("Hello world"));
  });
  renderRoot(root());
```

## Docs (WIP)
https://patrolin.github.io/jsgui/

## Commands

### build docs
```
npm i -g typescript
tsc
```
### build docs and watch
```
npm i -g typescript
tsc -w
```
### serve docs
```
python serve.py
```
### build just jsgui.js
```
npm i -g typescript
cd jsgui
tsc
```
