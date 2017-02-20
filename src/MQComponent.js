// @flow

import React, { Component, PropTypes, Element } from 'react';

declare class MediaQueryList {
  addListener(listener: MQListenerType): void,
  removeListener(listener: MQListenerType): void,
  matches: boolean,
  media: string,
}

export type MediaQueryListClassType = typeof MediaQueryList;

type MatchMediaType = (mq: string) => MediaQueryList;

declare var matchMedia: MatchMediaType;

declare var window: {
  MediaQueryList: MediaQueryList,
  matchMedia: MatchMediaType,
};

type MQListenerType = (mq: MediaQueryList) => void;

type RulesType = { [key: string]: string };
type ObjectsType = { [key: string]: MediaQueryList };
type MatchesType = { [key: string]: boolean };
type StateType = { mq: MatchesType };

type PropsType = { mq?: RulesType };

// eslint-disable-next-line flowtype/no-weak-types
type AnyPropsType = {[key: string]: any };
// eslint-disable-next-line flowtype/no-weak-types
type StatelessType = (props: AnyPropsType, context: AnyPropsType) => Element<any>;
type ChildrenType = Class<Component<*, *, *>> | StatelessType;
type SetMQStateRequestsType = Map<Component<*, *, *>, {
  timer?: number,
  matches: MatchesType,
}>;

const defaultConfig: RulesType = {
  isMobile: 'screen and (max-width: 767px)',
  isTablet: 'screen and (min-width: 768px) and (max-width: 1023px)',
  isDesktop: 'screen and (min-width: 1024px)',
};

const setStateRequests: SetMQStateRequestsType = new Map();

const decorate = (ChildrenComponent: ChildrenType) =>
  class MQComponent extends Component<PropsType, PropsType, StateType> {
    state: StateType;
    context: PropsType;

    static contextTypes = {
      mq: PropTypes.objectOf(PropTypes.string),
    };

    static defaultProps = {
      mq: undefined,
    };

    static objectsReduser(scope, [mqName, mq]): ObjectsType {
      return typeof mq === 'string' ? {
        ...scope, [mqName]: window.matchMedia(mq),
      } : {};
    }

    static matchesReduser(scope, [mqName, mqObject]): MatchesType {
      return mqObject instanceof window.MediaQueryList ? {
        ...scope, [mqName]: (mqObject: MediaQueryList).matches,
      } : {};
    }

    listenersCleaners: Array<() => void> = [];

    constructor(props: PropsType, context: PropsType) {
      super(props, context);

      this.state = { mq: this.mqMatches };
      this.stateDebounceHandler = this.stateDebounceHandler.bind(this);
    }

    get mqRules(): RulesType {
      return (
        this.context.mq ||
        this.props.mq ? {
          ...this.context.mq || {},
          ...this.props.mq || {},
        } : defaultConfig
      );
    }

    get mqObjects(): ObjectsType {
      return Object.entries(this.mqRules)
        .reduce(this.constructor.objectsReduser, {});
    }

    get mqMatches(): MatchesType {
      return Object.entries(this.mqObjects)
        .reduce(this.constructor.matchesReduser, {});
    }

    stateDebounceHandler: () => void;

    stateDebounceHandler() {
      const request = setStateRequests.get(this);

      if (!request) return;

      this.setState({ mq: {
        ...this.state.mq,
        ...request.matches,
      } });
    }

    createListener(mqName: string): MQListenerType {
      return ({ matches }) => {
        const request = setStateRequests.get(this) || { matches: {} };

        if (!setStateRequests.has(this)) setStateRequests.set(this, request);
        if (request.timer) clearTimeout(request.timer);

        Object.assign(request, {
          matches: { ...request.matches, [mqName]: matches },
          timer: setTimeout(this.stateDebounceHandler, 100),
        });
      };
    }

    subscribe(mqName: string, mqObject: MediaQueryList) {
      const listener = this.createListener(mqName);
      mqObject.addListener(listener);
      this.listenersCleaners.push(() => mqObject.removeListener(listener));
    }

    componentDidMount() {
      Object.entries(this.mqObjects)
        .forEach(
          ([mqName, mqObject]) =>
            mqObject instanceof window.MediaQueryList &&
              this.subscribe(mqName, (mqObject: MediaQueryList)),
        );
    }

    cleanListeners() {
      this.listenersCleaners.forEach(cleaner => cleaner());
    }

    componentWillUnmount() {
      this.cleanListeners();
      setStateRequests.delete(this);
    }

    render() {
      return (
        <ChildrenComponent
          {...this.props}
          {...this.state.mq}
          mq={this.mqRules}
        />
      );
    }
  };

export default decorate;
