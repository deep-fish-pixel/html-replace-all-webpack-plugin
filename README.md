# html-replace-all-webpack-plugin
This support all replace html operates in webpack by string or regexp.


## Install

```
$ npm install --save html-replace-all-webpack-plugin
```


## Usage

##### replace one match

```js
new HtmlReplaceWebpackPlugin({
  matches: [{
    match: /<body>/,
    value: `<body>hello World!`,
  }]
})
```

##### replace two match

```js
new HtmlReplaceWebpackPlugin({
  matches: [{
    matchStart: /<body>/,
    matchEnd: /<\/body>/,
    value: `<body>hello World!</body>`,
  }]
})
```


##### replace object all values by properties

```js
new HtmlReplaceWebpackPlugin({
  matchObjects: [{
    prefix: '${',
    suffix: '}',
    target: {
      title: 'Test matchObject',
      content: 'hello World!'
    }
  }]
})
```

