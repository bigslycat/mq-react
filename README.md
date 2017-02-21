# mq-react

The media queries for your React components. Flow-compatible.

## Install

```sh
npm install --save mq-react
```

## Usage

### Example code

```javascript
import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import mqDecorate from 'mq-react';

const TestComponent = props => <pre>{JSON.stringify(props, null, '  ')}</pre>;
TestComponent.defaultProps = { mq: undefined };

const Decorated = mqDecorate(TestComponent);

class App extends Component {
  static childContextTypes = {
    mq: PropTypes.objectOf(PropTypes.string),
  };

  /**
   * You can use the context for define app defaults
   */
  getChildContext() {
    return { mq: { isDesktop: '(min-width: 1024px)' } };
  }

  render() {
    return this.props.children;
  }
}

window.addEventListener('DOMContentLoaded', () =>
  ReactDOM.render(
    /**
     * Also you can use the props
     */
    <App>
      <Decorated mq={{ isMobile: '(max-width: 1023px)' }} />
    </App>,
    document.getElementById('app-root'),
  ),
);
```

### Render result

```html
<pre>{
  "mq": {
    "isDesktop": "(min-width: 1024px)",
    "isMobile": "(max-width: 1023px)"
  },
  "isDesktop": true, <!-- true if window width >= 1024px -->
  "isMobile": false  <!-- true if window width < 1024px -->
}</pre>
```
