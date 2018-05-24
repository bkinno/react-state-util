'use strict';


/**
 * Internal memory for keeping global values
 */
let _components = [];  // Components connected to global state
let _globalState = {};  // Keep global state values


/**
 * Create store
 */
export function initGlobalState(initData) {
    _globalState = initData;
};


/**
 * Get all global state value
 */
export function getGlobalState() {
    return _globalState;
};


/**
 * Generate uuid
 */
let uuid = () => {
    let s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
};


/**
 * Scan all connected components and detect which components will be updated
 * when changing state
 *
 * @param newState: new state value
 * @param currentContext: React component object
 * @returns {Promise<void>}
 * @private
 */
let _propagateGlobalState = async function(newState, currentContext) {
    let listenners = _components;
    let globalState = _globalState;

    let updatedAttrs = Object.keys(newState);

    // If value is Promise then we have to wait for having value
    let _update = new Promise(resolve => {
        updatedAttrs.forEach(async (attr) => {
            let newVal = newState[attr];
            if (typeof (newVal) === 'object' && 'then' in newVal) {
                newVal = await newVal;
            }

            currentContext.globalState[attr] = newVal;
            resolve();
        });
    });

    // Wait for all value updated
    await _update;

    // Update only component which listens to updated attr
    listenners.forEach(listennerContext => {
        let shouldUpdate = false;

        updatedAttrs.forEach(attr => {
            if (listennerContext._global.has(attr)) {
                shouldUpdate = true;
            }
        });

        listennerContext._isMounted && shouldUpdate && listennerContext.forceUpdate();
    });
};


/**
 * Set globalState using function setGlobalState
 * @param WrappedComponent
 *
 * In wrapped component: just use this.globalState.varName
 * by get value from globalState, we add watcher automatically to component
 * and component will re-render only when this varName is changed from globalState
 *
 * For changing global state: use this.setGlobalState, everything just work like this.setState
 */
export function connectGlobalState(WrappedComponent) {
    return class ConnectedGlobalState extends WrappedComponent {
        // Do not use array function, use 'function' instead for having 'this' pointing to WrappedComponent
        setGlobalState(newState) {
            _propagateGlobalState(newState, this);
        };

        componentWillMount() {
            let component = this;
            component._uid = WrappedComponent.name + '_' + uuid();

            component._global = new Set();

            component.globalState = new Proxy({}, {
                get: (target, name) => {
                    if (!(name in _globalState)) {
                        console.warn(name + ' has not been declared in globalState. To declare it use: initGlobalState');
                    }

                    component._global.add(name);
                    return _globalState[name];
                },
                set: (target, name, value) => {
                    component._global.add(name);
                    _globalState[name] = value;
                    return true;
                }
            });
            _components.push(component);

            // Call parent lifecycle
            if (super.componentWillMount) {
                super.componentWillMount();
            }

            component._isMounted = true;
        };

        componentWillUnmount() {
            let component = this;
            _components = _components.filter(c => c._uid !== component._uid);

            // Call parent lifecycle
            if (super.componentWillUnmount) {
                super.componentWillUnmount();
            }

            component._isMounted = false;
        }
    };
}
