(function () {
  'use strict';

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function");
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        writable: true,
        configurable: true
      }
    });
    if (superClass) _setPrototypeOf(subClass, superClass);
  }

  function _getPrototypeOf(o) {
    _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
      return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _getPrototypeOf(o);
  }

  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };

    return _setPrototypeOf(o, p);
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  function _possibleConstructorReturn(self, call) {
    if (call && (typeof call === "object" || typeof call === "function")) {
      return call;
    }

    return _assertThisInitialized(self);
  }

  function _taggedTemplateLiteral(strings, raw) {
    if (!raw) {
      raw = strings.slice(0);
    }

    return Object.freeze(Object.defineProperties(strings, {
      raw: {
        value: Object.freeze(raw)
      }
    }));
  }

  /**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   */
  // The first argument to JS template tags retain identity across multiple
  // calls to a tag for the same literal, so we can cache work done per literal
  // in a Map.
  const templateCaches = new Map();
  /**
   * The return type of `html`, which holds a Template and the values from
   * interpolated expressions.
   */
  class TemplateResult {
      constructor(strings, values, type, partCallback = defaultPartCallback) {
          this.strings = strings;
          this.values = values;
          this.type = type;
          this.partCallback = partCallback;
      }
      /**
       * Returns a string of HTML used to create a <template> element.
       */
      getHTML() {
          const l = this.strings.length - 1;
          let html = '';
          let isTextBinding = true;
          for (let i = 0; i < l; i++) {
              const s = this.strings[i];
              html += s;
              // We're in a text position if the previous string closed its tags.
              // If it doesn't have any tags, then we use the previous text position
              // state.
              const closing = findTagClose(s);
              isTextBinding = closing > -1 ? closing < s.length : isTextBinding;
              html += isTextBinding ? nodeMarker : marker;
          }
          html += this.strings[l];
          return html;
      }
      getTemplateElement() {
          const template = document.createElement('template');
          template.innerHTML = this.getHTML();
          return template;
      }
  }
  /**
   * An expression marker with embedded unique key to avoid collision with
   * possible text in templates.
   */
  const marker = `{{lit-${String(Math.random()).slice(2)}}}`;
  /**
   * An expression marker used text-positions, not attribute positions,
   * in template.
   */
  const nodeMarker = `<!--${marker}-->`;
  const markerRegex = new RegExp(`${marker}|${nodeMarker}`);
  /**
   * This regex extracts the attribute name preceding an attribute-position
   * expression. It does this by matching the syntax allowed for attributes
   * against the string literal directly preceding the expression, assuming that
   * the expression is in an attribute-value position.
   *
   * See attributes in the HTML spec:
   * https://www.w3.org/TR/html5/syntax.html#attributes-0
   *
   * "\0-\x1F\x7F-\x9F" are Unicode control characters
   *
   * " \x09\x0a\x0c\x0d" are HTML space characters:
   * https://www.w3.org/TR/html5/infrastructure.html#space-character
   *
   * So an attribute is:
   *  * The name: any character except a control character, space character, ('),
   *    ("), ">", "=", or "/"
   *  * Followed by zero or more space characters
   *  * Followed by "="
   *  * Followed by zero or more space characters
   *  * Followed by:
   *    * Any character except space, ('), ("), "<", ">", "=", (`), or
   *    * (") then any non-("), or
   *    * (') then any non-(')
   */
  const lastAttributeNameRegex = /[ \x09\x0a\x0c\x0d]([^\0-\x1F\x7F-\x9F \x09\x0a\x0c\x0d"'>=/]+)[ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*)$/;
  /**
   * Finds the closing index of the last closed HTML tag.
   * This has 3 possible return values:
   *   - `-1`, meaning there is no tag in str.
   *   - `string.length`, meaning the last opened tag is unclosed.
   *   - Some positive number < str.length, meaning the index of the closing '>'.
   */
  function findTagClose(str) {
      const close = str.lastIndexOf('>');
      const open = str.indexOf('<', close + 1);
      return open > -1 ? str.length : close;
  }
  /**
   * A placeholder for a dynamic expression in an HTML template.
   *
   * There are two built-in part types: AttributePart and NodePart. NodeParts
   * always represent a single dynamic expression, while AttributeParts may
   * represent as many expressions are contained in the attribute.
   *
   * A Template's parts are mutable, so parts can be replaced or modified
   * (possibly to implement different template semantics). The contract is that
   * parts can only be replaced, not removed, added or reordered, and parts must
   * always consume the correct number of values in their `update()` method.
   *
   * TODO(justinfagnani): That requirement is a little fragile. A
   * TemplateInstance could instead be more careful about which values it gives
   * to Part.update().
   */
  class TemplatePart {
      constructor(type, index, name, rawName, strings) {
          this.type = type;
          this.index = index;
          this.name = name;
          this.rawName = rawName;
          this.strings = strings;
      }
  }
  const isTemplatePartActive = (part) => part.index !== -1;
  /**
   * An updateable Template that tracks the location of dynamic parts.
   */
  class Template {
      constructor(result, element) {
          this.parts = [];
          this.element = element;
          const content = this.element.content;
          // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be null
          const walker = document.createTreeWalker(content, 133 /* NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT |
                 NodeFilter.SHOW_TEXT */, null, false);
          let index = -1;
          let partIndex = 0;
          const nodesToRemove = [];
          // The actual previous node, accounting for removals: if a node is removed
          // it will never be the previousNode.
          let previousNode;
          // Used to set previousNode at the top of the loop.
          let currentNode;
          while (walker.nextNode()) {
              index++;
              previousNode = currentNode;
              const node = currentNode = walker.currentNode;
              if (node.nodeType === 1 /* Node.ELEMENT_NODE */) {
                  if (!node.hasAttributes()) {
                      continue;
                  }
                  const attributes = node.attributes;
                  // Per https://developer.mozilla.org/en-US/docs/Web/API/NamedNodeMap,
                  // attributes are not guaranteed to be returned in document order. In
                  // particular, Edge/IE can return them out of order, so we cannot assume
                  // a correspondance between part index and attribute index.
                  let count = 0;
                  for (let i = 0; i < attributes.length; i++) {
                      if (attributes[i].value.indexOf(marker) >= 0) {
                          count++;
                      }
                  }
                  while (count-- > 0) {
                      // Get the template literal section leading up to the first
                      // expression in this attribute
                      const stringForPart = result.strings[partIndex];
                      // Find the attribute name
                      const attributeNameInPart = lastAttributeNameRegex.exec(stringForPart)[1];
                      // Find the corresponding attribute
                      // TODO(justinfagnani): remove non-null assertion
                      const attribute = attributes.getNamedItem(attributeNameInPart);
                      const stringsForAttributeValue = attribute.value.split(markerRegex);
                      this.parts.push(new TemplatePart('attribute', index, attribute.name, attributeNameInPart, stringsForAttributeValue));
                      node.removeAttribute(attribute.name);
                      partIndex += stringsForAttributeValue.length - 1;
                  }
              }
              else if (node.nodeType === 3 /* Node.TEXT_NODE */) {
                  const nodeValue = node.nodeValue;
                  if (nodeValue.indexOf(marker) < 0) {
                      continue;
                  }
                  const parent = node.parentNode;
                  const strings = nodeValue.split(markerRegex);
                  const lastIndex = strings.length - 1;
                  // We have a part for each match found
                  partIndex += lastIndex;
                  // Generate a new text node for each literal section
                  // These nodes are also used as the markers for node parts
                  for (let i = 0; i < lastIndex; i++) {
                      parent.insertBefore((strings[i] === '')
                          ? document.createComment('')
                          : document.createTextNode(strings[i]), node);
                      this.parts.push(new TemplatePart('node', index++));
                  }
                  parent.insertBefore(strings[lastIndex] === '' ?
                      document.createComment('') :
                      document.createTextNode(strings[lastIndex]), node);
                  nodesToRemove.push(node);
              }
              else if (node.nodeType === 8 /* Node.COMMENT_NODE */ &&
                  node.nodeValue === marker) {
                  const parent = node.parentNode;
                  // Add a new marker node to be the startNode of the Part if any of the
                  // following are true:
                  //  * We don't have a previousSibling
                  //  * previousSibling is being removed (thus it's not the
                  //    `previousNode`)
                  //  * previousSibling is not a Text node
                  //
                  // TODO(justinfagnani): We should be able to use the previousNode here
                  // as the marker node and reduce the number of extra nodes we add to a
                  // template. See https://github.com/PolymerLabs/lit-html/issues/147
                  const previousSibling = node.previousSibling;
                  if (previousSibling === null || previousSibling !== previousNode ||
                      previousSibling.nodeType !== Node.TEXT_NODE) {
                      parent.insertBefore(document.createComment(''), node);
                  }
                  else {
                      index--;
                  }
                  this.parts.push(new TemplatePart('node', index++));
                  nodesToRemove.push(node);
                  // If we don't have a nextSibling add a marker node.
                  // We don't have to check if the next node is going to be removed,
                  // because that node will induce a new marker if so.
                  if (node.nextSibling === null) {
                      parent.insertBefore(document.createComment(''), node);
                  }
                  else {
                      index--;
                  }
                  currentNode = previousNode;
                  partIndex++;
              }
          }
          // Remove text binding nodes after the walk to not disturb the TreeWalker
          for (const n of nodesToRemove) {
              n.parentNode.removeChild(n);
          }
      }
  }
  /**
   * Returns a value ready to be inserted into a Part from a user-provided value.
   *
   * If the user value is a directive, this invokes the directive with the given
   * part. If the value is null, it's converted to undefined to work better
   * with certain DOM APIs, like textContent.
   */
  const getValue = (part, value) => {
      // `null` as the value of a Text node will render the string 'null'
      // so we convert it to undefined
      if (isDirective(value)) {
          value = value(part);
          return noChange;
      }
      return value === null ? undefined : value;
  };
  const isDirective = (o) => typeof o === 'function' && o.__litDirective === true;
  /**
   * A sentinel value that signals that a value was handled by a directive and
   * should not be written to the DOM.
   */
  const noChange = {};
  const isPrimitiveValue = (value) => value === null ||
      !(typeof value === 'object' || typeof value === 'function');
  class AttributePart {
      constructor(instance, element, name, strings) {
          this.instance = instance;
          this.element = element;
          this.name = name;
          this.strings = strings;
          this.size = strings.length - 1;
          this._previousValues = [];
      }
      _interpolate(values, startIndex) {
          const strings = this.strings;
          const l = strings.length - 1;
          let text = '';
          for (let i = 0; i < l; i++) {
              text += strings[i];
              const v = getValue(this, values[startIndex + i]);
              if (v && v !== noChange &&
                  (Array.isArray(v) || typeof v !== 'string' && v[Symbol.iterator])) {
                  for (const t of v) {
                      // TODO: we need to recursively call getValue into iterables...
                      text += t;
                  }
              }
              else {
                  text += v;
              }
          }
          return text + strings[l];
      }
      _equalToPreviousValues(values, startIndex) {
          for (let i = startIndex; i < startIndex + this.size; i++) {
              if (this._previousValues[i] !== values[i] ||
                  !isPrimitiveValue(values[i])) {
                  return false;
              }
          }
          return true;
      }
      setValue(values, startIndex) {
          if (this._equalToPreviousValues(values, startIndex)) {
              return;
          }
          const s = this.strings;
          let value;
          if (s.length === 2 && s[0] === '' && s[1] === '') {
              // An expression that occupies the whole attribute value will leave
              // leading and trailing empty strings.
              value = getValue(this, values[startIndex]);
              if (Array.isArray(value)) {
                  value = value.join('');
              }
          }
          else {
              value = this._interpolate(values, startIndex);
          }
          if (value !== noChange) {
              this.element.setAttribute(this.name, value);
          }
          this._previousValues = values;
      }
  }
  class NodePart {
      constructor(instance, startNode, endNode) {
          this.instance = instance;
          this.startNode = startNode;
          this.endNode = endNode;
          this._previousValue = undefined;
      }
      setValue(value) {
          value = getValue(this, value);
          if (value === noChange) {
              return;
          }
          if (isPrimitiveValue(value)) {
              // Handle primitive values
              // If the value didn't change, do nothing
              if (value === this._previousValue) {
                  return;
              }
              this._setText(value);
          }
          else if (value instanceof TemplateResult) {
              this._setTemplateResult(value);
          }
          else if (Array.isArray(value) || value[Symbol.iterator]) {
              this._setIterable(value);
          }
          else if (value instanceof Node) {
              this._setNode(value);
          }
          else if (value.then !== undefined) {
              this._setPromise(value);
          }
          else {
              // Fallback, will render the string representation
              this._setText(value);
          }
      }
      _insert(node) {
          this.endNode.parentNode.insertBefore(node, this.endNode);
      }
      _setNode(value) {
          if (this._previousValue === value) {
              return;
          }
          this.clear();
          this._insert(value);
          this._previousValue = value;
      }
      _setText(value) {
          const node = this.startNode.nextSibling;
          value = value === undefined ? '' : value;
          if (node === this.endNode.previousSibling &&
              node.nodeType === Node.TEXT_NODE) {
              // If we only have a single text node between the markers, we can just
              // set its value, rather than replacing it.
              // TODO(justinfagnani): Can we just check if _previousValue is
              // primitive?
              node.textContent = value;
          }
          else {
              this._setNode(document.createTextNode(value));
          }
          this._previousValue = value;
      }
      _setTemplateResult(value) {
          const template = this.instance._getTemplate(value);
          let instance;
          if (this._previousValue && this._previousValue.template === template) {
              instance = this._previousValue;
          }
          else {
              instance = new TemplateInstance(template, this.instance._partCallback, this.instance._getTemplate);
              this._setNode(instance._clone());
              this._previousValue = instance;
          }
          instance.update(value.values);
      }
      _setIterable(value) {
          // For an Iterable, we create a new InstancePart per item, then set its
          // value to the item. This is a little bit of overhead for every item in
          // an Iterable, but it lets us recurse easily and efficiently update Arrays
          // of TemplateResults that will be commonly returned from expressions like:
          // array.map((i) => html`${i}`), by reusing existing TemplateInstances.
          // If _previousValue is an array, then the previous render was of an
          // iterable and _previousValue will contain the NodeParts from the previous
          // render. If _previousValue is not an array, clear this part and make a new
          // array for NodeParts.
          if (!Array.isArray(this._previousValue)) {
              this.clear();
              this._previousValue = [];
          }
          // Lets us keep track of how many items we stamped so we can clear leftover
          // items from a previous render
          const itemParts = this._previousValue;
          let partIndex = 0;
          for (const item of value) {
              // Try to reuse an existing part
              let itemPart = itemParts[partIndex];
              // If no existing part, create a new one
              if (itemPart === undefined) {
                  // If we're creating the first item part, it's startNode should be the
                  // container's startNode
                  let itemStart = this.startNode;
                  // If we're not creating the first part, create a new separator marker
                  // node, and fix up the previous part's endNode to point to it
                  if (partIndex > 0) {
                      const previousPart = itemParts[partIndex - 1];
                      itemStart = previousPart.endNode = document.createTextNode('');
                      this._insert(itemStart);
                  }
                  itemPart = new NodePart(this.instance, itemStart, this.endNode);
                  itemParts.push(itemPart);
              }
              itemPart.setValue(item);
              partIndex++;
          }
          if (partIndex === 0) {
              this.clear();
              this._previousValue = undefined;
          }
          else if (partIndex < itemParts.length) {
              const lastPart = itemParts[partIndex - 1];
              // Truncate the parts array so _previousValue reflects the current state
              itemParts.length = partIndex;
              this.clear(lastPart.endNode.previousSibling);
              lastPart.endNode = this.endNode;
          }
      }
      _setPromise(value) {
          this._previousValue = value;
          value.then((v) => {
              if (this._previousValue === value) {
                  this.setValue(v);
              }
          });
      }
      clear(startNode = this.startNode) {
          removeNodes(this.startNode.parentNode, startNode.nextSibling, this.endNode);
      }
  }
  const defaultPartCallback = (instance, templatePart, node) => {
      if (templatePart.type === 'attribute') {
          return new AttributePart(instance, node, templatePart.name, templatePart.strings);
      }
      else if (templatePart.type === 'node') {
          return new NodePart(instance, node, node.nextSibling);
      }
      throw new Error(`Unknown part type ${templatePart.type}`);
  };
  /**
   * An instance of a `Template` that can be attached to the DOM and updated
   * with new values.
   */
  class TemplateInstance {
      constructor(template, partCallback, getTemplate) {
          this._parts = [];
          this.template = template;
          this._partCallback = partCallback;
          this._getTemplate = getTemplate;
      }
      update(values) {
          let valueIndex = 0;
          for (const part of this._parts) {
              if (!part) {
                  valueIndex++;
              }
              else if (part.size === undefined) {
                  part.setValue(values[valueIndex]);
                  valueIndex++;
              }
              else {
                  part.setValue(values, valueIndex);
                  valueIndex += part.size;
              }
          }
      }
      _clone() {
          // Clone the node, rather than importing it, to keep the fragment in the
          // template's document. This leaves the fragment inert so custom elements
          // won't upgrade until after the main document adopts the node.
          const fragment = this.template.element.content.cloneNode(true);
          const parts = this.template.parts;
          if (parts.length > 0) {
              // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be
              // null
              const walker = document.createTreeWalker(fragment, 133 /* NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT |
                     NodeFilter.SHOW_TEXT */, null, false);
              let index = -1;
              for (let i = 0; i < parts.length; i++) {
                  const part = parts[i];
                  const partActive = isTemplatePartActive(part);
                  // An inactive part has no coresponding Template node.
                  if (partActive) {
                      while (index < part.index) {
                          index++;
                          walker.nextNode();
                      }
                  }
                  this._parts.push(partActive ? this._partCallback(this, part, walker.currentNode) : undefined);
              }
          }
          return fragment;
      }
  }
  /**
   * Removes nodes, starting from `startNode` (inclusive) to `endNode`
   * (exclusive), from `container`.
   */
  const removeNodes = (container, startNode, endNode = null) => {
      let node = startNode;
      while (node !== endNode) {
          const n = node.nextSibling;
          container.removeChild(node);
          node = n;
      }
  };

  /**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   */
  const walkerNodeFilter = NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT |
      NodeFilter.SHOW_TEXT;
  /**
   * Removes the list of nodes from a Template safely. In addition to removing
   * nodes from the Template, the Template part indices are updated to match
   * the mutated Template DOM.
   *
   * As the template is walked the removal state is tracked and
   * part indices are adjusted as needed.
   *
   * div
   *   div#1 (remove) <-- start removing (removing node is div#1)
   *     div
   *       div#2 (remove)  <-- continue removing (removing node is still div#1)
   *         div
   * div <-- stop removing since previous sibling is the removing node (div#1, removed 4 nodes)
   */
  function removeNodesFromTemplate(template, nodesToRemove) {
      const { element: { content }, parts } = template;
      const walker = document.createTreeWalker(content, walkerNodeFilter, null, false);
      let partIndex = 0;
      let part = parts[0];
      let nodeIndex = -1;
      let removeCount = 0;
      const nodesToRemoveInTemplate = [];
      let currentRemovingNode = null;
      while (walker.nextNode()) {
          nodeIndex++;
          const node = walker.currentNode;
          // End removal if stepped past the removing node
          if (node.previousSibling === currentRemovingNode) {
              currentRemovingNode = null;
          }
          // A node to remove was found in the template
          if (nodesToRemove.has(node)) {
              nodesToRemoveInTemplate.push(node);
              // Track node we're removing
              if (currentRemovingNode === null) {
                  currentRemovingNode = node;
              }
          }
          // When removing, increment count by which to adjust subsequent part indices
          if (currentRemovingNode !== null) {
              removeCount++;
          }
          while (part !== undefined && part.index === nodeIndex) {
              // If part is in a removed node deactivate it by setting index to -1 or
              // adjust the index as needed.
              part.index = currentRemovingNode !== null ? -1 : part.index - removeCount;
              part = parts[++partIndex];
          }
      }
      nodesToRemoveInTemplate.forEach((n) => n.parentNode.removeChild(n));
  }
  const countNodes = (node) => {
      let count = 1;
      const walker = document.createTreeWalker(node, walkerNodeFilter, null, false);
      while (walker.nextNode()) {
          count++;
      }
      return count;
  };
  const nextActiveIndexInTemplateParts = (parts, startIndex = -1) => {
      for (let i = startIndex + 1; i < parts.length; i++) {
          const part = parts[i];
          if (isTemplatePartActive(part)) {
              return i;
          }
      }
      return -1;
  };
  /**
   * Inserts the given node into the Template, optionally before the given
   * refNode. In addition to inserting the node into the Template, the Template
   * part indices are updated to match the mutated Template DOM.
   */
  function insertNodeIntoTemplate(template, node, refNode = null) {
      const { element: { content }, parts } = template;
      // If there's no refNode, then put node at end of template.
      // No part indices need to be shifted in this case.
      if (refNode === null || refNode === undefined) {
          content.appendChild(node);
          return;
      }
      const walker = document.createTreeWalker(content, walkerNodeFilter, null, false);
      let partIndex = nextActiveIndexInTemplateParts(parts);
      let insertCount = 0;
      let walkerIndex = -1;
      while (walker.nextNode()) {
          walkerIndex++;
          const walkerNode = walker.currentNode;
          if (walkerNode === refNode) {
              refNode.parentNode.insertBefore(node, refNode);
              insertCount = countNodes(node);
          }
          while (partIndex !== -1 && parts[partIndex].index === walkerIndex) {
              // If we've inserted the node, simply adjust all subsequent parts
              if (insertCount > 0) {
                  while (partIndex !== -1) {
                      parts[partIndex].index += insertCount;
                      partIndex = nextActiveIndexInTemplateParts(parts, partIndex);
                  }
                  return;
              }
              partIndex = nextActiveIndexInTemplateParts(parts, partIndex);
          }
      }
  }

  /**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   */
  // Get a key to lookup in `templateCaches`.
  const getTemplateCacheKey = (type, scopeName) => `${type}--${scopeName}`;
  /**
   * Template factory which scopes template DOM using ShadyCSS.
   * @param scopeName {string}
   */
  const shadyTemplateFactory = (scopeName) => (result) => {
      const cacheKey = getTemplateCacheKey(result.type, scopeName);
      let templateCache = templateCaches.get(cacheKey);
      if (templateCache === undefined) {
          templateCache = new Map();
          templateCaches.set(cacheKey, templateCache);
      }
      let template = templateCache.get(result.strings);
      if (template === undefined) {
          const element = result.getTemplateElement();
          if (typeof window.ShadyCSS === 'object') {
              window.ShadyCSS.prepareTemplateDom(element, scopeName);
          }
          template = new Template(result, element);
          templateCache.set(result.strings, template);
      }
      return template;
  };
  const TEMPLATE_TYPES = ['html', 'svg'];
  /**
   * Removes all style elements from Templates for the given scopeName.
   */
  function removeStylesFromLitTemplates(scopeName) {
      TEMPLATE_TYPES.forEach((type) => {
          const templates = templateCaches.get(getTemplateCacheKey(type, scopeName));
          if (templates !== undefined) {
              templates.forEach((template) => {
                  const { element: { content } } = template;
                  const styles = content.querySelectorAll('style');
                  removeNodesFromTemplate(template, new Set(Array.from(styles)));
              });
          }
      });
  }
  const shadyRenderSet = new Set();
  /**
   * For the given scope name, ensures that ShadyCSS style scoping is performed.
   * This is done just once per scope name so the fragment and template cannot
   * be modified.
   * (1) extracts styles from the rendered fragment and hands them to ShadyCSS
   * to be scoped and appended to the document
   * (2) removes style elements from all lit-html Templates for this scope name.
   *
   * Note, <style> elements can only be placed into templates for the
   * initial rendering of the scope. If <style> elements are included in templates
   * dynamically rendered to the scope (after the first scope render), they will
   * not be scoped and the <style> will be left in the template and rendered output.
   */
  const ensureStylesScoped = (fragment, template, scopeName) => {
      // only scope element template once per scope name
      if (!shadyRenderSet.has(scopeName)) {
          shadyRenderSet.add(scopeName);
          const styleTemplate = document.createElement('template');
          Array.from(fragment.querySelectorAll('style')).forEach((s) => {
              styleTemplate.content.appendChild(s);
          });
          window.ShadyCSS.prepareTemplateStyles(styleTemplate, scopeName);
          // Fix templates: note the expectation here is that the given `fragment`
          // has been generated from the given `template` which contains
          // the set of templates rendered into this scope.
          // It is only from this set of initial templates from which styles
          // will be scoped and removed.
          removeStylesFromLitTemplates(scopeName);
          // ApplyShim case
          if (window.ShadyCSS.nativeShadow) {
              const style = styleTemplate.content.querySelector('style');
              if (style !== null) {
                  // Insert style into rendered fragment
                  fragment.insertBefore(style, fragment.firstChild);
                  // Insert into lit-template (for subsequent renders)
                  insertNodeIntoTemplate(template, style.cloneNode(true), template.element.content.firstChild);
              }
          }
      }
  };
  // NOTE: We're copying code from lit-html's `render` method here.
  // We're doing this explicitly because the API for rendering templates is likely
  // to change in the near term.
  function render$1(result, container, scopeName) {
      const templateFactory = shadyTemplateFactory(scopeName);
      const template = templateFactory(result);
      let instance = container.__templateInstance;
      // Repeat render, just call update()
      if (instance !== undefined && instance.template === template &&
          instance._partCallback === result.partCallback) {
          instance.update(result.values);
          return;
      }
      // First render, create a new TemplateInstance and append it
      instance =
          new TemplateInstance(template, result.partCallback, templateFactory);
      container.__templateInstance = instance;
      const fragment = instance._clone();
      instance.update(result.values);
      const host = container instanceof ShadowRoot ?
          container.host :
          undefined;
      // If there's a shadow host, do ShadyCSS scoping...
      if (host !== undefined && typeof window.ShadyCSS === 'object') {
          ensureStylesScoped(fragment, template, scopeName);
          window.ShadyCSS.styleElement(host);
      }
      removeNodes(container, container.firstChild);
      container.appendChild(fragment);
  }

  /**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   */
  /**
   * Interprets a template literal as a lit-extended HTML template.
   */
  const html$1 = (strings, ...values) => new TemplateResult(strings, values, 'html', extendedPartCallback);
  /**
   * A PartCallback which allows templates to set properties and declarative
   * event handlers.
   *
   * Properties are set by default, instead of attributes. Attribute names in
   * lit-html templates preserve case, so properties are case sensitive. If an
   * expression takes up an entire attribute value, then the property is set to
   * that value. If an expression is interpolated with a string or other
   * expressions then the property is set to the string result of the
   * interpolation.
   *
   * To set an attribute instead of a property, append a `$` suffix to the
   * attribute name.
   *
   * Example:
   *
   *     html`<button class$="primary">Buy Now</button>`
   *
   * To set an event handler, prefix the attribute name with `on-`:
   *
   * Example:
   *
   *     html`<button on-click=${(e)=> this.onClickHandler(e)}>Buy Now</button>`
   *
   */
  const extendedPartCallback = (instance, templatePart, node) => {
      if (templatePart.type === 'attribute') {
          if (templatePart.rawName.substr(0, 3) === 'on-') {
              const eventName = templatePart.rawName.slice(3);
              return new EventPart(instance, node, eventName);
          }
          const lastChar = templatePart.name.substr(templatePart.name.length - 1);
          if (lastChar === '$') {
              const name = templatePart.name.slice(0, -1);
              return new AttributePart(instance, node, name, templatePart.strings);
          }
          if (lastChar === '?') {
              const name = templatePart.name.slice(0, -1);
              return new BooleanAttributePart(instance, node, name, templatePart.strings);
          }
          return new PropertyPart(instance, node, templatePart.rawName, templatePart.strings);
      }
      return defaultPartCallback(instance, templatePart, node);
  };
  /**
   * Implements a boolean attribute, roughly as defined in the HTML
   * specification.
   *
   * If the value is truthy, then the attribute is present with a value of
   * ''. If the value is falsey, the attribute is removed.
   */
  class BooleanAttributePart extends AttributePart {
      setValue(values, startIndex) {
          const s = this.strings;
          if (s.length === 2 && s[0] === '' && s[1] === '') {
              const value = getValue(this, values[startIndex]);
              if (value === noChange) {
                  return;
              }
              if (value) {
                  this.element.setAttribute(this.name, '');
              }
              else {
                  this.element.removeAttribute(this.name);
              }
          }
          else {
              throw new Error('boolean attributes can only contain a single expression');
          }
      }
  }
  class PropertyPart extends AttributePart {
      setValue(values, startIndex) {
          const s = this.strings;
          let value;
          if (this._equalToPreviousValues(values, startIndex)) {
              return;
          }
          if (s.length === 2 && s[0] === '' && s[1] === '') {
              // An expression that occupies the whole attribute value will leave
              // leading and trailing empty strings.
              value = getValue(this, values[startIndex]);
          }
          else {
              // Interpolation, so interpolate
              value = this._interpolate(values, startIndex);
          }
          if (value !== noChange) {
              this.element[this.name] = value;
          }
          this._previousValues = values;
      }
  }
  class EventPart {
      constructor(instance, element, eventName) {
          this.instance = instance;
          this.element = element;
          this.eventName = eventName;
      }
      setValue(value) {
          const listener = getValue(this, value);
          if (listener === this._listener) {
              return;
          }
          if (listener == null) {
              this.element.removeEventListener(this.eventName, this);
          }
          else if (this._listener == null) {
              this.element.addEventListener(this.eventName, this);
          }
          this._listener = listener;
      }
      handleEvent(event) {
          if (typeof this._listener === 'function') {
              this._listener.call(this.element, event);
          }
          else if (typeof this._listener.handleEvent === 'function') {
              this._listener.handleEvent(event);
          }
      }
  }

  /**
   * @license
   * MIT License
   *
   * Copyright (c) 2017 Goffert van Gool
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in all
   * copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
   * SOFTWARE.
   */

  // Key to store the HTML tag in a custom element class
  const TAG = Symbol('tag');

  // Key to store render status in a custom element instance
  const NEEDSRENDER = Symbol('needsRender');

  // Transforms a camelCased string into a kebab-cased string
  const camelToKebab = camel => camel.replace(/([a-z](?=[A-Z]))|([A-Z](?=[A-Z][a-z]))/g, '$1$2-').toLowerCase();

  // Creates an ID cache in the `$` property of a custom element instance
  const createIdCache = element => {
    element.$ = {};
    element.shadowRoot.querySelectorAll('[id]').forEach(node => {
      element.$[node.id] = node;
    });
  };

  /**
   * A lightweight base class for custom elements
   *
   * Features:
   *
   *  - Determines an appropriate HTML tagname based on an element's class name
   *  - Efficient rendering engine using lit-html (https://github.com/Polymer/lit-html)
   *  - Creates a cache for descendant nodes with an `id` in the `$` property
   */
  class GluonElement extends HTMLElement {
    /**
     * Returns the HTML tagname for elements of this class
     *
     * It defaults to the kebab-cased version of the class name. To override,
     * defined a `static get is()` property on your custom element class, and return
     * whatever string you want to use for the HTML tagname
     */
    static get is() {
      return (this.hasOwnProperty(TAG) && this[TAG]) || (this[TAG] = camelToKebab(this.name));
    }

    /**
     * Called when an element is connected to the DOM
     *
     * When an element has a `template`, attach a shadowRoot to the element,
     * and render the template. Once the template is rendered, creates an ID cache
     * in the `$` property
     *
     * When adding a `connectedCallback` to your custom element, you should call
     * `super.connectedCallback()` before doing anything other than actions
     * that alter the result of the template rendering.
     */
    connectedCallback() {
      if ('template' in this) {
        this.attachShadow({ mode: 'open' });
        this.render({ sync: true });
        createIdCache(this);
      }
    }

    /**
     * Renders the template for this element into the shadowRoot
     *
     * @param { sync }: perform a synchronous (blocking) render. The default render
     *     is asynchronous, and multiple calls to `render()` are batched by default
     *
     * @returns a Promise that resolves once template has been rendered
     */
    async render({ sync = false } = {}) {
      this[NEEDSRENDER] = true;
      if (!sync) {
        await 0;
      }
      if (this[NEEDSRENDER]) {
        this[NEEDSRENDER] = false;
        render$1(this.template, this.shadowRoot, this.constructor.is);
      }
    }
  }

  function _templateObject() {
    var data = _taggedTemplateLiteral(["<div>GluonJS is working!</div>"]);

    _templateObject = function _templateObject() {
      return data;
    };

    return data;
  }

  var GluonjsTemplate =
  /*#__PURE__*/
  function (_GluonElement) {
    _inherits(GluonjsTemplate, _GluonElement);

    function GluonjsTemplate() {
      _classCallCheck(this, GluonjsTemplate);

      return _possibleConstructorReturn(this, _getPrototypeOf(GluonjsTemplate).apply(this, arguments));
    }

    _createClass(GluonjsTemplate, [{
      key: "template",
      get: function get() {
        return html$1(_templateObject());
      }
    }], [{
      key: "is",
      get: function get() {
        return 'gluonjs-template';
      }
    }]);

    return GluonjsTemplate;
  }(GluonElement);

  customElements.define(GluonjsTemplate.is, GluonjsTemplate);

}());
//# sourceMappingURL=gluonjs-template.es5.js.map
