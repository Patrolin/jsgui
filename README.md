# jsgui
A faster replacement for React.

## Usage

index.html
```html
<head>
  <link rel="stylesheet" href="jsgui.css" />
  <script src="jsgui.js"></script>
  <script src="app.js"></script>
</head>
```
app.js
```js
  const root = makeComponent(function root() {
    this.append(span("Hello world"));
  });
  renderRoot(root());
```

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
