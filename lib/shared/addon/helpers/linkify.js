import { helper } from '@ember/component/helper';
import { htmlSafe } from '@ember/string';
import Ember from 'ember';

const MAX_LENGTH = 1000;

function convertToLink(match) {
  let url;
  let displayUrl = match.trim();

  if (displayUrl.startsWith('https://') ||
    displayUrl.startsWith('http://') ||
    displayUrl.startsWith('//')) {
    url = displayUrl;
  } else {
    url = `//${ displayUrl }`;
  }

  return `<a href="${ url }" target="_blank">${ displayUrl }</a>`
}

export function linkify(params) {
  let content = params[0] || '';

  if ( content.length > MAX_LENGTH ) {
    return content;
  }

  content = Ember.Handlebars.Utils.escapeExpression(content);

  return htmlSafe(content);
}

export default helper(linkify);
