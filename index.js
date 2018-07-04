var invariant = require('invariant'),
  assignDeepAll = require('assign-deep-all'),
  assignDeep = assignDeepAll.assignDeep;
/*
* replace html content in all operations
*
* */
function HtmlReplaceWebpackPlugin(options) {
  options = options || {};
  this.options = options;
  var matches = options.matches,
    matchObjects = options.matchObjects;
  process.env.NODE_ENV !== 'production'
  && invariant(matches || matchObjects, 'options must have matches or matchObject!');
  if(matches){
    matches.forEach(function (item) {
      var match = item.match;
      if(match){
        match = getRegExp(item.match);
      }
      else if(!isRegExp(item.matchStart) && !getRegExp(item.matchEnd)){
        match = new RegExp(`${item.matchStart}([\\s\\S]*)${item.matchEnd}`, 'gm');
      }
      Object.assign(item, {
        match: match,
        matchStart: match ? null: getRegExp(item.matchStart),
        matchEnd: match ? null: getRegExp(item.matchEnd),
        matchTimeLimit: getPositiveInteger(item.matchTimeLimit),
        handle: item.handle || function (value) {return value},
        value: item.value || '',
      });

      //merge matchStart and matchEnd into match regExp
      if(!match && item.matchStart && item.matchEnd){
        item.match = mergeRegExps(item.matchStart, item.matchEnd);
      }
    });
  }

  if(matchObjects){
    matchObjects.forEach(function (matchObject) {
      Object.assign(matchObject, {
        prefix: matchObject.prefix || '',
        suffix: matchObject.suffix || '',
        handle: matchObject.handle || function (value) {return value},
        target: matchObject.target,
        matchTimeLimit: getPositiveInteger(matchObject.matchTimeLimit),
      });
    });
  }
}

HtmlReplaceWebpackPlugin.prototype.replace = function (matchOption, html) {
  var matchTimeLimit = matchOption.matchTimeLimit;
  if(matchOption.match){
    html = html.replace(matchOption.match, function (result) {
      if(matchTimeLimit-- > 0){
        return matchOption.handle(matchOption.value, result, matchOption);
      }
      else{
        return result;
      }
    });
  }
  return html;
}

HtmlReplaceWebpackPlugin.prototype.handleMatches = function (matches, html) {
  //替换处理
  const self = this;
  return matches ? matches.reduce(function (html, match) {
    return self.replace(match, html);
  }, html) : html;
}

HtmlReplaceWebpackPlugin.prototype.handleMatchObjects = function (matchObjects, html) {
  //替换处理
  const self = this;
  return matchObjects ? matchObjects.reduce(function (html, matchObject) {
    var matches = [],
      target = matchObject.target,
      prefix = matchObject.prefix,
      suffix = matchObject.suffix,
      matchTimeLimit = matchObject.matchTimeLimit,
      handle = matchObject.handle;
    for(var key in target){
      matches.push({
        match: `${prefix}${key}${suffix}`,
        matchTimeLimit: matchTimeLimit,
        handle: handle,
        value: target[key],
        key: key,
      });
    }
    return self.handleMatches(matches, html);
  }, html) : html;
}

HtmlReplaceWebpackPlugin.prototype.handle = function (html) {
  const options = this.options,
    matches = options.matches,
    matchObjects = options.matchObjects;
  html = this.handleMatches(matches, html);
  html = this.handleMatchObjects(matchObjects, html);
  return html;
}

HtmlReplaceWebpackPlugin.prototype.apply = function (compiler) {
  compiler.plugin('compilation', (compilation) => {
    compilation.plugin('html-webpack-plugin-after-html-processing', (htmlPluginData, callback) => {
      htmlPluginData.html = this.handle(htmlPluginData.html);
      callback(null, htmlPluginData);
    });
  });
};

function isRegExp (value) {
  return value instanceof RegExp;
}

function getRegExp (match) {
  return match ? isRegExp(match) ? match : new RegExp(`${match}`, 'gm') : null;
}

function getMatchLimit (regExp) {
  return !regExp || regExp.global ? Infinity : 1;
}

function getPositiveInteger(matchTimeLimit) {
  return matchTimeLimit <= 0 ? 0 :  matchTimeLimit || Infinity
}

function mergeRegExps() {
  var regExps = Array.prototype.slice.apply(arguments);

  return new RegExp(regExps.reduce(function (source, regExp) {
    var regSource = regExp.source;
    if(regExp.ignoreCase){
      regSource = regSource.toLowerCase().replace(/[a-z]/g, function (result) {
        return `(${result}|${result.toUpperCase()})`
      });
    }
    if(source){
      return `${source}([\\s\\S]*)${regSource}`;
    }
    else{
      return `${regSource}`
    }
  }, ''), 'gm');
}

module.exports = HtmlReplaceWebpackPlugin;
