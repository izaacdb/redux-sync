import {useEffect, useRef} from "react";
import {isEqual} from "lodash";

// The default empty state required for generic typing.
type DefaultState = Record<string, never>;

// A type for the callback, which calls your redux dispatch function with state received from the event listener.
type ReduxDispatchCallback<T> = (reduxState: T) => void;

interface ReduxSyncProps<T> {
    // A CustomEvent name for listening to and/or broadcasting your state change. We should have a naming convention for these.
    eventName: string;
    // A callback which calls your redux dispatch function with state received from the event listener.
    reduxDispatchCallback: ReduxDispatchCallback<T>;
    // Your application's redux state, or some part of the redux state. When changed it will trigger a broadcast.
    reduxState: T;
}

/**
 * ReduxSync
 *
 * Synchronizes Redux state across multiple applications using CustomEvents.
 *
 * Usage requirements:
 * - Use exactly one ReduxSync component per event type in each application you want synchronized.
 * - Ensure the Redux state structure is consistent between applications.
 * - You can sync either complete Redux state or specific portions of it.
 *
 * @param {string} eventName - Unique identifier for the CustomEvent to use for syncing
 * @param {object} reduxState - The Redux state (or portion) to synchronize
 * @param {function} reduxDispatchCallback - Callback function that updates Redux when
 *                                          state changes are received from other contexts
 *
 * @example: Synchronizing availability controls between two applications.
 *
 * Application One:
 * -----------------
 * <ReduxSync
 *    eventName="UPDATE_AVAILABILITY_EVENT"
 *    reduxState={props.availabilityControls}
 *    reduxDispatchCallback={(state) =>
 *        dispatch({
 *           type: actions.SET_AVAILABILITY_CONTROLS,
 *           state,
 *        })
 *    }
 * />
 *
 * Application Two:
 * -----------------
 * <ReduxSync
 *    eventName="UPDATE_AVAILABILITY_EVENT"
 *    reduxState={props.availabilityControls}
 *    reduxDispatchCallback={(state) =>
 *        dispatch({
 *           type: actions.SET_AVAILABILITY_CONTROLS,
 *           state,
 *        })
 *    }
 * />
 */
export const ReduxSync = <T extends object = DefaultState>({
   eventName,
   reduxDispatchCallback,
   reduxState,
}: ReduxSyncProps<T>) => {
    const previousReduxState = useRef<T | undefined>(reduxState);

    // Listener
    useEffect(() => {
        return listenForEvent(eventName, reduxDispatchCallback);
    }, [reduxDispatchCallback, eventName]);

    // Broadcaster
    useEffect(() => {
        // If the reduxState was provided and changed this should broadcast the change as a CustomEvent
        if (!isEqual(reduxState, previousReduxState.current)) {
            previousReduxState.current = reduxState;
            broadcastEvent(reduxState, eventName);
        }
    }, [eventName, reduxState]);

    return null;
};

const broadcastEvent = <T extends object>(reduxState: T, eventName: string) => {
    const event = new CustomEvent<T>(eventName, {
        detail: reduxState,
        bubbles: true,
    });
    document.dispatchEvent(event);
};

const listenForEvent = <T extends object>(
    eventName: string,
    dispatchCallback: ReduxDispatchCallback<T>
): (() => void) => {
    const handleEvent = (event: Event) => {
        const customEvent = event as CustomEvent<T>;
        dispatchCallback(customEvent.detail);
    };
    document.addEventListener(eventName, handleEvent);
    return () => {
        document.removeEventListener(eventName, handleEvent);
    };
};
