// @flow

/* eslint-env node, jest */
/* eslint import/no-extraneous-dependencies: off */

import React from 'react';
import { mount } from 'enzyme';
import matchMediaPolyfill from 'mq-polyfill';
import type { ContextType } from 'mq-polyfill/lib/types.js.flow';

import mqDecorate from './MQComponent';

jest.useFakeTimers();

const defaultConfig = {
  isMobile: 'screen and (max-width: 767px)',
  isTablet: 'screen and (min-width: 768px) and (max-width: 1023px)',
  isDesktop: 'screen and (min-width: 1024px)',
};

type ExpectionType = ({
  isMobile?: boolean,
  isTablet?: boolean,
  isDesktop?: boolean,
  mq?: typeof defaultConfig,
}) => {
  isMobile: boolean,
  isTablet: boolean,
  isDesktop: boolean,
  mq: typeof defaultConfig,
};

const getResExpection: ExpectionType = ({
  isMobile = false,
  isTablet = false,
  isDesktop = false,
  mq = defaultConfig,
} = {}) => ({
  isMobile,
  isTablet,
  isDesktop,
  mq,
});

type TestComponentPropsType = {
  mq?: { isMobile: string, isDesktop: string },
  isMobile: boolean, isDesktop: boolean,
};

const TestComponent = (props: TestComponentPropsType) =>
  <div>{JSON.stringify(props)}</div>;

TestComponent.defaultProps = { mq: undefined };

declare var window: ContextType;

matchMediaPolyfill(window);

const initial = {
  isMobile: '(max-width: 919px)',
  isDesktop: '(min-width: 920px)',
};

const cteateMockedComponent = () => {
  const Decorated = mqDecorate(TestComponent);

  // $FlowIgnoreMock
  Object.assign(
    Decorated.prototype, {
      setState: jest.fn(Decorated.prototype.setState),
      componentDidMount: jest.fn(Decorated.prototype.componentDidMount),
      render: jest.fn(Decorated.prototype.render),

      subscribe: jest.fn(Decorated.prototype.subscribe),
    },
  );

  return Decorated;
};

function resizeTo(width: number, height: number) {
  Object.assign(window, {
    innerWidth: width,
    innerHeight: height,
    // $FlowDefined
  }).dispatchEvent(new window.Event('resize'));
}

const resizeWidth = (wigth: number, isRunTimers = true) => {
  resizeTo(wigth, window.innerHeight);
  if (isRunTimers) jest.runAllTimers();
};

describe('mqDecorate()', () => {
  it('Have the default config with "isMobile", "isTablet" and "isDesktop" breakpoints', () => {
    resizeWidth(1024);

    const Decorated = cteateMockedComponent();
    const component = mount(<Decorated />);

    expect(component.find(TestComponent).props())
      .toEqual(getResExpection({ isDesktop: true }));

    resizeWidth(1023);
    expect(component.find(TestComponent).props())
      .toEqual(getResExpection({ isTablet: true }));

    resizeWidth(768);
    expect(component.find(TestComponent).props())
      .toEqual(getResExpection({ isTablet: true }));

    resizeWidth(767);
    expect(component.find(TestComponent).props())
      .toEqual(getResExpection({ isMobile: true }));

    resizeWidth(480);
    expect(component.find(TestComponent).props())
      .toEqual(getResExpection({ isMobile: true }));
  });


  it('Breakpoints can be defined in context', () => {
    resizeWidth(920);

    const Decorated = cteateMockedComponent();
    const component = mount(<Decorated />, { context: { mq: initial } });

    expect(component.find(TestComponent).props())
      .toEqual({ isMobile: false, isDesktop: true, mq: initial });

    resizeWidth(919);
    expect(component.find(TestComponent).props())
      .toEqual({ isMobile: true, isDesktop: false, mq: initial });
  });

  it('Breakpoints can be defined in props', () => {
    resizeWidth(920);

    const Decorated = cteateMockedComponent();
    const component = mount(<Decorated mq={initial} />);

    expect(component.find(TestComponent).props())
      .toEqual({ isMobile: false, isDesktop: true, mq: initial });

    resizeWidth(919);
    expect(component.find(TestComponent).props())
      .toEqual({ isMobile: true, isDesktop: false, mq: initial });
  });


  it('Changes of breakpoints is debounces', () => {
    resizeWidth(920);

    const Decorated = cteateMockedComponent();
    const component = mount(<Decorated mq={initial} />);

    const { setState, render } = Decorated.prototype;

    expect(component.find(TestComponent).props())
      .toEqual({ isMobile: false, isDesktop: true, mq: initial });

    resizeWidth(919, false);
    resizeWidth(920, false);
    resizeWidth(919);

    expect(setState).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalledTimes(2);

    expect(component.find(TestComponent).props())
      .toEqual({ isMobile: true, isDesktop: false, mq: initial });
  });
});
